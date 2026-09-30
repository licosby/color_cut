import { useEffect, useRef, useMemo, useState } from 'react';
import { AppProvider, useAppState } from './state/UIState';
import { TopBar } from './ui/TopBar';
import { LeftPanel } from './ui/LeftPanel';
import { ColorPanel } from './ui/ColorPanel';
import { LayersPanel } from './ui/LayersPanel';
import { PaintPanel } from './ui/PaintPanel';
import { TransformPanel } from './ui/TransformPanel';
import { ExplodePanel } from './ui/ExplodePanel';
import { ConnectorPanel } from './ui/ConnectorPanel';
import { Onboarding } from './ui/Onboarding';
import { DragDrop } from './ui/DragDrop';
import { Viewer, ViewerAPI } from './viewer/Viewer';
import { ColorGrouper } from './geometry/ColorGrouper';
import { projectManager } from './state/ProjectManager';

/**
 * AppContent - Main application layout
 * Silhouette Studio style: top toolbar, left tools, right properties, center canvas
 * Workflow: Load → Select Color → Separate → Export All Layers
 */
function AppContent() {
  const { state, dispatch } = useAppState();
  const prevQuantizeRef = useRef(state.quantizeLevel);
  const viewerRef = useRef<ViewerAPI>(null);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  const colorGrouper = useMemo(() => new ColorGrouper(), []);

  // Re-analyze colors when quantize level changes
  useEffect(() => {
    if (prevQuantizeRef.current !== state.quantizeLevel && state.geometry) {
      prevQuantizeRef.current = state.quantizeLevel;
      try {
        colorGrouper.setQuantizeLevel(state.quantizeLevel);
        const groups = colorGrouper.groupByColor(state.geometry);
        dispatch({ type: 'SET_COLOR_GROUPS', payload: groups });
      } catch (e) {
        console.error('Error re-analyzing colors:', e);
      }
    }
  }, [state.quantizeLevel, state.geometry, dispatch, colorGrouper]);

  const handleResetView = () => {
    if (viewerRef.current) {
      viewerRef.current.resetCamera();
    }
  };

  // Auto-save functionality
  useEffect(() => {
    const getState = () => ({
      paintedTriangles: Array.from(state.paintedTriangles),
      layers: state.layers,
      connectors: state.connectors,
      fileName: state.fileName,
    });

    projectManager.startAutoSave(getState);

    return () => {
      projectManager.stopAutoSave();
    };
  }, [state.paintedTriangles, state.layers, state.connectors, state.fileName]);

  // Check for saved project on mount
  useEffect(() => {
    const savedProject = projectManager.load();
    if (savedProject && savedProject.paintedTriangles.length > 0) {
      const timeSinceSave = projectManager.getTimeSinceLastSave();
      if (timeSinceSave && timeSinceSave < 86400000) { // Less than 24 hours
        // Show resume option
        const shouldResume = confirm(
          `Found unsaved work from ${Math.round(timeSinceSave / 60000)} minutes ago. Resume?`
        );
        if (shouldResume) {
          savedProject.paintedTriangles.forEach(tri => {
            dispatch({ type: 'ADD_PAINTED_TRIANGLE', payload: tri });
          });
        } else {
          projectManager.clear();
        }
      }
    }
  }, [dispatch]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 text-gray-800 overflow-hidden">
      {/* Drag and Drop Overlay */}
      <DragDrop colorGrouper={colorGrouper} />

      {/* Onboarding Wizard */}
      <Onboarding />

      {/* Top Toolbar */}
      <TopBar onResetView={handleResetView} colorGrouper={colorGrouper} />

      {/* Error Banner */}
      {state.error && (
        <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-medium">{state.error}</span>
        </div>
      )}

      {/* Loading Banner */}
      {state.isLoading && (
        <div className="px-5 py-3 bg-purple-50 border-b border-purple-200 text-purple-700 text-sm flex items-center gap-3 shadow-sm">
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="font-medium">Loading model...</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tool Panel */}
        <LeftPanel />

        {/* Center Viewer Canvas */}
        <div className="flex-1 relative p-4">
          <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative">
            <Viewer 
              ref={viewerRef} 
              colorGrouper={colorGrouper}
              uiMode={state.uiMode}
              angleThreshold={state.angleThreshold}
            />

            {/* Empty state overlay */}
            {!state.geometry && !state.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center max-w-md">
                  <div className="mb-6">
                    <div className="w-28 h-28 mx-auto bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-3xl flex items-center justify-center shadow-lg border-4 border-white">
                      <svg className="w-14 h-14 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-3">
                    Welcome to ColorCut 3D
                  </h2>
                  <p className="text-gray-500 text-sm mb-6 leading-relaxed px-4">
                    Upload a multi-colored 3D model, separate each color into its own layer, then export them all as individual STL files for multi-color printing!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">STL</span>
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">OBJ</span>
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">GLB</span>
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">3MF</span>
                  </div>

                  {/* Quick workflow hint */}
                  <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <span className="px-2 py-1 bg-gray-50 rounded-lg">1. Load</span>
                    <span>→</span>
                    <span className="px-2 py-1 bg-gray-50 rounded-lg">2. Select</span>
                    <span>→</span>
                    <span className="px-2 py-1 bg-gray-50 rounded-lg">3. Separate</span>
                    <span>→</span>
                    <span className="px-2 py-1 bg-gray-50 rounded-lg">4. Export</span>
                  </div>
                </div>
              </div>
            )}

            {/* Viewer controls hint */}
            {state.geometry && (
              <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/95 px-4 py-2.5 rounded-xl shadow-md border border-gray-200 backdrop-blur-sm flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="text-base">🖱️</span>
                  <span className="font-medium">Orbit</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-base">🔍</span>
                  <span className="font-medium">Zoom</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-base">✋</span>
                  <span className="font-medium">Pan</span>
                </span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-base">👆</span>
                  <span className="font-medium">Click to Select</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Color Palette/Paint Tools + Layers + Explode/Connectors */}
        <div className={`${rightPanelCollapsed ? 'w-12' : 'w-80'} flex-shrink-0 bg-white border-l border-gray-200 shadow-sm flex flex-col transition-all duration-300 relative`}>
          {/* Collapse Toggle Button */}
          <button
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
            className="absolute top-2 left-2 z-10 w-8 h-8 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center shadow-sm transition-all"
            title={rightPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            <svg 
              className={`w-4 h-4 text-gray-600 transition-transform ${rightPanelCollapsed ? 'rotate-180' : ''}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Panel Content - Only show when not collapsed */}
          {!rightPanelCollapsed && (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Color Palette or Paint Tools (top section) */}
              <div className="border-b border-gray-200 overflow-y-auto max-h-[40%]">
                {state.uiMode === 'paint' ? <PaintPanel /> : <ColorPanel />}
              </div>

              {/* Layers Panel */}
              <div className="border-b border-gray-200 overflow-y-auto max-h-[30%] bg-gray-50">
                <LayersPanel />
              </div>

              {/* Transform Panel */}
              {state.geometry && (
                <div className="border-b border-gray-200 overflow-y-auto max-h-[30%]">
                  <TransformPanel />
                </div>
              )}

              {/* Explode and Connectors (bottom section, only show when layers exist) */}
              {state.layers.length > 0 && (
                <div className="flex-1 overflow-y-auto">
                  <ExplodePanel />
                  <div className="border-t border-gray-200">
                    <ConnectorPanel />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
