import { useState, useEffect, useCallback, useRef } from 'react';
import { GameScreen, UserProgress, DifficultyMode } from './types/game';
import { LEVELS } from './data/levels';
import { loadUserProgress, saveUserProgress } from './utils/storage';
import { soundManager } from './audio/soundManager';

import { MainMenu } from './components/MainMenu';
import { LevelSelectModal } from './components/LevelSelectModal';
import { DifficultyModal } from './components/DifficultyModal';
import { BabyTrollScreen } from './components/BabyTrollScreen';
import { ShopModal } from './components/ShopModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { GameCanvas } from './game/GameCanvas';
import { PauseOverlay } from './components/PauseOverlay';
import { VictoryModal } from './components/VictoryModal';
import { GameCompleteModal } from './components/GameCompleteModal';

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => loadUserProgress());
  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [difficulty, setDifficulty] = useState<DifficultyMode>('ORTA');
  const [forcedFleeCount, setForcedFleeCount] = useState<number | null>(null);

  const [currentLevelId, setCurrentLevelId] = useState<number>(() => {
    const saved = loadUserProgress();
    return Math.max(...saved.unlockedLevels, 1);
  });

  const [toastMessage, setToastMessage] = useState<{
    id: number;
    text: string;
    type: 'info' | 'prank' | 'flee';
  } | null>(null);

  const [lastRun, setLastRun] = useState<{
    timeTaken: number;
    coinsEarned: number;
    isNewRecord: boolean;
  } | null>(null);

  // Sync progress to localStorage on any state change
  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setProgress(prev => {
      const next = updater(prev);
      saveUserProgress(next);
      return next;
    });
  }, []);

  // Update total playtime in background while playing
  useEffect(() => {
    if (screen !== 'PLAYING') return;
    const timer = setInterval(() => {
      updateProgress(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalPlayTime: prev.stats.totalPlayTime + 1,
        },
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [screen, updateProgress]);

  // Toast notification system
  const toastTimeoutRef = useRef<number | null>(null);
  const showToast = useCallback((text: string, type: 'info' | 'prank' | 'flee' = 'info') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    const id = Date.now();
    setToastMessage({ id, text, type });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  }, []);

  // Initialize sound settings
  useEffect(() => {
    soundManager.updateConfig(
      progress.settings.masterSound,
      progress.settings.sfxVolume,
      progress.settings.musicEnabled
    );
  }, [progress.settings]);

  // Actions
  const handleOpenDifficultyForLevel = (levelId?: number) => {
    if (levelId != null) {
      setCurrentLevelId(levelId);
    }
    setScreen('DIFFICULTY_SELECT');
  };

  const handleSelectEasy = () => {
    // Triggers the hilarious BEBEK screen spin prank!
    setScreen('BABY_TROLL');
  };

  const handleBabyTrollReturn = () => {
    // Punish player with 5 to 10 random teleports determined by computer!
    // Guaranteed strictly in [5, 10]
    const count = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    setForcedFleeCount(count);
    setDifficulty('KOLAY');
    setScreen('PLAYING');
    showToast('Cezalandırıldın! Çıkış sürekli başka yerlere kaçacak!', 'prank');
  };

  const handleSelectMedium = () => {
    setDifficulty('ORTA');
    setForcedFleeCount(null);
    setScreen('PLAYING');
    showToast('Orta Mod Başladı: İyi şanslar!', 'info');
  };

  const handleSelectHard = () => {
    // Hard mode: computer decides strictly 5 to 10 flees!
    const count = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
    setDifficulty('ZOR');
    setForcedFleeCount(count);
    setScreen('PLAYING');
    showToast('Zor Mod: Çıkış sürekli başka yerlere ışınlanacak!', 'flee');
  };

  const handleLevelVictory = (timeTaken: number, coinsEarned: number) => {
    const existingBest = progress.levelBestTimes[currentLevelId];
    const isNewRecord = !existingBest || timeTaken < existingBest;

    const nextLevelId = currentLevelId + 1;
    const hasNext = nextLevelId <= LEVELS.length;

    updateProgress(prev => {
      const newUnlocked = [...prev.unlockedLevels];
      if (hasNext && !newUnlocked.includes(nextLevelId)) {
        newUnlocked.push(nextLevelId);
      }

      const newCompleted = [...prev.completedLevels];
      if (!newCompleted.includes(currentLevelId)) {
        newCompleted.push(currentLevelId);
      }

      const newBestTimes = { ...prev.levelBestTimes };
      if (isNewRecord) {
        newBestTimes[currentLevelId] = timeTaken;
      }

      return {
        ...prev,
        coins: prev.coins + coinsEarned,
        unlockedLevels: newUnlocked,
        completedLevels: newCompleted,
        levelBestTimes: newBestTimes,
        stats: {
          ...prev.stats,
          levelsClearedTotal: prev.stats.levelsClearedTotal + 1,
        },
      };
    });

    setLastRun({ timeTaken, coinsEarned, isNewRecord });

    if (currentLevelId === 20) {
      setScreen('GAME_COMPLETE');
    } else {
      setScreen('VICTORY');
    }
  };

  const handleNextLevel = () => {
    const nextId = currentLevelId + 1;
    if (nextId <= LEVELS.length) {
      setCurrentLevelId(nextId);
      // Re-roll 5-10 flees if in forced/zor mode
      if (difficulty === 'KOLAY' || difficulty === 'ZOR') {
        const count = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
        setForcedFleeCount(count);
      }
      setScreen('PLAYING');
    } else {
      setScreen('GAME_COMPLETE');
    }
  };

  const currentLevelDef = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060814] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Bar */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none transition-all">
          <div
            className={`px-4 py-2.5 rounded-xl border shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold backdrop-blur-md animate-bounce ${
              toastMessage.type === 'prank'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/60 shadow-rose-500/20'
                : toastMessage.type === 'flee'
                ? 'bg-sky-950/90 text-sky-200 border-sky-400/60 shadow-sky-400/20'
                : 'bg-slate-900/90 text-slate-100 border-slate-700 shadow-slate-950/40'
            }`}
          >
            <span>{toastMessage.type === 'prank' ? '🤡' : toastMessage.type === 'flee' ? '⚡' : '✨'}</span>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Screen Router */}
      {screen === 'MENU' && (
        <MainMenu
          progress={progress}
          onPlay={() => handleOpenDifficultyForLevel(Math.max(...progress.unlockedLevels, 1))}
          onOpenLevels={() => setScreen('LEVEL_SELECT')}
          onOpenShop={() => setScreen('SHOP')}
          onOpenStats={() => setScreen('STATS')}
          onOpenSettings={() => setScreen('SETTINGS')}
          onOpenHowToPlay={() => setScreen('HOW_TO_PLAY')}
        />
      )}

      {screen === 'DIFFICULTY_SELECT' && (
        <DifficultyModal
          onSelectEasy={handleSelectEasy}
          onSelectMedium={handleSelectMedium}
          onSelectHard={handleSelectHard}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'BABY_TROLL' && (
        <BabyTrollScreen
          onReturnAndPunish={handleBabyTrollReturn}
        />
      )}

      {screen === 'LEVEL_SELECT' && (
        <LevelSelectModal
          levels={LEVELS}
          progress={progress}
          onSelectLevel={id => handleOpenDifficultyForLevel(id)}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'SHOP' && (
        <ShopModal
          progress={progress}
          onUpdateProgress={updateProgress}
          onBack={() => setScreen('MENU')}
          onShowMessage={showToast}
        />
      )}

      {screen === 'STATS' && (
        <StatsModal
          progress={progress}
          onBack={() => setScreen('MENU')}
        />
      )}

      {screen === 'SETTINGS' && (
        <SettingsModal
          progress={progress}
          onUpdateProgress={updateProgress}
          onBack={() => setScreen('MENU')}
          onShowMessage={showToast}
        />
      )}

      {screen === 'HOW_TO_PLAY' && (
        <HowToPlayModal
          onBack={() => setScreen('MENU')}
        />
      )}

      {(screen === 'PLAYING' || screen === 'PAUSED') && (
        <div className="w-full h-full relative">
          <GameCanvas
            key={`${currentLevelId}_${forcedFleeCount}_${difficulty}`}
            level={currentLevelDef}
            progress={progress}
            forcedFleeCount={forcedFleeCount}
            difficulty={difficulty}
            onVictory={handleLevelVictory}
            onPause={() => setScreen('PAUSED')}
            onRestart={() => {
              // Re-roll 5-10 flees on restart if in forced mode
              if (difficulty === 'KOLAY' || difficulty === 'ZOR') {
                const count = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
                setForcedFleeCount(count);
              }
            }}
            onUpdateStats={updateProgress}
            onShowMessage={showToast}
          />

          {screen === 'PAUSED' && (
            <PauseOverlay
              onResume={() => setScreen('PLAYING')}
              onRestart={() => {
                if (difficulty === 'KOLAY' || difficulty === 'ZOR') {
                  const count = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
                  setForcedFleeCount(count);
                }
                setScreen('PLAYING');
              }}
              onOpenSettings={() => setScreen('SETTINGS')}
              onMainMenu={() => setScreen('MENU')}
            />
          )}
        </div>
      )}

      {screen === 'VICTORY' && lastRun && (
        <VictoryModal
          level={currentLevelDef}
          timeTaken={lastRun.timeTaken}
          coinsEarned={lastRun.coinsEarned}
          isNewRecord={lastRun.isNewRecord}
          onNextLevel={handleNextLevel}
          onRestart={() => setScreen('PLAYING')}
          onLevelSelect={() => setScreen('LEVEL_SELECT')}
          isLastLevel={currentLevelId >= LEVELS.length}
        />
      )}

      {screen === 'GAME_COMPLETE' && (
        <GameCompleteModal
          progress={progress}
          onMainMenu={() => setScreen('MENU')}
          onShop={() => setScreen('SHOP')}
          onReplay={() => {
            setCurrentLevelId(1);
            setScreen('DIFFICULTY_SELECT');
          }}
        />
      )}
    </div>
  );
}
