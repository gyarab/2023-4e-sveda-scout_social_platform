'use client'
import * as React from 'react';
import {useRef, useState} from 'react';
import {Card, CardActions, CardContent, Container, Stack, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import theme from "@/components/ThemeRegistry/theme";
import Button from "@mui/material/Button";
import {LogInUserData, SignError} from "@/utils/interfaces";
import {AppRouterInstance} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {useRouter} from "next/navigation";
import axios from "axios";

export default function SignIn() {
    const usernameRef = useRef('')
    const passwordRef = useRef('')

    const [usernameErr, setUsernameErr] = useState<SignError>({
        isErr: false,
        message: ''
    })
    const [passwordErr, setPasswordErr] = useState<SignError>({
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
            case "password": {
                setPasswordErr({
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
        setPasswordErr({isErr: false, message: ''})
    }

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        resetAllErrs()

        const user: LogInUserData = {
            // @ts-ignore
            username: usernameRef.current.value,
            // @ts-ignore
            password: passwordRef.current.value,
        }

        axios.post('/api/auth/signin', user).then((res) => {
            router.push('/')
        }).catch((err) => {
            const errData = err.response.data

            if (err.response.status === 401 && !errData.ok)
                markErr(errData.where, errData.message)

            console.log(errData)
        })

        console.log(user)
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
                        Sign In
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
                        autoComplete="username"
                        autoFocus
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
                        autoComplete="current-password"
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
                            onClick={handleSubmit}
                        >
                            SignIn
                        </Button>
                        <Button
                            href={'/auth/signup'}
                            variant={'text'}
                            sx={{
                                textAlign: 'center'
                            }}
                        >
                            Create an account?
                        </Button>
                    </Stack>
                </CardActions>
            </Card>
        </Container>
    );
}