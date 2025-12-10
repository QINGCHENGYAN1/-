
import React from 'react';
import { Song, VisualizerMode } from '../types';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackwardIcon, WaveIcon } from './Icons';
import { t } from '../services/i18n';
import { MiniVisualizer } from './MiniVisualizer';

interface PlayerBarProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  progress: number;
  duration: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  volume: number;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  lang: 'en' | 'zh';
  onOpenEQ: () => void;
  visualizerMode: VisualizerMode;
  onCycleVisualizer: () => void; 
  onOpenFullScreen: () => void; 
  analyser: AnalyserNode | null;
  showLyrics: boolean;
  onToggleLyrics: () => void;
  vizColor1: string; // New
  vizColor2: string; // New
}

const formatTime = (seconds: number) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentSong,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  progress,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  lang,
  onOpenEQ,
  visualizerMode,
  onCycleVisualizer,
  onOpenFullScreen,
  analyser,
  showLyrics,
  onToggleLyrics,
  vizColor1,
  vizColor2
}) => {
  
  return (
    <div className="h-24 bg-zinc-900 border-t border-zinc-700 flex items-center justify-between px-4 z-50 relative bg-opacity-95 backdrop-blur-sm">
      
      {/* Track Info & Enlarged Cover */}
      <div className="w-1/4 flex items-center relative">
        {/* Enlarged Cover Container (Thumbnail) */}
        <div 
            className="w-20 h-20 -mt-8 bg-zinc-800 rounded-lg shadow-2xl overflow-hidden relative group cursor-pointer border border-zinc-700 z-50 flex-shrink-0"
            onClick={onCycleVisualizer}
            title={visualizerMode === VisualizerMode.OFF ? "Click to enable Visualizer" : `Current Effect: ${t('viz.' + visualizerMode, lang)}`}
        >
          {visualizerMode === VisualizerMode.OFF ? (
              currentSong?.coverUrl ? (
                <img src={currentSong.coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs bg-zinc-800">
                  Music
                </div>
              )
          ) : (
              <MiniVisualizer analyser={analyser} isPlaying={isPlaying} mode={visualizerMode} color1={vizColor1} color2={vizColor2} />
          )}

          {/* Hover Overlay for Thumbnail */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <span className="text-[10px] text-white font-bold uppercase tracking-wider text-center px-1">
                  {visualizerMode === VisualizerMode.OFF ? 'Show Viz' : 'Next Effect'}
              </span>
          </div>
        </div>

        {/* Text Info - Click to Open Full Screen */}
        <div 
            className="flex flex-col truncate ml-4 cursor-pointer group/text"
            onClick={onOpenFullScreen}
            title="Open Full Screen Player"
        >
          <span className="text-base font-bold text-white truncate max-w-[200px] group-hover/text:text-red-500 transition-colors">
            {currentSong?.title || 'Muze Player'}
          </span>
          <span className="text-xs text-zinc-400 truncate max-w-[200px] group-hover/text:text-zinc-300">
            {currentSong?.artist || t('player.unknownArtist', lang)}
          </span>
          <span className="text-[10px] text-zinc-600 mt-1 opacity-0 group-hover/text:opacity-100 transition-opacity">
              Click for Full Screen
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-2/4">
        <div className="flex items-center space-x-6 mb-2">
          <button onClick={onPrev} className="text-zinc-400 hover:text-white transition transform active:scale-95">
            <SkipBackwardIcon className="w-6 h-6" />
          </button>
          <button 
            onClick={onPlayPause} 
            className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition shadow-lg transform active:scale-95 active:shadow-none"
          >
            {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7 ml-0.5" />}
          </button>
          <button onClick={onNext} className="text-zinc-400 hover:text-white transition transform active:scale-95">
            <SkipForwardIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full max-w-xl flex items-center space-x-3 text-xs text-zinc-500 font-mono">
          <span className="w-10 text-right">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={onSeek}
            className="flex-1 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
          />
          <span className="w-10 text-left">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="w-1/4 flex items-center justify-end space-x-4">
        {/* Lyrics Toggle (Standard View) */}
        <button 
          onClick={onToggleLyrics}
          title={t('player.lyrics', lang)}
          className={`font-bold text-xs border border-current px-1.5 py-0.5 rounded transition ${showLyrics ? 'text-red-500 border-red-500 bg-red-500/10' : 'text-zinc-500 border-zinc-600 hover:text-zinc-300'}`}
        >
          词
        </button>

        <button 
          onClick={onOpenEQ}
          className="text-xs border border-zinc-600 px-2 py-0.5 rounded text-zinc-400 hover:border-zinc-400 hover:text-zinc-200 transition"
        >
          EQ
        </button>

        <div className="flex items-center space-x-2 w-28 group">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-zinc-400 group-hover:text-white transition">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={onVolumeChange}
            className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full group-hover:[&::-webkit-slider-thumb]:bg-red-500"
          />
        </div>
      </div>
    </div>
  );
};
