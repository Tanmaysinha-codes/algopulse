import { useState } from 'react';
import { useAppContext } from '../contexts/AppContextValue';
import { ALGORITHM_REGISTRY } from '../utils/algorithmRegistry';
import { Code2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function CodePanel({ activeLine }: { activeLine?: number }) {
  const { state } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const algo = ALGORITHM_REGISTRY[state.algorithmId];

  const content = (
    <div className="p-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-sm h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Code2 size={16} />
          <span className="font-semibold uppercase tracking-wider text-xs">Pseudocode</span>
        </div>
        <button className="md:hidden p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded" onClick={() => setIsOpen(false)}>
          <X size={16} />
        </button>
      </div>
      <div className="flex flex-col">
        {algo.pseudocode.map((line, idx) => (
          <div 
            key={idx} 
            className={twMerge(clsx(
              "px-2 py-1 whitespace-pre rounded",
              activeLine === idx + 1 ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-l-2 border-blue-500" : "border-l-2 border-transparent opacity-70"
            ))}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700"
      >
        <Code2 size={24} />
      </button>

      {/* Desktop Panel */}
      <div className="hidden md:block w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {content}
      </div>

      {/* Mobile Drawer */}
      <div className={twMerge(clsx(
        "fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden shadow-2xl",
        isOpen ? "translate-x-0" : "translate-x-full"
      ))}>
        {content}
      </div>
      
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
