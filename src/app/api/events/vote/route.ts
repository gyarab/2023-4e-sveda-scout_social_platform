import {NextRequest} from "next/server";
import {EventDataDisplay, roomOrEventIdScheme, timeScheme, tokenScheme, voteScheme} from "@/utils/interfaces";
import {SafeParseReturnType} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";
import {getTimeMs} from "@/utils/utils";

export async function POST(req: NextRequest) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/events/vote')
        const tokenReq = cookies().get('token')
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



        const userData = await req.json()
        const eventId: SafeParseReturnType<string, string> = roomOrEventIdScheme.safeParse(userData.eventId)
        const vote: SafeParseReturnType<number, number> = voteScheme.safeParse(userData.vote)
        const termTime: SafeParseReturnType<string, string> = timeScheme.safeParse(userData.time)

        if (!eventId.success) {
            return Response.json({
                ok: false,
                where: 'eventId',
                message: JSON.parse(eventId.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!vote.success) {
            return Response.json({
                ok: false,
                where: 'eventId',
                message: JSON.parse(vote.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!termTime.success) {
            return Response.json({
                ok: false,
                where: 'eventId',
                message: JSON.parse(termTime.error.message)[0].message
            }, {
                status: 400
            })
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

        // check eventId
        const checkEventIdQuery: string = 'select count(id) from events where event_id = $1'
        const checkEventIdResult: QueryResult = await client.query(checkEventIdQuery, [eventId.data])
        console.log(eventId.data)

        if (checkEventIdResult.rows[0].count < 1) {
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'eventId',
                message: 'Incorrect eventId'
            }, {
                status: 400
            })
        }
        console.log('eventId checked')

        // check accessibility
        const checkAccessibilityQuery: string = 'select count(ep.id) from event_participants as ep inner join events as e on ep.event_id = e.id inner join users as u on u.id = ep.user_id inner join sessions as s on u.id = s.user_id where e.event_id = $1 and token = $2 and expires_on > $3'
        const checkAccessibilityResult: QueryResult = await client.query(checkAccessibilityQuery, [eventId.data, token.data, getTimeMs()])

        if (checkAccessibilityResult.rows[0].count < 1) {
            return Response.json({
                ok: false,
                where: 'event access',
                message: 'You cannot access this event'
            }, {
                status: 403
            })
        }
        console.log('user accessibility checked')

        // checks whether there is previous vote or not
        const checkPreviousQuery: string = 'select count(etv.vote) from event_term_votes as etv inner join event_terms as et on etv.term_id = et.id inner join events as e on et.event_id = e.id inner join users as u on etv.user_id = u.id inner join sessions as s on u.id = s.user_id where e.event_id = $1 and et.date = $2 and token = $3 and expires_on > $4'
        const checkPreviousResult: QueryResult = await client.query(checkPreviousQuery, [eventId.data, termTime.data, token.data, getTimeMs()])

        // make vote
        if  (checkPreviousResult.rows[0].count < 1) {
            const makeVoteQuery: string = 'insert into event_term_votes as etv values (DEFAULT, $1, (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $4 and expires_on > $5), (select et.id from event_terms as et inner join events as e on et.event_id = e.id where et.date = $2 and e.event_id = $3))'
            await client.query(makeVoteQuery, [vote.data, termTime.data, eventId.data, token.data, getTimeMs()])
        } else {
            const makeVoteQuery: string = 'update event_term_votes as etv set vote = $1 where term_id = (select et.id from event_terms as et inner join events as e on et.event_id = e.id where et.date = $2 and e.event_id = $3) and user_id = (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $4 and expires_on > $5)'
            await client.query(makeVoteQuery, [vote.data, termTime.data, eventId.data, token.data, getTimeMs()])
        }

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