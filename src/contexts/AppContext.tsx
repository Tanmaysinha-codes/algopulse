import { useReducer, ReactNode, useEffect } from 'react';
import { AppContext } from './AppContextValue';
import { AlgorithmId } from '../types/registry';
import { SpeedPreset, GRID_ROWS, GRID_COLS } from '../utils/constants';
import { generateMaze, generatePresetMap, MapPresetType } from '../features/pathfinding/mazeAlgos';
import { serializeStateToUrl, deserializeStateFromUrl } from '../utils/urlState';

export type AppMode = 'sorting' | 'pathfinding';
export type Tool = 'wall' | 'weight' | 'start' | 'target' | 'erase';
export type BrushSize = 1 | 2 | 3;
export type TouchMode = 'draw' | 'pan';

export interface AppState {
  mode: AppMode;
  algorithmId: AlgorithmId;
  algorithmIdB: AlgorithmId;
  isRaceMode: boolean;
  stepsPerSecond: SpeedPreset;
  arraySize: number;
  diagonalEnabled: boolean;
  activeTool: Tool;
  brushSize: BrushSize;
  touchMode: TouchMode;
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
  | { type: 'SET_ALGORITHM_B'; payload: AlgorithmId }
  | { type: 'TOGGLE_RACE_MODE'; payload: boolean }
  | { type: 'SET_SPEED'; payload: SpeedPreset }
  | { type: 'SET_ARRAY_SIZE'; payload: number }
  | { type: 'TOGGLE_DIAGONAL'; payload: boolean }
  | { type: 'SET_TOOL'; payload: Tool }
  | { type: 'SET_BRUSH_SIZE'; payload: BrushSize }
  | { type: 'SET_TOUCH_MODE'; payload: TouchMode }
  | { type: 'SET_SEED'; payload: number }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'TOGGLE_AUDIO'; payload: boolean }
  | { type: 'PAINT_CELL'; payload: { index: number, tool: Tool } }
  | { type: 'PAINT_CELLS'; payload: { indices: number[], tool: Tool } }
  | { type: 'MOVE_START'; payload: number }
  | { type: 'MOVE_TARGET'; payload: number }
  | { type: 'LOAD_PRESET'; payload: MapPresetType }
  | { type: 'SET_GRID_MAP'; payload: number[] }
  | { type: 'CLEAR_WALLS' }
  | { type: 'CLEAR_WEIGHTS' }
  | { type: 'CLEAR_GRID' };

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('algopulse:theme');
  if (stored === 'light' || stored === 'dark') return stored;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
};

const defaultState: AppState = {
  mode: 'sorting',
  algorithmId: 'quick',
  algorithmIdB: 'bubble',
  isRaceMode: false,
  stepsPerSecond: 20,
  arraySize: 50,
  diagonalEnabled: false,
  activeTool: 'wall',
  brushSize: 1,
  touchMode: 'draw',
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
        algorithmId: action.payload === 'sorting' ? 'quick' : 'astar',
        algorithmIdB: action.payload === 'sorting' ? 'bubble' : 'dijkstra'
      };
    case 'SET_ALGORITHM': return { ...state, algorithmId: action.payload };
    case 'SET_ALGORITHM_B': return { ...state, algorithmIdB: action.payload };
    case 'TOGGLE_RACE_MODE': return { ...state, isRaceMode: action.payload };
    case 'SET_SPEED': return { ...state, stepsPerSecond: action.payload };
    case 'SET_ARRAY_SIZE': return { ...state, arraySize: action.payload };
    case 'TOGGLE_DIAGONAL': return { ...state, diagonalEnabled: action.payload };
    case 'SET_TOOL': return { ...state, activeTool: action.payload };
    case 'SET_BRUSH_SIZE': return { ...state, brushSize: action.payload };
    case 'SET_TOUCH_MODE': return { ...state, touchMode: action.payload };
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
    
    case 'MOVE_START': {
      const idx = action.payload;
      if (idx === state.targetNode || idx < 0 || idx >= GRID_ROWS * GRID_COLS) return state;
      return { ...state, startNode: idx };
    }
    
    case 'MOVE_TARGET': {
      const idx = action.payload;
      if (idx === state.startNode || idx < 0 || idx >= GRID_ROWS * GRID_COLS) return state;
      return { ...state, targetNode: idx };
    }

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

    case 'PAINT_CELLS': {
      const { indices, tool } = action.payload;
      const { startNode, targetNode, gridMap } = state;
      const newMap = [...gridMap];
      let updated = false;

      for (const idx of indices) {
        if (idx === startNode || idx === targetNode || idx < 0 || idx >= GRID_ROWS * GRID_COLS) continue;
        const val = tool === 'wall' ? 1 : tool === 'weight' ? 2 : tool === 'erase' ? 0 : -1;
        if (val !== -1 && newMap[idx] !== val) {
          newMap[idx] = val;
          updated = true;
        }
      }

      return updated ? { ...state, gridMap: newMap } : state;
    }

    case 'LOAD_PRESET': {
      const nextSeed = Date.now();
      const newGrid = generatePresetMap(action.payload, nextSeed, state.startNode, state.targetNode);
      return {
        ...state,
        seed: nextSeed,
        gridMap: newGrid
      };
    }

    case 'SET_GRID_MAP':
      return { ...state, gridMap: action.payload };

    case 'CLEAR_WALLS':
      return {
        ...state,
        gridMap: state.gridMap.map(val => val === 1 ? 0 : val)
      };

    case 'CLEAR_WEIGHTS':
      return {
        ...state,
        gridMap: state.gridMap.map(val => val === 2 ? 0 : val)
      };

    case 'CLEAR_GRID':
      return { ...state, gridMap: new Array(GRID_ROWS * GRID_COLS).fill(0) };

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
