import React, { useState, useEffect, useRef } from 'react';

interface LyricsOverlayProps {
  lyricsRaw?: string;
  currentTime: number;
}

interface LyricLine {
  time: number;
  text: string;
}

const parseLRC = (lrc: string): LyricLine[] => {
  const lines = lrc.split('\n');
  const result: LyricLine[] = [];
  const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;

  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseFloat(match[2]);
      const text = match[3].trim();
      if (text) {
        result.push({ time: min * 60 + sec, text });
      }
    }
  });
  return result;
};

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({ lyricsRaw, currentTime }) => {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lyricsRaw) {
      setLyrics(parseLRC(lyricsRaw));
    } else {
      setLyrics([]);
    }
  }, [lyricsRaw]);

  useEffect(() => {
    if (lyrics.length === 0) return;
    // Find active line
    const idx = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
    setCurrentIndex(idx);
    
    // Auto scroll
    if (idx !== -1 && containerRef.current) {
        const activeEl = containerRef.current.children[idx] as HTMLElement;
        if (activeEl) {
             activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentTime, lyrics]);

  if (!lyricsRaw) return null;

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[120px] pointer-events-none z-40 overflow-hidden mask-gradient">
      <div 
        ref={containerRef}
        className="text-center transition-all duration-300 space-y-2 py-10"
      >
        {lyrics.length > 0 ? (
            lyrics.map((line, i) => (
            <p 
                key={i} 
                className={`transition-all duration-300 font-bold ${i === currentIndex ? 'text-2xl text-red-500 scale-105' : 'text-lg text-white/40 scale-100'}`}
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
            >
                {line.text}
            </p>
            ))
        ) : (
            <p className="text-zinc-500">No lyrics available</p>
        )}
      </div>
      <style>{`
        .mask-gradient {
            -webkit-mask-image: linear-gradient(transparent, black 20%, black 80%, transparent);
            mask-image: linear-gradient(transparent, black 20%, black 80%, transparent);
        }
      `}</style>
    </div>
  );
};