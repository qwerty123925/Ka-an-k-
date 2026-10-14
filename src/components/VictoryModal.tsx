import React from 'react';
import { LevelDef } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { ArrowRight, RotateCcw, Grid, Trophy, Zap, Clock } from 'lucide-react';

interface VictoryModalProps {
  level: LevelDef;
  timeTaken: number;
  coinsEarned: number;
  isNewRecord: boolean;
  onNextLevel: () => void;
  onRestart: () => void;
  onLevelSelect: () => void;
  isLastLevel: boolean;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  level,
  timeTaken,
  coinsEarned,
  isNewRecord,
  onNextLevel,
  onRestart,
  onLevelSelect,
  isLastLevel,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-sky-500/40 p-6 sm:p-8 rounded-2xl max-w-md w-full text-center shadow-2xl flex flex-col items-center">
        {/* Victory Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-400 p-0.5 mb-4 shadow-lg shadow-sky-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-300 to-cyan-300">
          BÖLÜM TAMAMLANDI!
        </h2>
        <p className="text-xs text-slate-400 mt-1 mb-6 font-medium">
          Bölüm {level.id}: {level.name}
        </p>

        {/* Stats card */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 flex flex-col gap-3 font-mono">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-4 h-4 text-sky-400" /> Tamamlama Süresi:
            </span>
            <span className="font-bold text-slate-100 tabular-nums">
              {timeTaken.toFixed(1)} sn
            </span>
          </div>

          {isNewRecord && (
            <div className="py-1 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
              🎉 YENİ KİŞİSEL REKOR!
            </div>
          )}

          <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-4 h-4 text-amber-400" /> Kazanılan Enerji:
            </span>
            <span className="font-bold text-amber-400 tabular-nums">
              +{coinsEarned} ⚡
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          {!isLastLevel ? (
            <button
              onClick={() => {
                soundManager.playButton();
                onNextLevel();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-emerald-400 hover:from-sky-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <span>SONRAKİ BÖLÜM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                soundManager.playButton();
                onNextLevel(); // Triggers grand finale!
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-purple-500 text-slate-950 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <span>BÜYÜK FİNAL EKRANI</span>
              <Trophy className="w-4 h-4" />
            </button>
          )}

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => {
                soundManager.playButton();
                onRestart();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tekrar Oyna</span>
            </button>

            <button
              onClick={() => {
                soundManager.playButton();
                onLevelSelect();
              }}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Bölümlere Dön</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
