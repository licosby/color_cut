import { createContext, useContext, useReducer, ReactNode } from 'react';
import * as THREE from 'three';
import { ColorGroup } from '../geometry/ColorGrouper';

export interface AppState {
  // Model state
  model: THREE.Mesh | null;
  geometry: THREE.BufferGeometry | null;
  fileName: string;
  
  // Color analysis
  colorGroups: ColorGroup[];
  
  // UI state
  selectedColorIndex: number | null;
  isLoading: boolean;
  error: string | null;
  quantizeLevel: number;
}

const initialState: AppState = {
  model: null,
  geometry: null,
  fileName: '',
  colorGroups: [],
  selectedColorIndex: null,
  isLoading: false,
  error: null,
  quantizeLevel: 8,
};

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MODEL'; payload: { mesh: THREE.Mesh; geometry: THREE.BufferGeometry; fileName: string } }
  | { type: 'SET_COLOR_GROUPS'; payload: ColorGroup[] }
  | { type: 'SELECT_COLOR'; payload: number | null }
  | { type: 'SET_QUANTIZE_LEVEL'; payload: number }
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
