import { SortMetrics, SortStepEvent } from '../../types/steps';
import { AlgorithmId } from '../../types/registry';

function createMetrics(): SortMetrics {
  return { comparisons: 0, swaps: 0, writes: 0, elapsedMs: 0 };
}

export function* bubbleSort(initialArray: number[]): Generator<SortStepEvent> {
  const array = [...initialArray];
  const n = array.length;
  const metrics = createMetrics();
  const sorted: number[] = [];
  const startMs = performance.now();

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      metrics.comparisons++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: [j, j + 1], swapping: null, sorted: [...sorted], pivot: null, auxRange: null, activeLine: 2, metrics: { ...metrics } };

      if (array[j] > array[j + 1]) {
        metrics.swaps++;
        [array[j], array[j + 1]] = [array[j + 1], array[j]];
        metrics.elapsedMs = performance.now() - startMs;
        yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: [j, j + 1], sorted: [...sorted], pivot: null, auxRange: null, activeLine: 3, metrics: { ...metrics } };
      }
    }
    sorted.push(n - i - 1);
  }
  sorted.push(0);
  metrics.elapsedMs = performance.now() - startMs;
  yield { type: 'SORT_COMPLETE', array: [...array], sorted: array.map((_, index) => index), metrics: { ...metrics } };
}

export function* selectionSort(initialArray: number[]): Generator<SortStepEvent> {
  const array = [...initialArray];
  const n = array.length;
  const metrics = createMetrics();
  const sorted: number[] = [];
  const startMs = performance.now();

  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [...sorted], pivot: minIndex, auxRange: null, activeLine: 1, metrics: { ...metrics } };

    for (let j = i + 1; j < n; j++) {
      metrics.comparisons++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: [j, minIndex], swapping: null, sorted: [...sorted], pivot: minIndex, auxRange: null, activeLine: 3, metrics: { ...metrics } };

      if (array[j] < array[minIndex]) {
        minIndex = j;
        metrics.elapsedMs = performance.now() - startMs;
        yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [...sorted], pivot: minIndex, auxRange: null, activeLine: 4, metrics: { ...metrics } };
      }
    }
    if (minIndex !== i) {
      metrics.swaps++;
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: [i, minIndex], sorted: [...sorted], pivot: null, auxRange: null, activeLine: 6, metrics: { ...metrics } };
    }
    sorted.push(i);
  }
  sorted.push(n - 1);
  metrics.elapsedMs = performance.now() - startMs;
  yield { type: 'SORT_COMPLETE', array: [...array], sorted: array.map((_, index) => index), metrics: { ...metrics } };
}

export function* insertionSort(initialArray: number[]): Generator<SortStepEvent> {
  const array = [...initialArray];
  const n = array.length;
  const metrics = createMetrics();
  const sorted: number[] = [0];
  const startMs = performance.now();

  for (let i = 1; i < n; i++) {
    const key = array[i];
    let j = i - 1;
    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [...sorted], pivot: i, auxRange: null, activeLine: 1, metrics: { ...metrics } };

    let moved = false;
    while (j >= 0) {
      metrics.comparisons++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: [j, j + 1], swapping: null, sorted: [...sorted], pivot: j + 1, auxRange: null, activeLine: 3, metrics: { ...metrics } };

      if (array[j] > key) {
        metrics.swaps++; // Requirement specification: swaps applies to Insertion
        array[j + 1] = array[j];
        moved = true;
        metrics.elapsedMs = performance.now() - startMs;
        yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: [j, j + 1], sorted: [...sorted], pivot: j, auxRange: null, activeLine: 4, metrics: { ...metrics } };
        j = j - 1;
      } else {
        break;
      }
    }
    array[j + 1] = key;
    if (!sorted.includes(i)) sorted.push(i);
    if (moved) {
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [...sorted], pivot: j + 1, auxRange: null, activeLine: 6, metrics: { ...metrics } };
    }
  }
  metrics.elapsedMs = performance.now() - startMs;
  yield { type: 'SORT_COMPLETE', array: [...array], sorted: array.map((_, index) => index), metrics: { ...metrics } };
}

