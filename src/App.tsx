import { useEffect, useRef } from 'react';
import { AppProvider, useAppState } from './state/UIState';
import { TopBar } from './ui/TopBar';
import { ColorPanel } from './ui/ColorPanel';
import { Viewer } from './viewer/Viewer';
import { ColorGrouper } from './geometry/ColorGrouper';

function AppContent() {
  const { state, dispatch } = useAppState();
  const prevQuantizeRef = useRef(state.quantizeLevel);

  // Re-analyze colors when quantize level changes
  useEffect(() => {
    if (prevQuantizeRef.current !== state.quantizeLevel && state.geometry) {
      prevQuantizeRef.current = state.quantizeLevel;
      const colorGrouper = new ColorGrouper();
      colorGrouper.setQuantizeLevel(state.quantizeLevel);
      const groups = colorGrouper.groupByColor(state.geometry);
      dispatch({ type: 'SET_COLOR_GROUPS', payload: groups });
    }
  }, [state.quantizeLevel, state.geometry, dispatch]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-white overflow-hidden">
      {/* Top Bar */}
      <TopBar />

      {/* Error Banner */}
      {state.error && (
        <div className="px-4 py-2 bg-red-900/50 border-b border-red-700/50 text-red-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}

      {/* Loading Banner */}
      {state.isLoading && (
        <div className="px-4 py-2 bg-purple-900/30 border-b border-purple-700/30 text-purple-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading model...
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Color Panel (Left Sidebar) */}
        <div className="w-72 flex-shrink-0 bg-gray-900/50 border-r border-gray-800 overflow-y-auto">
          <ColorPanel />
        </div>

        {/* 3D Viewer (Center) */}
        <div className="flex-1 relative">
          <Viewer />

          {/* Empty state overlay */}
          {!state.geometry && !state.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="mb-6">
                  <svg className="w-24 h-24 mx-auto text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-500 mb-2">
                  No Model Loaded
                </h2>
                <p className="text-gray-600 text-sm max-w-sm">
                  Click <strong className="text-purple-400">"Load Model"</strong> to upload a 3D file.
                  ColorCut 3D will detect all colors and let you separate them into individual STL files.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
                  <span className="px-2 py-1 bg-gray-800 rounded">STL</span>
                  <span className="px-2 py-1 bg-gray-800 rounded">OBJ</span>
                  <span className="px-2 py-1 bg-gray-800 rounded">GLB</span>
                  <span className="px-2 py-1 bg-gray-800 rounded">3MF</span>
                </div>
              </div>
            </div>
          )}

          {/* Viewer info overlay */}
          {state.geometry && (
            <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-900/80 px-3 py-2 rounded-lg backdrop-blur-sm">
              <span>🖱️ Orbit: Left drag</span>
              <span className="mx-2">|</span>
              <span>🔍 Zoom: Scroll</span>
              <span className="mx-2">|</span>
              <span>✋ Pan: Right drag</span>
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
