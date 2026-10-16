import React, { useState } from 'react';
import { Tool, BrushSize } from '../contexts/AppContext';
import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { SPEED_PRESETS, SpeedPreset } from '../utils/constants';
import { AlgorithmId } from '../types/registry';
import { MAP_PRESET_OPTIONS } from '../features/pathfinding/mazeAlgos';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, Dices, 
  Square, Weight, MapPin, Flag, Eraser, Gauge, SlidersHorizontal, 
  Sparkles, Trash2, ChevronDown, Brush, User, Zap
} from 'lucide-react';
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
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 shrink-0",
        isActive 
          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25" 
          : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
      ))}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function ControlBar({
  isPlaying, onPlay, onPause, onStepForward, onStepBackward, onReset, onRegenerate, isAtEnd, isAtStart
}: ControlBarProps) {
  const { state, dispatch } = useAppContext();
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);
  const [clearMenuOpen, setClearMenuOpen] = useState(false);

  const algos = Object.values(ALGORITHM_REGISTRY).filter(a => a.category === state.mode);

  return (
    <div className="shrink-0 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 py-2 flex flex-col gap-2 z-20">
      {/* Row 1: Mode Switch (Single vs Race) + Algorithm Select(s) + Transport + Speed + Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Left: Mode Selection + Algorithm Dropdown(s) + Playback Transport */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-1 sm:flex-initial min-w-0">
          {/* Explicit Choice: Single Algorithm vs Race Mode */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shrink-0">
            <button
              onClick={() => dispatch({ type: 'TOGGLE_RACE_MODE', payload: false })}
              className={twMerge(clsx(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                !state.isRaceMode
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              ))}
              title="Inspect a single algorithm in depth"
            >
              <User size={13} />
              <span>Single</span>
            </button>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_RACE_MODE', payload: true })}
              className={twMerge(clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                state.isRaceMode
                  ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              ))}
              title="Compare two algorithms side-by-side in a race"
            >
              <Zap size={13} className={state.isRaceMode ? "fill-white text-white" : "text-amber-500"} />
              <span>Race</span>
            </button>
          </div>

          {!state.isRaceMode ? (
            /* Solo Mode Single Selector */
            <div className="relative flex-1 sm:flex-initial min-w-[140px] sm:min-w-[185px]">
              <select
                value={state.algorithmId}
                onChange={(e) => dispatch({ type: 'SET_ALGORITHM', payload: e.target.value as AlgorithmId })}
                aria-label="Select Algorithm"
                className="w-full appearance-none bg-slate-100/90 dark:bg-slate-800/90 hover:bg-slate-200/60 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors cursor-pointer truncate"
              >
                {algos.map(a => (
                  <option key={a.id} value={a.id}>{a.displayName}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
          ) : (
            /* Race Mode Dual Competitor Selectors */
            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 sm:flex-initial min-w-0">
              {/* Competitor A */}
              <div className="relative flex-1 min-w-[110px] sm:min-w-[155px]">
                <div className="absolute -top-1.5 left-2 px-1.5 bg-indigo-600 text-[8.5px] font-bold text-white rounded uppercase tracking-wider z-10 pointer-events-none shadow-xs">
                  Contender A
                </div>
                <select
                  value={state.algorithmId}
                  onChange={(e) => dispatch({ type: 'SET_ALGORITHM', payload: e.target.value as AlgorithmId })}
                  aria-label="Contender A Algorithm"
                  className="w-full appearance-none bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/60 border border-indigo-300/80 dark:border-indigo-700/80 text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm font-semibold rounded-xl pl-2.5 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer truncate"
                >
                  {algos.map(a => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {a.displayName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-indigo-500">
                  <ChevronDown size={13} />
                </div>
              </div>

              {/* VS Badge */}
              <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-rose-500 text-white font-mono font-black text-[10px] tracking-wider shrink-0 shadow-xs select-none">
                VS
              </span>

              {/* Competitor B */}
              <div className="relative flex-1 min-w-[110px] sm:min-w-[155px]">
                <div className="absolute -top-1.5 left-2 px-1.5 bg-rose-600 text-[8.5px] font-bold text-white rounded uppercase tracking-wider z-10 pointer-events-none shadow-xs">
                  Contender B
                </div>
                <select
                  value={state.algorithmIdB}
                  onChange={(e) => dispatch({ type: 'SET_ALGORITHM_B', payload: e.target.value as AlgorithmId })}
                  aria-label="Contender B Algorithm"
                  className="w-full appearance-none bg-rose-50/70 dark:bg-rose-950/50 hover:bg-rose-100/70 dark:hover:bg-rose-900/60 border border-rose-300/80 dark:border-rose-700/80 text-rose-950 dark:text-rose-200 text-xs sm:text-sm font-semibold rounded-xl pl-2.5 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/50 cursor-pointer truncate"
                >
                  {algos.map(a => (
                    <option key={a.id} value={a.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {a.displayName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-rose-500">
                  <ChevronDown size={13} />
                </div>
              </div>
            </div>
          )}

          {/* Transport Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700/70 shrink-0">
            <button
              disabled={isAtStart}
              onClick={onStepBackward}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none text-slate-700 dark:text-slate-200 transition-all"
              aria-label="Step Back"
              title="Step Backward (Left Arrow)"
            >
              <SkipBack size={16} />
            </button>

            {isPlaying ? (
              <button
                onClick={onPause}
                className="mx-1 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-amber-500/25 transition-all"
                aria-label="Pause"
                title="Pause (Space)"
              >
                <Pause size={16} fill="currentColor" />
                <span className="hidden xs:inline">Pause</span>
              </button>
            ) : (
              <button
                disabled={isAtEnd}
                onClick={onPlay}
                className="mx-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm shadow-indigo-500/25 transition-all"
                aria-label="Play"
                title="Play (Space)"
              >
                <Play size={16} fill="currentColor" />
                <span className="hidden xs:inline">{state.isRaceMode ? 'Start Race' : 'Run'}</span>
              </button>
            )}

            <button
              disabled={isAtEnd}
              onClick={onStepForward}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-35 disabled:pointer-events-none text-slate-700 dark:text-slate-200 transition-all"
              aria-label="Step Forward"
              title="Step Forward (Right Arrow)"
            >
              <SkipForward size={16} />
            </button>
          </div>
        </div>

        {/* Right: Speed, Mode Controls, Reset & Presets */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 rounded-xl px-2.5 py-1.5">
            <Gauge size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden md:inline">Speed</span>
            <select
              value={state.stepsPerSecond}
              onChange={(e) => dispatch({ type: 'SET_SPEED', payload: Number(e.target.value) as SpeedPreset })}
              aria-label="Execution Speed"
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {SPEED_PRESETS.map(s => (
                <option key={s} value={s} className="bg-white dark:bg-slate-900">{s}x / sec</option>
              ))}
            </select>
          </div>

          {/* Sorting: Array Size Slider */}
          {state.mode === 'sorting' && (
            <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/70 rounded-xl px-2.5 py-1.5">
              <SlidersHorizontal size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden lg:inline">Size</span>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={state.arraySize}
                onChange={(e) => dispatch({ type: 'SET_ARRAY_SIZE', payload: Number(e.target.value) })}
                aria-label="Array Size"
                className="w-16 sm:w-24 accent-indigo-600 cursor-pointer h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 w-6 text-right">
                {state.arraySize}
              </span>
            </div>
          )}

          {/* Pathfinding: Mazes & Map Presets Dropdown */}
          {state.mode === 'pathfinding' && (
            <div className="relative">
              <button
                onClick={() => setPresetMenuOpen(!presetMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100/90 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200/70 dark:border-indigo-800/60 transition-colors"
                aria-label="Mazes and Map Presets"
                title="Choose from preset mazes and terrain maps"
              >
                <Sparkles size={14} />
                <span>Mazes & Maps</span>
                <ChevronDown size={13} className={twMerge(clsx("transition-transform duration-200", presetMenuOpen ? "rotate-180" : ""))} />
              </button>

              {presetMenuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setPresetMenuOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-40 flex flex-col gap-0.5">
                    <div className="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                      Terrain & Maze Presets
                    </div>
                    {MAP_PRESET_OPTIONS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          dispatch({ type: 'LOAD_PRESET', payload: preset.id });
                          setPresetMenuOpen(false);
                        }}
                        className="flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors group"
                      >
                        <span className="text-xs font-semibold">{preset.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-indigo-500/70">
                          {preset.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Reset / Clear Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200/70 dark:border-slate-700/70 transition-colors"
              aria-label="Reset Path & Animation"
              title="Reset path & visualization (keeps your walls)"
            >
              <RotateCcw size={14} />
              <span className="hidden md:inline">Reset</span>
            </button>

            {state.mode === 'sorting' ? (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold rounded-xl border border-indigo-200/60 dark:border-indigo-800/50 transition-colors"
                aria-label="Shuffle Array"
                title="Generate new random array"
              >
                <Dices size={14} />
                <span>Shuffle</span>
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setClearMenuOpen(!clearMenuOpen)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200/70 dark:border-slate-700/70 transition-colors"
                  aria-label="Clear Board Options"
                  title="Clear walls, weights, or everything"
                >
                  <Trash2 size={13} />
                  <span className="hidden sm:inline">Clear</span>
                  <ChevronDown size={12} />
                </button>

                {clearMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setClearMenuOpen(false)} />
                    <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1 z-40 flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          onReset();
                          setClearMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        Clear Path Only
                      </button>
                      <button
                        onClick={() => {
                          dispatch({ type: 'CLEAR_WALLS' });
                          setClearMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        Clear Walls Only
                      </button>
                      <button
                        onClick={() => {
                          dispatch({ type: 'CLEAR_WEIGHTS' });
                          setClearMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                      >
                        Clear Weights Only
                      </button>
                      <div className="h-[1px] bg-slate-200 dark:bg-slate-800 my-0.5" />
                      <button
                        onClick={() => {
                          dispatch({ type: 'CLEAR_GRID' });
                          setClearMenuOpen(false);
                        }}
                        className="px-2.5 py-1.5 text-xs text-left rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-medium"
                      >
                        Clear Entire Board
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2 (Pathfinding only): Paint Tools, Brush Size, and 8-Way Diagonals */}
      {state.mode === 'pathfinding' && (
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 overflow-x-auto no-scrollbar">
          {/* Left: Tools + Brush Size */}
          <div className="flex items-center gap-2">
            {/* Tool Selection Pills */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <ToolBtn tool="wall" icon={<Square size={13} className="fill-current" />} label="Wall" />
              <ToolBtn tool="weight" icon={<Weight size={13} />} label="Weight (5x)" />
              <ToolBtn tool="erase" icon={<Eraser size={13} />} label="Erase" />
              <ToolBtn tool="start" icon={<MapPin size={13} />} label="Start" />
              <ToolBtn tool="target" icon={<Flag size={13} />} label="Target" />
            </div>

            {/* Brush Size Toggle */}
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
              <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 pl-1.5 pr-0.5">
                <Brush size={12} /> Brush
              </span>
              {([1, 2, 3] as BrushSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => dispatch({ type: 'SET_BRUSH_SIZE', payload: size })}
                  className={twMerge(clsx(
                    "px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all",
                    state.brushSize === size
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-900/5 dark:ring-white/10"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  ))}
                  title={`Brush Size ${size}x${size}`}
                >
                  {size}x
                </button>
              ))}
            </div>
          </div>

          {/* Right: 8-Way Diagonals Toggle */}
          <label
            className={twMerge(clsx(
              "shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer select-none",
              (state.algorithmId === 'bfs' || (state.isRaceMode && state.algorithmIdB === 'bfs'))
                ? "opacity-45 cursor-not-allowed bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400"
                : state.diagonalEnabled
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300"
                  : "bg-slate-100 dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/70 text-slate-600 dark:text-slate-400"
            ))}
            title={state.algorithmId === 'bfs' ? "8-way diagonals disabled for unweighted BFS" : "Allow 8-direction diagonal movement"}
          >
            <input 
              type="checkbox" 
              checked={state.diagonalEnabled}
              onChange={(e) => dispatch({ type: 'TOGGLE_DIAGONAL', payload: e.target.checked })}
              disabled={state.algorithmId === 'bfs' || (state.isRaceMode && state.algorithmIdB === 'bfs')}
              className="w-3.5 h-3.5 accent-indigo-600 rounded focus:ring-indigo-500 disabled:opacity-50"
            />
            <span className="whitespace-nowrap">8-Way Diagonals</span>
          </label>
        </div>
      )}
    </div>
  );
}
