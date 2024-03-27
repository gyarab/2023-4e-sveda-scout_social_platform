'use client'
import {
    BottomNavigation,
    BottomNavigationAction,
    Chip,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    FormHelperText,
    List,
    OutlinedInput,
    Paper,
    Select,
    SelectChangeEvent,
    Stack,
    TextField,
} from "@mui/material";
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React, {useEffect, useRef, useState} from "react";
import Box from "@mui/material/Box";
import Diversity2OutlinedIcon from '@mui/icons-material/Diversity2Outlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import theme from "@/components/ThemeRegistry/theme";
import ChatListItem from "@/components/Messages/ChatListItem";
import {ChatListItemProps, CreateNewChatData, FetchError, User} from "@/utils/interfaces";
import CreateIcon from '@mui/icons-material/Create';
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import CancelIcon from "@mui/icons-material/Cancel";
import axios from "axios";
import {useRouter} from "next/navigation";
import {directColor, districtColor, getFullDate, groupColor, troopColor} from "@/utils/utils";
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

export default function MessagesMenu() {
    const chatNameRef = useRef(null);

    const [typeValue, setTypeValue] = useState<string>('direct')
    const [memberValues, setMemberValues] = useState<string[]>([])
    const [bottomMenuValue, setBottomMenuValue] = useState<number>(0);
    const [open, setOpen] = useState<boolean>(false);
    const [usernames, setUsernames] = useState<string[]>([])

    const [directList, setDirectList] = useState([])
    const [troopList, setTroopList] = useState([])
    const [groupList, setGroupList] = useState([])
    const [districtList, setDistrictList] = useState([])

    const [newChatErr, setNewChatErr] = useState<FetchError>({
        isErr: false,
        message: ''
    })

    const [user, setUser] = useState<User>({
        username: '',
        nickname: '',
        email: '',
    })

    const router = useRouter()

    const getLists = async () => ((await axios.get('/api/messages/chatlist')).data)

    const getUsernames = async () => ((await axios.get('/api/messages/usernames')).data)

    useEffect(() => {
        const fetchData = async () => {
            const listsFetch = await getLists()
            setDirectList(listsFetch.directs)
            setTroopList(listsFetch.troops)
            setGroupList(listsFetch.groups)
            setDistrictList(listsFetch.districts)

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

    const listMessages = (selection: number) => {
        let list: any[] = []

        if (selection === 0)
            list = directList.concat(troopList).concat(groupList).concat(districtList)
        else if (selection === 1)
            list = troopList.concat(directList).concat(groupList).concat(districtList)
        else if (selection === 2)
            list = groupList.concat(directList).concat(troopList).concat(districtList)
        else if (selection === 3)
            list = districtList.concat(directList).concat(troopList).concat(groupList)

        return (
            <>
                {
                    list.map((item, index: number) => {
                        let color: string = directColor

                        if (item.type === 'troop')
                            color = troopColor
                        else if (item.type === 'group')
                            color = groupColor
                        else if (item.type === 'district')
                            color = districtColor


                        const props: ChatListItemProps = {
                            avatar: {
                                username: 'Travis Howard',
                                image: '/static/images/avatar/2.jpg'
                            },
                            text: {
                                primary: item.name,
                                edited_on: getFullDate(item.edited_on)
                            },
                            badge: {
                                color: color
                            },
                            click: (): void => {
                                router.push(`/messages/chat/${item.room_id}`)
                            }
                        }

                        return <ChatListItem key={index} {...props}/>
                    })
                }
            </>
        )
    }

    const handleMemberAdd = (event: SelectChangeEvent<typeof memberValues>) => {
        const {target: {value}} = event;
        setMemberValues(
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleDelete = (e: any, selected: string) => {
        setMemberValues((prevState: string[]) => {
            const index = prevState.indexOf(selected)
            if (index !== -1)
                prevState.splice(prevState.indexOf(selected), 1)

            console.log(prevState)
            return [...prevState]
        })
    }

    const handleTypeChatChange = (e: SelectChangeEvent<string>) => {
        const newTypeValue = e.target.value

        setTypeValue(newTypeValue);

        if (memberValues.length > 1 && newTypeValue === 'direct') {
            setMemberValues(prevState => {
                const newValues = [prevState[0]]
                return [...newValues]
            })
        }
    }

    const handleCreateNewChat = async () => {
        setNewChatErr({
            isErr: false,
            message: ''
        })

        const newChat: CreateNewChatData = {
            // @ts-ignore
            name: chatNameRef?.current?.value,
            type: typeValue,
            members: memberValues
        }

        let isErr: boolean = false
        axios.post('/api/messages/createchat', newChat).then((res) => {
            console.log(res)
            handleClose()
            const fetchData = async () => {
                const data = await getLists()
                setDirectList(data.directs)
                setTroopList(data.troops)
                setGroupList(data.groups)
                setDistrictList(data.districts)
            }

            fetchData().catch((err) => {
                console.log(err)
            })
        }).catch((err) => {
            const errData = err.response.data

            if (err.response.status === 401) {
                isErr = true
                setNewChatErr({
                    isErr: true,
                    message: errData.message,
                })
            }
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
                    {
                        typeValue !== 'direct' &&
                        <TextField
                            inputRef={chatNameRef}
                            margin="normal"
                            required
                            fullWidth
                            id="chatname"
                            label="Chatname"
                            name="chatname"
                            autoFocus
                        />
                    }
                    <Select
                        error={newChatErr.isErr}
                        labelId="simple-select-helper-label"
                        id="simple-select-helper"
                        defaultValue={'direct'}
                        onChange={handleTypeChatChange}
                        fullWidth
                    >
                        <MenuItem value={'direct'}>Direct</MenuItem>
                        <MenuItem value={'troop'}>Troop</MenuItem>
                        <MenuItem value={'group'}>Group</MenuItem>
                        <MenuItem value={'district'}>District</MenuItem>
                    </Select>
                    <FormHelperText
                        error={newChatErr.isErr}
                        sx={{
                            marginLeft: 1,
                            marginBottom: 1
                        }}
                    >
                        {newChatErr.message}
                    </FormHelperText>
                    <Select
                        value={memberValues}
                        id="grouped-select"
                        labelId="grouped-select-label"
                        fullWidth
                        multiple={typeValue !== 'direct'}
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
                                        onDelete={(e: any) => handleDelete(e, value)}
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
                        onClick={handleCreateNewChat}
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
                    <List
                        sx={{
                            width: '100%',
                            maxWidth: 500,
                            backgroundColor: theme.palette.background.default,
                        }}
                    >
                        {
                            listMessages(bottomMenuValue)
                        }
                    </List>
                </Stack>
            </Container>
            <Fab
                size="medium"
                color="primary"
                sx={{
                    position: 'fixed',
                    bottom: 72,
                    right: 16
                }}
                aria-label="add"
                onClick={handleOpen}
            >
                <CreateIcon/>
            </Fab>
            <Paper sx={{position: 'fixed', bottom: 0, left: 0, right: 0}} elevation={10}>
                <BottomNavigation
                    showLabels
                    value={bottomMenuValue}
                    sx={{
                        background: `linear-gradient(to right, ${directColor} 0%, ${directColor} 50%, ${districtColor} 50%, ${districtColor} 100%) !important`,
                        ".MuiBottomNavigationAction-root": {
                            color: theme.palette.secondary.light,
                            fontWeight: 300
                        },
                        ".Mui-selected, svg": {
                            color: theme.palette.secondary.light,
                            fontWeight: 900
                        },
                        boxShadow: 20
                    }}
                    onChange={(e, newValue: number) => {
                        setBottomMenuValue(newValue);
                    }}
                >
                    <BottomNavigationAction
                        label="Directs"
                        icon={<PersonOutlineIcon/>}
                        sx={{
                            backgroundColor: directColor,
                        }}
                    />
                    <BottomNavigationAction
                        label="Troops"
                        icon={<GroupOutlinedIcon/>}
                        sx={{
                            backgroundColor: troopColor,
                        }}
                    />
                    <BottomNavigationAction
                        label="Groups"
                        icon={<GroupsOutlinedIcon/>}
                        sx={{
                            backgroundColor: groupColor,
                        }}
                    />
                    <BottomNavigationAction
                        label="District"
                        icon={<Diversity2OutlinedIcon/>}
                        sx={{
                            backgroundColor: districtColor,
                        }}
                    />
                </BottomNavigation>
            </Paper>
        </Box>
    );
}