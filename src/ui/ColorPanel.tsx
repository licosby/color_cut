import { useAppState } from '../state/UIState';
import { ExportEngine } from '../geometry/ExportEngine';
import { useMemo } from 'react';

/**
 * ColorPanel - Right properties panel showing detected colors
 * Silhouette Studio style: rounded swatches, per-color export, soft borders
 */
export function ColorPanel() {
  const { state, dispatch } = useAppState();
  const exportEngine = useMemo(() => new ExportEngine(), []);

  const handleColorClick = (index: number) => {
    if (state.selectedColorIndex === index) {
      dispatch({ type: 'SELECT_COLOR', payload: null });
    } else {
      dispatch({ type: 'SELECT_COLOR', payload: index });
    }
  };

  const handleExportColor = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (!state.geometry) return;
    const group = state.colorGroups[index];
    exportEngine.exportSingleSTL(state.geometry, group, state.fileName);
  };

  const handleClearSelection = () => {
    dispatch({ type: 'SELECT_COLOR', payload: null });
  };

  if (state.colorGroups.length === 0) {
    return (
      <div className="p-5">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5 px-1">
          Color Palette
        </h2>
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl flex items-center justify-center shadow-sm border border-purple-100">
            <svg className="w-10 h-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm font-semibold mb-1">No colors detected</p>
          <p className="text-gray-400 text-xs px-4 leading-relaxed">
            Load a 3D model to see its color palette here
          </p>
        </div>
      </div>
    );
  }

  const totalTriangles = state.colorGroups.reduce((sum, g) => sum + g.triangleCount, 0);

  return (
    <div className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Color Palette
        </h2>
        <span className="text-xs text-white bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
          {state.colorGroups.length}
        </span>
      </div>

      {/* Sensitivity slider */}
      <div className="mb-4 p-3.5 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border border-gray-200">
        <label className="text-xs text-gray-600 flex items-center justify-between mb-2.5">
          <span className="font-semibold">Color Sensitivity</span>
          <span className="text-purple-600 font-bold text-sm bg-white px-2 py-0.5 rounded-lg shadow-sm border border-purple-100">
            {state.quantizeLevel}
          </span>
        </label>
        <input
          type="range"
          min="2"
          max="32"
          value={state.quantizeLevel}
          onChange={(e) => {
            dispatch({ type: 'SET_QUANTIZE_LEVEL', payload: parseInt(e.target.value) });
          }}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400 font-medium">Less detail</span>
          <span className="text-[10px] text-gray-400 font-medium">More detail</span>
        </div>
      </div>

      {/* Selection info */}
      {state.selectedColorIndex !== null && (
        <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-lg border-2 border-white shadow-md"
                style={{ backgroundColor: state.colorGroups[state.selectedColorIndex]?.color }}
              />
              <div>
                <span className="text-xs font-bold text-purple-700 block">
                  {state.colorGroups[state.selectedColorIndex]?.color.toUpperCase()}
                </span>
                <span className="text-[10px] text-purple-500">
                  {state.colorGroups[state.selectedColorIndex]?.triangleCount.toLocaleString()} triangles
                </span>
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="w-6 h-6 rounded-lg bg-white border border-purple-200 flex items-center justify-center text-purple-500 hover:bg-purple-100 transition-colors shadow-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Color list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {state.colorGroups.map((group, index) => {
          const isSelected = state.selectedColorIndex === index;
          const percentage = ((group.triangleCount / totalTriangles) * 100).toFixed(1);

          return (
            <div
              key={group.color + index}
              className={`rounded-2xl transition-all ${
                isSelected
                  ? 'bg-purple-50 border-2 border-purple-400 shadow-md'
                  : 'bg-white border-2 border-gray-100 hover:border-purple-200 hover:shadow-sm'
              }`}
            >
              <button
                onClick={() => handleColorClick(index)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                {/* Color swatch */}
                <div
                  className="w-12 h-12 rounded-xl flex-shrink-0 shadow-md border-2 border-white"
                  style={{ backgroundColor: group.color }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-mono font-bold text-gray-700">
                      {group.color.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-2 py-0.5 rounded-lg">
                      {percentage}%
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {group.triangleCount.toLocaleString()} triangles
                  </span>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: group.color,
                      }}
                    />
                  </div>
                </div>
              </button>

              {/* Export button row */}
              <div className="px-3 pb-3">
                <button
                  onClick={(e) => handleExportColor(e, index)}
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export This Color
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
          <span className="font-medium">{totalTriangles.toLocaleString()} total triangles</span>
          <span className="font-medium">{state.colorGroups.length} colors</span>
        </div>
      </div>
    </div>
  );
}
