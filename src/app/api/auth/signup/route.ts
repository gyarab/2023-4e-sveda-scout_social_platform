import {NextRequest, NextResponse} from "next/server";
import {SignUpUserData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, hashPassword} from "@/utils/utils";

const usernameScheme: ZodString = z.string().min(1).max(25)
const nicknameScheme: ZodString = z.string().max(25)
const emailScheme: ZodString = z.string().email().min(5)
const passwordScheme: ZodString = z.string().min(8).max(40)

export async function POST(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/auth/signup')
        let userData: SignUpUserData = await req.json()

        const username: SafeParseReturnType<boolean, string> = usernameScheme.safeParse(userData.username)
        const nickname: SafeParseReturnType<boolean, string> = nicknameScheme.safeParse(userData.nickname)
        const email: SafeParseReturnType<boolean, string> = emailScheme.safeParse(userData.email)
        const password: SafeParseReturnType<boolean, string> = passwordScheme.safeParse(userData.password)
        const passwordAgain: SafeParseReturnType<boolean, string> = passwordScheme.safeParse(userData.passwordAgain)

        if (!username.success) {
            return Response.json({
                ok: false,
                where: 'username',
                message: JSON.parse(username.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!nickname.success) {
            return Response.json({
                ok: false,
                where: 'nickname',
                message: JSON.parse(nickname.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!email.success) {
            return Response.json({
                ok: false,
                where: 'email',
                message: JSON.parse(email.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!password.success) {
            return Response.json({
                ok: false,
                where: 'password',
                message: JSON.parse(password.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (!passwordAgain.success) {
            return Response.json({
                ok: false,
                where: 'passwordAgain',
                message: JSON.parse(passwordAgain.error.message)[0].message
            }, {
                status: 400
            })
        }

        if (password.data !== passwordAgain.data) {
            return Response.json({
                ok: false,
                where: 'passwordAgain',
                message: "Passwords do not match"
            }, {
                status: 400
            })
        }

        userData = {
            username: username.data,
            nickname: nickname.data,
            email: email.data,
            password: password.data,
            passwordAgain: passwordAgain.data
        }

        console.log(userData)

        await client.query('BEGIN')

        // check username availability
        const usernameDuplicatesQuery: string = 'select count(username) from users where username=$1;'
        const usernameDuplicates: QueryResult = await client.query(usernameDuplicatesQuery, [userData.username]);
        console.log('usernameDuplicates', Number.parseInt(usernameDuplicates.rows[0].count))

        if (Number.parseInt(usernameDuplicates.rows[0].count) >= 1) {
            console.log('here')
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'username',
                message: 'This username is already in use'
            }, {
                status: 400
            })
        }

        // check email availability
        const emailDuplicatesQuery: string = 'select count(email) from users where email=$1;'
        const emailDuplicates: QueryResult = await client.query(emailDuplicatesQuery, [userData.email]);
        console.log('email duplicates', Number.parseInt(emailDuplicates.rows[0].count))

        if (Number.parseInt(emailDuplicates.rows[0].count) >= 1) {
            console.log('here')
            await client.query('ROLLBACK')
            client.release()
            return Response.json({
                ok: false,
                where: 'email',
                message: 'This email is used by different account'
            }, {
                status: 400
            })
        }

        // insert new user
        const insertUserQuery: string = 'insert into users values (DEFAULT, $1, $2, $3, $4);'
        const passwordHash: string = hashPassword(userData.password)
        console.log(passwordHash)

        await client.query(insertUserQuery, [
            userData.username,
            (!userData.nickname || userData.nickname.trim() === '') ? null : userData.nickname,
            userData.email,
            passwordHash
        ])

        // create session for the new user
        const sessionQuery: string = 'insert into sessions values (DEFAULT, DEFAULT, $1, (select id from users where username=$2));'
        const expirationTime: number = getExpirationTime()

        await client.query(sessionQuery, [expirationTime, userData.username])

        // get token for auth
        const getTokenQuery: string = 'select token from sessions inner join users on user_id = users.id where username=$1;'
        const tokenResult: QueryResult = await client.query(getTokenQuery, [userData.username])
        const token: string = tokenResult.rows[0].token
        console.log(token)


        await client.query('COMMIT')
        client.release()

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