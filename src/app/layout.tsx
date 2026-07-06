import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Quest Arena",
  description: "IT基礎授業向けクエスト型理解確認アプリ"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
