import React from 'react';
import { UserProgress } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Trophy, Sparkles, Home, ShoppingBag, RotateCcw } from 'lucide-react';

interface GameCompleteModalProps {
  progress: UserProgress;
  onMainMenu: () => void;
  onShop: () => void;
  onReplay: () => void;
}

export const GameCompleteModal: React.FC<GameCompleteModalProps> = ({
  progress,
  onMainMenu,
  onShop,
  onReplay,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-amber-500/50 p-6 sm:p-10 rounded-3xl max-w-lg w-full text-center shadow-2xl flex flex-col items-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-purple-600 p-1 mb-5 shadow-xl shadow-amber-500/25">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
            <Trophy className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
          KAÇAN ÇIKIŞ'I YENDİN!
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-2 mb-6 max-w-sm">
          20 ölümcül ve aldatıcı labirentin tamamını aştın, kaçan kapıları yakaladın ve gerçek çıkışın efendisi oldun!
        </p>

        {/* Total Summary */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-6 grid grid-cols-2 gap-3 text-left font-mono">
          <div>
            <div className="text-[11px] text-slate-400">Tamamlanan:</div>
            <div className="text-base font-bold text-emerald-400">20 / 20 Bölüm</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Toplam Enerji:</div>
            <div className="text-base font-bold text-amber-400">{progress.coins} ⚡</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Tetiklenen Tuzak:</div>
            <div className="text-base font-bold text-rose-400">{progress.stats.fakeExitsTriggered} Sahte</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Kaçan Kapı Olayı:</div>
            <div className="text-base font-bold text-cyan-400">{progress.stats.fleeTriggersTotal} Sıçrama</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              soundManager.playButton();
              onShop();
            }}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <ShoppingBag className="w-4 h-4 fill-current" />
            <span>MAĞAZAYA GİT & YENİ GÖRÜNÜM AL</span>
          </button>

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => {
                soundManager.playButton();
                onReplay();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Tekrar Oyna</span>
            </button>

            <button
              onClick={() => {
                soundManager.playButton();
                onMainMenu();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-400" />
              <span>Ana Menü</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
