import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Genesis 2K26 — College Sports Fest Registration Portal",
  description: "Register teams and athletes for Genesis 2K26.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.variable}>
        <a
          href="https://khushpithva.in/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-yellow-500/10 hover:bg-yellow-500/20 border-b border-yellow-500/20 text-center py-1.5 text-xs text-yellow-400/80 hover:text-yellow-300 transition-colors duration-200"
        >
          Made with ❤️ &nbsp;·&nbsp; Developed by <span className="font-semibold underline underline-offset-2">KHUSH</span>
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

