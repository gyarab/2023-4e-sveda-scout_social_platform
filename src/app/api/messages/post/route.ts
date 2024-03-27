import {NextRequest, NextResponse} from "next/server";
import {CreateNewChatData, LogInUserData, PostMessageData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";

const tokenScheme: ZodString = z.string().length(36)
const roomIdScheme: ZodString = z.string().length(128)
const timeScheme: ZodString = z.string()
const messageScheme: ZodString = z.string().max(500)


export async function POST(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/messages/post')

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

        let userData: PostMessageData = await req.json()

        const roomId: SafeParseReturnType<boolean, string> = roomIdScheme.safeParse(userData.roomId)
        const time: SafeParseReturnType<boolean, string> = timeScheme.safeParse(userData.time)
        const message: SafeParseReturnType<boolean, string> = messageScheme.safeParse(userData.message)

        if (!roomId.success) {
            return Response.json({
                ok: false,
                where: 'roomId',
                message: JSON.parse(roomId.error.message)[0].message
            }, {
                status: 401
            })
        }

        if (!time.success) {
            return Response.json({
                ok: false,
                where: 'time',
                message: JSON.parse(time.error.message)[0].message
            }, {
                status: 401
            })
        }

        if (!message.success) {
            return Response.json({
                ok: false,
                where: 'message',
                message: JSON.parse(message.error.message)[0].message
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

        // check rights for wanted chat
        const chatAvailabilityQuery: string = 'select count(u.id) from users as u inner join message_group_members as mgm on u.id = mgm.user_id inner join message_groups as mg on mg.id = message_group_id inner join sessions as s on u.id = s.user_id where message_group_id = (select id from message_groups where room_id = $1) and token = $2'
        const chatAvailabilityResult: QueryResult = await client.query(chatAvailabilityQuery, [roomId.data, token.data])
        console.log('check rights to access the chat')

        if (chatAvailabilityResult.rows[0].count < 1) {
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'chat',
                message: 'You are not able to access this chat'
            }, {
                status: 403
            })
        }

        // post new message
        const postMessageQuery: string = 'insert into messages values (DEFAULT, $1, $2, (select u.id from users as u inner join sessions as s on u.id = user_id where token=$3 and expires_on>$2), (select id from message_groups where room_id = $4))'
        await client.query(postMessageQuery, [message.data, time.data, token.data, roomId.data])

        // update edited_on in message group
        const updateEditTimeQuery: string = 'update message_groups set edited_on = $1 where room_id = $2'
        await client.query(updateEditTimeQuery, [time.data, roomId.data])

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