import { useAppState } from '../state/UIState';

/**
 * PaintPanel - Controls for manual triangle painting/masking
 * Allows users to paint triangles to select parts for separation
 */
export function PaintPanel() {
  const { state, dispatch } = useAppState();

  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_BRUSH_SIZE', payload: parseInt(e.target.value) });
  };

  const handlePaintModeChange = (mode: 'add' | 'remove') => {
    dispatch({ type: 'SET_PAINT_MODE', payload: mode });
  };

  const handleClearPainted = () => {
    if (confirm('Clear all painted triangles?')) {
      dispatch({ type: 'CLEAR_PAINTED_TRIANGLES' });
    }
  };

  const handleSeparatePainted = () => {
    if (state.paintedTriangles.size === 0) {
      alert('No triangles painted yet. Use the brush to paint the area you want to separate.');
      return;
    }

    // Convert Set to Array
    const triangleArray = Array.from(state.paintedTriangles);
    dispatch({ type: 'SET_SELECTED_TRIANGLES', payload: triangleArray });
    
    // Switch back to select mode
    dispatch({ type: 'SET_UI_MODE', payload: 'select' });
    
    // Clear painted triangles
    dispatch({ type: 'CLEAR_PAINTED_TRIANGLES' });
  };

  return (
    <div className="p-5">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">
        Paint Tools
      </h2>

      {/* Paint Mode Toggle */}
      <div className="mb-4 p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <label className="text-xs text-gray-600 font-semibold mb-2.5 block">
          Brush Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handlePaintModeChange('add')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              state.paintMode === 'add'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            + Add
          </button>
          <button
            onClick={() => handlePaintModeChange('remove')}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              state.paintMode === 'remove'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            - Remove
          </button>
        </div>
      </div>

      {/* Brush Size */}
      <div className="mb-4 p-3.5 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border border-gray-200">
        <label className="text-xs text-gray-600 flex items-center justify-between mb-2.5">
          <span className="font-semibold">Brush Size</span>
          <span className="text-purple-600 font-bold text-sm bg-white px-2 py-0.5 rounded-lg shadow-sm border border-purple-100">
            {state.brushSize}
          </span>
        </label>
        <input
          type="range"
          min="1"
          max="20"
          value={state.brushSize}
          onChange={handleBrushSizeChange}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400 font-medium">Fine</span>
          <span className="text-[10px] text-gray-400 font-medium">Broad</span>
        </div>
      </div>

      {/* Painted Count */}
      <div className="mb-4 p-3 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-indigo-700">
            Painted Triangles
          </span>
          <span className="text-sm font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg">
            {state.paintedTriangles.size.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={handleSeparatePainted}
          disabled={state.paintedTriangles.size === 0}
          className={`w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            state.paintedTriangles.size > 0
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
          </svg>
          Separate Painted Area
        </button>

        <button
          onClick={handleClearPainted}
          disabled={state.paintedTriangles.size === 0}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            state.paintedTriangles.size > 0
              ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          Clear All
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>How to use:</strong> Click and drag on the model to paint triangles. 
          Use "Add" mode to select areas, "Remove" mode to deselect. 
          Adjust brush size for precision.
        </p>
      </div>
    </div>
  );
}
