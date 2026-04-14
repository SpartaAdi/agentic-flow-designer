import { LLMDATA, PLATDATA, PAYLOAD, USD } from './constants';
import type { BlueprintResult, Question } from './state';

// ── Live pricing types (matches /api/prices response + pricing-data.json) ──
export type LiveRates = Record<string, {
  in: number; out: number; cliff: number | null; note: string;
}>;

/** Merge live rates from Redis over the static LLMDATA constant.
 *  Any model not present in overrideRates falls back to LLMDATA. */
function effectiveRates(overrideRates?: LiveRates): typeof LLMDATA {
  if (!overrideRates) return LLMDATA;
  const merged: typeof LLMDATA = { ...LLMDATA };
  for (const [model, rates] of Object.entries(overrideRates)) {
    if (merged[model]) merged[model] = { ...merged[model], ...rates };
  }
  return merged;
}

export interface PerLLMCost {
  llm: string;
  taskCount: number;
  singleRunUSD: number;
  singleRunINR: number;
  monthlyUSD: number;
  monthlyINR: number;
}

export interface CostResult {
  singleRunUSD: number;
  singleRunINR: number;
  apiMonthlyUSD: number;
  apiMonthlyINR: number;
  platMonthlyUSD: number;
  platMonthlyINR: number;
  totalMonthlyUSD: number;
  totalMonthlyINR: number;
  perLLM: PerLLMCost[];
  runs: number;
  buf: number;
  payloadKey: string;
  freqFromUser: boolean;
  usd: number;
  inr: number;
}

function runsFromApproach(approach: string): number {
  if (approach === 'Direct LLM Usage') return 1;
  if (approach === 'Full Autonomous Agent') return 300;
  return 100;
}

export function calcCost(
  result: BlueprintResult,
  answers: Record<number, string | string[]>,
  questions: Question[],
  overrideRates?: LiveRates,
): CostResult | null {
  const rates = effectiveRates(overrideRates);
  const primaryLlmData = rates[result.primaryLLM];
  if (!primaryLlmData) return null;

  const pq = questions.find(q => /page|size|document|long/i.test(q.question));
  const pAns = pq
    ? (Array.isArray(answers[pq.id]) ? (answers[pq.id] as string[])[0] : answers[pq.id] as string)
    : null;
  const payloadKey = (pAns && PAYLOAD[pAns]) ? pAns : 'Medium (5–20 pages)';
  const payload = PAYLOAD[payloadKey];
  const freqFromUser = !!pAns && !!PAYLOAD[pAns];

  const freqQ = questions.find(q =>
    /how many times|frequency|per month|runs/i.test(q.question)
  );
  const freqAns = freqQ
    ? (Array.isArray(answers[freqQ.id]) ? (answers[freqQ.id] as string[])[0] : answers[freqQ.id] as string)
    : null;

  const FREQ_MAP: Record<string, number> = {
    'Once a month': 3,
    '2–5 times a month': 10,
    'Weekly (4–5 times)': 23,
    'Daily or multiple times a week': 35,
  };
  const runs = (freqAns && FREQ_MAP[freqAns])
    ? FREQ_MAP[freqAns]
    : runsFromApproach(result.executionApproach);

  const buf = 1.0;

  const perLLM: PerLLMCost[] = (result.llmDistribution || []).map(d => {
    const llmData = rates[d.llm];
    if (!llmData) return null;
    const fraction = d.taskCount / Math.max(result.tasks?.length || 1, 1);
    const singleRunUSD =
      (payload.in / 1e6) * llmData.in * fraction +
      (payload.out / 1e6) * llmData.out * fraction;
    return {
      llm: d.llm,
      taskCount: d.taskCount,
      singleRunUSD,
      singleRunINR: singleRunUSD * USD,
      monthlyUSD: singleRunUSD * runs * buf,
      monthlyINR: singleRunUSD * runs * buf * USD,
    };
  }).filter(Boolean) as PerLLMCost[];

  const singleRunUSD =
    (payload.in / 1e6) * primaryLlmData.in +
    (payload.out / 1e6) * primaryLlmData.out;
  const apiMonthlyUSD = singleRunUSD * runs * buf;

  const platData = PLATDATA[result.platformRecommendation];
  const platMonthlyUSD =
    result.freemiumVerdict === 'Freemium sufficient' ? 0 : (platData?.paidUSD || 0);

  const totalMonthlyUSD = apiMonthlyUSD + platMonthlyUSD;

  return {
    singleRunUSD,
    singleRunINR: singleRunUSD * USD,
    apiMonthlyUSD,
    apiMonthlyINR: apiMonthlyUSD * USD,
    platMonthlyUSD,
    platMonthlyINR: platMonthlyUSD * USD,
    totalMonthlyUSD,
    totalMonthlyINR: totalMonthlyUSD * USD,
    perLLM,
    runs,
    buf,
    payloadKey,
    freqFromUser,
    usd: totalMonthlyUSD,
    inr: totalMonthlyUSD * USD,
  };
}
