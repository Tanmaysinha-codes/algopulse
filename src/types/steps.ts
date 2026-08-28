export interface SortMetrics { comparisons: number; swaps: number; writes: number; elapsedMs: number; }

export type SortStepEvent =
  | { type: 'SORT_STEP'; array: number[]; comparing: [number, number] | null;
      swapping: [number, number] | null; sorted: number[]; pivot: number | null;
      auxRange: [number, number] | null; activeLine: number; metrics: SortMetrics }
  | { type: 'SORT_COMPLETE'; array: number[]; sorted: number[]; metrics: SortMetrics };

export interface PathMetrics { visited: number; pathLength: number; pathCost: number; elapsedMs: number; }

export type GridNode = {
  kind: 'floor' | 'wall' | 'weight' | 'start' | 'target';
  state: 'default' | 'visited' | 'path';
};

export type PathStepEvent =
  | { type: 'PATH_VISIT'; grid: GridNode[][]; visited: [number, number]; frontierSize: number;
      activeLine: number; metrics: PathMetrics }
  | { type: 'PATH_TRACEBACK'; grid: GridNode[][]; pathNode: [number, number]; metrics: PathMetrics }
  | { type: 'PATH_FOUND'; grid: GridNode[][]; optimal: boolean; metrics: PathMetrics }
  | { type: 'PATH_NOT_FOUND'; grid: GridNode[][]; metrics: PathMetrics };

export type HistoryEntry = SortStepEvent | PathStepEvent;
