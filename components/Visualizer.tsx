
import React, { useRef, useEffect } from 'react';
import { VisualizerMode } from '../types';

interface VisualizerProps {
  mode: VisualizerMode;
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  color1: string;
  color2: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ mode, analyser, isPlaying, color1, color2 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (mode === VisualizerMode.OFF || !canvasRef.current || !analyser) {
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        const ctx = canvasRef.current?.getContext('2d');
        if(ctx && canvasRef.current) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const renderFrame = () => {
      animationFrameRef.current = requestAnimationFrame(renderFrame);
      
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const centerX = WIDTH / 2;
      const centerY = HEIGHT / 2;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Get Data
      let hasSignal = false;
      if (isPlaying) {
          analyser.getByteFrequencyData(dataArray);
          if(dataArray.some(v => v > 0)) hasSignal = true;
      }
      
      if (!hasSignal && isPlaying) {
          for(let i=0; i<bufferLength; i++) {
              const time = Date.now() / 1000;
              const v = Math.abs(Math.sin(time * 2 + i * 0.1)) * 100 + Math.random() * 50;
              dataArray[i] = v;
          }
      } else if (!isPlaying) {
          dataArray.fill(0);
      }

      // Dynamic Gradient based on props
      const gradient = ctx.createLinearGradient(0, HEIGHT, 0, 0);
      gradient.addColorStop(0, color1); 
      gradient.addColorStop(1, color2); 

      ctx.fillStyle = gradient;
      ctx.strokeStyle = gradient;

      switch (mode) {
        case VisualizerMode.BARS: 
          const barWidth = (WIDTH / bufferLength) * 2.5;
          let barX = 0;
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * HEIGHT;
            ctx.fillRect(barX, HEIGHT - barHeight, barWidth, barHeight);
            barX += barWidth + 1;
          }
          break;

        case VisualizerMode.WAVEFORM:
            ctx.beginPath();
            ctx.lineWidth = 2;
            const sliceWidth = WIDTH / bufferLength;
            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0; 
                const y = v * HEIGHT / 4 + HEIGHT / 2; 
                if(i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
                x += sliceWidth;
            }
            ctx.stroke();
            break;

        case VisualizerMode.SYMMETRICAL: 
            const symBarWidth = (WIDTH / bufferLength) * 2;
            for (let i = 0; i < bufferLength; i++) {
                const h = (dataArray[i] / 255) * (HEIGHT / 2);
                const xPos = centerX + (i * (symBarWidth + 1));
                const xNeg = centerX - (i * (symBarWidth + 1));
                ctx.fillRect(xPos, centerY - h, symBarWidth, h * 2);
                ctx.fillRect(xNeg, centerY - h, symBarWidth, h * 2);
            }
            break;

        case VisualizerMode.CIRCLE_BARS: 
            const radius = Math.min(WIDTH, HEIGHT) / 4;
            ctx.translate(centerX, centerY);
            for (let i = 0; i < bufferLength; i++) {
                ctx.rotate((2 * Math.PI) / bufferLength);
                const h = (dataArray[i] / 255) * (HEIGHT / 3);
                // Use props colors for HSL simulation? Hard to map exactly, stick to gradient fill if possible
                // or just use color1
                ctx.fillStyle = i % 2 === 0 ? color1 : color2; 
                ctx.fillRect(0, radius, (2 * Math.PI * radius) / bufferLength, h);
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0); 
            break;

        case VisualizerMode.PARTICLES: 
            for (let i = 0; i < bufferLength; i += 5) {
                const v = dataArray[i];
                if (v > 10) {
                    ctx.beginPath();
                    const r = (v / 255) * 20;
                    const randX = Math.random() * WIDTH;
                    const y = HEIGHT - (v / 255) * HEIGHT;
                    ctx.fillStyle = color1 + '88'; // Add transparency
                    ctx.arc(randX, y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            break;
            
        case VisualizerMode.OSCILLOSCOPE: 
            ctx.fillStyle = color2;
            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 255;
                const y = centerY + (Math.sin(i * 0.2 + Date.now() * 0.005) * v * HEIGHT/2);
                ctx.fillRect(i * (WIDTH/bufferLength), y, 3, 3);
            }
            break;

        case VisualizerMode.HEATMAP:
            const cols = 20;
            const rows = 10;
            const cellW = WIDTH / cols;
            const cellH = HEIGHT / rows;
            for(let i=0; i<cols; i++) {
                const val = dataArray[i * 2] || 0; 
                const activeRows = Math.floor((val / 255) * rows);
                for(let j=0; j<activeRows; j++) {
                     ctx.fillStyle = j % 2 === 0 ? color1 : color2;
                     ctx.fillRect(i*cellW + 1, HEIGHT - (j*cellH) - cellH, cellW - 2, cellH - 2);
                }
            }
            break;
        
        case VisualizerMode.CIRCULAR_WAVE: 
            ctx.translate(centerX, centerY);
            ctx.beginPath();
            ctx.strokeStyle = color1;
            ctx.lineWidth = 3;
            for (let i = 0; i < bufferLength; i++) {
                const angle = (i / bufferLength) * Math.PI * 2;
                const r = (Math.min(WIDTH, HEIGHT) / 4) + (dataArray[i] / 255) * 100;
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
            ctx.moveTo(0, HEIGHT);
            for (let i = 0; i < bufferLength; i++) {
                const x = (i / bufferLength) * WIDTH;
                const y = HEIGHT - (dataArray[i] / 255) * (HEIGHT * 0.8);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(WIDTH, HEIGHT);
            ctx.fillStyle = color1 + '80';
            ctx.fill();
            break;

        case VisualizerMode.GALAXY:
            const bass = dataArray[0]; 
            const radiusPulse = (bass / 255) * 50;
            ctx.translate(centerX, centerY);
            ctx.beginPath();
            ctx.arc(0, 0, 50 + radiusPulse, 0, Math.PI * 2);
            ctx.fillStyle = color1 + 'AA';
            ctx.fill();

            ctx.rotate(Date.now() * 0.001);
            for(let i=0; i<8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                const dist = 100 + (dataArray[i*4] / 255) * 50;
                ctx.arc(dist, 0, 5, 0, Math.PI * 2);
                ctx.fillStyle = color2;
                ctx.fill();
            }
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            break;
        
        case VisualizerMode.DNA:
            ctx.lineWidth = 2;
            const t = Date.now() * 0.002;
            for(let i = 0; i < 50; i++) {
                const y = (i / 50) * HEIGHT;
                const freqVal = dataArray[i % bufferLength] / 255; // 0 to 1
                const offset = Math.sin(y * 0.05 + t) * (WIDTH / 4) * (0.5 + freqVal);
                
                // Strand 1
                ctx.beginPath();
                ctx.arc(centerX + offset, y, 4 + freqVal * 10, 0, Math.PI*2);
                ctx.fillStyle = color1;
                ctx.fill();

                // Strand 2
                ctx.beginPath();
                ctx.arc(centerX - offset, y, 4 + freqVal * 10, 0, Math.PI*2);
                ctx.fillStyle = color2;
                ctx.fill();

                // Connector
                if (i % 5 === 0) {
                    ctx.beginPath();
                    ctx.moveTo(centerX + offset, y);
                    ctx.lineTo(centerX - offset, y);
                    ctx.strokeStyle = '#ffffff44';
                    ctx.stroke();
                }
            }
            break;
        
        case VisualizerMode.MATRIX:
            ctx.font = '16px monospace';
            const colsM = Math.floor(WIDTH / 20);
            for (let i = 0; i < colsM; i++) {
                const val = dataArray[i % bufferLength];
                // Randomly drop characters based on frequency volume
                if (Math.random() > 0.95) {
                   // Draw a trail
                   const len = Math.floor((val / 255) * 20);
                   for(let j=0; j<len; j++) {
                       ctx.fillStyle = j === 0 ? '#fff' : color1;
                       ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), i * 20, (Date.now()/5 + i*100 + j*20) % HEIGHT);
                   }
                }
            }
            break;

        case VisualizerMode.HEXAGON:
            const size = 30;
            const hW = size * Math.sqrt(3);
            const hH = size * 2;
            // Draw grid
            for(let y = 0; y < HEIGHT + size; y += size * 1.5) {
                for(let x = 0; x < WIDTH + size; x += hW) {
                    const row = Math.floor(y / (size * 1.5));
                    const xOffset = (row % 2) * (hW / 2);
                    
                    // Get data based on x/y
                    const dataIndex = (Math.floor(x) + Math.floor(y)) % bufferLength;
                    const scale = dataArray[dataIndex] / 255;

                    if (scale > 0.1) {
                        ctx.beginPath();
                        const cx = x + xOffset;
                        const cy = y;
                        for (let i = 0; i < 6; i++) {
                            ctx.lineTo(cx + (size * scale) * Math.cos(i * Math.PI / 3), cy + (size * scale) * Math.sin(i * Math.PI / 3));
                        }
                        ctx.closePath();
                        ctx.strokeStyle = color2;
                        ctx.stroke();
                        ctx.fillStyle = color1 + '44';
                        ctx.fill();
                    }
                }
            }
            break;
      }
    };

    renderFrame();

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        if(animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [mode, isPlaying, analyser, color1, color2]);

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full opacity-60" />
    </div>
  );
};
