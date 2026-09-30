import { useEffect, useRef } from 'react';
import { AppProvider, useAppState } from './state/UIState';
import { TopBar } from './ui/TopBar';
import { LeftPanel } from './ui/LeftPanel';
import { ColorPanel } from './ui/ColorPanel';
import { Viewer } from './viewer/Viewer';
import { ColorGrouper } from './geometry/ColorGrouper';

/**
 * AppContent - Main application layout
 * Silhouette Studio style: top toolbar, left tools, right properties, center canvas
 */
function AppContent() {
  const { state, dispatch } = useAppState();
  const prevQuantizeRef = useRef(state.quantizeLevel);

  // Re-analyze colors when quantize level changes
  useEffect(() => {
    if (prevQuantizeRef.current !== state.quantizeLevel && state.geometry) {
      prevQuantizeRef.current = state.quantizeLevel;
      try {
        const colorGrouper = new ColorGrouper();
        colorGrouper.setQuantizeLevel(state.quantizeLevel);
        const groups = colorGrouper.groupByColor(state.geometry);
        dispatch({ type: 'SET_COLOR_GROUPS', payload: groups });
      } catch (e) {
        console.error('Error re-analyzing colors:', e);
      }
    }
  }, [state.quantizeLevel, state.geometry, dispatch]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 text-gray-800 overflow-hidden">
      {/* Top Toolbar */}
      <TopBar />

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
            <Viewer />

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
                    Upload a 3D model to automatically detect colors and separate them into individual STL files. Perfect for multi-color 3D printing!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">STL</span>
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">OBJ</span>
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">GLB</span>
                    <span className="px-4 py-2 bg-white rounded-xl shadow-md border border-gray-200 text-sm font-semibold text-gray-600">3MF</span>
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
              </div>
            )}
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto shadow-sm">
          <ColorPanel />
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
