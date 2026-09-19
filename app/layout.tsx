import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "지금 한 곡",
  description: "지금의 상황과 기분에 어울리는 첫 곡 하나를 추천받아보세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
