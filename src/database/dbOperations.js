import pool from './db.ts'
import {shuffleArray} from "../generation/equationGeneration";


export async function getChooseCorrectGame(difficulty, length, email) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        let game = (await client.query('select get_choose_correct_stage($1, $2, $3)', [difficulty, length, email])).rows
        await client.query('COMMIT')

        if ((!game?.length || game[0]?.get_choose_correct_stage === '(,,)') ?? true)
            return null

        game = JSON.parse(game[0].get_choose_correct_stage.replace('(', '[').replace(')', ']'))
        game = {
            question: game[0],
            correctAnswer: game[1],
            answers: shuffleArray([...(JSON.parse(game[2].replace('{', '[').replace('}', ']'))), game[1]]),
        }

        return game
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }

    return null
}

export async function getEqualPairs(difficulty, size, email, gameId) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        let game = (await client.query('select get_equal_pairs($1, $2, $3, $4)', [difficulty, size, email, gameId])).rows
        await client.query('COMMIT')

        if ((!game?.length) ?? true)
            return null

        game = game[0].get_equal_pairs
        let list = new Map()

        for (let i = 0; i < game.length; i++) {
            game[i] = game[i].substring(1, game[i].length - 1).split(",")
            game[i][1] = game[i][1].substring(1, game[i][1].length - 1)
            list.set(game[i][0], game[i][1]);
        }

        return list
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }

    return null
}

export async function getSorterGame(difficulty, size, email) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        let game = (await client.query('select get_sorter_game($1, $2, $3)', [difficulty, size, email])).rows
        await client.query('COMMIT')

        if ((!game?.length) ?? true)
            return null

        return game[0].get_sorter_game
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }

    return null
}

export async function addScore(email, gameId, incorrect, correct) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query('select set_user_score($1, $2, $3, $4)', [incorrect, correct, email, gameId])
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

export async function getScore(email) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        let score = (await client.query('select get_user_score($1)', [email])).rows
        await client.query('COMMIT')

        if ((!score?.length) ?? true)
            return null

        score = score[0].get_user_score
        for (let i = 0; i < score.length; i++) {
            score[i] = JSON.parse(score[i].replace('(', '[').replace(')', ']'))
        }

        return score
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }

    return null
}

export async function resetScore(email) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query('delete from user_score where user_id = (select id from users where email = $1);', [email])
        console.log('here')
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }
}

export async function getUserInfo(email) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        let info = (await client.query('select name from users where email = $1', [email])).rows
        await client.query('COMMIT')

        if ((!info?.length) ?? true)
            return null

        return info[0].name
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }

    return null
}

export default async function isAuthorized(email) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const verified = (await client.query('select verify_user($1)', [email])).rows[0].verify_user
        await client.query('COMMIT')

        return verified
    } catch (e) {
        await client.query('ROLLBACK')
        throw e
    } finally {
        client.release()
    }

    return false
}