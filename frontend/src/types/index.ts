// ──────────────────────────────────────────────────────────
// Problem page metadata (learning experience)
// ──────────────────────────────────────────────────────────

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemApproachStep {
  label: string;
  detail: string;
}

export interface ProblemMeta {
  id: string;
  title: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints?: string[];
  examples: ProblemExample[];
  approach: {
    title: string;
    summary: string;
    steps: ProblemApproachStep[];
    why: string;
  };
  complexity: {
    time: string;
    timeExplanation: string;
    space: string;
    spaceExplanation: string;
  };
  starterCode: string;
}

// ──────────────────────────────────────────────────────────
// Existing types (unchanged)
// ──────────────────────────────────────────────────────────

export interface VariableState {
  left: number;
  right: number;
  leftChar?: string;
  rightChar?: string;
  isEqual?: boolean;
  result?: boolean;
  [key: string]: any;
}

export type StepStatus = 
  | 'init'
  | 'check_outer'
  | 'skip_left'
  | 'skip_right'
  | 'compare_chars'
  | 'match'
  | 'advance'
  | 'done'
  | 'mismatch';

export interface TraceStep {
  step: number;
  lineNumber: number; // 1-indexed Java code line number
  left: number;
  right: number;
  action: string;
  explanation: string;
  status: StepStatus;
  variables: VariableState;
}

export interface ProblemData {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  initialCode: string;
  inputString: string;
}

export type ExecutionState = 'READY' | 'RUNNING' | 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT';

// ──────────────────────────────────────────────────────────
// Linked-list structural snapshot (Phase 3D-A)
// ──────────────────────────────────────────────────────────

/**
 * A single node in the linked-list snapshot.
 *
 * - id:   stable 'node-N' string (reset each execution)
 * - val:  the Java int field value
 * - next: id of the next node, or null for list termination
 */
export interface LinkedListNode {
  id: string;
  val: number;
  next: string | null;
}

/**
 * Map from variable name to node id (or null for null pointer).
 *
 * Example: { "head": "node-1", "curr": "node-2", "prev": null }
 */
export type LinkedListPointers = Record<string, string | null>;

/**
 * The full linked-list snapshot attached to an ExecutionStepItem
 * whenever one or more in-scope variables hold a linked-list node.
 *
 * nodes:    all reachable nodes from any pointer variable (union of chains)
 * pointers: maps each pointer variable name to its current node id (or null)
 */
export interface LinkedListSnapshot {
  nodes: LinkedListNode[];
  pointers: LinkedListPointers;
  /** true when the tracer hit its node cap and stopped walking */
  truncated?: boolean;
  /** true when a cycle was detected while walking the list */
  hasCycle?: boolean;
}

// ──────────────────────────────────────────────────────────
// Core execution types
// ──────────────────────────────────────────────────────────

export interface ExecutionStepItem {
  stepNumber: number;
  lineNumber: number;
  eventType?: string;
  line?: number;
  variables?: Record<string, any>;
  /**
   * Present only when the step has at least one linked-list node variable
   * (detected via backend reflection: int val + same-class next).
   * null / undefined otherwise.
   */
  linkedList?: LinkedListSnapshot | null;
}

export interface ExecutionResponse {
  status: 'SUCCESS' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIMEOUT';
  output: string;
  error?: string;
  errorLine?: number | null;
  steps?: ExecutionStepItem[];
}
