import React, { memo, useRef, useState, useCallback } from 'react';
import { GridNode } from '../../types/steps';
import { useAppContext } from '../../contexts/AppContextValue';
import { GRID_ROWS, GRID_COLS } from '../../utils/constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MapPin, Flag, Weight } from 'lucide-react';

const Cell = memo(({ r, c, node, isFocused }: { r: number, c: number, node: GridNode, isFocused: boolean }) => {
  let bgClass = "bg-white dark:bg-slate-900";
  if (node.kind === 'wall') bgClass = "bg-slate-800 dark:bg-slate-300";
  else if (node.kind === 'weight') bgClass = "bg-orange-100 dark:bg-orange-950";
  else if (node.kind === 'start') bgClass = "bg-blue-100 dark:bg-blue-900";
  else if (node.kind === 'target') bgClass = "bg-red-100 dark:bg-red-900";

  // Engine state overrides
  if (node.state === 'visited') bgClass = "bg-cyan-100 dark:bg-cyan-900";
  else if (node.state === 'path') bgClass = "bg-yellow-300 dark:bg-yellow-600 shadow-inner";

  return (
    <div 
      data-row={r} 
      data-col={c}
      tabIndex={isFocused ? 0 : -1}
      className={twMerge(clsx(
        "border border-slate-200 dark:border-slate-800 flex items-center justify-center transition-colors outline-none",
        isFocused ? "ring-2 ring-inset ring-blue-500 z-10" : "",
        bgClass
      ))}
      style={{ touchAction: 'none' }}
    >
      {node.kind === 'start' && <MapPin size={16} className="text-blue-600 dark:text-blue-400" />}
      {node.kind === 'target' && <Flag size={16} className="text-red-600 dark:text-red-400" />}
      {node.kind === 'weight' && <Weight size={16} className="text-orange-600 dark:text-orange-400 opacity-60" />}
    </div>
  );
});

export function PathGrid({ grid }: { grid: GridNode[][] }) {
  const { state, dispatch } = useAppContext();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const isPainting = useRef(false);
  const lastPainted = useRef(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  const paintCell = useCallback((r: number, c: number) => {
    const index = r * GRID_COLS + c;
    if (lastPainted.current !== index) {
      lastPainted.current = index;
      dispatch({ type: 'PAINT_CELL', payload: { index, tool: state.activeTool } });
    }
  }, [dispatch, state.activeTool]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isPainting.current = true;
    const target = (e.target as HTMLElement).closest('[data-row]');
    if (!target) return;
    const r = target.getAttribute('data-row');
    const c = target.getAttribute('data-col');
    if (r != null && c != null) paintCell(parseInt(r), parseInt(c));
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPainting.current) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-row]') as HTMLElement;
    if (!target) return;
    const r = target.getAttribute('data-row');
    const c = target.getAttribute('data-col');
    if (r != null && c != null) paintCell(parseInt(r), parseInt(c));
  };

  const handlePointerUp = () => {
    isPainting.current = false;
    lastPainted.current = -1;
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
      paintCell(r, c);
      lastPainted.current = -1;
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

  return (
    <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 dark:bg-slate-950">
      <div 
        ref={gridRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="grid bg-slate-300 dark:bg-slate-700 gap-[1px] border border-slate-300 dark:border-slate-700 shadow-lg touch-none"
        style={{ 
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          width: '100%',
          maxWidth: '1200px',
          aspectRatio: `${GRID_COLS} / ${GRID_ROWS}`
        }}
      >
        {grid.map((row, r) => 
          row.map((node, c) => {
            const index = r * GRID_COLS + c;
            return (
              <Cell 
                key={index} 
                r={r} 
                c={c} 
                node={node} 
                isFocused={focusedIndex === index} 
              />
            );
          })
        )}
      </div>
    </div>
  );
}
