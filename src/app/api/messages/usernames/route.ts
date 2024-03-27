import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {cookies} from 'next/headers'
import {auth} from "@/database/authentication";
import {getTimeMs} from "@/utils/utils";

const tokenScheme: ZodString = z.string().length(36)

export async function GET() {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/messages/usernames')
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

        // get usernames
        const getUsernamesQuery: string = 'select username from users where username != (select username from users as u inner join sessions as s on u.id = s.user_id where token = $1 and expires_on>$2) order by username'
        const getUsernamesResult: QueryResult = await client.query(getUsernamesQuery, [token.data, getTimeMs()])
        console.log('get usernames')

        await client.query('COMMIT')
        client.release()

        return Response.json(getUsernamesResult.rows.map(item => item.username), {
            status: 200
        })
    } catch (e) {
        console.log(e)
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}