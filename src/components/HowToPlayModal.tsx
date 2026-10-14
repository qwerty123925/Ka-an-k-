import React from 'react';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Compass, EyeOff, ShieldAlert, Key, Sparkles } from 'lucide-react';

interface HowToPlayModalProps {
  onBack: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onBack }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center p-6 bg-[#060814] select-none overflow-y-auto">
      {/* Header */}
      <header className="w-full max-w-3xl flex items-center justify-between gap-8 py-3 mb-6 border-b border-slate-800">
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

        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-400">
          NASIL OYNANIR?
        </h2>

        <div className="w-16" />
      </header>

      {/* Guide Cards */}
      <div className="w-full max-w-3xl flex flex-col gap-4 pb-8">
        {/* Card 1: The Fleeing Exit */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-sky-500/30 flex gap-4 items-start">
          <div className="p-3 bg-sky-950/60 border border-sky-500/40 rounded-xl text-sky-400 shrink-0">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-sky-300">1. Çıkış Kaçabilir!</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Oyunun adı boşuna <strong>Kaçan Çıkış</strong> değil! Bazı bölümlerde kapıya çok yaklaştığında portal siber bir sıçramayla başka bir koridora ışınlanır. Panik yapma; kaçışın kuralları adildir, yeni belirdiği konumu takip et.
            </p>
          </div>
        </div>

        {/* Card 2: Fake Exits */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-rose-500/30 flex gap-4 items-start">
          <div className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-400 shrink-0">
            <EyeOff className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-300">2. Sahte Kapılar & Bitiş Çizgileri</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Her parıldayan kapı kurtuluş değildir. Bazı kapılar seni trollemek için oradadır ve komik mesajlarla seni geri çevirir. Gerçek çıkış ise turkuaz-yeşil bir kuantum girdabıdır.
            </p>
          </div>
        </div>

        {/* Card 3: Moving Walls */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-purple-500/30 flex gap-4 items-start">
          <div className="p-3 bg-purple-950/60 border border-purple-500/40 rounded-xl text-purple-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-purple-300">3. Hareketli Duvarlar & Kuantum Geçitler</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Labirent canlıdır! Mor devriye duvarları koridorları kapatır veya belirli aralıklarla yanıp sönen geçitler açılır. Zamanlamanı iyi ayarla; duvarlar seni ezmez ama yolunu tıkayabilir.
            </p>
          </div>
        </div>

        {/* Card 4: Cyber Keys & Collectibles */}
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-amber-500/30 flex gap-4 items-start">
          <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300">4. Siber Anahtarlar & Enerji Parçaları</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
              Kırmızı lazer bariyerlerin ardındaki çıkışa ulaşmak için önce mavi siber anahtarları toplamalısın. Yolda bulduğun altın sarısı enerji parçacıkları ise mağazada yeni görünümler almanı sağlar.
            </p>
          </div>
        </div>

        {/* Controls recap */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400 flex flex-wrap gap-4 justify-between items-center">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <strong>Kontroller:</strong> W, A, S, D veya Yön Tuşları
          </span>
          <span><strong>R:</strong> Bölümü Hızlı Yeniden Başlat</span>
          <span><strong>ESC:</strong> Duraklat</span>
        </div>
      </div>
    </div>
  );
};
