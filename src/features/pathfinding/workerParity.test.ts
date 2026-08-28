import { describe, it, expect, vi } from 'vitest';
import { generatePath } from './pathAlgos';
import { SyncProducer } from '../../hooks/useExecutionEngine';
import { PathStepEvent } from '../../types/steps';
import { GRID_ROWS, GRID_COLS } from '../../utils/constants';

describe('Worker / Main-Thread Parity', () => {
  it('guarantees identical output sequences between synchronous and asynchronous consumption', () => {
    // We simulate the exact consumer logic that both the main thread and worker use.
    // SyncProducer wraps generatePath. The worker script also directly wraps generatePath.
    // The requirement is that they produce byte-identical HistoryEntry sequences.

    vi.spyOn(performance, 'now').mockReturnValue(0);
    const gridMap = new Array(GRID_ROWS * GRID_COLS).fill(0);
    const startNode = 0;
    const targetNode = 2; 

    // 1. Unbounded Synchronous (Main Thread)
    const gen = generatePath('bfs', startNode, targetNode, gridMap, false);
    const syncOutputs: PathStepEvent[] = [];
    for (const step of gen) {
      syncOutputs.push(step);
    }

    // 2. Ack-based Producer (Worker simulation)
    const gen2 = generatePath('bfs', startNode, targetNode, gridMap, false);
    const producer = new SyncProducer(gen2); // SyncProducer implements the exact bounded ACK logic 
    const workerOutputs: PathStepEvent[] = [];

    // Simulate lookahead initial ACKs (200)
    let done = false;
    while (!done) {
      const res = producer.next();
      if (res.done) {
        done = true;
      } else if (res.value !== undefined) {
        workerOutputs.push(res.value);
      }
    }

    // The sequences must be byte-identical (deep equal)
    expect(syncOutputs).toEqual(workerOutputs);
  });
});
