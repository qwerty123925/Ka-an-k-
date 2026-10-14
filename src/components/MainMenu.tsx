import React, { useEffect, useRef } from 'react';
import { soundManager } from '../audio/soundManager';
import { UserProgress } from '../types/game';
import { Play, Grid, ShoppingBag, BarChart3, Settings, HelpCircle } from 'lucide-react';

interface MainMenuProps {
  progress: UserProgress;
  onPlay: () => void;
  onOpenLevels: () => void;
  onOpenShop: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHowToPlay: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  onPlay,
  onOpenLevels,
  onOpenShop,
  onOpenStats,
  onOpenSettings,
  onOpenHowToPlay,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background ambient neon maze simulation
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.015;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 600);

      ctx.fillStyle = '#060814';
      ctx.fillRect(0, 0, w, h);

      // Draw faint floating neon maze grid
      ctx.lineWidth = 1.5;
      const spacing = 48;
      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * spacing;
          const y = r * spacing;
          const wave = Math.sin(time + c * 0.3 + r * 0.2);

          if ((c + r) % 3 === 0) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.05 + wave * 0.03})`;
            ctx.strokeRect(x, y, spacing * 0.8, spacing * 0.8);
          } else if ((c * 2 + r) % 4 === 0) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.04 + wave * 0.02})`;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + spacing * 0.6, y + spacing * 0.6);
            ctx.stroke();
          }
        }
      }

      // Floating light orbs
      for (let i = 0; i < 6; i++) {
        const ox = (Math.sin(time * 0.4 + i * 2) * 0.4 + 0.5) * w;
        const oy = (Math.cos(time * 0.3 + i * 1.5) * 0.4 + 0.5) * h;
        const rad = 60 + i * 15;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, rad);
        const col = i % 2 === 0 ? 'rgba(0, 240, 255, 0.08)' : 'rgba(168, 85, 247, 0.08)';
        grad.addColorStop(0, col);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(ox, oy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const highestUnlocked = Math.max(...progress.unlockedLevels, 1);
  const completedCount = progress.completedLevels.length;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-6 select-none overflow-hidden">
      {/* Background Canvas */}
      <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top Bar with Coins & Progress */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between gap-8 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/40 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <div className="w-3.5 h-3.5 bg-sky-400 rounded-sm rotate-45 animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-slate-300">
            Kuvvet Seviyesi {completedCount} / 20
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-300 text-sm font-bold">
            <span className="text-base">⚡</span>
            <span className="font-mono tabular-nums">{progress.coins} Enerji</span>
          </div>
        </div>
      </header>

      {/* Center Hero Logo & Main Navigation */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full my-auto text-center">
        {/* Animated Neon Logo */}
        <div className="mb-8">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.5)]">
            KAÇAN ÇIKIŞ
          </h1>
          <p className="mt-2 text-sm text-slate-400 tracking-wide font-medium">
            Çıkış kaçıyor, duvarlar tuzak kuruyor. Hazır mısın?
          </p>
        </div>

        {/* Primary Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              soundManager.playButton();
              onPlay();
            }}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-slate-950 font-extrabold text-base rounded-xl shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>OYNA (BÖLÜM {highestUnlocked})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onOpenLevels();
            }}
            className="w-full py-3 px-6 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 hover:border-sky-500/50 transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
          >
            <Grid className="w-4 h-4 text-sky-400" />
            <span>BÖLÜMLER (20 BÖLÜM)</span>
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => {
                soundManager.playButton();
                onOpenShop();
              }}
              className="py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-purple-400" />
              <span>MAĞAZA</span>
            </button>

            <button
              onClick={() => {
                soundManager.playButton();
                onOpenStats();
              }}
              className="py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 hover:border-sky-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span>İSTATİSTİK</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => {
                soundManager.playButton();
                onOpenSettings();
              }}
              className="py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 hover:border-slate-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>AYARLAR</span>
            </button>

            <button
              onClick={() => {
                soundManager.playButton();
                onOpenHowToPlay();
              }}
              className="py-3 px-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700/80 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>NASIL OYNANIR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="relative z-10 w-full max-w-4xl flex items-center justify-between text-xs text-slate-500 py-3 border-t border-slate-800/80 font-mono">
        <span>Kontroller: WASD veya Yön Tuşları · R: Yenile · ESC: Duraklat</span>
        <span>v1.0.0</span>
      </footer>
    </div>
  );
};
