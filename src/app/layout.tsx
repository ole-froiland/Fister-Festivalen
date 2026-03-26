import type { Metadata } from "next";
import { DM_Serif_Display, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fister-Festivalen",
  description:
    "Sommerlig festivalnettside med paamelding, vaerdata og bildegalleri.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="no"
      className={`${sora.variable} ${dmSerif.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
