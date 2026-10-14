import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Lock,
  Code2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  AlertOctagon,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  Layers
} from 'lucide-react';
import type { ExecutionState, ExecutionStepItem } from '../types';
import { VisualizationRenderer } from './visualizations/VisualizationRenderer';

interface VisualizationPanelProps {
  executionState: ExecutionState;
  steps: ExecutionStepItem[];
  currentStepIndex: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onResetStep: () => void;
  onSelectStep: (index: number) => void;
}

export const VisualizationPanel: React.FC<VisualizationPanelProps> = ({
  executionState,
  steps,
  currentStepIndex,
  onPrevStep,
  onNextStep,
  onResetStep,
  onSelectStep
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && executionState === 'SUCCESS' && steps.length > 0) {
      timer = setInterval(() => {
        if (currentStepIndex < steps.length - 1) {
          onNextStep();
        } else {
          setIsPlaying(false);
        }
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, executionState, steps.length, currentStepIndex, onNextStep]);

  const togglePlay = () => {
    if (currentStepIndex >= steps.length - 1) {
      onResetStep();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrev = () => {
    setIsPlaying(false);
    onPrevStep();
  };

  const handleNext = () => {
    if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    onNextStep();
  };

  const handleReset = () => {
    setIsPlaying(false);
    onResetStep();
  };

  const currentStep = steps[currentStepIndex];
  const currentLine = currentStep ? (currentStep.lineNumber ?? currentStep.line) : null;

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl min-h-[340px]">
      {/* Visualization Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Execution Trace
          </span>
        </div>

        <div>
          {executionState === 'READY' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
              Awaiting Run
            </span>
          )}
          {executionState === 'RUNNING' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Tracing Execution...
            </span>
          )}
          {executionState === 'COMPILATION_ERROR' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-950 text-rose-300 border border-rose-800/50">
              <Lock className="w-3 h-3 text-rose-400" />
              Visualization Locked
            </span>
          )}
          {executionState === 'RUNTIME_ERROR' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950 text-amber-300 border border-amber-800/50">
              <Lock className="w-3 h-3 text-amber-400" />
              Visualization Locked
            </span>
          )}
          {executionState === 'SUCCESS' && steps.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/60 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-cyan-400" />
              Step {currentStepIndex + 1} / {steps.length}
            </span>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        {/* State 1: READY */}
        {executionState === 'READY' && (
          <div className="my-auto max-w-sm mx-auto flex flex-col items-center gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 shadow-inner">
              <Code2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">
              No execution to visualize.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Run your Java program first.
            </p>
          </div>
        )}

        {/* State 2: RUNNING */}
        {executionState === 'RUNNING' && (
          <div className="my-auto max-w-sm mx-auto flex flex-col items-center gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 animate-pulse">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-cyan-200">
              Capturing Real Execution...
            </h3>
            <p className="text-xs text-slate-400">
              Executing program and collecting runtime trace.
            </p>
          </div>
        )}

        {/* State 3: COMPILATION ERROR */}
        {executionState === 'COMPILATION_ERROR' && (
          <div className="my-auto max-w-sm mx-auto flex flex-col items-center gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-center justify-center text-rose-400 shadow-inner">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-rose-200">
              No execution to visualize.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fix the compilation errors and run the program again.
            </p>
          </div>
        )}

        {/* State 4: RUNTIME ERROR or TIMEOUT */}
        {(executionState === 'RUNTIME_ERROR' || executionState === 'TIMEOUT') && (
          <div className="my-auto max-w-sm mx-auto flex flex-col items-center gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-amber-200">
              No execution to visualize.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fix the runtime error and run the program again.
            </p>
          </div>
        )}

        {/* State 5: SUCCESS with Real Trace Steps */}
        {executionState === 'SUCCESS' && steps.length > 0 && currentStep && (
          <div className="flex flex-col gap-5 my-auto">
            {/* Active Step Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Source Line Execution
                  </span>
                </div>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </div>

              {/* Current Line Highlighting Indicator */}
              <div className="flex items-center justify-between bg-cyan-950/40 border border-cyan-800/40 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-cyan-300 text-sm shadow-sm">
                    L{currentLine}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white">
                      Executing Source Line {currentLine}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Highlighted in Monaco Editor
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700">
                  REAL TRACE
                </span>
              </div>

              {/* Visualization Renderer
                   Detects visualization type from real runtime variables.
                   TWO_POINTER → TwoPointerVisualizer.
                   GENERIC     → nothing (generic variable table below handles it). */}
              <VisualizationRenderer
                step={currentStep}
                executionState={executionState}
              />

              {/* Runtime Variables Table */}
              <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Variables
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {currentStep.variables && Object.keys(currentStep.variables).length > 0
                      ? `${Object.keys(currentStep.variables).length} in scope`
                      : 'None in scope'}
                  </span>
                </div>

                {currentStep.variables && Object.keys(currentStep.variables).length > 0 ? (
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-lg overflow-hidden shadow-inner">
                    <div className="grid grid-cols-2 px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <span>Variable</span>
                      <span>Value</span>
                    </div>
                    <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
                      {Object.entries(currentStep.variables).map(([name, val]) => {
                        let displayVal: React.ReactNode;
                        let titleVal = String(val);
                        if (val === null || val === undefined) {
                          displayVal = <span className="text-slate-500 italic">null</span>;
                        } else if (typeof val === 'boolean') {
                          displayVal = <span className="text-amber-300 font-bold">{String(val)}</span>;
                        } else if (typeof val === 'number') {
                          displayVal = <span className="text-blue-300 font-bold">{String(val)}</span>;
                        } else if (typeof val === 'string') {
                          // Check if this looks like a Java object toString (contains class name pattern)
                          const isObjectToString = val.includes('[') && val.includes('=') && val.length > 60;
                          if (isObjectToString) {
                            // Extract simple class name for display
                            const className = val.split('[')[0].split('.').pop() ?? 'object';
                            displayVal = <span className="text-slate-400 italic">{`<${className}>`}</span>;
                          } else {
                            const truncated = val.length > 40 ? val.substring(0, 37) + '...' : val;
                            displayVal = <span className="text-emerald-300">"{truncated}"</span>;
                          }
                        } else {
                          displayVal = <span className="text-blue-300 font-bold">{String(val)}</span>;
                        }
                        return (
                          <div
                            key={name}
                            className="grid grid-cols-2 px-3 py-1.5 text-xs font-mono items-center hover:bg-slate-800/30 transition-colors"
                          >
                            <span className="text-cyan-300 font-semibold truncate pr-2">{name}</span>
                            <span className="text-slate-100 truncate" title={titleVal}>
                              {displayVal}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-xs text-slate-500 font-mono">
                    <span>No active local variables</span>
                    <span className="text-[10px] text-slate-600">—</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sequence ribbon of executed lines */}
            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Execution Sequence ({steps.length} steps):</span>
                <span>Click step to inspect</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 max-w-full">
                {steps.map((step, idx) => {
                  const line = step.lineNumber ?? step.line;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <button
                      key={`trace-step-${idx}`}
                      type="button"
                      onClick={() => onSelectStep(idx)}
                      title={`Step ${idx + 1}: Line ${line}`}
                      className={`flex-shrink-0 px-2.5 py-1 rounded text-xs font-mono transition-all border ${
                        isCurrent
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/30 scale-105'
                          : idx < currentStepIndex
                          ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:text-slate-300'
                      }`}
                    >
                      L{line}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Controls: Previous, Next, Play/Pause, Reset */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 border border-slate-700 transition-all active:scale-95"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95 ${
                    isPlaying
                      ? 'bg-amber-400 hover:bg-amber-300'
                      : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400'
                  }`}
                  title={isPlaying ? 'Pause auto playback' : 'Play trace automatically'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentStepIndex >= steps.length - 1}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 border border-slate-700 transition-all active:scale-95"
                  title="Next Step"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800 transition-all ml-1"
                  title="Reset to Step 1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Step Slider */}
              <div className="flex items-center gap-2 w-full sm:w-44">
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, steps.length - 1)}
                  value={currentStepIndex}
                  onChange={(e) => {
                    setIsPlaying(false);
                    onSelectStep(parseInt(e.target.value, 10));
                  }}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* State 5b: SUCCESS but 0 steps captured */}
        {executionState === 'SUCCESS' && steps.length === 0 && (
          <div className="my-auto max-w-sm mx-auto flex flex-col items-center gap-3 text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-emerald-200">
              Execution successful.
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Program completed without active line steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
