import { ArrowDown, BookOpen, Gamepad2, Headphones, Laptop, Leaf, Moon } from 'lucide-react';
import Image from 'next/image';
import './welcome.css';

export default function Home() {
  return (
    <main className="wy-page">
      <section className="wy-hero" id="meadow" aria-labelledby="welcome-title">
        <Image className="wy-landscape" src="/images/coastal-meadow.png" alt="两侧的临海草坡上，几位小小的伙伴分散坐着、躺着，远处是海与天空。" width={1672} height={941} priority unoptimized />
        <div className="wy-wash" />
        <header className="wy-header">
          <a className="wy-brand" href="#meadow" aria-label="WithYou 首页"><Leaf aria-hidden="true" /><span>WithYou<small>与 你 同 在</small></span></a>
          <a className="wy-nav" href="#story">这片草地的故事</a>
        </header>
        <div className="wy-introduction">
          <p className="wy-kicker">一片草地，一点陪伴。</p>
          <h1 id="welcome-title">各自忙碌，<br />也能彼此陪伴。</h1>
          <p className="wy-description">写代码、玩游戏，或是什么也不做。<br />抬起头，总有人在不远处。</p>
          <a className="wy-cta" href="#story">来这里，歇一会儿 <ArrowDown size={17} aria-hidden="true" /></a>
          <p className="wy-availability">Windows 客户端开发中</p>
        </div>
        <div className="wy-hero-foot"><span>不必找话题。一起待着，就很好。</span><a href="#story" aria-label="向下阅读我们的故事"><ArrowDown size={20} /></a><span>WITH YOU, AT YOUR OWN PACE</span></div>
      </section>
      <section className="wy-story" id="story" aria-labelledby="story-title">
        <div className="wy-story-heading"><span className="wy-chapter">01 / 为什么有了 WithYou</span><h2 id="story-title">凌晨四点，<br />也许你只是想，<br /><em>有人在。</em></h2></div>
        <div className="wy-letter">
          <p>2026 年，我们开始和 AI 一起创造。屏幕里的世界越来越热闹，屏幕前，有时却只有自己。</p>
          <p>写一段代码，玩一局游戏，等一个结果。并不是每个时刻都需要聊天，但有些时候，我们希望身旁有一点人的气息。</p>
          <p>于是，我们留下一片面朝大海的草地。你做你的事，我忙我的。偶尔抬头，知道彼此都在。</p>
          <p className="wy-signature">慢下来，与此刻同频的人待一会儿。<br /><span>WithYou · 与你同在</span></p>
        </div>
        <div className="wy-activities" aria-label="草地上的五种日常">
          <span><BookOpen aria-hidden="true" />读几页书</span><span><Laptop aria-hidden="true" />专心创造</span><span><Headphones aria-hidden="true" />听听看看</span><span><Gamepad2 aria-hidden="true" />玩一会儿</span><span><Moon aria-hidden="true" />安心休息</span>
        </div>
        <p className="wy-note">这片草地还在慢慢生长。当前为画面与活动预览，真实多人陪伴仍在开发中，暂未开放公开下载。</p>
      </section>
      <footer className="wy-footer"><span>WithYou · 与你同在</span><span>有风，有海，也有你。</span><a href="#meadow">回到草地 ↑</a></footer>
    </main>
  );
}
