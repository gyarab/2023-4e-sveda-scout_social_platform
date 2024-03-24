import sha512 from "crypto-js/sha512";

export const directColor: string = '#2196F3'
export const troopColor: string = '#009688'
export const groupColor: string = '#B26A00'
export const districtColor: string = '#E91E63'

export const getTimeMs = (): number => {
    return Date.now();
}

export const getExpirationTime = () => {
    return getTimeMs() + Number.parseInt(process.env.LOGIN_EXPIRATION + '')
}

export const getSalt = (): string => {
    return crypto.randomUUID().substring(0, 8)
}

export const hashPassword = (password: string, salt: string=''): string => {
    if (salt === '') {
        salt = getSalt()
        return salt + '%' + sha512(salt + password)
    }

    return sha512(salt + password).toString()
}

export const createRoomId = (toBeHashed: string): string => sha512(toBeHashed).toString()

export const getFullDate = (time: string): string => {
    const date: Date = new Date(Number.parseInt(time))
    const minutes: number = date.getMinutes()
    return  date.getDate() + '. ' + date.getMonth() + '. ' + date.getFullYear() + ' ' + date.getHours() + ":" + `${minutes < 10 ? '0' : ''}${minutes}`
}