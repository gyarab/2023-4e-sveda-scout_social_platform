import {NextRequest, NextResponse} from "next/server";
import {CreateNewChatData, GetMessageData, LogInUserData, PostMessageData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";
import {cookies} from "next/headers";
import {auth, checkRightsForChat} from "@/database/authentication";

const tokenScheme: ZodString = z.string().length(36)
const roomIdScheme: ZodString = z.string().length(128)
const timeScheme: ZodString = z.string()

export async function POST(req: NextRequest) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/messages/get')

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

        let userData: GetMessageData = await req.json()

        const roomId: SafeParseReturnType<boolean, string> = roomIdScheme.safeParse(userData.roomId)
        const time: SafeParseReturnType<boolean, string> = timeScheme.safeParse(userData.time)
        const lastMessageTime: SafeParseReturnType<boolean, string> = timeScheme.safeParse(userData.lastMessageTime)

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

        if (!lastMessageTime.success) {
            return Response.json({
                ok: false,
                where: 'part',
                message: JSON.parse(lastMessageTime.error.message)[0].message
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
        if (await checkRightsForChat(client, roomId.data, token.data) < 1) {
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

        // get new messages
        const getMessagesQuery: string = 'select message, sent_on::varchar as time, u.username, room_id from message_groups as mg inner join messages as m on mg.id = m.message_group_id inner join users as u on u.id = m.user_id where room_id = $1 and sent_on<$2 order by time desc limit 10'
        const getMessagesResult: QueryResult = await client.query(getMessagesQuery, [roomId.data, Number.parseInt(lastMessageTime.data)])
        console.log('get messages')

        // get new images
        const getImagesQuery: string = 'select path, m.type, posted_on as time, u.username from media as m inner join message_groups as mg on mg.id = message_group_id inner join users as u on u.id = m.user_id where room_id = $1 and posted_on<$2 order by time desc limit 10'
        const getImagesResult: QueryResult = await client.query(getImagesQuery, [roomId.data, Number.parseInt(lastMessageTime.data)])
        console.log('get images')

        const compareByTime = (a: any, b: any) => (a.time - b.time)
        let chatStructure: any[] = getMessagesResult.rows.concat(getImagesResult.rows).sort(compareByTime)
        console.log(chatStructure)

        await client.query('COMMIT')
        client.release()

        return Response.json(chatStructure, {
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