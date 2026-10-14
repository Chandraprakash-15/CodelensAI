import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2, Sparkles } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 lg:py-24 max-w-4xl mx-auto text-center">
        {/* Subtle Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-8 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Java Execution Visualizer</span>
        </div>

        {/* Title / Brand */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/30">
            <Code2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            CodeLens <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">AI</span>
          </h1>
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          See Your Code <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">Think.</span>
        </h2>

        {/* Description */}
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Write, run, and visualize Java programs step by step.
        </p>

        {/* Primary CTA */}
        <Link
          to="/problem/valid-palindrome"
          className="inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 group hover:-translate-y-0.5 active:translate-y-0"
        >
          <span>Start Visualizing</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 font-mono">
        CodeLens AI &copy; {new Date().getFullYear()} — Step-by-step Java Visualizer
      </footer>
    </div>
  );
};
