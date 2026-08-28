import { AppState, AppMode } from '../contexts/AppContext';
import { AlgorithmId } from '../types/registry';
import { SpeedPreset, GRID_ROWS, GRID_COLS } from './constants';

function encodeGrid(grid: number[]): string {
  if (!grid || grid.length === 0) return '';
  let rle = '';
  let current = grid[0];
  let count = 1;
  for (let i = 1; i < grid.length; i++) {
    if (grid[i] === current) {
      count++;
    } else {
      rle += `${count}x${current}.`;
      current = grid[i];
      count = 1;
    }
  }
  rle += `${count}x${current}`;
  return rle;
}

function decodeGrid(rle: string): number[] {
  const grid = new Array(GRID_ROWS * GRID_COLS).fill(0);
  if (!rle) return grid;
  let idx = 0;
  const parts = rle.split('.');
  for (const part of parts) {
    const [cStr, vStr] = part.split('x');
    const count = parseInt(cStr, 10);
    const val = parseInt(vStr, 10);
    for (let i = 0; i < count && idx < grid.length; i++) {
      grid[idx++] = val;
    }
  }
  return grid;
}

export function serializeStateToUrl(state: Partial<AppState>) {
  const params = new URLSearchParams(window.location.search);
  if (state.mode) params.set('mode', state.mode);
  if (state.algorithmId) params.set('algo', state.algorithmId);
  if (state.stepsPerSecond) params.set('speed', state.stepsPerSecond.toString());
  if (state.arraySize) params.set('size', state.arraySize.toString());
  if (state.diagonalEnabled !== undefined) params.set('diag', state.diagonalEnabled ? '1' : '0');
  if (state.seed) params.set('seed', state.seed.toString());
  
  if (state.mode === 'pathfinding' && state.gridMap) {
    if (state.startNode !== undefined) params.set('start', state.startNode.toString());
    if (state.targetNode !== undefined) params.set('target', state.targetNode.toString());
    params.set('grid', encodeGrid(state.gridMap));
  } else {
    params.delete('start');
    params.delete('target');
    params.delete('grid');
  }
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}

export function deserializeStateFromUrl(): Partial<AppState> {
  const params = new URLSearchParams(window.location.search);
  const state: Partial<AppState> = {};

  if (params.has('mode')) state.mode = params.get('mode') as AppMode;
  if (params.has('algo')) state.algorithmId = params.get('algo') as AlgorithmId;
  if (params.has('speed')) state.stepsPerSecond = Number(params.get('speed')) as SpeedPreset;
  if (params.has('size')) state.arraySize = Number(params.get('size'));
  if (params.has('diag')) state.diagonalEnabled = params.get('diag') === '1';
  if (params.has('seed')) state.seed = Number(params.get('seed'));

  if (state.mode === 'pathfinding') {
    if (params.has('start')) state.startNode = Number(params.get('start'));
    if (params.has('target')) state.targetNode = Number(params.get('target'));
    if (params.has('grid')) state.gridMap = decodeGrid(params.get('grid')!);
  }

  return state;
}
