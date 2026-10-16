import { memo } from 'react';
import { SortStepEvent } from '../../types/steps';

interface SortingBoardProps {
  entry: SortStepEvent | null;
}

const Bar = memo(({ value, maxVal, stateClass, showLabel }: { value: number, maxVal: number, stateClass: string, showLabel: boolean }) => {
  const height = `${Math.max((value / maxVal) * 100, 3)}%`;
  return (
    <div
      className={`flex-1 mx-[1px] sm:mx-[1.5px] rounded-t-md flex flex-col justify-end items-center transition-all duration-75 ${stateClass}`}
      style={{ height }}
    >
      {showLabel && (
        <span className="hidden md:inline-block text-[9px] font-mono font-bold text-white/90 pb-1 select-none leading-none">
          {value}
        </span>
      )}
    </div>
  );
});

export function SortingBoard({ entry }: SortingBoardProps) {
  if (!entry) return null;
  const { array, sorted } = entry;
  const step = entry.type === 'SORT_STEP' ? entry : null;
  const maxVal = array.length;
  const showLabels = maxVal <= 35;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 bg-canvas-grid relative overflow-hidden p-2 sm:p-6">
      {/* Legend Pill */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-4 px-2">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500/80 dark:bg-indigo-400/80 inline-block" /> Default
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-sky-400 ring-2 ring-sky-600 dark:ring-sky-300 inline-block" /> Comparing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Swapping / Write
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400 inline-block" /> Pivot
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" /> Sorted
          </span>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="flex-1 flex items-end justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm p-3 sm:p-6 relative overflow-hidden">
        {step?.auxRange && (
          <div 
            className="absolute bottom-0 h-full bg-indigo-500/5 dark:bg-indigo-400/5 border-x border-dashed border-indigo-400/40 dark:border-indigo-500/40 pointer-events-none transition-all duration-150"
            style={{
              left: `calc(${(step.auxRange[0] / maxVal) * 100}% + 1rem)`,
              width: `calc(${((step.auxRange[1] - step.auxRange[0] + 1) / maxVal) * 100}% - 2rem)`
            }}
          />
        )}
        <div className="flex items-end justify-center w-full h-full z-10 pt-6">
          {array.map((val, idx) => {
            let stateClass = "bg-gradient-to-t from-indigo-600/85 to-indigo-400/85 dark:from-indigo-500/80 dark:to-indigo-400/80 hover:brightness-110";
            
            if (sorted.includes(idx)) {
              stateClass = "bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-600 dark:to-emerald-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]";
            }
            if (step?.pivot === idx) {
              stateClass = "bg-gradient-to-t from-amber-500 to-amber-300 shadow-md shadow-amber-500/20 relative before:content-[''] before:absolute before:-top-3 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-amber-400";
            }
            if (step?.swapping?.includes(idx)) {
              // Cross-hatch / stripes for colorblind accessibility
              stateClass = "bg-rose-500 dark:bg-rose-500 shadow-md shadow-rose-500/30 bg-[linear-gradient(45deg,rgba(255,255,255,.28)25%,transparent_25%,transparent_50%,rgba(255,255,255,.28)50%,rgba(255,255,255,.28)75%,transparent_75%,transparent)] bg-[length:10px_10px]";
            } else if (step?.comparing?.includes(idx)) {
              stateClass = "bg-sky-400 dark:bg-sky-400 ring-2 ring-sky-600 dark:ring-sky-200 shadow-md shadow-sky-500/25";
            }

            return <Bar key={idx} value={val} maxVal={maxVal} stateClass={stateClass} showLabel={showLabels} />;
          })}
        </div>
      </div>
    </div>
  );
}
