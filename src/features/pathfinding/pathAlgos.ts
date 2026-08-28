import { GridNode, PathStepEvent, PathMetrics } from '../../types/steps';
import { GRID_ROWS, GRID_COLS, WEIGHT_COST, DIRECTIONS_4, DIRECTIONS_8 } from '../../utils/constants';
import { AlgorithmId } from '../../types/registry';
import { ALGORITHM_REGISTRY } from '../../utils/algorithmRegistry';
import { MinHeap } from '../../utils/minHeap';

export function buildGrid(startNode: number, targetNode: number, gridMap: number[]): GridNode[][] {
  const grid: GridNode[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: GridNode[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const idx = r * GRID_COLS + c;
      let kind: GridNode['kind'] = 'floor';
      if (idx === startNode) kind = 'start';
      else if (idx === targetNode) kind = 'target';
      else if (gridMap[idx] === 1) kind = 'wall';
      else if (gridMap[idx] === 2) kind = 'weight';
      
      row.push({ kind, state: 'default' });
    }
    grid.push(row);
  }
  return grid;
}

export function isOptimalForRun(algorithmId: AlgorithmId, diagonalEnabled: boolean): boolean {
  if (algorithmId === 'bfs') return !diagonalEnabled;
  return ALGORITHM_REGISTRY[algorithmId].guaranteesOptimalPath ?? false;
}

function getNeighbors(r: number, c: number, gridMap: number[], diagonalEnabled: boolean, reverse: boolean) {
  let dirs = diagonalEnabled ? DIRECTIONS_8 : DIRECTIONS_4;
  if (reverse) dirs = [...dirs].reverse();

  const neighbors = [];
  for (const [dr, dc] of dirs) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= GRID_ROWS || nc < 0 || nc >= GRID_COLS) continue;
    
    // Orthogonal wall check
    if (gridMap[nr * GRID_COLS + nc] === 1) continue;

    // Corner cutting rule
    if (dr !== 0 && dc !== 0) {
      const isWallN = gridMap[(r + dr) * GRID_COLS + c] === 1;
      const isWallE = gridMap[r * GRID_COLS + (c + dc)] === 1;
      if (isWallN || isWallE) continue;
    }

    neighbors.push({ r: nr, c: nc, dr, dc });
  }
  return neighbors;
}

