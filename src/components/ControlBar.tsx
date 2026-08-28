import React from 'react';
import { Tool } from '../contexts/AppContext';
import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { SPEED_PRESETS, SpeedPreset } from '../utils/constants';
import { AlgorithmId } from '../types/registry';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Dices, Square, Weight, MapPin, Flag, Eraser } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ControlBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  isAtEnd: boolean;
  isAtStart: boolean;
}

function ToolBtn({ tool, icon, label }: { tool: Tool, icon: React.ReactNode, label: string }) {
  const { state, dispatch } = useAppContext();
  const isActive = state.activeTool === tool;
  return (
    <button
      onClick={() => dispatch({ type: 'SET_TOOL', payload: tool })}
      title={label}
      className={twMerge(clsx(
        "p-2 rounded-md transition-colors",
        isActive 
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 shadow-inner" 
          : "text-slate-600 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
      ))}
    >
      {icon}
    </button>
  );
}

export function ControlBar({
  isPlaying, onPlay, onPause, onStepForward, onStepBackward, onReset, onRegenerate, isAtEnd, isAtStart
}: ControlBarProps) {
  const { state, dispatch } = useAppContext();

  const algos = Object.values(ALGORITHM_REGISTRY).filter(a => a.category === state.mode);

  return (
    <div className="flex items-center gap-4 py-2 flex-nowrap w-max min-w-full">
      <select
        value={state.algorithmId}
        onChange={(e) => dispatch({ type: 'SET_ALGORITHM', payload: e.target.value as AlgorithmId })}
        className="shrink-0 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {algos.map(a => (
          <option key={a.id} value={a.id}>{a.displayName}</option>
        ))}
      </select>

      <div className="shrink-0 flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md overflow-hidden">
        <button disabled={isAtStart} onClick={onStepBackward} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300" aria-label="Step Back">
          <SkipBack size={18} />
        </button>
        {isPlaying ? (
          <button onClick={onPause} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" aria-label="Pause">
            <Pause size={18} />
          </button>
        ) : (
          <button disabled={isAtEnd} onClick={onPlay} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300" aria-label="Play">
            <Play size={18} />
          </button>
        )}
        <button disabled={isAtEnd} onClick={onStepForward} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300" aria-label="Step Forward">
          <SkipForward size={18} />
        </button>
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Speed</label>
        <select
          value={state.stepsPerSecond}
          onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) as SpeedPreset })}
          className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SPEED_PRESETS.map(s => (
            <option key={s} value={s}>{s} steps/s</option>
          ))}
        </select>
      </div>

      <div className="shrink-0 flex items-center gap-2 ml-auto">
        <button onClick={onReset} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-md transition-colors" aria-label="Reset">
          <RotateCcw size={16} /> <span className="hidden sm:inline">Reset</span>
        </button>
        <button onClick={onRegenerate} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-md transition-colors" aria-label="Regenerate">
          <Dices size={16} /> <span className="hidden sm:inline">Regenerate</span>
        </button>
      </div>

      {state.mode === 'pathfinding' && (
        <div className="shrink-0 flex items-center gap-1 border-l border-slate-300 dark:border-slate-700 pl-4 ml-2">
          <ToolBtn tool="wall" icon={<Square size={16} />} label="Wall" />
          <ToolBtn tool="weight" icon={<Weight size={16} />} label="Weight" />
          <ToolBtn tool="start" icon={<MapPin size={16} />} label="Move Start" />
          <ToolBtn tool="target" icon={<Flag size={16} />} label="Move Target" />
          <ToolBtn tool="erase" icon={<Eraser size={16} />} label="Erase" />
          
          <label className="ml-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
            <input 
              type="checkbox" 
              checked={state.diagonalEnabled}
              onChange={(e) => dispatch({ type: 'TOGGLE_DIAGONAL', payload: e.target.checked })}
              disabled={state.algorithmId === 'bfs'} // Option (a) from spec: disable diagonals for BFS
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 disabled:opacity-50"
            />
            8-Way
          </label>
        </div>
      )}
    </div>
  );
}
