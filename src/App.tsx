import { useEffect, useCallback, useState, useRef } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAppContext } from './contexts/AppContextValue';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { MetricsPanel } from './components/MetricsPanel';
import { RaceArena } from './components/RaceArena';
import { SortingBoard } from './features/sorting/SortingBoard';
import { PathGrid } from './features/pathfinding/PathGrid';
import { useExecutionEngine, SyncProducer, WorkerProducer, EngineProducer } from './hooks/useExecutionEngine';
import { useAudio } from './hooks/useAudio';
import { generateSort } from './features/sorting/sortingAlgos';
import { generatePath } from './features/pathfinding/pathAlgos';
import { RNG } from './utils/rng';
import { PathStepEvent, HistoryEntry } from './types/steps';
import { AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

function AlgoPulseApp() {
  const { state, dispatch } = useAppContext();
  const { playTone } = useAudio(state.audioEnabled);
  const [showConfetti, setShowConfetti] = useState(false);
  const [winner, setWinner] = useState<'A' | 'B' | 'TIE' | null>(null);
  const finishTimeRef = useRef<{ A?: number; B?: number }>({});

  const handleTonePlay = useCallback((entry: HistoryEntry) => {
    if (state.mode === 'sorting' && entry.type === 'SORT_STEP') {
      const activeIdx = entry.swapping?.[0] ?? entry.comparing?.[0] ?? entry.pivot ?? -1;
      if (activeIdx !== -1) playTone(entry.array[activeIdx], 1, state.arraySize);
    } else if (state.mode === 'pathfinding' && entry.type === 'PATH_VISIT') {
      playTone(10, 1, 100); 
    }
  }, [state.mode, state.arraySize, playTone]);

  // Contender A Engine (Solo or Race Competitor 1)
  const engineA = useExecutionEngine(state.stepsPerSecond, handleTonePlay);
  const { workerFailed: workerFailedA, setWorkerFailed: setWorkerFailedA } = engineA;

  // Contender B Engine (Race Competitor 2)
  const engineB = useExecutionEngine(state.stepsPerSecond);
  const { workerFailed: workerFailedB, setWorkerFailed: setWorkerFailedB } = engineB;

  const generatorFactoryA = useCallback((): EngineProducer => {
    setShowConfetti(false);
    setWinner(null);
    finishTimeRef.current = {};

    if (state.mode === 'sorting') {
      const rng = new RNG(state.seed);
      const arr = Array.from({ length: state.arraySize }, () => rng.nextInt(1, state.arraySize + 1));
      return new SyncProducer(generateSort(state.algorithmId, arr));
    } else {
      if (workerFailedA) {
        return new SyncProducer(generatePath(
          state.algorithmId, state.startNode, state.targetNode, state.gridMap, state.diagonalEnabled
        ));
      }
      return new WorkerProducer({
        algorithmId: state.algorithmId,
        startNode: state.startNode,
        targetNode: state.targetNode,
        gridMap: state.gridMap,
        diagonalEnabled: state.diagonalEnabled
      }, () => setWorkerFailedA(true));
    }
  }, [state.mode, state.algorithmId, state.arraySize, state.seed, state.startNode, state.targetNode, state.gridMap, state.diagonalEnabled, workerFailedA, setWorkerFailedA]);

  const generatorFactoryB = useCallback((): EngineProducer => {
    if (state.mode === 'sorting') {
      const rng = new RNG(state.seed); // exact same seed ensures identical array!
      const arr = Array.from({ length: state.arraySize }, () => rng.nextInt(1, state.arraySize + 1));
      return new SyncProducer(generateSort(state.algorithmIdB, arr));
    } else {
      if (workerFailedB) {
        return new SyncProducer(generatePath(
          state.algorithmIdB, state.startNode, state.targetNode, state.gridMap, state.diagonalEnabled
        ));
      }
      return new WorkerProducer({
        algorithmId: state.algorithmIdB,
        startNode: state.startNode,
        targetNode: state.targetNode,
        gridMap: state.gridMap,
        diagonalEnabled: state.diagonalEnabled
      }, () => setWorkerFailedB(true));
    }
  }, [state.mode, state.algorithmIdB, state.arraySize, state.seed, state.startNode, state.targetNode, state.gridMap, state.diagonalEnabled, workerFailedB, setWorkerFailedB]);

  // Initialize Engine A
  useEffect(() => {
    engineA.start(generatorFactoryA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorFactoryA]);

  // Initialize Engine B (Race Mode)
  useEffect(() => {
    if (state.isRaceMode) {
      engineB.start(generatorFactoryB);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorFactoryB, state.isRaceMode]);

  const currentEntryA = engineA.history[engineA.currentIndex];
  const currentEntryB = engineB.history[engineB.currentIndex];

  const isDoneA = currentEntryA?.type === 'SORT_COMPLETE' || currentEntryA?.type === 'PATH_FOUND' || currentEntryA?.type === 'PATH_NOT_FOUND';
  const isDoneB = currentEntryB?.type === 'SORT_COMPLETE' || currentEntryB?.type === 'PATH_FOUND' || currentEntryB?.type === 'PATH_NOT_FOUND';

  // Completion & Winner Logic
  useEffect(() => {
    if (!state.isRaceMode) {
      if (currentEntryA?.type === 'SORT_COMPLETE' || currentEntryA?.type === 'PATH_FOUND') {
        if (!showConfetti) {
          setShowConfetti(true);
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!prefersReducedMotion) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          }
        }
      }
    } else {
      // Race Mode Winner Tracking
      if (isDoneA && finishTimeRef.current.A === undefined) {
        finishTimeRef.current.A = performance.now();
        if (finishTimeRef.current.B === undefined) {
          setWinner('A');
          if (!showConfetti) {
            setShowConfetti(true);
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!prefersReducedMotion) {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
          }
        }
      }

      if (isDoneB && finishTimeRef.current.B === undefined) {
        finishTimeRef.current.B = performance.now();
        if (finishTimeRef.current.A === undefined) {
          setWinner('B');
          if (!showConfetti) {
            setShowConfetti(true);
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!prefersReducedMotion) {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            }
          }
        }
      }
    }
  }, [currentEntryA, currentEntryB, isDoneA, isDoneB, state.isRaceMode, showConfetti]);

  // Synchronized Playback Handlers
  const isPlaying = state.isRaceMode 
    ? (engineA.isPlaying || engineB.isPlaying)
    : engineA.isPlaying;

  const isAtStart = state.isRaceMode
    ? (engineA.currentIndex === 0 && engineB.currentIndex === 0)
    : engineA.currentIndex === 0;

  const isAtEnd = state.isRaceMode
    ? (engineA.currentIndex === Math.max(0, engineA.history.length - 1) && engineB.currentIndex === Math.max(0, engineB.history.length - 1))
    : engineA.currentIndex === Math.max(0, engineA.history.length - 1);

  const handlePlay = useCallback(() => {
    if (state.isRaceMode) {
      if (engineA.currentIndex < engineA.history.length - 1) engineA.play();
      if (engineB.currentIndex < engineB.history.length - 1) engineB.play();
    } else {
      engineA.play();
    }
  }, [state.isRaceMode, engineA, engineB]);

  const handlePause = useCallback(() => {
    engineA.pause();
    if (state.isRaceMode) engineB.pause();
  }, [state.isRaceMode, engineA, engineB]);

  const handleStepForward = useCallback(() => {
    engineA.stepForward();
    if (state.isRaceMode) engineB.stepForward();
  }, [state.isRaceMode, engineA, engineB]);

  const handleStepBackward = useCallback(() => {
    engineA.stepBackward();
    if (state.isRaceMode) engineB.stepBackward();
  }, [state.isRaceMode, engineA, engineB]);

  const handleReset = useCallback(() => {
    setShowConfetti(false);
    setWinner(null);
    finishTimeRef.current = {};
    engineA.reset();
    if (state.isRaceMode) engineB.reset();
  }, [state.isRaceMode, engineA, engineB]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (
        active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || 
        active.tagName === 'SELECT' || active.tagName === 'BUTTON' || 
        active.getAttribute('role') === 'grid' || active.hasAttribute('data-row') || 
        active.getAttribute('type') === 'range'
      )) return; 

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (isPlaying) handlePause();
          else handlePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handlePause();
          handleStepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePause();
          handleStepBackward();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, handlePlay, handlePause, handleStepForward, handleStepBackward]);
  
  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Navbar />

      <ControlBar 
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onPause={handlePause}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        onRegenerate={() => dispatch({ type: 'SET_SEED', payload: Date.now() })}
        isAtStart={isAtStart}
        isAtEnd={isAtEnd}
      />

      {/* Solo Mode: Single Telemetry Bar & Timeline Scrubber */}
      {!state.isRaceMode && (
        <MetricsPanel
          metrics={currentEntryA?.metrics}
          currentEntry={currentEntryA}
          currentIndex={engineA.currentIndex}
          totalSteps={engineA.history.length}
          onScrub={(idx) => {
            engineA.pause();
            engineA.seekTo(idx);
          }}
        />
      )}
      
      {(engineA.workerFailed || (state.isRaceMode && engineB.workerFailed)) && state.mode === 'pathfinding' && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-1.5 flex items-center justify-center gap-2 text-xs font-medium shrink-0">
          <AlertCircle size={14} /> Worker unavailable — running on main thread fallback.
        </div>
      )}

      {engineA.truncated && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-1.5 text-xs text-center font-medium shrink-0">
          Warning: Maximum step limit reached. Visualization truncated.
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {currentEntryA?.type === 'SORT_COMPLETE' && `Sort complete in ${currentEntryA.metrics.comparisons} comparisons`}
        {currentEntryA?.type === 'PATH_FOUND' && `Path found, length ${currentEntryA.metrics.pathLength}`}
        {currentEntryA?.type === 'PATH_NOT_FOUND' && `No path found`}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {state.isRaceMode ? (
            <RaceArena
              entryA={currentEntryA}
              entryB={currentEntryB}
              winner={winner}
            />
          ) : state.mode === 'sorting' ? (
            <SortingBoard entry={currentEntryA?.type === 'SORT_STEP' || currentEntryA?.type === 'SORT_COMPLETE' ? currentEntryA : null} />
          ) : (
            <PathGrid grid={(currentEntryA as PathStepEvent)?.grid || []} />
          )}
        </main>
        <CodePanel 
          activeLine={currentEntryA && 'activeLine' in currentEntryA ? currentEntryA.activeLine : undefined} 
          activeLineB={currentEntryB && 'activeLine' in currentEntryB ? currentEntryB.activeLine : undefined}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AlgoPulseApp />
      </AppProvider>
    </ErrorBoundary>
  );
}
