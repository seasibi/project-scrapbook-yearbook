import type { Metadata } from "next";
import { Playfair_Display, Playfair_Display_SC, Libre_Baskerville, DM_Sans, Press_Start_2P } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const playfairSC = Playfair_Display_SC({
  variable: "--font-serif-sc",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

// local scribble font — replaces VT323 as the project's "pixel" accent font
const providence = localFont({
  src: "./fonts/ProvidenceSans.ttf",
  variable: "--font-pixel",
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-pixel2",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Batch 26",
  description:
    "Interactive digital yearbook for the Class of 2026 — portraits, gallery, dedications, and a flipbook you can actually flip.",
  icons: {
    icon: "/letters/i.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="day" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${playfairSC.variable} ${libreBaskerville.variable} ${dmSans.variable} ${providence.variable} ${pressStart.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
