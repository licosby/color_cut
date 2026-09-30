import { createContext, useContext, useReducer, ReactNode } from 'react';
import * as THREE from 'three';
import { ColorGroup } from '../geometry/ColorGrouper';

export type UIMode = 'select' | 'highlight' | 'export' | 'part' | 'paint';

export interface Layer {
  id: string;
  name: string;
  colorGroup: ColorGroup | null; // null for part-based layers
  triangleIndices?: number[]; // for part-based layers
  visible: boolean;
  geometry: THREE.BufferGeometry | null;
  explodeOffset?: THREE.Vector3; // offset for explode view
}

export interface Connector {
  id: string;
  fromLayerId: string;
  toLayerId: string;
  fromPoint: THREE.Vector3;
  toPoint: THREE.Vector3;
  radius: number;
  color: string;
}

export interface AppState {
  // Model state
  model: THREE.Mesh | null;
  geometry: THREE.BufferGeometry | null;
  fileName: string;

  // Color analysis
  colorGroups: ColorGroup[];

  // Part selection (topology-based)
  selectedTriangles: number[];
  angleThreshold: number;

  // Manual painting/masking
  paintedTriangles: Set<number>;
  brushSize: number;
  paintMode: 'add' | 'remove';
  lastClickedTriangle: number | null;
  
  // Undo/Redo history
  history: Array<{
    paintedTriangles: number[];
    timestamp: number;
  }>;
  historyIndex: number;
  maxHistorySize: number;
  
  // Auto-save
  lastSavedState: string | null;
  hasUnsavedChanges: boolean;

  // Layers system
  layers: Layer[];
  selectedLayerId: string | null;

  // Explode view
  explodeView: boolean;
  explodeDistance: number;

  // Connectors
  connectors: Connector[];
  selectedConnectorId: string | null;

