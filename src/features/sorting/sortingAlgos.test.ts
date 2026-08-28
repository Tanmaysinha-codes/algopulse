import { describe, it, expect } from 'vitest';
import { generateSort } from './sortingAlgos';
import { AlgorithmId } from '../../types/registry';

describe('Sorting Algorithms Correctness', () => {
  const testCases = [
    { name: 'already sorted', input: [1, 2, 3, 4, 5] },
    { name: 'reverse sorted', input: [5, 4, 3, 2, 1] },
    { name: 'random elements', input: [3, 1, 4, 1, 5, 9, 2, 6, 5] },
    { name: 'all same elements', input: [4, 4, 4, 4, 4] },
    { name: 'empty array', input: [] },
    { name: 'single element', input: [42] }
  ];

  const algorithms: AlgorithmId[] = ['bubble', 'selection', 'insertion', 'quick', 'merge'];

  algorithms.forEach((algo) => {
    describe(`${algo} sort`, () => {
      testCases.forEach(({ name, input }) => {
        it(`sorts correctly for: ${name}`, () => {
          const gen = generateSort(algo, input);
          let lastArray: number[] | null = null;
          
          for (const step of gen) {
            lastArray = step.array;
            if (step.type === 'SORT_COMPLETE') {
              break;
            }
          }

          const expected = [...input].sort((a, b) => a - b);
          // If input is empty, lastArray might be null if gen is empty, 
          // but our generators always yield SORT_COMPLETE at least.
          expect(lastArray).toEqual(expected);
        });
      });
    });
  });

  it('collects correct metrics for bubble sort (reverse array)', () => {
    const gen = generateSort('bubble', [3, 2, 1]);
    let finalStep;
    for (const step of gen) {
      finalStep = step;
    }
    expect(finalStep?.metrics).toBeDefined();
    // For [3,2,1]:
    // i=0: 3>2 (swap), 3>1 (swap) -> 2 comparisons, 2 swaps
    // i=1: 2>1 (swap) -> 1 comparison, 1 swap
    // Total: 3 comparisons, 3 swaps
    expect(finalStep?.metrics.comparisons).toBe(3);
    expect(finalStep?.metrics.swaps).toBe(3);
  });
});
