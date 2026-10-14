import React from 'react';
import { Link2, AlertTriangle, Info } from 'lucide-react';
import type { ExecutionState, ExecutionStepItem, LinkedListNode } from '../../types';

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface LinkedListVisualizerProps {
  /** The current trace step. Reads ONLY step.linkedList (real runtime data). */
  step: ExecutionStepItem | null;
  executionState: ExecutionState;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Split the snapshot's nodes into display chains.
 *
 * - A chain starts at a node nobody points to (a "root").
 * - Chains follow `next` until null, a node already placed, or an unknown id.
 * - Pure cycles (no root) start from the first unplaced node.
 *
 * Returns each chain plus the id (if any) its tail links back to, so the UI can
 * draw a "loops back" marker for cycles / merges into another chain.
 */
interface Chain {
  nodes: LinkedListNode[];
  /** id the last node points to when that node is already placed elsewhere */
  tailLinksTo: string | null;
  /** id the last node points to when that id is NOT in the snapshot (truncated) */
  tailMissing: string | null;
}

function buildChains(nodes: LinkedListNode[]): Chain[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const referenced = new Set<string>();
  nodes.forEach((n) => n.next && referenced.add(n.next));

  const placed = new Set<string>();
  const chains: Chain[] = [];

  const walk = (start: LinkedListNode) => {
    const chain: LinkedListNode[] = [];
    let cur: LinkedListNode | undefined = start;
    let tailLinksTo: string | null = null;
    let tailMissing: string | null = null;
    while (cur && !placed.has(cur.id)) {
      placed.add(cur.id);
      chain.push(cur);
      if (!cur.next) break;
      const nxt = byId.get(cur.next);
      if (!nxt) {
        // next points at a node the tracer did not capture (list truncated)
        tailMissing = cur.next;
        break;
      }
      if (placed.has(nxt.id)) {
        tailLinksTo = nxt.id;
        break;
      }
      cur = nxt;
    }
    if (chain.length > 0) chains.push({ nodes: chain, tailLinksTo, tailMissing });
  };

  nodes.filter((n) => !referenced.has(n.id)).forEach(walk);
  nodes.filter((n) => !placed.has(n.id)).forEach(walk); // cycles
  return chains;
}

// Colour per pointer name (stable across steps); unknown names fall back to slate.
const POINTER_STYLE: Record<string, string> = {
  head: 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60',
  curr: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
  current: 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60',
  prev: 'bg-amber-950/70 text-amber-300 border-amber-700/60',
  next: 'bg-violet-950/70 text-violet-300 border-violet-700/60',
  slow: 'bg-blue-950/70 text-blue-300 border-blue-700/60',
  fast: 'bg-rose-950/70 text-rose-300 border-rose-700/60',
  tail: 'bg-fuchsia-950/70 text-fuchsia-300 border-fuchsia-700/60',
  dummy: 'bg-slate-800 text-slate-300 border-slate-600',
};
const DEFAULT_POINTER_STYLE = 'bg-slate-800 text-slate-300 border-slate-600';

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const LinkedListVisualizer: React.FC<LinkedListVisualizerProps> = ({ step }) => {
  const snapshot = step?.linkedList;
  if (!snapshot || (snapshot.nodes.length === 0 && Object.keys(snapshot.pointers).length === 0)) {
    return null;
  }

  const { nodes, pointers } = snapshot;
  const chains = buildChains(nodes);

  // id -> pointer names pointing at it; and names that are null
  const pointersByNode = new Map<string, string[]>();
  const nullPointers: string[] = [];
  Object.entries(pointers).forEach(([name, id]) => {
    if (id === null || id === undefined) {
      nullPointers.push(name);
    } else {
      pointersByNode.set(id, [...(pointersByNode.get(id) ?? []), name]);
    }
  });

  // pointers that reference a node id which is not in snapshot.nodes (truncation)
  const capturedIds = new Set(nodes.map((n) => n.id));
  const offListPointers = Object.entries(pointers).filter(
    (entry): entry is [string, string] => entry[1] != null && !capturedIds.has(entry[1])
  );

  const pill = (name: string) => (
    <span
      key={name}
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
        POINTER_STYLE[name] ?? DEFAULT_POINTER_STYLE
      }`}
    >
      {name}
    </span>
  );

  return (
    <div className="flex flex-col gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            Linked List
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          {nodes.length} node{nodes.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Warnings from the tracer */}
      {snapshot.hasCycle && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-rose-950/40 border border-rose-800/50 text-[11px] text-rose-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Cycle detected in the list.
        </div>
      )}
      {snapshot.truncated && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300">
          <Info className="w-3.5 h-3.5 shrink-0" />
          List is long — showing only the first nodes.
        </div>
      )}

      {/* Chains */}
      <div className="flex flex-col gap-4 overflow-x-auto pb-1 select-none">
        {chains.map((chain, ci) => (
          <div key={`chain-${ci}`} className="flex items-end gap-0 min-w-max">
            {chain.nodes.map((node, i) => {
              const names = pointersByNode.get(node.id) ?? [];
              const isLast = i === chain.nodes.length - 1;
              return (
                <React.Fragment key={node.id}>
                  <div className="flex flex-col items-center gap-1">
                    {/* pointer labels above the node */}
                    <div className="flex flex-wrap justify-center gap-1 min-h-[20px] max-w-[110px]">
                      {names.map(pill)}
                    </div>
                    {/* node box */}
                    <div
                      className={`flex items-stretch rounded-lg border overflow-hidden shadow-md transition-all ${
                        names.length > 0
                          ? 'border-cyan-400 shadow-cyan-500/20'
                          : 'border-slate-700'
                      }`}
                      title={node.id}
                    >
                      <div className="px-3 py-2 min-w-[44px] text-center font-mono font-bold text-sm text-white bg-slate-900">
                        {node.val}
                      </div>
                      <div className="px-2 py-2 flex items-center bg-slate-800/80 border-l border-slate-700 text-[10px] font-mono text-slate-400">
                        {node.next ? '•' : '∅'}
                      </div>
                    </div>
                  </div>

                  {/* arrow / terminator */}
                  {!isLast ? (
                    <div className="px-1 pb-2 text-cyan-400 font-mono text-lg leading-none">→</div>
                  ) : chain.tailLinksTo ? (
                    <div className="px-2 pb-2 text-[10px] font-mono text-amber-400 whitespace-nowrap">
                      ↩ {chain.tailLinksTo}
                    </div>
                  ) : chain.tailMissing ? (
                    <div
                      className="px-2 pb-2 text-[10px] font-mono text-amber-400 whitespace-nowrap"
                      title={`next = ${chain.tailMissing} (not captured — list truncated)`}
                    >
                      → …
                    </div>
                  ) : (
                    <div className="px-2 pb-2 text-[10px] font-mono text-slate-500">→ null</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>

      {/* Null pointers */}
      {nullPointers.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-slate-500">
          <span>null:</span>
          <div className="flex flex-wrap gap-1">{nullPointers.map(pill)}</div>
        </div>
      )}

      {/* Pointers whose target node was not captured (truncated list) */}
      {offListPointers.length > 0 && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono text-amber-400/90">
          <span>beyond captured nodes:</span>
          <div className="flex flex-wrap gap-1">
            {offListPointers.map(([name, id]) => (
              <span key={name} title={id}>
                {pill(name)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
