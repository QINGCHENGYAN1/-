
import React from 'react';
import { Song, VisualizerMode } from '../types';
import { Visualizer } from './Visualizer';
import { LyricsOverlay } from './LyricsOverlay';
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackwardIcon } from './Icons';
import { t } from '../services/i18n';

interface FullScreenPlayerProps {
    isOpen: boolean;
    onClose: () => void;
    currentSong: Song | null;
    isPlaying: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    progress: number;
    duration: number;
    onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
    analyser: AnalyserNode | null;
    visualizerMode: VisualizerMode;
    lang: 'en' | 'zh';
    vizColor1: string; // New
    vizColor2: string; // New
}

const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
    isOpen,
    onClose,
    currentSong,
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    progress,
    duration,
    onSeek,
    analyser,
    visualizerMode,
    lang,
    vizColor1,
    vizColor2
}) => {
    if (!isOpen || !currentSong) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-zinc-900 flex flex-col items-center justify-center animate-fade-in overflow-hidden">
            {/* 1. Background Visualizer */}
            <div className="absolute inset-0 opacity-40">
                <Visualizer mode={visualizerMode} analyser={analyser} isPlaying={isPlaying} color1={vizColor1} color2={vizColor2} />
            </div>

            {/* 2. Blurred Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 blur-3xl scale-110 pointer-events-none z-0"
                style={{ backgroundImage: currentSong.coverUrl ? `url(${currentSong.coverUrl})` : undefined }}
            />

            {/* 3. Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                </button>
                <h2 className="text-white/50 text-sm font-medium tracking-widest">NOW PLAYING</h2>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* 4. Main Content: Cover & Lyrics */}
            <div className="flex-1 w-full max-w-6xl flex items-center justify-center gap-16 z-10 px-10">
                
                {/* Left: Album Art */}
                <div className="hidden lg:block w-[400px] h-[400px] rounded-xl shadow-2xl overflow-hidden relative border border-white/10 group">
                     {currentSong.coverUrl ? (
                         <img src={currentSong.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                     ) : (
                         <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500 text-4xl">♫</div>
                     )}
                     {/* Glass Reflection Effect */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-50 pointer-events-none" />
                </div>

                {/* Right: Lyrics Overlay (Reused/Styled) */}
                <div className="flex-1 h-[60vh] flex items-center justify-center relative">
                     {/* We force the LyricsOverlay to be relative here for layout */}
                     <div className="scale-125 transform origin-center">
                        <LyricsOverlay lyricsRaw={currentSong.lyrics} currentTime={progress} />
                     </div>
                </div>
            </div>

            {/* 5. Bottom Controls */}
            <div className="w-full max-w-3xl p-10 z-20 flex flex-col items-center space-y-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2 text-shadow-lg">{currentSong.title}</h1>
                    <p className="text-zinc-300 text-lg">{currentSong.artist} - {currentSong.album}</p>
                </div>

                {/* Progress */}
                <div className="w-full flex items-center space-x-4 text-xs text-zinc-400 font-mono">
                    <span className="w-10 text-right">{formatTime(progress)}</span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={progress}
                        onChange={onSeek}
                        className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                    <span className="w-10 text-left">{formatTime(duration)}</span>
                </div>

                {/* Buttons */}
                <div className="flex items-center space-x-10">
                    <button onClick={onPrev} className="text-zinc-300 hover:text-white hover:scale-110 transition">
                        <SkipBackwardIcon className="w-10 h-10" />
                    </button>
                    <button 
                        onClick={onPlayPause} 
                        className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition shadow-2xl hover:shadow-white/20"
                    >
                        {isPlaying ? <PauseIcon className="w-10 h-10" /> : <PlayIcon className="w-10 h-10 ml-1" />}
                    </button>
                    <button onClick={onNext} className="text-zinc-300 hover:text-white hover:scale-110 transition">
                        <SkipForwardIcon className="w-10 h-10" />
                    </button>
                </div>
            </div>
        </div>
    );
};
