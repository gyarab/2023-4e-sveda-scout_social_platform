import {ListItem, ListItemText} from "@mui/material";
import React from "react";
import Typography from "@mui/material/Typography";
import {EventListItemProps, EventListItemTextProps} from "@/utils/interfaces";
import theme from "@/components/ThemeRegistry/theme";
import Button from "@mui/material/Button";
import {getFullDate} from "@/utils/utils";

export default function EventListItemText(props: EventListItemTextProps) {
    return (
        <React.Fragment>
            {props.description}
            <Typography
                sx={{display: 'inline'}}
                component="span"
                variant="body2"
                color="text.primary"
            >
                {
                    getFullDate(props.date.toString())
                }
            </Typography>
        </React.Fragment>
    )
}