import {NextRequest} from "next/server";
import {EventDataDisplay, roomOrEventIdScheme, tokenScheme} from "@/utils/interfaces";
import {SafeParseReturnType} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";
import {getTimeMs} from "@/utils/utils";

export async function POST(req: NextRequest) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/events/get')
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

        if (!eventId.success) {
            return Response.json({
                ok: false,
                where: 'eventId',
                message: JSON.parse(eventId.error.message)[0].message
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

        // get event data
        const getEventDataQuery: string = 'select name as eventname, description, decision_date as voteEndingTime, date as happeningTime from events where event_id = $1'
        const getEventDataResult: QueryResult = await client.query(getEventDataQuery, [eventId.data])
        console.log('get event data')

        // get participants
        const getParticipantsQuery: string = 'select u.username from events as e inner join event_participants as ep on e.id = ep.event_id inner join users as u on ep.user_id = u.id where e.event_id = $1'
        const getParticipantsResult: QueryResult = await client.query(getParticipantsQuery, [eventId.data])
        console.log('get participants')

        // get event terms
        const getEventTermsQuery: string = 'select et.id, et.date as time from event_terms as et inner join events as e on e.id = et.event_id where e.event_id = $1'
        const getEventTermsResult: QueryResult = await client.query(getEventTermsQuery, [eventId.data])
        console.log('get event terms')

        // get vote for each date in event_terms
        const getVoteQuery: string = 'select vote from event_term_votes as etv where etv.term_id = $1'
        for (let i: number = 0; i < getEventTermsResult.rows.length; i++) {
            const getVoteResult: QueryResult = await client.query(getVoteQuery, [Number.parseInt(getEventTermsResult.rows[i].id)])
            console.log(getVoteResult.rows)
            if (getVoteResult.rows.length < 1) {
                getEventTermsResult.rows[i] = {
                    time: getEventTermsResult.rows[i].time,
                    vote: 0
                }
            } else {
                getEventTermsResult.rows[i] = {
                    time: getEventTermsResult.rows[i].time,
                    vote: getVoteResult.rows[0].vote
                }
            }
        }


        let event: EventDataDisplay = {
            ...getEventDataResult.rows[0],
            participants: getParticipantsResult.rows.map(item => item.username),
            voteOptions: getEventTermsResult.rows
        }

        console.log(event)

        await client.query('COMMIT')
        client.release()

        return Response.json(event, {
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