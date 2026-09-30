import { useState, useCallback, useEffect } from 'react';
import { useAppState } from '../state/UIState';
import { ModelLoader } from '../geometry/ModelLoader';
import { ColorGrouper } from '../geometry/ColorGrouper';

interface DragDropProps {
  colorGrouper: ColorGrouper;
}

/**
 * DragDrop - Drag and drop file loading component
 * Supports STL, OBJ, GLB, 3MF files
 */
export function DragDrop({ colorGrouper }: DragDropProps) {
  const { state, dispatch } = useAppState();
  const [isDragging, setIsDragging] = useState(false);
  const modelLoader = new ModelLoader();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validExtensions = ['.stl', '.obj', '.glb', '.gltf', '.3mf'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!validExtensions.includes(extension)) {
      dispatch({
        type: 'SET_ERROR',
        payload: `Unsupported file format. Please use: ${validExtensions.join(', ')}`,
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const loaded = await modelLoader.loadFile(file);
      
      dispatch({
        type: 'SET_MODEL',
        payload: {
          mesh: loaded.mesh,
          geometry: loaded.geometry,
          fileName: loaded.fileName,
        },
      });

      colorGrouper.setQuantizeLevel(state.quantizeLevel);
      const groups = colorGrouper.groupByColor(loaded.geometry);
      dispatch({ type: 'SET_COLOR_GROUPS', payload: groups });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load model',
      });
    }
  }, [dispatch, modelLoader, colorGrouper, state.quantizeLevel]);

  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-purple-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-12 text-center pointer-events-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center">
          <svg className="w-12 h-12 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Drop your 3D model here</h2>
        <p className="text-gray-500 text-sm">Supports STL, OBJ, GLB, 3MF files</p>
      </div>
    </div>
  );
}
