import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "Trackfy — Filmes, séries e animes",
  description: "Acompanhe as produções que você assiste.",
  manifest: "/favicons/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico" },
      { url: "/favicons/favicon.svg", type: "image/svg+xml" },
      {
        url: "/favicons/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/favicons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={geist.variable}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
