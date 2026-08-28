import { useRef, useState, useCallback, useEffect } from 'react';
import { HistoryEntry } from '../types/steps';
import { AlgorithmId } from '../types/registry';
import { LOOKAHEAD_BUFFER, MAX_HISTORY_STEPS } from '../utils/constants';

interface PathWorkerPayload {
  algorithmId: AlgorithmId;
  startNode: number;
  targetNode: number;
  gridMap: number[];
  diagonalEnabled: boolean;
}

export interface ProducerResult<T extends HistoryEntry = HistoryEntry> {
  value?: T;
  done: boolean;
}

export interface EngineProducer<T extends HistoryEntry = HistoryEntry> {
  next(): ProducerResult<T>;
  ack(count: number): void;
  cleanup(): void;
  onMessage?: () => void;
}

export class SyncProducer<T extends HistoryEntry = HistoryEntry> implements EngineProducer<T> {
  private acks = LOOKAHEAD_BUFFER;
  constructor(private gen: Generator<T>) {}
  next(): ProducerResult<T> {
    if (this.acks > 0) {
      const res = this.gen.next();
      if (res.done) return { done: true };
      this.acks--;
      return { done: false, value: res.value };
    }
    return { done: false }; 
  }
  ack(count: number) { this.acks += count; }
  cleanup() {}
}

export class WorkerProducer implements EngineProducer {
  private queue: HistoryEntry[] = [];
  private done = false;
  private worker: Worker | null = null;
  public onMessage?: () => void;

  constructor(payload: PathWorkerPayload, onFallback: () => void) {
    try {
      this.worker = new Worker(new URL('../workers/algorithmWorker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e) => {
        if (e.data.type === 'STEP') {
          this.queue.push(e.data.entry);
          if (this.onMessage) this.onMessage();
        } else if (e.data.type === 'DONE') {
          this.done = true;
          if (this.onMessage) this.onMessage();
        }
      };
      this.worker.onerror = () => {
        this.cleanup();
        onFallback();
      };
      this.worker.postMessage({ type: 'START', payload: { ...payload, lookahead: LOOKAHEAD_BUFFER } });
    } catch (e) {
      onFallback();
    }
  }

  next(): ProducerResult {
    if (this.queue.length > 0) return { value: this.queue.shift(), done: false };
    if (this.done) return { done: true };
    return { done: false };
  }

  ack(count: number) {
    this.worker?.postMessage({ type: 'ACK', count });
  }

  cleanup() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export type GenerateFn = () => EngineProducer;

export function useExecutionEngine(stepsPerSecond: number, onTonePlay?: (entry: HistoryEntry) => void) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const [workerFailed, setWorkerFailed] = useState(false);

  const generatorFactoryRef = useRef<GenerateFn | null>(null);
  const producerRef = useRef<EngineProducer | null>(null);
  
  const historyRef = useRef<HistoryEntry[]>([]);
  const currentIndexRef = useRef(0);
  const rAFRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);

  const fillBuffer = useCallback(() => {
    if (!producerRef.current) return;
    let added = false;
    while (historyRef.current.length - currentIndexRef.current < LOOKAHEAD_BUFFER) {
      if (historyRef.current.length >= MAX_HISTORY_STEPS) {
         setTruncated(true);
         break;
      }
      const { value, done } = producerRef.current.next();
      if (done) {
        break;
      }
      if (value) {
        historyRef.current.push(value);
        added = true;
      } else {
        break; // wait for worker
      }
    }
    if (added) {
      setHistory([...historyRef.current]);
    }
  }, []);

  const start = useCallback((genFactory: GenerateFn) => {
    generatorFactoryRef.current = genFactory;
    
    if (producerRef.current) {
      producerRef.current.cleanup();
    }
    
    const producer = genFactory();
    producer.onMessage = fillBuffer;
    producerRef.current = producer;
    
    historyRef.current = [];
    currentIndexRef.current = 0;
    
    setTruncated(false);
    setIsPlaying(false);
    setHistory([]);
    setCurrentIndex(0);
    fillBuffer();
  }, [fillBuffer]);

  const reset = useCallback(() => {
    if (generatorFactoryRef.current) {
      start(generatorFactoryRef.current);
    }
  }, [start]);

  const stepForward = useCallback(() => {
    if (currentIndexRef.current < historyRef.current.length - 1) {
      currentIndexRef.current += 1;
      setCurrentIndex(currentIndexRef.current);
      producerRef.current?.ack(1);
      fillBuffer();
      if (onTonePlay) onTonePlay(historyRef.current[currentIndexRef.current]);
      return true;
    }
    return false;
  }, [fillBuffer, onTonePlay]);

  const stepBackward = useCallback(() => {
    if (currentIndexRef.current > 0) {
      currentIndexRef.current -= 1;
      setCurrentIndex(currentIndexRef.current);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      lastFrameTimeRef.current = 0;
      return;
    }

    const loop = (time: number) => {
      if (lastFrameTimeRef.current === 0) {
         lastFrameTimeRef.current = time;
      }
      const deltaMs = time - lastFrameTimeRef.current;
      const msPerStep = 1000 / stepsPerSecond;

      let stepsToTake = 0;
      if (stepsPerSecond > 60) {
        stepsToTake = Math.ceil(stepsPerSecond / 60);
      } else {
        if (deltaMs >= msPerStep) {
           stepsToTake = 1;
           lastFrameTimeRef.current = time - (deltaMs % msPerStep); 
        }
      }

      let advanced = false;
      let ackCount = 0;
      for (let i = 0; i < stepsToTake; i++) {
         if (currentIndexRef.current < historyRef.current.length - 1) {
            currentIndexRef.current += 1;
            advanced = true;
            ackCount++;
         } else {
            setIsPlaying(false);
            break;
         }
      }

      if (advanced) {
        setCurrentIndex(currentIndexRef.current);
        producerRef.current?.ack(ackCount);
        fillBuffer();
        if (onTonePlay) {
          onTonePlay(historyRef.current[currentIndexRef.current]);
        }
      }

      if (stepsPerSecond > 60) {
        lastFrameTimeRef.current = time; 
      }

      rAFRef.current = requestAnimationFrame(loop);
    };

    rAFRef.current = requestAnimationFrame(loop);

    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    };
  }, [isPlaying, stepsPerSecond, fillBuffer, onTonePlay]);

  return {
    history,
    currentIndex,
    isPlaying,
    truncated,
    workerFailed,
    setWorkerFailed,
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    stepForward,
    stepBackward,
    start,
    reset
  };
}
