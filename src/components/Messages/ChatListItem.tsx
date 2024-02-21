import {Badge, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import React from "react";
import Typography from "@mui/material/Typography";
import {ChatListItemProps} from "@/utils/interfaces";
import theme from "@/components/ThemeRegistry/theme";

export default function ChatListItem(props: ChatListItemProps) {
    return (
        <Badge
            // @ts-ignore
            color={props.badge.color}
            badgeContent=" "
            sx={{
                transform: 'translate(-2px, 10px)'
            }}
        >
            <ListItem
                alignItems="flex-start"
                sx={{
                    backgroundColor: theme.palette.secondary.light,
                    borderRadius: 2,
                    borderTopRightRadius: 0,
                    marginTop: '5px',
                    marginBottom: '5px',
                    transform: 'translate(2px, -10px)'
                }}
            >
                <ListItemAvatar>
                    <Avatar
                        alt={props.avatar.username}
                        src={props.avatar.image}
                        sx={{
                            backgroundColor: theme.palette.secondary.light
                        }}
                    />
                </ListItemAvatar>
                <ListItemText
                    primary={props.text.primary}
                    secondary={
                        <React.Fragment>
                            <Typography
                                sx={{display: 'inline'}}
                                component="span"
                                variant="body2"
                                color="text.primary"
                            >
                                Ali Connors
                            </Typography>
                            {" — I'll be in your neighborhood doing errands this…"}
                        </React.Fragment>
                    }
                />
            </ListItem>
        </Badge>
    )
}