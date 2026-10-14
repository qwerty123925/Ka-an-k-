import React from 'react';
import { soundManager } from '../audio/soundManager';
import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-purple-400 mb-6">
          OYUN DURAKLATILDI
        </h2>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              soundManager.playButton();
              onResume();
            }}
            className="w-full py-3 px-4 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>DEVAM ET</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onRestart();
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-sky-400" />
            <span>YENİDEN BAŞLAT (R)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onOpenSettings();
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>AYARLAR</span>
          </button>

          <button
            onClick={() => {
              soundManager.playButton();
              onMainMenu();
            }}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-400" />
            <span>ANA MENÜ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
