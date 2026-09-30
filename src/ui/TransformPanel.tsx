import React, { useState } from 'react';
import { useAppState } from '../state/UIState';
import { TransformEngine } from '../geometry/TransformEngine';
import * as THREE from 'three';

/**
 * TransformPanel - UI for applying 3D transformations
 * Supports mirror, rotate, scale operations on model/layers/selection
 */
export function TransformPanel() {
  const { state, dispatch } = useAppState();
  const transformEngine = new TransformEngine();

  const [target, setTarget] = useState<'model' | 'layer' | 'selection'>('model');
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [rotateZ, setRotateZ] = useState(0);
  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [scaleZ, setScaleZ] = useState(1);

  const handleMirror = (axis: 'x' | 'y' | 'z') => {
    if (!state.geometry) return;

    let transformedGeometry: THREE.BufferGeometry;

    if (target === 'model') {
      transformedGeometry = transformEngine.mirror(state.geometry, axis);
      dispatch({ type: 'UPDATE_MODEL_GEOMETRY', payload: transformedGeometry });
    } else if (target === 'layer' && state.selectedLayerId !== null) {
      const layer = state.layers.find(l => l.id === state.selectedLayerId);
      if (layer && layer.geometry) {
        transformedGeometry = transformEngine.mirror(layer.geometry, axis);
        dispatch({
          type: 'UPDATE_LAYER_GEOMETRY',
          payload: { id: layer.id, geometry: transformedGeometry },
        });
      }
    } else if (target === 'selection' && state.selectedTriangles.length > 0) {
      // For selection, we need to extract, transform, and replace
      // This is more complex - for now, just show a message
      alert('Transform selection is not yet implemented. Please use model or layer transform.');
      return;
    }
  };

  const handleRotate = () => {
    if (!state.geometry) return;

    let transformedGeometry: THREE.BufferGeometry;

    if (target === 'model') {
      transformedGeometry = state.geometry.clone();
      if (rotateX !== 0) {
        transformedGeometry = transformEngine.rotate(transformedGeometry, 'x', rotateX);
      }
      if (rotateY !== 0) {
        transformedGeometry = transformEngine.rotate(transformedGeometry, 'y', rotateY);
      }
      if (rotateZ !== 0) {
        transformedGeometry = transformEngine.rotate(transformedGeometry, 'z', rotateZ);
      }
      dispatch({ type: 'UPDATE_MODEL_GEOMETRY', payload: transformedGeometry });
    } else if (target === 'layer' && state.selectedLayerId !== null) {
      const layer = state.layers.find(l => l.id === state.selectedLayerId);
      if (layer && layer.geometry) {
        transformedGeometry = layer.geometry.clone();
        if (rotateX !== 0) {
          transformedGeometry = transformEngine.rotate(transformedGeometry, 'x', rotateX);
        }
        if (rotateY !== 0) {
          transformedGeometry = transformEngine.rotate(transformedGeometry, 'y', rotateY);
        }
        if (rotateZ !== 0) {
          transformedGeometry = transformEngine.rotate(transformedGeometry, 'z', rotateZ);
        }
        dispatch({
          type: 'UPDATE_LAYER_GEOMETRY',
          payload: { id: layer.id, geometry: transformedGeometry },
        });
      }
    } else if (target === 'selection') {
      alert('Transform selection is not yet implemented. Please use model or layer transform.');
      return;
    }

    // Reset rotation inputs
    setRotateX(0);
    setRotateY(0);
    setRotateZ(0);
  };

  const handleScale = () => {
    if (!state.geometry) return;

    let transformedGeometry: THREE.BufferGeometry;

    if (target === 'model') {
      transformedGeometry = transformEngine.scale(state.geometry, scaleX, scaleY, scaleZ);
      dispatch({ type: 'UPDATE_MODEL_GEOMETRY', payload: transformedGeometry });
    } else if (target === 'layer' && state.selectedLayerId !== null) {
      const layer = state.layers.find(l => l.id === state.selectedLayerId);
      if (layer && layer.geometry) {
        transformedGeometry = transformEngine.scale(layer.geometry, scaleX, scaleY, scaleZ);
        dispatch({
          type: 'UPDATE_LAYER_GEOMETRY',
          payload: { id: layer.id, geometry: transformedGeometry },
        });
      }
    } else if (target === 'selection') {
      alert('Transform selection is not yet implemented. Please use model or layer transform.');
      return;
    }

    // Reset scale inputs
    setScaleX(1);
    setScaleY(1);
    setScaleZ(1);
  };

  const handleResetRotation = () => {
    setRotateX(0);
    setRotateY(0);
    setRotateZ(0);
  };

  const handleResetScale = () => {
    setScaleX(1);
    setScaleY(1);
    setScaleZ(1);
  };

  if (!state.geometry) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No model loaded</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Transform</h2>

      {/* Target Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Apply to:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setTarget('model')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              target === 'model'
                ? 'bg-purple-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Model
          </button>
          <button
            onClick={() => setTarget('layer')}
            disabled={state.selectedLayerId === null}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              target === 'layer'
                ? 'bg-purple-500 text-white shadow-md'
                : state.selectedLayerId === null
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Layer
          </button>
          <button
            onClick={() => setTarget('selection')}
            disabled={state.selectedTriangles.length === 0}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              target === 'selection'
                ? 'bg-purple-500 text-white shadow-md'
                : state.selectedTriangles.length === 0
                ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Selection
          </button>
        </div>
      </div>

      {/* Mirror Controls */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Mirror:</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleMirror('x')}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            Mirror X
          </button>
          <button
            onClick={() => handleMirror('y')}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            Mirror Y
          </button>
          <button
            onClick={() => handleMirror('z')}
            className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            Mirror Z
          </button>
        </div>
      </div>

      {/* Rotate Controls */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Rotate (degrees):</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-8">X:</span>
            <input
              type="number"
              value={rotateX}
              onChange={(e) => setRotateX(parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-8">Y:</span>
            <input
              type="number"
              value={rotateY}
              onChange={(e) => setRotateY(parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-8">Z:</span>
            <input
              type="number"
              value={rotateZ}
              onChange={(e) => setRotateZ(parseFloat(e.target.value) || 0)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="1"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRotate}
            disabled={rotateX === 0 && rotateY === 0 && rotateZ === 0}
            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            Apply Rotation
          </button>
          <button
            onClick={handleResetRotation}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Scale Controls */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">Scale:</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-8">X:</span>
            <input
              type="number"
              value={scaleX}
              onChange={(e) => setScaleX(parseFloat(e.target.value) || 1)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-8">Y:</span>
            <input
              type="number"
              value={scaleY}
              onChange={(e) => setScaleY(parseFloat(e.target.value) || 1)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 w-8">Z:</span>
            <input
              type="number"
              value={scaleZ}
              onChange={(e) => setScaleZ(parseFloat(e.target.value) || 1)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="0.1"
              min="0.1"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleScale}
            disabled={scaleX === 1 && scaleY === 1 && scaleZ === 1}
            className="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            Apply Scale
          </button>
          <button
            onClick={handleResetScale}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Tip:</strong> Transformations apply to the entire model, selected layer, or painted selection.
          Use mirror to flip, rotate to turn, and scale to resize.
        </p>
      </div>
    </div>
  );
}