  // UI state
  selectedColorIndex: number | null;
  isLoading: boolean;
  error: string | null;
  quantizeLevel: number;
  uiMode: UIMode;
  showOnboarding: boolean;
}
const initialState: AppState = {
  model: null,
  geometry: null,
  fileName: '',
  colorGroups: [],
  selectedTriangles: [],
  angleThreshold: 45,
  paintedTriangles: new Set<number>(),
  brushSize: 5,
  paintMode: 'add',
  lastClickedTriangle: null,
  history: [],
  historyIndex: -1,
  maxHistorySize: 50,
  lastSavedState: null,
  hasUnsavedChanges: false,
  layers: [],
  selectedLayerId: null,
  explodeView: false,
  explodeDistance: 2,
  connectors: [],
  selectedConnectorId: null,
  selectedColorIndex: null,
  isLoading: false,
  error: null,
  quantizeLevel: 8,
  uiMode: 'select',
  showOnboarding: !localStorage.getItem('colorcut-onboarding-complete'),
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MODEL'; payload: { mesh: THREE.Mesh; geometry: THREE.BufferGeometry; fileName: string } }
  | { type: 'SET_COLOR_GROUPS'; payload: ColorGroup[] }
  | { type: 'SELECT_COLOR'; payload: number | null }
  | { type: 'SET_QUANTIZE_LEVEL'; payload: number }
  | { type: 'SET_UI_MODE'; payload: UIMode }
  | { type: 'ADD_LAYER'; payload: Layer }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'RENAME_LAYER'; payload: { id: string; name: string } }
  | { type: 'TOGGLE_LAYER_VISIBILITY'; payload: string }
  | { type: 'SELECT_LAYER'; payload: string | null }
  | { type: 'SET_SELECTED_TRIANGLES'; payload: number[] }
  | { type: 'SET_ANGLE_THRESHOLD'; payload: number }
  | { type: 'ADD_PAINTED_TRIANGLE'; payload: number }
  | { type: 'REMOVE_PAINTED_TRIANGLE'; payload: number }
  | { type: 'CLEAR_PAINTED_TRIANGLES' }
  | { type: 'SET_BRUSH_SIZE'; payload: number }
  | { type: 'SET_PAINT_MODE'; payload: 'add' | 'remove' }
  | { type: 'SET_LAST_CLICKED_TRIANGLE'; payload: number | null }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_STATE' }
  | { type: 'LOAD_STATE'; payload: string }
  | { type: 'MARK_UNSAVED' }
  | { type: 'MARK_SAVED' }
  | { type: 'TOGGLE_EXPLODE_VIEW' }
  | { type: 'SET_EXPLODE_DISTANCE'; payload: number }
  | { type: 'ADD_CONNECTOR'; payload: Connector }
  | { type: 'REMOVE_CONNECTOR'; payload: string }
  | { type: 'SELECT_CONNECTOR'; payload: string | null }
  | { type: 'SET_LAYER_EXPLODE_OFFSET'; payload: { id: string; offset: THREE.Vector3 } }
  | { type: 'UPDATE_MODEL_GEOMETRY'; payload: THREE.BufferGeometry }
  | { type: 'UPDATE_LAYER_GEOMETRY'; payload: { id: string; geometry: THREE.BufferGeometry } }
  | { type: 'DISMISS_ONBOARDING' }
  | { type: 'RESET' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_MODEL':
      return {
        ...state,
        model: action.payload.mesh,
        geometry: action.payload.geometry,
        fileName: action.payload.fileName,
        colorGroups: [],
        selectedTriangles: [],
        layers: [],
        selectedLayerId: null,
        selectedColorIndex: null,
        isLoading: false,
        error: null,
      };
    case 'SET_COLOR_GROUPS':
      return { ...state, colorGroups: action.payload, isLoading: false };
    case 'SELECT_COLOR':
      return { ...state, selectedColorIndex: action.payload };
    case 'SET_QUANTIZE_LEVEL':
      return { ...state, quantizeLevel: action.payload };
    case 'SET_UI_MODE':
      return { ...state, uiMode: action.payload };
    case 'ADD_LAYER':
      return { ...state, layers: [...state.layers, action.payload] };
    case 'REMOVE_LAYER':
      return {
        ...state,
        layers: state.layers.filter(l => l.id !== action.payload),
        selectedLayerId: state.selectedLayerId === action.payload ? null : state.selectedLayerId,
      };
    case 'RENAME_LAYER':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.payload.id ? { ...l, name: action.payload.name } : l
        ),
      };
    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.payload ? { ...l, visible: !l.visible } : l
        ),
      };
    case 'SELECT_LAYER':
      return { ...state, selectedLayerId: action.payload };
    case 'SET_SELECTED_TRIANGLES':
      return { ...state, selectedTriangles: action.payload };
    case 'SET_ANGLE_THRESHOLD':
      return { ...state, angleThreshold: action.payload };
    case 'ADD_PAINTED_TRIANGLE':
      const newPaintedAdd = new Set(state.paintedTriangles);
      newPaintedAdd.add(action.payload);
      return { ...state, paintedTriangles: newPaintedAdd };
    case 'REMOVE_PAINTED_TRIANGLE':
      const newPaintedRemove = new Set(state.paintedTriangles);
      newPaintedRemove.delete(action.payload);
      return { ...state, paintedTriangles: newPaintedRemove };
    case 'CLEAR_PAINTED_TRIANGLES':
      return { ...state, paintedTriangles: new Set<number>() };
    case 'SET_BRUSH_SIZE':
      return { ...state, brushSize: action.payload };
    case 'SET_PAINT_MODE':
      return { ...state, paintMode: action.payload };
    case 'SET_LAST_CLICKED_TRIANGLE':
      return { ...state, lastClickedTriangle: action.payload };
    case 'UNDO':
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      const prevState = state.history[newIndex];
      return {
        ...state,
        historyIndex: newIndex,
        paintedTriangles: new Set(prevState.paintedTriangles),
        hasUnsavedChanges: true,
      };
    case 'REDO':
      if (state.historyIndex >= state.history.length - 1) return state;
      const redoIndex = state.historyIndex + 1;
      const nextState = state.history[redoIndex];
      return {
        ...state,
        historyIndex: redoIndex,
        paintedTriangles: new Set(nextState.paintedTriangles),
        hasUnsavedChanges: true,
      };
    case 'SAVE_STATE':
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push({
        paintedTriangles: Array.from(state.paintedTriangles),
        timestamp: Date.now(),
      });
      // Keep only last maxHistorySize entries
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
      }
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        hasUnsavedChanges: true,
      };
    case 'LOAD_STATE':
      try {
        const loaded = JSON.parse(action.payload);
        return {
          ...state,
          paintedTriangles: new Set(loaded.paintedTriangles || []),
          hasUnsavedChanges: false,
        };
      } catch {
        return state;
      }
    case 'MARK_UNSAVED':
      return { ...state, hasUnsavedChanges: true };
    case 'MARK_SAVED':
      return { ...state, hasUnsavedChanges: false, lastSavedState: JSON.stringify({
        paintedTriangles: Array.from(state.paintedTriangles),
      })};
    case 'TOGGLE_EXPLODE_VIEW':
      return { ...state, explodeView: !state.explodeView };
    case 'SET_EXPLODE_DISTANCE':
      return { ...state, explodeDistance: action.payload };
    case 'ADD_CONNECTOR':
      return { ...state, connectors: [...state.connectors, action.payload] };
    case 'REMOVE_CONNECTOR':
      return {
        ...state,
        connectors: state.connectors.filter(c => c.id !== action.payload),
        selectedConnectorId: state.selectedConnectorId === action.payload ? null : state.selectedConnectorId,
      };
    case 'SELECT_CONNECTOR':
      return { ...state, selectedConnectorId: action.payload };
    case 'SET_LAYER_EXPLODE_OFFSET':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.payload.id ? { ...l, explodeOffset: action.payload.offset } : l
        ),
      };
    case 'UPDATE_MODEL_GEOMETRY':
      return {
        ...state,
        geometry: action.payload,
      };
    case 'UPDATE_LAYER_GEOMETRY':
      return {
        ...state,
        layers: state.layers.map(l =>
          l.id === action.payload.id ? { ...l, geometry: action.payload.geometry } : l
        ),
      };
    case 'DISMISS_ONBOARDING':
      localStorage.setItem('colorcut-onboarding-complete', 'true');
      return { ...state, showOnboarding: false };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
