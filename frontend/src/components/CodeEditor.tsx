import React, { useRef, useEffect, useState, useCallback } from 'react';
import loader from '@monaco-editor/loader';
import { FileCode, Loader2, AlertCircle } from 'lucide-react';

interface CodeEditorProps {
  code: string;
  onChange: (value: string | undefined) => void;
  activeLineNumber?: number;
  errorLineNumber?: number | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  activeLineNumber,
  errorLineNumber
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const applyDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const monaco = monacoRef.current;
    const editor = editorRef.current;

    try {
      const newDecorations: any[] = [];

      // Priority 1: Highlight error line if present
      if (errorLineNumber && errorLineNumber > 0) {
        newDecorations.push({
          range: new monaco.Range(errorLineNumber, 1, errorLineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'monaco-error-line-highlight',
            glyphMarginClassName: 'monaco-error-line-highlight-glyph'
          }
        });
      } else if (activeLineNumber && activeLineNumber > 0) {
        // Priority 2: Execution line highlight
        newDecorations.push({
          range: new monaco.Range(activeLineNumber, 1, activeLineNumber, 1),
          options: {
            isWholeLine: true,
            className: 'monaco-execution-line-highlight',
            glyphMarginClassName: 'monaco-execution-line-highlight-glyph'
          }
        });
      }

      decorationsRef.current = editor.deltaDecorations(
        decorationsRef.current,
        newDecorations
      );

      const targetLine = errorLineNumber || activeLineNumber;
      if (targetLine && targetLine > 0) {
        if (typeof editor.revealLineInCenterIfOutsideViewport === 'function') {
          editor.revealLineInCenterIfOutsideViewport(targetLine);
        } else if (typeof editor.revealLineInCenter === 'function') {
          editor.revealLineInCenter(targetLine);
        }
      }
    } catch (err) {
      console.warn('Could not apply editor line decorations:', err);
    }
  }, [activeLineNumber, errorLineNumber]);

  // Initialize Monaco Editor once container is available
  useEffect(() => {
    let isCancelled = false;
    let editorInstance: any = null;

    loader.init().then((monaco) => {
      if (isCancelled || !containerRef.current) return;

      monacoRef.current = monaco;

      editorInstance = monaco.editor.create(containerRef.current, {
        value: code,
        language: 'java',
        theme: 'vs-dark',
        fontSize: 13,
        fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        scrollbar: {
          alwaysConsumeMouseWheel: false,
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
        lineNumbers: 'on',
        glyphMargin: true,
        folding: true,
        lineDecorationsWidth: 10,
        automaticLayout: true,
        tabSize: 4,
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: 'all',
      });

      editorRef.current = editorInstance;
      setIsLoading(false);

      editorInstance.onDidChangeModelContent(() => {
        const val = editorInstance.getValue();
        onChange(val);
      });

      applyDecorations();
    }).catch((err) => {
      console.error('Monaco initialization error:', err);
      setIsLoading(false);
    });

    return () => {
      isCancelled = true;
      if (editorInstance) {
        editorInstance.dispose();
      }
    };
  }, []);

  // Update decorations when activeLineNumber or errorLineNumber changes
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      applyDecorations();
    }
  }, [activeLineNumber, errorLineNumber, applyDecorations]);

  // Handle container resize when divider is dragged
  useEffect(() => {
    if (!containerRef.current) return;
    let animationFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.layout();
        }
      });
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  // Sync external code changes if necessary
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== code) {
      editorRef.current.setValue(code);
    }
  }, [code]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-300">Main.java</span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
            Java
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {errorLineNumber && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/50 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-rose-400" />
              Line {errorLineNumber} error
            </span>
          )}
          {!errorLineNumber && activeLineNumber && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
              Line {activeLineNumber} executing
            </span>
          )}
          <span className="text-[11px] text-slate-500">Monaco Editor</span>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="relative flex-1 min-h-[420px] bg-[#1e1e1e]">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 z-10">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Initializing editor...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full min-h-[420px]" />
      </div>
    </div>
  );
};
