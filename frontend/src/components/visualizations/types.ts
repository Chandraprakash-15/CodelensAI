/**
 * Visualization framework types — Phase 3C.
 *
 * Intentionally minimal. Adding a new visualizer means:
 *   1. Add a union member here.
 *   2. Register it in VisualizationRenderer.tsx.
 *
 * Do NOT add abstract factories, plugin registries, or DI containers.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Visualization identifier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The set of specialized algorithm visualizations the renderer knows about.
 * GENERIC means "no specialised visualizer — fall through to the variable table."
 */
export type VisualizationType =
  | 'TWO_POINTER'
  | 'LINKED_LIST'
  | 'GENERIC';
