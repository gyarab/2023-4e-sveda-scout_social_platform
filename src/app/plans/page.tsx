'use client'
import {
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    FormHelperText,
    OutlinedInput,
    Select,
    SelectChangeEvent,
    Stack,
    TextField,
} from "@mui/material";
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React, {useEffect, useRef, useState} from "react";
import Box from "@mui/material/Box";
import {EventData, FetchError, User} from "@/utils/interfaces";
import CreateIcon from '@mui/icons-material/Create';
import Button from "@mui/material/Button";
import axios from "axios";
import {useRouter} from "next/navigation";
import CancelIcon from "@mui/icons-material/Cancel";
import MenuItem from "@mui/material/MenuItem";
import {DatePicker, LocalizationProvider, PickerValidDate, renderTimeViewClock, TimePicker} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import {getTimeMillisecondsFromDate, getTimeMs} from "@/utils/utils";

export default function MessagesMenu() {
    const eventNameRef = useRef(null);
    const eventDescriptionRef = useRef(null);

    const [open, setOpen] = useState<boolean>(false);
    const [usernames, setUsernames] = useState<string[]>([])
    const [memberValues, setMemberValues] = useState<string[]>([])
    const [voteOptions, setVoteOptions] = useState<number[]>([0])
    const [voteEndingTime, setVoteEndingTime] = useState<number>(0)

    const [eventnameError, setEventnameError] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const [descriptionError, setDescriptionError] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const [participantsError, setParticipantsError] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const [voteEndingTimeError, setVoteEndingTimeError] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const [voteOptionsError, setVoteOptionsError] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const [user, setUser] = useState<User>({
        username: '',
        nickname: '',
        email: '',
    })

    const router = useRouter()

    const getPlans = async () => {
        const res = await axios.get('')
        return res.data
    }

    const getUsernames = async () => ((await axios.get('/api/messages/usernames')).data)

    useEffect(() => {
        const fetchData = async () => {
            //const data = await getLists()
            const usernamesFetch = await getUsernames()
            setUsernames(usernamesFetch)
        }

        fetchData().catch((err) => {
            if (err.response.status === 401)
                router.push('/auth/signin')
        })
    }, []);

    const handleClose = () => setOpen(false)
    const handleOpen = () => setOpen(true)

    const handleMemberAdd = (event: SelectChangeEvent<typeof memberValues>) => {
        const {target: {value}} = event;
        setMemberValues(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleDeleteChip = (e: any, selected: string): void => {
        setMemberValues((prevState: string[]) => {
            const index: number = prevState.indexOf(selected)
            if (index !== -1)
                prevState.splice(prevState.indexOf(selected), 1)

            console.log(prevState)
            return [...prevState]
        })
    }

    const handleVoteOptionAdd = (): void => {
        if (voteOptions.length > 0 && voteOptions[voteOptions.length - 1] === 0)
            return

        setVoteOptions((prevState: number[]) => [...prevState, 0])
    }

    const handleVoteOptionRemove = (): void => {
        if (voteOptions.length > 1) {
            setVoteOptions((prevState: number[]) => {
                prevState.pop()
                return [...prevState]
            })
        }
    }

    const handleDateChange = (e: any, index: number): void => {
        const time: number = new Date(e.$d).getTime()

        setVoteOptions((prevState: number[]) => {
            let prevDateMs: number = 0
            if (prevState[index] !== 0)
                prevDateMs = getTimeMillisecondsFromDate(new Date(prevState[index]))

            prevState[index] = time + prevDateMs
            return [...prevState]
        })
    }

    const handleTimeChange = (e: any, index: number): void => {
        const newDateMs: number = getTimeMillisecondsFromDate(new Date(e.$d))

        setVoteOptions((prevState: number[]) => {
            let prevDate: Date = new Date(prevState[index])
            prevDate = new Date(prevDate.getTime() - getTimeMillisecondsFromDate(prevDate) + newDateMs)
            prevState[index] = prevDate.getTime()
            return [...prevState]
        })
    }

    const handleVoteEndingDate = (e: any): void => {
        const time: number = new Date(e.$d).getTime()

        setVoteEndingTime((prevState: number) => {
            let prevDateMs: number = 0
            if (prevState !== 0)
                prevDateMs = getTimeMillisecondsFromDate(new Date(prevState))

            return time + prevDateMs
        })
    }

    const handleVoteEndingTime = (e: any): void => {
        const newDateMs: number = getTimeMillisecondsFromDate(new Date(e.$d))

        setVoteEndingTime((prevState: number) => {
            let prevDate: Date = new Date(prevState)
            prevDate = new Date(prevDate.getTime() - getTimeMillisecondsFromDate(prevDate) + newDateMs)
            return prevDate.getTime()
        })
    }

    const setError = (error: any) => {
        switch (error.where) {
            case 'eventname':
                setEventnameError({
                    isErr: true,
                    message: error.message
                })
                break
            case 'description':
                setDescriptionError({
                    isErr: true,
                    message: error.message
                })
                break
            case 'participants':
                setParticipantsError({
                    isErr: true,
                    message: error.message
                })
                break
            case 'voteEndingTime':
                setVoteEndingTimeError({
                    isErr: true,
                    message: error.message
                })
                break
            case 'voteOptions':
                setVoteOptionsError({
                    isErr: true,
                    message: error.message
                })
                break
            default:
                console.log('unknown error')
        }
    }

    const clearAllErrors = () => {
        setEventnameError({
            isErr: false,
            message: ''
        })
        setDescriptionError({
            isErr: false,
            message: ''
        })
        setParticipantsError({
            isErr: false,
            message: ''
        })
        setVoteEndingTimeError({
            isErr: false,
            message: ''
        })
        setVoteOptionsError({
            isErr: false,
            message: ''
        })
    }

    const handleEventSubmit = async (e: any) => {
        clearAllErrors()

        const eventData: EventData = {
            // @ts-ignore
            eventname: eventNameRef?.current?.value,
            // @ts-ignore
            description: eventDescriptionRef?.current?.value,
            participants: memberValues,
            voteEndingTime: voteEndingTime,
            voteOptions: voteOptions
        }

        axios.post('/api/events/post', eventData).then(res => {
            console.log(res)
        }).catch(err => {
            console.log(err.response)
            if (err.response.status === 401)
                router.push('/auth/signin')
            else if (err.response.status === 400)
                setError(err.response.data)
        })
    }

    return (
        <Box sx={{
            minHeight: '100vh',
            height: '100%',
            display: 'flex',
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
        }}>
            <ResponsiveAppBar
                username={user.username}
            />
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                sx={{
                    borderRadius: 2,
                    boxShadow: 20,
                    minHeight: '100vh',
                    height: '100%',
                }}
            >
                <DialogTitle
                    id="alert-dialog-title"
                    sx={{
                        textAlign: 'center'
                    }}
                >
                    Create new chat
                </DialogTitle>
                <DialogContent
                    sx={{
                        width: '100%',
                        maxWidth: '484px'
                    }}
                >
                    <TextField
                        inputRef={eventNameRef}
                        margin="dense"
                        required
                        fullWidth
                        id="eventname"
                        label="Event name"
                        name="eventname"
                        autoFocus
                    />
                    <FormHelperText
                        error={eventnameError.isErr}
                        sx={{
                            marginLeft: 1,
                            marginBottom: 1,
                            width: '100%'
                        }}
                    >
                        {eventnameError.message}
                    </FormHelperText>

                    <TextField
                        inputRef={eventDescriptionRef}
                        margin="dense"
                        sx={{
                            marginBottom: 1
                        }}
                        fullWidth
                        id="description"
                        label="Description"
                        name="description"
                        autoFocus
                    />
                    <FormHelperText
                        error={descriptionError.isErr}
                        sx={{
                            marginLeft: 1,
                            marginBottom: 1,
                            width: '100%'
                        }}
                    >
                        {descriptionError.message}
                    </FormHelperText>

                    <FormHelperText
                        sx={{
                            marginLeft: 1,
                        }}
                    >
                        Select participants:
                    </FormHelperText>
                    <Select
                        value={memberValues}
                        id="grouped-select"
                        labelId="grouped-select-label"
                        fullWidth
                        multiple
                        sx={{
                            marginBottom: 0.5
                        }}
                        onChange={handleMemberAdd}
                        input={<OutlinedInput id="select-multiple-chip" label="Chip"/>}
                        renderValue={(selected) => (
                            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                                {selected.map((value) => (
                                    <Chip
                                        key={value}
                                        label={value}
                                        deleteIcon={
                                            <CancelIcon
                                                onMouseDown={(e: any) => e.stopPropagation()}
                                            />
                                        }
                                        onDelete={(e: any) => handleDeleteChip(e, value)}
                                    />
                                ))}
                            </Box>
                        )}
                    >
                        {
                            usernames.map((username: string, index: number) => {
                                return (
                                    <MenuItem
                                        key={index}
                                        value={username}
                                    >
                                        {username}
                                    </MenuItem>
                                )
                            })
                        }
                    </Select>
                    <FormHelperText
                        error={participantsError.isErr}
                        sx={{
                            marginLeft: 1,
                            marginBottom: 1.5,
                            width: '100%'
                        }}
                    >
                        {participantsError.message}
                    </FormHelperText>

                    <FormHelperText
                        sx={{
                            marginLeft: 1,
                            marginTop: 1
                        }}
                    >
                        Select date and time of vote ending:
                    </FormHelperText>
                    <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        sx={{
                            width: '100%',
                            marginBottom: 0.5,
                        }}
                    >
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                onChange={handleVoteEndingDate}
                                shouldDisableDate={(date: PickerValidDate) => {
                                    // @ts-ignore
                                    date = new Date(date.$d);
                                    // @ts-ignore
                                    return date.getTime() < getTimeMs() && new Date(getTimeMs()).toDateString() !== date.toDateString()
                                }}
                                sx={{
                                    width: '100%',
                                    margin: 0.5
                                }}
                            />
                        </LocalizationProvider>
                        {
                            voteEndingTime !== 0 &&
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <TimePicker
                                    sx={{
                                        width: '100%',
                                        margin: 0.5
                                    }}
                                    onChange={handleVoteEndingTime}
                                    viewRenderers={{
                                        hours: renderTimeViewClock,
                                        minutes: renderTimeViewClock,
                                        seconds: renderTimeViewClock,
                                    }}
                                />
                            </LocalizationProvider>
                        }
                    </Stack>
                    <FormHelperText
                        error={voteEndingTimeError.isErr}
                        sx={{
                            marginLeft: 1,
                            marginBottom: 1.5,
                            width: '100%'
                        }}
                    >
                        {voteEndingTimeError.message}
                    </FormHelperText>

                    {
                        voteEndingTime !== 0 && <>
                            <FormHelperText
                                sx={{
                                    marginLeft: 1,
                                    marginTop: 1
                                }}
                            >
                                Create your date and time options:
                            </FormHelperText>
                            <Stack
                                direction={'column'}
                                alignItems={'center'}
                                justifyContent={'center'}
                            >
                                {
                                    voteOptions.map((vote, index: number) => {
                                        return (
                                            <Stack
                                                key={index}
                                                direction={{xs: 'column', sm: 'row'}}
                                                alignItems={'center'}
                                                justifyContent={'space-between'}
                                                sx={{
                                                    width: '100%',
                                                    marginBottom: 0.5,
                                                }}
                                            >
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DatePicker
                                                        onChange={(e) => handleDateChange(e, index)}
                                                        shouldDisableDate={(date: PickerValidDate) => {
                                                            // @ts-ignore
                                                            date = new Date(date.$d);
                                                            // @ts-ignore
                                                            return date.getTime() < voteEndingTime && new Date(voteEndingTime).toDateString() !== date.toDateString()
                                                        }}
                                                        sx={{
                                                            width: '100%',
                                                            margin: 0.5
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                                {
                                                    voteOptions[index] !== 0 &&
                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                        <TimePicker
                                                            sx={{
                                                                width: '100%',
                                                                margin: 0.5,
                                                            }}
                                                            onChange={(e) => handleTimeChange(e, index)}
                                                            viewRenderers={{
                                                                hours: renderTimeViewClock,
                                                                minutes: renderTimeViewClock,
                                                                seconds: renderTimeViewClock,
                                                            }}
                                                        />
                                                    </LocalizationProvider>
                                                }
                                            </Stack>
                                        )
                                    })
                                }
                                <FormHelperText
                                    error={voteOptionsError.isErr}
                                    sx={{
                                        marginLeft: 2.5,
                                        marginBottom: 1,
                                        width: '100%'
                                    }}
                                >
                                    {voteOptionsError.message}
                                </FormHelperText>

                                <Stack
                                    direction={'column'}
                                    alignItems={'center'}
                                    justifyContent={'space-between'}
                                    sx={{
                                        width: '100%',
                                    }}
                                >
                                    <Button
                                        variant={'outlined'}
                                        fullWidth
                                        sx={{
                                            margin: 0.5
                                        }}
                                        onClick={handleVoteOptionRemove}
                                    >
                                        Remove last
                                    </Button>
                                    <Button
                                        variant={'outlined'}
                                        fullWidth
                                        sx={{
                                            margin: 0.5
                                        }}
                                        onClick={handleVoteOptionAdd}
                                    >
                                        Add option
                                    </Button>
                                </Stack>
                            </Stack>
                        </>
                    }
                </DialogContent>
                <DialogActions
                    sx={{
                        paddingRight: '24px',
                        paddingLeft: '24px',
                        paddingBottom: '24px'
                    }}
                >
                    <Button
                        variant={'contained'}
                        onClick={handleEventSubmit}
                        fullWidth
                    >
                        Submit
                    </Button>
                </DialogActions>
            </Dialog>
            <Container sx={{height: '100%', marginTop: '70px', marginBottom: '70px'}}>
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        width: '100%',
                    }}
                >

                </Stack>
            </Container>
            <Fab
                size="medium"
                color="primary"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16
                }}
                aria-label="add"
                onClick={handleOpen}
            >
                <CreateIcon/>
            </Fab>
        </Box>
    )
        ;
}