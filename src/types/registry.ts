export type AlgorithmId = 'bubble' | 'selection' | 'insertion' | 'quick' | 'merge'
                        | 'bfs' | 'dfs' | 'dijkstra' | 'astar';

export type MetricField = 'comparisons' | 'swaps' | 'writes' | 'visited' | 'pathLength' | 'pathCost';

export interface AlgorithmDescriptor {
  id: AlgorithmId;
  category: 'sorting' | 'pathfinding';
  displayName: string;
  pseudocode: string[];
  bigO: { time: string; space: string };
  metricSchema: MetricField[];
  supportsWeights?: boolean;
  guaranteesOptimalPath?: boolean;
  usesFrontier?: 'stack' | 'queue' | 'priority-queue';
}
