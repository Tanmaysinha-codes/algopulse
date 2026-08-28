import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { SortMetrics, PathMetrics } from '../types/steps';
import { MetricField } from '../types/registry';

interface MetricsPanelProps {
  metrics?: SortMetrics | PathMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const { state } = useAppContext();
  const algo = ALGORITHM_REGISTRY[state.algorithmId];

  // Capitalize first letter logic
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Time Complexity</span>
        <span className="text-lg font-mono text-slate-800 dark:text-slate-200">{algo.bigO.time}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Space Complexity</span>
        <span className="text-lg font-mono text-slate-800 dark:text-slate-200">{algo.bigO.space}</span>
      </div>

      {algo.metricSchema.map(field => {
        const val = getMetricValue(metrics, field);
        return (
          <div key={field} className="flex flex-col">
            <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              {field === 'pathLength' ? 'Path Length' : field === 'pathCost' ? 'Path Cost' : capitalize(field)}
            </span>
            <span className="text-lg font-mono text-slate-800 dark:text-slate-200">{val}</span>
          </div>
        );
      })}

      <div className="flex flex-col col-span-2 md:col-span-1">
        <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">Time Elapsed</span>
        <span className="text-lg font-mono text-slate-800 dark:text-slate-200">
          {metrics?.elapsedMs ? metrics.elapsedMs.toFixed(1) : '0.0'} ms
        </span>
      </div>
    </div>
  );
}

function getMetricValue(metrics: SortMetrics | PathMetrics | undefined, field: MetricField): number {
  if (!metrics || !(field in metrics)) return 0;
  const value = metrics[field as keyof (SortMetrics | PathMetrics)];
  return typeof value === 'number' ? value : 0;
}
