import { useState } from 'react';
import * as THREE from 'three';
import { useAppState, Connector } from '../state/UIState';

/**
 * ConnectorPanel - Controls for adding connectors between layers
 * Allows users to add cylindrical connectors between separated parts
 */
export function ConnectorPanel() {
  const { state, dispatch } = useAppState();
  const [fromLayerId, setFromLayerId] = useState<string>('');
  const [toLayerId, setToLayerId] = useState<string>('');
  const [radius, setRadius] = useState<number>(0.1);
  const [color, setColor] = useState<string>('#888888');

  const handleAddConnector = () => {
    if (!fromLayerId || !toLayerId) {
      alert('Please select both layers to connect');
      return;
    }

    if (fromLayerId === toLayerId) {
      alert('Cannot connect a layer to itself');
      return;
    }

    // Get layer geometries to calculate connection points
    const fromLayer = state.layers.find(l => l.id === fromLayerId);
    const toLayer = state.layers.find(l => l.id === toLayerId);

    if (!fromLayer?.geometry || !toLayer?.geometry) {
      alert('Selected layers must have geometry');
      return;
    }

    // Calculate center points of each layer
    const fromBox = new THREE.Box3().setFromBufferAttribute(
      fromLayer.geometry.getAttribute('position') as THREE.BufferAttribute
    );
    const toBox = new THREE.Box3().setFromBufferAttribute(
      toLayer.geometry.getAttribute('position') as THREE.BufferAttribute
    );

    const fromPoint = fromBox.getCenter(new THREE.Vector3());
    const toPoint = toBox.getCenter(new THREE.Vector3());

    const connector: Connector = {
      id: `connector-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromLayerId,
      toLayerId,
      fromPoint,
      toPoint,
      radius,
      color,
    };

    dispatch({ type: 'ADD_CONNECTOR', payload: connector });

    // Reset form
    setFromLayerId('');
    setToLayerId('');
  };

  const handleRemoveConnector = (id: string) => {
    dispatch({ type: 'REMOVE_CONNECTOR', payload: id });
  };

  return (
    <div className="p-4">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
        Connectors
      </h2>

      {/* Add Connector Form */}
      <div className="mb-4 p-3 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl border border-green-200">
        <label className="text-xs text-gray-600 font-semibold mb-2 block">
          From Layer
        </label>
        <select
          value={fromLayerId}
          onChange={(e) => setFromLayerId(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-green-200 rounded-lg mb-3 focus:outline-none focus:border-green-400"
        >
          <option value="">Select layer...</option>
          {state.layers.map(layer => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>

        <label className="text-xs text-gray-600 font-semibold mb-2 block">
          To Layer
        </label>
        <select
          value={toLayerId}
          onChange={(e) => setToLayerId(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-green-200 rounded-lg mb-3 focus:outline-none focus:border-green-400"
        >
          <option value="">Select layer...</option>
          {state.layers.map(layer => (
            <option key={layer.id} value={layer.id}>
              {layer.name}
            </option>
          ))}
        </select>

        <label className="text-xs text-gray-600 flex items-center justify-between mb-2">
          <span className="font-semibold">Radius</span>
          <span className="text-green-600 font-bold text-sm bg-white px-2 py-0.5 rounded-lg shadow-sm border border-green-100">
            {radius.toFixed(2)}
          </span>
        </label>
        <input
          type="range"
          min="0.05"
          max="0.5"
          step="0.01"
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer mb-3"
        />

        <label className="text-xs text-gray-600 font-semibold mb-2 block">
          Color
        </label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full h-10 rounded-lg border border-green-200 cursor-pointer mb-3"
        />

        <button
          onClick={handleAddConnector}
          className="w-full py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          Add Connector
        </button>
      </div>

      {/* Connector List */}
      {state.connectors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 mb-2">
            Active Connectors ({state.connectors.length})
          </h3>
          {state.connectors.map(connector => {
            const fromLayer = state.layers.find(l => l.id === connector.fromLayerId);
            const toLayer = state.layers.find(l => l.id === connector.toLayerId);

            return (
              <div
                key={connector.id}
                className="p-2.5 bg-white border-2 border-gray-100 rounded-xl hover:border-green-200 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: connector.color }}
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {fromLayer?.name || 'Unknown'} → {toLayer?.name || 'Unknown'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveConnector(connector.id)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete connector"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-[10px] text-gray-400">
                  Radius: {connector.radius.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {state.connectors.length === 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            No connectors yet. Add connectors to join separated parts.
          </p>
        </div>
      )}
    </div>
  );
}
