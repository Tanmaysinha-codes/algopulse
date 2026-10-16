import { useState } from 'react';
import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { Code2, X, Terminal } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CodePanelProps {
  activeLine?: number;
  activeLineB?: number;
}

export function CodePanel({ activeLine, activeLineB }: CodePanelProps) {
  const { state } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [raceTab, setRaceTab] = useState<'A' | 'B'>('A');

  const activeAlgoId = state.isRaceMode 
    ? (raceTab === 'A' ? state.algorithmId : state.algorithmIdB)
    : state.algorithmId;

  const currentActiveLine = state.isRaceMode
    ? (raceTab === 'A' ? activeLine : activeLineB)
    : activeLine;

  const algo = ALGORITHM_REGISTRY[activeAlgoId];

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Terminal size={14} />
            </div>
            <div>
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block leading-none">
                {algo.displayName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">
                Live Pseudocode Trace
              </span>
            </div>
          </div>
          <button
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close Pseudocode Drawer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Race Mode Competitor Tabs */}
        {state.isRaceMode && (
          <div className="flex items-center px-3 pb-2 gap-1.5">
            <button
              onClick={() => setRaceTab('A')}
              className={twMerge(clsx(
                "flex-1 py-1 px-2 rounded-lg text-xs font-semibold text-center transition-all truncate",
                raceTab === 'A'
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              ))}
            >
              A: {ALGORITHM_REGISTRY[state.algorithmId].displayName}
            </button>
            <button
              onClick={() => setRaceTab('B')}
              className={twMerge(clsx(
                "flex-1 py-1 px-2 rounded-lg text-xs font-semibold text-center transition-all truncate",
                raceTab === 'B'
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              ))}
            >
              B: {ALGORITHM_REGISTRY[state.algorithmIdB].displayName}
            </button>
          </div>
        )}
      </div>

      {/* Code Lines */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs leading-relaxed select-text">
        <div className="flex flex-col gap-0.5">
          {algo.pseudocode.map((line, idx) => {
            const lineNum = idx + 1;
            const isActive = currentActiveLine === lineNum;
            return (
              <div 
                key={idx} 
                className={twMerge(clsx(
                  "flex items-start gap-3 px-2.5 py-1.5 rounded-lg transition-colors duration-100",
                  isActive
                    ? raceTab === 'B' && state.isRaceMode
                      ? "bg-rose-500/15 dark:bg-rose-500/20 text-rose-950 dark:text-rose-200 font-semibold ring-1 ring-inset ring-rose-500/30"
                      : "bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-950 dark:text-indigo-200 font-semibold ring-1 ring-inset ring-indigo-500/30"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
                ))}
              >
                <span className={twMerge(clsx(
                  "select-none w-4 text-right text-[10px] pt-0.5 shrink-0",
                  isActive 
                    ? raceTab === 'B' && state.isRaceMode ? "text-rose-600 dark:text-rose-400 font-bold" : "text-indigo-600 dark:text-indigo-400 font-bold" 
                    : "text-slate-400 dark:text-slate-600"
                ))}>
                  {lineNum}
                </span>
                <span className="whitespace-pre overflow-x-auto no-scrollbar">{line}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>Active Line</span>
        <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
          {currentActiveLine ? `Line ${currentActiveLine}` : 'Idle'}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile / Tablet Floating Pill Trigger */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-30 flex items-center gap-2 bg-slate-900/90 dark:bg-indigo-600/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-full shadow-lg shadow-slate-900/20 dark:shadow-indigo-600/30 border border-white/10 hover:scale-105 active:scale-95 transition-all text-xs font-semibold"
        aria-label="Open Pseudocode"
      >
        <Code2 size={16} />
        <span>Code</span>
        {currentActiveLine && (
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-500 dark:bg-slate-900/60 text-[10px] font-mono">
            L{currentActiveLine}
          </span>
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-80 xl:w-88 shrink-0 border-l border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        {content}
      </aside>

      {/* Mobile / Tablet Bottom-Sheet & Side Drawer */}
      <div className={twMerge(clsx(
        "fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto h-[65vh] sm:h-full w-full sm:w-88 rounded-t-2xl sm:rounded-none overflow-hidden bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-out lg:hidden shadow-2xl border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800",
        isOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"
      ))}>
        {content}
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 lg:hidden transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
