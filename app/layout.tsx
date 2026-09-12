import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WithYou · 与你同在',
  description: 'WithYou · 与你同在，寻找同频的人。',
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
