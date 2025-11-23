import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unknown - 회사 소개",
  description: "게임 평가 플랫폼 GampFire를 만드는 Unknown 팀 소개",
};

export default function CompanyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="company-standalone-layout">{children}</div>;
}
