import React from 'react';
import { BookOpen, Tag, ChevronRight } from 'lucide-react';
import type { ProblemMeta } from '../../types';

interface ProblemStatementProps {
  problem: ProblemMeta;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/50',
  Medium: 'bg-amber-950/70 text-amber-300 border-amber-700/50',
  Hard: 'bg-rose-950/70 text-rose-300 border-rose-700/50',
};

export const ProblemStatement: React.FC<ProblemStatementProps> = ({ problem }) => {
  return (
    <section aria-label="Problem Statement" className="flex flex-col gap-5">
      {/* Title row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4.5 h-4.5 text-cyan-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          {problem.title}
        </h1>

        {/* Difficulty badge */}
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
            DIFFICULTY_STYLES[problem.difficulty] ?? ''
          }`}
        >
          {problem.difficulty}
        </span>

        {/* Category badge */}
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-cyan-300 border border-slate-700">
          <Tag className="w-3 h-3" />
          {problem.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
        {problem.description}
      </p>

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Constraints
          </span>
          <ul className="flex flex-col gap-1">
            {problem.constraints.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <ChevronRight className="w-3 h-3 text-cyan-500/60 flex-shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Examples */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Examples
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {problem.examples.map((ex, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2.5 bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
                Example {idx + 1}
              </span>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-slate-500 w-10 flex-shrink-0 pt-0.5">
                    Input:
                  </span>
                  <code className="text-xs font-mono text-cyan-200 break-all">{ex.input}</code>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] font-mono text-slate-500 w-10 flex-shrink-0 pt-0.5">
                    Output:
                  </span>
                  <code className="text-xs font-mono text-emerald-300 font-bold">{ex.output}</code>
                </div>
              </div>

              {ex.explanation && (
                <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-2">
                  {ex.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
