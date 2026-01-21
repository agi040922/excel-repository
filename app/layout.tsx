import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

// next/font로 폰트 최적화
// Google Fonts를 사전 로드하고, 빌드 시 self-host함
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // FOUT 방지하며 빠른 렌더링
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Excel Vision AI",
  description: "Automate data entry from blurry photos/documents directly into Excel templates using Google Gemini Flash AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
