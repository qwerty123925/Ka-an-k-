import React, { useState, useEffect, useRef } from 'react';
import { UserProgress, CharacterShape } from '../types/game';
import { SKINS, TRAILS, SHAPES } from '../data/shopItems';
import { soundManager } from '../audio/soundManager';
import { ArrowLeft, Check, Sparkles, Shield, Orbit } from 'lucide-react';

interface ShopModalProps {
  progress: UserProgress;
  onUpdateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onBack: () => void;
  onShowMessage: (text: string, type?: 'info' | 'prank' | 'flee') => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  progress,
  onUpdateProgress,
  onBack,
  onShowMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'trails' | 'shapes'>('skins');
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [selectedSkinId, setSelectedSkinId] = useState<string>(progress.equippedSkin);
  const [selectedTrailId, setSelectedTrailId] = useState<string>(progress.equippedTrail);
  const [selectedShape, setSelectedShape] = useState<CharacterShape>(progress.equippedShape);

  // Live Canvas Preview of Player Character
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: { x: number; y: number; alpha: number; size: number }[] = [];

    const skin = SKINS.find(s => s.id === selectedSkinId) || SKINS[0];
    const trail = TRAILS.find(t => t.id === selectedTrailId) || TRAILS[0];

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#090d1f';
      ctx.fillRect(0, 0, w, h);

      // Subtle circular grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
      ctx.arc(w / 2, h / 2, 90, 0, Math.PI * 2);
      ctx.stroke();

      // Floating / orbiting movement
      const centerX = w / 2 + Math.cos(time * 1.5) * 20;
      const centerY = h / 2 + Math.sin(time * 2) * 12;

      // Add trail particle
      particles.unshift({
        x: centerX,
        y: centerY,
        alpha: 1.0,
        size: 8,
      });
      if (particles.length > 20) particles.pop();

