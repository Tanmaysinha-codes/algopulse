import { RNG } from '../../utils/rng';

export type ArrayDistribution = 
  | 'random'
  | 'nearly_sorted'
  | 'reversed'
  | 'few_unique'
  | 'pyramid'
  | 'sine_wave'
  | 'custom';

export interface ArrayPresetOption {
  id: ArrayDistribution;
  label: string;
  description: string;
  hint: string;
  badge?: string;
}

export const ARRAY_PRESET_OPTIONS: ArrayPresetOption[] = [
  {
    id: 'random',
    label: 'Randomized Uniform',
    description: 'Uniformly distributed random values',
    hint: 'Standard benchmark for comparing average-case O(n log n) vs O(n²).'
  },
  {
    id: 'nearly_sorted',
    label: 'Nearly Sorted (~92% In-Order)',
    description: 'Sorted array with ~8% random pairs swapped',
    hint: 'Watch Insertion Sort achieve O(n) linear performance, beating Quick Sort!',
    badge: 'Insertion Sort Superpower'
  },
  {
    id: 'reversed',
    label: 'Reverse Order (Strictly Descending)',
    description: 'Elements strictly sorted from N down to 1',
    hint: 'Worst-case input for naive Bubble Sort and Quick Sort (O(n²) degradation).',
    badge: 'Worst Case Test'
  },
  {
    id: 'few_unique',
    label: 'Few Unique / Heavy Duplicates',
    description: 'Values sampled from only 4 discrete levels',
    hint: 'Tests partitioning efficiency and stability when handling identical keys.',
    badge: 'Partition Stress'
  },
  {
    id: 'pyramid',
    label: 'Pyramid / Bitonic Peak',
    description: 'Ascends to a central peak then descends',
    hint: 'Evaluates symmetric bidirectional behavior and pivot balance.'
  },
  {
    id: 'sine_wave',
    label: 'Sine Wave Oscillations',
    description: 'Smooth harmonic trigonometric oscillations',
    hint: 'Repeated peaks and troughs testing local inversion counts.'
  },
  {
    id: 'custom',
    label: 'Custom Array Input',
    description: 'Input your own comma-separated list of numbers',
    hint: 'Test any custom edge case or textbook example sequence.'
  }
];

/**
 * Generates an array according to the chosen distribution preset and RNG seed.
 */
export function generateArray(
  distribution: ArrayDistribution, 
  size: number, 
  seed: number,
  customInput?: number[]
): number[] {
  const rng = new RNG(seed);

  switch (distribution) {
    case 'random':
      return Array.from({ length: size }, () => rng.nextInt(1, size + 1));

    case 'nearly_sorted': {
      // Start with perfectly sorted array
      const arr = Array.from({ length: size }, (_, i) => i + 1);
      // Swap ~8% of elements (at least 2 swaps)
      const swapCount = Math.max(2, Math.floor(size * 0.08));
      for (let s = 0; s < swapCount; s++) {
        const i = rng.nextInt(0, size);
        const j = rng.nextInt(0, size);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }

    case 'reversed':
      // Strictly descending from size down to 1
      return Array.from({ length: size }, (_, i) => size - i);

    case 'few_unique': {
      // Pick 4 distinct tier values
      const tiers = [
        Math.max(1, Math.round(size * 0.15)),
        Math.max(2, Math.round(size * 0.40)),
        Math.max(3, Math.round(size * 0.65)),
        size
      ];
      return Array.from({ length: size }, () => tiers[rng.nextInt(0, tiers.length)]);
    }

    case 'pyramid': {
      const arr: number[] = new Array(size);
      const mid = Math.floor(size / 2);
      // Ascending left half
      for (let i = 0; i <= mid; i++) {
        arr[i] = Math.max(1, Math.round(((i + 1) / (mid + 1)) * size));
      }
      // Descending right half
      for (let i = mid + 1; i < size; i++) {
        const remaining = size - i;
        arr[i] = Math.max(1, Math.round((remaining / (size - mid)) * size));
      }
      return arr;
    }

    case 'sine_wave': {
      const waves = 2.5;
      return Array.from({ length: size }, (_, i) => {
        const normalized = Math.sin((i / size) * Math.PI * 2 * waves);
        // Map from [-1, 1] to [1, size]
        return Math.max(1, Math.round(((normalized + 1) / 2) * (size - 1)) + 1);
      });
    }

    case 'custom': {
      if (customInput && customInput.length > 0) {
        return [...customInput];
      }
      // Fallback if custom empty
      return [12, 45, 8, 23, 67, 34, 90, 51, 19, 73, 4, 38];
    }

    default:
      return Array.from({ length: size }, () => rng.nextInt(1, size + 1));
  }
}
