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

export async function checkRightsForChat(client: PoolClient, roomId: string, token: string) {
    const chatAvailabilityQuery: string = 'select count(u.id) from users as u inner join message_group_members as mgm on u.id = mgm.user_id inner join message_groups as mg on mg.id = message_group_id inner join sessions as s on u.id = s.user_id where message_group_id = (select id from message_groups where room_id = $1) and token = $2'
    const chatAvailabilityResult: QueryResult = await client.query(chatAvailabilityQuery, [roomId, token])
    console.log('check rights to access the chat')
    return chatAvailabilityResult.rows[0].count;
}