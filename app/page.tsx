import { Apple, Leaf, Terminal } from 'lucide-react';
import Image from 'next/image';
import './welcome.css';

export default function Home() {
  return (
    <main className="wy-page">
      <section className="wy-hero" id="meadow" aria-labelledby="welcome-title">
        <Image className="wy-landscape" src="/images/coastal-meadow-v3.png" alt="柔和插画中的临海草坡，穿着宽松 T 恤和时尚夏装的年轻伙伴散坐在两侧。" width={1671} height={941} priority unoptimized />
        <div className="wy-wash" />
        <header className="wy-header">
          <a className="wy-brand" href="#meadow" aria-label="WithYou 首页"><Leaf aria-hidden="true" /><span>WithYou</span></a>
        </header>
        <div className="wy-introduction">
          <h1 id="welcome-title">与你同在</h1>
          <p className="wy-theme">寻找同频的人</p>
          <div className="wy-downloads" aria-label="客户端下载">
            <button className="wy-download" disabled aria-label="下载 Windows，即将开放">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h8v8H3zm10 0h8v8h-8zM3 14h8v8H3zm10 0h8v8h-8z" /></svg>
              <span>Windows</span>
            </button>
            <button className="wy-download" disabled aria-label="下载 macOS，即将开放"><Apple aria-hidden="true" /><span>macOS</span></button>
            <button className="wy-download" disabled aria-label="下载 Linux，即将开放"><Terminal aria-hidden="true" /><span>Linux</span></button>
          </div>
          <p className="wy-release-note">客户端下载 · 即将开放</p>
        </div>
      </section>
    </main>
  );
}
