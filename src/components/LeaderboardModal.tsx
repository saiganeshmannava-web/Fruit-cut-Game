import React, { useState, useEffect } from 'react';
import { GameMode, LeaderboardEntry } from '../types/game';
import { Trophy, X, Medal, Flame, Calendar, Award } from 'lucide-react';
import { loadLeaderboard } from '../utils/leaderboard';
import { soundEngine } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  initialMode: GameMode;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  initialMode,
  onClose,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(initialMode);
      setEntries(loadLeaderboard());
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const filteredEntries = entries
    .filter(e => e.mode === selectedMode)
    .sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-xl bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(245,158,11,0.2)] flex flex-col gap-5 max-h-[88vh] relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-arcade text-xl md:text-2xl font-black text-white tracking-wider neon-glow-yellow">
                HALL OF CYBER BLADES
              </h2>
              <p className="text-xs text-neutral-400">All-time top fruit slicing legends</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all"
            title="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-neutral-950/70 p-1.5 rounded-xl border border-neutral-800">
          {(['classic', 'arcade', 'zen'] as GameMode[]).map((m) => {
            const isActive = selectedMode === m;
            return (
              <button
                key={m}
                onClick={() => {
                  soundEngine.playButtonClick();
                  setSelectedMode(m);
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all font-arcade ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>

        {/* Leaderboard Table List */}
        <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-2 min-h-[260px]">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-sm">
              <Award className="w-8 h-8 mb-2 opacity-50" />
              <span>No runs registered for this mode yet.</span>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const rank = idx + 1;
              let rankBadge = (
                <span className="font-arcade text-sm font-bold text-neutral-400 w-7 text-center">
                  #{rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                    <Medal className="w-4 h-4 fill-amber-400 text-amber-300" />
                  </div>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-lg bg-slate-300/20 border border-slate-300 text-slate-200 flex items-center justify-center">
                    <Medal className="w-4 h-4 fill-slate-300 text-slate-200" />
                  </div>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <div className="w-7 h-7 rounded-lg bg-amber-700/20 border border-amber-600 text-amber-500 flex items-center justify-center">
                    <Medal className="w-4 h-4 fill-amber-700 text-amber-500" />
                  </div>
                );
              }

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    rank === 1
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {rankBadge}
                    <div>
                      <div className="font-arcade text-sm font-bold text-white tracking-wide">
                        {entry.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" /> {entry.maxCombo}x combo
                        </span>
                        <span>•</span>
                        <span>{entry.slicedCount} sliced</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-arcade text-lg font-black text-amber-400 tabular-nums">
                      {entry.score}
                    </div>
                    <div className="text-[10px] text-neutral-500 flex items-center gap-1 justify-end">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>{entry.date}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
