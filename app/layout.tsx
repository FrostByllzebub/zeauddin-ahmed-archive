import type { Metadata } from "next";
import "./globals.css";
import "./article-archive.css";
export const metadata: Metadata = { metadataBase: new URL("https://zeauddinahmed.com"), title: "জিয়ার কলাম — বাংলা লেখার আর্কাইভ", description: "জিয়াউদ্দীন আহমেদের প্রকাশিত বাংলা কলাম ও প্রবন্ধের যাচাইকৃত ডিজিটাল আর্কাইভ।", alternates: { canonical: "/" }, openGraph: { type: "website", siteName: "জিয়ার কলাম", locale: "bn_BD", title: "জিয়ার কলাম — বাংলা লেখার আর্কাইভ", description: "জিয়াউদ্দীন আহমেদের প্রকাশিত বাংলা কলাম ও প্রবন্ধের যাচাইকৃত ডিজিটাল আর্কাইভ।", url: "/" }, twitter: { card: "summary", title: "জিয়ার কলাম — বাংলা লেখার আর্কাইভ", description: "জিয়াউদ্দীন আহমেদের প্রকাশিত বাংলা কলাম ও প্রবন্ধের যাচাইকৃত ডিজিটাল আর্কাইভ।" }, icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="bn"><body>{children}</body></html>; }