export function* quickSort(initialArray: number[]): Generator<SortStepEvent> {
  const array = [...initialArray];
  const metrics = createMetrics();
  const sorted: number[] = [];
  const startMs = performance.now();

  function* qs(low: number, high: number): Generator<SortStepEvent> {
    if (low < high) {
      const pivotIndex = yield* partition(low, high);
      sorted.push(pivotIndex);
      yield* qs(low, pivotIndex - 1);
      yield* qs(pivotIndex + 1, high);
    } else if (low === high) {
      if (!sorted.includes(low)) sorted.push(low);
    }
  }

  function* partition(low: number, high: number): Generator<SortStepEvent> {
    const pivot = array[high];
    let i = low - 1;
    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [...sorted], pivot: high, auxRange: null, activeLine: 6, metrics: { ...metrics } };

    for (let j = low; j < high; j++) {
      metrics.comparisons++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: [j, high], swapping: null, sorted: [...sorted], pivot: high, auxRange: null, activeLine: 9, metrics: { ...metrics } };

      if (array[j] < pivot) {
        i++;
        metrics.swaps++;
        [array[i], array[j]] = [array[j], array[i]];
        metrics.elapsedMs = performance.now() - startMs;
        yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: [i, j], sorted: [...sorted], pivot: high, auxRange: null, activeLine: 11, metrics: { ...metrics } };
      }
    }
    metrics.swaps++;
    [array[i + 1], array[high]] = [array[high], array[i + 1]];
    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: [i + 1, high], sorted: [...sorted], pivot: i + 1, auxRange: null, activeLine: 12, metrics: { ...metrics } };
    return i + 1;
  }

  yield* qs(0, array.length - 1);
  metrics.elapsedMs = performance.now() - startMs;
  yield { type: 'SORT_COMPLETE', array: [...array], sorted: array.map((_, index) => index), metrics: { ...metrics } };
}

export function* mergeSort(initialArray: number[]): Generator<SortStepEvent> {
  const array = [...initialArray];
  const metrics = createMetrics();
  const startMs = performance.now();

  function* ms(left: number, right: number): Generator<SortStepEvent> {
    if (left < right) {
      const mid = Math.floor((left + right) / 2);
      yield* ms(left, mid);
      yield* ms(mid + 1, right);
      yield* merge(left, mid, right);
    }
  }

  function* merge(left: number, mid: number, right: number): Generator<SortStepEvent> {
    const L = array.slice(left, mid + 1);
    const R = array.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;

    metrics.elapsedMs = performance.now() - startMs;
    yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [], pivot: null, auxRange: [left, right], activeLine: 7, metrics: { ...metrics } };

    while (i < L.length && j < R.length) {
      metrics.comparisons++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: [left + i, mid + 1 + j], swapping: null, sorted: [], pivot: null, auxRange: [left, right], activeLine: 10, metrics: { ...metrics } };

      if (L[i] <= R[j]) {
        array[k] = L[i];
        metrics.writes++;
        metrics.elapsedMs = performance.now() - startMs;
        yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [], pivot: null, auxRange: [left, right], activeLine: 11, metrics: { ...metrics } };
        i++;
      } else {
        array[k] = R[j];
        metrics.writes++;
        metrics.elapsedMs = performance.now() - startMs;
        yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [], pivot: null, auxRange: [left, right], activeLine: 13, metrics: { ...metrics } };
        j++;
      }
      k++;
    }

    while (i < L.length) {
      array[k] = L[i];
      metrics.writes++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [], pivot: null, auxRange: [left, right], activeLine: 14, metrics: { ...metrics } };
      i++; k++;
    }

    while (j < R.length) {
      array[k] = R[j];
      metrics.writes++;
      metrics.elapsedMs = performance.now() - startMs;
      yield { type: 'SORT_STEP', array: [...array], comparing: null, swapping: null, sorted: [], pivot: null, auxRange: [left, right], activeLine: 14, metrics: { ...metrics } };
      j++; k++;
    }
  }

  yield* ms(0, array.length - 1);
  metrics.elapsedMs = performance.now() - startMs;
  yield { type: 'SORT_COMPLETE', array: [...array], sorted: array.map((_, index) => index), metrics: { ...metrics } };
}

export function generateSort(algorithmId: AlgorithmId, initialArray: number[]): Generator<SortStepEvent> {
  switch (algorithmId) {
    case 'bubble': return bubbleSort(initialArray);
    case 'selection': return selectionSort(initialArray);
    case 'insertion': return insertionSort(initialArray);
    case 'quick': return quickSort(initialArray);
    case 'merge': return mergeSort(initialArray);
    default: throw new Error(`Unsupported sorting algorithm: ${algorithmId}`);
  }
}
