import {PoolClient, QueryResult} from "pg";
import {getExpirationTime, getTimeMs} from "@/utils/utils";

export async function auth(client: PoolClient, token: string) {
    // check whether the session exists or not
    const existenceQuery: string = 'select count(token) from sessions where token=$1 and expires_on>$2'
    const existenceResult: QueryResult = await client.query(existenceQuery, [token, getTimeMs()]);

    if (Number.parseInt(existenceResult.rows[0].count) < 1) {
        return false;
    }

    // revalidate session
    const revalidateQuery: string = 'update sessions set expires_on=$1 where token=$2 and expires_on>$3'
    await client.query(revalidateQuery, [getExpirationTime(), token, getTimeMs()])
    console.log('revalidate session')

    return true;
}