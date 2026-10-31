import React, { useEffect, useRef } from 'react';
import { BladeStyle } from '../types/game';
import { BLADE_STYLES } from '../utils/blades';
import { Sword, X, Check } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface BladeSelectorModalProps {
  isOpen: boolean;
  activeBlade: BladeStyle;
  onSelectBlade: (blade: BladeStyle) => void;
  onClose: () => void;
}

export const BladeSelectorModal: React.FC<BladeSelectorModalProps> = ({
  isOpen,
  activeBlade,
  onSelectBlade,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated blade trail preview in modal
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderPreview = () => {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      angle += 0.05;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const rx = canvas.width * 0.38;
      const ry = canvas.height * 0.28;

      const x = cx + Math.cos(angle) * rx;
      const y = cy + Math.sin(angle * 2) * ry;

      // Draw blade trail tip
      ctx.save();
      ctx.shadowColor = activeBlade.glowColor;
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = activeBlade.coreColor;
      ctx.fill();

      // Mini sparks
      ctx.fillStyle = activeBlade.particleColor;
      for (let i = 0; i < 3; i++) {
        const sx = x + (Math.random() - 0.5) * 20;
        const sy = y + (Math.random() - 0.5) * 20;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animId = requestAnimationFrame(renderPreview);
    };

    animId = requestAnimationFrame(renderPreview);
    return () => cancelAnimationFrame(animId);
  }, [isOpen, activeBlade]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col gap-5 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-arcade text-xl md:text-2xl font-black text-white tracking-wider neon-glow-cyan">
                BLADE ARMORY
              </h2>
              <p className="text-xs text-neutral-400">Select your neon energy blade</p>
            </div>
          </div>

          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Blade Trail Preview Canvas */}
        <div className="w-full h-24 bg-neutral-950 rounded-xl border border-neutral-800 relative overflow-hidden flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={480}
            height={96}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-3 text-[10px] uppercase font-bold tracking-wider text-neutral-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeBlade.glowColor }} />
            <span>Active Particle Trail: {activeBlade.name}</span>
          </div>
        </div>

        {/* Blade List */}
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1">
          {BLADE_STYLES.map((blade) => {
            const isEquipped = activeBlade.id === blade.id;
            return (
              <button
                key={blade.id}
                onClick={() => {
                  soundEngine.playButtonClick();
                  soundEngine.playSwish(1.4);
                  onSelectBlade(blade);
                }}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group ${
                  isEquipped
                    ? 'bg-neutral-800/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center border shadow-inner"
                    style={{
                      borderColor: blade.glowColor,
                      backgroundColor: `${blade.glowColor}15`,
                    }}
                  >
                    <Sword className="w-5 h-5" style={{ color: blade.glowColor }} />
                  </div>

                  <div>
                    <div className="font-arcade text-sm font-bold text-white flex items-center gap-2">
                      <span>{blade.name}</span>
                      {isEquipped && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                      {blade.description}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isEquipped ? (
                    <div className="w-6 h-6 rounded-full bg-cyan-400 text-neutral-950 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-neutral-500 group-hover:text-neutral-300">
                      Equip
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-arcade font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
