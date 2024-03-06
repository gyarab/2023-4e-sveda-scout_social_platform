import {Badge, ListItem, ListItemAvatar, ListItemText} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import React from "react";
import Typography from "@mui/material/Typography";
import {ChatListItemProps} from "@/utils/interfaces";
import theme from "@/components/ThemeRegistry/theme";
import Button from "@mui/material/Button";

export default function ChatListItem(props: ChatListItemProps) {
    return (
        <Badge
            badgeContent=" "
            sx={{
                transform: 'translate(-2px, 10px)',
                "& .MuiBadge-badge": {
                    backgroundColor: props.badge.color,
                    boxShadow: 5
                },
            }}
        >
            {
                // remove upper case on buttons
            }
            <Button
                variant={'text'}
                onClick={props.click}
                sx={{
                    transform: 'translate(2px, -10px)',
                    padding: 0,
                    marginTop: '5px',
                    marginBottom: '5px',
                    borderRadius: 2,
                    borderTopRightRadius: 0,
                    textTransform: 'none'
                }}
            >
                <ListItem
                    alignItems="flex-start"
                    sx={{
                        backgroundColor: theme.palette.secondary.light,
                        borderRadius: 2,
                        borderTopRightRadius: 0,
                        boxShadow: 5
                    }}
                >
                    <ListItemAvatar>
                        <Avatar
                            alt={props.avatar.username}
                            src={props.avatar.image}
                            sx={{
                                backgroundColor: theme.palette.secondary.light,
                                border: 1
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
            </Button>
        </Badge>
    )
}