function heuristic(r1: number, c1: number, r2: number, c2: number) {
  const dx = Math.abs(c1 - c2);
  const dy = Math.abs(r1 - r2);
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

export function* generatePath(algorithmId: AlgorithmId, startNode: number, targetNode: number, gridMap: number[], diagonalEnabled: boolean): Generator<PathStepEvent> {
  const grid = buildGrid(startNode, targetNode, gridMap);
  const startR = Math.floor(startNode / GRID_COLS);
  const startC = startNode % GRID_COLS;
  const targetR = Math.floor(targetNode / GRID_COLS);
  const targetC = targetNode % GRID_COLS;

  const supportsWeights = ALGORITHM_REGISTRY[algorithmId].supportsWeights === true;
  const optimal = isOptimalForRun(algorithmId, diagonalEnabled);
  
  const metrics: PathMetrics = { visited: 0, pathLength: 0, pathCost: 0, elapsedMs: 0 };
  const startMs = performance.now();

  const getCost = (r: number, c: number, dr: number, dc: number) => {
    const base = (dr !== 0 && dc !== 0) ? Math.SQRT2 : 1;
    const isWeight = gridMap[r * GRID_COLS + c] === 2;
    const multiplier = (isWeight && supportsWeights) ? WEIGHT_COST : 1;
    return base * multiplier;
  };

  const copyGrid = (g: GridNode[][], overrideR = -1, overrideC = -1, overrideState?: GridNode['state']) => {
    const newGrid = [...g];
    if (overrideR !== -1) {
      newGrid[overrideR] = [...newGrid[overrideR]];
      newGrid[overrideR][overrideC] = { ...newGrid[overrideR][overrideC], state: overrideState! };
    }
    return newGrid;
  };

  let currentGrid = grid;
  const parent = new Map<number, { r: number, c: number }>();
  const gScore = new Map<number, number>();
  gScore.set(startNode, 0);

  let found = false;

  // BFS / DFS
  if (algorithmId === 'bfs' || algorithmId === 'dfs') {
    const isDFS = algorithmId === 'dfs';
    const collection = [startNode];
    const visited = new Set<number>();
    visited.add(startNode);
    currentGrid = copyGrid(currentGrid, startR, startC, 'visited');

    while (collection.length > 0) {
      const current = isDFS ? collection.pop()! : collection.shift()!;
      const r = Math.floor(current / GRID_COLS);
      const c = current % GRID_COLS;

      if (current === targetNode) {
        found = true;
        break;
      }

      metrics.visited++;
      metrics.elapsedMs = performance.now() - startMs;
      if (current !== startNode) {
        currentGrid = copyGrid(currentGrid, r, c, 'visited');
      }

      // yield visit
      yield { type: 'PATH_VISIT', grid: currentGrid, visited: [r, c], frontierSize: collection.length, activeLine: 5, metrics: {...metrics} };

      const neighbors = getNeighbors(r, c, gridMap, diagonalEnabled, isDFS);
      for (const { r: nr, c: nc } of neighbors) {
        const nextIdx = nr * GRID_COLS + nc;
        if (!visited.has(nextIdx)) {
          visited.add(nextIdx);
          parent.set(nextIdx, { r, c });
          collection.push(nextIdx);
        }
      }
    }
  } 
  // Dijkstra / A*
  else if (algorithmId === 'dijkstra' || algorithmId === 'astar') {
    const pq = new MinHeap<number>();
    pq.enqueue(startNode, 0);
    const visited = new Set<number>();

    while (!pq.isEmpty()) {
      const current = pq.dequeue()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const r = Math.floor(current / GRID_COLS);
      const c = current % GRID_COLS;

      if (current === targetNode) {
        found = true;
        break;
      }

      metrics.visited++;
      metrics.elapsedMs = performance.now() - startMs;
      if (current !== startNode) {
        currentGrid = copyGrid(currentGrid, r, c, 'visited');
      }

      yield { type: 'PATH_VISIT', grid: currentGrid, visited: [r, c], frontierSize: pq.size, activeLine: 5, metrics: {...metrics} };

      const neighbors = getNeighbors(r, c, gridMap, diagonalEnabled, false);
      for (const { r: nr, c: nc, dr, dc } of neighbors) {
        const nextIdx = nr * GRID_COLS + nc;
        if (visited.has(nextIdx)) continue;

        const currentG = gScore.get(current)!;
        const edgeCost = getCost(nr, nc, dr, dc);
        const nextG = currentG + edgeCost;

        if (!gScore.has(nextIdx) || nextG < gScore.get(nextIdx)!) {
          gScore.set(nextIdx, nextG);
          parent.set(nextIdx, { r, c });
          const priority = algorithmId === 'astar' ? nextG + heuristic(nr, nc, targetR, targetC) : nextG;
          pq.enqueue(nextIdx, priority);
        }
      }
    }
  }

  if (found) {
    let curr = targetNode;
    const pathIds = [];
    while (curr !== startNode) {
      pathIds.push(curr);
      const p = parent.get(curr)!;
      curr = p.r * GRID_COLS + p.c;
    }
    pathIds.reverse();

    for (const idx of pathIds) {
      const r = Math.floor(idx / GRID_COLS);
      const c = idx % GRID_COLS;
      const p = parent.get(idx)!;
      
      const edgeCost = getCost(r, c, r - p.r, c - p.c);
      metrics.pathLength++;
      metrics.pathCost += edgeCost;

      metrics.elapsedMs = performance.now() - startMs;
      if (idx !== targetNode) {
        currentGrid = copyGrid(currentGrid, r, c, 'path');
        yield { type: 'PATH_TRACEBACK', grid: currentGrid, pathNode: [r, c], metrics: {...metrics} };
      }
    }

    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'PATH_FOUND', grid: currentGrid, optimal, metrics: {...metrics} };
  } else {
    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'PATH_NOT_FOUND', grid: currentGrid, metrics: {...metrics} };
  }
}
