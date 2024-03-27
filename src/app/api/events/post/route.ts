import {NextRequest, NextResponse} from "next/server";
import {EventData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodNumber, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient} from "pg";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";
import {getTimeMs} from "@/utils/utils";

const tokenScheme: ZodString = z.string().length(36)
const nameScheme: ZodString = z.string().min(1).max(50)
const descriptionScheme: ZodString = z.string().max(1000)
const participantsScheme: ZodArray<ZodString> = z.string().min(1).array().min(1)
const voteEndingTimeScheme: ZodNumber = z.number().min(10000000)
const voteOptionsScheme: ZodArray<ZodNumber> = z.number().min(10000000).array().min(1)


export async function POST(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/events/post')
        const tokenReq = cookies().get('token')
        console.log(tokenReq)

        const token: SafeParseReturnType<boolean, string> = tokenScheme.safeParse(tokenReq?.value)

        if (!token.success) {
            return Response.json({
                ok: false,
                where: 'token',
                message: 'You are not authorized'
            }, {
                status: 401
            })
        }

        let eventData: EventData = await req.json()

        const eventname: SafeParseReturnType<string, string> = nameScheme.safeParse(eventData.eventname)
        const description: SafeParseReturnType<string, string> = descriptionScheme.safeParse(eventData.description)
        const participants: SafeParseReturnType<string[], string[]> = participantsScheme.safeParse(eventData.participants)
        const voteEndingTime: SafeParseReturnType<number, number> = voteEndingTimeScheme.safeParse(eventData.voteEndingTime)
        const voteOptions: SafeParseReturnType<number[], number[]> = voteOptionsScheme.safeParse(eventData.voteOptions)

        if (!eventname.success) {
            return Response.json({
                ok: false,
                where: 'eventname',
                message: JSON.parse(eventname.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!description.success) {
            return Response.json({
                ok: false,
                where: 'description',
                message: JSON.parse(description.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!participants.success) {
            return Response.json({
                ok: false,
                where: 'participants',
                message: JSON.parse(participants.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!voteEndingTime.success) {
            return Response.json({
                ok: false,
                where: 'voteEndingTime',
                message: 'Ending date or time is not valid'
            }, {
                status: 400
            })
        }

        if (voteEndingTime.data < getTimeMs()) {
            return Response.json({
                ok: false,
                where: 'voteEndingTime',
                message: 'Voting already ended'
            }, {
                status: 400
            })
        }

        if (!voteOptions.success) {
            return Response.json({
                ok: false,
                where: 'voteOptions',
                message: 'Some vote options are not valid'
            }, {
                status: 400
            })
        }

        for (let i: number = 0; i < voteOptions.data.length; i++) {
            if (voteOptions.data[i] < voteEndingTime.data) {
                return Response.json({
                    ok: false,
                    where: 'voteEndingTime',
                    message: 'The event voting ends later than it might happen'
                }, {
                    status: 400
                })
            }
            if (voteOptions.data[i] < getTimeMs()) {
                return Response.json({
                    ok: false,
                    where: 'voteEndingTime',
                    message: 'Event cannot happen in the past'
                }, {
                    status: 400
                })
            }
        }

        await client.query('BEGIN')

        if (!await auth(client, token.data)) {
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'token',
                message: 'You are not authorized'
            }, {
                status: 401
            })
        }

        // post event
        const postEventQuery: string = 'insert into events values (DEFAULT, $1, $2, $3, DEFAULT)'
        await client.query(postEventQuery, [eventname.data, (description.data !== null && !description.data) ? description.data : null, voteEndingTime.data])

        // add participants
        const addParticipantsQuery: string = 'insert into event_participants values (DEFAULT, (select id from users where username = $1), (select max(id) from events))'
        for (let i: number = 0; i < participants.data.length; i++)
            await client.query(addParticipantsQuery, [participants.data[i]])

        // add current user
        const addThisUserAsParticipantQuery: string = 'insert into event_participants values (DEFAULT, (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $1 and expires_on>$2), (select max(id) from events))'
        await client.query(addThisUserAsParticipantQuery, [token.data, getTimeMs()])

        // add vote options
        const voteOptionsQuery: string = 'insert into event_terms values (DEFAULT, $1, (select max(id) from events))'
        for (let i: number = 0; i < voteOptions.data.length; i++)
            await client.query(voteOptionsQuery, [voteOptions.data[i]])

        // add current user to event admins
        const addToAdminsQuery: string = 'insert into event_admins values (DEFAULT, (DEFAULT, (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $1 and expires_on>$2), (select max(id) from events)))'
        await client.query(addToAdminsQuery, [token.data, getTimeMs()])

        await client.query('COMMIT')
        client.release()

        return Response.json('', {
            status: 200,
        })
    } catch (e) {
        console.log(e)
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}