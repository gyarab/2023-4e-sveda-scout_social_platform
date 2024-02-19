import sha512 from "crypto-js/sha512";

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