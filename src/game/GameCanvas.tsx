import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LevelDef, UserProgress } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { SKINS, TRAILS } from '../data/shopItems';

interface GameCanvasProps {
  level: LevelDef;
  progress: UserProgress;
  forcedFleeCount?: number | null;
  difficulty?: 'KOLAY' | 'ORTA' | 'ZOR';
  onVictory: (timeTaken: number, coinsEarned: number) => void;
  onPause: () => void;
  onRestart: () => void;
  onUpdateStats: (updater: (prev: UserProgress) => UserProgress) => void;
  onShowMessage: (text: string, type?: 'info' | 'prank' | 'flee') => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  progress,
  forcedFleeCount,
  difficulty,
  onVictory,
  onPause,
  onRestart,
  onUpdateStats,
  onShowMessage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic game state inside ref for 60fps performance without React re-renders
  const stateRef = useRef({
    // Player
    playerX: 0,
    playerY: 0,
    playerRadius: 0.32,
    vx: 0,
    vy: 0,
    facingX: 1,
    facingY: 0,
    speed: 5.2, // tiles per second

    // Level state
    map: [] as number[][],
    gridW: level.gridWidth,
    gridH: level.gridHeight,
    exitX: 0,
    exitY: 0,
    realExitActive: true,
    fakeExits: [] as { id: string; x: number; y: number; message?: string; triggered?: boolean }[],
    keysCollected: 0,
    keysRequired: level.keysRequired || 0,
    gatesLocked: true,
    coinsEarnedThisRun: 0,
    coinsCollectedIndices: new Set<number>(),

    // Mechanics
    fleeRules: [] as { triggerDistance: number; nextX: number; nextY: number; remainingFlees: number; hintMessage?: string }[],
    dynamicFleeRemaining: 0,
    dynamicFleeTotal: 0,
    fakeFinishActive: false,
    fakeFinishTriggered: false,

    // Time & stats
    startTime: performance.now(),
    elapsedSeconds: 0,
    isVictory: false,
    isPaused: false,

    // Visuals
    particles: [] as Particle[],
    trail: [] as TrailPoint[],
    screenShake: 0,
    exitPulse: 0,
    speechBubble: null as { x: number; y: number; text: string; timer: number } | null,
    fleeTrail: null as { fromX: number; fromY: number; toX: number; toY: number; timer: number } | null,

    // Controls
    keysDown: {} as Record<string, boolean>,
  });

  const [hudCoins, setHudCoins] = useState(0);
  const [hudKeys, setHudKeys] = useState({ current: 0, required: level.keysRequired || 0 });
  const [hudTime, setHudTime] = useState('00:00.0');
  const [hudFlees, setHudFlees] = useState<{ remaining: number; total: number } | null>(null);

  // Initialize level state
  const resetLevelState = useCallback(() => {
    const s = stateRef.current;
    s.gridW = level.gridWidth;
    s.gridH = level.gridHeight;
    s.map = level.map.map(row => [...row]);
    s.fakeExits = level.fakeExits ? level.fakeExits.map(fe => ({ ...fe, triggered: false })) : [];
    s.keysCollected = 0;
    s.keysRequired = level.keysRequired || 0;
    s.gatesLocked = s.keysRequired > 0;
    s.coinsEarnedThisRun = 0;
    s.coinsCollectedIndices.clear();
    s.isVictory = false;
    s.isPaused = false;
    s.screenShake = 0;
    s.particles = [];
    s.trail = [];
    s.speechBubble = null;
    s.fleeTrail = null;
    s.startTime = performance.now();
    s.elapsedSeconds = 0;

    // Determine flee count:
    // If forcedFleeCount is set (e.g. from Kolay troll punishment) or difficulty is ZOR:
    // Must be between 5 and 10! Computer decides randomly, never outside 5 and 10.
    if (forcedFleeCount != null) {
      const flees = Math.min(Math.max(Math.floor(forcedFleeCount), 5), 10);
      s.dynamicFleeRemaining = flees;
      s.dynamicFleeTotal = flees;
      setHudFlees({ remaining: flees, total: flees });
    } else if (difficulty === 'ZOR') {
      const flees = Math.floor(Math.random() * (10 - 5 + 1)) + 5; // strictly 5 to 10
      s.dynamicFleeRemaining = flees;
      s.dynamicFleeTotal = flees;
      setHudFlees({ remaining: flees, total: flees });
    } else if (level.fleeRules && level.fleeRules.length > 0) {
      // Standard level flees
      const totalRules = level.fleeRules.reduce((acc, r) => acc + r.remainingFlees, 0);
      s.dynamicFleeRemaining = totalRules;
      s.dynamicFleeTotal = totalRules;
      setHudFlees({ remaining: totalRules, total: totalRules });
    } else {
      s.dynamicFleeRemaining = 0;
      s.dynamicFleeTotal = 0;
      setHudFlees(null);
    }

    // Check fake finish line
    if (level.fakeFinishLine) {
      s.fakeFinishActive = true;
      s.fakeFinishTriggered = false;
      s.realExitActive = false;
    } else {
      s.fakeFinishActive = false;
      s.fakeFinishTriggered = false;
      s.realExitActive = true;
    }

    // Find start & initial exit
    let foundStart = false;
    for (let r = 0; r < level.gridHeight; r++) {
      for (let c = 0; c < level.gridWidth; c++) {
        const val = s.map[r][c];
        if (val === 7) {
          s.playerX = c + 0.5;
          s.playerY = r + 0.5;
          s.map[r][c] = 0; // replace with floor
          foundStart = true;
        } else if (val === 2) {
          s.exitX = c;
          s.exitY = r;
          if (s.fakeFinishActive) {
            s.map[r][c] = 0; // hide real exit initially if fake finish line is on
          }
        }
      }
    }

    if (!foundStart) {
      s.playerX = 1.5;
      s.playerY = 1.5;
    }

    // Apply sensitivity
    s.speed = 5.2 * (progress.settings.controlsSensitivity || 1.0);

    setHudCoins(0);
    setHudKeys({ current: 0, required: s.keysRequired });
    setHudTime('00:00.0');
  }, [level, progress.settings.controlsSensitivity, forcedFleeCount, difficulty]);

