import {NextRequest, NextResponse} from "next/server";
import {LogInUserData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";

const usernameScheme: ZodString = z.string().min(1).max(25)
const passwordScheme: ZodString = z.string().min(1).max(40)

export async function POST(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {

        console.log(getTimeMs())

        let userData: LogInUserData = await req.json()

        const username: SafeParseReturnType<boolean, string> = usernameScheme.safeParse(userData.username)
        const password: SafeParseReturnType<boolean, string> = passwordScheme.safeParse(userData.password)

        if (!username.success) {
            return Response.json({
                ok: false,
                where: 'username',
                message: JSON.parse(username.error.message)[0].message
            }, {
                status: 401
            })
        }

        if (!password.success) {
            return Response.json({
                ok: false,
                where: 'password',
                message: JSON.parse(password.error.message)[0].message
            }, {
                status: 401
            })
        }

        userData = {
            username: username.data,
            password: password.data,
        }

        console.log(userData)

        await client.query('BEGIN')

        // check whether the user exists or not
        const existenceQuery: string = 'select count(username) from users where username=$1'
        const existenceResult: QueryResult = await client.query(existenceQuery, [userData.username]);

        if (Number.parseInt(existenceResult.rows[0].count) < 1) {
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'username',
                message: 'This username does not exist'
            }, {
                status: 401
            })
        }

        // get hashed password
        const getHashedPasswordQuery: string = 'select password from users where username=$1'
        const getHashedPasswordResult: QueryResult = await client.query(getHashedPasswordQuery, [userData.username])


        console.log(getHashedPasswordResult.rows[0])

        const hashedPassword = getHashedPasswordResult.rows[0].password.split('%')

        if (hashedPassword[1] !== hashPassword(userData.password, hashedPassword[0])) {
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'password',
                message: 'Wrong password'
            }, {
                status: 401
            })
        }

        // create session for logged user
        const sessionQuery: string = 'insert into sessions values (DEFAULT, DEFAULT, $1, (select id from users where username=$2));'
        const expirationTime: number = getExpirationTime()

        await client.query(sessionQuery, [expirationTime, userData.username])

        // get token for auth
        const getTokenQuery: string = 'select token from sessions inner join users on user_id = users.id where username=$1 and expires_on>$2;'
        const tokenResult: QueryResult = await client.query(getTokenQuery, [userData.username, getTimeMs()])
        const token: string = tokenResult.rows[0].token

        await client.query('COMMIT')
        client.release()

        console.log('gen:', token)

        return Response.json('', {
            status: 200,
            headers: {'Set-Cookie': `token=${token};path=/`}
        })
    } catch (e) {
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}