// ─── Gemini AI Code Analysis Service ──────────────────────────────────────────
// Analyzes Java code and returns: problem description, approach, time/space complexity

export interface CodeAnalysis {
  problemName: string;
  description: string;
  approach: string;         // e.g. "Two Pointers", "Sliding Window", "Dynamic Programming"
  approachExplanation: string;
  timeComplexity: string;   // e.g. "O(n)"
  timeExplanation: string;
  spaceComplexity: string;  // e.g. "O(1)"
  spaceExplanation: string;
  keyInsights: string[];
}

const SYSTEM_PROMPT = `You are an expert computer science educator and algorithm analyst.
Given a Java code snippet, analyze it and respond ONLY with a valid JSON object (no markdown, no backticks, no extra text).

The JSON must have exactly these fields:
{
  "problemName": "short name of the problem (e.g. 'Valid Palindrome', 'Two Sum', 'Maximum Subarray')",
  "description": "1-2 sentence description of what the code does",
  "approach": "the primary algorithmic technique (e.g. 'Two Pointers', 'Sliding Window', 'Binary Search', 'Dynamic Programming', 'Recursion', 'BFS/DFS', 'Hash Map', 'Stack', 'Greedy', 'Divide & Conquer')",
  "approachExplanation": "1-2 sentences explaining WHY this approach is used here",
  "timeComplexity": "Big-O notation like O(n), O(n log n), O(n²), O(1)",
  "timeExplanation": "1 sentence explaining the time complexity",
  "spaceComplexity": "Big-O notation like O(n), O(1)",
  "spaceExplanation": "1 sentence explaining the space complexity",
  "keyInsights": ["insight 1", "insight 2", "insight 3"]
}`;

const PREFERRED_MODELS = [
  // ── Confirmed working on this API key (ordered by speed) ──
  'gemini-3.5-flash-lite',    // ✅ ~1058ms — fastest
  'gemini-flash-lite-latest', // ✅ ~1086ms — fallback
  'gemini-3.1-flash-lite',    // ✅ ~2545ms — second fallback
  // ── Additional candidates ──
  'gemini-3.5-flash',
  'gemini-3.1-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

let _resolvedModel: string | null = null;

async function resolveModel(apiKey: string): Promise<string> {
  if (_resolvedModel) return _resolvedModel;

  // Check env override first
  const envModel = import.meta.env.VITE_GEMINI_MODEL;
  if (envModel) {
    _resolvedModel = envModel;
    return _resolvedModel;
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) throw new Error('Could not fetch model list');

    const data = await res.json();
    const available: string[] = (data.models ?? [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => (m.name as string).replace('models/', ''));

    console.log('[Gemini] Available models:', available);

    for (const preferred of PREFERRED_MODELS) {
      if (available.includes(preferred)) {
        _resolvedModel = preferred;
        console.log('[Gemini] Selected model:', _resolvedModel);
        return _resolvedModel;
      }
    }

    // Fallback to first available
    if (available.length > 0) {
      _resolvedModel = available[0];
      return _resolvedModel;
    }
  } catch (e) {
    console.warn('[Gemini] Could not resolve model list, using default:', e);
  }

  // Hard fallback
  _resolvedModel = 'gemini-2.0-flash';
  return _resolvedModel;
}

export async function analyzeCode(code: string): Promise<CodeAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set in your .env file');
  }

  const model = await resolveModel(apiKey);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze this Java code:\n\n\`\`\`java\n${code}\n\`\`\``,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error (${res.status}): ${errText}`);
  }

  const data = await res.json();

  const rawText: string =
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!rawText) throw new Error('Empty response from Gemini');

  // Strip any accidental markdown fences
  const clean = rawText.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();

  return JSON.parse(clean) as CodeAnalysis;
}

/** Fetch and log all available models — useful for debugging */
export async function listAvailableModels(): Promise<string[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not set');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );
  const data = await res.json();

  const models: string[] = (data.models ?? [])
    .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m: any) => m.name as string);

  console.table(models);
  return models;
}
