import React, { useRef, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  Info,
} from 'lucide-react';
import type { ExecutionState, ExecutionStepItem } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface TwoPointerVisualizerProps {
  /** The current trace step (null before first run or after reset) */
  step: ExecutionStepItem | null;
  executionState: ExecutionState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual State
// ─────────────────────────────────────────────────────────────────────────────

type VisualState =
  | 'INITIAL'    // pointers not yet in scope
  | 'CHECKING'   // evaluating outer while (left < right)
  | 'SKIPPING'   // skipping non-alphanumeric characters
  | 'COMPARING'  // if (charAt(left) != charAt(right))
  | 'MISMATCH'   // return false branch
  | 'ADVANCING'  // left++ / right--
  | 'COMPLETED'; // pointers met OR return true

/**
 * Derive visual state from the current execution step.
 *
 * Line-number mapping is for the STANDARD Valid Palindrome starter code.
 * If left/right are absent (user changed variable names) the caller won't
 * render this component at all — so we can assume they are defined here.
 *
 * The left >= right check is primary: it fires when the outer while exits
 * naturally and the return true statement executes (line 19) — or any step
 * where the pointers have already met.
 */
function deriveVisualState(
  lineNumber: number | null | undefined,
  left: number,
  right: number
): VisualState {
  // Pointers have crossed or met → algorithm complete
  if (left >= right) return 'COMPLETED';

  switch (lineNumber) {
    case 13: return 'COMPARING';
    case 14: return 'MISMATCH';
    case 16:
    case 17: return 'ADVANCING';
    case 7:
    case 8:
    case 10:
    case 11: return 'SKIPPING';
    case 6:  return 'CHECKING';
    case 19: return 'COMPLETED';
    default: return 'CHECKING';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// State-driven badge config
// ─────────────────────────────────────────────────────────────────────────────

const STATE_BADGE: Record<VisualState, { label: string; className: string }> = {
  INITIAL:   { label: 'Initialising',   className: 'bg-slate-800 text-slate-300 border-slate-700' },
  CHECKING:  { label: 'Loop Check',     className: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60' },
  SKIPPING:  { label: 'Skip Non-Alpha', className: 'bg-amber-950/70 text-amber-300 border-amber-800/60' },
  COMPARING: { label: 'Comparing',      className: 'bg-blue-950/70 text-blue-300 border-blue-800/60' },
  MISMATCH:  { label: 'Mismatch ✗',     className: 'bg-rose-950/70 text-rose-300 border-rose-800/60' },
  ADVANCING: { label: 'Advancing',      className: 'bg-violet-950/70 text-violet-300 border-violet-800/60' },
  COMPLETED: { label: 'Completed ✓',    className: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Explanation text (deterministic, never fabricated)
// ─────────────────────────────────────────────────────────────────────────────

function getExplanation(
  state: VisualState,
  s: string,
  left: number | undefined,
  right: number | undefined
): string {
  if (left === undefined || right === undefined) {
    return 'Setting up the two-pointer algorithm. Left pointer will start at index 0, right pointer at the last index.';
  }

  const safeLeft  = Math.max(0, Math.min(left,  s.length - 1));
  const safeRight = Math.max(0, Math.min(right, s.length - 1));
  const lc = s[safeLeft]  ?? '?';
  const rc = s[safeRight] ?? '?';

  switch (state) {
    case 'INITIAL':
      return `Pointers initialised: left = ${left} (start), right = ${right} (end).`;
    case 'CHECKING':
      return `Outer while condition: left (${left}) < right (${right}) → ${left < right ? 'true, entering loop.' : 'false, loop exits.'}`;
    case 'SKIPPING':
      return `A non-alphanumeric character was found. The pointer skips past it before the comparison.`;
    case 'COMPARING':
      return `Comparing s[${left}] = '${lc}' with s[${right}] = '${rc}'.`;
    case 'MISMATCH':
      return `'${lc}' ≠ '${rc}' — characters differ. The string is NOT a palindrome. Returning false.`;
    case 'ADVANCING':
      return `'${lc}' == '${rc}' — characters match. Moving inward: left ${left} → ${left + 1}, right ${right} → ${right - 1}.`;
    case 'COMPLETED':
      return `Pointers have met (left = ${left}, right = ${right}). All character pairs matched — the string IS a palindrome. Returning true.`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell colour derivation
// ─────────────────────────────────────────────────────────────────────────────

function cellClass(
  i: number,
  left: number,
  right: number,
  state: VisualState
): string {
  const isLeft  = i === left;
  const isRight = i === right;
  const isBothPointers = isLeft && isRight;

  if (isBothPointers) {
    return 'bg-gradient-to-br from-cyan-500/30 to-violet-500/30 border-cyan-400 text-white scale-110 shadow-lg shadow-cyan-500/20 z-10';
  }

  if (state === 'MISMATCH' && (isLeft || isRight)) {
    return 'bg-rose-900/60 border-rose-400 text-rose-100 scale-105 shadow-md shadow-rose-500/25 z-10 animate-pulse';
  }
  if (state === 'COMPARING' && (isLeft || isRight)) {
    return 'bg-blue-900/60 border-blue-400 text-blue-100 scale-105 shadow-md shadow-blue-500/25 z-10 ring-1 ring-blue-400/50';
  }
  if (state === 'COMPLETED' && i >= left && i <= right) {
    return 'bg-emerald-900/30 border-emerald-600/50 text-emerald-200';
  }
  if (isLeft) {
    return 'bg-cyan-900/40 border-cyan-500/70 text-cyan-100 shadow-sm shadow-cyan-500/20';
  }
  if (isRight) {
    return 'bg-violet-900/40 border-violet-500/70 text-violet-100 shadow-sm shadow-violet-500/20';
  }

  // Characters already "consumed" (outside the active window)
  const consumed = i < left || i > right;
  if (consumed) {
    return 'bg-slate-900/30 border-slate-800/30 text-slate-600';
  }

  // Characters in the active window but not at pointers
  return 'bg-slate-800/60 border-slate-700/60 text-slate-300';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const TwoPointerVisualizer: React.FC<TwoPointerVisualizerProps> = ({
  step,
}) => {
  const scrollRef      = useRef<HTMLDivElement>(null);
  const leftCellRef    = useRef<HTMLDivElement>(null);

  // ── Extract runtime values ──────────────────────────────────────────────
  const vars  = step?.variables ?? {};
  const rawS  = vars['s'];
  const rawL  = vars['left'];
  const rawR  = vars['right'];

  const hasPointers =
    typeof rawL === 'number' &&
    typeof rawR === 'number' &&
    typeof rawS === 'string';

  // Derive pointer values safely (used by useEffect dep array before the guard)
  const left  = hasPointers ? (rawL as number) : 0;
  const right = hasPointers ? (rawR as number) : 0;

  // ── Auto-scroll left pointer cell into view ─────────────────────────────
  // IMPORTANT: this hook MUST be called unconditionally (before any return).
  // The hasPointers check lives INSIDE the callback, never around the hook.
  useEffect(() => {
    if (!hasPointers) return;
    if (leftCellRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const cell      = leftCellRef.current;
      const cellLeft  = cell.offsetLeft - container.offsetLeft;
      const cellRight = cellLeft + cell.offsetWidth;
      const viewLeft  = container.scrollLeft;
      const viewRight = viewLeft + container.offsetWidth;
      if (cellLeft < viewLeft + 20) {
        container.scrollTo({ left: Math.max(0, cellLeft - 40), behavior: 'smooth' });
      } else if (cellRight > viewRight - 20) {
        container.scrollTo({ left: cellRight - container.offsetWidth + 40, behavior: 'smooth' });
      }
    }
  }, [left, hasPointers]);

  // ── Graceful fallback ───────────────────────────────────────────────────
  // This return comes AFTER all hooks — Rules of Hooks satisfied.
  // If the variables 'left', 'right', 's' are not present (user changed code
  // or custom algorithm), render nothing — the generic variable table below
  // this component continues to show the real trace data.
  if (!hasPointers) return null;

  const s = rawS as string;

  const lineNumber  = step?.lineNumber ?? step?.line ?? null;
  const visualState = deriveVisualState(lineNumber, left, right);
  const badge       = STATE_BADGE[visualState];
  const explanation = getExplanation(visualState, s, left, right);

  const isComparing = visualState === 'COMPARING' || visualState === 'MISMATCH';
  const leftChar  = s[Math.max(0, Math.min(left,  s.length - 1))] ?? '?';
  const rightChar = s[Math.max(0, Math.min(right, s.length - 1))] ?? '?';
  const charsMatch = leftChar.toLowerCase() === rightChar.toLowerCase();

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Two Pointer Trace
          </span>
        </div>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      {/* ── String label ── */}
      <div className="flex items-center gap-2 text-[11px] font-mono">
        <span className="text-slate-500">s =</span>
        <span className="text-emerald-300 truncate max-w-[200px]" title={s}>
          &quot;{s.length > 24 ? s.slice(0, 22) + '…' : s}&quot;
        </span>
        <span className="text-slate-600 ml-auto">
          length: {s.length}
        </span>
      </div>

      {/* ── String cell array ── */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-1 select-none"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex gap-1 min-w-max">
          {Array.from(s).map((ch, i) => {
            const isLeft    = i === left;
            const isRight   = i === right;
            const isBoth    = isLeft && isRight;
            const cClass    = cellClass(i, left, right, visualState);

            return (
              <div
                key={i}
                ref={isLeft ? leftCellRef : undefined}
                className="flex flex-col items-center gap-0"
              >
                {/* Character cell */}
                <div
                  className={`w-8 h-8 rounded-md border flex items-center justify-center font-mono font-bold text-sm transition-all duration-200 flex-shrink-0 ${cClass}`}
                >
                  {ch === ' ' ? '·' : ch}
                </div>

                {/* Index label */}
                <span className="text-[8px] font-mono text-slate-700 leading-tight mt-0.5">
                  {i}
                </span>

                {/* Pointer labels */}
                <div className="h-4 flex flex-col items-center justify-start">
                  {isBoth ? (
                    <span className="text-[8px] font-mono font-bold leading-none text-center">
                      <span className="text-cyan-400">L</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-violet-400">R</span>
                    </span>
                  ) : isLeft ? (
                    <span className="text-[8px] font-mono font-bold text-cyan-400 leading-none">
                      ↑L
                    </span>
                  ) : isRight ? (
                    <span className="text-[8px] font-mono font-bold text-violet-400 leading-none">
                      ↑R
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pointer position row ── */}
      <div className="flex items-center gap-3 text-[11px] font-mono">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block flex-shrink-0" />
          <span className="text-slate-400">left =</span>
          <span className="text-cyan-300 font-bold">{left}</span>
        </span>
        <span className="text-slate-700">·</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-violet-400 inline-block flex-shrink-0" />
          <span className="text-slate-400">right =</span>
          <span className="text-violet-300 font-bold">{right}</span>
        </span>
      </div>

      {/* ── Comparison panel (only when comparing/mismatch) ── */}
      {isComparing && (
        <div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-xs font-mono transition-all ${
            visualState === 'MISMATCH'
              ? 'bg-rose-950/30 border-rose-800/50'
              : 'bg-blue-950/30 border-blue-800/50'
          }`}
        >
          {/* Left char */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">s[{left}]</span>
            <div
              className={`w-8 h-8 rounded-md border flex items-center justify-center font-bold text-sm ${
                visualState === 'MISMATCH'
                  ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                  : 'bg-blue-900/60 border-blue-500 text-blue-200'
              }`}
            >
              {leftChar === ' ' ? '·' : leftChar}
            </div>
          </div>

          {/* Comparator */}
          <div className="flex flex-col items-center gap-1 flex-1">
            <span
              className={`text-lg font-bold ${
                visualState === 'MISMATCH' ? 'text-rose-400' : 'text-blue-300'
              }`}
            >
              {visualState === 'COMPARING' ? '?' : visualState === 'MISMATCH' ? '≠' : '='}
            </span>
            {visualState === 'MISMATCH' ? (
              <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-wider">
                Mismatch
              </span>
            ) : (
              <span className="text-[9px] text-blue-400 uppercase tracking-wider">
                Comparing
              </span>
            )}
          </div>

          {/* Right char */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider">s[{right}]</span>
            <div
              className={`w-8 h-8 rounded-md border flex items-center justify-center font-bold text-sm ${
                visualState === 'MISMATCH'
                  ? 'bg-rose-900/60 border-rose-500 text-rose-200'
                  : 'bg-blue-900/60 border-blue-500 text-blue-200'
              }`}
            >
              {rightChar === ' ' ? '·' : rightChar}
            </div>
          </div>

          {/* Result icon */}
          <div className="ml-auto pl-2 border-l border-slate-800/60">
            {visualState === 'MISMATCH' ? (
              <XCircle className="w-5 h-5 text-rose-400" />
            ) : charsMatch ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <span className="text-blue-400 text-base">?</span>
            )}
          </div>
        </div>
      )}

      {/* ── Completed / Mismatch result banner ── */}
      {visualState === 'COMPLETED' && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-800/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-emerald-300">
            Palindrome confirmed — all character pairs matched.
          </span>
        </div>
      )}
      {visualState === 'MISMATCH' && (
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-800/50">
          <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span className="text-xs font-semibold text-rose-300">
            Not a palindrome — mismatch found. Returning false.
          </span>
        </div>
      )}

      {/* ── Explanation panel ── */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
        <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">{explanation}</p>
      </div>
    </div>
  );
};
