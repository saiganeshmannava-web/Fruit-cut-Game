import React from 'react';
import { GameMode, BladeStyle } from '../types/game';
import { Play, RotateCcw, Trophy, Sword, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PauseModalProps {
  isOpen: boolean;
  mode: GameMode;
  score: number;
  activeBlade: BladeStyle;
  sfxMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onChangeMode: (mode: GameMode) => void;
  onOpenLeaderboard: () => void;
  onOpenBladeSelector: () => void;
  onToggleSfx: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  mode,
  score,
  activeBlade,
  sfxMuted,
  onResume,
  onRestart,
  onChangeMode,
  onOpenLeaderboard,
  onOpenBladeSelector,
  onToggleSfx,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col gap-6 relative overflow-hidden">
        {/* Neon corner accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none" />

        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-2">
            System Suspended
          </div>
          <h2 className="font-arcade text-3xl font-black text-white tracking-widest neon-glow-cyan">
            GAME PAUSED
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Current Score: <span className="text-cyan-400 font-bold font-arcade">{score}</span> | Mode: <span className="uppercase text-amber-400 font-bold">{mode}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Resume */}
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onResume();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-arcade font-black text-sm tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            RESUME SLICING
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onRestart();
            }}
            className="w-full py-3 px-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 hover:border-rose-400/60 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            RESTART MISSION
          </button>
        </div>

        {/* Quick Config Row */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenBladeSelector();
            }}
            className="p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800 hover:border-cyan-500/50 transition-all flex flex-col items-center gap-1.5 text-center"
          >
            <Sword className="w-5 h-5" style={{ color: activeBlade.glowColor }} />
            <span className="text-xs font-bold text-neutral-200">Equip Blade</span>
            <span className="text-[10px] text-neutral-400 truncate w-full">{activeBlade.name}</span>
          </button>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onOpenLeaderboard();
            }}
            className="p-3 rounded-xl bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800 hover:border-amber-500/50 transition-all flex flex-col items-center gap-1.5 text-center"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-bold text-neutral-200">High Scores</span>
            <span className="text-[10px] text-neutral-400">View Rankings</span>
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex flex-col gap-1.5 pt-2 border-t border-neutral-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 text-center">
            Switch Game Mode
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(['classic', 'arcade', 'zen'] as GameMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  soundEngine.playButtonClick();
                  onChangeMode(m);
                }}
                className={`py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-center ${
                  mode === m
                    ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-neutral-950/60 hover:bg-neutral-800/60 border border-neutral-800 text-neutral-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Toggle */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
          <span>Sound Effects</span>
          <button
            onClick={onToggleSfx}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
          >
            {sfxMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{sfxMuted ? 'Muted' : 'Enabled'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
