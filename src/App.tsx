import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, BladeStyle, GameStats } from './types/game';
import { BLADE_STYLES } from './utils/blades';
import { getHighScoreForMode } from './utils/leaderboard';
import { soundEngine } from './utils/audio';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MusicPlayer } from './components/MusicPlayer';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { BladeSelectorModal } from './components/BladeSelectorModal';
import { 
  Play, 
  Trophy, 
  Sword, 
  Sparkles, 
  Zap, 
  Flame, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  HelpCircle,
  Radio
} from 'lucide-react';

export default function App() {
  // Game Flow States
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameover'>('menu');
  const [mode, setMode] = useState<GameMode>('classic');
  const [activeBlade, setActiveBlade] = useState<BladeStyle>(BLADE_STYLES[0]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(getHighScoreForMode('classic'));
  const [strikes, setStrikes] = useState(0);
  const maxStrikes = 3;

  // Timers & Combos
  const [timeLeft, setTimeLeft] = useState(60);
  const [comboCount, setComboCount] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [isFrenzyActive, setIsFrenzyActive] = useState(false);
  const [frenzyTimeLeft, setFrenzyTimeLeft] = useState(0);

  // Sound FX State
  const [sfxMuted, setSfxMuted] = useState(false);

  // Modals
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isBladeSelectorOpen, setIsBladeSelectorOpen] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'bomb' | 'strikes' | 'time_up'>('strikes');
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Cumulative game stats for GameOver modal
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    maxCombo: 0,
    currentCombo: 0,
    slicedTotal: 0,
    slicedByType: {},
    bombsHit: 0,
    timePlayedSeconds: 0,
  });

  // Keep track of high score for current mode
  useEffect(() => {
    setHighScore(getHighScoreForMode(mode));
  }, [mode]);

  // Main Countdown Timer for Arcade (60s) and Zen (90s)
  useEffect(() => {
    if (gameState !== 'playing' || (mode !== 'arcade' && mode !== 'zen')) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver('time_up');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, mode]);

  // Frenzy Mode Countdown
  useEffect(() => {
    if (!isFrenzyActive) return;

    const timer = setInterval(() => {
      setFrenzyTimeLeft((prev) => {
        if (prev <= 0.1) {
          setIsFrenzyActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isFrenzyActive]);

  // Start / Restart Game Session
  const startGame = useCallback((selectedMode = mode) => {
    soundEngine.playButtonClick();
    soundEngine.playSwish(1.6);
    if (!soundEngine.getIsMusicPlaying()) {
      soundEngine.playMusic();
    }

    setMode(selectedMode);
    setScore(0);
    setStrikes(0);
    setTimeLeft(selectedMode === 'arcade' ? 60 : selectedMode === 'zen' ? 90 : 0);
    setComboCount(0);
    setComboMultiplier(1);
    setIsFrenzyActive(false);
    setFrenzyTimeLeft(0);
    setHighScore(getHighScoreForMode(selectedMode));
    setStats({
      score: 0,
      maxCombo: 0,
      currentCombo: 0,
      slicedTotal: 0,
      slicedByType: {},
      bombsHit: 0,
      timePlayedSeconds: 0,
    });
    setGameState('playing');
  }, [mode]);

  const handleGameOver = useCallback((reason: 'bomb' | 'strikes' | 'time_up') => {
    soundEngine.playGameOver();
    setGameOverReason(reason);
    setGameState('gameover');
  }, []);

  const handleTogglePause = () => {
    soundEngine.playButtonClick();
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  };

  const handleScoreUpdate = (newScore: number) => {
    setScore(newScore);
    if (newScore > highScore) {
      setHighScore(newScore);
    }
  };

  const handleStrikeUpdate = (newStrikes: number) => {
    setStrikes(newStrikes);
  };

  const handleComboUpdate = (count: number, mult: number) => {
    setComboCount(count);
    setComboMultiplier(mult);
    setTimeout(() => {
      setComboMultiplier(1);
    }, 1800);
  };

  const handleFrenzyActivate = () => {
    setIsFrenzyActive(true);
    setFrenzyTimeLeft(5.0);
  };

  const handleToggleSfx = () => {
    soundEngine.playButtonClick();
    if (sfxMuted) {
      soundEngine.setSfxVolume(0.8);
      setSfxMuted(false);
    } else {
      soundEngine.setSfxVolume(0);
      setSfxMuted(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 font-sans select-none touch-none">
      {/* Background Animated Neon Grid & Floating Lights */}
      <div className="absolute inset-0 cyber-grid pointer-events-none opacity-40" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Main Interactive Slicing Canvas (Always active in playing / paused / gameover) */}
      <GameCanvas
        mode={mode}
        activeBlade={activeBlade}
        isPaused={gameState !== 'playing'}
        score={score}
        strikes={strikes}
        maxStrikes={maxStrikes}
        timeLeft={timeLeft}
        isFrenzyActive={isFrenzyActive}
        onScoreUpdate={handleScoreUpdate}
        onStrikeUpdate={handleStrikeUpdate}
        onGameOver={handleGameOver}
        onComboUpdate={handleComboUpdate}
        onFrenzyActivate={handleFrenzyActivate}
        onStatsUpdate={setStats}
      />

      {/* Heads Up Display (HUD) */}
      {gameState === 'playing' && (
        <HUD
          score={score}
          highScore={highScore}
          mode={mode}
          strikes={strikes}
          maxStrikes={maxStrikes}
          timeLeft={timeLeft}
          comboCount={comboCount}
          comboMultiplier={comboMultiplier}
          isPaused={false}
          activeBlade={activeBlade}
          isFrenzyActive={isFrenzyActive}
          frenzyTimeLeft={frenzyTimeLeft}
          sfxMuted={sfxMuted}
          onTogglePause={handleTogglePause}
          onRestart={() => startGame(mode)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenBladeSelector={() => setIsBladeSelectorOpen(true)}
          onToggleSfx={handleToggleSfx}
        />
      )}

      {/* Start / Main Menu Screen Overlay */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-between p-4 md:p-8 bg-neutral-950/80 backdrop-blur-sm">
          {/* Top Brand Bar */}
          <div className="w-full flex items-center justify-between max-w-4xl pt-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-arcade text-xs font-bold tracking-widest text-cyan-400 uppercase">
                System Active // v2.0
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBladeSelectorOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-xs font-semibold text-neutral-300 hover:text-cyan-300 transition-all flex items-center gap-1.5 shadow-md"
              >
                <Sword className="w-3.5 h-3.5" style={{ color: activeBlade.glowColor }} />
                <span>Armory ({activeBlade.name})</span>
              </button>

              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400 text-xs font-semibold text-neutral-300 hover:text-amber-300 transition-all flex items-center gap-1.5 shadow-md"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Rankings</span>
              </button>
            </div>
          </div>

          {/* Center Title & Game Mode Selector */}
          <div className="flex flex-col items-center text-center my-auto max-w-2xl w-full px-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 text-xs font-arcade font-bold tracking-widest mb-4 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <Sparkles className="w-3.5 h-3.5" />
              ARCADE SLICER EXTRAVAGANZA
            </div>

            <h1 className="font-arcade text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-100 to-cyan-400 tracking-wider mb-2 drop-shadow-[0_0_30px_rgba(6,182,212,0.6)]">
              CYBERSLASH
            </h1>
            <p className="font-arcade text-xs md:text-sm tracking-[0.25em] text-neutral-400 uppercase mb-8">
              Slice Flying Neon Fruits • Dodge EMP Bombs
            </p>

            {/* Mode Select Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8">
              {/* Classic */}
              <button
                onClick={() => setMode('classic')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  mode === 'classic'
                    ? 'bg-rose-500/15 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-arcade text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                    CLASSIC
                  </span>
                  <Flame className="w-4 h-4 text-rose-400" />
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  3 Strikes, fatal bombs, escalating arcade challenge.
                </p>
                {mode === 'classic' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                )}
              </button>

              {/* Arcade Rush */}
              <button
                onClick={() => setMode('arcade')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  mode === 'arcade'
                    ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                    : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-arcade text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">
                    ARCADE 60s
                  </span>
                  <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  60-second timed blitz! Frenzy bananas and score rushes.
                </p>
                {mode === 'arcade' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_8px_#06b6d4]" />
                )}
              </button>

              {/* Zen Mode */}
              <button
                onClick={() => setMode('zen')}
                className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                  mode === 'zen'
                    ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-neutral-900/70 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-arcade text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                    ZEN 90s
                  </span>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">
                  Zero bombs, zero strikes. Pure rhythmic slicing flow state.
                </p>
                {mode === 'zen' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 shadow-[0_0_8px_#f59e0b]" />
                )}
              </button>
            </div>

            {/* Launch Big Slicing Button */}
            <button
              onClick={() => startGame(mode)}
              className="w-full sm:w-80 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-neutral-950 font-arcade font-black text-lg tracking-widest shadow-[0_0_35px_rgba(6,182,212,0.6)] transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>LAUNCH MISSION</span>
            </button>

            {/* Tip */}
            <p className="text-xs text-neutral-500 mt-4 flex items-center gap-1.5">
              <span>Swipe with mouse or finger gestures across fruits to slice</span>
            </p>
          </div>

          {/* Bottom Bar: Instructions & Audio Switch */}
          <div className="w-full flex items-center justify-between max-w-4xl pb-2 text-xs text-neutral-400">
            <button
              onClick={() => setShowHowToPlay(!showHowToPlay)}
              className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How To Play & Combos</span>
            </button>

            <button
              onClick={handleToggleSfx}
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>SFX: {sfxMuted ? 'Off' : 'On'}</span>
            </button>
          </div>
        </div>
      )}

      {/* How To Play Overlay Sheet */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-neutral-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-arcade text-xl font-bold text-white neon-glow-cyan">
              HOW TO PLAY CYBERSLASH
            </h3>
            <div className="space-y-3 text-xs text-neutral-300 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="font-bold text-cyan-400">1. Slicing Mechanics:</span>
                <p className="text-neutral-400 mt-0.5">Move mouse or drag your finger across flying fruits to split them into realistic halves and paint neon juice splatters.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="font-bold text-amber-400">2. Combos & Multipliers:</span>
                <p className="text-neutral-400 mt-0.5">Slice 3 or more fruits in a single swipe to trigger 2X and 3X combo bonus multipliers with celebratory chimes.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="font-bold text-rose-400">3. Danger - EMP Bombs:</span>
                <p className="text-neutral-400 mt-0.5">Avoid slicing ticking bombs! In Classic mode they immediately end your run; in Arcade mode they deduct -15 points.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
                <span className="font-bold text-emerald-400">4. Special Fruit Power-Ups:</span>
                <p className="text-neutral-400 mt-0.5">Slice rainbow Frenzy Bananas for high-speed fruit rushes, and Golden Dragonfruits for +50 instant score points.</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs uppercase tracking-wider transition-all"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Floating Interactive Music Player Deck */}
      <MusicPlayer />

      {/* Pause Menu Modal */}
      <PauseModal
        isOpen={gameState === 'paused'}
        mode={mode}
        score={score}
        activeBlade={activeBlade}
        sfxMuted={sfxMuted}
        onResume={() => setGameState('playing')}
        onRestart={() => startGame(mode)}
        onChangeMode={(m) => {
          setMode(m);
          startGame(m);
        }}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onOpenBladeSelector={() => setIsBladeSelectorOpen(true)}
        onToggleSfx={handleToggleSfx}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={gameState === 'gameover'}
        stats={stats}
        mode={mode}
        reason={gameOverReason}
        onRestart={() => startGame(mode)}
        onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
        onChangeMode={(m) => {
          setMode(m);
          startGame(m);
        }}
      />

      {/* Leaderboard Rankings Modal */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        initialMode={mode}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      {/* Blade Weapon Armory Modal */}
      <BladeSelectorModal
        isOpen={isBladeSelectorOpen}
        activeBlade={activeBlade}
        onSelectBlade={(blade) => setActiveBlade(blade)}
        onClose={() => setIsBladeSelectorOpen(false)}
      />
    </div>
  );
}
