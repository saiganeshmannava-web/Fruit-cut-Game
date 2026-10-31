import React from 'react';
import { GameMode, BladeStyle } from '../types/game';
import { 
  Pause, 
  Play, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  Sword, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame,
  X as XIcon 
} from 'lucide-react';

interface HUDProps {
  score: number;
  highScore: number;
  mode: GameMode;
  strikes: number;
  maxStrikes: number;
  timeLeft: number;
  comboCount: number;
  comboMultiplier: number;
  isPaused: boolean;
  activeBlade: BladeStyle;
  isFrenzyActive: boolean;
  frenzyTimeLeft: number;
  sfxMuted: boolean;
  onTogglePause: () => void;
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onOpenBladeSelector: () => void;
  onToggleSfx: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  highScore,
  mode,
  strikes,
  maxStrikes,
  timeLeft,
  comboCount,
  comboMultiplier,
  isPaused,
  activeBlade,
  isFrenzyActive,
  frenzyTimeLeft,
  sfxMuted,
  onTogglePause,
  onRestart,
  onOpenLeaderboard,
  onOpenBladeSelector,
  onToggleSfx,
}) => {
  return (
    <div className="absolute inset-x-0 top-0 p-3 md:p-6 pointer-events-none select-none z-20 flex flex-col gap-2">
      {/* Top Bar Navigation & Stats */}
      <div className="flex items-center justify-between w-full">
        {/* Left Side: Score & Multiplier */}
        <div className="flex items-center gap-3">
          {/* Main Score Box */}
          <div className="bg-neutral-900/80 backdrop-blur-md border border-cyan-500/30 rounded-xl px-4 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(6,182,212,0.15)] pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-cyan-400">Score</span>
              <span className="font-arcade text-2xl md:text-3xl font-black text-white tracking-wider tabular-nums neon-glow-cyan">
                {score}
              </span>
            </div>

            {/* High Score Badge */}
            <div className="hidden sm:flex flex-col border-l border-neutral-700/60 pl-3">
              <span className="text-[9px] uppercase tracking-wider text-amber-400/80 flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5" /> Best
              </span>
              <span className="font-arcade text-xs font-bold text-amber-300 tabular-nums">
                {highScore}
              </span>
            </div>
          </div>

          {/* Active Combo Multiplier Pill */}
          {comboMultiplier > 1 && (
            <div className="animate-bounce bg-gradient-to-r from-amber-500/90 to-rose-500/90 border border-amber-400 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Flame className="w-4 h-4 text-white animate-pulse" />
              <span className="font-arcade text-xs md:text-sm font-black text-white tracking-widest">
                {comboMultiplier}X COMBO!
              </span>
            </div>
          )}

          {/* Frenzy Alert */}
          {isFrenzyActive && (
            <div className="animate-pulse bg-cyan-500/20 border border-cyan-400 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span className="font-arcade text-xs md:text-sm font-extrabold text-cyan-300 tracking-wider">
                FRENZY! {frenzyTimeLeft.toFixed(1)}s
              </span>
            </div>
          )}
        </div>

        {/* Center: Mode Indicator & Timer / Strikes */}
        <div className="flex items-center gap-3">
          {mode === 'classic' && (
            <div className="bg-neutral-900/80 backdrop-blur-md border border-rose-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-neutral-400 mr-1 hidden sm:inline">Strikes</span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxStrikes }).map((_, idx) => {
                  const isLost = idx < strikes;
                  return (
                    <div
                      key={idx}
                      className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all ${
                        isLost 
                          ? 'bg-rose-500/20 border border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]' 
                          : 'bg-neutral-800/60 border border-neutral-700/60 text-neutral-600'
                      }`}
                    >
                      <XIcon className="w-4 h-4 stroke-[3]" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(mode === 'arcade' || mode === 'zen') && (
            <div className={`bg-neutral-900/80 backdrop-blur-md border rounded-xl px-3 py-2 flex items-center gap-2 ${
              timeLeft <= 10 
                ? 'border-rose-500/80 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse' 
                : 'border-yellow-500/30'
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400' : 'text-yellow-400'}`} />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 leading-none">Time</span>
                <span className={`font-arcade text-lg md:text-xl font-bold tabular-nums leading-none ${
                  timeLeft <= 10 ? 'text-rose-400' : 'text-yellow-300'
                }`}>
                  {Math.max(0, Math.ceil(timeLeft))}s
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 md:gap-2 pointer-events-auto">
          {/* Blade Weapon Armory */}
          <button
            onClick={onOpenBladeSelector}
            title={`Blade: ${activeBlade.name}`}
            className="p-2 md:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-cyan-400 text-neutral-300 hover:text-cyan-300 transition-all shadow-md active:scale-95 flex items-center gap-1.5"
          >
            <Sword className="w-4 h-4" style={{ color: activeBlade.glowColor }} />
            <span className="hidden lg:inline text-xs font-semibold">{activeBlade.name}</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSfx}
            title={sfxMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
            className="p-2 md:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-neutral-500 text-neutral-300 transition-all shadow-md active:scale-95"
          >
            {sfxMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Leaderboard Button */}
          <button
            onClick={onOpenLeaderboard}
            title="Leaderboard High Scores"
            className="p-2 md:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-amber-400 text-neutral-300 hover:text-amber-300 transition-all shadow-md active:scale-95"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            title="Restart Game"
            className="p-2 md:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700/60 hover:border-rose-400 text-neutral-300 hover:text-rose-300 transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Pause / Resume Button */}
          <button
            onClick={onTogglePause}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            className={`p-2 md:p-2.5 rounded-xl border transition-all shadow-md active:scale-95 ${
              isPaused 
                ? 'bg-cyan-500 border-cyan-400 text-neutral-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)]' 
                : 'bg-neutral-900/80 hover:bg-neutral-800 border-neutral-700/60 text-neutral-300'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