      // Draw trail particles
      particles.forEach((p, idx) => {
        p.alpha -= 0.04;
        ctx.save();
        ctx.fillStyle = trail.glowColor;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size * (20 - idx)) / 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw character
      const radius = 24;
      ctx.save();
      ctx.shadowColor = skin.glowColor;
      ctx.shadowBlur = 18;
      ctx.fillStyle = skin.primaryColor;

      if (selectedShape === 'cube') {
        ctx.beginPath();
        ctx.roundRect(centerX - radius, centerY - radius, radius * 2, radius * 2, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (selectedShape === 'orb') {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (selectedShape === 'crystal') {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius * 1.3);
        ctx.lineTo(centerX + radius * 1.1, centerY);
        ctx.lineTo(centerX, centerY + radius * 1.3);
        ctx.lineTo(centerX - radius * 1.1, centerY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (selectedShape === 'hexagon') {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          const hx = centerX + radius * 1.15 * Math.cos(a);
          const hy = centerY + radius * 1.15 * Math.sin(a);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Eyes
      const eyeLookX = Math.cos(time * 1.5) * 4;
      const eyeLookY = Math.sin(time * 2) * 3;
      ctx.fillStyle = skin.eyeColor;
      ctx.beginPath();
      ctx.arc(centerX - 8 + eyeLookX, centerY - 6 + eyeLookY, 4.5, 0, Math.PI * 2);
      ctx.arc(centerX + 8 + eyeLookX, centerY - 6 + eyeLookY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#060a16';
      ctx.beginPath();
      ctx.arc(centerX - 8 + eyeLookX * 1.4, centerY - 6 + eyeLookY * 1.4, 2, 0, Math.PI * 2);
      ctx.arc(centerX + 8 + eyeLookX * 1.4, centerY - 6 + eyeLookY * 1.4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [selectedSkinId, selectedTrailId, selectedShape]);

  // Buy or Equip Handler
  const handleItemAction = (item: { id: string; price: number; type: string }) => {
    const isOwned = progress.ownedItems.includes(item.id);

    if (isOwned) {
      // Equip item
      soundManager.playButton();
      onUpdateProgress(prev => {
        const next = { ...prev };
        if (item.type === 'skin') {
          next.equippedSkin = item.id;
          setSelectedSkinId(item.id);
        } else if (item.type === 'trail') {
          next.equippedTrail = item.id;
          setSelectedTrailId(item.id);
        } else if (item.type === 'shape') {
          const shapeItem = SHAPES.find(s => s.id === item.id);
          if (shapeItem) {
            next.equippedShape = shapeItem.shape;
            setSelectedShape(shapeItem.shape);
          }
        }
        return next;
      });
      onShowMessage('Eşya Kuşanıldı!', 'info');
    } else {
      // Purchase
      if (progress.coins < item.price) {
        soundManager.playButton();
        onShowMessage('Yeterli enerjin yok!', 'prank');
        return;
      }

      soundManager.playCoin();
      onUpdateProgress(prev => {
        const next = {
          ...prev,
          coins: prev.coins - item.price,
          ownedItems: [...prev.ownedItems, item.id],
        };
        if (item.type === 'skin') {
          next.equippedSkin = item.id;
          setSelectedSkinId(item.id);
        } else if (item.type === 'trail') {
          next.equippedTrail = item.id;
          setSelectedTrailId(item.id);
        } else if (item.type === 'shape') {
          const shapeItem = SHAPES.find(s => s.id === item.id);
          if (shapeItem) {
            next.equippedShape = shapeItem.shape;
            setSelectedShape(shapeItem.shape);
          }
        }
        return next;
      });
      onShowMessage('Satın Alma Başarılı!', 'info');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center p-6 bg-[#060814] select-none overflow-y-auto">
      {/* Top Header */}
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

        <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">
          SİBER MAĞAZA
        </h2>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-300 text-sm font-bold font-mono">
          <span>⚡ {progress.coins} Enerji</span>
        </div>
      </header>

      {/* Main Content Split: Preview on Top/Left, Items on Right */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 pb-8">
        {/* Live Character Showcase */}
        <div className="md:col-span-1 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest mb-3">
            Canlı Önizleme
          </span>
          <canvas
            ref={previewCanvasRef}
            width={240}
            height={240}
            className="w-48 h-48 rounded-xl border border-slate-800 bg-[#090d1f] shadow-inner"
          />
          <div className="mt-4 text-xs text-slate-400">
            Karakter seçtiğin renk, iz ve form ile labirentte canlanır.
          </div>
        </div>

        {/* Catalog Section */}
        <div className="md:col-span-2 flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center gap-2 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-4">
            <button
              onClick={() => {
                soundManager.playButton();
                setActiveTab('skins');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'skins'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>GÖRÜNÜM</span>
            </button>
            <button
              onClick={() => {
                soundManager.playButton();
                setActiveTab('trails');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'trails'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>IŞIK İZİ</span>
            </button>
            <button
              onClick={() => {
                soundManager.playButton();
                setActiveTab('shapes');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'shapes'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Orbit className="w-3.5 h-3.5" />
              <span>GÖVDE</span>
            </button>
          </div>

          {/* List of Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {activeTab === 'skins' &&
              SKINS.map(skin => {
                const isOwned = progress.ownedItems.includes(skin.id);
                const isEquipped = progress.equippedSkin === skin.id;

                return (
                  <div
                    key={skin.id}
                    onClick={() => setSelectedSkinId(skin.id)}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      selectedSkinId === skin.id
                        ? 'border-sky-500 bg-slate-800/80'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                            style={{ backgroundColor: skin.primaryColor }}
                          />
                          <span className="text-sm font-bold text-slate-100">{skin.name}</span>
                        </div>
                        {isEquipped && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Kuşandı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{skin.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {skin.price === 0 ? 'Ücretsiz' : `${skin.price} ⚡`}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleItemAction(skin);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : isOwned
                            ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40'
                            : progress.coins >= skin.price
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? 'Kullanımda' : isOwned ? 'Kuşan' : 'Satın Al'}
                      </button>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'trails' &&
              TRAILS.map(trail => {
                const isOwned = progress.ownedItems.includes(trail.id);
                const isEquipped = progress.equippedTrail === trail.id;

                return (
                  <div
                    key={trail.id}
                    onClick={() => setSelectedTrailId(trail.id)}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      selectedTrailId === trail.id
                        ? 'border-purple-500 bg-slate-800/80'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                            style={{ backgroundColor: trail.color }}
                          />
                          <span className="text-sm font-bold text-slate-100">{trail.name}</span>
                        </div>
                        {isEquipped && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Kuşandı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{trail.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {trail.price === 0 ? 'Ücretsiz' : `${trail.price} ⚡`}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleItemAction(trail);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : isOwned
                            ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40'
                            : progress.coins >= trail.price
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? 'Kullanımda' : isOwned ? 'Kuşan' : 'Satın Al'}
                      </button>
                    </div>
                  </div>
                );
              })}

            {activeTab === 'shapes' &&
              SHAPES.map(shp => {
                const isOwned = progress.ownedItems.includes(shp.id);
                const isEquipped = progress.equippedShape === shp.shape;

                return (
                  <div
                    key={shp.id}
                    onClick={() => setSelectedShape(shp.shape)}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                      selectedShape === shp.shape
                        ? 'border-amber-500 bg-slate-800/80'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-bold text-slate-100">{shp.name}</span>
                        {isEquipped && (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Kuşandı
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{shp.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {shp.price === 0 ? 'Ücretsiz' : `${shp.price} ⚡`}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleItemAction(shp);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                          isEquipped
                            ? 'bg-slate-800 text-slate-400 cursor-default'
                            : isOwned
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
                            : progress.coins >= shp.price
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? 'Kullanımda' : isOwned ? 'Kuşan' : 'Satın Al'}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
