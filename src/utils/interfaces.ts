export interface SignUpUserData {
    username: string,
    nickname: string,
    email: string,
    password: string,
    passwordAgain: string
}

export interface FetchError {
    isErr: boolean,
    message: string
}

export interface LogInUserData {
    username: string,
    password: string
}

export interface ChatListItemProps {
    avatar: {
        username: string,
        image: string
    },
    text: {
        primary: string,
    },
    badge: {
        color: string,
    },
    click?: () => void
}

export interface CreateNewChatData {
    name?: string,
    type: string,
    members: string[],
}