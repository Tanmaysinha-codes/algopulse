import { useState } from 'react';
import { useAppContext } from '../contexts/AppContextValue';
import { Moon, Sun, Share2, Menu, Activity, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Navbar() {
  const { state, dispatch } = useAppContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('URL copied to clipboard!');
  };

  const navLinks = (
    <>
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-md">
        <button
          onClick={() => { dispatch({ type: 'SET_MODE', payload: 'sorting' }); setMenuOpen(false); }}
          className={twMerge(clsx(
            "px-4 py-1 text-sm font-medium rounded transition-colors",
            state.mode === 'sorting' 
              ? "bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          ))}
        >
          Sorting
        </button>
        <button
          onClick={() => { dispatch({ type: 'SET_MODE', payload: 'pathfinding' }); setMenuOpen(false); }}
          className={twMerge(clsx(
            "px-4 py-1 text-sm font-medium rounded transition-colors",
            state.mode === 'pathfinding' 
              ? "bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400" 
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          ))}
        >
          Pathfinding
        </button>
      </div>
      <button onClick={toggleTheme} className="p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors" aria-label="Toggle theme">
        {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <button onClick={handleShare} className="flex items-center gap-2 p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-md transition-colors">
        <Share2 size={20} />
        <span className="md:hidden">Share</span>
      </button>
    </>
  );

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xl">
        <Activity size={24} />
        <span>AlgoPulse</span>
      </div>
      
      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-4">
        {navLinks}
      </div>

      {/* Mobile Nav Toggle */}
      <div className="md:hidden">
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-600 dark:text-slate-400">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {menuOpen && (
        <div className="absolute top-14 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 shadow-lg z-50 md:hidden">
          {navLinks}
        </div>
      )}
    </nav>
  );
}
