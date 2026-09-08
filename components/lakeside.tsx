'use client';

import { useEffect, useRef, useState } from 'react';
import { Armchair, BookOpen, Check, ChevronLeft, Compass, Eye, EyeOff, LampDesk, Leaf, Maximize2, Minimize2, Moon, MoveUpRight, RotateCcw, Settings2, Sparkles, Sun, Users, Waves, Wind, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { companions, poseLabels, type LakeSettings, type Pose } from '@/lib/lake/types';
import type { LakeWorld } from '@/lib/lake/world';

const actions = [
  { pose: 'sit' as Pose, icon: Armchair, label: '看湖' },
  { pose: 'read' as Pose, icon: BookOpen, label: '阅读' },
  { pose: 'lie' as Pose, icon: Moon, label: '躺一会儿' },
  { pose: 'stretch' as Pose, icon: MoveUpRight, label: '伸展' },
];

export default function Lakeside() {
  const container = useRef<HTMLDivElement>(null);
  const labels = useRef(new Map<string, HTMLElement>());
  const world = useRef<LakeWorld | null>(null);
  const [settings, setSettings] = useState<LakeSettings>({ pose: 'sit', agentBusy: true, companions: true, lowPower: false });
  const settingsRef = useRef(settings);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [immersive, setImmersive] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [greeting, setGreeting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import('@/lib/lake/world').then(({ createLakeWorld }) => {
      if (cancelled || !container.current) return;
      try {
        world.current = createLakeWorld(container.current, labels.current, settingsRef.current, () => setReady(true), message => { setReady(false); setError(message); });
      } catch (reason) {
        console.error('Lake initialization failed:', reason);
        setError('湖景需要支持 WebGL 2 的浏览器。请开启硬件加速后重试。');
      }
    }).catch(() => setError('湖景没有加载成功，请检查网络后重试。'));
    return () => { cancelled = true; world.current?.dispose(); world.current = null; };
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
    world.current?.update(settings);
  }, [settings]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => setGreeting(false), 6500);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    const key = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'BUTTON'].includes(tag) || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key.toLowerCase() === 'h') setImmersive(v => !v);
      if (event.key === 'Escape') { setImmersive(false); setSelected(null); }
    };
    document.addEventListener('fullscreenchange', changed);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('fullscreenchange', changed); document.removeEventListener('keydown', key); };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { setError('当前窗口无法全屏，你仍然可以使用右侧的沉浸模式。'); }
  };
  const toggle = (key: 'agentBusy' | 'companions' | 'lowPower', value: boolean) => {
    setSettings(s => ({ ...s, [key]: value }));
    if (key === 'companions' && !value) setSelected(null);
  };
  const chosen = companions.find(c => c.id === selected);

  return (
    <main className={`lakeside ${ready ? 'is-ready' : ''} ${immersive ? 'is-immersive' : ''}`}>
      <div ref={container} className="world" />
      <div className="world-vignette" aria-hidden="true" />

      {!ready && !error && <output className="loading-scene"><Waves size={36} strokeWidth={1.2} /><span>正在走向湖边</span><span className="loading-line" /></output>}

      <div className="nameplates" aria-label="湖畔演示角色">
        {companions.map(person => (
          <button
            key={person.id}
            ref={element => { if (element) labels.current.set(person.id, element); else labels.current.delete(person.id); }}
            className={`nameplate ${person.id === 'you' ? 'is-you' : ''}`}
            onClick={() => setSelected(selected === person.id ? null : person.id)}
            aria-label={`${person.name}${person.id === 'you' ? '，你的角色' : '，演示角色'}，查看状态`}
            aria-pressed={selected === person.id}
            tabIndex={immersive || !ready || (!settings.companions && person.id !== 'you') ? -1 : 0}
          >
            <span className={`presence-dot ${(person.id === 'you' ? settings.agentBusy : person.busy) ? 'busy' : ''}`} />
            {person.name}
            {person.id === 'you' && <span className="you-caption">在这里</span>}
          </button>
        ))}
      </div>

      <header className="hud topbar">
        <div className="brand"><Waves size={30} strokeWidth={1.4} /><div><span className="wordmark">WithYou<span className="brand-dot">.</span></span><span className="brand-sub">与你同在</span></div></div>
        <div className="lake-location"><span className="location-rule" /><Sun size={16} strokeWidth={1.5} /><span>暮光湖畔</span><span className="location-rule" /></div>
        <div className="header-actions">
          <span className="prototype-badge">画面体验版</span>
          <button className="icon-button" onClick={toggleFullscreen} aria-label={fullscreen ? '退出全屏' : '进入全屏'} title={fullscreen ? '退出全屏' : '进入全屏'}>{fullscreen ? <Minimize2 /> : <Maximize2 />}</button>
          <Popover>
            <PopoverTrigger className="icon-button" aria-label="湖景设置" title="湖景设置"><Settings2 /></PopoverTrigger>
            <PopoverContent align="end" sideOffset={12} className="lake-popover settings-popover">
              <PopoverTitle>让这里更适合你</PopoverTitle>
              <PopoverDescription>按自己的节奏，在湖边待一会儿。</PopoverDescription>
              <div className="setting-row"><label htmlFor="show-companions"><Users /><span>显示演示同伴<small>试试看一起坐着的感觉</small></span></label><Switch id="show-companions" checked={settings.companions} onCheckedChange={v => toggle('companions', v)} /></div>
              <div className="setting-row"><label htmlFor="agent-busy"><LampDesk /><span>伙伴灯亮起<small>演示 Agent 正在工作</small></span></label><Switch id="agent-busy" checked={settings.agentBusy} onCheckedChange={v => toggle('agentBusy', v)} /></div>
              <div className="setting-row"><label htmlFor="low-power"><Leaf /><span>省电画面<small>降低精细度和帧率</small></span></label><Switch id="low-power" checked={settings.lowPower} onCheckedChange={v => toggle('lowPower', v)} /></div>
              <p className="settings-note">当前为画面原型，人物状态由你手动切换。</p>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <aside className="hud scene-note"><span className="eyebrow">A MOMENT TOGETHER</span><h1>此刻，一起看湖。</h1><p>把忙碌留在身后，让目光走远一点。</p></aside>

      <aside className="hud lake-company"><span className="company-icon"><Users size={17} /></span><div><span>{settings.companions ? '5 位角色在湖边' : '属于你的安静时刻'}</span><small>{settings.companions ? '演示空间 · 非真实在线' : '独处预览 · 非真实在线'}</small></div></aside>

      <nav className="hud view-tools" aria-label="视角控制">
        <button className="icon-button tool" onClick={() => world.current?.resetCamera()} aria-label="回到初始视角" title="回到初始视角"><Compass /></button>
        <button className="icon-button tool" onClick={() => setImmersive(true)} aria-label="隐藏界面，沉浸看湖" title="沉浸看湖 · H"><EyeOff /></button>
      </nav>

      {chosen && !immersive && <aside className="person-card lake-popover" aria-label="角色状态">
        <button className="close-card" onClick={() => setSelected(null)} aria-label="关闭角色状态"><X size={16} /></button>
        <span className="eyebrow">{chosen.id === 'you' ? 'YOUR LITTLE MOMENT' : 'DEMO COMPANION'}</span>
        <h2><span style={{ background: chosen.color }} />{chosen.name}<small>{chosen.id === 'you' ? '你的角色' : '演示角色'}</small></h2>
        <p>{poseLabels[chosen.id === 'you' ? settings.pose : chosen.pose]}<span className="person-separator">·</span>{(chosen.id === 'you' ? settings.agentBusy : chosen.busy) ? '伙伴正在忙' : '伙伴休息中'}</p>
        <div className="person-note">{chosen.id === 'you' ? '用下方动作栏，试试不同的陪伴状态。' : '这是一位用于预览湖畔氛围的角色，尚未接入真人社交。'}</div>
      </aside>}

      <div className="hud bottom-hud">
        <div className="greeting" aria-live="polite">{ready && greeting && <span><Sparkles size={14} />欢迎来到湖边。先一起坐一会儿。</span>}</div>
        <section className="companion-dock" aria-label="你的陪伴状态">
          <div className="self-status"><div className="self-mark"><Waves size={23} strokeWidth={1.4} /></div><div><span className="self-heading">你的湖边时光</span><span className="agent-status"><i className={settings.agentBusy ? 'lit' : ''} />{settings.agentBusy ? '伙伴正在忙' : '伙伴休息中'}<small>演示</small></span></div></div>
          <div className="dock-divider" />
          <ToggleGroup className="pose-options" value={[settings.pose]} onValueChange={values => { if (values[0]) setSettings(s => ({ ...s, pose: values[0] as Pose })); }} aria-label="选择人物姿态">
            {actions.map(({ pose, icon: Icon, label }) => <ToggleGroupItem key={pose} value={pose} className="pose-option" aria-label={poseLabels[pose]}><Icon size={18} strokeWidth={1.6} /><span>{label}</span>{settings.pose === pose && <span className="pose-indicator" />}</ToggleGroupItem>)}
          </ToggleGroup>
          <div className="dock-divider last-divider" />
          <button className={`lamp-toggle ${settings.agentBusy ? 'is-lit' : ''}`} onClick={() => toggle('agentBusy', !settings.agentBusy)} aria-label={settings.agentBusy ? '关闭伙伴灯' : '点亮伙伴灯'} aria-pressed={settings.agentBusy} title="切换伙伴灯"><LampDesk size={20} strokeWidth={1.6} /></button>
        </section>
      </div>

      <footer className="hud lake-footer"><span><Wind size={14} />微风经过，创造继续。</span><span className="camera-hint">拖动环顾<span>·</span>滚轮靠近<span>·</span><kbd>H</kbd> 隐藏界面</span><span className="footer-signature">WITH YOU, ALWAYS</span></footer>

      {immersive && <button className="return-interface" onClick={() => setImmersive(false)}><ChevronLeft size={16} /><Eye size={16} /><span>显示界面</span><kbd>H</kbd></button>}
      {error && <div className={`scene-error ${ready ? 'non-blocking' : ''}`} role="alert"><Waves /><h2>{ready ? '小提示' : '暂时没能到达湖边'}</h2><p>{error}</p><button onClick={() => ready ? setError('') : window.location.reload()}>{ready ? <Check size={16} /> : <RotateCcw size={16} />}{ready ? '知道了' : '重新加载'}</button></div>}
    </main>
  );
}
