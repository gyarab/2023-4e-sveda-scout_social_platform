'use client'
import {CircularProgress, Stack} from "@mui/material";
import Typography from "@mui/material/Typography";
import theme from "@/components/ThemeRegistry/theme";

export default function Loading() {
    return (
        <Stack
            direction={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            sx={{
                height: '100vh'
            }}
        >
            <CircularProgress
                sx={{
                    color: theme.palette.primary.main,
                    fontSize: '100px'
                }}
            />
            <Typography
                sx={{
                    color: theme.palette.primary.main,
                    fontSize: '20px'
                }}
            >
                Loading...
            </Typography>
        </Stack>
    )
}