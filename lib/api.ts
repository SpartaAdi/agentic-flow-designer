import type { BlueprintResult } from './state';
import type { Question } from './state';

// ── JSON extractor — strips fences, finds outermost {}, handles <thinking> ──
export function extractJSON(raw: string): unknown {
  if (!raw || typeof raw !== 'string') throw new Error('Empty response from AI');
  let text = raw.trim();
  // Strip <thinking>...</thinking> blocks (Gemini reasoning traces)
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  // Strip markdown fences
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/g, '').trim();
  // Direct parse
  try { return JSON.parse(text); } catch { /* continue */ }
  // Find outermost { }
  let depth = 0, start = -1, end = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (text[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (start !== -1 && end !== -1) {
    try { return JSON.parse(text.slice(start, end + 1)); } catch { /* continue */ }
  }
  throw new Error('Could not parse AI response as JSON. Please try again.');
}

// ── API caller ─────────────────────────────────────────────────────────
export async function callAPI(
  system: string,
  user: string
): Promise<unknown> {
  const r = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, user, model: 'gemini-2.5-flash' }),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || `API error ${r.status}`);
  }
  const d = await r.json() as { text?: string };
  return extractJSON(d.text || '');
}

// ── Typed wrappers ─────────────────────────────────────────────────────
export async function fetchQuestions(
  system: string,
  user: string
): Promise<{ questions: Question[] }> {
  return callAPI(system, user) as Promise<{ questions: Question[] }>;
}

export async function fetchBlueprint(
  system: string,
  user: string
): Promise<BlueprintResult> {
  return callAPI(system, user) as Promise<BlueprintResult>;
}
