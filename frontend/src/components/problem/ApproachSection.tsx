import React, { useState } from 'react';
import { Lightbulb, ChevronRight, ArrowUpDown } from 'lucide-react';
import type { ProblemMeta } from '../../types';

interface ApproachSectionProps {
  approach: ProblemMeta['approach'];
}

// Static conceptual diagram string — this is an illustration only, NOT linked to runtime trace
const DIAGRAM_STRING = 'r a c e c a r';
const DIAGRAM_CHARS = DIAGRAM_STRING.split(' ');

export const ApproachSection: React.FC<ApproachSectionProps> = ({ approach }) => {
  const [diagramStep, setDiagramStep] = useState(0);

  // Static conceptual states for the diagram — purely illustrative
  const DIAGRAM_STATES = [
    { left: 0, right: 6, label: 'Initial state: left at start, right at end', match: null },
    { left: 0, right: 6, label: 'Compare s[left]="r" vs s[right]="r" → Match!', match: true },
    { left: 1, right: 5, label: 'Advance inward: left=1, right=5', match: null },
    { left: 1, right: 5, label: 'Compare s[left]="a" vs s[right]="a" → Match!', match: true },
    { left: 2, right: 4, label: 'Advance inward: left=2, right=4', match: null },
    { left: 2, right: 4, label: 'Compare s[left]="c" vs s[right]="c" → Match!', match: true },
    { left: 3, right: 3, label: 'Pointers meet at centre — palindrome confirmed!', match: true },
  ] as const;

  const state = DIAGRAM_STATES[Math.min(diagramStep, DIAGRAM_STATES.length - 1)];

  return (
    <section aria-label="Approach" className="flex flex-col gap-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-4.5 h-4.5 text-violet-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Approach</h2>
          <p className="text-xs text-slate-400">{approach.title}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-950/60 text-violet-300 border border-violet-700/40">
          <ArrowUpDown className="w-3 h-3" />
          Two Pointers
        </span>
      </div>

      {/* Summary prose */}
      <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
        {approach.summary}
      </p>

      {/* Conceptual Diagram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Concept Diagram
          </span>
          <span className="text-[10px] font-mono text-slate-600 italic">
            illustrative only — not live execution
          </span>
        </div>

        {/* Character cells */}
        <div className="flex flex-col gap-3 items-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {DIAGRAM_CHARS.map((ch, i) => {
              const isLeft = i === state.left;
              const isRight = i === state.right;
              const isBetween = i > state.left && i < state.right;
              const isMatched = state.match === true && (isLeft || isRight);
              const isCentre = state.left === state.right && i === state.left;

              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-mono font-bold text-sm sm:text-base transition-all duration-300 border ${
                      isCentre
                        ? 'bg-gradient-to-br from-cyan-500 to-violet-500 text-white border-cyan-400 shadow-lg shadow-cyan-500/30 scale-110'
                        : isMatched
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                        : isLeft || isRight
                        ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40 shadow-sm'
                        : isBetween
                        ? 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                        : 'bg-slate-900/40 text-slate-600 border-slate-800/40'
                    }`}
                  >
                    {ch}
                  </div>
                  <span className="text-[10px] font-mono text-slate-600">{i}</span>
                </div>
              );
            })}
          </div>

          {/* Pointer labels */}
          <div className="flex items-start gap-1.5 sm:gap-2">
            {DIAGRAM_CHARS.map((_, i) => {
              const isLeft = i === state.left;
              const isRight = i === state.right;
              const isCentre = state.left === state.right && i === state.left;
              return (
                <div key={i} className="w-9 sm:w-10 flex flex-col items-center">
                  {isCentre ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-mono text-cyan-400 animate-pointer-bounce">↑</span>
                      <span className="text-[8px] font-mono text-cyan-400 leading-none text-center">L/R</span>
                    </div>
                  ) : isLeft ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-mono text-cyan-400 animate-pointer-bounce">↑</span>
                      <span className="text-[8px] font-mono text-cyan-400 leading-none">left</span>
                    </div>
                  ) : isRight ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-mono text-violet-400 animate-pointer-bounce">↑</span>
                      <span className="text-[8px] font-mono text-violet-400 leading-none">right</span>
                    </div>
                  ) : (
                    <span className="w-full" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step caption */}
          <div className="text-center">
            <p className="text-xs text-slate-300 font-mono">{state.label}</p>
          </div>
        </div>

        {/* Diagram navigation */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setDiagramStep((s) => Math.max(0, s - 1))}
            disabled={diagramStep === 0}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 border border-slate-700 transition-all"
          >
            ← Prev
          </button>
          <span className="text-[10px] font-mono text-slate-500">
            {diagramStep + 1} / {DIAGRAM_STATES.length}
          </span>
          <button
            type="button"
            onClick={() => setDiagramStep((s) => Math.min(DIAGRAM_STATES.length - 1, s + 1))}
            disabled={diagramStep >= DIAGRAM_STATES.length - 1}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-300 border border-slate-700 transition-all"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Algorithm steps */}
      <div className="flex flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Step-by-step
        </span>
        <ol className="flex flex-col gap-2">
          {approach.steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700/80 transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center text-[11px] font-bold text-cyan-300 font-mono">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs font-semibold text-white">{step.label}</span>
                <span className="text-[12px] text-slate-400 leading-relaxed">{step.detail}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Why it works */}
      <div className="flex items-start gap-3 bg-violet-950/20 border border-violet-800/30 rounded-xl p-4">
        <ChevronRight className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-violet-300">Why this works</span>
          <p className="text-[12px] text-slate-300 leading-relaxed">{approach.why}</p>
        </div>
      </div>
    </section>
  );
};
