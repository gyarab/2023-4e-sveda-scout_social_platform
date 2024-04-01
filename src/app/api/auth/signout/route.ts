import {NextRequest, NextResponse} from "next/server";
import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getTimeMs} from "@/utils/utils";
import { cookies } from 'next/headers'

const tokenScheme: ZodString = z.string().length(36)

export async function GET() {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/auth/signout')
        const tokenReq = cookies().get('token')

        const token: SafeParseReturnType<boolean, string> = tokenScheme.safeParse(tokenReq?.value)

        if (!token.success) {
            return Response.json({
                ok: false,
                where: 'username',
                message: 'You are already signed out'
            }, {
                status: 400
            })
        }

        await client.query('BEGIN')

        // check whether the session exists or not
        const existenceQuery: string = 'select count(token) from sessions where token=$1 and expires_on>$2'
        const existenceResult: QueryResult = await client.query(existenceQuery, [token.data, getTimeMs()]);

        if (Number.parseInt(existenceResult.rows[0].count) < 1) {
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'token',
                message: 'User is already signed out'
            }, {
                status: 400
            })
        }

        // get hashed password
        const signOutQuery: string = 'delete from sessions where token=$1'
        await client.query(signOutQuery, [token.data])

        // delete all expired sessions
        const deleteExpiredSessionsQuery: string = 'delete from sessions where expires_on<$1'
        await client.query(deleteExpiredSessionsQuery, [getTimeMs()])

        await client.query('COMMIT')
        client.release()

        return Response.json('', {
            status: 200
        })
    } catch (e) {
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}