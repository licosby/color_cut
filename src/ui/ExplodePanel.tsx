import { useAppState } from '../state/UIState';

/**
 * ExplodePanel - Controls for explode view
 * Allows users to separate all layers spatially to see individual parts
 */
export function ExplodePanel() {
  const { state, dispatch } = useAppState();

  const handleToggleExplode = () => {
    dispatch({ type: 'TOGGLE_EXPLODE_VIEW' });
  };

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_EXPLODE_DISTANCE', payload: parseFloat(e.target.value) });
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Explode View
        </h2>
        <button
          onClick={handleToggleExplode}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            state.explodeView
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {state.explodeView ? 'ON' : 'OFF'}
        </button>
      </div>

      {state.explodeView && (
        <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <label className="text-xs text-gray-600 flex items-center justify-between mb-2">
            <span className="font-semibold">Distance</span>
            <span className="text-purple-600 font-bold text-sm bg-white px-2 py-0.5 rounded-lg shadow-sm border border-purple-100">
              {state.explodeDistance.toFixed(1)}
            </span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={state.explodeDistance}
            onChange={handleDistanceChange}
            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-gray-400 font-medium">Close</span>
            <span className="text-[10px] text-gray-400 font-medium">Far</span>
          </div>
        </div>
      )}
    </div>
  );
}
