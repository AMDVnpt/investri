import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
});

const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "InvestRI Commerce Console",
  description: "Program administration for the InvestRI demonstration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${ui.variable} font-ui antialiased bg-paper text-navy`}>
        {children}
      </body>
    </html>
  );
}
