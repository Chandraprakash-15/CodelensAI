import React from 'react';
import type { TraceStep } from '../types';
import { Activity, Code, Layers } from 'lucide-react';

interface VariablePanelProps {
  currentStep: TraceStep;
  totalSteps: number;
}

export const VariablePanel: React.FC<VariablePanelProps> = ({
  currentStep,
  totalSteps
}) => {
  const { step, action, explanation, variables, lineNumber } = currentStep;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200">Execution State</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Step <strong className="text-cyan-400">{step}</strong> of {totalSteps}
          </span>
        </div>
      </div>

      {/* Action Banner */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">
            Current Action
          </span>
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <Code className="w-3 h-3 text-slate-400" /> Line {lineNumber}
          </span>
        </div>
        <p className="text-sm font-medium text-white mb-1">{action}</p>
        <p className="text-xs text-slate-400 leading-relaxed">{explanation}</p>
      </div>

      {/* Variables Grid */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-slate-500" /> Tracked Variables
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-500 font-mono">left</div>
            <div className="text-base font-mono font-semibold text-cyan-400">
              {variables.left}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-500 font-mono">right</div>
            <div className="text-base font-mono font-semibold text-purple-400">
              {variables.right}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-500 font-mono">s.charAt(left)</div>
            <div className="text-base font-mono font-semibold text-slate-200">
              {variables.leftChar !== undefined
                ? `'${variables.leftChar === ' ' ? 'space' : variables.leftChar}'`
                : '—'}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[11px] text-slate-500 font-mono">s.charAt(right)</div>
            <div className="text-base font-mono font-semibold text-slate-200">
              {variables.rightChar !== undefined
                ? `'${variables.rightChar === ' ' ? 'space' : variables.rightChar}'`
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
