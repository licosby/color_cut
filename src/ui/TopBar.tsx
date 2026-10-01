import { useRef, useMemo } from 'react';
import { useAppState } from '../state/UIState';
import { ModelLoader } from '../geometry/ModelLoader';
import { ColorGrouper } from '../geometry/ColorGrouper';
import { ExportEngine } from '../geometry/ExportEngine';
import { Layer } from '../state/UIState';

interface TopBarProps {
  onResetView: () => void;
  colorGrouper: ColorGrouper;
  onShowHistory?: () => void;
}

/**
 * TopBar - Top toolbar with Load, Separate, Export All Layers, Reset View
 * Silhouette Studio style: large friendly icons, soft shadows, rounded corners
 */
export function TopBar({ onResetView, colorGrouper, onShowHistory }: TopBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { state, dispatch } = useAppState();
  
  const modelLoader = useMemo(() => new ModelLoader(), []);
  const exportEngine = useMemo(() => new ExportEngine(), []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const loaded = await modelLoader.loadFile(file);
      
      dispatch({
        type: 'SET_MODEL',
        payload: {
          mesh: loaded.mesh,
          geometry: loaded.geometry,
          fileName: loaded.fileName,
        },
      });

      colorGrouper.setQuantizeLevel(state.quantizeLevel);
      const groups = colorGrouper.groupByColor(loaded.geometry);
      dispatch({ type: 'SET_COLOR_GROUPS', payload: groups });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load model',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSeparate = () => {
    if (!state.geometry) return;

    // Check if we have selected triangles (from magic wand or paint)
    if (state.selectedTriangles.length > 0) {
      // Build geometry from selected triangles
      const layerGeometry = exportEngine.buildGeometryFromTriangles(state.geometry, state.selectedTriangles);

      // Create a new layer
      const layer: Layer = {
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `Part ${state.layers.length + 1}`,
        colorGroup: null,
        triangleIndices: [...state.selectedTriangles],
        visible: true,
        geometry: layerGeometry,
      };

      dispatch({ type: 'ADD_LAYER', payload: layer });
      dispatch({ type: 'SET_SELECTED_TRIANGLES', payload: [] });
      dispatch({ type: 'SAVE_STATE', payload: { label: 'Separate part' } });
      return;
    }

    // Use color-based separation
    if (state.selectedColorIndex === null) return;

    const colorGroup = state.colorGroups[state.selectedColorIndex];
    if (!colorGroup) return;

    // Build geometry for this color group
    const layerGeometry = exportEngine.buildGeometryForColor(state.geometry, colorGroup);

    // Create a new layer
    const layer: Layer = {
      id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `Layer ${state.layers.length + 1} (${colorGroup.color.toUpperCase()})`,
      colorGroup,
      visible: true,
      geometry: layerGeometry,
    };

    dispatch({ type: 'ADD_LAYER', payload: layer });
    dispatch({ type: 'SELECT_COLOR', payload: null });
    dispatch({ type: 'SAVE_STATE', payload: { label: 'Separate color' } });
  };

  const handleExportAllLayers = async () => {
    if (state.layers.length === 0 || !state.geometry) return;

    for (let i = 0; i < state.layers.length; i++) {
      const layer = state.layers[i];
      if (layer.geometry) {
        const nameWithoutExt = state.fileName.replace(/\.[^/.]+$/, '');
        
        // Handle both color-based and part-based layers
        let exportFileName: string;
        let stlData: Blob;
        
        if (layer.colorGroup) {
          // Color-based layer
          const colorHex = layer.colorGroup.color.replace('#', '');
          exportFileName = `${nameWithoutExt}_layer${i + 1}_${colorHex}.stl`;
          stlData = exportEngine.getSTLBlob(state.geometry, layer.colorGroup);
        } else if (layer.triangleIndices) {
          // Part-based layer - use triangle indices directly
          exportFileName = `${nameWithoutExt}_layer${i + 1}_part.stl`;
          stlData = exportEngine.getSTLBlobFromTriangles(state.geometry, layer.triangleIndices);
        } else {
          continue;
        }

        // Trigger download
        const url = URL.createObjectURL(stlData);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportFileName;
        link.click();
        URL.revokeObjectURL(url);

        // Small delay between downloads to avoid browser blocking
        if (i < state.layers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
  };

  const handleResetView = () => {
    dispatch({ type: 'SELECT_COLOR', payload: null });
    dispatch({ type: 'SELECT_LAYER', payload: null });
    onResetView();
  };

  const canSeparate = state.geometry !== null && (
    state.selectedColorIndex !== null || 
    state.selectedTriangles.length > 0
  );

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 leading-tight">
              ColorCut <span className="text-purple-600">3D</span>
            </h1>
            <p className="text-[10px] text-gray-400 leading-tight">Color Mesh Separator</p>
          </div>
        </div>

        <div className="h-10 w-px bg-gray-200" />

        {/* Load Model button */}
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
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
          title="Load a 3D model"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Load Model
        </button>

        {/* Separate button */}
        <button
          onClick={handleSeparate}
          disabled={!canSeparate}
          className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-md flex items-center gap-2 group ${
            canSeparate
              ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
          title="Separate this part into a new layer"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
          </svg>
          Separate
        </button>

        <div className="h-10 w-px bg-gray-200" />

        {/* Undo/Redo buttons */}
        <button
          onClick={() => dispatch({ type: 'UNDO' })}
          disabled={state.historyIndex <= 0}
          className="px-3 py-2.5 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 text-sm font-medium rounded-xl transition-all border border-gray-300 flex items-center gap-1.5"
          title="Undo (Ctrl+Z)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
        </button>
        <button
          onClick={() => dispatch({ type: 'REDO' })}
          disabled={state.historyIndex >= state.history.length - 1}
          className="px-3 py-2.5 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 text-sm font-medium rounded-xl transition-all border border-gray-300 flex items-center gap-1.5"
          title="Redo (Ctrl+Y)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
          Redo
        </button>

        {/* History Timeline button */}
        {onShowHistory && (
          <button
            onClick={onShowHistory}
            className="px-3 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl transition-all border border-gray-300 flex items-center gap-1.5"
            title="View history timeline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History ({state.history.length})
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* File info */}
        {state.fileName && (
          <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-600 text-sm font-medium truncate max-w-48">
              {state.fileName}
            </span>
          </div>
        )}

        {/* Reset View button */}
        {state.geometry && (
          <button
            onClick={handleResetView}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all border border-gray-200 hover:border-gray-300 flex items-center gap-2 group"
            title="Reset the camera view"
          >
            <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset View
          </button>
        )}

        {/* Export All Layers button */}
        {state.layers.length > 0 && (
          <button
            onClick={handleExportAllLayers}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
            title="Export all separated layers as STL files"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export All Layers
            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-lg text-xs font-bold">
              {state.layers.length}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
