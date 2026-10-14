import React from 'react';
import { LevelDef, UserProgress } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Lock, CheckCircle2, ArrowLeft, Trophy } from 'lucide-react';

interface LevelSelectModalProps {
  levels: LevelDef[];
  progress: UserProgress;
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  levels,
  progress,
  onSelectLevel,
  onBack,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center p-6 bg-[#060814] select-none overflow-y-auto">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between gap-8 py-3 mb-6 border-b border-slate-800">
        <button
          onClick={() => {
            soundManager.playButton();
            onBack();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ana Menü</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400">
          BÖLÜM SEÇİMİ
        </h2>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-300 text-xs sm:text-sm font-bold font-mono">
          <span>⚡ {progress.coins}</span>
        </div>
      </header>

      {/* Levels Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
        {levels.map(lvl => {
          const isUnlocked = progress.unlockedLevels.includes(lvl.id);
          const isCompleted = progress.completedLevels.includes(lvl.id);
          const bestTime = progress.levelBestTimes[lvl.id];

          return (
            <button
              key={lvl.id}
              disabled={!isUnlocked}
              onClick={() => {
                if (isUnlocked) {
                  soundManager.playButton();
                  onSelectLevel(lvl.id);
                }
              }}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between min-h-[110px] ${
                isUnlocked
                  ? 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-700 hover:border-sky-500 cursor-pointer hover:shadow-lg hover:shadow-sky-500/10 hover:scale-[1.02]'
                  : 'bg-slate-950/50 border-slate-800/40 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    BÖLÜM {lvl.id}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 line-clamp-1 mt-0.5">
                    {lvl.name}
                  </h3>
                </div>

                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : !isUnlocked ? (
                  <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm shadow-sky-400 animate-pulse" />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
                {bestTime ? (
                  <span className="flex items-center gap-1 text-emerald-400 tabular-nums">
                    <Trophy className="w-3 h-3" /> {bestTime.toFixed(1)}s
                  </span>
                ) : (
                  <span className="text-slate-500">Hedef: {lvl.parTime}s</span>
                )}
                <span className="text-amber-400 font-semibold">+{lvl.coinReward}⚡</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
