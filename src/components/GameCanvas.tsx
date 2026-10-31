import React, { useRef, useEffect, useCallback } from 'react';
import { 
  GameMode, 
  FlyingObject, 
  SlicePoint, 
  JuiceSplat, 
  Particle, 
  FloatingText, 
  BladeStyle, 
  GameStats, 
  FruitId 
} from '../types/game';
import { FRUIT_CONFIGS, spawnFlyingObject, drawFruit, drawFruitHalf } from '../utils/fruits';
import { soundEngine } from '../utils/audio';

interface GameCanvasProps {
  mode: GameMode;
  activeBlade: BladeStyle;
  isPaused: boolean;
  score: number;
  strikes: number;
  maxStrikes: number;
  timeLeft: number;
  isFrenzyActive: boolean;
  onScoreUpdate: (newScore: number, added: number) => void;
  onStrikeUpdate: (strikes: number) => void;
  onGameOver: (reason: 'bomb' | 'strikes' | 'time_up', finalStats: GameStats) => void;
  onComboUpdate: (count: number, mult: number) => void;
  onFrenzyActivate: () => void;
  onStatsUpdate: (updater: (prev: GameStats) => GameStats) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  mode,
  activeBlade,
  isPaused,
  score,
  strikes,
  maxStrikes,
  timeLeft,
  isFrenzyActive,
  onScoreUpdate,
  onStrikeUpdate,
  onGameOver,
  onComboUpdate,
  onFrenzyActivate,
  onStatsUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game internal state references (to avoid re-binding loops)
  const objectsRef = useRef<FlyingObject[]>([]);
  const slicePointsRef = useRef<SlicePoint[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const splatsRef = useRef<JuiceSplat[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const isMouseDownRef = useRef(false);
  const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);

  // Swipe combo tracking
  const currentSwipeCutsRef = useRef<FruitId[]>([]);
  const swipeTimerRef = useRef<number | null>(null);

  // Spawning scheduler
  const nextSpawnTimeRef = useRef(0);
  const gameStartTimeRef = useRef(Date.now());
  const screenShakeRef = useRef({ intensity: 0, duration: 0 });

  // Refs for props to access safely inside requestAnimationFrame
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const activeBladeRef = useRef(activeBlade);
  activeBladeRef.current = activeBlade;
  const strikesRef = useRef(strikes);
  strikesRef.current = strikes;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const isFrenzyRef = useRef(isFrenzyActive);
  isFrenzyRef.current = isFrenzyActive;

  // Handle window resizing
  const handleResize = useCallback(() => {
    const container = containerRef.current;
    const bgCanvas = bgCanvasRef.current;
    const mainCanvas = mainCanvasRef.current;
    if (!container || !bgCanvas || !mainCanvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    bgCanvas.width = width * dpr;
    bgCanvas.height = height * dpr;
    bgCanvas.style.width = `${width}px`;
    bgCanvas.style.height = `${height}px`;

    mainCanvas.width = width * dpr;
    mainCanvas.height = height * dpr;
    mainCanvas.style.width = `${width}px`;
    mainCanvas.style.height = `${height}px`;

    const bgCtx = bgCanvas.getContext('2d');
    const mainCtx = mainCanvas.getContext('2d');
    if (bgCtx) bgCtx.scale(dpr, dpr);
    if (mainCtx) mainCtx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Add floating announcement text
  const addFloatingText = (x: number, y: number, text: string, color: string, glowColor: string, scale = 1) => {
    floatingTextsRef.current.push({
      id: `txt_${Date.now()}_${Math.random()}`,
      x,
      y,
      text,
      color,
      glowColor,
      scale,
      alpha: 1,
      vy: -55,
      createdAt: Date.now(),
    });
  };

  // Add juicy background splatter
  const addJuiceSplat = (x: number, y: number, color: string, baseRadius: number) => {
    const dropletCount = 6 + Math.floor(Math.random() * 6);
    const points: { dx: number; dy: number; r: number }[] = [];

    for (let i = 0; i < dropletCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * baseRadius * 1.6;
      points.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r: 4 + Math.random() * (baseRadius * 0.35),
      });
    }

    splatsRef.current.push({
      x,
      y,
      color,
      radius: baseRadius,
      points,
      alpha: 0.85,
      maxAlpha: 0.85,
      createdTime: Date.now(),
    });

    // Limit persistent splats for optimal performance
    if (splatsRef.current.length > 40) {
      splatsRef.current.shift();
    }
  };

  // Trigger screen shake
  const triggerScreenShake = (intensity = 15, durationMs = 400) => {
    screenShakeRef.current = { intensity, duration: durationMs };
  };

  // Slice collision detection with fruit
  const checkSliceCollision = (p1: SlicePoint, p2: SlicePoint) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) return; // Ignore micro-movements

    const cutAngle = Math.atan2(dy, dx);
    const speed = dist / Math.max(0.001, (p2.time - p1.time) / 1000);

    // Audio whoosh on fast swipes
    if (speed > 450) {
      soundEngine.playSwish(Math.min(2.5, speed / 500));
    }

    objectsRef.current.forEach((obj) => {
      if (obj.isCut) return;

      // Distance from circle center (obj.x, obj.y) to line segment (p1, p2)
      const u = Math.max(0, Math.min(1, ((obj.x - p1.x) * dx + (obj.y - p1.y) * dy) / (dist * dist)));
      const closestX = p1.x + u * dx;
      const closestY = p1.y + u * dy;
      const distToSegment = Math.hypot(obj.x - closestX, obj.y - closestY);

      if (distToSegment <= obj.radius * 0.95) {
        // HIT!
        handleFruitCut(obj, cutAngle, closestX, closestY, speed);
      }
    });
  };

