import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WithYou · 与你同在',
  description: '来湖边坐坐。一个属于 AI 创作者的安静 3D 湖畔世界。画面体验原型。',
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
