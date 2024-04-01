import {ListItem, ListItemText} from "@mui/material";
import React from "react";
import {EventListItemProps} from "@/utils/interfaces";
import theme from "@/components/ThemeRegistry/theme";
import Button from "@mui/material/Button";
import EventListItemText from "@/components/list_items/EventListItemsText";

export default function EventListItem(props: EventListItemProps) {
    return (
        <Button
            variant={'text'}
            onClick={props.click}
            fullWidth
            sx={{
                padding: 0,
                marginTop: '5px',
                marginBottom: '5px',
                borderRadius: 2,
                textTransform: 'none'
            }}
        >
            <ListItem
                alignItems="flex-start"
                sx={{
                    backgroundColor: theme.palette.secondary.light,
                    borderRadius: 2,
                    boxShadow: 5
                }}
            >
                <ListItemText
                    primary={props.eventname}
                    secondary={
                        <EventListItemText
                            description={props.date === null ? 'Vote available to ' : 'Will happen on '}
                            date={props.date === null ? props.decision_date : props.date}
                        />
                    }
                />
            </ListItem>
        </Button>
    )
}