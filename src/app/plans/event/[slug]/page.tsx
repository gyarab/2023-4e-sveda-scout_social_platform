'use client'
import {Container, Stack, TextField,} from "@mui/material";
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React, {useEffect, useMemo, useState} from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios from "axios";
import {EventDataDisplay, User} from "@/utils/interfaces";
import {useRouter} from "next/navigation";
import theme from "@/components/ThemeRegistry/theme";
import EventDataDisplayVoteOptions from "@/components/list_items/EventDataDisplayVoteOptions";
import {getFullDate} from "@/utils/utils";

export default function EventPage({params}: { params: { slug: string } }) {
    const [user, setUser] = useState<User>({
        username: '',
        nickname: '',
        email: '',
    })

    const eventId: string = useMemo(() => params.slug, [params])

    const [eventData, setEventData] = useState<EventDataDisplay>({
        eventname: '',
        description: '',
        voteendingtime: '',
        happeningtime: '',
        participants: [],
        voteOptions: [],
    })

    const router = useRouter()


    useEffect(() => {
        axios.get('/api/auth/auth').then(res => {
            console.log(res)
            setUser(res.data)
        }).catch(err => {
            if (err?.response?.status === 401)
                router.push('/auth/signin')
        })

        axios.post('/api/events/get', {eventId: eventId}).then(res => {
            console.log(res)
            setEventData(res.data)
        }).catch(err => {
            if (err?.response?.status === 401)
                router.push('/auth/signin')
            else if (err?.response?.status === 400)
                console.log(err?.response?.data)
        })
    }, []);

    const handleVote = async (index: number, vote: number) => {
        setEventData((prevState: EventDataDisplay) => {
            const newState: EventDataDisplay = {...prevState}
            newState.voteOptions[index].vote = vote

            return newState
        })

        const res = await axios.post('/api/events/vote', {
            eventId: eventId,
            vote: vote,
            time: eventData.voteOptions[index].time
        })
    }

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
            <Container
                sx={{
                    height: '100%',
                    display: 'flex',
                    marginTop: '100px',
                    marginBottom: '50px',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stack
                    direction={'column'}
                    spacing={2}
                    sx={{
                        width: '100%',
                        backgroundColor: theme.palette.secondary.light,
                        borderRadius: 2,
                        padding: 3,
                        maxWidth: '800px',
                        boxShadow: 8
                    }}
                    justifyContent={'center'}
                    alignItems={'center'}
                >
                    <Typography
                        variant={'h1'}
                        sx={{
                            fontSize: '38px',
                            fontWeight: '400'
                        }}
                    >
                        {eventData.eventname}
                    </Typography>

                    {
                        eventData.description !== null && eventData.description !== '' &&
                        <TextField
                            margin="dense"
                            aria-readonly
                            value={eventData.description}
                            sx={{
                                marginBottom: 1
                            }}
                            fullWidth
                            id="description"
                            label="Description"
                            name="description"
                            focused
                            multiline
                        />
                    }

                    <TextField
                        margin="dense"
                        aria-readonly
                        value={eventData.participants.join(', ')}
                        sx={{
                            marginBottom: 1
                        }}
                        fullWidth
                        id="participans"
                        label="Participans"
                        name="participans"
                        focused
                        multiline
                    />

                    {
                        eventData.happeningtime !== null && eventData.happeningtime !== '' &&
                        <TextField
                            margin="dense"
                            aria-readonly
                            value={getFullDate(eventData.happeningtime)}
                            sx={{
                                marginBottom: 1
                            }}
                            fullWidth
                            id="happensOn"
                            label="Happens on"
                            name="happensOn"
                            focused
                            multiline
                        />
                    }

                    {
                        (eventData.happeningtime === null || eventData.happeningtime === '') &&
                        <>
                            <TextField
                                margin="dense"
                                aria-readonly
                                value={eventData.voteendingtime !== '' ? getFullDate(eventData.voteendingtime) : ''}
                                sx={{
                                    marginBottom: 1
                                }}
                                fullWidth
                                id="votingEndsOn"
                                label="Voting ends on"
                                name="votingEndsOn"
                                focused
                                multiline
                            />

                            {
                                eventData.voteOptions.map((option, index) => {
                                    return (
                                        <EventDataDisplayVoteOptions
                                            key={index}
                                            vote={option.vote}
                                            time={option.time}
                                            index={index}
                                            click={(index: number, vote: number) => handleVote(index, vote)}
                                        />
                                    )
                                })
                            }
                        </>
                    }
                </Stack>
            </Container>
        </Box>
    );
}