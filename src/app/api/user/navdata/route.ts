import {NextRequest, NextResponse} from "next/server";
import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs} from "@/utils/utils";
import { cookies } from 'next/headers'

const tokenScheme: ZodString = z.string().length(36)

export async function GET() {
    const client: PoolClient = await pool.connect()
    try {
        const tokenReq = cookies().get('token')
        console.log(tokenReq)
        console.log(getTimeMs())

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
        console.log('server', Number.parseInt(existenceResult.rows[0].count))

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