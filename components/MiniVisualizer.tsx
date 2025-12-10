
import React, { useRef, useEffect } from 'react';
import { VisualizerMode } from '../types';

interface MiniVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  mode: VisualizerMode;
  color1: string;
  color2: string;
}

export const MiniVisualizer: React.FC<MiniVisualizerProps> = ({ analyser, isPlaying, mode, color1, color2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      
      const w = canvas.width;
      const h = canvas.height;
      const centerX = w / 2;
      const centerY = h / 2;

      ctx.clearRect(0, 0, w, h);

      if (!isPlaying && mode === VisualizerMode.OFF) return;

      const bufferLength = analyser ? analyser.frequencyBinCount : 32;
      const dataArray = new Uint8Array(bufferLength);

      let hasData = false;
      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);
        if (dataArray.some(v => v > 0)) hasData = true;
      }

      if (!hasData) {
         for(let i=0; i<bufferLength; i++) {
             dataArray[i] = (Math.sin(i * 0.5 + Date.now()/500) * 50 + 50); 
         }
      }

      const gradient = ctx.createLinearGradient(0, h, 0, 0);
      gradient.addColorStop(0, color1); 
      gradient.addColorStop(1, color2); 

      ctx.fillStyle = gradient;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;

      switch (mode) {
          case VisualizerMode.BARS:
             {
                const barWidth = (w / bufferLength) * 2.5;
                let barX = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * h;
                    ctx.fillRect(barX, h - barHeight, barWidth, barHeight);
                    barX += barWidth + 1;
                }
             }
             break;

          case VisualizerMode.WAVEFORM:
             ctx.beginPath();
             ctx.strokeStyle = color1;
             const sliceWidth = w / bufferLength;
             let x = 0;
             for(let i = 0; i < bufferLength; i++) {
                 const v = dataArray[i] / 128.0; 
                 const y = v * h / 4 + h / 2; 
                 if(i === 0) ctx.moveTo(x, y);
                 else ctx.lineTo(x, y);
                 x += sliceWidth;
             }
             ctx.stroke();
             break;

          case VisualizerMode.SYMMETRICAL: 
            const symBarWidth = (w / bufferLength) * 2;
            for (let i = 0; i < bufferLength; i++) {
                const height = (dataArray[i] / 255) * (h / 2);
                const xPos = centerX + (i * (symBarWidth + 0.5));
                const xNeg = centerX - (i * (symBarWidth + 0.5));
                ctx.fillRect(xPos, centerY - height, symBarWidth, height * 2);
                ctx.fillRect(xNeg, centerY - height, symBarWidth, height * 2);
            }
            break;

          case VisualizerMode.CIRCLE_BARS: 
            const radius = Math.min(w, h) / 4;
            ctx.translate(centerX, centerY);
            for (let i = 0; i < bufferLength; i++) {
                ctx.rotate((2 * Math.PI) / bufferLength);
                const height = (dataArray[i] / 255) * (h / 3);
                ctx.fillStyle = i % 2 === 0 ? color1 : color2;
                ctx.fillRect(0, radius, (2 * Math.PI * radius) / bufferLength, height);
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0); 
            break;

          case VisualizerMode.PARTICLES: 
             for (let i = 0; i < bufferLength; i += 3) {
                 const v = dataArray[i];
                 if (v > 10) {
                     ctx.beginPath();
                     const r = (v / 255) * 3; 
                     const randX = (i / bufferLength) * w + (Math.random() * 5 - 2.5); 
                     const y = h - (v / 255) * h;
                     ctx.fillStyle = color1 + 'aa';
                     ctx.arc(randX, y, r, 0, Math.PI * 2);
                     ctx.fill();
                 }
             }
             break;

          case VisualizerMode.OSCILLOSCOPE: 
             ctx.fillStyle = color2;
             for (let i = 0; i < bufferLength; i++) {
                 const v = dataArray[i] / 255;
                 const y = centerY + (Math.sin(i * 0.2 + Date.now() * 0.005) * v * h/2);
                 ctx.fillRect(i * (w/bufferLength), y, 2, 2);
             }
             break;

          case VisualizerMode.HEATMAP:
            const cols = 10;
            const rows = 5;
            const cellW = w / cols;
            const cellH = h / rows;
            for(let i=0; i<cols; i++) {
                const val = dataArray[i * 2] || 0; 
                const activeRows = Math.floor((val / 255) * rows);
                for(let j=0; j<activeRows; j++) {
                     ctx.fillStyle = j % 2 === 0 ? color1 : color2;
                     ctx.fillRect(i*cellW, h - (j*cellH) - cellH, cellW - 1, cellH - 1);
                }
            }
            break;

          case VisualizerMode.CIRCULAR_WAVE: 
            ctx.translate(centerX, centerY);
            ctx.beginPath();
            ctx.strokeStyle = color1;
            ctx.lineWidth = 2;
            for (let i = 0; i < bufferLength; i++) {
                const angle = (i / bufferLength) * Math.PI * 2;
                const r = (Math.min(w, h) / 4) + (dataArray[i] / 255) * (w/4);
                const waveX = Math.cos(angle) * r;
                const waveY = Math.sin(angle) * r;
                if(i===0) ctx.moveTo(waveX,waveY);
                else ctx.lineTo(waveX,waveY);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            break;

          case VisualizerMode.FILLED_MOUNTAIN: 
            ctx.beginPath();
            ctx.moveTo(0, h);
            for (let i = 0; i < bufferLength; i++) {
                const x = (i / bufferLength) * w;
                const y = h - (dataArray[i] / 255) * (h * 0.8);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.fillStyle = color1 + '88';
            ctx.fill();
            break;

          case VisualizerMode.GALAXY:
            const bass = dataArray[0]; 
            const radiusPulse = (bass / 255) * 10;
            
            ctx.translate(centerX, centerY);
            ctx.beginPath();
            ctx.arc(0, 0, 10 + radiusPulse, 0, Math.PI * 2);
            ctx.fillStyle = color1 + 'AA';
            ctx.fill();

            ctx.rotate(Date.now() * 0.001);
            for(let i=0; i<4; i++) { 
                ctx.rotate(Math.PI / 2);
                ctx.beginPath();
                const dist = 20 + (dataArray[i*4] / 255) * 15;
                ctx.arc(dist, 0, 2, 0, Math.PI * 2);
                ctx.fillStyle = color2;
                ctx.fill();
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            break;
        
        case VisualizerMode.DNA:
            ctx.lineWidth = 1;
            const t = Date.now() * 0.002;
            for(let i = 0; i < 20; i++) { // Fewer segments for mini
                const y = (i / 20) * h;
                const freqVal = dataArray[i % bufferLength] / 255; 
                const offset = Math.sin(y * 0.1 + t) * (w / 4);
                
                ctx.beginPath();
                ctx.arc(centerX + offset, y, 2, 0, Math.PI*2);
                ctx.fillStyle = color1;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(centerX - offset, y, 2, 0, Math.PI*2);
                ctx.fillStyle = color2;
                ctx.fill();
            }
            break;

        case VisualizerMode.MATRIX:
             ctx.fillStyle = color1;
             for(let i=0; i<5; i++) {
                 const barH = (dataArray[i*5] / 255) * h;
                 ctx.fillRect(i * (w/5) + 5, 0, 2, barH);
             }
             break;
        
        case VisualizerMode.HEXAGON:
            // Simplified grid for mini
            const size = 15;
            for(let x=0; x<w; x+=size) {
                for(let y=0; y<h; y+=size) {
                    if((x+y)%2 === 0 && dataArray[(x+y)%bufferLength] > 100) {
                        ctx.fillStyle = color2;
                        ctx.fillRect(x,y,size-2,size-2);
                    }
                }
            }
            break;
            
          default:
            const defBarW = w / 8;
            for (let i = 0; i < 8; i++) {
                const val = dataArray[i * 4] || 0;
                const barH = (val / 255) * h;
                ctx.fillStyle = color1;
                ctx.fillRect(i * defBarW, h - barH, defBarW - 1, barH);
            }
            break;
      }
    };

    render();

    return () => {
      if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [analyser, isPlaying, mode, color1, color2]);

  return (
    <canvas ref={canvasRef} width={80} height={80} className="w-full h-full bg-black/80" />
  );
};
