import React, { useState, useEffect, useRef } from 'react';
import { Play } from 'lucide-react';

import { GameOptions } from './VoxelGame';

interface LandingPageProps {
  onEnterGame: (options: GameOptions) => void;
}

export default function LandingPage({ onEnterGame }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<'features' | 'modes' | 'world'>('features');
  const [showSelection, setShowSelection] = useState(false);
  const [tempOptions, setTempOptions] = useState<Partial<GameOptions>>({
      avatarSkin: 'robot_soldier',
      companionPet: 'labrador'
  });
  
  // Custom states for interactive elements
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Refs for custom cursor positions
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);

  // Canvas refs
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const worldCanvasRef = useRef<HTMLCanvasElement>(null);

  /* ════════════════════════════════════
     GOOGLE FONTS INJECTION
     ════════════════════════════════════ */
  useEffect(() => {
    const link1 = document.createElement('link');
    link1.rel = 'preconnect';
    link1.href = 'https://fonts.googleapis.com';
    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.crossOrigin = 'anonymous';
    const link3 = document.createElement('link');
    link3.rel = 'stylesheet';
    link3.href = 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,500;1,300;0,700&display=swap';

    document.head.appendChild(link1);
    document.head.appendChild(link2);
    document.head.appendChild(link3);

    return () => {
      document.head.removeChild(link1);
      document.head.removeChild(link2);
      document.head.removeChild(link3);
    };
  }, []);

  /* ════════════════════════════════════
     INTERSECTION OBSERVER (SCROLL REVEAL)
     ════════════════════════════════════ */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -20px 0px' }
    );

    const revealElements = document.querySelectorAll(
      '.scroll-reveal, .stat-item, .feature-card, .mode-card, .showcase-visual, .showcase-text, .cta-text-group, .cta-btns-group'
    );
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  });

  /* ════════════════════════════════════
     NAV GLASS SCROLL TRIGGER
     ════════════════════════════════════ */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* ════════════════════════════════════
     STATS BAR COUNTERS ANIMATION
     ════════════════════════════════════ */
  const stat3Ref = useRef<HTMLSpanElement>(null);
  const stat17Ref = useRef<HTMLSpanElement>(null);
  const stat9Ref = useRef<HTMLSpanElement>(null);
  const stat60Ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const animCount = (el: HTMLSpanElement, target: number, isFps = false) => {
      let current = 0;
      const step = target / 40;
      const tick = () => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current) + (isFps ? '+' : '');
        if (current < target) {
          requestAnimationFrame(tick);
        }
      };
      tick();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            if (stat3Ref.current) animCount(stat3Ref.current, 3);
            if (stat17Ref.current) animCount(stat17Ref.current, 17);
            if (stat9Ref.current) animCount(stat9Ref.current, 9);
            if (stat60Ref.current) animCount(stat60Ref.current, 60, true);
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    const statsBar = document.querySelector('.stats-bar');
    if (statsBar) observer.observe(statsBar);

    return () => {
      if (statsBar) observer.unobserve(statsBar);
    };
  }, []);

  /* ════════════════════════════════════
     CUSTOM CURSOR TRAILING
     ════════════════════════════════════ */
  useEffect(() => {
    const cursor = cursorRef.current;
    const ring = cursorRingRef.current;
    if (!cursor || !ring) return;

    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;

    const onMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      cursor.style.left = `${mx}px`;
      cursor.style.top = `${my}px`;
    };

    window.addEventListener('mousemove', onMouseMove);

    let animationId: number;
    const animRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = `${rx}px`;
      ring.style.top = `${ry}px`;
      animationId = requestAnimationFrame(animRing);
    };
    animRing();

    // Hover scales
    const hoverables = document.querySelectorAll(
      'a, button, [role="button"], .feature-card, .mode-card, .tab'
    );
    const enterHover = () => {
      cursor.style.width = '14px';
      cursor.style.height = '14px';
      ring.style.width = '56px';
      ring.style.height = '56px';
    };
    const leaveHover = () => {
      cursor.style.width = '8px';
      cursor.style.height = '8px';
      ring.style.width = '36px';
      ring.style.height = '36px';
    };

    hoverables.forEach((el) => {
      el.addEventListener('mouseenter', enterHover);
      el.addEventListener('mouseleave', leaveHover);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationId);
      hoverables.forEach((el) => {
        el.removeEventListener('mouseenter', enterHover);
        el.removeEventListener('mouseleave', leaveHover);
      });
    };
  }, []);

  /* ════════════════════════════════════
     STARFIELD + NEBULA RENDERING LOOP
     ════════════════════════════════════ */
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    // Star configuration
    const stars: Array<{
      x: number;
      y: number;
      r: number;
      speed: number;
      twinkle: number;
    }> = [];
    for (let i = 0; i < 220; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.4 + 0.3,
        speed: Math.random() * 0.00015 + 0.00005,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Nebula configuration
    const colors = ['rgba(61,255,160,', 'rgba(91,168,255,', 'rgba(255,107,61,'];
    const nebula: Array<{
      x: number;
      y: number;
      r: number;
      col: string;
      speed: number;
    }> = [];
    for (let i = 0; i < 6; i++) {
      nebula.push({
        x: Math.random(),
        y: Math.random(),
        r: 80 + Math.random() * 120,
        col: colors[i % 3],
        speed: Math.random() * 0.00008,
      });
    }

    let animationId: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw Nebulas
      nebula.forEach((n) => {
        n.x = (n.x + n.speed) % 1;
        const grd = ctx.createRadialGradient(
          n.x * W,
          n.y * H,
          0,
          n.x * W,
          n.y * H,
          n.r
        );
        grd.addColorStop(0, n.col + '0.12)');
        grd.addColorStop(1, n.col + '0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Stars
      stars.forEach((s) => {
        s.twinkle += 0.02;
        s.y = (s.y + s.speed) % 1;
        const alpha = 0.3 + Math.sin(s.twinkle) * 0.4;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  /* ════════════════════════════════════
     ISOMETRIC VOXEL WORLD SHOWCASE LOOP
     ════════════════════════════════════ */
  useEffect(() => {
    const canvas = worldCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = (canvas.width = canvas.offsetWidth);
    let H = (canvas.height = canvas.offsetHeight);

    const onResize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', onResize);

    const BSIZE = 18;
    const COLORS: Record<string, [string, string, string]> = {
      grass: ['#5aa53c', '#4a9030', '#3d7828'],
      dirt: ['#8a5a3c', '#7a4e34', '#6a422c'],
      stone: ['#828590', '#72757f', '#62656f'],
      snow: ['#edf4ff', '#ccd8f0', '#aabae0'],
      wood: ['#6b4a2b', '#5b3a1b', '#4b2a0b'],
      leaves: ['#3d8a3a', '#2d7a2a', '#1d6a1a'],
      gold: ['#d9b441', '#c9a431', '#b99421'],
      water: ['#3a78d6', '#2a68c6', '#1a58b6'],
    };

    const world: Array<{ x: number; y: number; z: number; col: string }> = [];
    
    // Seedable LCG randomizer
    const RNG = ((seed) => {
      let s = seed;
      return () => {
        s = Math.imul(s ^ (s >>> 15), 1 | s);
        s ^= s + Math.imul(s ^ (s >>> 7), 61 | s);
        return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
      };
    })(42);

    // Build Terrain Block Matrix
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        const h = 2 + Math.floor(RNG() * 2 + Math.sin(x * 0.7) * 1.2 + Math.cos(z * 0.6) * 1);
        for (let y = 0; y <= h; y++) {
          world.push({
            x,
            y,
            z,
            col: y === h ? 'grass' : y > h - 2 ? 'dirt' : 'stone',
          });
        }
        if (RNG() > 0.92 && h > 0) {
          // Add a procedural tree
          world.push({ x, y: h + 1, z, col: 'wood' });
          world.push({ x, y: h + 2, z, col: 'wood' });
          for (let lx = -1; lx <= 1; lx++) {
            for (let lz = -1; lz <= 1; lz++) {
              for (let ly = 1; ly <= 2; ly++) {
                if (Math.abs(lx) + Math.abs(lz) + Math.abs(ly - 1) > 2) continue;
                if (!(lx === 0 && lz === 0)) {
                  world.push({ x: x + lx, y: h + 2 + ly, z: z + lz, col: 'leaves' });
                }
              }
            }
          }
        }
        if (RNG() > 0.96) {
          world.push({ x, y: h, z, col: 'gold' });
        }
      }
    }

    // Add boundaries for water flowing
    for (let x = 0; x < 10; x++) {
      for (let z = 0; z < 10; z++) {
        if (!world.find((b) => b.x === x && b.y === 0 && b.z === z)) {
          world.push({ x, y: 0, z, col: 'water' });
        }
      }
    }

    // Sort isometric blocks for proper Z-Buffer sorting
    world.sort((a, b) => a.x + a.z + a.y * 0.01 - (b.x + b.z + b.y * 0.01));

    let angle = 0;
    let animationId: number;

    const drawWorld = () => {
      ctx.clearRect(0, 0, W, H);
      angle += 0.004;
      const cosa = Math.cos(angle);
      const sina = Math.sin(angle);

      const project = (x: number, y: number, z: number) => {
        const rx = (x - 4.5) * cosa - (z - 4.5) * sina;
        const rz = (x - 4.5) * sina + (z - 4.5) * cosa;
        const px = W / 2 + (rx - rz) * BSIZE * 0.82;
        const py = H * 0.54 - y * BSIZE * 0.72 + (rx + rz) * BSIZE * 0.38;
        return { px, py };
      };

      for (const b of world) {
        const { px, py } = project(b.x, b.y, b.z);
        const C = COLORS[b.col] || ['#888', '#666', '#444'];
        const BS = BSIZE;

        // Draw top isometric face
        ctx.fillStyle = C[0];
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + BS * 0.82, py + BS * 0.38);
        ctx.lineTo(px, py + BS * 0.76);
        ctx.lineTo(px - BS * 0.82, py + BS * 0.38);
        ctx.closePath();
        ctx.fill();

        // Draw right isometric face
        ctx.fillStyle = C[1];
        ctx.beginPath();
        ctx.moveTo(px + BS * 0.82, py + BS * 0.38);
        ctx.lineTo(px + BS * 0.82, py + BS * 0.38 + BS * 0.72);
        ctx.lineTo(px, py + BS * 0.76 + BS * 0.72);
        ctx.lineTo(px, py + BS * 0.76);
        ctx.closePath();
        ctx.fill();

        // Draw left isometric face
        ctx.fillStyle = C[2];
        ctx.beginPath();
        ctx.moveTo(px, py + BS * 0.76);
        ctx.lineTo(px, py + BS * 0.76 + BS * 0.72);
        ctx.lineTo(px - BS * 0.82, py + BS * 0.38 + BS * 0.72);
        ctx.lineTo(px - BS * 0.82, py + BS * 0.38);
        ctx.closePath();
        ctx.fill();
      }

      animationId = requestAnimationFrame(drawWorld);
    };

    drawWorld();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  /* ════════════════════════════════════
     MOUSE HOVER GRADIENT POSITION
     ════════════════════════════════════ */
  const onCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    card.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const FAQS = [
    {
      q: 'Làm sao để lưu lại công trình xây dựng của tôi?',
      a: 'Trò chơi tích hợp mã nguồn Autosave thế hệ mới, tự động ghi các khối bạn đặt/phá vào ổ nhớ cục bộ trình duyệt. Khi bạn tải lại hoặc vào đúng phân vùng sinh cảnh, thế giới sẽ hồi sinh vẹn nguyên.',
    },
    {
      q: 'Mở Túi đồ và chế tạo vật phẩm bằng cách nào?',
      a: "Phím E phục vụ mở màn hình túi đồ trên máy tính, hoặc kích hoạt trực tiếp bằng nút '背包 TÚI ĐỒ (E)' trên thanh điều hướng di động để uống dược hoàn hồi máu và rèn các thần khí.",
    },
    {
      q: 'Tôi có thể chơi cùng đồng đội không?',
      a: 'Hoàn toàn khả thi. Hệ thống hỗ trợ chia sẻ liên kết trực tiếp tích hợp phòng ban co-op tức thời để cùng khai khoáng, mài đá hoặc xây pháo đài.',
    },
    {
      q: 'Sự khác biệt giữa Sinh Tồn và Sáng Tạo?',
      a: 'Nền tảng Survival yêu cầu thám hiểm viên né tránh cạm bẫy, nanh quái khát vàng ban đêm để tăng tiến cấp độ. Creative cho phép tự do kiến tạo, đặt phá khối lập phương bất khả xâm phạm.',
    },
  ];

  return (
    <div id="landing-container" className="absolute inset-0 w-full h-full text-slate-100 overflow-y-auto bg-[#050810] font-sans selection:bg-[#3dffa0] selection:text-black scroll-smooth">
      {/* Dynamic Cursor Overlays */}
      <div ref={cursorRef} id="cursor" className="hidden md:block" />
      <div ref={cursorRingRef} id="cursor-ring" className="hidden md:block" />

      {/* Embedded Style Overrides corresponding exactly to the user's HTML template */}
      <style>{`
        :root {
          --void:   #050810;
          --deep:   #090d1a;
          --panel:  #0d1526;
          --border: rgba(255,255,255,0.07);
          --glow1:  #3dffa0;
          --glow2:  #5ba8ff;
          --glow3:  #ff6b3d;
          --text:   #d4ddf5;
          --muted:  #5a6680;
          --mono:   'Space Mono', monospace;
          --display:'Bebas Neue', sans-serif;
          --body:   'DM Sans', sans-serif;
        }

        /* ══════════ CURSOR STYLING ══════════ */
        #cursor {
          width: 8px; height: 8px;
          background: var(--glow1);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          transform: translate(-50%,-50%);
          transition: width .15s, height .15s, opacity .15s;
          mix-blend-mode: screen;
        }
        #cursor-ring {
          width: 36px; height: 36px;
          border: 1px solid rgba(61,255,160,0.4);
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 9998;
          transform: translate(-50%,-50%);
          transition: width .3s, height .3s;
        }

        /* ══════════ GRAIN & STARS OVERLAYS ══════════ */
        #landing-container::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
          opacity: 0.35;
        }

        /* ══════════ SCROLL REVEAL CLASSIFIERS ══════════ */
        .scroll-reveal, .stat-item, .feature-card, .mode-card, .showcase-visual, .showcase-text, .cta-text-group, .cta-btns-group {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
        }
        .scroll-reveal.visible, .stat-item.visible, .feature-card.visible, .mode-card.visible, .showcase-visual.visible, .showcase-text.visible, .cta-text-group.visible, .cta-btns-group.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* Stagger delays */
        .feature-card:nth-child(1) { transition-delay: 0.05s; }
        .feature-card:nth-child(2) { transition-delay: 0.1s; }
        .feature-card:nth-child(3) { transition-delay: 0.15s; }
        .feature-card:nth-child(4) { transition-delay: 0.2s; }
        .feature-card:nth-child(5) { transition-delay: 0.25s; }
        .feature-card:nth-child(6) { transition-delay: 0.3s; }

        .mode-card:nth-child(1) { transition-delay: 0.08s; }
        .mode-card:nth-child(2) { transition-delay: 0.16s; }
        .mode-card:nth-child(3) { transition-delay: 0.24s; }

        /* Voxel Interactive mouse position lighting */
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(61,255,160,0.06), transparent 60%);
          opacity: 0;
          transition: opacity .4s;
          pointer-events: none;
        }
        .feature-card:hover::before { opacity: 1; }

        /* custom keyframed scroll animation */
        @keyframes scrollPulse {
          0%, 100% { opacity: .3; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.3); }
        }
        .scroll-line-ticker {
          animation: scrollPulse 2s ease infinite;
        }

        /* Continuous scrolling marquee */
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-container-track {
          animation: marquee 24s linear infinite;
        }

        /* Outlined typographic stylings */
        .text-stroke-glow {
          -webkit-text-stroke: 1.5px var(--glow1);
          color: rgba(61,255,160,0.08);
          text-shadow: 0 0 20px rgba(61,255,160,0.2);
        }
        .text-stroke-glow-blue {
          -webkit-text-stroke: 1.5px var(--glow2);
          color: rgba(91,168,255,0.08);
          text-shadow: 0 0 20px rgba(91,168,255,0.2);
        }
      `}</style>

      {/* Animated starfield backdrop */}
      <canvas ref={bgCanvasRef} id="bg-canvas" className="fixed inset-0 z-0 pointer-events-none opacity-55" />

      {/* 1. COMPACT NAVBAR */}
      <nav id="nav" className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 md:px-12 pt-[max(16px,env(safe-area-inset-top))] pb-4 border-b transition-all duration-300 ${scrolled ? 'bg-[#050810]/90 backdrop-blur-md border-white/5' : 'bg-transparent border-transparent'}`}>
        <div className="nav-logo text-xl sm:text-2xl font-black tracking-[3px] sm:tracking-[4px] bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff] bg-clip-text text-transparent" style={{ fontFamily: 'var(--display)' }}>
          VOXELVERSE
        </div>
        
        <ul className="hidden md:flex items-center gap-8 font-mono text-[11px] tracking-[2px] uppercase">
          <li>
            <a href="#features" className="text-[#5a6680] hover:text-[#3dffa0] transition-colors">// Features</a>
          </li>
          <li>
            <a href="#modes" className="text-[#5a6680] hover:text-[#3dffa0] transition-colors">// Modes</a>
          </li>
          <li>
            <a href="#world" className="text-[#5a6680] hover:text-[#3dffa0] transition-colors">// World</a>
          </li>
        </ul>

        <button
          onClick={() => setShowSelection(true)}
          className="nav-cta font-mono text-[9px] sm:text-[11px] tracking-[1px] sm:tracking-[2px] uppercase px-3 py-2 sm:px-5 sm:py-2.5 bg-transparent border border-[#3dffa0] rounded-sm text-[#3dffa0] hover:bg-[#3dffa0] hover:text-black transition-all cursor-pointer"
        >
          Play Now
        </button>
      </nav>

      {showSelection && (
        <div className="fixed inset-0 z-[100] bg-[#050810]/95 flex items-center justify-center p-4">
          <div className="bg-[#0d1526] p-8 rounded-lg border border-white/10 max-w-lg w-full text-center">
             <h2 className="text-2xl font-bold mb-6 text-white" style={{ fontFamily: 'var(--display)' }}>CHỌN NHÂN VẬT & THÚ CƯNG</h2>
             
         <div className="mb-6">
             <p className="text-sm text-[#5a6680] mb-2 uppercase font-mono tracking-wider">Nhân vật</p>
             <div className="flex gap-4 justify-center">
                {['robot_soldier', 'castle_char'].map(skin => (
                  <button key={skin} onClick={() => setTempOptions({...tempOptions, avatarSkin: skin as any})} className={`p-4 border-2 rounded-md ${tempOptions.avatarSkin === skin ? 'border-[#3dffa0]' : 'border-white/10'} hover:border-[#3dffa0]/50 transition-all`}>
                     <div className="w-20 h-20 bg-slate-800 flex items-center justify-center text-xs text-slate-500 mb-2 border border-white/10 rounded overflow-hidden">
                        <img src={`/${skin === 'robot_soldier' ? 'robot-soldier-voxel' : 'voxel-castle-character-a'}.webp`} alt={skin} className="w-full h-full object-cover" />
                     </div>
                     <span className="text-xs">{skin === 'robot_soldier' ? '🤖 Robot' : '🏰 Castle'}</span>
                  </button>
                ))}
             </div>
          </div>

          <div className="mb-8">
             <p className="text-sm text-[#5a6680] mb-2 uppercase font-mono tracking-wider">Thú cưng / Hỗ trợ</p>
             <div className="flex gap-4 justify-center">
                {['labrador', 'poodle'].map(pet => (
                  <button key={pet} onClick={() => setTempOptions({...tempOptions, companionPet: pet as any})} className={`p-4 border-2 rounded-md ${tempOptions.companionPet === pet ? 'border-[#5ba8ff]' : 'border-white/10'} hover:border-[#5ba8ff]/50 transition-all`}>
                     <div className="w-20 h-20 bg-slate-800 flex items-center justify-center text-xs text-slate-500 mb-2 border border-white/10 rounded overflow-hidden">
                        <img src={`/${pet === 'labrador' ? 'dog-labrador.png' : 'dog-poodle.png'}`} alt={pet} className="w-full h-full object-cover" />
                     </div>
                     <span className="text-xs">{pet === 'labrador' ? '🐶 Cún' : '🐩 Poodle'}</span>
                  </button>
                ))}
             </div>
          </div>

             <button 
                onClick={() => {
                   onEnterGame({
                       name: 'Player',
                       seed: 'voxelverse-2026',
                       mode: 'treasure',
                       difficulty: 'normal',
                       biome: 'plains',
                       botCount: '3',
                       room: 'lobby',
                       skinColor: '#dbcca0',
                       shirtColor: '#3b82f6',
                       pantsColor: '#1d4ed8',
                       avatarSkin: tempOptions.avatarSkin as any || 'robot_soldier',
                       companionPet: tempOptions.companionPet as any || 'labrador'
                   });
                }}
                className="w-full py-3 bg-[#3dffa0] text-black font-bold uppercase tracking-wider rounded-sm hover:bg-[#2ecc71] transition-all"
             >
                Bắt đầu game
             </button>
          </div>
        </div>
      )}

      {/* 2. HERO LAYER */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 md:px-6 pt-28 pb-16 md:pt-36 md:pb-24 z-10">
        <p className="hero-eyebrow font-mono text-[9px] sm:text-[11px] tracking-[2.5px] sm:tracking-[4px] uppercase text-[#3dffa0] mb-4 flex items-center justify-center">
          <span className="text-[#5a6680] mr-2">//</span> Web Voxel Sandbox · 2026 Edition <span className="text-[#5a6680] ml-2">//</span>
        </p>

        <h1 className="hero-title text-4xl xs:text-5xl sm:text-7xl md:text-[8vw] lg:text-[10vw] xl:text-[130px] leading-[0.95] tracking-[4px] sm:tracking-[8px] text-white font-bold block select-none" style={{ fontFamily: 'var(--display)' }}>
          VOXEL
          <span className="text-stroke-glow block">VERSE</span>
          <span className="text-stroke-glow-blue block">2.0</span>
        </h1>

        <p className="hero-sub mt-4 text-[11px] sm:text-sm md:text-base text-[#5a6680] max-w-sm md:max-w-lg leading-relaxed px-2">
          Thế giới voxel hoàn toàn trong trình duyệt. Xây dựng, sinh tồn, khám phá — không cần cài đặt, không cần plugin.
        </p>

        <div className="hero-actions mt-8 md:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4 justify-center w-full max-w-xs sm:max-w-none px-4">
          <button
            onClick={() => setShowSelection(true)}
            className="btn-primary font-mono text-[11px] md:text-[12px] tracking-[2px] md:tracking-[3px] uppercase px-5 sm:px-9 py-3 sm:py-4 bg-[#3dffa0] text-black font-bold border-none rounded-sm cursor-pointer shadow-[0_0_30px_rgba(61,255,160,0.2)] hover:shadow-[0_0_50px_rgba(61,255,160,0.35)] transition-all text-center"
          >
            ▶ CHƠI NGAY
          </button>
          
          <a
            href="#features"
            className="btn-secondary font-mono text-[11px] md:text-[12px] tracking-[2px] md:tracking-[3px] uppercase px-5 sm:px-9 py-3 sm:py-4 bg-transparent border border-white/10 text-[#d4ddf5] hover:border-[#5ba8ff] hover:text-[#5ba8ff] transition-all rounded-sm text-center"
          >
            TÍNH NĂNG
          </a>
        </div>

        {/* scroll indicator */}
        <div className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono text-[9px] tracking-[3px] text-[#5a6680] uppercase">
          <div className="scroll-line-ticker w-[1px] h-[36px] md:h-[50px] bg-gradient-to-b from-[#3dffa0] to-transparent" />
          SCROLL
        </div>
      </section>

      {/* 3. DYNAMIC STATS PILL BAR */}
      <div className="stats-bar border-t border-b border-white/5 py-6 px-4 z-10 relative bg-[#050810]/40">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-6 md:divide-x divide-white/5">
          <div className="stat-item text-center px-4">
            <span ref={stat3Ref} className="stat-num font-mono text-3xl md:text-5xl font-black bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff] bg-clip-text text-transparent block h-9 md:h-14" />
            <span className="stat-label font-mono text-[9px] md:text-[10px] tracking-[2px] uppercase text-[#5a6680] mt-1.5 block">Chế Độ Chơi</span>
          </div>
          <div className="stat-item text-center px-4">
            <span ref={stat17Ref} className="stat-num font-mono text-3xl md:text-5xl font-black bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff] bg-clip-text text-transparent block h-9 md:h-14" />
            <span className="stat-label font-mono text-[9px] md:text-[10px] tracking-[2px] uppercase text-[#5a6680] mt-1.5 block">Loại Khối</span>
          </div>
          <div className="stat-item text-center px-4">
            <span ref={stat9Ref} className="stat-num font-mono text-3xl md:text-5xl font-black bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff] bg-clip-text text-transparent block h-9 md:h-14" />
            <span className="stat-label font-mono text-[9px] md:text-[10px] tracking-[2px] uppercase text-[#5a6680] mt-1.5 block">Loại Mob</span>
          </div>
          <div className="stat-item text-center px-4 animate-pulse">
            <span ref={stat60Ref} className="stat-num font-mono text-3xl md:text-5xl font-black bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff] bg-clip-text text-transparent block h-9 md:h-14" />
            <span className="stat-label font-mono text-[9px] md:text-[10px] tracking-[2px] uppercase text-[#5a6680] mt-1.5 block">FPS Mượt</span>
          </div>
        </div>
      </div>

      {/* 4. CLINICAL FEATURES */}
      <section className="section max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24 z-10 relative" id="features">
        <p className="section-tag font-mono text-[10px] tracking-[4px] uppercase text-[#3dffa0] mb-4">// Tính Năng</p>
        <h2 className="section-title text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[4px] text-white font-bold mb-12 uppercase" style={{ fontFamily: 'var(--display)' }}>
          ĐƯỢC<br />TRANG BỊ<br />ĐẦY ĐỦ
        </h2>

        <div className="features-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div onMouseMove={onCardMouseMove} className="feature-card p-6 md:p-8 bg-[#090d1a]/50 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:bg-[#0f1a2e]/50 hover:border-white/10">
            <span className="feature-icon text-3xl mb-4 block">🌙</span>
            <h3 className="feature-name text-2xl tracking-[2px] text-white mb-2" style={{ fontFamily: 'var(--display)' }}>NGÀY / ĐÊM</h3>
            <p className="feature-desc text-xs md:text-sm text-[#5a6680] leading-[1.7]">
              Chu kỳ thời gian thực với mặt trời, mặt trăng, sao trời. Ánh sáng thay đổi động — bình minh đỏ cam, hoàng hôn tím hồng, đêm đen kịt đầy nguy hiểm.
            </p>
            <span className="feature-tag inline-block mt-4 font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 border border-white/5 bg-[#3dffa0]/5 rounded-sm text-[#3dffa0]">DYNAMIC LIGHTING</span>
          </div>

          {/* Card 2 */}
          <div onMouseMove={onCardMouseMove} className="feature-card p-6 md:p-8 bg-[#090d1a]/50 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:bg-[#0f1a2e]/50 hover:border-white/10">
            <span className="feature-icon text-3xl mb-4 block">🧟</span>
            <h3 className="feature-name text-2xl tracking-[2px] text-white mb-2" style={{ fontFamily: 'var(--display)' }}>BOT & MOB AI</h3>
            <p className="feature-desc text-xs md:text-sm text-[#5a6680] leading-[1.7]">
              Zombie, Skeleton, Spider, Creeper, Wolf tấn công ban đêm. Cow, Pig, Chicken, Sheep lang thang. AI pathfinding và aggro system hoàn chỉnh.
            </p>
            <span className="feature-tag inline-block mt-4 font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 border border-white/5 bg-[#3dffa0]/5 rounded-sm text-[#3dffa0]">9 LOẠI ENTITY</span>
          </div>

          {/* Card 3 */}
          <div onMouseMove={onCardMouseMove} className="feature-card p-6 md:p-8 bg-[#090d1a]/50 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:bg-[#0f1a2e]/50 hover:border-white/10">
            <span className="feature-icon text-3xl mb-4 block">🏪</span>
            <h3 className="feature-name text-2xl tracking-[2px] text-white mb-2" style={{ fontFamily: 'var(--display)' }}>CỬA HÀNG</h3>
            <p className="feature-desc text-xs md:text-sm text-[#5a6680] leading-[1.7]">
              Mua vũ khí, công cụ, thức ăn, trang phục bằng vàng 🪙. Khai thác quặng vàng, kim cương để giàu lên. Shop có 4 tab với 20+ vật phẩm.
            </p>
            <span className="feature-tag inline-block mt-4 font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 border border-white/5 bg-[#3dffa0]/5 rounded-sm text-[#3dffa0]">ECONOMY SYSTEM</span>
          </div>

          {/* Card 4 */}
          <div onMouseMove={onCardMouseMove} className="feature-card p-6 md:p-8 bg-[#090d1a]/50 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:bg-[#0f1a2e]/50 hover:border-white/10">
            <span className="feature-icon text-3xl mb-4 block">⚙️</span>
            <h3 className="feature-name text-2xl tracking-[2px] text-white mb-2" style={{ fontFamily: 'var(--display)' }}>WEBGL ENGINE</h3>
            <p className="feature-desc text-xs md:text-sm text-[#5a6680] leading-[1.7]">
              Three.js engine với greedy meshing, frustum culling, chunk streaming. Chạy mượt trên cả desktop lẫn mobile. Không cần GPU rời.
            </p>
            <span className="feature-tag inline-block mt-4 font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 border border-white/5 bg-[#3dffa0]/5 rounded-sm text-[#3dffa0]">60 FPS TARGET</span>
          </div>

          {/* Card 5 */}
          <div onMouseMove={onCardMouseMove} className="feature-card p-6 md:p-8 bg-[#090d1a]/50 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:bg-[#0f1a2e]/50 hover:border-white/10">
            <span className="feature-icon text-3xl mb-4 block">🌋</span>
            <h3 className="feature-name text-2xl tracking-[2px] text-white mb-2" style={{ fontFamily: 'var(--display)' }}>6 BIOME</h3>
            <p className="feature-desc text-xs md:text-sm text-[#5a6680] leading-[1.7]">
              Plains, Forest, Desert, Snow, Cherry Blossom, Volcano. Mỗi biome có địa hình, cây cối và block riêng biệt. Procedurally generated bằng Perlin noise.
            </p>
            <span className="feature-tag inline-block mt-4 font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 border border-white/5 bg-[#3dffa0]/5 rounded-sm text-[#3dffa0]">PROCEDURAL GEN</span>
          </div>

          {/* Card 6 */}
          <div onMouseMove={onCardMouseMove} className="feature-card p-6 md:p-8 bg-[#090d1a]/50 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:bg-[#0f1a2e]/50 hover:border-white/10">
            <span className="feature-icon text-3xl mb-4 block">📱</span>
            <h3 className="feature-name text-2xl tracking-[2px] text-white mb-2" style={{ fontFamily: 'var(--display)' }}>MOBILE READY</h3>
            <p className="feature-desc text-xs md:text-sm text-[#5a6680] leading-[1.7]">
              Joystick ảo, look zone, action buttons. Multi-touch không conflict. Tự động điều chỉnh chất lượng theo thiết bị — Low, Mid, High tier.
            </p>
            <span className="feature-tag inline-block mt-4 font-mono text-[9px] tracking-[1.5px] uppercase px-2 py-0.5 border border-white/5 bg-[#3dffa0]/5 rounded-sm text-[#3dffa0]">TOUCH OPTIMIZED</span>
          </div>
        </div>
      </section>

      {/* 5. SEAMLESS MARQUEE */}
      <div className="marquee-wrap overflow-hidden border-t border-b border-white/5 py-4 mb-20 z-10 relative bg-[#050810]/60">
        <div className="marquee-container-track flex gap-12 whitespace-nowrap">
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
             <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />VOXELVERSE 2026
           </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />SURVIVAL MODE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />CREATIVE MODE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />ADVENTURE MODE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />9 MOB TYPES
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />DAY NIGHT CYCLE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />PROCEDURAL WORLD
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />MOBILE SUPPORT
          </span>
          
          {/* duplicate for seamless loop */}
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />VOXELVERSE 2026
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />SURVIVAL MODE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />CREATIVE MODE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />ADVENTURE MODE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />9 MOB TYPES
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />DAY NIGHT CYCLE
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />PROCEDURAL WORLD
          </span>
          <span className="marquee-item font-bold text-xl tracking-[4px] text-[#5a6680] flex items-center gap-5 shrink-0" style={{ fontFamily: 'var(--display)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3dffa0] shrink-0" />MOBILE SUPPORT
          </span>
        </div>
      </div>

      {/* 6. GAME MODES (4 CON DUONG) */}
      <section className="modes-section max-w-[1200px] mx-auto px-6 md:px-10 pb-16 md:pb-24 z-10 relative" id="modes">
        <p className="section-tag font-mono text-[10px] tracking-[4px] uppercase text-[#3dffa0] mb-4">// Chế Độ Chơi</p>
        <h2 className="section-title text-3xl md:text-5xl lg:text-6xl leading-[1.05] tracking-[4px] text-white font-bold mb-12 uppercase" style={{ fontFamily: 'var(--display)' }}>
          4 CON<br />ĐƯỜNG
        </h2>

        <div className="modes-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Mode 1 */}
          <div className="mode-card creative p-6 md:p-8 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:border-white/10 bg-[#090d1a]/50">
            <p className="mode-num font-mono text-[10px] tracking-[3px] text-[#5a6680] mb-4">01 //</p>
            <h3 className="mode-name text-3xl md:text-4xl text-[#3dffa0] tracking-[3px] mb-3 uppercase" style={{ fontFamily: 'var(--display)' }}>CREATIVE</h3>
            <p className="mode-desc text-xs md:text-sm text-[#5a6680] leading-[1.7] mb-5">
              Tự do tuyệt đối. Bay khắp nơi, đặt block không giới hạn, không có kẻ thù, không bị đói. Chỉ cần xây dựng và sáng tạo.
            </p>
            <ul className="mode-features flex flex-col gap-2 font-mono text-[11px] text-[#d4ddf5]">
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Bay không giới hạn</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Tất cả block ∞</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Không damage</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Không đói</li>
            </ul>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff]" />
          </div>

          {/* Mode 2 */}
          <div className="mode-card survival p-6 md:p-8 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:border-white/10 bg-[#090d1a]/50">
            <p className="mode-num font-mono text-[10px] tracking-[3px] text-[#5a6680] mb-4">02 //</p>
            <h3 className="mode-name text-3xl md:text-4xl text-[#ff6b3d] tracking-[3px] mb-3 uppercase" style={{ fontFamily: 'var(--display)' }}>SURVIVAL</h3>
            <p className="mode-desc text-xs md:text-sm text-[#5a6680] leading-[1.7] mb-5">
              Sống sót qua từng đêm. Quản lý HP, độ đói, chiến đấu với mob. Ban đêm quái vật tăng sinh vô lượng — hãy cẩn thận.
            </p>
            <ul className="mode-features flex flex-col gap-2 font-mono text-[11px] text-[#d4ddf5]">
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> HP & hunger system</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Mob AI tấn công</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Infinite night spawner</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Leveling & XP</li>
            </ul>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#ff6b3d] to-[#ff3d6b]" />
          </div>

          {/* Mode 3 */}
          <div className="mode-card adventure p-6 md:p-8 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:border-white/10 bg-[#090d1a]/50">
            <p className="mode-num font-mono text-[10px] tracking-[3px] text-[#5a6680] mb-4">03 //</p>
            <h3 className="mode-name text-3xl md:text-4xl text-[#5ba8ff] tracking-[3px] mb-3 uppercase" style={{ fontFamily: 'var(--display)' }}>ADVENTURE</h3>
            <p className="mode-desc text-xs md:text-sm text-[#5a6680] leading-[1.7] mb-5">
              Khám phá thế giới rộng lớn, buôn bán tại cửa hàng, thu thập vật phẩm hiếm. Hành trình không hồi kết.
            </p>
            <ul className="mode-features flex flex-col gap-2 font-mono text-[11px] text-[#d4ddf5]">
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Shop economy</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Item collection</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Gold & trading</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Multiple biomes</li>
            </ul>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#5ba8ff] to-[#a855f7]" />
          </div>

          {/* Mode 4 */}
          <div className="mode-card treasure p-6 md:p-8 border border-white/5 rounded-md relative overflow-hidden transition-all duration-300 hover:border-white/10 bg-[#090d1a]/50">
            <p className="mode-num font-mono text-[10px] tracking-[3px] text-[#5a6680] mb-4">04 //</p>
            <h3 className="mode-name text-3xl md:text-4xl text-[#eab308] tracking-[3px] mb-3 uppercase" style={{ fontFamily: 'var(--display)' }}>TREASURE</h3>
            <p className="mode-desc text-xs md:text-sm text-[#5a6680] leading-[1.7] mb-5">
              Bước vào vùng đất dung nham đỏ rực chứa đầy rương kho báu và khối Chìa khóa vàng, dưới sự truy lùng của vô hạn zombie!
            </p>
            <ul className="mode-features flex flex-col gap-2 font-mono text-[11px] text-[#d4ddf5]">
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Hot lava oceans</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Unlimited zombies</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Key & Chest hunt</li>
              <li className="flex items-center gap-2.5 text-[#d4ddf5]"><span className="text-[#5a6680]">→</span> Intense survival</li>
            </ul>
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#eab308] to-[#ef4444]" />
          </div>
        </div>
      </section>

      {/* 7. WORLD ENGINE SHOWCASE WITH ROTATING ISOMETRIC voxel SCENE */}
      <section className="showcase-section max-w-[1200px] mx-auto px-6 md:px-10 pb-16 md:pb-24 z-10 relative" id="world">
        <div className="showcase-grid grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          
          {/* Isometric World Canvas Visualizer */}
          <div className="showcase-visual aspect-video md:aspect-[4/3] bg-[#0d1526]/50 border border-white/5 rounded-md overflow-hidden relative">
            <canvas ref={worldCanvasRef} id="worldCanvas" className="w-full h-full block" />
          </div>

          <div className="showcase-text">
            <p className="section-tag font-mono text-[10px] tracking-[4px] uppercase text-[#3dffa0] mb-3">// World Engine</p>
            <h3 className="text-3xl md:text-5xl leading-[1.1] tracking-[3px] text-white font-bold mb-4 uppercase" style={{ fontFamily: 'var(--display)' }}>
              THẾ GIỚI<br />VÔ TẬN
            </h3>
            
            <p className="text-xs md:text-sm text-[#5a6680] leading-[1.8] mb-3">
              Mọi world đều khác nhau hoàn toàn. Thuật toán Perlin noise FBM 5 octave tạo địa hình núi non, hang động, đại dương tự nhiên.
            </p>
            <p className="text-xs md:text-sm text-[#5a6680] leading-[1.8] mb-5">
              Chunk streaming real-time — chỉ load những gì cần thiết, unload những gì quá xa. Hỗ trợ seed custom để chia sẻ world với bạn bè.
            </p>

            <ul className="showcase-list flex flex-col gap-2.5 font-mono text-[10px] md:text-[11px] text-[#d4ddf5]">
              <li className="flex items-center gap-3">
                <span className="chip bg-[#3dffa0]/10 border border-[#3dffa0]/20 text-[#3dffa0] px-2 py-0.5 rounded-sm text-[9px] tracking-[1.5px] font-bold">CHUNK 16×128×16</span> Dynamic loading
              </li>
              <li className="flex items-center gap-3">
                <span className="chip bg-[#3dffa0]/10 border border-[#3dffa0]/20 text-[#3dffa0] px-2 py-0.5 rounded-sm text-[9px] tracking-[1.5px] font-bold">CAVE GEN</span> Perlin cave carving
              </li>
              <li className="flex items-center gap-3">
                <span className="chip bg-[#3dffa0]/10 border border-[#3dffa0]/20 text-[#3dffa0] px-2 py-0.5 rounded-sm text-[9px] tracking-[1.5px] font-bold">TREE GEN</span> Procedural forests
              </li>
              <li className="flex items-center gap-3">
                <span className="chip bg-[#3dffa0]/10 border border-[#3dffa0]/20 text-[#3dffa0] px-2 py-0.5 rounded-sm text-[9px] tracking-[1.5px] font-bold">ORE GEN</span> Gold & Diamond veins
              </li>
              <li className="flex items-center gap-3">
                <span className="chip bg-[#3dffa0]/10 border border-[#3dffa0]/20 text-[#3dffa0] px-2 py-0.5 rounded-sm text-[9px] tracking-[1.5px] font-bold">SEA LEVEL</span> Water at Y=30
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section id="faq-section" className="border-t border-white/5 bg-[#050810]/40 py-16 md:py-20 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl md:text-4xl font-bold tracking-[3px] text-white uppercase text-center mb-10" style={{ fontFamily: 'var(--display)' }}>
            Cẩm Nang Khẩn Cấp (Hỏi Đáp)
          </h2>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
               const isOpen = openFaq === idx;
               return (
                 <div
                   key={idx}
                   className="rounded-sm border border-white/5 bg-[#090d1a]/50 hover:bg-[#0f1a2e]/30 overflow-hidden transition-all duration-300"
                 >
                   <button
                     onClick={() => setOpenFaq(isOpen ? null : idx)}
                     className="w-full text-left px-5 py-4 flex items-center justify-between font-bold text-[#d4ddf5] text-xs md:text-sm hover:text-[#3dffa0] cursor-pointer select-none transition-colors"
                   >
                     <span className="font-mono text-[11px] md:text-xs tracking-wider uppercase">{faq.q}</span>
                     <span className="text-[10px] md:text-xs text-[#3dffa0] font-mono leading-none">
                       {isOpen ? '[ - ]' : '[ + ]'}
                     </span>
                   </button>

                   {isOpen && (
                     <div className="border-t border-white/5 px-5 py-4 text-xs md:text-sm text-[#5a6680] leading-relaxed bg-[#050810]/40">
                       {faq.a}
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        </div>
      </section>

      {/* 9. BIG PLAY NOW CTA BLOCK */}
      <section className="cta-section py-16 md:py-24 text-center relative overflow-hidden z-10" id="cta">
        <div className="cta-glow absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(61,255,160,0.12),transparent_65%)] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="cta-text-group px-6">
          <h2 className="text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-[6px] text-white font-bold mb-4 select-none uppercase" style={{ fontFamily: 'var(--display)' }}>
            PLAY<br />NOW
          </h2>
          <p className="text-xs md:text-sm text-[#5a6680] mb-8 max-w-sm mx-auto">
            Không cần cài đặt. Mở trình duyệt và bắt đầu ngay thế giới mộng thế.
          </p>
        </div>

        <div className="cta-btns-group flex gap-4 justify-center items-center flex-wrap px-6">
          <button
            onClick={onEnterGame}
            className="btn-primary font-mono text-[11px] md:text-[12px] tracking-[2px] md:tracking-[3px] uppercase px-7 md:px-9 py-3.5 md:py-4 bg-[#3dffa0] text-black font-bold border-none rounded-sm cursor-pointer shadow-[0_0_40px_rgba(61,255,160,0.25)] hover:shadow-[0_0_60px_rgba(61,255,160,0.4)] transition-all"
          >
            ▶ CHƠI VOXELVERSE
          </button>
          
          <span className="btn-secondary font-mono text-[11px] md:text-[12px] tracking-[2px] md:tracking-[3px] uppercase px-7 md:px-9 py-3.5 md:py-4 bg-transparent border border-white/5 text-[#d4ddf5] rounded-sm select-none" style={{ cursor: 'default' }}>
            WebGL · No Download
          </span>
        </div>
      </section>

      {/* 10. PRECISE LOWER FOOTER */}
      <footer className="border-t border-white/5 p-6 md:p-10 flex flex-col md:flex-row justify-between items-center flex-wrap gap-4 relative z-10 bg-[#050810]/95">
        <div className="footer-logo text-lg font-bold tracking-[4px] bg-gradient-to-r from-[#3dffa0] to-[#5ba8ff] bg-clip-text text-transparent" style={{ fontFamily: 'var(--display)' }}>
          VOXELVERSE
        </div>
        
        <p className="footer-copy font-mono text-[9px] md:text-[10px] tracking-[2px] text-[#5a6680] order-last md:order-none">
          © 2026 VOXELVERSE · Built by Nhutcoder
        </p>
        
        <ul className="footer-links flex gap-6 font-mono text-[9px] md:text-[10px] tracking-[2px] uppercase text-[#5a6680]">
          <li><a href="#play" className="hover:text-[#3dffa0] transition-colors">Play</a></li>
          <li><a href="#features" className="hover:text-[#3dffa0] transition-colors">Features</a></li>
          <li><a href="#modes" className="hover:text-[#3dffa0] transition-colors">Modes</a></li>
        </ul>
      </footer>
    </div>
  );
}
