'use client'
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React, {useEffect, useMemo, useRef, useState} from "react";
import Box from "@mui/material/Box";
import {CircularProgress, Container, FormHelperText, Paper, Stack, TextField} from "@mui/material";
import theme from "@/components/ThemeRegistry/theme";
import Button from "@mui/material/Button";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import axios from "axios";
import {io} from "socket.io-client";
import {GetMessageData, MessageData, PostMessageData, User} from "@/utils/interfaces";
import {districtColor, getFullDate, getTimeMs} from "@/utils/utils";
import {useRouter} from "next/navigation";
import Image from 'next/image'

const prefix: string = 'http://localhost'

export default function Chat({params}: { params: { slug: string } }) {

    const messagesEndRef = useRef()
    const [chat, setChat] = useState<any[]>([])
    const [messageInput, setMessageInput] = useState<string>('')

    const roomId: string = useMemo(() => params.slug, [params])

    const [user, setUser] = useState<User>({
        username: '',
        nickname: '',
        email: '',
    })

    const fileInputRef = useRef(null)
    const [file, setFile] = useState(null)

    const router = useRouter()

    var socket: any;
    socket = io(`${prefix}:3001`);

    const handleJoin = (username: string) => {
        if (username !== "" && roomId.length > 0) {
            console.log(username, "userName", 'joined');
            socket.emit("join_room", roomId);
        } else {
            console.log('RoomId not set')
        }
    };

    const sendData = async (e: any) => {
        const message: string = messageInput;

        if (message !== undefined && message.length > 0 && message.length <= 500) {
            const messageData: MessageData = {
                roomId,
                username: user.username,
                message: message,
                time: getTimeMs().toString()
            };

            await socket.emit("send_message", messageData);
            try {
                const res = await postMessage(messageData.time)
            } catch (err) {
                console.log(err)
            }
            setMessageInput('')
        }
    };

    const scrollToBottom = () => {
        // @ts-ignore
        messagesEndRef?.current?.scrollIntoView({behavior: "smooth"})
    }

    const auth = async () => {
        const res = await axios.get('/api/auth/auth')
        return res.data
    }

    useEffect(() => {
        const readInitalData = async () => {
            const data = await auth()
            setUser(data)
            try {
                const res = await getChat((chat.length > 0) ? chat[0].time : getTimeMs().toString())
                setChat([...res])
            } catch (err) {
                console.log(err)
            }
            handleJoin(data.username)
            setTimeout(() => {
                scrollToBottom()
            }, 1500)
        }

        readInitalData().catch((err) => {
            if (err.response.status === 401)
                router.push('/auth/signin')
        })
    }, []);

    useEffect(() => {
        socket.on("receive_message", (data: any) => {
            console.log('received message')
            setChat((pre) => {
                if (pre.length == 0 || pre[pre.length - 1].time !== data.time)
                    return [...pre, data]

                return [...pre]
            });
        });
        socket.on("receive_image", async (data: any) => {
            console.log('received image')
            console.log((chat.length > 0) ? chat[chat.length - 1].time : getTimeMs().toString())
            const res = await getChat(getTimeMs().toString())
            console.log(res)
            setChat(res)
        });
    }, [socket]);

    const getChat = async (lastMessageTime: string) => {
        const getObject: GetMessageData = {
            roomId,
            time: getTimeMs().toString(),
            lastMessageTime: lastMessageTime
        }

        const res = await axios.post('/api/messages/get', getObject)
        return res.data
    }

    const postMessage = async (time: string) => {
        const postObject: PostMessageData = {
            message: messageInput,
            roomId,
            time: time,
        }

        const res = await axios.post('/api/messages/post', postObject)
    }

    const handleFileInputTrigger = (e: any) => {
        // @ts-ignore
        fileInputRef?.current?.click();
    }

    const handleFileInput = async (e: any) => {
        const files = e.target.files
        console.log(files)

        const fd: FormData = new FormData()

        for (let i: number = 0; i < files.length; i++)
            fd.append(files[i].name, files[i])

        fd.append('room_id', roomId)

        const res = await axios.post('/api/images/post', fd)
        console.log(res)

        await socket.emit("send_image", {
            roomId,
            count: files.length
        });
        console.log('send')
    }

    const updateChat = async (e: any) => {
        try {
            const res = await getChat((chat.length > 0) ? chat[0].time : getTimeMs().toString())
            setChat((pre: MessageData[]) => {
                return [...res.concat(pre)]
            })
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            height: '100%',
            display: 'flex',
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-evenly'
        }}>
            <ResponsiveAppBar
                username={user.username}
            />
            <Container
                sx={{
                    height: '100%',
                    marginTop: '80px',
                    marginBottom: '80px'
                }}
            >
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        width: '100%'
                    }}
                >
                    <Stack
                        direction={'column'}
                        alignItems={'center'}
                        justifyContent={"center"}
                        sx={{
                            width: '100%',
                            maxWidth: '600px',
                            borderLeft: `1px solid ${theme.palette.primary.main}`,
                            borderRight: `1px solid ${theme.palette.primary.main}`,
                            paddingTop: 1,
                            paddingLeft: 4,
                            paddingRight: 4,
                        }}
                    >

                        <Button
                            variant={'contained'}
                            color={'primary'}
                            size={'small'}
                            fullWidth
                            sx={{
                                marginBottom: 3
                            }}
                            onClick={updateChat}
                        >
                            Read more
                        </Button>
                        {
                            chat.length < 1 &&
                            <CircularProgress
                                sx={{
                                    color: theme.palette.primary.main,
                                }}
                            />
                        }
                        {
                            chat.map((item, index: number) => {
                                const itIsMe: boolean = user.username === item.username
                                const label: string = (!itIsMe ? `${item.username} - ` : '') + getFullDate(item.time)

                                if (item.path !== undefined) {
                                    return (
                                        <Stack
                                            key={index}
                                            sx={{
                                                width: '100%',
                                            }}
                                            direction={'column'}
                                            alignItems={itIsMe ? 'flex-end' : 'flex-start'}
                                            justifyContent={'center'}
                                        >
                                            <Image
                                                src={`${prefix}:3000/api/images/get/${item.path.split('/').pop()}`}
                                                height={400}
                                                width={400}
                                                alt={"Picture of the author"}
                                                style={{
                                                    width: '95%',
                                                    height: 'auto',
                                                    borderRadius: '12px',
                                                    border: `${itIsMe ? districtColor : theme.palette.primary.main} 2px solid`,
                                                    marginBottom: '5px',
                                                    marginTop: '10px'
                                                }}
                                                quality={100}
                                            />
                                            <Stack
                                                key={index}
                                                sx={{
                                                    width: '90%',
                                                }}
                                                direction={'row'}
                                                alignItems={'center'}
                                                justifyContent={'flex-start'}
                                            >
                                                <FormHelperText
                                                    sx={{
                                                        marginBottom: '5px',
                                                        marginLeft: !itIsMe ? '20px' : '0px'
                                                    }}
                                                >
                                                    {label}
                                                </FormHelperText>
                                            </Stack>
                                        </Stack>
                                    )
                                }

                                return (
                                    <Stack
                                        key={index}
                                        sx={{
                                            width: '100%',
                                        }}
                                        direction={'row'}
                                        alignItems={'center'}
                                        justifyContent={itIsMe ? 'flex-end' : 'flex-start'}
                                    >
                                        <TextField
                                            id="outlined-multiline"
                                            size={'small'}
                                            margin={'dense'}
                                            helperText={label}
                                            value={item.message}
                                            multiline
                                            disabled
                                            sx={{
                                                width: '60%',
                                                WebkitTextFillColor: `${theme.palette.secondary.light} !important`,
                                                "& .MuiInputBase-input.Mui-disabled": {
                                                    WebkitTextFillColor: theme.palette.primary.dark,
                                                },
                                                '.mui-15jix3j-MuiInputBase-root-MuiOutlinedInput-root': {
                                                    border: `${itIsMe ? districtColor : theme.palette.primary.main} 2px solid`,
                                                    borderRadius: 1,
                                                },
                                                '.mui-k4qjio-MuiFormHelperText-root.Mui-disabled': {
                                                    WebkitTextFillColor: theme.palette.primary.dark
                                                }
                                            }}
                                        />
                                    </Stack>
                                )
                            })
                        }
                        {/*@ts-ignore*/}
                        <div ref={messagesEndRef}/>
                    </Stack>
                </Stack>
            </Container>
            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0, left: 0, right: 0,
                    background: theme.palette.primary.main,
                    boxShadow: 20,
                    borderRadius: 0,
                    padding: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                elevation={10}
            >
                <Stack
                    direction={'row'}
                    alignItems={'flex-end'}
                    justifyContent={'space-between'}
                    sx={{
                        width: '100%',
                        maxWidth: '600px'
                    }}
                >
                    <Button
                        variant="outlined"
                        color={'secondary'}
                        sx={{
                            height: '40px',
                            marginRight: 1,
                            marginBottom: 0.2
                        }}
                        onClick={handleFileInputTrigger}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{display: 'none'}}
                            onChange={handleFileInput}
                            multiple={true}
                            accept={"image/*"}
                        />
                        <CameraAltOutlinedIcon
                            sx={{
                                fontSize: '25px',
                            }}
                        />
                    </Button>
                    <TextField
                        sx={{
                            '.mui-12tl3rr-MuiInputBase-input-MuiOutlinedInput-input': {
                                color: theme.palette.secondary.light,
                            },
                            '.mui-td8dxa-MuiInputBase-root-MuiOutlinedInput-root': {
                                border: `1px solid ${theme.palette.secondary.light}`,
                            },
                        }}
                        onChange={(e: any) => {
                            setMessageInput(e.target.value)
                        }}
                        value={messageInput}
                        id="outlined-multiline-flexible"
                        size={'small'}
                        color={'secondary'}
                        multiline
                        fullWidth
                    />
                    <Button
                        variant="outlined"
                        color={'secondary'}
                        sx={{
                            height: '40px',
                            marginLeft: 1,
                            marginBottom: 0.2
                        }}
                        onClick={sendData}
                    >
                        <SendOutlinedIcon
                            sx={{
                                fontSize: '25px',
                            }}
                        />
                    </Button>
                </Stack>
            </Paper>
        </Box>
    )
}