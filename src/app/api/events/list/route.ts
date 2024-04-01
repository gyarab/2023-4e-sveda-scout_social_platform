import {NextRequest, NextResponse} from "next/server";
import {EventData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodNumber, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";
import {getTimeMs} from "@/utils/utils";

const tokenScheme: ZodString = z.string().length(36)


export async function GET(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/events/list')
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

        // get events with ended decision period
        const getEventsWithEndedDecisionPeriodQuery: string = 'select id from events where decision_date < $1 and date isnull'
        const getEventsWithEndedDecisionPeriodResult: QueryResult = await client.query(getEventsWithEndedDecisionPeriodQuery, [getTimeMs()])

        for (let i: number = 0; i < getEventsWithEndedDecisionPeriodResult.rows.length; i++) {
            const currentEventId: number = Number.parseInt(getEventsWithEndedDecisionPeriodResult.rows[i].id)
            const getTermIdsQuery: string = 'select et.id, et.date from event_terms as et where event_id = $1'
            const getTermIdsResult: QueryResult = await client.query(getTermIdsQuery, [currentEventId])

            let max = {
                termId: Number.parseInt(getTermIdsResult.rows[0].id),
                date: getTermIdsResult.rows[0].date,
                max: 0
            }

            for (let j: number = 0; j < getTermIdsResult.rows.length; j++) {
                const getPositiveVotesQuery: string = 'select count(etv.id) from event_term_votes as etv inner join event_terms as et on etv.term_id = et.id where term_id = $1 and et.event_id = $2 and etv.vote = 1'
                const getPositiveVotesResult: QueryResult = await client.query(getPositiveVotesQuery, [Number.parseInt(getTermIdsResult.rows[j].id), currentEventId])
                const count: number = Number.parseInt(getPositiveVotesResult.rows[0].count)
                console.log(count)
                if (count > max.max) {
                    max = {
                        termId: Number.parseInt(getTermIdsResult.rows[j].id),
                        date: getTermIdsResult.rows[j].date,
                        max: count
                    }
                } else if (count === max.max) {
                    const getMaybeVotesQuery: string = 'select count(etv.id) from event_term_votes as etv inner join event_terms as et on etv.term_id = et.id where term_id = $1 and et.event_id = $2 and etv.vote = 3'
                    const getMaybeVotesResultPrevious: QueryResult = await client.query(getMaybeVotesQuery, [max.termId, currentEventId])
                    const getMaybeVotesResultNew: QueryResult = await client.query(getMaybeVotesQuery, [Number.parseInt(getTermIdsResult.rows[j].id), currentEventId])
                    const countPrevious: number = Number.parseInt(getMaybeVotesResultPrevious.rows[0].count)
                    const countNew: number = Number.parseInt(getMaybeVotesResultNew.rows[0].count)

                    if (countNew >= countPrevious) {
                        max = {
                            termId: Number.parseInt(getTermIdsResult.rows[j].id),
                            date: getTermIdsResult.rows[j].date,
                            max: count
                        }
                    }
                }
            }

            const updateEventQuery: string = 'update events set date = $1 where id = $2'
            console.log(Number.parseInt(max.date), currentEventId)
            await client.query(updateEventQuery, [Number.parseInt(max.date), currentEventId.toString()])
        }
        console.log('get events with ended decision period')


        // get list
        const getListQuery: string = 'select e.id, e.name as eventname, e.event_id, e.description, e.decision_date, e.date from events as e inner join event_participants as ep on e.id = ep.event_id where ep.user_id = (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $1 and expires_on > $2) order by e.id, date, decision_date desc'
        const getListResult: QueryResult = await client.query(getListQuery, [token.data, getTimeMs()])

        await client.query('COMMIT')
        client.release()

        return Response.json(getListResult.rows, {
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