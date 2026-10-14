import React from 'react';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Flame, Zap, Baby } from 'lucide-react';

interface DifficultyModalProps {
  onSelectEasy: () => void;
  onSelectMedium: () => void;
  onSelectHard: () => void;
  onBack: () => void;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  onSelectEasy,
  onSelectMedium,
  onSelectHard,
  onBack,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-[#060814] select-none">
      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl relative">
        <button
          onClick={() => {
            soundManager.playButton();
            onBack();
          }}
          className="absolute top-5 left-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
          title="Geri"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 mt-2 mb-1">
          ZORLUK SEVİYESİ SEÇ
        </h2>
        <p className="text-xs text-slate-400 mb-6">
          Çıkışın nasıl davranacağını belirle.
        </p>

        <div className="flex flex-col gap-3.5 w-full">
          {/* KOLAY BUTTON */}
          <button
            onClick={() => {
              onSelectEasy();
            }}
            className="w-full p-4 bg-slate-950/80 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/80 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                <Baby className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
                  KOLAY MOD
                </div>
                <div className="text-xs text-slate-500 group-hover:text-slate-400">
                  Rahat ve kolay bir labirent... mi acaba? 🍼
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">Seç</span>
          </button>

          {/* ORTA BUTTON */}
          <button
            onClick={() => {
              soundManager.playButton();
              onSelectMedium();
            }}
            className="w-full p-4 bg-slate-950/80 hover:bg-sky-950/40 border border-slate-800 hover:border-sky-500/80 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                  ORTA MOD
                </div>
                <div className="text-xs text-slate-500 group-hover:text-slate-400">
                  Standart kaçan çıkış mekanikleri ve dengeli tuzaklar
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-sky-400">Seç</span>
          </button>

          {/* ZOR BUTTON */}
          <button
            onClick={() => {
              soundManager.playButton();
              onSelectHard();
            }}
            className="w-full p-4 bg-slate-950/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-500/80 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-left flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                  ZOR MOD (SİNİR BOZUCU)
                </div>
                <div className="text-xs text-slate-500 group-hover:text-slate-400">
                  Çıkış her seferinde 5 ila 10 kez rastgele yerlere kaçar!
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">Seç</span>
          </button>
        </div>
      </div>
    </div>
  );
};
