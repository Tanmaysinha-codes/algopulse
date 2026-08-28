import { useReducer, ReactNode, useEffect } from 'react';
import { AppContext } from './AppContextValue';
import { AlgorithmId } from '../types/registry';
import { SpeedPreset, GRID_ROWS, GRID_COLS } from '../utils/constants';
import { generateMaze } from '../features/pathfinding/mazeAlgos';
import { serializeStateToUrl, deserializeStateFromUrl } from '../utils/urlState';

export type AppMode = 'sorting' | 'pathfinding';
export type Tool = 'wall' | 'weight' | 'start' | 'target' | 'erase';

export interface AppState {
  mode: AppMode;
  algorithmId: AlgorithmId;
  stepsPerSecond: SpeedPreset;
  arraySize: number;
  diagonalEnabled: boolean;
  activeTool: Tool;
  seed: number;
  theme: 'light' | 'dark';
  audioEnabled: boolean;
  startNode: number;
  targetNode: number;
  gridMap: number[];
}

export type Action =
  | { type: 'SET_MODE'; payload: AppMode }
  | { type: 'SET_ALGORITHM'; payload: AlgorithmId }
  | { type: 'SET_SPEED'; payload: SpeedPreset }
  | { type: 'SET_ARRAY_SIZE'; payload: number }
  | { type: 'TOGGLE_DIAGONAL'; payload: boolean }
  | { type: 'SET_TOOL'; payload: Tool }
  | { type: 'SET_SEED'; payload: number }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_AUDIO'; payload: boolean }
  | { type: 'PAINT_CELL'; payload: { index: number, tool: Tool } };

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('algopulse:theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

const defaultState: AppState = {
  mode: 'sorting',
  algorithmId: 'bubble',
  stepsPerSecond: 20,
  arraySize: 50,
  diagonalEnabled: false,
  activeTool: 'wall',
  seed: 12345,
  theme: getInitialTheme(),
  audioEnabled: true,
  startNode: 9 * GRID_COLS + 9,
  targetNode: 9 * GRID_COLS + 30,
  gridMap: new Array(GRID_ROWS * GRID_COLS).fill(0),
};

const initialState: AppState = {
  ...defaultState,
  ...deserializeStateFromUrl()
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_MODE':
      return { 
        ...state, 
        mode: action.payload, 
        algorithmId: action.payload === 'sorting' ? 'bubble' : 'bfs' 
      };
    case 'SET_ALGORITHM': return { ...state, algorithmId: action.payload };
    case 'SET_SPEED': return { ...state, stepsPerSecond: action.payload };
    case 'SET_ARRAY_SIZE': return { ...state, arraySize: action.payload };
    case 'TOGGLE_DIAGONAL': return { ...state, diagonalEnabled: action.payload };
    case 'SET_TOOL': return { ...state, activeTool: action.payload };
    case 'SET_SEED': 
      if (state.mode === 'pathfinding') {
        return {
           ...state,
           seed: action.payload,
           gridMap: generateMaze(action.payload, state.startNode, state.targetNode)
        };
      }
      return { ...state, seed: action.payload };
    case 'SET_THEME': 
      localStorage.setItem('algopulse:theme', action.payload);
      return { ...state, theme: action.payload };
    case 'TOGGLE_AUDIO': return { ...state, audioEnabled: action.payload };
    case 'PAINT_CELL': {
      const { index, tool } = action.payload;
      const { startNode, targetNode, gridMap } = state;
      if (tool === 'start' && index !== targetNode) {
        return { ...state, startNode: index };
      }
      if (tool === 'target' && index !== startNode) {
        return { ...state, targetNode: index };
      }
      if (index === startNode || index === targetNode) {
        return state;
      }
      const newMap = [...gridMap];
      if (tool === 'wall') newMap[index] = 1;
      else if (tool === 'weight') newMap[index] = 2;
      else if (tool === 'erase') newMap[index] = 0;
      return { ...state, gridMap: newMap };
    }
    default: return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  useEffect(() => {
    serializeStateToUrl(state);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
