import React from "react";
import {Stack} from "@mui/material";
import {getFullDate} from "@/utils/utils";
import Button from "@mui/material/Button";
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import DeleteIcon from '@mui/icons-material/Delete'
import theme from "@/components/ThemeRegistry/theme";
import Tooltip from "@mui/material/Tooltip";

export default function EventDataDisplayVoteOptions(props: any) {
    return (
        <Stack
            direction={{
                xs: 'column',
                sm: 'row'
            }}
            alignItems={{
                xs: 'flex-start',
                sm: 'center'
            }}
            justifyContent={{
                xs: 'center',
                sm: 'space-between'
            }}
            spacing={1}
            sx={{
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}
            >
                <div
                    style={{
                        marginRight: '10px',
                        fontWeight: '500',
                        fontSize: '20px',
                        backgroundColor: theme.palette.background.default,
                        color: theme.palette.secondary.light,
                        borderRadius: '12px',
                        padding: '5px'
                    }}
                >
                    {(props.index + 1) + '.'}
                </div>
                <div
                >
                    {getFullDate(props.time)}
                </div>
            </div>

            <Stack
                direction={'row'}
                alignItems={'center'}
                justifyContent={'space-evenly'}
            >
                <Tooltip
                    title={'Vote for'}
                >
                    <Button
                        variant={(props.vote === 1) ? 'contained' : 'outlined'}
                        color={'success'}
                        sx={{
                            marginLeft: '2.5px',
                            marginRight: '2.5px',
                        }}
                        onClick={() => props.click(props.index, 1)}
                    >
                        <CheckIcon/>
                    </Button>
                </Tooltip>
                <Tooltip
                    title={'Vote against'}
                >
                    <Button
                        variant={(props.vote === 2) ? 'contained' : 'outlined'}
                        color={'error'}
                        sx={{
                            marginLeft: '2.5px',
                            marginRight: '2.5px',
                        }}
                        onClick={() => props.click(props.index, 2)}
                    >
                        <CloseIcon/>
                    </Button>
                </Tooltip>
                <Tooltip
                    title={'If needed'}
                >
                    <Button
                        variant={(props.vote === 3) ? 'contained' : 'outlined'}
                        color={'warning'}
                        sx={{
                            marginLeft: '2.5px',
                            marginRight: '2.5px',
                        }}
                        onClick={() => props.click(props.index, 3)}
                    >
                        <QuestionMarkIcon/>
                    </Button>
                </Tooltip>
                <Tooltip
                    title={'Delete choice'}
                >
                    <Button
                        variant={'text'}
                        color={(props.vote === 1) ? 'success' : (props.vote === 2) ? 'error' : (props.vote === 3) ? 'warning' : 'secondary'}
                        sx={{
                            marginLeft: '2.5px',
                            marginRight: '2.5px',
                        }}
                        onClick={() => props.click(props.index, 0)}
                    >
                        <DeleteIcon
                            sx={{
                                color: theme.palette.primary.main,
                            }}
                        />
                    </Button>
                </Tooltip>
            </Stack>
        </Stack>
    )
}