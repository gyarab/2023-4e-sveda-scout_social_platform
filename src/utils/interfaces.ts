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
        edited_on?: string
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

export interface MessageData {
    roomId: string;
    username: string;
    message: string;
    time: string;
}

export interface ImageData {
    name: string,
    type: string,
    posted_on: string,
}

export interface User {
    username: string,
    nickname: string,
    email: string
}

export interface ResponsiveBarProps {
    username: string
}

export interface PostMessageData {
    roomId: string,
    message: string,
    time: string
}

export interface GetMessageData {
    roomId: string,
    time: string,
    lastMessageTime: string
}