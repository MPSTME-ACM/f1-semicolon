import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"; // ← Add Space Grotesk
import "./globals.css";
import FlickeringBackground from "./components/FlickeringBackground";

// Load Space Grotesk (set it as a CSS variable for use)
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Optional: keep Geist and Geist Mono if you're still using them
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "F1 SemiColon",
  description: "Need To Type",
  icons: {
    icon: "/favicon.svg", // ← This tells Next.js to use favicon.svg
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Optional: fallback favicon.ico for older browsers */}
        <link rel="alternate icon" href="/favicon.ico" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FlickeringBackground />
        {children}
      </body>
    </html>
  );
}
