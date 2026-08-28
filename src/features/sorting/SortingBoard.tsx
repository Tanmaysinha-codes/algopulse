import { memo } from 'react';
import { SortStepEvent } from '../../types/steps';

interface SortingBoardProps {
  entry: SortStepEvent | null;
}

const Bar = memo(({ value, maxVal, stateClass }: { value: number, maxVal: number, stateClass: string }) => {
  const height = `${(value / maxVal) * 100}%`;
  return (
    <div className={`flex-1 mx-[1px] rounded-t flex flex-col justify-end transition-colors ${stateClass}`} style={{ height }} />
  );
});

export function SortingBoard({ entry }: SortingBoardProps) {
  if (!entry) return null;
  const { array, sorted } = entry;
  const step = entry.type === 'SORT_STEP' ? entry : null;
  const maxVal = array.length;
  
  return (
    <div className="flex-1 flex items-end justify-center p-4 h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {step?.auxRange && (
         <div 
           className="absolute bottom-0 h-full bg-slate-200/50 dark:bg-slate-800/50 border-x border-slate-300 dark:border-slate-700 pointer-events-none"
           style={{
             left: `calc(${(step.auxRange[0] / maxVal) * 100}% + 1rem)`,
             width: `calc(${((step.auxRange[1] - step.auxRange[0] + 1) / maxVal) * 100}% - 2rem)`
           }}
         />
      )}
      <div className="flex items-end justify-center w-full h-full z-10 px-4">
        {array.map((val, idx) => {
          let stateClass = "bg-slate-400 dark:bg-slate-600";
          if (sorted.includes(idx)) {
            stateClass = "bg-emerald-500 dark:bg-emerald-600 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]";
          }
          if (step?.pivot === idx) {
            stateClass = "bg-amber-400 dark:bg-amber-500 relative before:content-[''] before:absolute before:-top-3 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-amber-400";
          }
          if (step?.swapping?.includes(idx)) {
             // cross-hatch/stripes
            stateClass = "bg-rose-500 dark:bg-rose-600 bg-[linear-gradient(45deg,rgba(255,255,255,.25)25%,transparent_25%,transparent_50%,rgba(255,255,255,.25)50%,rgba(255,255,255,.25)75%,transparent_75%,transparent)] bg-[length:10px_10px]";
          } else if (step?.comparing?.includes(idx)) {
            stateClass = "bg-sky-400 dark:bg-sky-500 border-2 border-sky-700 dark:border-sky-300";
          }

          return <Bar key={idx} value={val} maxVal={maxVal} stateClass={stateClass} />;
        })}
      </div>
    </div>
  );
}
