import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { SortMetrics, PathMetrics, HistoryEntry } from '../types/steps';
import { MetricField } from '../types/registry';
import { Clock, Cpu, Database, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MetricsPanelProps {
  metrics?: SortMetrics | PathMetrics;
  currentEntry?: HistoryEntry;
  currentIndex: number;
  totalSteps: number;
  onScrub?: (index: number) => void;
}

export function MetricsPanel({ metrics, currentEntry, currentIndex, totalSteps, onScrub }: MetricsPanelProps) {
  const { state } = useAppContext();
  const algo = ALGORITHM_REGISTRY[state.algorithmId];

  const formatFieldLabel = (field: MetricField) => {
    switch (field) {
      case 'pathLength': return 'Path Length';
      case 'pathCost': return 'Total Cost';
      case 'comparisons': return 'Comparisons';
      case 'swaps': return 'Swaps';
      case 'writes': return 'Array Writes';
      case 'visited': return 'Visited Nodes';
    }
  };

  // Determine status badge
  let statusBadge = null;
  if (currentEntry?.type === 'SORT_COMPLETE') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
        <CheckCircle2 size={13} /> Sorted Complete
      </span>
    );
  } else if (currentEntry?.type === 'PATH_FOUND') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
        <CheckCircle2 size={13} />
        {currentEntry.optimal ? 'Shortest Path Found' : 'Path Found (Non-optimal)'}
      </span>
    );
  } else if (currentEntry?.type === 'PATH_NOT_FOUND') {
    statusBadge = (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0">
        <AlertTriangle size={13} /> No Path Possible
      </span>
    );
  }

  return (
    <div className="shrink-0 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800/80 px-3 sm:px-6 py-2 flex flex-col gap-2 z-10">
      {/* Metrics Cards Row — horizontally scrollable on small mobile screens, full grid on desktop */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
        {/* Time & Space Complexity Pill */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-3 py-1.5 shadow-2xs shrink-0">
          <div className="flex items-center gap-1.5">
            <Cpu size={13} className="text-indigo-500 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Time</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{algo.bigO.time}</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Database size={13} className="text-cyan-500 shrink-0" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Space</span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-100">{algo.bigO.space}</span>
          </div>
        </div>

        {/* Dynamic Algorithm Metric Pills */}
        {algo.metricSchema.map(field => {
          const val = getMetricValue(metrics, field);
          const displayVal = field === 'pathCost' && val % 1 !== 0 ? val.toFixed(1) : val;
          return (
            <div
              key={field}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-3 py-1.5 shadow-2xs shrink-0"
            >
              <Activity size={13} className="text-blue-500 shrink-0" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                {formatFieldLabel(field)}
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                {displayVal}
              </span>
            </div>
          );
        })}

        {/* Elapsed Time Pill */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-3 py-1.5 shadow-2xs shrink-0">
          <Clock size={13} className="text-amber-500 shrink-0" />
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Compute</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
            {metrics?.elapsedMs ? metrics.elapsedMs.toFixed(1) : '0.0'} ms
          </span>
        </div>

        {/* Status Badge + Timeline Scrubber on Desktop/Mobile */}
        <div className="ml-auto flex items-center gap-3 shrink-0">
          {statusBadge}

          {totalSteps > 1 && onScrub && (
            <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl px-3 py-1.5">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                Step
              </span>
              <input
                type="range"
                min={0}
                max={totalSteps - 1}
                value={currentIndex}
                onChange={(e) => onScrub(Number(e.target.value))}
                aria-label="Timeline Scrubber"
                className="w-20 md:w-28 accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
                {currentIndex + 1}/{totalSteps}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getMetricValue(metrics: SortMetrics | PathMetrics | undefined, field: MetricField): number {
  if (!metrics || !(field in metrics)) return 0;
  const value = metrics[field as keyof (SortMetrics | PathMetrics)];
  return typeof value === 'number' ? value : 0;
}
