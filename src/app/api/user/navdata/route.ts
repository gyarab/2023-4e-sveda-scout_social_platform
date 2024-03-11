import {NextRequest, NextResponse} from "next/server";
import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs} from "@/utils/utils";
import { cookies } from 'next/headers'
import {auth} from "@/database/authentication";

const tokenScheme: ZodString = z.string().length(36)

export async function GET() {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/user/navdata')
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

        // get username
        const navDataQuery: string = 'select username from users inner join sessions on users.id = user_id where token=$1 and expires_on>$2'
        const navDataResult: QueryResult = await client.query(navDataQuery,[token.data, getTimeMs()])
        const userInfo = navDataResult.rows[0]

        console.log('server', userInfo)

        await client.query('COMMIT')
        client.release()

        return Response.json({
            username: userInfo.username
        }, {
            status: 200
        })
    } catch (e) {
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}