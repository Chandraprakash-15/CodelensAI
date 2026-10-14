import React, { useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { CodeEditor } from '../components/CodeEditor';
import { VisualizationPanel } from '../components/VisualizationPanel';
import { OutputPanel } from '../components/OutputPanel';
import { ResizableSplitPane } from '../components/ResizableSplitPane';
import { ProblemStatement } from '../components/problem/ProblemStatement';
import { ApproachSection } from '../components/problem/ApproachSection';
import { ComplexitySection } from '../components/problem/ComplexitySection';
import { VALID_PALINDROME_META } from '../data/problems/validPalindrome';
import {
  Play,
  Lock,
  Sparkles,
  Loader2,
  RotateCcw,
  Code2,
  BookOpen,
  Lightbulb,
  BarChart2,
} from 'lucide-react';
import type { ExecutionState, ExecutionResponse, ExecutionStepItem } from '../types';

// ─── Section IDs (for anchor navigation / aria) ─────────────────────────────
const SECTIONS = [
  { id: 'problem',    icon: BookOpen,  label: 'Problem'    },
  { id: 'approach',   icon: Lightbulb, label: 'Approach'   },
  { id: 'complexity', icon: BarChart2, label: 'Complexity' },
  { id: 'practice',   icon: Code2,     label: 'Practice'   },
] as const;

export const ProblemPage: React.FC = () => {
  // ─── Editor / Execution State ──────────────────────────────────────────────
  // Starter code seeded from VALID_PALINDROME_META — previously was HELLO_WORLD_PROBLEM
  const [code, setCode] = useState<string>(VALID_PALINDROME_META.starterCode);
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [executionState, setExecutionState] = useState<ExecutionState>('READY');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [steps, setSteps] = useState<ExecutionStepItem[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // ─── Active section scroll state ───────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<string>('problem');

  // ─── Execution Handlers (unchanged from original) ─────────────────────────

  // Clear previous execution and trace whenever code is modified to prevent stale visualization
  const handleCodeChange = useCallback((newVal: string | undefined) => {
    const updatedCode = newVal ?? '';
    setCode(updatedCode);
    setExecutionState('READY');
    setOutput('');
    setError('');
    setErrorLine(null);
    setSteps([]);
    setCurrentStepIndex(0);
  }, []);

  const handleResetCode = useCallback(() => {
    handleCodeChange(VALID_PALINDROME_META.starterCode);
    setStdin('');
  }, [handleCodeChange]);

  const handleRunCode = async () => {
    if (executionState === 'RUNNING') return;

    setExecutionState('RUNNING');
    setOutput('');
    setError('');
    setErrorLine(null);
    setSteps([]);
    setCurrentStepIndex(0);

    try {
      const res = await fetch('/api/execution/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          stdin,
          timeoutSeconds: 5,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data: ExecutionResponse = await res.json();

      if (data.status === 'COMPILATION_ERROR') {
        setExecutionState('COMPILATION_ERROR');
        setError(data.error || 'Compilation Failed');
        setErrorLine(data.errorLine ?? null);
        setOutput('');
        setSteps([]);
        setCurrentStepIndex(0);
      } else if (data.status === 'RUNTIME_ERROR') {
        setExecutionState('RUNTIME_ERROR');
        setError(data.error || 'Execution Failed');
        setErrorLine(data.errorLine ?? null);
        setOutput(data.output || '');
        setSteps([]);
        setCurrentStepIndex(0);
      } else if (data.status === 'TIMEOUT') {
        setExecutionState('TIMEOUT');
        setError(data.error || 'Runtime Error: Execution timed out');
        setOutput(data.output || '');
        setSteps([]);
        setCurrentStepIndex(0);
      } else {
        setExecutionState('SUCCESS');
        setOutput(data.output || '');
        setError('');
        setErrorLine(null);
        const returnedSteps = data.steps || [];
        setSteps(returnedSteps);
        setCurrentStepIndex(0);
      }
    } catch (err: any) {
      console.error('Execution request error:', err);
      setExecutionState('RUNTIME_ERROR');
      setError(`Backend Communication Error:\n${err?.message || 'Could not connect to backend service'}`);
      setOutput('');
      setSteps([]);
      setCurrentStepIndex(0);
    }
  };

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  }, [steps.length]);

  const handleResetStep = useCallback(() => {
    setCurrentStepIndex(0);
  }, []);

  const handleSelectStep = useCallback((index: number) => {
    setCurrentStepIndex(index);
  }, []);

  // Compute active executing line number in Monaco editor from real trace step
  const activeLineNumber =
    executionState === 'SUCCESS' && steps.length > 0 && steps[currentStepIndex]
      ? (steps[currentStepIndex].lineNumber ?? steps[currentStepIndex].line ?? undefined)
      : undefined;

  // ─── Section tab click ─────────────────────────────────────────────────────
  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      {/* ── Sticky Section Nav ─────────────────────────────────────────── */}
      <div className="sticky top-[57px] z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex items-center gap-0.5 overflow-x-auto" aria-label="Page sections">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollToSection(id)}
                className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeSection === id
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 pb-12 flex flex-col gap-12">
        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — PROBLEM
        ════════════════════════════════════════════════════════════════ */}
        <div id="section-problem" className="pt-10 scroll-mt-24">
          <div className="mb-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
              01
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Problem
            </span>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>
          <ProblemStatement problem={VALID_PALINDROME_META} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — APPROACH
        ════════════════════════════════════════════════════════════════ */}
        <div id="section-approach" className="scroll-mt-24">
          <div className="mb-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
              02
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Approach
            </span>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>
          <ApproachSection approach={VALID_PALINDROME_META.approach} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — COMPLEXITY
        ════════════════════════════════════════════════════════════════ */}
        <div id="section-complexity" className="scroll-mt-24">
          <div className="mb-3 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
              03
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Complexity
            </span>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>
          <ComplexitySection complexity={VALID_PALINDROME_META.complexity} />
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — PRACTICE (Editor + Visualization)
            Everything below this line is the original Problem.tsx code,
            unchanged. The real execution pipeline lives here.
        ════════════════════════════════════════════════════════════════ */}
        <div id="section-practice" className="scroll-mt-24 flex flex-col gap-5">
          <div className="mb-1 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-800 text-slate-400 border border-slate-700">
              04
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
              Practice
            </span>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>

          {/* Top Toolbar */}
          <section className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetCode}
                title="Reset to sample code"
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Run Code Button */}
              <button
                type="button"
                onClick={handleRunCode}
                disabled={executionState === 'RUNNING'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                {executionState === 'RUNNING' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Tracing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>Run Code</span>
                  </>
                )}
              </button>

              {/* Visualize Button (Unlocked after successful execution with trace) */}
              <button
                type="button"
                onClick={handleResetStep}
                disabled={executionState !== 'SUCCESS' || steps.length === 0}
                title={
                  executionState === 'SUCCESS' && steps.length > 0
                    ? `Execution trace ready (${steps.length} steps)`
                    : 'Compile and run successfully first to unlock visualization'
                }
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all border ${
                  executionState === 'SUCCESS' && steps.length > 0
                    ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border-cyan-500/40 shadow-md shadow-cyan-500/10 active:scale-95'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800/80 cursor-not-allowed opacity-60'
                }`}
              >
                {executionState === 'SUCCESS' && steps.length > 0 ? (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Trace Ready ({steps.length})</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Visualize 🔒</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Resizable Split Pane: Left (Editor) & Right (Output & Visualization) */}
          <section className="w-full">
            <ResizableSplitPane
              initialSplit={52}
              minLeftPercentage={30}
              maxLeftPercentage={70}
              left={
                <div className="h-full flex flex-col">
                  <CodeEditor
                    code={code}
                    onChange={handleCodeChange}
                    activeLineNumber={activeLineNumber}
                    errorLineNumber={errorLine}
                  />
                </div>
              }
              right={
                <div className="h-full flex flex-col gap-4">
                  <OutputPanel
                    status={executionState}
                    output={output}
                    error={error}
                    stdin={stdin}
                    onStdinChange={setStdin}
                    showStdin={showStdin}
                    onToggleStdin={() => setShowStdin((prev) => !prev)}
                  />

                  <VisualizationPanel
                    executionState={executionState}
                    steps={steps}
                    currentStepIndex={currentStepIndex}
                    onPrevStep={handlePrevStep}
                    onNextStep={handleNextStep}
                    onResetStep={handleResetStep}
                    onSelectStep={handleSelectStep}
                  />
                </div>
              }
            />
          </section>
        </div>
      </main>
    </div>
  );
};