  useEffect(() => {
    resetLevelState();
  }, [resetLevelState]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';

      if (code === 'Escape' || key === 'escape') {
        e.preventDefault();
        onPause();
        return;
      }
      if (code === 'KeyR' || key === 'r') {
        e.preventDefault();
        soundManager.playButton();
        onUpdateStats(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            restartsCount: prev.stats.restartsCount + 1,
          },
        }));
        onRestart();
        resetLevelState();
        return;
      }

      if (
        code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup' ||
        code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown' ||
        code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft' ||
        code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright'
      ) {
        stateRef.current.keysDown[code] = true;
        stateRef.current.keysDown[key] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      const key = e.key ? e.key.toLowerCase() : '';
      stateRef.current.keysDown[code] = false;
      stateRef.current.keysDown[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onPause, onRestart, resetLevelState, onUpdateStats]);

  // Main Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const equippedSkin = SKINS.find(s => s.id === progress.equippedSkin) || SKINS[0];
    const equippedTrail = TRAILS.find(t => t.id === progress.equippedTrail) || TRAILS[0];

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const s = stateRef.current;

      if (!s.isVictory && !s.isPaused) {
        s.elapsedSeconds = (currentTime - s.startTime) / 1000;
        const mins = Math.floor(s.elapsedSeconds / 60);
        const secs = (s.elapsedSeconds % 60).toFixed(1);
        setHudTime(`${mins.toString().padStart(2, '0')}:${secs.padStart(4, '0')}`);

        // --- 1. MOVEMENT & INPUT ---
        let mx = 0;
        let my = 0;
        if (s.keysDown['KeyW'] || s.keysDown['w'] || s.keysDown['ArrowUp'] || s.keysDown['arrowup']) my -= 1;
        if (s.keysDown['KeyS'] || s.keysDown['s'] || s.keysDown['ArrowDown'] || s.keysDown['arrowdown']) my += 1;
        if (s.keysDown['KeyA'] || s.keysDown['a'] || s.keysDown['ArrowLeft'] || s.keysDown['arrowleft']) mx -= 1;
        if (s.keysDown['KeyD'] || s.keysDown['d'] || s.keysDown['ArrowRight'] || s.keysDown['arrowright']) mx += 1;

        if (mx !== 0 && my !== 0) {
          const invSqrt2 = 0.707106;
          mx *= invSqrt2;
          my *= invSqrt2;
        }

        if (mx !== 0 || my !== 0) {
          s.facingX = mx;
          s.facingY = my;
        }

        const moveDist = s.speed * dt;
        const nextX = s.playerX + mx * moveDist;
        const nextY = s.playerY + my * moveDist;

        // Collision detection helper
        const isSolid = (tileX: number, tileY: number): boolean => {
          if (tileX < 0 || tileX >= s.gridW || tileY < 0 || tileY >= s.gridH) return true;
          const cell = s.map[tileY][tileX];
          if (cell === 1) return true; // Wall
          if (cell === 5 && s.gatesLocked) return true; // Locked barrier

          // Check timed gates
          if (level.timedGates) {
            for (const tg of level.timedGates) {
              if (tg.x === tileX && tg.y === tileY) {
                const cycle = tg.openDuration + tg.closedDuration;
                const offset = tg.offset || 0;
                const currentPhase = (s.elapsedSeconds + offset) % cycle;
                if (currentPhase >= tg.openDuration) {
                  return true; // Closed
                }
              }
            }
          }

          // Check moving walls
          if (level.movingWalls) {
            for (const mw of level.movingWalls) {
              const mwCurrent = getMovingWallPos(mw, s.elapsedSeconds);
              if (
                tileX >= Math.floor(mwCurrent.x) &&
                tileX < Math.ceil(mwCurrent.x + mw.width) &&
                tileY >= Math.floor(mwCurrent.y) &&
                tileY < Math.ceil(mwCurrent.y + mw.height)
              ) {
                return true;
              }
            }
          }

          return false;
        };

        // Axis-independent collision sliding
        const r = s.playerRadius;

        // Try X move
        let canMoveX = true;
        const xCheckPoints = [
          { x: nextX + (mx > 0 ? r : -r), y: s.playerY - r * 0.9 },
          { x: nextX + (mx > 0 ? r : -r), y: s.playerY + r * 0.9 },
        ];
        for (const pt of xCheckPoints) {
          if (isSolid(Math.floor(pt.x), Math.floor(pt.y))) {
            canMoveX = false;
            break;
          }
        }
        if (canMoveX) {
          s.playerX = nextX;
        }

        // Try Y move
        let canMoveY = true;
        const yCheckPoints = [
          { x: s.playerX - r * 0.9, y: nextY + (my > 0 ? r : -r) },
          { x: s.playerX + r * 0.9, y: nextY + (my > 0 ? r : -r) },
        ];
        for (const pt of yCheckPoints) {
          if (isSolid(Math.floor(pt.x), Math.floor(pt.y))) {
            canMoveY = false;
            break;
          }
        }
        if (canMoveY) {
          s.playerY = nextY;
        }

        // Add trail point if moved
        if (mx !== 0 || my !== 0) {
          s.trail.unshift({ x: s.playerX, y: s.playerY, alpha: 1.0 });
          if (s.trail.length > 16) s.trail.pop();
        }

        // Update trail fade
        s.trail.forEach(t => {
          t.alpha -= dt * 3.5;
        });
        s.trail = s.trail.filter(t => t.alpha > 0.05);

        // --- 2. TILE INTERACTIONS ---
        const curCellX = Math.floor(s.playerX);
        const curCellY = Math.floor(s.playerY);

        // Coin collection (6)
        if (s.map[curCellY] && s.map[curCellY][curCellX] === 6) {
          const coinIdx = curCellY * s.gridW + curCellX;
          s.map[curCellY][curCellX] = 0;
          s.coinsEarnedThisRun += 10;
          s.coinsCollectedIndices.add(coinIdx);
          setHudCoins(s.coinsEarnedThisRun);
          soundManager.playCoin();

          // Spawn coin sparkle particles
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 1.0 + Math.random() * 2.5;
            s.particles.push({
              x: curCellX + 0.5,
              y: curCellY + 0.5,
              vx: Math.cos(angle) * spd,
              vy: Math.sin(angle) * spd,
              size: 2 + Math.random() * 3,
              color: '#fbbf24',
              alpha: 1.0,
              maxLife: 0.6,
              life: 0.6,
            });
          }

          onUpdateStats(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              coinsCollectedTotal: prev.stats.coinsCollectedTotal + 1,
            },
          }));
        }

        // Key collection (4)
        if (s.map[curCellY] && s.map[curCellY][curCellX] === 4) {
          s.map[curCellY][curCellX] = 0;
          s.keysCollected += 1;
          soundManager.playKey();
          onShowMessage(`Siber Anahtar Alındı (${s.keysCollected}/${s.keysRequired})`, 'info');
          setHudKeys({ current: s.keysCollected, required: s.keysRequired });

          if (s.keysCollected >= s.keysRequired) {
            s.gatesLocked = false;
            onShowMessage('Bariyerler Devre Dışı Kaldı!', 'info');
          }

          // Sparks
          for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            s.particles.push({
              x: curCellX + 0.5,
              y: curCellY + 0.5,
              vx: Math.cos(angle) * 3,
              vy: Math.sin(angle) * 3,
              size: 3,
              color: '#38bdf8',
              alpha: 1.0,
              maxLife: 0.8,
              life: 0.8,
            });
          }
        }

        // Switch interaction
        if (level.switches) {
          for (const sw of level.switches) {
            if (curCellX === sw.x && curCellY === sw.y) {
              if (s.gatesLocked) {
                s.gatesLocked = false;
                soundManager.playSwitch();
                onShowMessage('Şalter Etkinleştirildi: Geçit Açıldı!', 'info');
              }
            }
          }
        }

        // Fake finish line check
        if (s.fakeFinishActive && !s.fakeFinishTriggered && level.fakeFinishLine) {
          const ff = level.fakeFinishLine;
          if (
            s.playerX >= ff.x &&
            s.playerX <= ff.x + ff.width &&
            s.playerY >= ff.y &&
            s.playerY <= ff.y + ff.height
          ) {
            s.fakeFinishTriggered = true;
            soundManager.playFakeFinish();
            s.screenShake = 12;
            onShowMessage('ŞAKA! Gerçek çıkış şimdi sol altta belirdi!', 'prank');

            // Spawn real exit
            s.exitX = ff.realExitSpawn.x;
            s.exitY = ff.realExitSpawn.y;
            s.realExitActive = true;
            s.map[s.exitY][s.exitX] = 2;

            onUpdateStats(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                fakeExitsTriggered: prev.stats.fakeExitsTriggered + 1,
              },
            }));
          }
        }

        // Fake Exit interaction
        s.fakeExits.forEach(fe => {
          const distToFake = Math.hypot(s.playerX - (fe.x + 0.5), s.playerY - (fe.y + 0.5));
          if (distToFake < 0.65 && !fe.triggered) {
            fe.triggered = true;
            soundManager.playFakeExit();
            s.screenShake = 6;
            const trollMsg = fe.message || 'Erken sevindin! Bu çıkış değil!';
            s.speechBubble = {
              x: fe.x + 0.5,
              y: fe.y - 0.2,
              text: trollMsg,
              timer: 2.8,
            };
            onShowMessage(trollMsg, 'prank');

            // Puff particles
            for (let i = 0; i < 10; i++) {
              s.particles.push({
                x: fe.x + 0.5,
                y: fe.y + 0.5,
                vx: (Math.random() - 0.5) * 2.5,
                vy: (Math.random() - 0.5) * 2.5,
                size: 4 + Math.random() * 4,
                color: '#f43f5e',
                alpha: 0.9,
                maxLife: 0.7,
                life: 0.7,
              });
            }

            onUpdateStats(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                fakeExitsTriggered: prev.stats.fakeExitsTriggered + 1,
              },
            }));
          } else if (distToFake > 1.8) {
            // Can re-trigger if player leaves and comes back
            fe.triggered = false;
          }
        });

        // Dynamic Exit Flee check!
        const isPlayerOnExit = (curCellX === s.exitX && curCellY === s.exitY);
        const distToExit = Math.hypot(s.playerX - (s.exitX + 0.5), s.playerY - (s.exitY + 0.5));

        if (s.realExitActive && s.dynamicFleeRemaining > 0) {
          if (distToExit < 1.35 || isPlayerOnExit) {
            // Find all valid floor tiles in the current map that are far enough from the player
            const candidates: { x: number; y: number }[] = [];
            for (let r = 1; r < s.gridH - 1; r++) {
              for (let c = 1; c < s.gridW - 1; c++) {
                if (s.map[r][c] === 0 && (c !== s.exitX || r !== s.exitY)) {
                  const d = Math.hypot(c + 0.5 - s.playerX, r + 0.5 - s.playerY);
                  if (d >= 3.2) {
                    candidates.push({ x: c, y: r });
                  }
                }
              }
            }

            // Fallback if no tile is >= 3.2
            if (candidates.length === 0) {
              for (let r = 1; r < s.gridH - 1; r++) {
                for (let c = 1; c < s.gridW - 1; c++) {
                  if (s.map[r][c] === 0 && (c !== s.exitX || r !== s.exitY)) {
                    candidates.push({ x: c, y: r });
                  }
                }
              }
            }

            const chosen = candidates.length > 0
              ? candidates[Math.floor(Math.random() * candidates.length)]
              : { x: (s.exitX + 2) % (s.gridW - 2) + 1, y: (s.exitY + 2) % (s.gridH - 2) + 1 };

            const oldX = s.exitX;
            const oldY = s.exitY;
            const newX = chosen.x;
            const newY = chosen.y;

            s.dynamicFleeRemaining -= 1;
            setHudFlees({ remaining: s.dynamicFleeRemaining, total: s.dynamicFleeTotal });

            s.map[oldY][oldX] = 0;
            s.map[newY][newX] = 2;
            s.exitX = newX;
            s.exitY = newY;

            soundManager.playFlee();
            s.screenShake = 9;

            s.fleeTrail = {
              fromX: oldX + 0.5,
              fromY: oldY + 0.5,
              toX: newX + 0.5,
              toY: newY + 0.5,
              timer: 0.8,
            };

            const trollQuotes = [
              'Yakalayamazsın ki! 🏃‍♂️',
              'Hop! Başka köşeye kaçtım! 💨',
              'Burada mıyım? Hayır, oradayım! ⚡',
              'Biraz daha koş bakalım!',
              'Çıkış benden kaçar, ben çıkıştan kaçmam!',
              'Sinirlerin sağlam mı? Devam et!',
              'Bu sefer kesin çıkarsın... ŞAKA!',
            ];

            const hint = s.dynamicFleeRemaining === 0
              ? 'Çıkış sonunda yoruldu ve durdu! Şimdi çıkabilirsin!'
              : trollQuotes[Math.floor(Math.random() * trollQuotes.length)];

            onShowMessage(hint, s.dynamicFleeRemaining === 0 ? 'info' : 'flee');

            // Teleport spark burst
            for (let i = 0; i < 20; i++) {
              const angle = Math.random() * Math.PI * 2;
              s.particles.push({
                x: oldX + 0.5,
                y: oldY + 0.5,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                size: 3 + Math.random() * 3,
                color: '#00f0ff',
                alpha: 1.0,
                maxLife: 0.6,
                life: 0.6,
              });
              s.particles.push({
                x: newX + 0.5,
                y: newY + 0.5,
                vx: Math.cos(angle) * 3.5,
                vy: Math.sin(angle) * 3.5,
                size: 3,
                color: '#10b981',
                alpha: 1.0,
                maxLife: 0.6,
                life: 0.6,
              });
            }

            onUpdateStats(prev => ({
              ...prev,
              stats: {
                ...prev.stats,
                fleeTriggersTotal: prev.stats.fleeTriggersTotal + 1,
              },
            }));
          }
        }

        // Real Exit check - Accept immediately when stepping onto exit tile!
        if (s.realExitActive && !s.gatesLocked && s.dynamicFleeRemaining === 0) {
          if (isPlayerOnExit || distToExit < 0.85) {
            // VICTORY!
            s.isVictory = true;
            soundManager.playVictory();

            // Grand confetti celebration
            for (let i = 0; i < 50; i++) {
              const angle = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 6;
              s.particles.push({
                x: s.exitX + 0.5,
                y: s.exitY + 0.5,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                size: 3 + Math.random() * 5,
                color: ['#00f0ff', '#a855f7', '#fbbf24', '#10b981', '#f43f5e'][Math.floor(Math.random() * 5)],
                alpha: 1.0,
                maxLife: 1.8,
                life: 1.8,
              });
            }

            const totalCoinsWon = level.coinReward + s.coinsEarnedThisRun;
            setTimeout(() => {
              onVictory(s.elapsedSeconds, totalCoinsWon);
            }, 700);
          }
        }
      }

      // --- 3. PARTICLES & VISUAL TIMERS ---
      s.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, p.life / p.maxLife);
      });
      s.particles = s.particles.filter(p => p.life > 0);

      if (s.speechBubble) {
        s.speechBubble.timer -= dt;
        if (s.speechBubble.timer <= 0) s.speechBubble = null;
      }

      if (s.fleeTrail) {
        s.fleeTrail.timer -= dt;
        if (s.fleeTrail.timer <= 0) s.fleeTrail = null;
      }

      if (s.screenShake > 0) {
        s.screenShake -= dt * 25;
        if (s.screenShake < 0) s.screenShake = 0;
      }

      s.exitPulse = (s.exitPulse + dt * 3.5) % (Math.PI * 2);

      // --- 4. CANVAS RENDERING ---
      renderCanvas(ctx, canvas, dt, equippedSkin, equippedTrail);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [level, onVictory, onPause, onRestart, onShowMessage, onUpdateStats, progress]);

  // Helper for moving wall calculation
  const getMovingWallPos = (mw: { x: number; y: number; direction: 'horizontal' | 'vertical'; distance: number; speed: number }, time: number) => {
    const cycle = (Math.sin(time * mw.speed) + 1) / 2; // 0 to 1 smooth oscillation
    if (mw.direction === 'horizontal') {
      return { x: mw.x + mw.distance * cycle, y: mw.y };
    } else {
      return { x: mw.x, y: mw.y + mw.distance * cycle };
    }
  };

  // Render function
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    _dt: number,
    skin: typeof SKINS[0],
    trail: typeof TRAILS[0]
  ) => {
    const s = stateRef.current;
    const dpr = window.devicePixelRatio || 1;

    // Viewport dimensions
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Screen shake
    if (progress.settings.screenShake && s.screenShake > 0) {
      const sx = (Math.random() - 0.5) * s.screenShake;
      const sy = (Math.random() - 0.5) * s.screenShake;
      ctx.translate(sx, sy);
    }

    // Determine tile scale to fit maze comfortably with margins
    const margin = 24;
    const maxTileW = (width - margin * 2) / s.gridW;
    const maxTileH = (height - margin * 2) / s.gridH;
    const tileSize = Math.floor(Math.min(maxTileW, maxTileH, 56));

    const mazePixelW = s.gridW * tileSize;
    const mazePixelH = s.gridH * tileSize;
    const offsetX = Math.floor((width - mazePixelW) / 2);
    const offsetY = Math.floor((height - mazePixelH) / 2);

    ctx.translate(offsetX, offsetY);

    // Background field
    ctx.fillStyle = '#060a16';
    ctx.fillRect(0, 0, mazePixelW, mazePixelH);

    // Subtle background grid
    ctx.strokeStyle = 'rgba(30, 58, 138, 0.15)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= s.gridW; c++) {
      ctx.beginPath();
      ctx.moveTo(c * tileSize, 0);
      ctx.lineTo(c * tileSize, mazePixelH);
      ctx.stroke();
    }
    for (let r = 0; r <= s.gridH; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * tileSize);
      ctx.lineTo(mazePixelW, r * tileSize);
      ctx.stroke();
    }

    // --- DRAW MAZE TILES ---
    for (let r = 0; r < s.gridH; r++) {
      for (let c = 0; c < s.gridW; c++) {
        const val = s.map[r][c];
        const px = c * tileSize;
        const py = r * tileSize;

        if (val === 1) {
          // Wall
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px, py, tileSize, tileSize);

          // Neon wall outline
          ctx.strokeStyle = '#1e3a8a';
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

          // Subtle top-left neon edge
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.beginPath();
          ctx.moveTo(px, py + tileSize);
          ctx.lineTo(px, py);
          ctx.lineTo(px + tileSize, py);
          ctx.stroke();
        } else if (val === 5) {
          // Locked Gate / Forcefield
          ctx.fillStyle = s.gatesLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(52, 211, 153, 0.1)';
          ctx.fillRect(px, py, tileSize, tileSize);

          ctx.strokeStyle = s.gatesLocked ? '#ef4444' : '#10b981';
          ctx.lineWidth = 3;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(px + 3, py + 3, tileSize - 6, tileSize - 6);
          ctx.setLineDash([]);

          // Lock icon or diagonal laser bars
          if (s.gatesLocked) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
            ctx.beginPath();
            ctx.moveTo(px + 4, py + 4);
            ctx.lineTo(px + tileSize - 4, py + tileSize - 4);
            ctx.moveTo(px + tileSize - 4, py + 4);
            ctx.lineTo(px + 4, py + tileSize - 4);
            ctx.stroke();
          }
        } else if (val === 6) {
          // Gold Energy Shard / Coin
          const pulse = Math.sin(s.elapsedSeconds * 4 + c + r) * 2;
          const coinRadius = tileSize * 0.22 + pulse;
          const cx = px + tileSize / 2;
          const cy = py + tileSize / 2;

          ctx.save();
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(cx, cy, coinRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx - coinRadius * 0.25, cy - coinRadius * 0.25, coinRadius * 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (val === 4) {
          // Cyber Key
          const cx = px + tileSize / 2;
          const cy = py + tileSize / 2 + Math.sin(s.elapsedSeconds * 3) * 3;
          ctx.save();
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.fillStyle = '#38bdf8';

          // Draw key icon
          ctx.beginPath();
          ctx.arc(cx - tileSize * 0.1, cy, tileSize * 0.16, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(cx - tileSize * 0.04, cy - tileSize * 0.05, tileSize * 0.26, tileSize * 0.1);
          ctx.fillRect(cx + tileSize * 0.12, cy, tileSize * 0.08, tileSize * 0.1);
          ctx.restore();
        }
      }
    }

    // Switches
    if (level.switches) {
      level.switches.forEach(sw => {
        const px = sw.x * tileSize;
        const py = sw.y * tileSize;
        ctx.fillStyle = s.gatesLocked ? 'rgba(56, 189, 248, 0.2)' : 'rgba(52, 211, 153, 0.4)';
        ctx.fillRect(px + tileSize * 0.15, py + tileSize * 0.15, tileSize * 0.7, tileSize * 0.7);
        ctx.strokeStyle = s.gatesLocked ? '#38bdf8' : '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + tileSize * 0.15, py + tileSize * 0.15, tileSize * 0.7, tileSize * 0.7);
      });
    }

    // Timed Gates
    if (level.timedGates) {
      level.timedGates.forEach(tg => {
        const cycle = tg.openDuration + tg.closedDuration;
        const offset = tg.offset || 0;
        const currentPhase = (s.elapsedSeconds + offset) % cycle;
        const isOpen = currentPhase < tg.openDuration;
        const px = tg.x * tileSize;
        const py = tg.y * tileSize;

        ctx.fillStyle = isOpen ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(px, py, tileSize * tg.width, tileSize * tg.height);
        ctx.strokeStyle = isOpen ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 2, py + 2, tileSize * tg.width - 4, tileSize * tg.height - 4);
      });
    }

    // Moving Walls
    if (level.movingWalls) {
      level.movingWalls.forEach(mw => {
        const pos = getMovingWallPos(mw, s.elapsedSeconds);
        const px = pos.x * tileSize;
        const py = pos.y * tileSize;

        ctx.save();
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(px, py, mw.width * tileSize, mw.height * tileSize);

        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 8;
        ctx.strokeRect(px + 2, py + 2, mw.width * tileSize - 4, mw.height * tileSize - 4);

        // Hazard stripes pattern
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(px + 6, py + mw.height * tileSize - 6);
        ctx.lineTo(px + mw.width * tileSize - 6, py + 6);
        ctx.stroke();
        ctx.restore();
      });
    }

    // Fake Finish Line
    if (s.fakeFinishActive && !s.fakeFinishTriggered && level.fakeFinishLine) {
      const ff = level.fakeFinishLine;
      const px = ff.x * tileSize;
      const py = ff.y * tileSize;
      ctx.save();
      // Checkered finish banner
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px, py, tileSize, tileSize);
      ctx.fillStyle = '#000000';
      const half = tileSize / 2;
      ctx.fillRect(px, py, half, half);
      ctx.fillRect(px + half, py + half, half, half);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 10;
      ctx.strokeRect(px, py, tileSize, tileSize);
      ctx.restore();
    }

    // Fake Exits (3)
    s.fakeExits.forEach(fe => {
      const px = fe.x * tileSize;
      const py = fe.y * tileSize;
      const cx = px + tileSize / 2;
      const cy = py + tileSize / 2;

      ctx.save();
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;

      // Deceptive portal
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, tileSize * 0.36 + Math.sin(s.elapsedSeconds * 4) * 2, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.fill();

      // Portal swirl
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, tileSize * 0.18, s.elapsedSeconds * 3, s.elapsedSeconds * 3 + Math.PI);
      ctx.stroke();
      ctx.restore();
    });

    // Real Exit (2)
    if (s.realExitActive) {
      const px = s.exitX * tileSize;
      const py = s.exitY * tileSize;
      const cx = px + tileSize / 2;
      const cy = py + tileSize / 2;

      ctx.save();
      const pulseSize = Math.sin(s.exitPulse) * 3;

      // Outer glow portal
      ctx.shadowColor = s.gatesLocked ? '#64748b' : '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = s.gatesLocked ? '#94a3b8' : '#00f0ff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy, tileSize * 0.38 + pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Inner vortex
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, tileSize * 0.38);
      if (s.gatesLocked) {
        grad.addColorStop(0, 'rgba(100, 116, 139, 0.6)');
        grad.addColorStop(1, 'rgba(30, 41, 59, 0.1)');
      } else {
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
        grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.4)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0.05)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, tileSize * 0.38 + pulseSize, 0, Math.PI * 2);
      ctx.fill();

      // Rotating portal arcs
      if (!s.gatesLocked) {
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.22, s.elapsedSeconds * 4, s.elapsedSeconds * 4 + 1.8);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, tileSize * 0.14, -s.elapsedSeconds * 5, -s.elapsedSeconds * 5 + 2.0);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Flee lightning / warp trail
    if (s.fleeTrail) {
      ctx.save();
      const alpha = s.fleeTrail.timer / 0.8;
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(s.fleeTrail.fromX * tileSize, s.fleeTrail.fromY * tileSize);
      ctx.lineTo(s.fleeTrail.toX * tileSize, s.fleeTrail.toY * tileSize);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // --- DRAW PLAYER TRAIL ---
    s.trail.forEach(pt => {
      ctx.save();
      ctx.fillStyle = trail.glowColor;
      ctx.globalAlpha = pt.alpha * 0.7;
      const size = tileSize * s.playerRadius * 0.8 * pt.alpha;
      ctx.beginPath();
      ctx.arc(pt.x * tileSize, pt.y * tileSize, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // --- DRAW PLAYER ---
    const px = s.playerX * tileSize;
    const py = s.playerY * tileSize;
    const pRadius = tileSize * s.playerRadius;

    ctx.save();
    ctx.shadowColor = skin.glowColor;
    ctx.shadowBlur = 14;

    const shape = progress.equippedShape || 'cube';
    ctx.fillStyle = skin.primaryColor;

    if (shape === 'cube') {
      const halfSide = pRadius * 0.95;
      const cornerR = 4;
      ctx.beginPath();
      ctx.roundRect(px - halfSide, py - halfSide, halfSide * 2, halfSide * 2, cornerR);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape === 'orb') {
      ctx.beginPath();
      ctx.arc(px, py, pRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape === 'crystal') {
      ctx.beginPath();
      ctx.moveTo(px, py - pRadius * 1.2);
      ctx.lineTo(px + pRadius * 1.1, py);
      ctx.lineTo(px, py + pRadius * 1.2);
      ctx.lineTo(px - pRadius * 1.1, py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (shape === 'hexagon') {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const hx = px + pRadius * 1.05 * Math.cos(a);
        const hy = py + pRadius * 1.05 * Math.sin(a);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Player cute expressive eyes looking towards movement direction
    const eyeOffset = pRadius * 0.35;
    const eyeLookX = s.facingX * (pRadius * 0.2);
    const eyeLookY = s.facingY * (pRadius * 0.2);
    const eyeDist = pRadius * 0.38;

    ctx.fillStyle = skin.eyeColor || '#ffffff';
    // Left eye
    ctx.beginPath();
    ctx.arc(px - eyeDist + eyeLookX, py - eyeOffset + eyeLookY, pRadius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.arc(px + eyeDist + eyeLookX, py - eyeOffset + eyeLookY, pRadius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Eye pupils
    ctx.fillStyle = '#060a16';
    ctx.beginPath();
    ctx.arc(px - eyeDist + eyeLookX * 1.4, py - eyeOffset + eyeLookY * 1.4, pRadius * 0.1, 0, Math.PI * 2);
    ctx.arc(px + eyeDist + eyeLookX * 1.4, py - eyeOffset + eyeLookY * 1.4, pRadius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- DRAW PARTICLES ---
    s.particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x * tileSize, p.y * tileSize, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // --- SPEECH BUBBLE OVERHEAD ---
    if (s.speechBubble) {
      const bx = s.speechBubble.x * tileSize;
      const by = s.speechBubble.y * tileSize - 18;

      ctx.save();
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      const textMetrics = ctx.measureText(s.speechBubble.text);
      const bubbleW = textMetrics.width + 16;
      const bubbleH = 26;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(bx - bubbleW / 2, by - bubbleH, bubbleW, bubbleH, 6);
      ctx.fill();
      ctx.stroke();

      // Tail
      ctx.beginPath();
      ctx.moveTo(bx - 4, by);
      ctx.lineTo(bx, by + 6);
      ctx.lineTo(bx + 4, by);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.speechBubble.text, bx, by - bubbleH / 2);
      ctx.restore();
    }

    ctx.restore();
  };

  // Mobile / On-screen D-Pad support
  const handleTouchDir = (code: string, isDown: boolean) => {
    stateRef.current.keysDown[code] = isDown;
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#060814] select-none">
      {/* Top HUD */}
      <div className="w-full max-w-4xl px-4 py-2 flex items-center justify-between text-xs sm:text-sm font-mono border-b border-slate-800 bg-slate-950/60 backdrop-blur z-10">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="font-bold text-sky-400">Bölüm {level.id}: {level.name}</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-amber-400 font-semibold">{hudCoins} ⚡</span>
          {hudKeys.required > 0 && (
            <span className={`font-semibold ${hudKeys.current >= hudKeys.required ? 'text-emerald-400' : 'text-slate-400'}`}>
              🔑 {hudKeys.current}/{hudKeys.required}
            </span>
          )}
          {hudFlees && (
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              hudFlees.remaining > 0 
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/50 animate-pulse' 
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
            }`}>
              {hudFlees.remaining > 0 ? '🏃‍♂️ Kaçan Çıkış' : '✅ Çıkış Sabitlendi'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-slate-300 font-bold tabular-nums">⏱ {hudTime}</span>
          <button
            onClick={() => {
              soundManager.playButton();
              onUpdateStats(prev => ({
                ...prev,
                stats: {
                  ...prev.stats,
                  restartsCount: prev.stats.restartsCount + 1,
                },
              }));
              onRestart();
              resetLevelState();
            }}
            title="Yeniden Başlat (R)"
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer"
          >
            Yenile (R)
          </button>
          <button
            onClick={() => {
              soundManager.playButton();
              onPause();
            }}
            title="Duraklat (ESC)"
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition cursor-pointer"
          >
            Duraklat
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-2 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full max-w-5xl max-h-[82vh] rounded-lg shadow-2xl border border-sky-950/60 bg-[#060a16]"
        />

        {/* On-screen touch D-Pad for mobile/tablet */}
        <div className="md:hidden absolute bottom-4 right-4 flex flex-col items-center gap-1 opacity-75 z-20">
          <button
            onPointerDown={() => handleTouchDir('ArrowUp', true)}
            onPointerUp={() => handleTouchDir('ArrowUp', false)}
            className="w-12 h-12 bg-slate-800/90 active:bg-sky-600 rounded-lg border border-slate-700 flex items-center justify-center text-lg text-white"
          >
            ▲
          </button>
          <div className="flex gap-2">
            <button
              onPointerDown={() => handleTouchDir('ArrowLeft', true)}
              onPointerUp={() => handleTouchDir('ArrowLeft', false)}
              className="w-12 h-12 bg-slate-800/90 active:bg-sky-600 rounded-lg border border-slate-700 flex items-center justify-center text-lg text-white"
            >
              ◀
            </button>
            <button
              onPointerDown={() => handleTouchDir('ArrowDown', true)}
              onPointerUp={() => handleTouchDir('ArrowDown', false)}
              className="w-12 h-12 bg-slate-800/90 active:bg-sky-600 rounded-lg border border-slate-700 flex items-center justify-center text-lg text-white"
            >
              ▼
            </button>
            <button
              onPointerDown={() => handleTouchDir('ArrowRight', true)}
              onPointerUp={() => handleTouchDir('ArrowRight', false)}
              className="w-12 h-12 bg-slate-800/90 active:bg-sky-600 rounded-lg border border-slate-700 flex items-center justify-center text-lg text-white"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
