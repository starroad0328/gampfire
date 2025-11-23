import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LayoutContent } from "@/components/layout/layout-content";
import { Providers } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "겜프파이어 (GampFire) - 게임 평점 리뷰 플랫폼",
  description: "한국어 중심의 게임 평점·리뷰 플랫폼. 신뢰도 높은 게임 평가 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Providers>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
