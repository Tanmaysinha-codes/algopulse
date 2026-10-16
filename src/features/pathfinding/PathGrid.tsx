import React, { memo, useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { GridNode } from '../../types/steps';
import { useAppContext } from '../../contexts/AppContextValue';
import { GRID_ROWS, GRID_COLS } from '../../utils/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapPin, Flag, Weight, Maximize2, Minimize2, Edit3, Hand, Info } from 'lucide-react';

export type GridScale = 'compact' | 'medium' | 'large';

interface CellProps {
  r: number;
  c: number;
  node: GridNode;
  isFocused: boolean;
  isHovered: boolean;
  isDraggingStart: boolean;
  isDraggingTarget: boolean;
}

const Cell = memo(({ r, c, node, isFocused, isHovered, isDraggingStart, isDraggingTarget }: CellProps) => {
  let bgClass = "bg-white/80 dark:bg-slate-900/80 hover:bg-indigo-50/60 dark:hover:bg-slate-800/80";
  let content = null;
  let customStyle = "";

  if (node.kind === 'wall') {
    bgClass = "bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-300 rounded-[2px] scale-[0.92] shadow-xs border-t border-white/20 dark:border-black/20 animate-wall z-0";
  } else if (node.kind === 'weight') {
    bgClass = "bg-gradient-to-br from-amber-100 to-amber-200/90 dark:from-amber-950/80 dark:to-amber-900/70 border border-amber-300/80 dark:border-amber-700/60 rounded-[1.5px]";
    content = (
      <div className="flex flex-col items-center justify-center leading-none pointer-events-none select-none">
        <Weight size={9} className="text-amber-800 dark:text-amber-200 opacity-80" />
        <span className="text-[6px] font-mono font-bold text-amber-900 dark:text-amber-100 leading-none mt-0.5">5x</span>
      </div>
    );
  } else if (node.kind === 'start') {
    bgClass = "bg-emerald-600 dark:bg-emerald-500 text-white shadow-md shadow-emerald-500/40 rounded-[2.5px] z-10 radar-start cursor-grab active:cursor-grabbing hover:scale-105";
    content = <MapPin size={11} strokeWidth={2.5} className="w-3/4 h-3/4 max-w-[13px] max-h-[13px] text-white drop-shadow-xs pointer-events-none" />;
  } else if (node.kind === 'target') {
    bgClass = "bg-rose-600 dark:bg-rose-500 text-white shadow-md shadow-rose-500/40 rounded-[2.5px] z-10 radar-target cursor-grab active:cursor-grabbing hover:scale-105";
    content = <Flag size={11} strokeWidth={2.5} className="w-3/4 h-3/4 max-w-[13px] max-h-[13px] text-white drop-shadow-xs pointer-events-none" />;
  }

  // Engine state overrides (only for floor / weight)
  if (node.state === 'visited') {
    if (node.kind !== 'start' && node.kind !== 'target') {
      if (node.kind === 'weight') {
        bgClass = "bg-gradient-to-br from-amber-300/85 to-cyan-400/80 dark:from-amber-700/70 dark:to-cyan-800/70 border border-amber-400/80 animate-visited";
      } else {
        bgClass = "bg-gradient-to-br from-sky-300/90 to-cyan-200/85 dark:from-sky-700/70 dark:to-indigo-800/70 animate-visited";
      }
    }
  } else if (node.state === 'path') {
    if (node.kind !== 'start' && node.kind !== 'target') {
      bgClass = "bg-gradient-to-r from-amber-400 to-yellow-300 dark:from-amber-400 dark:to-yellow-400 text-slate-900 font-bold shadow-[0_0_8px_rgba(251,191,36,0.7)] scale-[0.96] rounded-[1.5px] z-10 animate-path";
    }
  }

  // Hover Brush Preview styling
  if (isHovered && node.kind !== 'start' && node.kind !== 'target') {
    customStyle = "ring-2 ring-indigo-500/80 ring-inset bg-indigo-500/20";
  }

  if (isDraggingStart && node.kind !== 'target') {
    customStyle = "ring-2 ring-emerald-500 ring-inset bg-emerald-500/30";
  }

  if (isDraggingTarget && node.kind !== 'start') {
    customStyle = "ring-2 ring-rose-500 ring-inset bg-rose-500/30";
  }

  return (
    <div 
      data-row={r} 
      data-col={c}
      tabIndex={isFocused ? 0 : -1}
      className={twMerge(clsx(
        "flex items-center justify-center transition-colors duration-75 outline-none select-none relative",
        isFocused ? "ring-2 ring-inset ring-indigo-500 z-20" : "",
        bgClass,
        customStyle
      ))}
      style={{ touchAction: 'none' }}
    >
      {content}
    </div>
  );
});

export function PathGrid({ grid }: { grid: GridNode[][] }) {
  const { state, dispatch } = useAppContext();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null);
  const [fitToScreen, setFitToScreen] = useState(false);
  const [draggingNode, setDraggingNode] = useState<'start' | 'target' | null>(null);

  // Grid Scale: defaults to 'compact' (~18px blocks on PC)
  const [gridScale, setGridScale] = useState<GridScale>(() => {
    const saved = localStorage.getItem('algopulse:gridScale');
    if (saved === 'compact' || saved === 'medium' || saved === 'large') return saved;
    return 'compact';
  });

  useEffect(() => {
    localStorage.setItem('algopulse:gridScale', gridScale);
  }, [gridScale]);

  const isPointerDown = useRef(false);
  const dragMode = useRef<'start' | 'target' | 'paint' | null>(null);
  const lastPaintedIndices = useRef<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  // Helper to compute cells covered by brush size at (r, c)
  const getBrushIndices = useCallback((centerR: number, centerC: number, size: number) => {
    const indices: number[] = [];
    let rStart = centerR;
    let rEnd = centerR;
    let cStart = centerC;
    let cEnd = centerC;

    if (size === 2) {
      rEnd = Math.min(GRID_ROWS - 1, centerR + 1);
      cEnd = Math.min(GRID_COLS - 1, centerC + 1);
    } else if (size === 3) {
      rStart = Math.max(0, centerR - 1);
      rEnd = Math.min(GRID_ROWS - 1, centerR + 1);
      cStart = Math.max(0, centerC - 1);
      cEnd = Math.min(GRID_COLS - 1, centerC + 1);
    }

    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        indices.push(r * GRID_COLS + c);
      }
    }
    return indices;
  }, []);

  const paintBrush = useCallback((r: number, c: number) => {
    const indices = getBrushIndices(r, c, state.brushSize);
    const newIndicesToPaint: number[] = [];

    for (const idx of indices) {
      if (!lastPaintedIndices.current.has(idx)) {
        lastPaintedIndices.current.add(idx);
        newIndicesToPaint.push(idx);
      }
    }

    if (newIndicesToPaint.length > 0) {
      dispatch({ type: 'PAINT_CELLS', payload: { indices: newIndicesToPaint, tool: state.activeTool } });
    }
  }, [dispatch, state.activeTool, state.brushSize, getBrushIndices]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (state.touchMode === 'pan' && e.pointerType === 'touch') return;

    const target = (e.target as HTMLElement).closest('[data-row]');
    if (!target) return;
    const rStr = target.getAttribute('data-row');
    const cStr = target.getAttribute('data-col');
    if (rStr == null || cStr == null) return;

    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    const index = r * GRID_COLS + c;

    isPointerDown.current = true;
    lastPaintedIndices.current.clear();

    // Check direct drag of Start or Target
    if (index === state.startNode) {
      dragMode.current = 'start';
      setDraggingNode('start');
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (index === state.targetNode) {
      dragMode.current = 'target';
      setDraggingNode('target');
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    // Otherwise standard brush painting
    dragMode.current = 'paint';
    paintBrush(r, c);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-row]') as HTMLElement;
    if (!target) {
      setHoveredCell(null);
      return;
    }
    const rStr = target.getAttribute('data-row');
    const cStr = target.getAttribute('data-col');
    if (rStr == null || cStr == null) return;

    const r = parseInt(rStr, 10);
    const c = parseInt(cStr, 10);
    setHoveredCell({ r, c });

    if (!isPointerDown.current) return;

    const index = r * GRID_COLS + c;

    if (dragMode.current === 'start') {
      if (index !== state.targetNode && index !== state.startNode) {
        dispatch({ type: 'MOVE_START', payload: index });
      }
      return;
    }

    if (dragMode.current === 'target') {
      if (index !== state.startNode && index !== state.targetNode) {
        dispatch({ type: 'MOVE_TARGET', payload: index });
      }
      return;
    }

    if (dragMode.current === 'paint') {
      paintBrush(r, c);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPointerDown.current = false;
    dragMode.current = null;
    setDraggingNode(null);
    lastPaintedIndices.current.clear();
    try {
      if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let r = Math.floor(focusedIndex / GRID_COLS);
    let c = focusedIndex % GRID_COLS;
    let handled = false;

    if (e.key === 'ArrowUp') { r = Math.max(0, r - 1); handled = true; }
    else if (e.key === 'ArrowDown') { r = Math.min(GRID_ROWS - 1, r + 1); handled = true; }
    else if (e.key === 'ArrowLeft') { c = Math.max(0, c - 1); handled = true; }
    else if (e.key === 'ArrowRight') { c = Math.min(GRID_COLS - 1, c + 1); handled = true; }
    else if (e.key === ' ' || e.key === 'Enter') {
      paintBrush(r, c);
      lastPaintedIndices.current.clear();
      handled = true;
    } else if (e.key === 'Escape') {
      (e.currentTarget as HTMLElement).blur();
      return; 
    }

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
      const nextIndex = r * GRID_COLS + c;
      setFocusedIndex(nextIndex);
      const cell = gridRef.current?.querySelector(`[data-row="${r}"][data-col="${c}"]`) as HTMLElement;
      cell?.focus();
    }
  };

  // Compute active brush preview indices
  const brushHoverIndices = useMemo(() => {
    if (!hoveredCell || draggingNode) return new Set<number>();
    return new Set(getBrushIndices(hoveredCell.r, hoveredCell.c, state.brushSize));
  }, [hoveredCell, state.brushSize, draggingNode, getBrushIndices]);

  // Inspector status info
  const hoveredNodeInfo = useMemo(() => {
    if (!hoveredCell) return null;
    const idx = hoveredCell.r * GRID_COLS + hoveredCell.c;
    const node = grid[hoveredCell.r]?.[hoveredCell.c];
    if (!node) return null;

    let typeStr = "Floor (Cost: 1)";
    if (idx === state.startNode) typeStr = "Start Node";
    else if (idx === state.targetNode) typeStr = "Target Node";
    else if (node.kind === 'wall') typeStr = "Wall Barrier";
    else if (node.kind === 'weight') typeStr = "Weight Terrain (Cost: 5)";

    let stateStr = "Unvisited";
    if (node.state === 'visited') stateStr = "Visited";
    if (node.state === 'path') stateStr = "Shortest Path";

    return { r: hoveredCell.r, c: hoveredCell.c, typeStr, stateStr };
  }, [hoveredCell, grid, state.startNode, state.targetNode]);

  // Max width configuration per scale
  const scaleMaxWidth = fitToScreen
    ? '100%'
    : gridScale === 'compact'
      ? '720px'
      : gridScale === 'medium'
        ? '860px'
        : '1040px';

  const scaleMinWidth = fitToScreen
    ? '0px'
    : gridScale === 'compact'
      ? '480px'
      : gridScale === 'medium'
        ? '600px'
        : '720px';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 bg-canvas-grid p-2 sm:p-4 overflow-hidden relative">
      {/* Top Bar: Visual Legend & Responsive Canvas Controls */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        {/* Visual Legend */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500 inline-block" /> Start
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 dark:bg-rose-500 inline-block" /> Target
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-slate-800 dark:bg-slate-200 inline-block" /> Wall
          </span>
          <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-200 dark:bg-amber-800 border border-amber-400 inline-block" /> Weight (5x)
          </span>
          <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-300 dark:bg-sky-700 inline-block" /> Visited
          </span>
          <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Path
          </span>
        </div>

        {/* View / Size Controls */}
        <div className="flex items-center gap-1.5">
          {/* PC Block Size Selector: Small / Med / Large */}
          <div className="hidden sm:flex items-center bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-0.5 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-2 select-none">
              Blocks
            </span>
            {(['compact', 'medium', 'large'] as const).map((scale) => (
              <button
                key={scale}
                onClick={() => setGridScale(scale)}
                className={twMerge(clsx(
                  "px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                  gridScale === scale
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                ))}
                title={`Set block size to ${scale === 'compact' ? 'small (~18px)' : scale === 'medium' ? 'medium (~21px)' : 'large (~26px)'}`}
              >
                {scale === 'compact' ? 'Small' : scale === 'medium' ? 'Medium' : 'Large'}
              </button>
            ))}
          </div>

          {/* Mobile Touch Mode Toggle (Draw vs Pan) */}
          <div className="sm:hidden flex items-center bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-0.5">
            <button
              onClick={() => dispatch({ type: 'SET_TOUCH_MODE', payload: 'draw' })}
              className={twMerge(clsx(
                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                state.touchMode === 'draw'
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              ))}
              title="Draw walls with touch"
            >
              <Edit3 size={13} />
              <span>Draw</span>
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_TOUCH_MODE', payload: 'pan' })}
              className={twMerge(clsx(
                "p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors",
                state.touchMode === 'pan'
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              ))}
              title="Pan grid without painting"
            >
              <Hand size={13} />
              <span>Pan</span>
            </button>
          </div>

          {/* Fit to Screen vs Zoom Mode */}
          <button
            onClick={() => setFitToScreen(!fitToScreen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-white/85 dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-2xs transition-colors"
            title={fitToScreen ? "Switch to detailed grid" : "Fit entire grid onto screen"}
          >
            {fitToScreen ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            <span className="hidden xs:inline">{fitToScreen ? 'Detailed' : 'Fit Screen'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Canvas Viewport */}
      <div className={twMerge(clsx(
        "flex-1 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800/80 p-2 sm:p-4 shadow-sm flex items-center justify-start sm:justify-center overflow-auto",
        fitToScreen ? "overflow-hidden" : "overflow-auto"
      ))}>
        <div 
          ref={gridRef}
          role="grid"
          aria-label="Pathfinding Interactive Grid"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={() => {
            setHoveredCell(null);
            isPointerDown.current = false;
          }}
          onKeyDown={handleKeyDown}
          className="grid bg-slate-200 dark:bg-slate-800 gap-[0.5px] p-[1px] rounded-xl border border-slate-300 dark:border-slate-700 shadow-md touch-none mx-auto transition-all duration-200"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
            width: fitToScreen ? '100%' : '100%',
            minWidth: scaleMinWidth,
            maxWidth: scaleMaxWidth,
            aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`
          }}
        >
          {grid.map((row, r) => 
            row.map((node, c) => {
              const index = r * GRID_COLS + c;
              const isHovered = brushHoverIndices.has(index);
              const isDragStart = draggingNode === 'start' && isHovered;
              const isDragTarget = draggingNode === 'target' && isHovered;

              return (
                <Cell 
                  key={index} 
                  r={r} 
                  c={c} 
                  node={node} 
                  isFocused={focusedIndex === index} 
                  isHovered={isHovered}
                  isDraggingStart={isDragStart}
                  isDraggingTarget={isDragTarget}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Status / Cell Inspector Bar */}
      <div className="shrink-0 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2 px-1">
        <div className="flex items-center gap-2">
          <Info size={13} className="text-indigo-500 shrink-0" />
          {hoveredNodeInfo ? (
            <span className="font-mono">
              <strong className="text-slate-800 dark:text-slate-200">[{hoveredNodeInfo.r}, {hoveredNodeInfo.c}]</strong> — {hoveredNodeInfo.typeStr} ({hoveredNodeInfo.stateStr})
            </span>
          ) : (
            <span className="hidden sm:inline">
              Tip: Click and drag <strong className="text-emerald-600 dark:text-emerald-400">Start 📍</strong> or <strong className="text-rose-600 dark:text-rose-400">Target 🏁</strong> directly across the grid to reposition!
            </span>
          )}
        </div>

        <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
          Grid: {GRID_ROWS} × {GRID_COLS} (800 nodes) • Brush: {state.brushSize}x • Mode: {gridScale}
        </div>
      </div>
    </div>
  );
}
