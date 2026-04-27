import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ToastContext";

export const metadata: Metadata = {
    title: "Risol Lumer — Lumer di mulut, awet di hati 🫓",
    description: "Risol premium homemade dengan berbagai varian rasa. Pesan sekarang dan rasakan kelezatannya!",
    keywords: "risol, risol lumer, risol matcha, risol chocolate, jajanan homemade",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="font-nunito bg-cream min-h-screen">
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
