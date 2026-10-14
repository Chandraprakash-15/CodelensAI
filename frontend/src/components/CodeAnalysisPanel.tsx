import React from 'react';
import {
  Brain,
  Clock,
  Database,
  Lightbulb,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { CodeAnalysis } from '../services/geminiService';

// ─── Approach → color/icon mapping ────────────────────────────────────────────
const APPROACH_COLORS: Record<string, string> = {
  'Two Pointers': 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/40 text-cyan-300',
  'Sliding Window': 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-300',
  'Binary Search': 'from-violet-500/20 to-violet-600/10 border-violet-500/40 text-violet-300',
  'Dynamic Programming': 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300',
  'Recursion': 'from-pink-500/20 to-pink-600/10 border-pink-500/40 text-pink-300',
  'BFS/DFS': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-300',
  'Hash Map': 'from-orange-500/20 to-orange-600/10 border-orange-500/40 text-orange-300',
  'Stack': 'from-rose-500/20 to-rose-600/10 border-rose-500/40 text-rose-300',
  'Greedy': 'from-teal-500/20 to-teal-600/10 border-teal-500/40 text-teal-300',
  'Divide & Conquer': 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/40 text-indigo-300',
};

function getApproachStyle(approach: string): string {
  for (const key of Object.keys(APPROACH_COLORS)) {
    if (approach.toLowerCase().includes(key.toLowerCase())) {
      return APPROACH_COLORS[key];
    }
  }
  return 'from-slate-500/20 to-slate-600/10 border-slate-500/40 text-slate-300';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

interface ComplexityCardProps {
  label: string;
  value: string;
  explanation: string;
  icon: React.ReactNode;
  colorClass: string;
}

const ComplexityCard: React.FC<ComplexityCardProps> = ({
  label,
  value,
  explanation,
  icon,
  colorClass,
}) => (
  <div className={`flex-1 rounded-xl border bg-gradient-to-br p-3.5 ${colorClass}`}>
    <div className="flex items-center gap-1.5 mb-2">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</span>
    </div>
    <div className="text-xl font-black font-mono mb-1">{value}</div>
    <p className="text-[11px] opacity-60 leading-relaxed">{explanation}</p>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export type AnalysisStatus = 'idle' | 'loading' | 'done' | 'error';

interface CodeAnalysisPanelProps {
  status: AnalysisStatus;
  analysis: CodeAnalysis | null;
  error: string | null;
  modelName: string | null;
}

export const CodeAnalysisPanel: React.FC<CodeAnalysisPanelProps> = ({
  status,
  analysis,
  error,
  modelName,
}) => {
  // ── Idle state ────────────────────────────────────────────────────────────
  if (status === 'idle') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
          <Brain className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-400">AI Analysis</p>
          <p className="text-xs text-slate-600 mt-0.5">
            Run your code successfully to unlock Gemini-powered analysis.
          </p>
        </div>
      </div>
    );
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/50 p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[180px]">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-cyan-300">Analyzing</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Detecting approach, complexity &amp; insights
          </p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (status === 'error') {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 flex gap-3 min-h-[100px]">
        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-300">Analysis failed</p>
          <p className="text-xs text-red-400/70 mt-1 font-mono leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // ── Done state ────────────────────────────────────────────────────────────
  if (!analysis) return null;

  const approachStyle = getApproachStyle(analysis.approach);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            AI Analysis
          </span>
        </div>
        {modelName && (
          <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-2 py-0.5 rounded-full">
            {modelName}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Problem Name + Description */}
        <div>
          <h3 className="text-base font-extrabold text-white tracking-tight mb-1">
            {analysis.problemName}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {analysis.description}
          </p>
        </div>

        {/* Approach Badge */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Approach
          </p>
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-gradient-to-r text-sm font-bold ${approachStyle}`}
          >
            <Zap className="w-3.5 h-3.5" />
            {analysis.approach}
          </div>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {analysis.approachExplanation}
          </p>
        </div>

        {/* Complexity Cards */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Complexity
          </p>
          <div className="flex gap-3">
            <ComplexityCard
              label="Time"
              value={analysis.timeComplexity}
              explanation={analysis.timeExplanation}
              icon={<Clock className="w-3.5 h-3.5" />}
              colorClass="from-cyan-500/10 to-cyan-600/5 border-cyan-500/20 text-cyan-300"
            />
            <ComplexityCard
              label="Space"
              value={analysis.spaceComplexity}
              explanation={analysis.spaceExplanation}
              icon={<Database className="w-3.5 h-3.5" />}
              colorClass="from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-300"
            />
          </div>
        </div>

        {/* Key Insights */}
        {analysis.keyInsights?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3" />
              Key Insights
            </p>
            <ul className="flex flex-col gap-1.5">
              {analysis.keyInsights.map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-500/60 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
