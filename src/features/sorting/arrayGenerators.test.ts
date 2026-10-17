import { describe, it, expect } from 'vitest';
import { generateArray } from './arrayGenerators';

describe('Array Distribution Generators', () => {
  const size = 50;
  const seed = 9999;

  it('generates deterministic random arrays from identical seeds', () => {
    const a1 = generateArray('random', size, seed);
    const a2 = generateArray('random', size, seed);
    expect(a1).toEqual(a2);
    expect(a1.length).toBe(size);
    expect(Math.min(...a1)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...a1)).toBeLessThanOrEqual(size);
  });

  it('generates nearly sorted array with high in-order percentage', () => {
    const arr = generateArray('nearly_sorted', size, seed);
    expect(arr.length).toBe(size);

    let inOrderCount = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] <= arr[i + 1]) inOrderCount++;
    }
    // At least 80% of adjacent pairs should be in order
    const inOrderRatio = inOrderCount / (size - 1);
    expect(inOrderRatio).toBeGreaterThan(0.80);
  });

  it('generates strictly reversed array', () => {
    const arr = generateArray('reversed', size, seed);
    expect(arr.length).toBe(size);
    expect(arr[0]).toBe(size);
    expect(arr[size - 1]).toBe(1);
    for (let i = 0; i < size - 1; i++) {
      expect(arr[i]).toBeGreaterThan(arr[i + 1]);
    }
  });

  it('generates few unique array with only 4 distinct values', () => {
    const arr = generateArray('few_unique', size, seed);
    expect(arr.length).toBe(size);
    const uniqueValues = new Set(arr);
    expect(uniqueValues.size).toBeLessThanOrEqual(4);
  });

  it('generates pyramid (bitonic) array with peak in center', () => {
    const arr = generateArray('pyramid', size, seed);
    expect(arr.length).toBe(size);
    const mid = Math.floor(size / 2);
    expect(arr[mid]).toBe(size);
    expect(arr[0]).toBeLessThan(arr[mid]);
    expect(arr[size - 1]).toBeLessThan(arr[mid]);
  });

  it('generates sine wave array within valid bounds', () => {
    const arr = generateArray('sine_wave', size, seed);
    expect(arr.length).toBe(size);
    for (const val of arr) {
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(size);
    }
  });

  it('respects custom input array', () => {
    const custom = [99, 12, 45, 3];
    const arr = generateArray('custom', size, seed, custom);
    expect(arr).toEqual(custom);
  });
});
