import { useState } from 'react';
import { useAppState } from '../state/UIState';

/**
 * ColorPalette - Smart color palettes and auto-coloring for layers
 */
export function ColorPalette() {
  const { state, dispatch } = useAppState();
  const [selectedPalette, setSelectedPalette] = useState('pastel');

  // Predefined palettes
  const palettes: Record<string, { name: string; colors: string[] }> = {
    pastel: {
      name: 'Pastel',
      colors: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#E8BAFF', '#FFD4BA', '#C9BAFF'],
    },
    bright: {
      name: 'Bright',
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800'],
    },
    earth: {
      name: 'Earth Tones',
      colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460', '#D2691E', '#BC8F8F'],
    },
    neon: {
      name: 'Neon',
      colors: ['#FF00FF', '#00FF00', '#00FFFF', '#FFFF00', '#FF0080', '#80FF00', '#00FF80'],
    },
    metallic: {
      name: 'Metallic',
      colors: ['#C0C0C0', '#B87333', '#FFD700', '#E5E4E2', '#CD7F32', '#A9A9A9', '#808080'],
    },
    christmas: {
      name: 'Christmas',
      colors: ['#FF0000', '#008000', '#FFD700', '#FFFFFF', '#C41E3A', '#228B22', '#DAA520'],
    },
    halloween: {
      name: 'Halloween',
      colors: ['#FF6600', '#000000', '#800080', '#FFD700', '#8B0000', '#4B0082', '#FF4500'],
    },
  };

  const handleAutoColor = () => {
    if (state.layers.length === 0) {
      alert('No layers to color. Create some layers first!');
      return;
    }

    const palette = palettes[selectedPalette];
    dispatch({ type: 'AUTO_COLOR_LAYERS', payload: palette.colors });
    dispatch({ type: 'SAVE_STATE', payload: { label: 'Auto-color layers' } });
  };

  return (
    <div className="p-4">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Color Palette
      </h2>

      {/* Palette Selector */}
      <div className="mb-4">
        <label className="text-xs text-gray-600 font-semibold mb-2 block">
          Choose Palette
        </label>
        <select
          value={selectedPalette}
          onChange={(e) => setSelectedPalette(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
        >
          {Object.entries(palettes).map(([key, palette]) => (
            <option key={key} value={key}>
              {palette.name}
            </option>
          ))}
        </select>
      </div>

      {/* Palette Preview */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <label className="text-xs text-gray-600 font-semibold mb-2 block">
          Palette Preview
        </label>
        <div className="flex flex-wrap gap-2">
          {palettes[selectedPalette].colors.map((color, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-lg border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Auto-Color Button */}
      <button
        onClick={handleAutoColor}
        disabled={state.layers.length === 0}
        className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          state.layers.length > 0
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        Auto-Color {state.layers.length} Layer{state.layers.length !== 1 ? 's' : ''}
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>Auto-coloring</strong> assigns colors from the selected palette to your layers automatically. 
          Colors are distributed evenly across layers.
        </p>
      </div>
    </div>
  );
}
