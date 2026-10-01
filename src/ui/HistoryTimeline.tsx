import { useAppState } from '../state/UIState';

/**
 * HistoryTimeline - Visual timeline of all actions with thumbnails
 * Allows jumping to any point in history
 */
export function HistoryTimeline({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useAppState();

  const handleJumpToState = (index: number) => {
    dispatch({ type: 'JUMP_TO_HISTORY', payload: index });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getActionIcon = (label: string) => {
    if (label.includes('Paint')) return '🖌️';
    if (label.includes('Layer')) return '📑';
    if (label.includes('Color')) return '🎨';
    if (label.includes('Transform')) return '🔄';
    if (label.includes('Connector')) return '🔗';
    if (label.includes('Explode')) return '💥';
    if (label.includes('Separate')) return '✂️';
    return '📝';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-6xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">History Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              {state.history.length} actions • Click any action to jump to that state
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          {state.history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No history yet</p>
              <p className="text-gray-400 text-xs mt-2">Start working to see your actions here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.history.map((entry, index) => {
                const isCurrent = index === state.historyIndex;
                const isPast = index < state.historyIndex;
                const isFuture = index > state.historyIndex;

                return (
                  <div
                    key={entry.id}
                    onClick={() => handleJumpToState(index)}
                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-purple-50 border-purple-400 shadow-md'
                        : isPast
                        ? 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100 hover:border-purple-300'
                    }`}
                  >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                          isCurrent
                            ? 'bg-purple-500 text-white shadow-md'
                            : isPast
                            ? 'bg-gray-200 text-gray-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {getActionIcon(entry.label)}
                      </div>
                      {index < state.history.length - 1 && (
                        <div className={`w-0.5 h-8 mt-2 ${isPast ? 'bg-purple-300' : 'bg-gray-200'}`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-semibold ${isCurrent ? 'text-purple-700' : 'text-gray-700'}`}>
                          {entry.label}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatTime(entry.timestamp)}</span>
                        <span>•</span>
                        <span>{entry.state.paintedTriangles.length} painted triangles</span>
                        <span>•</span>
                        <span>{entry.state.layers.length} layers</span>
                      </div>
                    </div>

                    {/* Jump button */}
                    {!isCurrent && (
                      <button
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJumpToState(index);
                        }}
                      >
                        Jump to this state
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{state.historyIndex + 1}</span> of{' '}
            <span className="font-semibold">{state.history.length}</span> actions
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={state.historyIndex <= 0}
              className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
            >
              ← Undo
            </button>
            <button
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={state.historyIndex >= state.history.length - 1}
              className="px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-200 disabled:text-gray-400 text-gray-700 text-sm font-medium rounded-lg border border-gray-300 transition-colors"
            >
              Redo →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
