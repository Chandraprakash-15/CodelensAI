import React from 'react';
import { Terminal, CheckCircle2, AlertOctagon, AlertTriangle, CornerDownLeft } from 'lucide-react';
import type { ExecutionState } from '../types';

interface OutputPanelProps {
  status: ExecutionState;
  output: string;
  error?: string;
  stdin: string;
  onStdinChange: (val: string) => void;
  showStdin: boolean;
  onToggleStdin: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  status,
  output,
  error,
  stdin,
  onStdinChange,
  showStdin,
  onToggleStdin
}) => {
  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Program Output
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleStdin}
            className={`text-[11px] font-mono px-2.5 py-0.5 rounded transition-colors border ${
              showStdin || stdin.trim().length > 0
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle standard input (stdin) for Scanner programs"
          >
            {showStdin ? 'Hide Stdin' : 'Stdin'}{stdin.trim().length > 0 ? ` (${stdin.trim()})` : ''}
          </button>

          {/* Status Badge */}
          {status === 'SUCCESS' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              Execution Successful
            </span>
          )}
          {status === 'COMPILATION_ERROR' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/90 text-rose-300 border border-rose-700/60 shadow-sm">
              <AlertOctagon className="w-3 h-3 text-rose-400" />
              Compilation Failed
            </span>
          )}
          {status === 'RUNTIME_ERROR' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/90 text-amber-300 border border-amber-700/60 shadow-sm">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Execution Failed
            </span>
          )}
          {status === 'TIMEOUT' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/90 text-amber-300 border border-amber-700/60 shadow-sm">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Timed Out
            </span>
          )}
          {status === 'RUNNING' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/60">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Executing...
            </span>
          )}
        </div>
      </div>

      {/* Optional Stdin input field */}
      {showStdin && (
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="program-stdin" className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3 text-cyan-400" /> Standard Input (stdin):
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Passed to Scanner(System.in)</span>
          </div>
          <input
            id="program-stdin"
            type="text"
            value={stdin}
            onChange={(e) => onStdinChange(e.target.value)}
            placeholder="e.g. 5 or multiple inputs separated by space/newline"
            className="w-full bg-slate-900 border border-slate-700/80 rounded px-3 py-1.5 text-xs font-mono text-cyan-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      )}

      {/* Terminal Output Display */}
      <div className="p-4 bg-slate-950/90 min-h-[140px] max-h-[260px] overflow-y-auto font-mono text-xs leading-relaxed">
        {status === 'READY' && (
          <div className="text-slate-500 italic py-2">
            Click &quot;Run Code&quot; to compile and execute your Java program.
          </div>
        )}

        {status === 'RUNNING' && (
          <div className="text-cyan-400/80 flex items-center gap-2 py-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Compiling &amp; executing Java code on server...</span>
          </div>
        )}

        {status === 'COMPILATION_ERROR' && error && (
          <div className="text-rose-400 whitespace-pre-wrap font-mono">
            {error}
          </div>
        )}

        {status === 'RUNTIME_ERROR' && error && (
          <div className="text-rose-400 whitespace-pre-wrap font-mono">
            {error}
          </div>
        )}

        {status === 'TIMEOUT' && error && (
          <div className="text-amber-400 whitespace-pre-wrap font-mono">
            {error}
          </div>
        )}

        {status === 'SUCCESS' && (
          <div>
            {output ? (
              <pre className="text-emerald-300/90 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            ) : (
              <span className="text-slate-500 italic">
                (Program completed successfully with no standard output)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
