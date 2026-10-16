import { memo, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { HistoryEntry, PathStepEvent, SortMetrics, PathMetrics } from '../types/steps';
import { SortingBoard } from '../features/sorting/SortingBoard';
import { PathGrid } from '../features/pathfinding/PathGrid';
import { Trophy, Zap, Clock, Activity, CheckCircle2, Award } from 'lucide-react';

interface RaceArenaProps {
  entryA: HistoryEntry | null;
  entryB: HistoryEntry | null;
  winner: 'A' | 'B' | 'TIE' | null;
  finishTimeA?: number;
  finishTimeB?: number;
}

export const RaceArena = memo(({ entryA, entryB, winner }: RaceArenaProps) => {
  const { state } = useAppContext();
  const algoA = ALGORITHM_REGISTRY[state.algorithmId];
  const algoB = ALGORITHM_REGISTRY[state.algorithmIdB];

  const metricsA = entryA?.metrics as (SortMetrics | PathMetrics) | undefined;
  const metricsB = entryB?.metrics as (SortMetrics | PathMetrics) | undefined;

  const isDoneA = entryA?.type === 'SORT_COMPLETE' || entryA?.type === 'PATH_FOUND' || entryA?.type === 'PATH_NOT_FOUND';
  const isDoneB = entryB?.type === 'SORT_COMPLETE' || entryB?.type === 'PATH_FOUND' || entryB?.type === 'PATH_NOT_FOUND';

  // Comparative Victory Analysis
  const comparativeVerdict = useMemo(() => {
    if (!winner || !metricsA || !metricsB) return null;

    if (state.mode === 'sorting') {
      const mA = metricsA as SortMetrics;
      const mB = metricsB as SortMetrics;
      const opsA = (mA.comparisons || 0) + (mA.swaps || 0) + (mA.writes || 0);
      const opsB = (mB.comparisons || 0) + (mB.swaps || 0) + (mB.writes || 0);

      const winningAlgo = winner === 'A' ? algoA.displayName : algoB.displayName;
      const winningOps = winner === 'A' ? opsA : opsB;
      const losingOps = winner === 'A' ? opsB : opsA;

      const opsRatio = losingOps > 0 && winningOps > 0 ? (losingOps / winningOps).toFixed(1) : null;
      const pctFewer = losingOps > 0 ? Math.round(((losingOps - winningOps) / losingOps) * 100) : null;

      return {
        winnerName: winningAlgo,
        highlight: pctFewer && pctFewer > 0
          ? `${winningAlgo} won with ${pctFewer}% fewer operations (${opsRatio ? `${opsRatio}x efficiency` : ''})!`
          : `${winningAlgo} crossed the finish line first!`,
        subtext: `Time Complexity: ${winner === 'A' ? algoA.bigO.time : algoB.bigO.time} vs ${winner === 'A' ? algoB.bigO.time : algoA.bigO.time}`
      };
    } else {
      const mA = metricsA as PathMetrics;
      const mB = metricsB as PathMetrics;
      const visA = mA.visited || 0;
      const visB = mB.visited || 0;

      const winningAlgo = winner === 'A' ? algoA.displayName : algoB.displayName;
      const winningVis = winner === 'A' ? visA : visB;
      const losingVis = winner === 'A' ? visB : visA;

      const pctFewer = losingVis > 0 ? Math.round(((losingVis - winningVis) / losingVis) * 100) : null;

      return {
        winnerName: winningAlgo,
        highlight: pctFewer && pctFewer > 0
          ? `${winningAlgo} reached the target exploring ${pctFewer}% fewer grid nodes (${winningVis} vs ${losingVis})!`
          : `${winningAlgo} reached target first!`,
        subtext: `Cost: ${mA.pathCost?.toFixed(1) || 0} vs ${mB.pathCost?.toFixed(1) || 0} • Path: ${mA.pathLength || 0} vs ${mB.pathLength || 0} steps`
      };
    }
  }, [winner, metricsA, metricsB, state.mode, algoA, algoB]);

  return (
    <div className="flex-1 flex flex-col bg-slate-100/60 dark:bg-slate-950 overflow-hidden relative">
      {/* Race Results Banner (Shows when winner is determined) */}
      {comparativeVerdict && (
        <div className="shrink-0 bg-gradient-to-r from-amber-500/15 via-indigo-500/15 to-rose-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs z-10 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-amber-500 text-white shadow-xs">
              <Trophy size={14} />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                {comparativeVerdict.highlight}
              </span>
              <span className="hidden sm:inline text-slate-500 dark:text-slate-400 ml-2">
                ({comparativeVerdict.subtext})
              </span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px]">
            <Award size={14} /> 1st: {comparativeVerdict.winnerName}
          </div>
        </div>
      )}

      {/* Dual Arena View: Side-by-Side on Desktop, Stacked on Mobile */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden">
        {/* Contender A Board (Indigo Theme) */}
        <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-sm overflow-hidden relative">
          {/* Contender A Header & Telemetry */}
          <div className="shrink-0 px-3 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                Contender A
              </span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {algoA.displayName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                {algoA.bigO.time}
              </span>
            </div>

            {/* Status / Placement Badge */}
            <div className="flex items-center gap-1.5">
              {winner === 'A' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-bounce">
                  <Trophy size={11} /> 1st Place
                </span>
              ) : isDoneA ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={11} /> Finished
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  <Zap size={11} className="text-indigo-500 animate-pulse" /> Racing
                </span>
              )}
            </div>

            {/* Telemetry Chips */}
            <div className="w-full flex items-center gap-2 text-[10px] font-mono font-semibold pt-1 border-t border-indigo-100/60 dark:border-indigo-900/40 text-slate-600 dark:text-slate-300">
              {state.mode === 'sorting' ? (
                <>
                  <span>Comp: <strong className="text-indigo-600 dark:text-indigo-400">{(metricsA as SortMetrics)?.comparisons || 0}</strong></span>
                  <span>•</span>
                  <span>Swaps: <strong className="text-indigo-600 dark:text-indigo-400">{(metricsA as SortMetrics)?.swaps || (metricsA as SortMetrics)?.writes || 0}</strong></span>
                  <span className="ml-auto flex items-center gap-1 text-slate-400">
                    <Clock size={10} /> {(metricsA as SortMetrics)?.elapsedMs?.toFixed(1) || '0.0'}ms
                  </span>
                </>
              ) : (
                <>
                  <span>Visited: <strong className="text-indigo-600 dark:text-indigo-400">{(metricsA as PathMetrics)?.visited || 0}</strong></span>
                  <span>•</span>
                  <span>Len: <strong className="text-indigo-600 dark:text-indigo-400">{(metricsA as PathMetrics)?.pathLength || 0}</strong></span>
                  <span>•</span>
                  <span>Cost: <strong className="text-indigo-600 dark:text-indigo-400">{(metricsA as PathMetrics)?.pathCost?.toFixed(1) || 0}</strong></span>
                  <span className="ml-auto flex items-center gap-1 text-slate-400">
                    <Clock size={10} /> {(metricsA as PathMetrics)?.elapsedMs?.toFixed(1) || '0.0'}ms
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visual Canvas A */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {state.mode === 'sorting' ? (
              <SortingBoard entry={entryA?.type === 'SORT_STEP' || entryA?.type === 'SORT_COMPLETE' ? entryA : null} />
            ) : (
              <PathGrid grid={(entryA as PathStepEvent)?.grid || []} />
            )}
          </div>
        </div>

        {/* Contender B Board (Rose Theme) */}
        <div className="flex-1 flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/60 shadow-sm overflow-hidden relative">
          {/* Contender B Header & Telemetry */}
          <div className="shrink-0 px-3 py-2 bg-rose-50/70 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider shadow-2xs">
                Contender B
              </span>
              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {algoB.displayName}
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-semibold">
                {algoB.bigO.time}
              </span>
            </div>

            {/* Status / Placement Badge */}
            <div className="flex items-center gap-1.5">
              {winner === 'B' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-bounce">
                  <Trophy size={11} /> 1st Place
                </span>
              ) : isDoneB ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={11} /> Finished
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  <Activity size={11} className="text-rose-500 animate-pulse" /> Racing
                </span>
              )}
            </div>

            {/* Telemetry Chips */}
            <div className="w-full flex items-center gap-2 text-[10px] font-mono font-semibold pt-1 border-t border-rose-100/60 dark:border-rose-900/40 text-slate-600 dark:text-slate-300">
              {state.mode === 'sorting' ? (
                <>
                  <span>Comp: <strong className="text-rose-600 dark:text-rose-400">{(metricsB as SortMetrics)?.comparisons || 0}</strong></span>
                  <span>•</span>
                  <span>Swaps: <strong className="text-rose-600 dark:text-rose-400">{(metricsB as SortMetrics)?.swaps || (metricsB as SortMetrics)?.writes || 0}</strong></span>
                  <span className="ml-auto flex items-center gap-1 text-slate-400">
                    <Clock size={10} /> {(metricsB as SortMetrics)?.elapsedMs?.toFixed(1) || '0.0'}ms
                  </span>
                </>
              ) : (
                <>
                  <span>Visited: <strong className="text-rose-600 dark:text-rose-400">{(metricsB as PathMetrics)?.visited || 0}</strong></span>
                  <span>•</span>
                  <span>Len: <strong className="text-rose-600 dark:text-rose-400">{(metricsB as PathMetrics)?.pathLength || 0}</strong></span>
                  <span>•</span>
                  <span>Cost: <strong className="text-rose-600 dark:text-rose-400">{(metricsB as PathMetrics)?.pathCost?.toFixed(1) || 0}</strong></span>
                  <span className="ml-auto flex items-center gap-1 text-slate-400">
                    <Clock size={10} /> {(metricsB as PathMetrics)?.elapsedMs?.toFixed(1) || '0.0'}ms
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Visual Canvas B */}
          <div className="flex-1 overflow-hidden flex flex-col relative">
            {state.mode === 'sorting' ? (
              <SortingBoard entry={entryB?.type === 'SORT_STEP' || entryB?.type === 'SORT_COMPLETE' ? entryB : null} />
            ) : (
              <PathGrid grid={(entryB as PathStepEvent)?.grid || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
