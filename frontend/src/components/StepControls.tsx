import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';

interface StepControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onSelectStep: (index: number) => void;
}

export const StepControls: React.FC<StepControlsProps> = ({
  currentStepIndex,
  totalSteps,
  onPrev,
  onNext,
  onReset,
  onSelectStep
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto playback interval
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        if (currentStepIndex < totalSteps - 1) {
          onNext();
        } else {
          setIsPlaying(false);
        }
      }, 1500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentStepIndex, totalSteps, onNext]);

  const togglePlay = () => {
    if (currentStepIndex >= totalSteps - 1) {
      onReset();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    onReset();
  };

  const handlePrev = () => {
    setIsPlaying(false);
    onPrev();
  };

  const handleNext = () => {
    if (currentStepIndex >= totalSteps - 1) {
      setIsPlaying(false);
    }
    onNext();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Step Buttons */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-center">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-all border border-slate-700/80 active:scale-95"
          title="Previous Step"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={togglePlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-slate-950 transition-all shadow-lg active:scale-95 ${
            isPlaying
              ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/20'
              : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-cyan-500/25'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 fill-slate-950" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={currentStepIndex >= totalSteps - 1}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-all border border-slate-700/80 active:scale-95"
          title="Next Step"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all border border-slate-800 active:scale-95 ml-1"
          title="Reset Execution"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Progress Slider */}
      <div className="flex items-center gap-3 w-full md:w-64">
        <span className="text-[11px] font-mono text-slate-400 min-w-max">
          Step {currentStepIndex + 1} / {totalSteps}
        </span>
        <input
          type="range"
          min={0}
          max={totalSteps - 1}
          value={currentStepIndex}
          onChange={(e) => {
            setIsPlaying(false);
            onSelectStep(parseInt(e.target.value, 10));
          }}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
        />
      </div>
    </div>
  );
};
