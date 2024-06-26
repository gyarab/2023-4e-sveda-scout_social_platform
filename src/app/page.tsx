'use client'
import {Card, CardActions, CardContent, Container, Stack,} from "@mui/material";
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React, {useEffect, useState} from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import axios from "axios";
import {User} from "@/utils/interfaces";
import {useRouter} from "next/navigation";

export default function MultiActionAreaCard() {
    const [user, setUser] = useState<User>({
        username: '',
        nickname: '',
        email: '',
    })

    const router = useRouter()

    useEffect(() => {
        const checkAuth = async () => {
            const fetchAuth = await axios.get('/api/auth/auth')
            setUser(fetchAuth.data)
        }

        checkAuth().catch((err) => {
            if (err?.response?.status === 401)
                router.push('/auth/signin')
        })
    }, []);

    console.log(user)


    return (
        <Box
            sx={{
                minHeight: '100vh',
                height: '100%',
                display: 'flex',
                width: '100%',
                flexDirection: 'column',
                justifyContent: 'space-evenly'
            }}
        >
            <ResponsiveAppBar
                username={user.username}
            />
            <Container sx={{height: '100%', display: 'flex', marginTop: '100px', marginBottom: '50px'}}>
                <Stack
                    direction={'column'}
                    spacing={2}
                    sx={{width: '100%'}}
                    justifyContent={'center'}
                    alignItems={'center'}
                >
                    <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={2}
                        justifyContent={"center"}
                        alignItems={"center"}
                    >
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: 8
                            }}
                        >
                            <CardContent>
                                <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                    Word of the Day
                                </Typography>
                                <Typography variant="h5" component="div">
                                    benevolent1
                                </Typography>
                                <Typography sx={{mb: 1.5}} color="text.secondary">
                                    adjective
                                </Typography>
                                <Typography variant="body2">
                                    well meaning and kindly.
                                    {'"a benevolent smile"'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small">Learn More</Button>
                            </CardActions>
                        </Card>
                        <Card
                            sx={{borderRadius: 2, boxShadow: 8}}
                        >
                            <CardContent>
                                <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                    Word of the Day
                                </Typography>
                                <Typography variant="h5" component="div">
                                    benevolent2
                                </Typography>
                                <Typography sx={{mb: 1.5}} color="text.secondary">
                                    adjective
                                </Typography>
                                <Typography variant="body2">
                                    well meaning and kindly.
                                    {'"a benevolent smile"'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small">Learn More</Button>
                            </CardActions>
                        </Card>
                    </Stack>
                    <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={2}
                        justifyContent={"center"}
                        alignItems={"center"}
                    >
                        <Card
                            sx={{borderRadius: 2, boxShadow: 8}}
                        >
                            <CardContent>
                                <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                    Word of the Day
                                </Typography>
                                <Typography variant="h5" component="div">
                                    benevolent3
                                </Typography>
                                <Typography sx={{mb: 1.5}} color="text.secondary">
                                    adjective
                                </Typography>
                                <Typography variant="body2">
                                    well meaning and kindly.
                                    {'"a benevolent smile"'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small">Learn More</Button>
                            </CardActions>
                        </Card>
                        <Card
                            sx={{borderRadius: 2, boxShadow: 8}}
                        >
                            <CardContent>
                                <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                    Word of the Day
                                </Typography>
                                <Typography variant="h5" component="div">
                                    benevolent4
                                </Typography>
                                <Typography sx={{mb: 1.5}} color="text.secondary">
                                    adjective
                                </Typography>
                                <Typography variant="body2">
                                    well meaning and kindly.
                                    {'"a benevolent smile"'}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small">Learn More</Button>
                            </CardActions>
                        </Card>
                    </Stack>
                </Stack>
            </Container>
        </Box>
    );
}