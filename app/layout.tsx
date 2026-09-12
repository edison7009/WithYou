import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WithYou · 与你同在',
  description: '各自忙碌，也能彼此陪伴。WithYou 是一片面朝大海的草地，让写代码、玩游戏或安静休息的人，在不远处陪伴彼此。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
