import type { Metadata } from "next";
import { Poppins, Fragment_Mono } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-fragment-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ajaia — Senior Full Stack Designer Assessment",
  description: "Candidate information and assessment submission flow.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${poppins.variable} ${fragmentMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
