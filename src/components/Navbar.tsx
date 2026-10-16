import { useState } from 'react';
import { useAppContext } from '../contexts/AppContextValue';
import { Moon, Sun, Share2, Activity, Check, BarChart2, Compass, Volume2, VolumeX, Zap, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAudio } from '../hooks/useAudio';

export function Navbar() {
  const { state, dispatch } = useAppContext();
  const [copied, setCopied] = useState(false);
  const { isAvailable } = useAudio(state.audioEnabled);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="shrink-0 flex items-center justify-between px-3 sm:px-6 h-14 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <Activity size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent leading-none">
            AlgoPulse
          </span>
          <span className="hidden sm:inline text-[10px] font-medium text-slate-400 dark:text-slate-500 tracking-wider uppercase mt-0.5">
            Interactive Studio
          </span>
        </div>
      </div>

      {/* Center Group: Mode Switcher + Race Mode Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Module Switcher: Sorting vs Pathfinding */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => dispatch({ type: 'SET_MODE', payload: 'sorting' })}
            className={twMerge(clsx(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200",
              state.mode === 'sorting'
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            ))}
          >
            <BarChart2 size={15} />
            <span>Sorting</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_MODE', payload: 'pathfinding' })}
            className={twMerge(clsx(
              "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200",
              state.mode === 'pathfinding'
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            ))}
          >
            <Compass size={15} />
            <span>Pathfinding</span>
          </button>
        </div>

        {/* Solo vs Race Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_RACE_MODE', payload: false })}
            className={twMerge(clsx(
              "flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
              !state.isRaceMode
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            ))}
            title="Single algorithm deep view"
          >
            <User size={13} />
            <span className="hidden xs:inline">Solo</span>
          </button>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_RACE_MODE', payload: true })}
            className={twMerge(clsx(
              "flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all",
              state.isRaceMode
                ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-sm shadow-amber-500/25 ring-1 ring-amber-500/30"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            ))}
            title="Side-by-side head-to-head algorithm race"
          >
            <Zap size={13} className={state.isRaceMode ? "fill-white text-white" : "text-amber-500"} />
            <span>Race</span>
          </button>
        </div>
      </div>

      {/* Quick Actions: Audio, Theme, Share */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          disabled={!isAvailable}
          onClick={() => dispatch({ type: 'TOGGLE_AUDIO', payload: !state.audioEnabled })}
          className={twMerge(clsx(
            "p-2 rounded-xl transition-colors border border-transparent",
            !isAvailable
              ? "text-slate-400 opacity-40 cursor-not-allowed"
              : state.audioEnabled
                ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border-indigo-200/50 dark:border-indigo-800/40"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          ))}
          aria-label="Toggle Audio"
          title={!isAvailable ? "Audio unavailable" : state.audioEnabled ? "Mute sound" : "Enable sound"}
        >
          {state.audioEnabled && isAvailable ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-xl transition-colors"
          aria-label="Toggle theme"
          title={state.theme === 'dark' ? "Switch to light mode" : "Switch to dark mode"}
        >
          {state.theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        <button
          onClick={handleShare}
          className={twMerge(clsx(
            "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all border",
            copied
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
              : "bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60"
          ))}
          title="Copy shareable link with current state"
        >
          {copied ? <Check size={15} /> : <Share2 size={15} />}
          <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </header>
  );
}
