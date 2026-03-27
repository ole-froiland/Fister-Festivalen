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

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://fister-festivalen.netlify.app";

const siteTitle = "Fister-Festivalen";
const siteDescription =
  "Sommerlig festivalnettside med paamelding, vaerdata og bildegalleri.";
const previewImage = "/fister-search-preview.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "/",
    siteName: siteTitle,
    type: "website",
    locale: "nb_NO",
    images: [
      {
        url: previewImage,
        width: 2296,
        height: 1536,
        alt: "Fister-Festivalen i sommersol ved vannet.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [previewImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
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
