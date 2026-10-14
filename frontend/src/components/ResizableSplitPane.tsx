import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableSplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  initialSplit?: number; // percentage for left pane (default 50)
  minLeftPercentage?: number; // minimum left percentage (default 28)
  maxLeftPercentage?: number; // maximum left percentage (default 72)
  onResize?: (leftWidthPct: number) => void;
}

export const ResizableSplitPane: React.FC<ResizableSplitPaneProps> = ({
  left,
  right,
  initialSplit = 50,
  minLeftPercentage = 28,
  maxLeftPercentage = 72,
  onResize
}) => {
  const [splitPct, setSplitPct] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleWindowResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawPct = ((e.clientX - rect.left) / rect.width) * 100;
      const clampedPct = Math.min(Math.max(rawPct, minLeftPercentage), maxLeftPercentage);
      setSplitPct(clampedPct);
      onResize?.(clampedPct);

      // Notify Monaco Editor and child components of dimension change
      window.dispatchEvent(new Event('resize'));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, minLeftPercentage, maxLeftPercentage, onResize]);

  return (
    <div
      ref={containerRef}
      className="relative w-full flex flex-col lg:flex-row items-stretch gap-0 overflow-hidden"
    >
      {/* Left Pane (Code Editor) */}
      <div
        className="w-full flex flex-col min-w-0 flex-shrink-0"
        style={{
          width: isDesktop ? `${splitPct}%` : '100%',
        }}
      >
        {left}
      </div>

      {/* Draggable Divider (Desktop) */}
      <div
        onPointerDown={handlePointerDown}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(splitPct)}
        title="Drag horizontally to resize editor and visualization"
        className={`hidden lg:flex items-center justify-center w-3 -mx-1.5 cursor-col-resize select-none z-30 group relative transition-colors ${
          isDragging ? 'bg-cyan-500/20' : 'hover:bg-cyan-500/10'
        }`}
      >
        <div
          className={`w-1 h-14 rounded-full transition-all flex items-center justify-center ${
            isDragging
              ? 'bg-cyan-400 shadow-md shadow-cyan-400/50 scale-y-125'
              : 'bg-slate-700 group-hover:bg-cyan-400/80 group-hover:h-20'
          }`}
        >
          <GripVertical className="w-2.5 h-2.5 text-slate-950 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Right Pane (Visualization & Output) */}
      <div
        className="w-full flex flex-col min-w-0 flex-1 mt-6 lg:mt-0"
        style={{
          width: isDesktop ? `${100 - splitPct}%` : '100%',
        }}
      >
        {right}
      </div>
    </div>
  );
};
