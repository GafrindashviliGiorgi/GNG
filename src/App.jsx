import { useEffect, useMemo, useRef, useState } from 'react';
import img1 from './assets/WhatsApp Image 2026-10-08 at 13.08.19 (4).jpeg';
import img2 from './assets/WhatsApp Image 2026-10-08 at 13.08.19 (5).jpeg';
import img3 from './assets/WhatsApp Image 2026-10-08 at 13.08.19 (6).jpeg';

/* ათვლის დასაწყისი: 3 ოქტომბერი, 19:40 (თვე 0-დან იწყება, ამიტომ 9 = ოქტომბერი) */
const START = new Date(2026, 9, 3, 19, 40, 0);

function diffParts(from, to) {
  if (to < from) return { y: 0, mo: 0, d: 0, h: 0, mi: 0, s: 0 };
  let y = to.getFullYear() - from.getFullYear();
  let mo = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  let h = to.getHours() - from.getHours();
  let mi = to.getMinutes() - from.getMinutes();
  let s = to.getSeconds() - from.getSeconds();

  if (s < 0) { s += 60; mi--; }
  if (mi < 0) { mi += 60; h--; }
  if (h < 0) { h += 24; d--; }
  if (d < 0) {
    d += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    mo--;
  }
  if (mo < 0) { mo += 12; y--; }
  return { y, mo, d, h, mi, s };
}

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* ===== მუსიკა (YouTube) ===== */
const YT_ID = 'gaA7RAy5rYg';
const YT_START = 56; // წამი, საიდანაც იწყება (და ციკლში ბრუნდება)

function useMusic() {
  const wrapRef = useRef(null);
  const playerRef = useRef(null);
  const readyRef = useRef(false);
  const wantRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let holder = null;

    const create = () => {
      if (cancelled || !wrapRef.current) return;
      holder = document.createElement('div');
      wrapRef.current.appendChild(holder);
      playerRef.current = new window.YT.Player(holder, {
        width: 220,
        height: 220,
        videoId: YT_ID,
        playerVars: {
          start: YT_START,
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            setReady(true);
            if (wantRef.current) {
              playerRef.current.seekTo(YT_START, true);
              playerRef.current.playVideo();
            }
          },
          onStateChange: (e) => {
            const S = window.YT.PlayerState;
            if (e.data === S.ENDED) {
              playerRef.current.seekTo(YT_START, true);
              playerRef.current.playVideo();
            }
            setPlaying(e.data === S.PLAYING);
          },
          onError: () => setError(true),
        },
      });
    };

    if (window.YT && window.YT.Player) {
      create();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        create();
      };
      if (!document.getElementById('yt-api')) {
        const s = document.createElement('script');
        s.id = 'yt-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      readyRef.current = false;
      try { playerRef.current && playerRef.current.destroy(); } catch (e) { /* ignore */ }
      playerRef.current = null;
      if (holder && holder.parentNode) holder.parentNode.removeChild(holder);
    };
  }, []);

  const start = () => {
    wantRef.current = true;
    const p = playerRef.current;
    if (p && readyRef.current) {
      try {
        p.unMute();
        p.setVolume(100);
        p.seekTo(YT_START, true);
        p.playVideo();
      } catch (err) { /* ignore */ }
    }
  };

  const toggle = () => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  };

  return { wrapRef, start, toggle, playing, ready, error };
}

