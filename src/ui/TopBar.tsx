import { useRef, useMemo } from 'react';
import { useAppState } from '../state/UIState';
import { ModelLoader } from '../geometry/ModelLoader';
import { ColorGrouper } from '../geometry/ColorGrouper';
import { ExportEngine } from '../geometry/ExportEngine';

/**
 * TopBar - Top navigation bar with Load Model and Export buttons
 */
export function TopBar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, dispatch } = useAppState();
  
  const modelLoader = useMemo(() => new ModelLoader(), []);
  const colorGrouper = useMemo(() => new ColorGrouper(), []);
  const exportEngine = useMemo(() => new ExportEngine(), []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Load the model
      const loaded = await modelLoader.loadFile(file);
      
      dispatch({
        type: 'SET_MODEL',
        payload: {
          mesh: loaded.mesh,
          geometry: loaded.geometry,
          fileName: loaded.fileName,
        },
      });

      // Analyze colors
      const groups = colorGrouper.groupByColor(loaded.geometry);
      dispatch({ type: 'SET_COLOR_GROUPS', payload: groups });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load model',
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExportAll = () => {
    if (!state.geometry || state.colorGroups.length === 0) return;
    exportEngine.exportAllSTLs(state.geometry, state.colorGroups, state.fileName);
  };

  const handleExportSelected = () => {
    if (!state.geometry || state.selectedColorIndex === null) return;
    const group = state.colorGroups[state.selectedColorIndex];
    exportEngine.exportSingleSTL(state.geometry, group, state.fileName);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white">
            ColorCut <span className="text-purple-400">3D</span>
          </h1>
        </div>

        <div className="h-6 w-px bg-gray-700 mx-2" />

        {/* Load button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".stl,.obj,.glb,.gltf,.3mf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load Model
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* File info */}
        {state.fileName && (
          <span className="text-gray-400 text-sm mr-4 truncate max-w-48">
            {state.fileName}
          </span>
        )}

        {/* Export selected */}
        {state.selectedColorIndex !== null && (
          <button
            onClick={handleExportSelected}
            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Selected
          </button>
        )}

        {/* Export all */}
        {state.colorGroups.length > 0 && (
          <button
            onClick={handleExportAll}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All ({state.colorGroups.length})
          </button>
        )}
      </div>
    </div>
  );
}
