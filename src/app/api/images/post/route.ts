import {NextRequest, NextResponse} from "next/server";
import {CreateNewChatData, LogInUserData, PostMessageData} from "@/utils/interfaces";
import {SafeParseReturnType, z, ZodArray, ZodString} from 'zod'
import pool from '../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs, hashPassword} from "@/utils/utils";
import {cookies} from "next/headers";
import {auth, checkRightsForChat} from "@/database/authentication";
import path from 'path'
import {writeFile} from "fs/promises";

const tokenScheme: ZodString = z.string().length(36)
const roomIdScheme: ZodString = z.string().length(128)


export async function POST(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/images/post')

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

        const formData = await req.formData();

        const roomId: SafeParseReturnType<boolean, string> = roomIdScheme.safeParse(formData.get('room_id'))
        formData.delete('room_id')

        if (!roomId.success) {
            return Response.json({
                ok: false,
                where: 'roomId',
                message: JSON.parse(roomId.error.message)[0].message
            }, {
                status: 400
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

        for (const [key, value] of formData.entries()) {

            const file: FormDataEntryValue = value

            if (!file) {
                return Response.json({
                    ok: false,
                    where: 'file',
                    message: `File '${key}' not received`
                }, {
                    status: 400
                })
            }

            // @ts-ignore
            if (!(file.type === 'image/png' || file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/webp')) {
                return Response.json({
                    ok: false,
                    where: 'file',
                    message: 'Unsupported file type'
                }, {
                    status: 400
                })
            }

            const relativeMediaPath: string = "data/images/" + getTimeMs().toString() + roomId.data + '.' + key.split('.').pop()
            const mediaPath: string = path.join(process.cwd(), relativeMediaPath)
            console.log(mediaPath);

            const postImageQuery: string = 'insert into media values (DEFAULT, $1, $2, $3, (select user_id from users as u inner join sessions as s on u.id = s.user_id where token = $4 and expires_on>$5), (select id from message_groups where room_id = $6))'
            const currentTime: number = getTimeMs()
            // @ts-ignore
            await client.query(postImageQuery, [relativeMediaPath, file.type, currentTime, token.data, currentTime, roomId.data])

            // update edited_on in message group
            const updateEditTimeQuery: string = 'update message_groups set edited_on = $1 where room_id = $2'
            await client.query(updateEditTimeQuery, [currentTime, roomId.data])

            try {
                // @ts-ignore
                const buffer: Buffer = Buffer.from(await file.arrayBuffer());
                await writeFile(mediaPath, buffer);
            } catch (error) {
                await client.query('ROLLBACK')
                client.release()
                return new Response('Internal server error', {
                    status: 500,
                })
            }
        }


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