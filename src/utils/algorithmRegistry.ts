import { AlgorithmId, AlgorithmDescriptor } from '../types/registry';

export const ALGORITHM_REGISTRY: Record<AlgorithmId, AlgorithmDescriptor> = {
  bubble: {
    id: 'bubble',
    category: 'sorting',
    displayName: 'Bubble Sort',
    pseudocode: [
      'for i = 0 to n - 1',
      '  for j = 0 to n - i - 2',
      '    if array[j] > array[j + 1]',
      '      swap(array[j], array[j + 1])'
    ],
    bigO: { time: 'O(n²)', space: 'O(1)' },
    metricSchema: ['comparisons', 'swaps']
  },
  selection: {
    id: 'selection',
    category: 'sorting',
    displayName: 'Selection Sort',
    pseudocode: [
      'for i = 0 to n - 1',
      '  minIndex = i',
      '  for j = i + 1 to n - 1',
      '    if array[j] < array[minIndex]',
      '      minIndex = j',
      '  if minIndex != i',
      '    swap(array[i], array[minIndex])'
    ],
    bigO: { time: 'O(n²)', space: 'O(1)' },
    metricSchema: ['comparisons', 'swaps']
  },
  insertion: {
    id: 'insertion',
    category: 'sorting',
    displayName: 'Insertion Sort',
    pseudocode: [
      'for i = 1 to n - 1',
      '  key = array[i]',
      '  j = i - 1',
      '  while j >= 0 and array[j] > key',
      '    array[j + 1] = array[j]',
      '    j = j - 1',
      '  array[j + 1] = key'
    ],
    bigO: { time: 'O(n²)', space: 'O(1)' },
    metricSchema: ['comparisons', 'swaps']
  },
  quick: {
    id: 'quick',
    category: 'sorting',
    displayName: 'Quick Sort',
    pseudocode: [
      'function quickSort(low, high)',
      '  if low < high',
      '    pivotIndex = partition(low, high)',
      '    quickSort(low, pivotIndex - 1)',
      '    quickSort(pivotIndex + 1, high)',
      'function partition(low, high)',
      '  pivot = array[high]',
      '  i = low - 1',
      '  for j = low to high - 1',
      '    if array[j] < pivot',
      '      i++',
      '      swap(array[i], array[j])',
      '  swap(array[i + 1], array[high])',
      '  return i + 1'
    ],
    bigO: { time: 'O(n log n)', space: 'O(log n)' },
    metricSchema: ['comparisons', 'swaps']
  },
  merge: {
    id: 'merge',
    category: 'sorting',
    displayName: 'Merge Sort',
    pseudocode: [
      'function mergeSort(left, right)',
      '  if left < right',
      '    mid = (left + right) / 2',
      '    mergeSort(left, mid)',
      '    mergeSort(mid + 1, right)',
      '    merge(left, mid, right)',
      'function merge(left, mid, right)',
      '  copy data to aux arrays L and R',
      '  i = 0, j = 0, k = left',
      '  while i < L.length and j < R.length',
      '    if L[i] <= R[j]',
      '      array[k++] = L[i++]',
      '    else',
      '      array[k++] = R[j++]',
      '  copy remaining elements of L and R'
    ],
    bigO: { time: 'O(n log n)', space: 'O(n)' },
    metricSchema: ['comparisons', 'writes']
  },
  bfs: {
    id: 'bfs',
    category: 'pathfinding',
    displayName: 'Breadth-First Search',
    pseudocode: [
      'queue = [startNode]',
      'while queue is not empty',
      '  current = queue.dequeue()',
      '  if current is target',
      '    return path',
      '  for each neighbor of current',
      '    if neighbor is not visited and not wall',
      '      mark neighbor as visited',
      '      neighbor.parent = current',
      '      queue.enqueue(neighbor)'
    ],
    bigO: { time: 'O(V + E)', space: 'O(V)' },
    metricSchema: ['visited', 'pathLength'],
    supportsWeights: false,
    guaranteesOptimalPath: false,
    usesFrontier: 'queue'
  },
  dfs: {
    id: 'dfs',
    category: 'pathfinding',
    displayName: 'Depth-First Search',
    pseudocode: [
      'stack = [startNode]',
      'while stack is not empty',
      '  current = stack.pop()',
      '  if current is target',
      '    return path',
      '  if current is not visited',
      '    mark current as visited',
      '    for each neighbor of current',
      '      if neighbor is not visited and not wall',
      '        neighbor.parent = current',
      '        stack.push(neighbor)'
    ],
    bigO: { time: 'O(V + E)', space: 'O(V)' },
    metricSchema: ['visited', 'pathLength'],
    supportsWeights: false,
    guaranteesOptimalPath: false,
    usesFrontier: 'stack'
  },
  dijkstra: {
    id: 'dijkstra',
    category: 'pathfinding',
    displayName: 'Dijkstra\'s Algorithm',
    pseudocode: [
      'pq = new PriorityQueue()',
      'startNode.cost = 0',
      'pq.enqueue(startNode, 0)',
      'while pq is not empty',
      '  current = pq.dequeue()',
      '  if current is target',
      '    return path',
      '  for each neighbor of current',
      '    newCost = current.cost + edgeCost(current, neighbor)',
      '    if newCost < neighbor.cost',
      '      neighbor.cost = newCost',
      '      neighbor.parent = current',
      '      pq.enqueue(neighbor, newCost)'
    ],
    bigO: { time: 'O((V + E) log V)', space: 'O(V)' },
    metricSchema: ['visited', 'pathLength', 'pathCost'],
    supportsWeights: true,
    guaranteesOptimalPath: true,
    usesFrontier: 'priority-queue'
  },
  astar: {
    id: 'astar',
    category: 'pathfinding',
    displayName: 'A* Search',
    pseudocode: [
      'pq = new PriorityQueue()',
      'startNode.cost = 0',
      'pq.enqueue(startNode, 0)',
      'while pq is not empty',
      '  current = pq.dequeue()',
      '  if current is target',
      '    return path',
      '  for each neighbor of current',
      '    newCost = current.cost + edgeCost(current, neighbor)',
      '    if newCost < neighbor.cost',
      '      neighbor.cost = newCost',
      '      neighbor.parent = current',
      '      priority = newCost + heuristic(neighbor, target)',
      '      pq.enqueue(neighbor, priority)'
    ],
    bigO: { time: 'O((V + E) log V)', space: 'O(V)' },
    metricSchema: ['visited', 'pathLength', 'pathCost'],
    supportsWeights: true,
    guaranteesOptimalPath: true,
    usesFrontier: 'priority-queue'
  }
};
