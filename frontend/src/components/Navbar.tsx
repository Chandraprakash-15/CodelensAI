import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Eye, Terminal } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isProblemPage = location.pathname.startsWith('/problem');

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-all duration-300">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              CodeLens <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-extrabold">AI</span>
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          <Link
            to="/problem/valid-palindrome"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isProblemPage
                ? 'bg-slate-800/90 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Problems</span>
          </Link>

          <Link
            to="/problem/valid-palindrome"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isProblemPage
                ? 'text-slate-200 hover:bg-slate-800/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Visualizer</span>
          </Link>
        </nav>
      </div>
    </header>
  );
};
