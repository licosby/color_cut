import { useState } from 'react';
import { useAppState, Layer } from '../state/UIState';

/**
 * LayersPanel - Shows separated layers with visibility, rename, delete controls
 * Silhouette Studio style: soft borders, rounded corners, friendly icons
 */
export function LayersPanel() {
  const { state, dispatch } = useAppState();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleSelectLayer = (id: string) => {
    dispatch({ type: 'SELECT_LAYER', payload: state.selectedLayerId === id ? null : id });
  };

  const handleToggleVisibility = (id: string) => {
    dispatch({ type: 'TOGGLE_LAYER_VISIBILITY', payload: id });
  };

  const handleDeleteLayer = (id: string) => {
    dispatch({ type: 'REMOVE_LAYER', payload: id });
  };

  const handleStartRename = (layer: Layer) => {
    setRenamingId(layer.id);
    setRenameValue(layer.name);
  };

  const handleFinishRename = () => {
    if (renamingId && renameValue.trim()) {
      dispatch({ type: 'RENAME_LAYER', payload: { id: renamingId, name: renameValue.trim() } });
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  if (state.layers.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-1">
          Layers
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium mb-1">No layers yet</p>
          <p className="text-gray-400 text-xs px-4 leading-relaxed">
            Select a color and click <strong>Separate</strong> to create a layer
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Layers
        </h2>
        <span className="text-xs text-white bg-gradient-to-r from-purple-500 to-pink-500 px-2.5 py-0.5 rounded-full font-bold shadow-sm">
          {state.layers.length}
        </span>
      </div>

      <div className="space-y-2">
        {state.layers.map((layer) => {
          const isSelected = state.selectedLayerId === layer.id;
          const isRenaming = renamingId === layer.id;

          return (
            <div
              key={layer.id}
              className={`rounded-2xl transition-all animate-fadeIn ${
                isSelected
                  ? 'bg-purple-50 border-2 border-purple-400 shadow-md'
                  : 'bg-white border-2 border-gray-100 hover:border-purple-200 hover:shadow-sm'
              }`}
            >
              {/* Main row */}
              <div className="flex items-center gap-2 p-2.5">
                {/* Color swatch */}
                <div
                  className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm border-2 border-white"
                  style={{ backgroundColor: layer.colorGroup?.color || '#888888' }}
                />

                {/* Layer info */}
                <div className="flex-1 min-w-0">
                  {isRenaming ? (
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={handleFinishRename}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      className="w-full text-sm font-medium text-gray-700 bg-white border border-purple-300 rounded-lg px-2 py-0.5 focus:outline-none focus:border-purple-500"
                    />
                  ) : (
                    <button
                      onClick={() => handleSelectLayer(layer.id)}
                      className="text-sm font-medium text-gray-700 hover:text-purple-600 truncate block w-full text-left"
                    >
                      {layer.name}
                    </button>
                  )}
                  <span className="text-[10px] text-gray-400">
                    {(layer.colorGroup?.triangleCount || layer.triangleIndices?.length || 0).toLocaleString()} triangles
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  {/* Visibility toggle */}
                  <button
                    onClick={() => handleToggleVisibility(layer.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    title={layer.visible ? 'Hide this layer' : 'Show this layer'}
                  >
                    {layer.visible ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>

                  {/* Rename */}
                  <button
                    onClick={() => handleStartRename(layer)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Rename this layer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete this layer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-400 px-1">
          {state.layers.reduce((sum, l) => sum + (l.colorGroup?.triangleCount || l.triangleIndices?.length || 0), 0).toLocaleString()} triangles separated
        </div>
      </div>
    </div>
  );
}
