import { useEffect, useCallback, useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { useAppContext } from './contexts/AppContextValue';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ControlBar } from './components/ControlBar';
import { CodePanel } from './components/CodePanel';
import { MetricsPanel } from './components/MetricsPanel';
import { SortingBoard } from './features/sorting/SortingBoard';
import { PathGrid } from './features/pathfinding/PathGrid';
import { useExecutionEngine, SyncProducer, WorkerProducer, EngineProducer } from './hooks/useExecutionEngine';
import { useAudio } from './hooks/useAudio';
import { generateSort } from './features/sorting/sortingAlgos';
import { generatePath } from './features/pathfinding/pathAlgos';
import { RNG } from './utils/rng';
import { PathStepEvent, HistoryEntry } from './types/steps';
import { Volume2, VolumeX, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

function AudioToggle() {
  const { state, dispatch } = useAppContext();
  const { isAvailable } = useAudio(state.audioEnabled);

  if (!isAvailable) {
    return (
      <button disabled className="p-2 text-slate-400 opacity-50 flex items-center gap-2" title="Audio unavailable">
        <VolumeX size={18} />
      </button>
    );
  }

  return (
    <button 
      onClick={() => dispatch({ type: 'TOGGLE_AUDIO', payload: !state.audioEnabled })} 
      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
      aria-label="Toggle Audio"
    >
      {state.audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
  );
}

function AlgoPulseApp() {
  const { state, dispatch } = useAppContext();
  const { playTone } = useAudio(state.audioEnabled);
  const [showConfetti, setShowConfetti] = useState(false);

  const handleTonePlay = useCallback((entry: HistoryEntry) => {
    if (state.mode === 'sorting' && entry.type === 'SORT_STEP') {
      const activeIdx = entry.swapping?.[0] ?? entry.comparing?.[0] ?? entry.pivot ?? -1;
      if (activeIdx !== -1) playTone(entry.array[activeIdx], 1, state.arraySize);
    } else if (state.mode === 'pathfinding' && entry.type === 'PATH_VISIT') {
      playTone(10, 1, 100); 
    }
  }, [state.mode, state.arraySize, playTone]);

  const engine = useExecutionEngine(state.stepsPerSecond, handleTonePlay);
  const { workerFailed, setWorkerFailed } = engine;

  const generatorFactory = useCallback((): EngineProducer => {
    setShowConfetti(false);
    if (state.mode === 'sorting') {
      const rng = new RNG(state.seed);
      const arr = Array.from({ length: state.arraySize }, () => rng.nextInt(1, state.arraySize + 1));
      return new SyncProducer(generateSort(state.algorithmId, arr));
    } else {
      if (workerFailed) {
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
      }, () => setWorkerFailed(true));
    }
  }, [state.mode, state.algorithmId, state.arraySize, state.seed, state.startNode, state.targetNode, state.gridMap, state.diagonalEnabled, workerFailed, setWorkerFailed]);

  useEffect(() => {
    engine.start(generatorFactory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatorFactory]);

  const currentEntry = engine.history[engine.currentIndex];

  useEffect(() => {
    if (currentEntry?.type === 'SORT_COMPLETE' || currentEntry?.type === 'PATH_FOUND') {
      if (!showConfetti) {
        setShowConfetti(true);
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    }
  }, [currentEntry, showConfetti]);

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
          if (engine.isPlaying) engine.pause();
          else engine.play();
          break;
        case 'ArrowRight':
          e.preventDefault();
          engine.pause();
          engine.stepForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          engine.pause();
          engine.stepBackward();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Navbar />
      <div className="flex items-center bg-white dark:bg-slate-950 px-2 shadow-sm relative z-10">
        <div className="flex-1 overflow-x-auto">
          <ControlBar 
            isPlaying={engine.isPlaying}
            onPlay={engine.play}
            onPause={engine.pause}
            onStepForward={engine.stepForward}
            onStepBackward={engine.stepBackward}
            onReset={() => engine.reset()}
            onRegenerate={() => dispatch({ type: 'SET_SEED', payload: Date.now() })}
            isAtStart={engine.currentIndex === 0}
            isAtEnd={engine.currentIndex === engine.history.length - 1}
          />
        </div>
        <div className="px-2 border-l border-slate-200 dark:border-slate-800 flex items-center shrink-0">
          <AudioToggle />
        </div>
      </div>

      <MetricsPanel metrics={currentEntry?.metrics} />
      
      {engine.workerFailed && state.mode === 'pathfinding' && (
        <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-1 flex items-center justify-center gap-2 text-sm font-medium">
          <AlertCircle size={16} /> Worker failed. Falling back to main-thread execution.
        </div>
      )}

      {engine.truncated && (
        <div className="bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-4 py-1 text-sm text-center">
          Warning: Maximum step limit reached. Visualization truncated.
        </div>
      )}

      <div aria-live="polite" className="sr-only">
        {currentEntry?.type === 'SORT_COMPLETE' && `Sort complete in ${currentEntry.metrics.comparisons} comparisons`}
        {currentEntry?.type === 'PATH_FOUND' && `Path found, length ${currentEntry.metrics.pathLength}`}
        {currentEntry?.type === 'PATH_NOT_FOUND' && `No path found`}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {state.mode === 'sorting' ? (
            <SortingBoard entry={currentEntry?.type === 'SORT_STEP' || currentEntry?.type === 'SORT_COMPLETE' ? currentEntry : null} />
          ) : (
            <PathGrid grid={(currentEntry as PathStepEvent)?.grid || []} />
          )}
        </main>
        <CodePanel activeLine={currentEntry && 'activeLine' in currentEntry ? currentEntry.activeLine : undefined} />
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
