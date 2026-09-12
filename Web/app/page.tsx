import { Apple } from 'lucide-react';
import Image from 'next/image';
import './welcome.css';

export default function Home() {
  return (
    <main className="wy-page">
      <section className="wy-hero" id="meadow" aria-labelledby="welcome-title">
        <Image className="wy-landscape" src="/images/cozy-meadow.png" alt="暖光下的海边草地，圆润的树木围着一片小小的空地，年轻伙伴们坐着看海、阅读和休息。" width={1672} height={941} priority unoptimized />
        <div className="wy-wash" />
        <div className="wy-introduction">
          <h1 id="welcome-title"><Image className="wy-wordmark" src="/images/withyou-wordmark.png" alt="WithYou" width={1254} height={1254} priority unoptimized /></h1>
          <p className="wy-theme">与你同在<br /><span>寻找同频的人</span></p>
          <div className="wy-downloads" aria-label="客户端下载">
            <button className="wy-download" disabled aria-label="下载 Windows，即将开放">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 4h8v8H3zm10 0h8v8h-8zM3 14h8v8H3zm10 0h8v8h-8z" /></svg>
              <span>Windows</span>
            </button>
            <button className="wy-download" disabled aria-label="下载 macOS，即将开放"><Apple aria-hidden="true" /><span>macOS</span></button>
            <button className="wy-download" disabled aria-label="下载 Linux，即将开放">
              <span className="wy-linux-icon" aria-hidden="true" />
              <span>Linux</span>
            </button>
          </div>
          <p className="wy-release-note">客户端下载 · 即将开放</p>
        </div>
      </section>
    </main>
  );
}
