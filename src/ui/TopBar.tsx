import { useRef, useMemo } from 'react';
import { useAppState } from '../state/UIState';
import { ModelLoader } from '../geometry/ModelLoader';
import { ColorGrouper } from '../geometry/ColorGrouper';
import { ExportEngine } from '../geometry/ExportEngine';

/**
 * TopBar - Top navigation bar with Load Model and Export buttons
 * Silhouette Studio style: large, friendly icons, soft rounded corners
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

      // Analyze colors with current quantize level
      colorGrouper.setQuantizeLevel(state.quantizeLevel);
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

  const handleExportAll = async () => {
    if (!state.geometry || state.colorGroups.length === 0) return;
    await exportEngine.exportAllSTLs(state.geometry, state.colorGroups, state.fileName);
  };

  const handleExportSelected = () => {
    if (!state.geometry || state.selectedColorIndex === null) return;
    const group = state.colorGroups[state.selectedColorIndex];
    exportEngine.exportSingleSTL(state.geometry, group, state.fileName);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-800 leading-tight">
              ColorCut <span className="text-purple-600">3D</span>
            </h1>
            <p className="text-[10px] text-gray-400 leading-tight">Color Mesh Separator</p>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-200 mx-2" />

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
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
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
          <div className="flex items-center gap-2 mr-3">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-500 text-sm truncate max-w-48">
              {state.fileName}
            </span>
          </div>
        )}

        {/* Export selected */}
        {state.selectedColorIndex !== null && (
          <button
            onClick={handleExportSelected}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Color
          </button>
        )}

        {/* Export all */}
        {state.colorGroups.length > 0 && (
          <button
            onClick={handleExportAll}
            className="px-3.5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-xs">
              {state.colorGroups.length}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
