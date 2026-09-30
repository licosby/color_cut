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
      {/* Top Bar */}
      <TopBar />

      {/* Error Banner */}
      {state.error && (
        <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {state.error}
        </div>
      )}

      {/* Loading Banner */}
      {state.isLoading && (
        <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-200 text-purple-700 text-sm flex items-center gap-2">
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
        <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto shadow-sm">
          <ColorPanel />
        </div>

        {/* 3D Viewer (Center) */}
        <div className="flex-1 relative">
          <Viewer />

          {/* Empty state overlay */}
          {!state.geometry && !state.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center shadow-sm">
                    <svg className="w-12 h-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                  Welcome to ColorCut 3D
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  Upload a 3D model to automatically detect colors and separate them into individual STL files. Perfect for multi-color 3D printing!
                </p>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 font-medium">STL</span>
                  <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 font-medium">OBJ</span>
                  <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 font-medium">GLB</span>
                  <span className="px-3 py-1.5 bg-white rounded-full shadow-sm border border-gray-200 font-medium">3MF</span>
                </div>
              </div>
            </div>
          )}

          {/* Viewer controls hint */}
          {state.geometry && (
            <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-white/90 px-3 py-2 rounded-lg shadow-sm border border-gray-200 backdrop-blur-sm">
              <span>🖱️ Orbit</span>
              <span className="mx-2 text-gray-300">|</span>
              <span>🔍 Zoom</span>
              <span className="mx-2 text-gray-300">|</span>
              <span>✋ Pan</span>
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
