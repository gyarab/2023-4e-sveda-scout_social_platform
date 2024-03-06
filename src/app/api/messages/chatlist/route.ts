import {NextRequest, NextResponse} from "next/server";
import {CreateNewChatData, LogInUserData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";
import {cookies} from "next/headers";

const tokenScheme: ZodString = z.string().length(36)
const nameScheme: ZodString = z.string().min(1).max(20)
const typeScheme: ZodString = z.string().min(1).max(8)
const membersScheme: ZodArray<ZodString> = z.string().array()


export async function GET() {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/messages/chatlist')
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

        // check whether the session exists or not
        const existenceQuery: string = 'select count(token) from sessions where token=$1 and expires_on>$2'
        const existenceResult: QueryResult = await client.query(existenceQuery, [token.data, getTimeMs()]);

        if (Number.parseInt(existenceResult.rows[0].count) < 1) {
            console.log('here')
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

        // revalidate session
        const revalidateQuery: string = 'update sessions set expires_on=$1 where token=$2 and expires_on>$3'
        await client.query(revalidateQuery, [getExpirationTime(), token.data, getTimeMs()])
        console.log('revalidate session')

        // get username
        const usernameQuery: string = 'select username from users inner join sessions on users.id = user_id where token=$1 and expires_on>$2'
        const usernameResult: QueryResult = await client.query(usernameQuery, [token.data, getTimeMs()])
        const username = usernameResult.rows[0].username

        // get direct list
        const getListQuery: string = 'select mg.id, type, name from message_groups as mg inner join message_group_members on mg.id = message_group_id where type = $1 and user_id = (select u.id from users as u inner join sessions as s on u.id = s.user_id where token = $2) order by edited_on'
        const getDirectListResult: QueryResult = await client.query(getListQuery, ['direct', token.data])
        const directs: any[] = getDirectListResult.rows

        // get troop list
        const getTroopListResult: QueryResult = await client.query(getListQuery, ['troop', token.data])
        const troops: any[] = getTroopListResult.rows

        // get group list
        const getGroupListResult: QueryResult = await client.query(getListQuery, ['group', token.data])
        const groups: any[] = getGroupListResult.rows

        // get district list
        const getDistrictListResult: QueryResult = await client.query(getListQuery, ['district', token.data])
        const districts: any[] = getDistrictListResult.rows

        await client.query('COMMIT')
        client.release()

        for (let i = 0; i < directs.length; i++) {
            const users = directs[i].name.split('|')
            directs[i].name = (users[0] === username) ? users[1] : users[0]
        }

        return Response.json({
            directs: directs,
            troops: troops,
            groups: groups,
            districts: districts,
        }, {
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