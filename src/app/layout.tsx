import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import type {Metadata} from "next";
import ThemeRegistry from "@/components/ThemeRegistry/ThemeRegistry";
import type { Viewport } from 'next'

export const viewport: Viewport = {
    themeColor: '#673ab7',
}
export const metadata: Metadata = {
    title: "Material UI built with nextjs app router and typescript",
    description: "Material UI nextjs example",
};

export default function RootLayout({children}: { children: React.ReactNode; }) {
    return (
        <html lang="en">
        <body>
        <ThemeRegistry>
            {children}
        </ThemeRegistry>
        </body>
        </html>
    );
}
