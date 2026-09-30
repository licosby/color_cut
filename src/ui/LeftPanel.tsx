import { useAppState, UIMode } from '../state/UIState';

/**
 * LeftPanel - Vertical toolbar with mode buttons
 * Silhouette Studio style: rounded icon buttons, soft hover states
 */
export function LeftPanel() {
  const { state, dispatch } = useAppState();

  const handleModeChange = (mode: UIMode) => {
    dispatch({ type: 'SET_UI_MODE', payload: mode });
  };

  const modes: { mode: UIMode; icon: string; label: string; description: string }[] = [
    {
      mode: 'select',
      icon: '🎯',
      label: 'Select',
      description: 'Click colors to select',
    },
    {
      mode: 'part',
      icon: '🧩',
      label: 'Part',
      description: 'Click to select connected parts',
    },
    {
      mode: 'highlight',
      icon: '✨',
      label: 'Highlight',
      description: 'Highlight color regions',
    },
    {
      mode: 'export',
      icon: '📦',
      label: 'Export',
      description: 'Export colors as STL',
    },
  ];

  return (
    <div className="flex flex-col items-center py-4 px-2 bg-white border-r border-gray-200 shadow-sm">
      {/* Mode buttons */}
      <div className="flex flex-col gap-2">
        {modes.map(({ mode, icon, label, description }) => {
          const isActive = state.uiMode === mode;
          
          return (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              className={`group relative w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-purple-100 border-2 border-purple-400 shadow-md'
                  : 'bg-gray-50 border-2 border-gray-200 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm'
              }`}
              title={description}
            >
              <span className="text-2xl mb-0.5">{icon}</span>
              <span className={`text-[9px] font-medium ${
                isActive ? 'text-purple-700' : 'text-gray-500'
              }`}>
                {label}
              </span>
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                {description}
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-gray-200 my-4" />

      {/* Mode info */}
      <div className="text-center px-2 mt-2">
        <p className="text-[10px] text-gray-400 leading-tight">
          {state.uiMode === 'select' && 'Select colors from the palette'}
          {state.uiMode === 'part' && 'Click on model to select connected parts'}
          {state.uiMode === 'highlight' && 'Highlight selected color in viewer'}
          {state.uiMode === 'export' && 'Export colors as separate STL files'}
        </p>
      </div>
    </div>
  );
}
