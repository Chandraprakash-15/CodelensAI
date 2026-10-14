/**
 * VisualizationRenderer — Phase 3C routing layer.
 *
 * Responsibility (only):
 *   1. Inspect the current ExecutionStepItem's runtime variables.
 *   2. Deterministically select a VisualizationType.
 *   3. Render the appropriate specialised visualizer, OR nothing (GENERIC).
 *
 * This component does NOT:
 *   - execute code
 *   - create fake execution steps
 *   - maintain its own execution state
 *   - duplicate the variable table
 *   - modify backend data
 *
 * The existing generic variable table in VisualizationPanel is the fallback
 * for any case where GENERIC is selected — it always remains visible beneath
 * this renderer.
 */

import React from 'react';
import type { ExecutionState, ExecutionStepItem } from '../../types';
import type { VisualizationType } from './types';
import { TwoPointerVisualizer } from './TwoPointerVisualizer';
import { LinkedListVisualizer } from './LinkedListVisualizer';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface VisualizationRendererProps {
  /** The current trace step — driven by currentStepIndex in the parent. */
  step: ExecutionStepItem | null;
  executionState: ExecutionState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministically detect which visualizer applies to the given step.
 *
 * Source of truth: actual runtime variable values in step.variables.
 * Detection is NEVER based on page URL, problem title, or hard-coded input.
 *
 * TWO_POINTER requires all three variables to be present with correct types:
 *   - step.variables.s   → string   (the string being processed)
 *   - step.variables.left  → number (left pointer index)
 *   - step.variables.right → number (right pointer index)
 *
 * If any of these are missing or wrong type, returns GENERIC.
 */
function detectVisualizationType(step: ExecutionStepItem | null): VisualizationType {
  // LINKED_LIST: the backend tracer attaches a structural snapshot only when
  // in-scope variables hold list nodes (int val + same-class next).
  if (step?.linkedList && (step.linkedList.nodes.length > 0 || Object.keys(step.linkedList.pointers).length > 0)) {
    return 'LINKED_LIST';
  }

  if (!step?.variables) return 'GENERIC';

  const { s, left, right } = step.variables;

  if (
    typeof s     === 'string' &&
    typeof left  === 'number' &&
    typeof right === 'number'
  ) {
    return 'TWO_POINTER';
  }

  return 'GENERIC';
}

// ─────────────────────────────────────────────────────────────────────────────
// Renderer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes the current step to the appropriate specialised visualizer.
 *
 * For GENERIC, renders nothing — the generic variable table in
 * VisualizationPanel remains the visible output for unsupported code.
 *
 * To add a new visualizer in a future phase:
 *   1. Add a new union member to VisualizationType in types.ts.
 *   2. Add detection logic in detectVisualizationType above.
 *   3. Add a `case` in the switch below.
 *   ← No changes to VisualizationPanel required.
 */
export const VisualizationRenderer: React.FC<VisualizationRendererProps> = ({
  step,
  executionState,
}) => {
  const vizType = detectVisualizationType(step);

  switch (vizType) {
    case 'TWO_POINTER':
      return (
        <TwoPointerVisualizer
          step={step}
          executionState={executionState}
        />
      );

    case 'LINKED_LIST':
      return (
        <LinkedListVisualizer
          step={step}
          executionState={executionState}
        />
      );

    case 'GENERIC':
    default:
      // No specialised visualizer — the generic variable table handles display.
      return null;
  }
};
