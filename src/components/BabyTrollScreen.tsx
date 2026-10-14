import React, { useEffect, useState, useRef } from 'react';
import { soundManager } from '../audio/soundManager';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface BabyTrollScreenProps {
  onReturnAndPunish: () => void;
}

export const BabyTrollScreen: React.FC<BabyTrollScreenProps> = ({ onReturnAndPunish }) => {
  const [fleesRemaining, setFleesRemaining] = useState(5);
  const [buttonPos, setButtonPos] = useState<{ top: number; left: number } | null>(null);
  const [toastText, setToastText] = useState('Geri dönmek istiyorsan önce butonu yakalamalısın!');
  const lastFleeTimeRef = useRef(0);

  useEffect(() => {
    soundManager.playBabyCry();
    const interval = setInterval(() => {
      soundManager.playBabyCry();
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  // Generate repeating "BEBEK" background grid
  const words = Array.from({ length: 140 }, (_, i) => {
    const emojis = ['👶', '🍼', '😭', '👶🏻', '🧸'];
    return `BEBEK ${emojis[i % emojis.length]}`;
  });

  const trollMessages = [
    'YAKALAYAMAZSIN Kİ! 🏃‍♂️',
    'HOP, BAŞKA KÖŞEYE KAÇTIM! 🍼',
    'BEBEKLER GERİ DÖNEMEZ! 👶',
    'BİRAZ DAHA HIZLI OLMALISIN! 💨',
    'BİR DAHA DENE! ⚡',
  ];

  const handleButtonEscape = (e: React.SyntheticEvent) => {
    const now = performance.now();
    // Debounce slightly to prevent multiple triggers in same millisecond
    if (now - lastFleeTimeRef.current < 250) return;
    lastFleeTimeRef.current = now;

    if (fleesRemaining > 1) {
      e.preventDefault();
      e.stopPropagation();

      const newTop = Math.floor(Math.random() * 65 + 15); // 15% to 80%
      const newLeft = Math.floor(Math.random() * 65 + 15); // 15% to 80%
      setButtonPos({ top: newTop, left: newLeft });

      const nextFlee = fleesRemaining - 1;
      setFleesRemaining(nextFlee);

      const msg = trollMessages[Math.min(5 - fleesRemaining, trollMessages.length - 1)];
      setToastText(msg);
      soundManager.playFlee();
    } else if (fleesRemaining === 1) {
      // Last flee
      e.preventDefault();
      e.stopPropagation();

      // Return to center or safe position and lock
      setButtonPos({ top: 75, left: 50 });
      setFleesRemaining(0);
      setToastText('TAMAM PES ETTİM! Buton durdu, tıkla ve cezaya başla!');
      soundManager.playFlee();
    }
  };

  const handleButtonClick = () => {
    if (fleesRemaining === 0) {
      soundManager.playButton();
      onReturnAndPunish();
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-rose-950/95 flex items-center justify-center select-none z-50">
      {/* Wildly Spinning Fullscreen Background Wrapper */}
      <div 
        className="absolute -inset-[100%] w-[300%] h-[300%] pointer-events-none flex flex-wrap content-center justify-center gap-x-6 gap-y-3 opacity-35 text-rose-300 font-black text-xl sm:text-2xl tracking-widest uppercase rotate-12 animate-[spin_6s_linear_infinite]"
      >
        {words.map((w, idx) => (
          <span key={idx} className="whitespace-nowrap drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]">
            {w}
          </span>
        ))}
      </div>

      {/* Floating Troll Center Modal */}
      <div className="relative z-10 max-w-lg w-[90%] p-6 sm:p-8 bg-slate-950/95 border-4 border-rose-500 rounded-3xl text-center shadow-[0_0_80px_rgba(244,63,94,0.6)] flex flex-col items-center">
        <div className="text-5xl sm:text-6xl mb-3 animate-pulse">
          👶🍼😭
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.8)] tracking-tight">
          BEBEK MİSİN SEN?!
        </h1>

        <div className="my-3 py-2 px-4 rounded-xl bg-rose-900/40 border border-rose-500/50 text-xs sm:text-sm font-bold text-rose-200">
          Bu oyunda &quot;Kolay&quot; mod yok! Kolayı seçtiğin için çıkış butonu bile senden kaçıyor!
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-4">
          Geri döndüğünde çıkış kapısı sürekli başka yerlere ışınlanacak!
        </p>

        {/* Live Escape Status Indicator */}
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-slate-900 border border-rose-500/40 text-xs font-mono font-bold text-amber-300 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastText}</span>
        </div>

        {/* Normal container placeholder if button hasn't fled yet */}
        {!buttonPos && (
          <div className="w-full flex flex-col items-center">
            <span className="text-[11px] text-rose-400/80 font-mono mb-2 animate-pulse">
              🏃‍♂️ Çıkış Butonu Kaçıyor!
            </span>
            <button
              onMouseEnter={handleButtonEscape}
              onPointerDown={handleButtonEscape}
              onClick={handleButtonEscape}
              className="w-full py-4 px-6 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 hover:scale-105 active:scale-95 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-[0_0_30px_rgba(244,63,94,0.8)] transition-all cursor-pointer flex items-center justify-center gap-3 uppercase tracking-wider"
            >
              <RotateCcw className="w-5 h-5 stroke-[3]" />
              <span>GERİ DÖN VE CEZANI ÇEK!</span>
            </button>
          </div>
        )}
      </div>

      {/* The Fleeing Floating Button (moves across screen) */}
      {buttonPos && (
        <div
          style={{
            position: 'fixed',
            top: `${buttonPos.top}%`,
            left: `${buttonPos.left}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 60,
            transition: 'top 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28), left 0.22s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
          }}
          className="flex flex-col items-center"
        >
          {fleesRemaining > 0 && (
            <div className="mb-1.5 px-2.5 py-1 bg-slate-950/90 border border-rose-500 rounded-md text-[11px] font-mono font-bold text-rose-300 shadow-lg animate-bounce">
              🏃‍♂️ Yakalayamazsın!
            </div>
          )}

          <button
            onMouseEnter={fleesRemaining > 0 ? handleButtonEscape : undefined}
            onPointerDown={fleesRemaining > 0 ? handleButtonEscape : undefined}
            onClick={fleesRemaining === 0 ? handleButtonClick : handleButtonEscape}
            className={`py-3.5 px-6 font-black text-sm sm:text-base rounded-2xl shadow-[0_0_35px_rgba(244,63,94,0.9)] transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
              fleesRemaining > 0
                ? 'bg-gradient-to-r from-rose-500 via-purple-600 to-rose-500 text-white cursor-pointer hover:scale-110'
                : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 cursor-pointer animate-pulse scale-105'
            }`}
          >
            <RotateCcw className="w-5 h-5 stroke-[3]" />
            <span>
              {fleesRemaining > 0
                ? trollMessages[Math.min(5 - fleesRemaining, trollMessages.length - 1)]
                : 'TAMAM PES ETTİM, TIKLA VE BAŞLA!'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