function EnterGate({ onEnter, hidden, ready }) {
  return (
    <div className={`gate ${hidden ? 'gate-hidden' : ''}`}>
      <button className="gate-btn" onClick={onEnter} disabled={!ready} aria-label="შესვლა">
        <span className="gate-heart">♥</span>
        <span className="gate-text">{ready ? 'შეეხე' : '...'}</span>
      </button>
    </div>
  );
}

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`reveal reveal-${direction} ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function BackgroundHearts() {
  const items = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 14 + Math.random() * 22,
        duration: 9 + Math.random() * 9,
        delay: -Math.random() * 18,
        symbol: ['♥', '♥', '♡', '✦'][i % 4],
        opacity: 0.3 + Math.random() * 0.35,
        sway: 20 + Math.random() * 30,
      })),
    []
  );
  return (
    <div className="bg-hearts" aria-hidden="true">
      {items.map((h) => (
        <span
          key={h.id}
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            '--op': h.opacity,
            '--sway': `${h.sway}px`,
          }}
        >
          {h.symbol}
        </span>
      ))}
    </div>
  );
}

function EntryBurst() {
  const items = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 18 + Math.random() * 34,
        duration: 3.8 + Math.random() * 3.6,
        delay: Math.random() * 2.4,
        symbol: ['♥', '♥', '♡', '💗', '💖'][i % 5],
        sway: (Math.random() - 0.5) * 90,
      })),
    []
  );
  return (
    <div className="entry-burst" aria-hidden="true">
      {items.map((h) => (
        <span
          key={h.id}
          style={{
            left: `${h.left}%`,
            fontSize: `${h.size}px`,
            animationDuration: `${h.duration}s`,
            animationDelay: `${h.delay}s`,
            '--sway': `${h.sway}px`,
          }}
        >
          {h.symbol}
        </span>
      ))}
    </div>
  );
}

function ClickHearts() {
  const [items, setItems] = useState([]);
  const idRef = useRef(0);
  useEffect(() => {
    const onDown = (e) => {
      idRef.current += 1;
      const id = idRef.current;
      setItems((prev) => [
        ...prev.slice(-6),
        { id, x: e.clientX, y: e.clientY, r: (Math.random() - 0.5) * 40 },
      ]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 1200);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);
  return (
    <>
      {items.map((i) => (
        <span key={i.id} className="tap-heart" style={{ left: i.x, top: i.y, '--r': `${i.r}deg` }}>
          ♥
        </span>
      ))}
    </>
  );
}

const pad = (n) => String(n).padStart(2, '0');

function Unit({ value, label, big }) {
  return (
    <div className={`unit ${big ? 'unit-big' : ''}`}>
      <span className="unit-value" key={value}>{pad(value)}</span>
      <span className="unit-label">{label}</span>
    </div>
  );
}

function Counter() {
  const now = useNow();
  const t = diffParts(START, now);
  return (
    <div className="counter">
      <span className="heartbeat">♥</span>
      <div className="units">
        {t.y > 0 && <Unit value={t.y} label="წელი" />}
        <Unit value={t.mo} label="თვე" />
        <Unit value={t.d} label="დღე" />
        <Unit value={t.h} label="საათი" />
        <Unit value={t.mi} label="წუთი" />
        <Unit value={t.s} label="წამი" big />
      </div>
    </div>
  );
}

function Photo({ src, alt, tilt = 0, delay = 0, direction = 'up' }) {
  return (
    <Reveal delay={delay} direction={direction} className="photo-wrap">
      <div className="photo-frame" style={{ '--tilt': `${tilt}deg` }}>
        <img src={src} alt={alt} loading="lazy" draggable="false" />
        <span className="deco d1">♥</span>
        <span className="deco d2">✦</span>
        <span className="deco d3">♡</span>
      </div>
    </Reveal>
  );
}

function HeartPhoto({ src }) {
  const cardRef = useRef(null);
  const [hearts, setHearts] = useState([]);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const counter = useRef(0);

  const getPoint = (e) => (e.touches && e.touches[0] ? e.touches[0] : e);

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = getPoint(e);
    const px = (p.clientX - rect.left) / rect.width - 0.5;
    const py = (p.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 12, y: px * 12 });
  };

  const burst = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const p = getPoint(e);
    const x = p.clientX - rect.left;
    const y = p.clientY - rect.top;
    const batch = Array.from({ length: 9 }, () => {
      counter.current += 1;
      return {
        id: counter.current,
        x,
        y,
        dx: (Math.random() - 0.5) * 220,
        dy: -(80 + Math.random() * 180),
        size: 16 + Math.random() * 20,
        rot: (Math.random() - 0.5) * 80,
        symbol: ['♥', '💗', '♡', '💖'][Math.floor(Math.random() * 4)],
      };
    });
    setHearts((prev) => [...prev, ...batch]);
    const ids = batch.map((b) => b.id);
    setTimeout(() => setHearts((prev) => prev.filter((h) => !ids.includes(h.id))), 1600);
  };

  return (
    <Reveal direction="zoom" className="photo-wrap">
      <div
        ref={cardRef}
        className="photo-frame love-card"
        style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        onMouseMove={handleMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        onTouchMove={handleMove}
        onTouchEnd={() => setTilt({ x: 0, y: 0 })}
        onClick={burst}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const r = cardRef.current.getBoundingClientRect();
            burst({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 });
          }
        }}
        aria-label="ფოტო"
      >
        <img src={src} alt="ჩვენი ფოტო" loading="lazy" draggable="false" />
        <span className="deco d1">♥</span>
        <span className="deco d2">✦</span>
        <span className="deco d3">♡</span>
        {hearts.map((h) => (
          <span
            key={h.id}
            className="burst-heart"
            style={{
              left: h.x,
              top: h.y,
              fontSize: h.size,
              '--dx': `${h.dx}px`,
              '--dy': `${h.dy}px`,
              '--rot': `${h.rot}deg`,
            }}
          >
            {h.symbol}
          </span>
        ))}
      </div>
    </Reveal>
  );
}

export default function App() {
  const [progress, setProgress] = useState(0);
  const [entered, setEntered] = useState(false);
  const music = useMusic();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 6000);
    return () => clearTimeout(t);
  }, []);

  const enter = () => {
    music.start();
    setEntered(true);
  };

  useEffect(() => {
    document.body.style.overflow = entered ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [entered]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="progress" style={{ width: `${progress}%` }} />
      <div ref={music.wrapRef} className="yt-hidden" aria-hidden="true" />
      <EnterGate onEnter={enter} hidden={entered} ready={music.ready || waited} />
      {entered && <EntryBurst />}
      {entered && (
        <button
          className={`music-btn ${music.playing ? 'is-playing' : ''}`}
          onClick={music.toggle}
          aria-label="მუსიკა"
        >
          {music.error ? '✕' : music.playing ? '♫' : '▶'}
        </button>
      )}
      <BackgroundHearts />
      <ClickHearts />
      <main>
        <section className="section top">
          <Reveal>
            <p className="since">3 ოქტომბრიდან ერთად ✦</p>
          </Reveal>
          <Reveal delay={150}>
            <Counter />
          </Reveal>
          <Photo src={img1} alt="ჩვენი ფოტო" tilt={-2} delay={250} direction="zoom" />
          <div className="scroll-hint" aria-hidden="true">⌄</div>
        </section>

        <section className="section">
          <Photo src={img2} alt="ჩვენი ფოტო" tilt={2} direction="left" />
        </section>

        <section className="section">
          <HeartPhoto src={img3} />
          <Reveal delay={200}>
            <p className="tap-hint">♥</p>
          </Reveal>
        </section>
      </main>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Georgian:wght@400;600;700&family=Noto+Sans+Georgian:wght@300;400;500&display=swap');

:root {
  --bg: #fff7f5;
  --bg2: #ffeef0;
  --ink: #3a2a30;
  --muted: #8a6e76;
  --rose: #e8788f;
  --rose-deep: #c9506b;
  --gold: #e9b872;
}

* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html { scroll-behavior: smooth; }
body {
  background: linear-gradient(160deg, var(--bg) 0%, var(--bg2) 55%, #fdeaf1 100%);
  background-attachment: fixed;
  color: var(--ink);
  font-family: 'Noto Sans Georgian', system-ui, sans-serif;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}
img { display: block; max-width: 100%; }

.app { position: relative; min-height: 100vh; overflow-x: hidden; }

.progress {
  position: fixed; top: 0; left: 0; height: 3px; z-index: 50;
  background: linear-gradient(90deg, var(--rose), var(--gold));
  transition: width 0.1s linear;
}

.bg-hearts { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.bg-hearts span { position: absolute; bottom: -40px; color: var(--rose); animation: rise linear infinite; }
@keyframes rise {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  10% { opacity: var(--op); }
  25% { transform: translate(var(--sway), -28vh) rotate(14deg); }
  50% { transform: translate(calc(var(--sway) * -1), -57vh) rotate(-14deg); opacity: var(--op); }
  75% { transform: translate(var(--sway), -86vh) rotate(14deg); }
  100% { transform: translate(0, -115vh) rotate(0deg); opacity: 0; }
}

.entry-burst { position: fixed; inset: 0; pointer-events: none; z-index: 80; overflow: hidden; }
.entry-burst span {
  position: absolute; bottom: -60px; color: var(--rose);
  opacity: 0;
  animation: entryRise ease-out forwards;
  filter: drop-shadow(0 6px 12px rgba(232,120,143,0.35));
}
@keyframes entryRise {
  0% { transform: translate(0, 0) scale(0.5); opacity: 0; }
  12% { opacity: 1; }
  40% { transform: translate(var(--sway), -45vh) scale(1); opacity: 1; }
  70% { transform: translate(calc(var(--sway) * -0.6), -80vh) scale(1.05); opacity: 0.6; }
  100% { transform: translate(0, -115vh) scale(1.1); opacity: 0; }
}

main { position: relative; z-index: 1; }

.section {
  min-height: 100vh;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 64px 20px;
}
.top { gap: 8px; }

/* Reveal */
.reveal { opacity: 0; transition: opacity 0.9s ease, transform 0.9s cubic-bezier(.2,.7,.2,1); will-change: opacity, transform; }
.reveal-up { transform: translateY(36px); }
.reveal-left { transform: translateX(-48px); }
.reveal-right { transform: translateX(48px); }
.reveal-zoom { transform: scale(0.92); }
.reveal.is-visible { opacity: 1; transform: none; }

/* Counter */
.since {
  text-align: center; font-size: 13px; letter-spacing: 0.18em;
  color: var(--rose); font-weight: 500; margin-bottom: 6px;
}
.counter { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 26px; }
.units {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;
}
.unit {
  display: flex; flex-direction: column; align-items: center;
  min-width: 64px; padding: 12px 10px 10px;
  background: rgba(255,255,255,0.65); backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.9); border-radius: 18px;
  box-shadow: 0 10px 28px rgba(201,80,107,0.12);
}
.unit-value {
  font-family: 'Noto Serif Georgian', serif; font-weight: 700;
  font-size: clamp(1.5rem, 6vw, 2.2rem); line-height: 1;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(120deg, var(--rose-deep), var(--rose));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: tick 0.4s ease-out;
}
.unit-big .unit-value { animation: tick 0.4s ease-out; }
.unit-label { margin-top: 6px; font-size: 11px; color: var(--muted); letter-spacing: 0.08em; }
@keyframes tick { from { transform: translateY(-6px); opacity: 0.4; } to { transform: none; opacity: 1; } }

.heartbeat { display: inline-block; font-size: 30px; color: var(--rose); animation: beat 1.4s ease-in-out infinite; }
@keyframes beat { 0%,100% { transform: scale(1); } 15% { transform: scale(1.3); } 30% { transform: scale(1); } 45% { transform: scale(1.2); } }

/* Photos */
.photo-wrap { width: 100%; display: flex; justify-content: center; }
.photo-frame {
  position: relative; width: min(100%, 440px);
  padding: 12px; border-radius: 28px;
  background: rgba(255,255,255,0.75); backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.9);
  box-shadow: 0 25px 60px rgba(201,80,107,0.18), 0 6px 18px rgba(0,0,0,0.05);
  transform: rotate(var(--tilt, 0deg));
  transition: transform 0.6s cubic-bezier(.2,.7,.2,1), box-shadow 0.6s ease;
}
.photo-frame:hover { transform: rotate(0deg) scale(1.02); box-shadow: 0 30px 70px rgba(232,120,143,0.35), 0 0 0 4px rgba(233,184,114,0.25); }
.photo-frame img {
  width: 100%; height: auto; max-height: 72vh; object-fit: cover;
  border-radius: 20px; transition: transform 0.8s cubic-bezier(.2,.7,.2,1);
}
.photo-frame:hover img { transform: scale(1.03); }

.love-card { cursor: pointer; user-select: none; touch-action: pan-y; transform: none; transition: transform 0.25s ease-out, box-shadow 0.4s ease; will-change: transform; }
.love-card:hover { transform: none; }
.love-card:focus-visible { outline: 3px solid var(--rose); outline-offset: 4px; }

.burst-heart {
  position: absolute; pointer-events: none; color: var(--rose); z-index: 5;
  transform: translate(-50%, -50%);
  animation: burst 1.5s ease-out forwards;
}
@keyframes burst {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.4) rotate(0); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(1.3) rotate(var(--rot)); }
}

.scroll-hint { margin-top: 18px; color: var(--rose); font-size: 34px; line-height: 1; animation: bounce 1.6s ease-in-out infinite; }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(10px); } }

.tap-hint { margin-top: 26px; color: var(--rose); font-size: 26px; animation: beat 1.6s ease-in-out infinite; }

/* Decorative animations */
.deco { position: absolute; pointer-events: none; z-index: 2; color: var(--rose); }
.d1 { top: -16px; right: 18px; font-size: 26px; animation: bobble 3.2s ease-in-out infinite; }
.d2 { bottom: 26px; left: -14px; font-size: 22px; color: var(--gold); animation: twinkle 2.8s ease-in-out infinite 0.6s; }
.d3 { top: 38%; right: -14px; font-size: 22px; animation: bobble 4s ease-in-out infinite 1.2s; }
@keyframes bobble {
  0%, 100% { transform: translateY(0) rotate(-8deg) scale(1); }
  50% { transform: translateY(-10px) rotate(8deg) scale(1.18); }
}
@keyframes twinkle {
  0%, 100% { transform: scale(0.8) rotate(0); opacity: 0.5; }
  50% { transform: scale(1.3) rotate(20deg); opacity: 1; }
}

.tap-heart {
  position: fixed; z-index: 90; pointer-events: none; color: var(--rose);
  font-size: 26px; transform: translate(-50%, -50%);
  animation: tapPop 1.1s ease-out forwards;
}
@keyframes tapPop {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(0.4) rotate(0); }
  30% { transform: translate(-50%, -90%) scale(1.3) rotate(var(--r)); }
  100% { opacity: 0; transform: translate(-50%, -260%) scale(1) rotate(var(--r)); }
}

/* Music + gate */
.yt-hidden { position: fixed; left: 0; bottom: 0; width: 220px; height: 220px; opacity: 0.01; pointer-events: none; z-index: -1; overflow: hidden; }
.yt-hidden iframe { width: 220px; height: 220px; }
.gate-btn:disabled { cursor: wait; opacity: 0.6; }

.gate {
  position: fixed; inset: 0; z-index: 100;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(160deg, var(--bg) 0%, var(--bg2) 55%, #fdeaf1 100%);
  transition: opacity 0.9s ease, visibility 0.9s ease;
}
.gate-hidden { opacity: 0; visibility: hidden; pointer-events: none; }
.gate-btn {
  background: none; border: none; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
  color: var(--rose-deep); font-family: inherit;
}
.gate-heart {
  font-size: 84px; line-height: 1; color: var(--rose);
  filter: drop-shadow(0 10px 24px rgba(232,120,143,0.45));
  animation: beat 1.4s ease-in-out infinite;
}
.gate-text { font-size: 14px; letter-spacing: 0.25em; opacity: 0.8; }

.music-btn {
  position: fixed; right: 16px; bottom: 16px; z-index: 60;
  width: 46px; height: 46px; border-radius: 50%; cursor: pointer;
  border: 1px solid rgba(255,255,255,0.9);
  background: rgba(255,255,255,0.75); backdrop-filter: blur(10px);
  color: var(--rose-deep); font-size: 18px;
  box-shadow: 0 8px 22px rgba(201,80,107,0.25);
  transition: transform 0.3s ease;
}
.music-btn:hover { transform: scale(1.08); }
.music-btn.is-playing { animation: beat 1.6s ease-in-out infinite; }

@media (max-width: 480px) {
  .section { padding: 48px 16px; }
  .unit { min-width: 56px; padding: 10px 8px 8px; border-radius: 14px; }
  .photo-frame { padding: 9px; border-radius: 22px; }
  .photo-frame img { border-radius: 16px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .reveal { opacity: 1; transform: none; }
}
`;