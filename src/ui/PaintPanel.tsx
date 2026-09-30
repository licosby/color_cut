import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppState } from '../state/UIState';
import { PartSelector } from '../geometry/PartSelector';

/**
 * PaintPanel - Controls for manual triangle painting/masking
 * Optimized for performance with large models
 */
export function PaintPanel() {
  const { state, dispatch } = useAppState();
  const [brushSizeInput, setBrushSizeInput] = useState(state.brushSize.toString());
  const partSelectorRef = useRef<PartSelector | null>(null);

  // Initialize PartSelector when geometry loads
  useEffect(() => {
    if (state.geometry && !partSelectorRef.current) {
      partSelectorRef.current = new PartSelector();
      partSelectorRef.current.buildAdjacency(state.geometry);
    }
  }, [state.geometry]);

  // Sync brush size input with state
  useEffect(() => {
    setBrushSizeInput(state.brushSize.toString());
  }, [state.brushSize]);

  const handleBrushSizeChange = useCallback((value: string) => {
    setBrushSizeInput(value);
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 1000000) {
      dispatch({ type: 'SET_BRUSH_SIZE', payload: num });
    }
  }, [dispatch]);

  const handleBrushSizeBlur = useCallback(() => {
    // Ensure valid value on blur
    const num = parseInt(brushSizeInput);
    if (isNaN(num) || num < 1) {
      setBrushSizeInput('1');
      dispatch({ type: 'SET_BRUSH_SIZE', payload: 1 });
    } else if (num > 1000000) {
      setBrushSizeInput('1000000');
      dispatch({ type: 'SET_BRUSH_SIZE', payload: 1000000 });
    }
  }, [brushSizeInput, dispatch]);

  const handlePaintModeChange = useCallback((mode: 'add' | 'remove') => {
    dispatch({ type: 'SET_PAINT_MODE', payload: mode });
  }, [dispatch]);

  const handleClearPainted = useCallback(() => {
    if (state.paintedTriangles.size === 0) return;
    if (confirm('Clear all painted triangles? This cannot be undone.')) {
      dispatch({ type: 'CLEAR_PAINTED_TRIANGLES' });
      dispatch({ type: 'SAVE_STATE' });
    }
  }, [state.paintedTriangles.size, dispatch]);

  const handleUndo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, [dispatch]);

  const handleSelectAll = useCallback(() => {
    if (!state.geometry) return;

    const index = state.geometry.index;
    const positions = state.geometry.getAttribute('position');
    const totalTriangles = index
      ? Math.floor(index.count / 3)
      : Math.floor(positions.count / 3);

    // Add all triangles in batches
    const batchSize = 10000;
    for (let i = 0; i < totalTriangles; i += batchSize) {
      const end = Math.min(i + batchSize, totalTriangles);
      for (let j = i; j < end; j++) {
        dispatch({ type: 'ADD_PAINTED_TRIANGLE', payload: j });
      }
    }
    dispatch({ type: 'SAVE_STATE' });
  }, [state.geometry, dispatch]);

  const handleFloodFillConnected = useCallback(() => {
    if (state.lastClickedTriangle === null) {
      alert('Click on the model first to select a starting point for flood fill');
      return;
    }

    if (!state.geometry || !partSelectorRef.current) {
      alert('No model loaded');
      return;
    }

    // Use PartSelector to flood fill from the clicked triangle
    const trianglesToPaint = partSelectorRef.current.selectPart(state.lastClickedTriangle, 90);
    
    // Add in batches for performance
    const batchSize = 5000;
    for (let i = 0; i < trianglesToPaint.length; i += batchSize) {
      const batch = trianglesToPaint.slice(i, i + batchSize);
      batch.forEach(triIdx => {
        dispatch({ type: 'ADD_PAINTED_TRIANGLE', payload: triIdx });
      });
    }
    dispatch({ type: 'SAVE_STATE' });
  }, [state.lastClickedTriangle, state.geometry, dispatch]);

  const handleSeparatePainted = useCallback(() => {
    if (state.paintedTriangles.size === 0) {
      alert('No triangles painted yet. Use the brush to paint the area you want to separate.');
      return;
    }

    const triangleArray = Array.from(state.paintedTriangles);
    dispatch({ type: 'SET_SELECTED_TRIANGLES', payload: triangleArray });
    dispatch({ type: 'SET_UI_MODE', payload: 'select' });
    dispatch({ type: 'CLEAR_PAINTED_TRIANGLES' });
    dispatch({ type: 'SAVE_STATE' });
  }, [state.paintedTriangles, dispatch]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.uiMode !== 'paint') return;

      // Ctrl+Z or Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Y or Cmd+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.uiMode, handleUndo, handleRedo]);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          Paint Tools
        </h2>
        {state.hasUnsavedChanges && (
          <span className="text-xs text-orange-500 font-medium">● Unsaved</span>
        )}
      </div>

      {/* Undo/Redo Buttons */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            canUndo
              ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
        </button>
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
            canRedo
              ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
          Redo
        </button>
      </div>

      {/* Paint Mode Toggle */}
      <div className="mb-4 p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <label className="text-xs text-gray-600 font-semibold mb-2.5 block">
          Brush Mode
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => handlePaintModeChange('add')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
              state.paintMode === 'add'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            + Add
          </button>
          <button
            onClick={() => handlePaintModeChange('remove')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
              state.paintMode === 'remove'
                ? 'bg-red-500 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-red-100 border border-red-200'
            }`}
          >
            - Remove
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          {state.paintMode === 'add' 
            ? 'Click and drag to paint triangles' 
            : 'Click and drag to erase painted triangles'}
        </p>
      </div>

      {/* Brush Size - Editable Input + Slider */}
      <div className="mb-4 p-3.5 bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl border border-gray-200">
        <label className="text-xs text-gray-600 font-semibold mb-2.5 block">
          Brush Size (triangles)
        </label>
        
        {/* Editable Number Input */}
        <div className="mb-3">
          <input
            type="number"
            value={brushSizeInput}
            onChange={(e) => handleBrushSizeChange(e.target.value)}
            onBlur={handleBrushSizeBlur}
            min="1"
            max="1000000"
            className="w-full px-4 py-2.5 text-lg font-bold text-center bg-white border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Quick Size Presets */}
        <div className="grid grid-cols-5 gap-1.5 mb-3">
          {[
            { size: 1, label: '1' },
            { size: 100, label: '100' },
            { size: 1000, label: '1K' },
            { size: 10000, label: '10K' },
            { size: 100000, label: '100K' },
          ].map(({ size, label }) => (
            <button
              key={size}
              onClick={() => {
                dispatch({ type: 'SET_BRUSH_SIZE', payload: size });
                setBrushSizeInput(size.toString());
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                state.brushSize === size
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Slider */}
        <input
          type="range"
          min="1"
          max="100000"
          step="1"
          value={Math.min(state.brushSize, 100000)}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            dispatch({ type: 'SET_BRUSH_SIZE', payload: val });
            setBrushSizeInput(val.toString());
          }}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-gray-400 font-medium">1</span>
          <span className="text-[10px] text-gray-400 font-medium">100K</span>
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
          Use "Add" mode to select areas, "Remove" mode to erase. 
          Adjust brush size for precision. Use Flood Fill to select entire connected regions instantly.
        </p>
        <p className="text-xs text-blue-600 mt-2">
          <strong>Shortcuts:</strong> Ctrl+Z = Undo, Ctrl+Y = Redo
        </p>
      </div>
    </div>
  );
}
