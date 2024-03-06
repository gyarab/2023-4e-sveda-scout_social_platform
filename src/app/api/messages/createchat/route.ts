import {NextRequest, NextResponse} from "next/server";
import {CreateNewChatData, LogInUserData} from "@/utils/interfaces";
import {boolean, SafeParseReturnType, z, ZodArray, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";
import {cookies} from "next/headers";

const tokenScheme: ZodString = z.string().length(36)
const nameScheme: ZodString = z.string().min(1).max(20)
const typeScheme: ZodString = z.string().min(1).max(8)
const membersScheme: ZodArray<ZodString> = z.string().array()


export async function POST(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/messages/createchat')

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

        let userData: CreateNewChatData = await req.json()

        const name: SafeParseReturnType<boolean, string> = nameScheme.safeParse(userData.name)
        const type: SafeParseReturnType<boolean, string> = typeScheme.safeParse(userData.type)
        const members: SafeParseReturnType<string[], string[]> = membersScheme.safeParse(userData.members)
        console.log(members)

        if (!type.success) {
            return Response.json({
                ok: false,
                where: 'username',
                message: JSON.parse(type.error.message)[0].message
            }, {
                status: 401
            })
        }

        if (!(type.data === 'direct' || type.data === 'troop' || type.data === 'group' || type.data === 'district')) {
            return Response.json({
                ok: false,
                where: 'username',
                message: 'Type of the chat is wrong'
            }, {
                status: 401
            })
        }

        if (type.data !== 'direct' && !name.success) {
            return Response.json({
                ok: false,
                where: 'username',
                message: JSON.parse(name.error.message)[0].message
            }, {
                status: 401
            })
        }

        if (!members.success) {
            return Response.json({
                ok: false,
                where: 'username',
                message: JSON.parse(members.error.message)[0].message
            }, {
                status: 401
            })
        }


        userData = {
            // @ts-ignore
            name: name.data,
            type: type.data,
            members: members.data
        }

        console.log(userData)

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
                message: 'You are not authorized'
            }, {
                status: 401
            })
        }

        // revalidate session
        const revalidateQuery: string = 'update sessions set expires_on=$1 where token=$2 and expires_on>$3'
        console.log(getExpirationTime(), token.data, getTimeMs())
        await client.query(revalidateQuery, [getExpirationTime(), token.data, getTimeMs()])

        // check whether members exist
        for (let i = 0; i < userData.members.length; i++) {
            const checkMembersQuery: string = 'select count(id) from users where username = $1'
            const checkMemberResult: QueryResult = await client.query(checkMembersQuery, [userData.members[i]]);
            console.log('server', Number.parseInt(checkMemberResult.rows[0].count))

            if (Number.parseInt(checkMemberResult.rows[0].count) < 1) {
                await client.query('ROLLBACK')
                client.release()
                return Response.json({
                    ok: false,
                    where: 'members',
                    message: 'Some of the members does not exist'
                }, {
                    status: 401
                })
            }
        }

        // get username
        const getUsernameQuery: string = 'select username from users inner join sessions on users.id = user_id where token = $1 and expires_on > $2'
        const getUsernameResult: QueryResult = await client.query(getUsernameQuery, [token.data, getTimeMs()])
        const username = getUsernameResult.rows[0].username



        // data alternation if is direct
        let is_direct = false
        if (userData.type === 'direct') {
            userData.name = `${username}|${userData.members[0]}`
            is_direct = true
        }

        // check whether message group exists
        const sameGroupIdQuery: string = 'select distinct g.id from message_groups as g, message_group_members as mgm, users as u where g.id = mgm.message_group_id and mgm.user_id = u.id and (name = $1 or name = $2) and type = $3'
        const sameGroupIdResult: QueryResult = await client.query(sameGroupIdQuery, [userData.name, (is_direct) ? `${userData.members[0]}|${username}` : userData.name, userData.type])
        console.log('groupCheck', sameGroupIdResult.rows)

        if (sameGroupIdResult.rows.length > 0) {
            userData.members = userData.members.concat([username])
            const groupMembersQuery: string = 'select username from message_group_members as mgm, users as u where u.id = user_id and message_group_id = $1'

            // check members
            for (let i: number = 0; i < sameGroupIdResult.rows.length; i++) {
                const groupMemberResult: QueryResult = await client.query(groupMembersQuery, [Number.parseInt(sameGroupIdResult.rows[i].id)])
                //console.log(groupMemberResult.rows)

                console.log('lengths', groupMemberResult.rows, userData.members)
                if (groupMemberResult.rows.length !== userData.members.length)
                    continue;

                let sameMembers: boolean = true
                for (let j: number = 0; j < groupMemberResult.rows.length; j++) {
                    let localeSame: boolean = false

                    for (let k: number = 0; k < userData.members.length; k++) {
                        if (groupMemberResult.rows[j].username === userData.members[k]) {
                            localeSame = true
                            break
                        }
                    }

                    if (!localeSame) {
                        sameMembers = false
                        break
                    }
                }

                if (sameMembers) {
                    await client.query('ROLLBACK')
                    client.release()
                    return Response.json({
                        ok: false,
                        where: 'chat',
                        message: 'This chat already exists'
                    }, {
                        status: 401
                    })
                }
            }

            userData.members = userData.members.filter((name: string) => name !== username)
        }

        // create message group
        const messageGroupQuery: string = 'insert into message_groups values (DEFAULT, $1, $2, $3)'

        await client.query(messageGroupQuery, [userData.name, userData.type, getTimeMs()])
        console.log('create message group')

        // get message group id
        const messageGroupIdQuery: string = 'select max(id) from message_groups where name = $1'
        const messageGroupIdResult: QueryResult = await client.query(messageGroupIdQuery, [userData.name])
        const group_id = messageGroupIdResult.rows[0].max
        console.log('message group id')

        // insert members to group
        const insertMembersQuery: string = 'insert into message_group_members values (DEFAULT, $1, $2, (select id from users where username = $3), $4)'
        for (let i = 0; i < userData.members.length; i++)
            if (userData.members[i] !== username)
                await client.query(insertMembersQuery, [getTimeMs(), is_direct, userData.members[i], group_id])

        await client.query(insertMembersQuery, [getTimeMs(), true, username, group_id])
        console.log('insert members')

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