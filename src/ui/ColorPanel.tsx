import { useAppState } from '../state/UIState';

/**
 * ColorPanel - Shows list of detected colors with triangle counts
 * Silhouette Studio style: soft colors, rounded corners, friendly layout
 */
export function ColorPanel() {
  const { state, dispatch } = useAppState();

  const handleColorClick = (index: number) => {
    if (state.selectedColorIndex === index) {
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
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-1">
          Color Palette
        </h2>
        <div className="text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">No colors detected</p>
          <p className="text-gray-400 text-xs mt-1.5 px-4">
            Load a 3D model to see its color palette here
          </p>
        </div>
      </div>
    );
  }

  const totalTriangles = state.colorGroups.reduce((sum, g) => sum + g.triangleCount, 0);

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
          Color Palette
        </h2>
        <span className="text-xs text-white bg-purple-500 px-2 py-0.5 rounded-full font-medium">
          {state.colorGroups.length}
        </span>
      </div>

      {/* Quantize slider */}
      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <label className="text-xs text-gray-600 flex items-center justify-between mb-2">
          <span className="font-medium">Color Sensitivity</span>
          <span className="text-purple-600 font-bold">{state.quantizeLevel}</span>
        </label>
        <input
          type="range"
          min="2"
          max="32"
          value={state.quantizeLevel}
          onChange={(e) => {
            dispatch({ type: 'SET_QUANTIZE_LEVEL', payload: parseInt(e.target.value) });
          }}
          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-gray-400">Fewer groups</span>
          <span className="text-[10px] text-gray-400">More groups</span>
        </div>
      </div>

      {/* Selection info */}
      {state.selectedColorIndex !== null && (
        <div className="mb-3 p-2.5 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-md border border-purple-200"
                style={{ backgroundColor: state.colorGroups[state.selectedColorIndex]?.color }}
              />
              <span className="text-xs font-medium text-purple-700">
                {state.colorGroups[state.selectedColorIndex]?.color.toUpperCase()}
              </span>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-xs text-purple-500 hover:text-purple-700 font-medium"
            >
              ✕ Clear
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
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                isSelected
                  ? 'bg-purple-50 border-2 border-purple-300 shadow-sm'
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
            >
              {/* Color swatch */}
              <div
                className="w-9 h-9 rounded-lg flex-shrink-0 shadow-sm border border-black/5"
                style={{ backgroundColor: group.color }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-medium text-gray-700">
                    {group.color.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-gray-400">
                    {group.triangleCount.toLocaleString()} triangles
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: group.color,
                      opacity: 0.8,
                    }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span>{totalTriangles.toLocaleString()} total triangles</span>
          <span>{state.colorGroups.length} colors</span>
        </div>
      </div>
    </div>
  );
}
