import { useAppState } from '../state/UIState';

/**
 * ColorPanel - Shows list of detected colors with triangle counts
 * Clicking a color isolates it in the viewer and enables export
 */
export function ColorPanel() {
  const { state, dispatch } = useAppState();

  const handleColorClick = (index: number) => {
    if (state.selectedColorIndex === index) {
      // Deselect
      dispatch({ type: 'SELECT_COLOR', payload: null });
    } else {
      dispatch({ type: 'SELECT_COLOR', payload: index });
    }
  };

  const handleClearSelection = () => {
    dispatch({ type: 'SELECT_COLOR', payload: null });
  };

  if (state.colorGroups.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Detected Colors
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-600 mb-2">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Load a 3D model to detect colors</p>
          <p className="text-gray-600 text-xs mt-2">Supports STL, OBJ, GLB, 3MF</p>
        </div>
      </div>
    );
  }

  const totalTriangles = state.colorGroups.reduce((sum, g) => sum + g.triangleCount, 0);

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Detected Colors
        </h2>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          {state.colorGroups.length} colors
        </span>
      </div>

      {/* Quantize slider */}
      <div className="mb-3 px-1">
        <label className="text-xs text-gray-500 flex items-center justify-between mb-1">
          <span>Color Sensitivity</span>
          <span className="text-purple-400">{state.quantizeLevel}</span>
        </label>
        <input
          type="range"
          min="2"
          max="32"
          value={state.quantizeLevel}
          onChange={(e) => {
            dispatch({ type: 'SET_QUANTIZE_LEVEL', payload: parseInt(e.target.value) });
          }}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <p className="text-xs text-gray-600 mt-1">Higher = more color groups</p>
      </div>

      {/* Selection info */}
      {state.selectedColorIndex !== null && (
        <div className="mb-3 p-2 bg-purple-900/30 border border-purple-700/50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-purple-300">
              Selected: {state.colorGroups[state.selectedColorIndex]?.color}
            </span>
            <button
              onClick={handleClearSelection}
              className="text-xs text-purple-400 hover:text-purple-300 underline"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Color list */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
        {state.colorGroups.map((group, index) => {
          const isSelected = state.selectedColorIndex === index;
          const percentage = ((group.triangleCount / totalTriangles) * 100).toFixed(1);

          return (
            <button
              key={group.color + index}
              onClick={() => handleColorClick(index)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                isSelected
                  ? 'bg-purple-900/50 border border-purple-500/50 ring-1 ring-purple-500/30'
                  : 'hover:bg-gray-800/50 border border-transparent'
              }`}
            >
              {/* Color swatch */}
              <div
                className="w-8 h-8 rounded-md flex-shrink-0 border border-white/10 shadow-inner"
                style={{ backgroundColor: group.color }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-gray-300">
                    {group.color.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-500">
                    {group.triangleCount.toLocaleString()} triangles
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: group.color,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Total: {totalTriangles.toLocaleString()} triangles</span>
          <span>{state.colorGroups.length} groups</span>
        </div>
      </div>
    </div>
  );
}
