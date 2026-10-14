import React, { useState, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { CodeEditor } from '../components/CodeEditor';
import { VisualizationPanel } from '../components/VisualizationPanel';
import { OutputPanel } from '../components/OutputPanel';
import { ResizableSplitPane } from '../components/ResizableSplitPane';
import { CodeAnalysisPanel } from '../components/CodeAnalysisPanel';
import { analyzeCode, listAvailableModels } from '../services/geminiService';
import { VALID_PALINDROME_META } from '../data/problems/validPalindrome';
import {
  Play,
  Lock,
  Sparkles,
  Loader2,
  RotateCcw,
  Brain,
} from 'lucide-react';
import type { ExecutionState, ExecutionResponse, ExecutionStepItem } from '../types';
import type { CodeAnalysis } from '../services/geminiService';
import type { AnalysisStatus } from '../components/CodeAnalysisPanel';

export const VisualizingPage: React.FC = () => {
  // ─── Editor / Execution State ──────────────────────────────────────────────
  const [code, setCode] = useState<string>(VALID_PALINDROME_META.starterCode);
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [executionState, setExecutionState] = useState<ExecutionState>('READY');
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [steps, setSteps] = useState<ExecutionStepItem[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);

  // ─── AI Analysis State ─────────────────────────────────────────────────────
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysis, setAnalysis] = useState<CodeAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [resolvedModel, setResolvedModel] = useState<string | null>(null);

  // ─── Execution Handlers ────────────────────────────────────────────────────

  const handleCodeChange = useCallback((newVal: string | undefined) => {
    const updatedCode = newVal ?? '';
    setCode(updatedCode);
    setExecutionState('READY');
    setOutput('');
    setError('');
    setErrorLine(null);
    setSteps([]);
    setCurrentStepIndex(0);
    // Reset analysis when code changes
    setAnalysisStatus('idle');
    setAnalysis(null);
    setAnalysisError(null);
  }, []);

  const handleResetCode = useCallback(() => {
    handleCodeChange(VALID_PALINDROME_META.starterCode);
    setStdin('');
  }, [handleCodeChange]);

  /** Trigger Gemini analysis for the given code (fire-and-forget alongside execution) */
  const triggerAnalysis = useCallback(async (codeToAnalyze: string) => {
    setAnalysisStatus('loading');
    setAnalysis(null);
    setAnalysisError(null);
    try {
      // Resolve model name for display (first call caches it internally)
      const models = await listAvailableModels();
      if (models.length > 0 && !resolvedModel) {
        // The service picks the best model; just show the first found name
        const preferredNames = [
          'models/gemini-2.0-flash',
          'models/gemini-2.0-flash-lite',
          'models/gemini-1.5-flash',
          'models/gemini-1.5-flash-8b',
          'models/gemini-1.5-pro',
        ];
        for (const p of preferredNames) {
          if (models.includes(p)) {
            setResolvedModel(p.replace('models/', ''));
            break;
          }
        }
        if (!resolvedModel && models[0]) {
          setResolvedModel(models[0].replace('models/', ''));
        }
      }

      const result = await analyzeCode(codeToAnalyze);
      setAnalysis(result);
      setAnalysisStatus('done');
    } catch (err: any) {
      setAnalysisError(err?.message ?? 'Unknown error from Gemini');
      setAnalysisStatus('error');
    }
  }, [resolvedModel]);

  const handleRunCode = async () => {
    if (executionState === 'RUNNING') return;

    setExecutionState('RUNNING');
    setOutput('');
    setError('');
    setErrorLine(null);
    setSteps([]);
    setCurrentStepIndex(0);

    // Start AI analysis in parallel (don't await — runs alongside execution)
    triggerAnalysis(code);

    try {
      const res = await fetch('/api/execution/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, stdin, timeoutSeconds: 5 }),
      });

      if (!res.ok) throw new Error(`Server returned status ${res.status}`);

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
      setError(
        `Backend Communication Error:\n${err?.message || 'Could not connect to backend service'}`
      );
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

  const activeLineNumber =
    executionState === 'SUCCESS' && steps.length > 0 && steps[currentStepIndex]
      ? (steps[currentStepIndex].lineNumber ?? steps[currentStepIndex].line ?? undefined)
      : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 flex flex-col px-4 md:px-6 pb-6 pt-5 gap-4 max-w-[1800px] w-full mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Code Visualizer
              {analysisStatus === 'loading' && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  <Brain className="w-3 h-3 animate-pulse" />
                  AI analyzing…
                </span>
              )}
              {analysisStatus === 'done' && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  Analysis ready
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Paste your Java code, run it, and step through the execution trace.
            </p>
          </div>

          {/* Toolbar */}
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
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

            {/* Visualize / Trace Status Button */}
            <button
              type="button"
              onClick={handleResetStep}
              disabled={executionState !== 'SUCCESS' || steps.length === 0}
              title={
                executionState === 'SUCCESS' && steps.length > 0
                  ? `Execution trace ready (${steps.length} steps)`
                  : 'Compile and run successfully first to unlock visualization'
              }
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border ${
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
                  <span>Visualize</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Resizable Split Pane ─────────────────────────────────────────── */}
        <div className="flex-1 min-h-0">
          <ResizableSplitPane
            initialSplit={52}
            minLeftPercentage={25}
            maxLeftPercentage={75}
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
              <div className="h-full flex flex-col gap-4 overflow-y-auto pr-1">
                {/* AI Analysis Panel — shown first so it's prominent */}
                <CodeAnalysisPanel
                  status={analysisStatus}
                  analysis={analysis}
                  error={analysisError}
                  modelName={resolvedModel}
                />

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
        </div>
      </main>
    </div>
  );
};
