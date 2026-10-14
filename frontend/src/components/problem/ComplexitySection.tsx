import React from 'react';
import { Zap, Database } from 'lucide-react';
import type { ProblemMeta } from '../../types';

interface ComplexitySectionProps {
  complexity: ProblemMeta['complexity'];
}

export const ComplexitySection: React.FC<ComplexitySectionProps> = ({ complexity }) => {
  return (
    <section aria-label="Complexity Analysis" className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Complexity Analysis
        </span>
        <div className="flex-1 h-px bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Time Complexity */}
        <div className="relative flex flex-col gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-5 overflow-hidden hover:border-cyan-800/50 transition-colors group">
          {/* Accent glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/15 transition-colors">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Time Complexity
              </span>
              <span className="text-2xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                {complexity.time}
              </span>
            </div>
          </div>

          <p className="text-[12px] text-slate-400 leading-relaxed">
            {complexity.timeExplanation}
          </p>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              Linear — scales with input length
            </span>
          </div>
        </div>

        {/* Space Complexity */}
        <div className="relative flex flex-col gap-3 bg-slate-900/70 border border-slate-800 rounded-xl p-5 overflow-hidden hover:border-violet-800/50 transition-colors group">
          {/* Accent glow */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/15 transition-colors">
              <Database className="w-4 h-4 text-violet-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Space Complexity
              </span>
              <span className="text-2xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-purple-400">
                {complexity.space}
              </span>
            </div>
          </div>

          <p className="text-[12px] text-slate-400 leading-relaxed">
            {complexity.spaceExplanation}
          </p>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              Constant — no extra memory allocated
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
