import { useAppState } from '../state/UIState';
import { PartSelector } from '../geometry/PartSelector';

/**
 * PaintPanel - Controls for manual triangle painting/masking
 * Allows users to paint triangles to select parts for separation
 */
export function PaintPanel() {
  const { state, dispatch } = useAppState();
  
  // Create a PartSelector instance for flood fill
  const partSelector = new PartSelector();
  
  // Build adjacency when geometry changes
  if (state.geometry && !partSelector.isReady()) {
    partSelector.buildAdjacency(state.geometry);
  }

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

  const handleSelectAll = () => {
    // Select all triangles in the model
    if (!state.geometry) {
      alert('No model loaded');
      return;
    }

    const index = state.geometry.index;
    const positions = state.geometry.getAttribute('position');
    const totalTriangles = index
      ? Math.floor(index.count / 3)
      : Math.floor(positions.count / 3);

    // Add all triangles to painted set
    for (let i = 0; i < totalTriangles; i++) {
      dispatch({ type: 'ADD_PAINTED_TRIANGLE', payload: i });
    }
  };

  const handleFloodFillConnected = () => {
    // Flood fill from last clicked triangle to select entire connected region
    if (state.lastClickedTriangle === null) {
      alert('Click on the model first to select a starting point for flood fill');
      return;
    }

    if (!state.geometry) {
      alert('No model loaded');
      return;
    }

    // Use PartSelector to flood fill from the clicked triangle
    // Use a high angle threshold (90 degrees) to select the entire connected region
    const trianglesToPaint = partSelector.selectPart(state.lastClickedTriangle, 90);
    
    trianglesToPaint.forEach(triIdx => {
      dispatch({ type: 'ADD_PAINTED_TRIANGLE', payload: triIdx });
    });
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
        
        {/* Quick Size Presets */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          <button
            onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', payload: 1 })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              state.brushSize === 1
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Single triangle"
          >
            1
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', payload: 10 })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              state.brushSize === 10
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Small area"
          >
            10
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', payload: 50 })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              state.brushSize === 50
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Medium area"
          >
            50
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', payload: 200 })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              state.brushSize === 200
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Large area"
          >
            200
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', payload: 1000 })}
            className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
              state.brushSize === 1000
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-200'
            }`}
            title="Huge area"
          >
            1K
          </button>
        </div>
        
        <input
          type="range"
          min="1"
          max="1000"
          step="1"
          value={state.brushSize}
          onChange={handleBrushSizeChange}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400 font-medium">1 triangle</span>
          <span className="text-[10px] text-gray-400 font-medium">1000 triangles</span>
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
          onClick={handleFloodFillConnected}
          disabled={state.lastClickedTriangle === null}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            state.lastClickedTriangle !== null
              ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title="Click on the model first, then use this to select the entire connected region"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Flood Fill Connected Region
        </button>

        <button
          onClick={handleSelectAll}
          disabled={!state.geometry}
          className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            state.geometry
              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Select All Triangles
        </button>

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
