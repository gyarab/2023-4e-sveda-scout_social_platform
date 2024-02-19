import {Roboto} from 'next/font/google';
import {createTheme} from '@mui/material/styles';
import {blue, deepPurple, green, grey, orange} from "@mui/material/colors";

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

const theme = createTheme({
    palette: {
        primary: deepPurple,
        secondary: grey,
        mode: 'light',
        background: {
            default: deepPurple.A100,
        },
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiAlert: {
            styleOverrides: {
                root: ({ownerState}) => ({
                    ...(ownerState.severity === 'info' && {
                        backgroundColor: '#f3f4f6',
                    }),
                }),
            },
        },
    },
});

export default theme;