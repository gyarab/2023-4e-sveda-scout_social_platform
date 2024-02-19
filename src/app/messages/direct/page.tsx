'use client'
import {Card, CardContent, Container, Grid, Stack,} from "@mui/material";
import ResponsiveAppBar from "@/components/AppBar/ResponsiveAppBar";
import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function MultiActionAreaCard() {
    return (
        <Box sx={{
            minHeight: '100vh',
            height: '100%',
            display: 'flex',
            width: '100%',
            flexDirection: 'column',
            justifyContent: 'space-evenly'
        }}>
            <ResponsiveAppBar/>
            <Container sx={{height: '100%', display: 'flex', marginTop: '100px', marginBottom: '50px'}}>
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
                                <Typography
                                    variant={"h1"}
                                    sx={{fontSize: '48px'}}
                                >
                                    Direct
                                </Typography>
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
                                <Typography
                                    variant={"h1"}
                                    sx={{fontSize: '48px'}}
                                >
                                    Troops
                                </Typography>
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
                                <Typography
                                    variant={"h1"}
                                    sx={{fontSize: '48px'}}
                                >
                                    Groups
                                </Typography>
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
                                <Typography
                                    variant={"h1"}
                                    sx={{fontSize: '48px'}}
                                >
                                    Districts
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}