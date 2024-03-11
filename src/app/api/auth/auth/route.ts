import {NextRequest, NextResponse} from "next/server";
import {LogInUserData, User} from "@/utils/interfaces";
import {boolean, SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";

const tokenScheme: ZodString = z.string().length(36)

export async function GET(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/auth/auth')

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

        const getUserDataQuery: string = 'select username, nickname, email from users as u inner join sessions on u.id = user_id where token = $1 and expires_on>$2'
        const getUserDataResult: QueryResult = await client.query(getUserDataQuery, [token.data, getTimeMs()])

        await client.query('COMMIT')
        client.release()

        const user: User = {
            username: getUserDataResult.rows[0].username,
            nickname: getUserDataResult.rows[0].nickname,
            email: getUserDataResult.rows[0].email
        }

        console.log(user)

        return Response.json(user, {
            status: 200,
        })
    } catch (e) {
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}