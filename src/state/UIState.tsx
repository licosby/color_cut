import { createContext, useContext, useReducer, ReactNode } from 'react';
import * as THREE from 'three';
import { ColorGroup } from '../geometry/ColorGrouper';

export type UIMode = 'select' | 'highlight' | 'export';

export interface Layer {
  id: string;
  name: string;
  colorGroup: ColorGroup;
  visible: boolean;
  geometry: THREE.BufferGeometry | null;
}

export interface AppState {
  // Model state
  model: THREE.Mesh | null;
  geometry: THREE.BufferGeometry | null;
  fileName: string;
  
  // Color analysis
  colorGroups: ColorGroup[];
  
  // Layers system
  layers: Layer[];
  selectedLayerId: string | null;
  
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
  layers: [],
  selectedLayerId: null,
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