  // Handle fruit cut physics and effects
  const handleFruitCut = (
    obj: FlyingObject,
    cutAngle: number,
    hitX: number,
    hitY: number,
    swipeSpeed: number
  ) => {
    obj.isCut = true;
    obj.cutTime = Date.now();
    const config = FRUIT_CONFIGS[obj.type];

    // Bomb Sliced!
    if (obj.type === 'bomb') {
      soundEngine.playBombExplosion();
      triggerScreenShake(24, 600);

      // Huge explosion particles
      for (let i = 0; i < 45; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 120 + Math.random() * 450;
        particlesRef.current.push({
          x: obj.x,
          y: obj.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: Math.random() > 0.4 ? '#ef4444' : '#fbbf24',
          radius: 3 + Math.random() * 5,
          alpha: 1,
          life: 0,
          maxLife: 0.7 + Math.random() * 0.5,
          glow: true,
        });
      }

      onStatsUpdate(prev => ({
        ...prev,
        bombsHit: prev.bombsHit + 1,
      }));

      if (modeRef.current === 'classic') {
        // Classic mode ends immediately on bomb cut!
        onGameOver('bomb', {
          score: scoreRef.current,
          maxCombo: 0,
          currentCombo: 0,
          slicedTotal: 0,
          slicedByType: {},
          bombsHit: 1,
          timePlayedSeconds: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
        });
        return;
      } else if (modeRef.current === 'arcade') {
        // Arcade mode: Penalty -15 points and freeze screen briefly
        const penalty = Math.min(15, scoreRef.current);
        onScoreUpdate(scoreRef.current - penalty, -penalty);
        addFloatingText(obj.x, obj.y, '-15 BOMB PENALTY!', '#ef4444', 'rgba(239,68,68,0.8)', 1.2);
        return;
      }
    }

    // Play fruit slice squelch
    soundEngine.playSlice(obj.type);

    // Normal vector perpendicular to cut plane
    const normX = Math.sin(cutAngle);
    const normY = -Math.cos(cutAngle);
    const separationSpeed = 160 + Math.random() * 80;

    // Create 2 tumbling halves
    obj.halves = [
      {
        x: obj.x + normX * 8,
        y: obj.y + normY * 8,
        vx: obj.vx + normX * separationSpeed,
        vy: obj.vy + normY * separationSpeed - 40,
        rotation: obj.rotation,
        vRot: (Math.random() * 4 + 2),
        cutAngle,
        side: 1,
        opacity: 1,
      },
      {
        x: obj.x - normX * 8,
        y: obj.y - normY * 8,
        vx: obj.vx - normX * separationSpeed,
        vy: obj.vy - normY * separationSpeed - 40,
        rotation: obj.rotation,
        vRot: -(Math.random() * 4 + 2),
        cutAngle,
        side: -1,
        opacity: 1,
      },
    ];

    // Splat juice onto backdrop
    addJuiceSplat(hitX, hitY, config.juiceColor, obj.radius * 0.7);

    // Spawn juicy burst particles
    const particleCount = 22 + Math.floor(Math.random() * 12);
    for (let i = 0; i < particleCount; i++) {
      const pAngle = cutAngle + (Math.random() - 0.5) * 1.8;
      const pSpeed = (Math.random() * 320 + 80) * (Math.random() > 0.5 ? 1 : -1);
      particlesRef.current.push({
        x: hitX,
        y: hitY,
        vx: Math.cos(pAngle) * pSpeed,
        vy: Math.sin(pAngle) * pSpeed,
        color: Math.random() > 0.3 ? config.juiceColor : config.primaryColor,
        radius: 2 + Math.random() * 3.5,
        alpha: 1,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.4,
        gravity: 600,
        glow: true,
      });
    }

    // Special fruit triggers
    if (obj.type === 'frenzy_banana') {
      soundEngine.playFrenzy();
      onFrenzyActivate();
      addFloatingText(hitX, hitY, 'FRENZY RUSH!', '#00f5ff', 'rgba(0,245,255,0.8)', 1.5);
    } else if (obj.type === 'golden_dragon') {
      soundEngine.playCombo(5);
      addFloatingText(hitX, hitY, '+50 GOLDEN BURST!', '#ffd700', 'rgba(255,215,0,0.9)', 1.5);
    }

    // Points calculation
    const basePoints = config.points;
    onScoreUpdate(scoreRef.current + basePoints, basePoints);

    // Update stats
    onStatsUpdate(prev => ({
      ...prev,
      score: prev.score + basePoints,
      slicedTotal: prev.slicedTotal + 1,
      slicedByType: {
        ...prev.slicedByType,
        [obj.type]: (prev.slicedByType[obj.type] || 0) + 1,
      },
    }));

    // Swipe combo grouping
    currentSwipeCutsRef.current.push(obj.type);
    if (swipeTimerRef.current !== null) {
      window.clearTimeout(swipeTimerRef.current);
    }

    swipeTimerRef.current = window.setTimeout(() => {
      const comboSize = currentSwipeCutsRef.current.length;
      if (comboSize >= 3) {
        // Combo achieved!
        const bonusPoints = comboSize * 2;
        onScoreUpdate(scoreRef.current + bonusPoints, bonusPoints);
        soundEngine.playCombo(comboSize);

        const comboLabels = [
          '3x COMBO!',
          '4x SLICE BLITZ!',
          '5x MEGA COMBO!',
          'ULTRA SLICE!',
          'CYBER GODLIKE!',
        ];
        const label = comboLabels[Math.min(comboLabels.length - 1, comboSize - 3)];
        addFloatingText(hitX, hitY - 20, `${label} +${bonusPoints}`, '#f59e0b', 'rgba(245,158,11,0.9)', 1.4);

        onComboUpdate(comboSize, comboSize >= 5 ? 3 : 2);
        onStatsUpdate(prev => ({
          ...prev,
          maxCombo: Math.max(prev.maxCombo, comboSize),
        }));
      }
      currentSwipeCutsRef.current = [];
    }, 320);
  };

