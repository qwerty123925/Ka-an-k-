import React, { useState } from 'react';
import { UserProgress } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { clearUserProgress } from '../utils/storage';
import { ArrowLeft, Volume2, VolumeX, Music, Smartphone, Gauge, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onBack: () => void;
  onShowMessage: (text: string, type?: 'info' | 'prank' | 'flee') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  progress,
  onUpdateProgress,
  onBack,
  onShowMessage,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { settings } = progress;

  const toggleMasterSound = () => {
    const nextVal = !settings.masterSound;
    soundManager.updateConfig(nextVal, settings.sfxVolume, settings.musicEnabled);
    onUpdateProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, masterSound: nextVal },
    }));
  };

  const toggleMusic = () => {
    const nextVal = !settings.musicEnabled;
    soundManager.updateConfig(settings.masterSound, settings.sfxVolume, nextVal);
    onUpdateProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, musicEnabled: nextVal },
    }));
  };

  const toggleScreenShake = () => {
    soundManager.playButton();
    onUpdateProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, screenShake: !prev.settings.screenShake },
    }));
  };

  const handleSensitivityChange = (val: number) => {
    onUpdateProgress(prev => ({
      ...prev,
      settings: { ...prev.settings, controlsSensitivity: val },
    }));
  };

  const handleReset = () => {
    const resetData = clearUserProgress();
    onUpdateProgress(() => resetData);
    soundManager.updateConfig(resetData.settings.masterSound, resetData.settings.sfxVolume, resetData.settings.musicEnabled);
    setShowResetConfirm(false);
    onShowMessage('Bütün ilerleme sıfırlandı.', 'info');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center p-6 bg-[#060814] select-none overflow-y-auto">
      {/* Header */}
      <header className="w-full max-w-2xl flex items-center justify-between gap-8 py-3 mb-6 border-b border-slate-800">
        <button
          onClick={() => {
            soundManager.playButton();
            onBack();
          }}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri</span>
        </button>

        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-slate-200">
          AYARLAR
        </h2>

        <div className="w-16" />
      </header>

      {/* Settings list */}
      <div className="w-full max-w-2xl flex flex-col gap-4 pb-8">
        {/* Master Sound */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {settings.masterSound ? (
              <Volume2 className="w-5 h-5 text-sky-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-500" />
            )}
            <div>
              <div className="text-sm font-bold text-slate-200">Ana Ses</div>
              <div className="text-xs text-slate-400">Tüm oyun seslerini etkinleştir veya kapat</div>
            </div>
          </div>
          <button
            onClick={toggleMasterSound}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.masterSound ? 'bg-sky-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                settings.masterSound ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Ambient Music */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Music className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-bold text-slate-200">Ambiyans Synth Müziği</div>
              <div className="text-xs text-slate-400">Web Audio API ile üretilen retro siber fon müziği</div>
            </div>
          </div>
          <button
            onClick={toggleMusic}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.musicEnabled ? 'bg-purple-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                settings.musicEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Screen Shake */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-sm font-bold text-slate-200">Ekran Sarsıntısı Efekti</div>
              <div className="text-xs text-slate-400">Tuzaklar ve kaçış anlarındaki sarsıntı efektleri</div>
            </div>
          </div>
          <button
            onClick={toggleScreenShake}
            className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
              settings.screenShake ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform transform absolute top-1 ${
                settings.screenShake ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Movement Sensitivity */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-bold text-slate-200">Hareket Hassasiyeti</div>
                <div className="text-xs text-slate-400">Karakterin kayma ve hareket hızı katsayısı</div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              {(settings.controlsSensitivity || 1.0).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min={0.8}
            max={1.4}
            step={0.1}
            value={settings.controlsSensitivity || 1.0}
            onChange={e => handleSensitivityChange(parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>

        {/* Reset Progress Section */}
        <div className="mt-4 p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <div>
              <div className="text-sm font-bold text-rose-300">Tüm İlerlemeyi Sıfırla</div>
              <div className="text-xs text-slate-400">Bölümleri, parayı ve satın alımları temizler</div>
            </div>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Sıfırla
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-100">İlerlemeyi Sıfırla?</h3>
            <p className="text-xs text-slate-400 mt-2 mb-6">
              Bu işlem geri alınamaz. Açtığın tüm bölümler, mağaza eşyaların ve enerjin kalıcı olarak silinecek.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
