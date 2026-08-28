import { describe, it, expect } from 'vitest';
import { generatePath } from './pathAlgos';
import { PathStepEvent } from '../../types/steps';
import { MinHeap } from '../../utils/minHeap';
import { GRID_ROWS, GRID_COLS } from '../../utils/constants';

describe('MinHeap', () => {
  it('maintains min-heap property and handles ties by insertion order', () => {
    const heap = new MinHeap<string>();
    heap.enqueue('A', 5);
    heap.enqueue('B', 3);
    heap.enqueue('C', 7);
    heap.enqueue('D', 3); // Tie with B, but inserted later

    expect(heap.dequeue()).toBe('B');
    expect(heap.dequeue()).toBe('D');
    expect(heap.dequeue()).toBe('A');
    expect(heap.dequeue()).toBe('C');
    expect(heap.dequeue()).toBeUndefined();
  });
});

describe('Pathfinding Algorithms Correctness', () => {
  const getOutput = (gen: Generator<PathStepEvent>): PathStepEvent => {
    let last: PathStepEvent | undefined;
    for (const step of gen) last = step;
    if (!last) throw new Error('Path generator produced no events');
    return last;
  };

  it('finds shortest path for BFS, Dijkstra, A*', () => {
    // 3x3 empty grid, start at 0, target at 8
    const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);
    const startNode = 0;
    const targetNode = 2 * GRID_COLS + 2; // (2, 2)
    
    const bfs = getOutput(generatePath('bfs', startNode, targetNode, gridMap, false));
    const dijkstra = getOutput(generatePath('dijkstra', startNode, targetNode, gridMap, false));
    const astar = getOutput(generatePath('astar', startNode, targetNode, gridMap, false));

    expect(bfs.type).toBe('PATH_FOUND');
    // Path length in 4-dir from (0,0) to (2,2) is 4 edges (5 nodes including start) -> pathLength = 4
    expect(bfs.metrics.pathLength).toBe(4);
    
    expect(dijkstra.type).toBe('PATH_FOUND');
    expect(dijkstra.metrics.pathLength).toBe(4);

    expect(astar.type).toBe('PATH_FOUND');
    expect(astar.metrics.pathLength).toBe(4);
  });

  it('respects weighted-route optimality (Dijkstra avoids weight, BFS ignores)', () => {
    const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);
    const startNode = 0;
    const targetNode = 2; // (0, 2)
    
    // Put a weight at (0,1)
    gridMap[1] = 2;

    const bfs = getOutput(generatePath('bfs', startNode, targetNode, gridMap, false));
    // BFS goes straight through (0,1) -> length 2
    expect(bfs.metrics.pathLength).toBe(2);

    const dijkstra = getOutput(generatePath('dijkstra', startNode, targetNode, gridMap, false));
    // Dijkstra goes around: (0,0) -> (1,0) -> (1,1) -> (1,2) -> (0,2) -> length 4
    expect(dijkstra.metrics.pathLength).toBe(4);
  });

  it('applies corner-cutting rule correctly for diagonals', () => {
    const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);
    // (0,0) to (1,1) diagonally.
    // Flanks: (0,1) and (1,0)
    gridMap[1] = 1; // Wall at North flank (0,1)

    const startNode = 0;
    const targetNode = GRID_COLS + 1; // (1,1)

    const dijkstra = getOutput(generatePath('dijkstra', startNode, targetNode, gridMap, true));
    
    // Because (0,1) is a wall, diagonal (0,0)->(1,1) is blocked.
    // Must go (0,0) -> (1,0) -> (1,1), so length is 2 instead of 1.
    expect(dijkstra.metrics.pathLength).toBe(2);
  });

  it('DFS pops in the correct reverse-push order', () => {
    const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);
    const startNode = 0;
    const targetNode = GRID_COLS - 1; // Keep the search running long enough to inspect DFS order
    
    const gen = generatePath('dfs', startNode, targetNode, gridMap, false);
    
    let firstVisit = null;
    let secondVisit = null;
    
    for (const step of gen) {
      if (step.type === 'PATH_VISIT') {
        if (!firstVisit) firstVisit = step;
        else if (!secondVisit) {
          secondVisit = step;
          break;
        }
      }
    }

    // Start node is (0,0)
    // Neighbors in canonical 4-dir order: N, E, S, W
    // Pushed in reverse: W, S, E, N
    // Popped: N, E, S, W
    // N is blocked (-1,0), E is (0,1), S is (1,0), W is blocked.
    // E is the first valid popped neighbor.
    
    if (!secondVisit) throw new Error('DFS produced fewer than two visits');
    expect(secondVisit.visited).toEqual([0, 1]); // East is visited first!
  });
});
