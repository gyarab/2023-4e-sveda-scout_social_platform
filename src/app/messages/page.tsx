'use client'
import {BottomNavigation, BottomNavigationAction, Container, Divider, List, Paper, Stack,} from "@mui/material";
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React, {useState} from "react";
import Box from "@mui/material/Box";
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import Diversity2OutlinedIcon from '@mui/icons-material/Diversity2Outlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import theme from "@/components/ThemeRegistry/theme";
import ChatListItem from "@/components/Messages/ChatListItem";
import {ChatListItemProps} from "@/utils/interfaces";

const directLink: string = '/messages/direct'
const troopLink: string = '/messages/troop'
const groupLink: string = '/messages/group'
const districtLink: string = '/messages/district'

const propsErr: ChatListItemProps = {
    avatar: {
        username: 'Travis Howard',
        image: '/static/images/avatar/2.jpg'
    },
    text: {
        primary: 'Primary Text'
    },
    badge: {
        color: 'error'
    }
}

const propsWar: ChatListItemProps = {
    avatar: {
        username: 'Travis Howard',
        image: '/static/images/avatar/2.jpg'
    },
    text: {
        primary: 'Primary Text'
    },
    badge: {
        color: 'warning'
    }
}

const propsSuc: ChatListItemProps = {
    avatar: {
        username: 'Travis Howard',
        image: '/static/images/avatar/2.jpg'
    },
    text: {
        primary: 'Primary Text'
    },
    badge: {
        color: 'success'
    }
}

const propsPri: ChatListItemProps = {
    avatar: {
        username: 'Travis Howard',
        image: '/static/images/avatar/2.jpg'
    },
    text: {
        primary: 'Primary Text'
    },
    badge: {
        color: 'primary'
    }
}

export default function MessagesMenu() {
    const [value, setValue] = useState<number>(0);

    return (
        <Box sx={{
            minHeight: '100vh',
            height: '100%',
            display: 'flex',
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-evenly',
        }}>
            <ResponsiveAppBar/>
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
                        <ChatListItem {...propsErr} />
                        <ChatListItem {...propsErr} />
                        <ChatListItem {...propsWar} />
                        <ChatListItem {...propsWar} />
                        <ChatListItem {...propsSuc} />
                        <ChatListItem {...propsSuc} />
                        <ChatListItem {...propsPri} />
                        <ChatListItem {...propsPri} />
                    </List>
                </Stack>
            </Container>
            <Paper sx={{position: 'fixed', bottom: 0, left: 0, right: 0}} elevation={3}>
                <BottomNavigation
                    showLabels
                    value={value}
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        ".MuiBottomNavigationAction-root": {
                            color: theme.palette.secondary.light,
                            fontWeight: 400
                        },
                        ".Mui-selected, svg": {
                            color: theme.palette.secondary.light,
                            fontWeight: 800
                        },
                    }}
                    onChange={(e, newValue: number) => {
                        setValue(newValue);
                    }}
                >
                    <BottomNavigationAction label="Recents" icon={<ScheduleOutlinedIcon/>}/>
                    <BottomNavigationAction label="Troops" icon={<GroupOutlinedIcon/>}/>
                    <BottomNavigationAction label="Groups" icon={<GroupsOutlinedIcon/>}/>
                    <BottomNavigationAction label="District" icon={<Diversity2OutlinedIcon/>}/>
                </BottomNavigation>
            </Paper>
        </Box>
    );
}

/*
 <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: 8,
                                textAlign: 'center'
                            }}
                        >
                            <CardContent
                                sx={{paddingBottom: '16px !important'}}
                            >
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    href={directLink}
                                >
                                    <Typography
                                        variant={"h1"}
                                        fontWeight={500}
                                        sx={{fontSize: '48px'}}
                                    >
                                        Direct
                                    </Typography>
                                </Button>

                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: 8,
                                textAlign: 'center'
                            }}
                        >
                            <CardContent
                                sx={{paddingBottom: '16px !important'}}
                            >
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    href={troopLink}
                                >
                                    <Typography
                                        variant={"h1"}
                                        fontWeight={500}
                                        sx={{fontSize: '48px'}}
                                    >
                                        Troops
                                    </Typography>
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: 8,
                                textAlign: 'center'
                            }}
                        >
                            <CardContent
                                sx={{paddingBottom: '16px !important'}}
                            >
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    href={groupLink}
                                >
                                    <Typography
                                        variant={"h1"}
                                        fontWeight={500}
                                        sx={{fontSize: '48px'}}
                                    >
                                        Groups
                                    </Typography>
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Card
                            sx={{
                                borderRadius: 2,
                                boxShadow: 8,
                                textAlign: 'center'
                            }}
                        >
                            <CardContent
                                sx={{paddingBottom: '16px !important'}}
                            >
                                <Button
                                    variant={'contained'}
                                    fullWidth
                                    href={districtLink}
                                >
                                    <Typography
                                        variant={"h1"}
                                        fontWeight={500}
                                        sx={{fontSize: '48px'}}
                                    >
                                        District
                                    </Typography>
                                </Button>

                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
 */