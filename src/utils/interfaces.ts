import {z, ZodArray, ZodNumber, ZodString} from "zod";

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

export interface EventListItemProps {
    id: number,
    eventname: string,
    event_id: string,
    decision_date: string | number,
    date: string | number | null
    click?: () => void,
}

export interface EventListItemTextProps {
    description: string,
    date: string | number,
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

export interface EventData {
    eventname: string,
    description: string,
    participants: string[],
    voteEndingTime: number,
    voteOptions: number[]
}

export interface EventDataDisplay {
    eventname: string,
    description: string | null,
    voteendingtime: string,
    happeningtime: string,
    participants: string[],
    voteOptions: EventVoteOption[],
}

export interface EventVoteOption {
    vote: number | null,
    time: string
}

export const tokenScheme: ZodString = z.string().length(36)
export const nameScheme: ZodString = z.string().min(1).max(50)
export const descriptionScheme: ZodString = z.string().max(1000)
export const participantsScheme: ZodArray<ZodString> = z.string().min(1).array().min(1)
export const voteEndingTimeScheme: ZodNumber = z.number().min(10000000)
export const voteOptionsScheme: ZodArray<ZodNumber> = z.number().min(10000000).array().min(1)
export const idScheme: ZodNumber = z.number().int().min(0)
export const roomOrEventIdScheme: ZodString = z.string().length(128)
export const timeScheme: ZodString = z.string()
export const voteScheme: ZodNumber = z.number().int().min(0).max(3)