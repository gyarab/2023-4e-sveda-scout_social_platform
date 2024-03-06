'use client'
import * as React from 'react';
import {useRef, useState} from 'react';
import {Card, CardActions, CardContent, Container, Stack, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import theme from "@/components/ThemeRegistry/theme";
import Button from "@mui/material/Button";
import axios from "axios";
import {FetchError, SignUpUserData} from "@/utils/interfaces";
import {useRouter} from "next/navigation";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function SignUp() {
    const usernameRef = useRef('');
    const nicnameRef = useRef('');
    const emailRef = useRef('');
    const passwordRef = useRef('');
    const passwordAgainRef = useRef('');

    const [userData, setUserData] = useState<SignUpUserData>({
        username: '',
        nickname: '',
        email: '',
        password: '',
        passwordAgain: ''
    })

    const [usernameErr, setUsernameErr] = useState<FetchError>({
        isErr: false,
        message: ''
    })
    const [nicknameErr, setNicknameErr] = useState<FetchError>({
        isErr: false,
        message: ''
    })
    const [emailErr, setEmailErr] = useState<FetchError>({
        isErr: false,
        message: ''
    })
    const [passwordErr, setPasswordErr] = useState<FetchError>({
        isErr: false,
        message: ''
    })
    const [passwordAgainErr, setPasswordAgainErr] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const router: AppRouterInstance = useRouter()


    const markErr = (destination: string, message: string) => {
        switch (destination) {
            case "username": {
                setUsernameErr({
                    isErr: true,
                    message: message
                })
                break
            }
            case "nickname": {
                setNicknameErr({
                    isErr: true,
                    message: message
                })
                break
            }
            case "email": {
                setEmailErr({
                    isErr: true,
                    message: message
                })
                break
            }
            case "password": {
                setPasswordErr({
                    isErr: true,
                    message: message
                })
                break
            }
            case "passwordAgain": {
                setPasswordAgainErr({
                    isErr: true,
                    message: message
                })
                break
            }
            default: {
                console.log("Error hasn't been set")
            }
        }
    }

    const resetAllErrs = () => {
        setUsernameErr({isErr: false, message: ''})
        setNicknameErr({isErr: false, message: ''})
        setEmailErr({isErr: false, message: ''})
        setPasswordErr({isErr: false, message: ''})
        setPasswordAgainErr({isErr: false, message: ''})
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        resetAllErrs()

        const user: SignUpUserData = {
            // @ts-ignore
            username: usernameRef.current.value,
            // @ts-ignore
            nickname: nicnameRef.current.value,
            // @ts-ignore
            email: emailRef.current.value,
            // @ts-ignore
            password: passwordRef.current.value,
            // @ts-ignore
            passwordAgain: passwordAgainRef.current.value
        }

        setUserData(user)

        axios.post('/api/auth/signup', user).then((res) => {
            router.push('/')
        }).catch((err) => {
            const errData = err.response.data

            if (err.response.status === 401 && !errData.ok)
                markErr(errData.where, errData.message)

            console.log(errData)
        })

        //console.log(user)
    }

    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter')
            handleSubmit(e)
    }

    return (
        <Container
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Card
                sx={{
                    borderRadius: 2,
                    backgroundColor: theme.palette.secondary.light,
                    boxShadow: 20,
                    maxWidth: '484px',
                    marginTop: 4,
                    marginBottom: 4,
                }}
            >
                <CardContent>
                    <Typography
                        variant={'h1'}
                        sx={{
                            fontSize: '48px',
                            padding: 2,
                            textAlign: 'center'
                        }}
                        fontWeight={400}
                    >
                        Sign Up
                    </Typography>
                    <TextField
                        error={usernameErr.isErr}
                        helperText={usernameErr.message}
                        inputRef={usernameRef}
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoFocus
                        onKeyDown={handleKeyDown}
                    />
                    <TextField
                        inputRef={nicnameRef}
                        margin="normal"
                        fullWidth
                        id="nickname"
                        label="Nickname"
                        name="nickname"
                        onKeyDown={handleKeyDown}
                    />
                    <TextField
                        error={emailErr.isErr}
                        helperText={emailErr.message}
                        inputRef={emailRef}
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email"
                        name="email"
                        onKeyDown={handleKeyDown}
                    />
                    <TextField
                        error={passwordErr.isErr}
                        helperText={passwordErr.message}
                        inputRef={passwordRef}
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        onKeyDown={handleKeyDown}
                    />
                    <TextField
                        error={passwordAgainErr.isErr}
                        helperText={passwordAgainErr.message}
                        inputRef={passwordAgainRef}
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        onKeyDown={handleKeyDown}
                    />
                </CardContent>
                <CardActions
                    sx={{
                        padding: 2
                    }}
                >
                    <Stack
                        flexDirection={'column'}
                        sx={{
                            width: '100%'
                        }}
                        spacing={2}
                    >
                        <Button
                            variant={'contained'}
                            type={'submit'}
                            onClick={(e) => handleSubmit(e)}
                        >
                            SignUp
                        </Button>
                        <Button
                            href={'/auth/signin'}
                            variant={'text'}
                            sx={{
                                textAlign: 'center'
                            }}
                        >
                            Already have an account?
                        </Button>
                    </Stack>
                </CardActions>
            </Card>
        </Container>
    );
}