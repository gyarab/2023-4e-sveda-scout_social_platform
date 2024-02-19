export interface SignUpUserData {
    username: string,
    nickname: string,
    email: string,
    password: string,
    passwordAgain: string
}

export interface SignError {
    isErr: boolean,
    message: string
}

export interface LogInUserData {
    username: string,
    password: string
}

export interface SignToken {
    token: string
}