import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "জিয়ার কলাম — বাংলা লেখার আর্কাইভ", description: "জিয়ার প্রকাশিত বাংলা কলাম ও প্রবন্ধের যাচাইকৃত ডিজিটাল আর্কাইভ।", icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="bn"><body>{children}</body></html>; }
