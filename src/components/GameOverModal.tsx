import React, { useState, useEffect } from 'react';
import { GameMode, GameStats } from '../types/game';
import { RotateCcw, Trophy, Award, Zap, Crosshair, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audio';
import { saveLeaderboardEntry, getHighScoreForMode } from '../utils/leaderboard';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  mode: GameMode;
  reason: 'bomb' | 'strikes' | 'time_up';
  onRestart: () => void;
  onOpenLeaderboard: () => void;
  onChangeMode: (mode: GameMode) => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  mode,
  reason,
  onRestart,
  onOpenLeaderboard,
  onChangeMode,
}) => {
  const [playerName, setPlayerName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prevHigh = getHighScoreForMode(mode);
      if (stats.score > prevHigh && stats.score > 0) {
        setIsNewHighScore(true);
        // Confetti burst for high score celebration
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#ec4899', '#facc15', '#22c55e'],
          });
        } catch {
          // Confetti fallback
        }
      } else {
        setIsNewHighScore(false);
      }
      setHasSubmitted(false);
      setPlayerName(localStorage.getItem('cyberslash_player_handle') || 'NEON_BLADE');
    }
  }, [isOpen, stats.score, mode]);

  if (!isOpen) return null;

  const handleSaveScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || hasSubmitted) return;

    soundEngine.playButtonClick();
    localStorage.setItem('cyberslash_player_handle', playerName.trim().toUpperCase());

    saveLeaderboardEntry({
      name: playerName.trim().toUpperCase(),
      score: stats.score,
      mode,
      maxCombo: stats.maxCombo,
      slicedCount: stats.slicedTotal,
    });

    setHasSubmitted(true);
  };

  const getReasonText = () => {
    switch (reason) {
      case 'bomb':
        return { title: 'EMP BOMB DETONATED', color: 'text-rose-500', glow: 'neon-glow-pink' };
      case 'strikes':
        return { title: '3 STRIKES - MISSION FAILED', color: 'text-rose-400', glow: 'neon-glow-pink' };
      case 'time_up':
        return { title: 'TIME EXPIRED - RUN COMPLETE', color: 'text-cyan-400', glow: 'neon-glow-cyan' };
    }
  };

  const reasonInfo = getReasonText();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(244,63,94,0.25)] flex flex-col gap-6 relative overflow-hidden">
        {/* Glow backdrop decorative accent */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none ${
          reason === 'bomb' ? 'bg-rose-500' : 'bg-cyan-500'
        }`} />

        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            Mode: <span className="text-cyan-400 font-extrabold">{mode}</span>
          </div>

          <h2 className={`font-arcade text-2xl md:text-3xl font-black tracking-widest ${reasonInfo.color} ${reasonInfo.glow}`}>
            {reasonInfo.title}
          </h2>

          {isNewHighScore && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs font-arcade font-bold tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> NEW HIGH SCORE RECORD!
            </div>
          )}
        </div>

        {/* Main Score Hero Card */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-4 text-center flex flex-col items-center shadow-inner">
          <span className="text-xs uppercase font-bold tracking-widest text-neutral-400">Total Points Sliced</span>
          <span className="font-arcade text-5xl md:text-6xl font-black text-white tracking-widest my-1 neon-glow-cyan tabular-nums">
            {stats.score}
          </span>
        </div>

        {/* Stats Matrix Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3 flex flex-col items-center text-center">
            <Crosshair className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">Sliced</span>
            <span className="font-arcade text-lg font-bold text-white tabular-nums">{stats.slicedTotal}</span>
          </div>

          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3 flex flex-col items-center text-center">
            <Zap className="w-4 h-4 text-amber-400 mb-1" />
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">Max Combo</span>
            <span className="font-arcade text-lg font-bold text-amber-300 tabular-nums">
              {stats.maxCombo > 0 ? `${stats.maxCombo}x` : '0x'}
            </span>
          </div>

          <div className="bg-neutral-950/50 border border-neutral-800/80 rounded-xl p-3 flex flex-col items-center text-center">
            <Award className="w-4 h-4 text-rose-400 mb-1" />
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">Bombs Hit</span>
            <span className="font-arcade text-lg font-bold text-rose-300 tabular-nums">{stats.bombsHit}</span>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        <form onSubmit={handleSaveScore} className="bg-neutral-950/60 border border-cyan-500/20 rounded-xl p-3.5 flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Register Arcade High Score</span>
            {hasSubmitted && <span className="text-emerald-400 normal-case font-medium">Rank Saved! ✓</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={14}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              disabled={hasSubmitted}
              placeholder="YOUR_CYBER_TAG"
              className="flex-1 bg-neutral-900 border border-neutral-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm font-arcade uppercase tracking-wider text-white focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={hasSubmitted || !playerName.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-neutral-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 active:scale-95"
            >
              <span>{hasSubmitted ? 'Saved' : 'Submit'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onRestart();
            }}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-neutral-950 font-arcade font-black text-sm tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                soundEngine.playButtonClick();
                onOpenLeaderboard();
              }}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-amber-400/60 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Leaderboard
            </button>

            <button
              onClick={() => {
                soundEngine.playButtonClick();
                const nextMode: GameMode = mode === 'classic' ? 'arcade' : mode === 'arcade' ? 'zen' : 'classic';
                onChangeMode(nextMode);
                onRestart();
              }}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 hover:border-cyan-400/60 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              Next Mode ({mode === 'classic' ? 'Arcade' : mode === 'arcade' ? 'Zen' : 'Classic'})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
