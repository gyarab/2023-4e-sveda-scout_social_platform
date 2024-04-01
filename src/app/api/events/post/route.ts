import {NextRequest} from "next/server";
import {
    descriptionScheme,
    EventData,
    nameScheme,
    participantsScheme,
    tokenScheme,
    voteEndingTimeScheme, voteOptionsScheme
} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodNumber, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";
import {createEventId, getTimeMs} from "@/utils/utils";

export async function POST(req: NextRequest) {
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

        // get max id from events table
        const getNewIdQuery: string = 'select max(id) from events'
        const getNewIdResult: QueryResult = await client.query(getNewIdQuery)
        let max: number = (getNewIdResult.rows[0].max === null) ? 1 : Number.parseInt(getNewIdResult.rows[0].max)
        console.log('Got max id')

        console.log(eventname.data, max)
        const eventId: string = createEventId(eventname.data, max)
        console.log(eventId)

        // post event
        const postEventQuery: string = 'insert into events values (DEFAULT, $1, $2, $3, $4, DEFAULT)'
        await client.query(postEventQuery, [eventId, eventname.data, (description.data !== null && description.data !== '' && description.data !== undefined) ? description.data : null, voteEndingTime.data])
        console.log('Event posted')

        // add participants
        const addParticipantsQuery: string = 'insert into event_participants values (DEFAULT, (select id from users where username = $1), (select max(id) from events))'
        for (let i: number = 0; i < participants.data.length; i++)
            await client.query(addParticipantsQuery, [participants.data[i]])

        // add current user
        const addThisUserAsParticipantQuery: string = 'insert into event_participants values (DEFAULT, (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $1 and expires_on>$2), (select max(id) from events))'
        await client.query(addThisUserAsParticipantQuery, [token.data, getTimeMs()])
        console.log('Added participants')

        // add vote options
        const voteOptionsQuery: string = 'insert into event_terms values (DEFAULT, $1, (select max(id) from events))'
        for (let i: number = 0; i < voteOptions.data.length; i++)
            await client.query(voteOptionsQuery, [voteOptions.data[i]])
        console.log('Added vote options')

        // add current user to event admins
        const addToAdminsQuery: string = 'insert into event_admins values (DEFAULT, (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $1 and expires_on>$2), (select max(id) from events))'
        await client.query(addToAdminsQuery, [token.data, getTimeMs()])
        console.log('Set event admin')

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