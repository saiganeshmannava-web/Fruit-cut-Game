import React, { useEffect, useState, useRef } from 'react';
import { soundEngine, TRACK_LIST, TrackInfo } from '../utils/audio';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Music, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown,
  Radio
} from 'lucide-react';

export const MusicPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(soundEngine.getIsMusicPlaying());
  const [currentTrack, setCurrentTrack] = useState<TrackInfo>(soundEngine.getCurrentTrack());
  const [volume, setVolume] = useState(soundEngine.getMusicVolume());
  const [isExpanded, setIsExpanded] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([20, 45, 75, 30, 60, 90, 40, 25]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = soundEngine.subscribe(() => {
      setIsPlaying(soundEngine.getIsMusicPlaying());
      setCurrentTrack(soundEngine.getCurrentTrack());
      setVolume(soundEngine.getMusicVolume());
    });
    return unsubscribe;
  }, []);

  // Visualizer loop reading from Audio Analyser
  useEffect(() => {
    let active = true;

    const updateBars = () => {
      if (!active) return;
      if (soundEngine.getIsMusicPlaying()) {
        const freqData = soundEngine.getVisualizerData();
        if (freqData && freqData.length > 0) {
          // Sample 8 frequency bins
          const step = Math.floor(freqData.length / 8);
          const heights: number[] = [];
          for (let i = 0; i < 8; i++) {
            const val = freqData[i * step] || 0;
            // Normalize to percentage (10% to 100%)
            heights.push(Math.max(12, Math.min(100, (val / 255) * 100)));
          }
          setVisualizerBars(heights);
        }
      } else {
        // Idle ambient bars
        setVisualizerBars([10, 15, 12, 18, 14, 10, 16, 12]);
      }
      animRef.current = requestAnimationFrame(updateBars);
    };

    animRef.current = requestAnimationFrame(updateBars);

    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleTogglePlay = () => {
    soundEngine.playButtonClick();
    soundEngine.toggleMusic();
  };

  const handleNext = () => {
    soundEngine.playButtonClick();
    soundEngine.nextTrack();
  };

  const handlePrev = () => {
    soundEngine.playButtonClick();
    soundEngine.prevTrack();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundEngine.setMusicVolume(val);
  };

  const handleToggleMute = () => {
    soundEngine.playButtonClick();
    if (volume > 0) {
      soundEngine.setMusicVolume(0);
    } else {
      soundEngine.setMusicVolume(0.5);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 md:bottom-5 md:right-5 z-30 select-none">
      <div className="bg-neutral-900/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.2)] overflow-hidden transition-all duration-300 w-72 md:w-80">
        {/* Main Header / Mini Bar */}
        <div className="p-2.5 md:p-3 flex items-center justify-between gap-2.5">
          {/* Animated Equalizer Visualizer */}
          <div className="flex items-end gap-1 h-6 w-12 px-1 bg-neutral-950/70 rounded-md border border-cyan-500/20">
            {visualizerBars.map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-t-full transition-all duration-75"
                style={{
                  height: `${h}%`,
                  backgroundColor: isPlaying ? (i % 2 === 0 ? '#06b6d4' : '#ec4899') : '#52525b',
                  boxShadow: isPlaying ? '0 0 4px rgba(6,182,212,0.6)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
              <p className="text-xs font-bold text-white truncate tracking-wide font-arcade">
                {currentTrack.title}
              </p>
            </div>
            <p className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
              <span>{currentTrack.genre}</span>
              <span className="text-cyan-400/80">•</span>
              <span>{currentTrack.bpm} BPM</span>
            </p>
          </div>

          {/* Quick Play/Pause & Expand Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleTogglePlay}
              className={`p-2 rounded-xl border transition-all active:scale-95 ${
                isPlaying
                  ? 'bg-cyan-500 border-cyan-400 text-neutral-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:text-cyan-400'
              }`}
              title={isPlaying ? 'Pause Music' : 'Play Music'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 transition-all"
              title={isExpanded ? 'Collapse Music Deck' : 'Expand Music Deck'}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded Deck Drawer */}
        {isExpanded && (
          <div className="p-3 pt-0 border-t border-neutral-800/80 flex flex-col gap-3">
            {/* Track Selector Pills */}
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                AI Cyber Synthwave Tracks
              </span>
              <div className="flex flex-col gap-1">
                {TRACK_LIST.map((t, idx) => {
                  const isActive = t.id === currentTrack.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        soundEngine.playButtonClick();
                        soundEngine.setTrack(idx);
                        if (!isPlaying) soundEngine.playMusic();
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-all flex items-center justify-between ${
                        isActive
                          ? 'bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                          : 'bg-neutral-950/50 hover:bg-neutral-800/60 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <span className="truncate font-medium">{t.title}</span>
                      <span className="text-[9px] opacity-70 ml-2 font-mono">{t.bpm} BPM</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all active:scale-95"
                  title="Previous Track"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleTogglePlay}
                  className="p-1.5 px-2.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 transition-all active:scale-95 flex items-center gap-1 text-xs font-semibold"
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all active:scale-95"
                  title="Next Track"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 flex-1 max-w-[110px]">
                <button
                  onClick={handleToggleMute}
                  className="text-neutral-400 hover:text-neutral-200 transition-colors"
                  title={volume === 0 ? 'Unmute' : 'Mute'}
                >
                  {volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
