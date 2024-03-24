import {NextRequest, NextResponse} from "next/server";
import {SafeParseReturnType, z, ZodString} from 'zod'
import pool from '../../../../../database/db'
import {PoolClient, QueryResult} from "pg";
import {cookies} from "next/headers";
import {auth} from "@/database/authentication";
import path from 'path'
import {readFile} from "fs/promises";
import * as fs from "node:fs";

const tokenScheme: ZodString = z.string().length(36)
const roomIdScheme: ZodString = z.string().length(128)


export async function GET(req: NextRequest, res: NextResponse) {
    const client: PoolClient = await pool.connect()
    try {
        console.log('/api/images/post')

        const tokenReq = cookies().get('token')
        const imageName = req.url.split('/').pop()
        const relativeImagePath = 'data/images/' + imageName
        console.log('imageName', imageName)

        /*
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
         */




        await client.query('BEGIN')

        const getImageTypeQuery: string = 'select type from media where path = $1'
        const getImageTypeResult: QueryResult = await client.query(getImageTypeQuery, [relativeImagePath])
        const type = getImageTypeResult.rows[0].type

        await client.query('COMMIT')
        client.release()

        const filePath: string = path.resolve('.', relativeImagePath)
        const imageBuffer = fs.readFileSync(filePath)

        return new Response(imageBuffer, {
            headers: {
                "Content-Type": type
            }
        })
    } catch (e) {
        console.log(e)
        await client.query('ROLLBACK')
        return new Response('Internal server error', {
            status: 500,
        })
    }
}