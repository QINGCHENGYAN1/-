import React from 'react';
import { EqualizerBand, Language } from '../types';
import { t } from '../services/i18n';

interface EQPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bands: EqualizerBand[];
  setBands: (bands: EqualizerBand[]) => void;
  lang: Language;
}

const PRESETS = {
  'Flat': [0, 0, 0, 0, 0, 0],
  'Rock': [4, 3, 1, -1, 3, 4],
  'Pop': [-1, 2, 4, 3, 1, -1],
  'Classic': [4, 3, 1, 2, 3, 3],
  'Bass Boost': [6, 5, 2, 0, 0, 0],
};

export const EQPanel: React.FC<EQPanelProps> = ({ isOpen, onClose, bands, setBands, lang }) => {
  if (!isOpen) return null;

  const handleSliderChange = (index: number, val: string) => {
    const newBands = [...bands];
    newBands[index].gain = parseFloat(val);
    setBands(newBands);
  };

  const applyPreset = (name: keyof typeof PRESETS) => {
    const values = PRESETS[name];
    const newBands = bands.map((b, i) => ({ ...b, gain: values[i] }));
    setBands(newBands);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-800 w-[500px] rounded-xl shadow-2xl border border-zinc-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">{t('settings.eq', lang)}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        {/* Presets */}
        <div className="flex space-x-2 mb-8 overflow-x-auto pb-2">
            {Object.keys(PRESETS).map(preset => (
                <button 
                    key={preset}
                    onClick={() => applyPreset(preset as any)}
                    className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white transition"
                >
                    {preset}
                </button>
            ))}
        </div>

        {/* Sliders */}
        <div className="flex justify-between items-end h-40 space-x-4">
          {bands.map((band, idx) => (
            <div key={idx} className="flex flex-col items-center h-full group">
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={band.gain}
                onChange={(e) => handleSliderChange(idx, e.target.value)}
                className="h-full w-2 bg-zinc-700 appearance-none rounded-full cursor-pointer slider-vertical outline-none
                 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                 [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-800"
                style={{ WebkitAppearance: 'slider-vertical' } as any}
              />
              <span className="text-xs text-zinc-400 mt-3 font-mono">{band.frequency}</span>
              <span className="text-xs text-red-400 mt-1 opacity-0 group-hover:opacity-100 absolute -bottom-6">{band.gain > 0 ? '+' : ''}{band.gain}dB</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