  // Pointer event handlers (Desktop mouse + Mobile touch)
  const addSlicePoint = (clientX: number, clientY: number) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const now = Date.now();

    const newPoint: SlicePoint = { x, y, time: now };
    const points = slicePointsRef.current;

    // Check collision against previous point
    if (points.length > 0) {
      const prev = points[points.length - 1];
      checkSliceCollision(prev, newPoint);
    }

    points.push(newPoint);
    lastMousePosRef.current = { x, y };

    // Spawn blade spark particles
    if (Math.random() < 0.6) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 60,
        vy: (Math.random() - 0.5) * 60,
        color: activeBladeRef.current.particleColor,
        radius: 1.5 + Math.random() * 2,
        alpha: 1,
        life: 0,
        maxLife: 0.25,
        glow: true,
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isMouseDownRef.current = true;
    slicePointsRef.current = [];
    addSlicePoint(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current && e.pointerType === 'mouse' && e.buttons === 0) {
      // In casual mode, allow hovering or mouse move slicing without holding button!
      addSlicePoint(e.clientX, e.clientY);
      return;
    }
    if (isMouseDownRef.current || e.buttons > 0) {
      addSlicePoint(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
    lastMousePosRef.current = null;
  };

  // Main Animation & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.06, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const mainCanvas = mainCanvasRef.current;
      const bgCanvas = bgCanvasRef.current;
      if (!mainCanvas || !bgCanvas) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const mainCtx = mainCanvas.getContext('2d');
      const bgCtx = bgCanvas.getContext('2d');
      if (!mainCtx || !bgCtx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      const width = mainCanvas.clientWidth;
      const height = mainCanvas.clientHeight;

      // Handle screen shake
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      if (screenShakeRef.current.duration > 0) {
        screenShakeRef.current.duration -= dt * 1000;
        const mag = screenShakeRef.current.intensity * (screenShakeRef.current.duration / 400);
        shakeOffsetX = (Math.random() - 0.5) * mag;
        shakeOffsetY = (Math.random() - 0.5) * mag;
      }

      // 1. Render Background & Juice Splatters
      bgCtx.save();
      bgCtx.fillStyle = '#05050b';
      bgCtx.fillRect(0, 0, width, height);

      // Cyber Grid Pattern
      bgCtx.strokeStyle = isFrenzyRef.current ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.035)';
      bgCtx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, height);
        bgCtx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(width, y);
        bgCtx.stroke();
      }

      // Draw persistent juice splatter marks
      splatsRef.current.forEach((splat) => {
        bgCtx.save();
        bgCtx.globalAlpha = splat.alpha;
        bgCtx.fillStyle = splat.color;
        bgCtx.shadowColor = splat.color;
        bgCtx.shadowBlur = 10;

        bgCtx.beginPath();
        bgCtx.arc(splat.x, splat.y, splat.radius * 0.4, 0, Math.PI * 2);
        bgCtx.fill();

        splat.points.forEach((pt) => {
          bgCtx.beginPath();
          bgCtx.arc(splat.x + pt.dx, splat.y + pt.dy, pt.r, 0, Math.PI * 2);
          bgCtx.fill();
        });
        bgCtx.restore();

        // Slow fade out over 30 seconds
        splat.alpha = Math.max(0.12, splat.alpha - dt * 0.025);
      });
      bgCtx.restore();

      // 2. Render Main Game Stage (Fruits, Halves, Particles, Slices)
      mainCtx.save();
      mainCtx.clearRect(0, 0, width, height);
      if (shakeOffsetX !== 0 || shakeOffsetY !== 0) {
        mainCtx.translate(shakeOffsetX, shakeOffsetY);
      }

      if (!isPausedRef.current) {
        // --- Spawner Logic ---
        const now = Date.now();
        if (now >= nextSpawnTimeRef.current) {
          const spawnInterval = isFrenzyRef.current 
            ? (600 + Math.random() * 400) 
            : Math.max(1200, 2400 - (scoreRef.current * 1.5));
          nextSpawnTimeRef.current = now + spawnInterval;

          // Number of fruits in this wave (1 to 4)
          const count = isFrenzyRef.current ? (2 + Math.floor(Math.random() * 3)) : (1 + Math.floor(Math.random() * 2));
          const includeBomb = modeRef.current !== 'zen';
          const bombProb = modeRef.current === 'classic' ? 0.18 : 0.22;

          for (let i = 0; i < count; i++) {
            objectsRef.current.push(
              spawnFlyingObject(
                width, 
                height, 
                includeBomb, 
                bombProb, 
                isFrenzyRef.current ? 0.85 : 1.0
              )
            );
          }
        }

        // --- Physics & Object Updates ---
        const gravity = 800; // px/sec^2

        objectsRef.current.forEach((obj) => {
          if (!obj.isCut) {
            // Whole flying object trajectory
            obj.vy += gravity * dt;
            obj.x += obj.vx * dt;
            obj.y += obj.vy * dt;
            obj.rotation += obj.vRot * dt;

            // Check if dropped below bottom
            if (obj.y > height + obj.radius + 20 && obj.vy > 0) {
              if (!obj.hasBeenMissed) {
                obj.hasBeenMissed = true;
                // If regular fruit dropped in Classic mode -> Strike!
                if (modeRef.current === 'classic' && obj.type !== 'bomb' && !FRUIT_CONFIGS[obj.type].isSpecial) {
                  const newStrikes = strikesRef.current + 1;
                  onStrikeUpdate(newStrikes);
                  if (newStrikes >= maxStrikes) {
                    onGameOver('strikes', {
                      score: scoreRef.current,
                      maxCombo: 0,
                      currentCombo: 0,
                      slicedTotal: 0,
                      slicedByType: {},
                      bombsHit: 0,
                      timePlayedSeconds: Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
                    });
                  }
                }
              }
            }
          } else if (obj.halves) {
            // Cut fruit halves tumbling away
            obj.halves.forEach((half) => {
              half.vy += gravity * 1.1 * dt;
              half.x += half.vx * dt;
              half.y += half.vy * dt;
              half.rotation += half.vRot * dt;
              half.opacity = Math.max(0, half.opacity - dt * 0.7);
            });
          }
        });

        // Filter out objects that have left the screen
        objectsRef.current = objectsRef.current.filter((obj) => {
          if (!obj.isCut) {
            return obj.y < height + 100;
          }
          if (obj.halves) {
            return obj.halves[0].y < height + 120 || obj.halves[1].y < height + 120;
          }
          return false;
        });

        // --- Update Particles ---
        particlesRef.current.forEach((p) => {
          p.life += dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          if (p.gravity) {
            p.vy += p.gravity * dt;
          }
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

        // --- Update Floating Texts ---
        floatingTextsRef.current.forEach((txt) => {
          txt.y += txt.vy * dt;
          const age = (now - txt.createdAt) / 1000;
          txt.alpha = Math.max(0, 1 - age / 1.1);
        });
        floatingTextsRef.current = floatingTextsRef.current.filter((txt) => txt.alpha > 0.05);

        // --- Prune Older Slice Points (Blade Ribbon Lifespan) ---
        const sliceLifetime = 180; // ms
        slicePointsRef.current = slicePointsRef.current.filter((pt) => now - pt.time < sliceLifetime);
      }

      // --- Draw Flying Fruits & Halves ---
      objectsRef.current.forEach((obj) => {
        if (!obj.isCut) {
          drawFruit(mainCtx, obj, currentTime);
        } else if (obj.halves) {
          obj.halves.forEach((half) => {
            mainCtx.save();
            mainCtx.translate(half.x, half.y);
            mainCtx.rotate(half.rotation);
            drawFruitHalf(mainCtx, obj.type, obj.radius, half.side, half.cutAngle, half.opacity);
            mainCtx.restore();
          });
        }
      });

      // --- Draw Particles ---
      particlesRef.current.forEach((p) => {
        mainCtx.save();
        mainCtx.globalAlpha = p.alpha;
        mainCtx.fillStyle = p.color;
        if (p.glow) {
          mainCtx.shadowColor = p.color;
          mainCtx.shadowBlur = 10;
        }
        mainCtx.beginPath();
        mainCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        mainCtx.fill();
        mainCtx.restore();
      });

      // --- Draw Floating Texts ---
      floatingTextsRef.current.forEach((txt) => {
        mainCtx.save();
        mainCtx.globalAlpha = txt.alpha;
        mainCtx.font = `900 ${Math.round(20 * txt.scale)}px 'Orbitron', sans-serif`;
        mainCtx.textAlign = 'center';
        mainCtx.textBaseline = 'middle';
        mainCtx.shadowColor = txt.glowColor;
        mainCtx.shadowBlur = 15;
        mainCtx.fillStyle = txt.color;
        mainCtx.fillText(txt.text, txt.x, txt.y);
        mainCtx.restore();
      });

      // --- Draw Smooth Blade Slash Trail ---
      const blade = activeBladeRef.current;
      const pts = slicePointsRef.current;
      if (pts.length >= 2) {
        mainCtx.save();
        mainCtx.lineCap = 'round';
        mainCtx.lineJoin = 'round';

        // Outer Neon Aura
        mainCtx.shadowColor = blade.glowColor;
        mainCtx.shadowBlur = 18;

        for (let i = 1; i < pts.length; i++) {
          const p1 = pts[i - 1];
          const p2 = pts[i];
          const progress = i / pts.length; // 0 to 1
          const widthVal = progress * 10 + 2;

          mainCtx.beginPath();
          mainCtx.moveTo(p1.x, p1.y);
          mainCtx.lineTo(p2.x, p2.y);
          mainCtx.lineWidth = widthVal;
          mainCtx.strokeStyle = blade.glowColor;
          mainCtx.stroke();
        }

        // Inner Sharp Hot Core
        for (let i = 1; i < pts.length; i++) {
          const p1 = pts[i - 1];
          const p2 = pts[i];
          const progress = i / pts.length;
          const coreWidth = progress * 4 + 1;

          mainCtx.beginPath();
          mainCtx.moveTo(p1.x, p1.y);
          mainCtx.lineTo(p2.x, p2.y);
          mainCtx.lineWidth = coreWidth;
          mainCtx.strokeStyle = blade.coreColor;
          mainCtx.stroke();
        }

        mainCtx.restore();
      }

      mainCtx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [maxStrikes, onGameOver, onScoreUpdate, onStrikeUpdate, onFrenzyActivate, onComboUpdate, onStatsUpdate]);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-full overflow-hidden select-none touch-none cursor-crosshair"
      style={{ touchAction: 'none' }}
    >
      {/* Background Splatter & Grid Canvas */}
      <canvas
        ref={bgCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Main Physics, Objects, and Blade Trail Canvas */}
      <canvas
        ref={mainCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
