import React from 'react';
import { UserProgress } from '../types/game';
import { LEVELS } from '../data/levels';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Clock, RotateCcw, Zap, Ghost, EyeOff, Award } from 'lucide-react';

interface StatsModalProps {
  progress: UserProgress;
  onBack: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ progress, onBack }) => {
  const { stats, levelBestTimes, completedLevels } = progress;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}dk ${secs}sn`;
  };

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

        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-amber-400">
          OYUN İSTATİSTİKLERİ
        </h2>

        <div className="w-20" />
      </header>

      {/* Stats Cards Grid */}
      <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-sky-400 mb-2">
            <Award className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-400">Tamamlanan Bölüm</span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-100 tabular-nums">
            {completedLevels.length} / 20
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-400">Toplam Oynama</span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-100 tabular-nums">
            {formatTime(stats.totalPlayTime)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-400">Toplanan Enerji</span>
          </div>
          <span className="text-2xl font-black font-mono text-amber-400 tabular-nums">
            {stats.coinsCollectedTotal}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-rose-400 mb-2">
            <Ghost className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-400">Sahte Çıkış Tuzağı</span>
          </div>
          <span className="text-2xl font-black font-mono text-rose-400 tabular-nums">
            {stats.fakeExitsTriggered}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <EyeOff className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-400">Kaçan Çıkış Olayı</span>
          </div>
          <span className="text-2xl font-black font-mono text-cyan-400 tabular-nums">
            {stats.fleeTriggersTotal}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs font-semibold text-slate-400">Yeniden Başlatma</span>
          </div>
          <span className="text-2xl font-black font-mono text-slate-100 tabular-nums">
            {stats.restartsCount}
          </span>
        </div>
      </div>

      {/* Best Times Record Table */}
      <div className="w-full max-w-4xl bg-slate-900/50 border border-slate-800 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <span>🏆</span>
          <span>Bölüm Tamamlama Rekorları</span>
        </h3>

        {Object.keys(levelBestTimes).length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Henüz tamamlanmış bir bölüm yok.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {LEVELS.map(lvl => {
              const best = levelBestTimes[lvl.id];
              if (!best) return null;
              return (
                <div
                  key={lvl.id}
                  className="flex items-center justify-between px-3 py-2 bg-slate-800/60 rounded-lg text-xs"
                >
                  <span className="font-semibold text-slate-300">
                    Bölüm {lvl.id}: {lvl.name}
                  </span>
                  <span className="font-mono font-bold text-emerald-400 tabular-nums">
                    {best.toFixed(1)} sn
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
