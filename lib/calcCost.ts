import { LLMDATA, PLATDATA, PAYLOAD, USD } from './constants';
import type { BlueprintResult, Question } from './state';

export interface PerLLMCost {
  llm: string;
  taskCount: number;
  singleRunUSD: number;
  singleRunINR: number;
  monthlyUSD: number;
  monthlyINR: number;
}

export interface CostResult {
  // Single run
  singleRunUSD: number;
  singleRunINR: number;
  // Monthly API
  apiMonthlyUSD: number;
  apiMonthlyINR: number;
  // Monthly platform
  platMonthlyUSD: number;
  platMonthlyINR: number;
  // Grand total
  totalMonthlyUSD: number;
  totalMonthlyINR: number;
  // Per-LLM breakdown
  perLLM: PerLLMCost[];
  // Meta
  runs: number;
  buf: number;
  payloadKey: string;
  freqFromUser: boolean;
  // Legacy compat
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
  questions: Question[]
): CostResult | null {
  const primaryLlmData = LLMDATA[result.primaryLLM];
  if (!primaryLlmData) return null;

  // Detect payload size from question answers
  const pq = questions.find(q =>
    /page|size|document|long/i.test(q.question)
  );
  const pAns = pq
    ? (Array.isArray(answers[pq.id]) ? (answers[pq.id] as string[])[0] : answers[pq.id] as string)
    : null;
  const payloadKey = (pAns && PAYLOAD[pAns]) ? pAns : 'Medium (5–20 pages)';
  const payload = PAYLOAD[payloadKey];
  const freqFromUser = !!pAns && !!PAYLOAD[pAns];

  // Detect frequency from answers
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
  const runs = (freqAns && FREQ_MAP[freqAns]) ? FREQ_MAP[freqAns] : runsFromApproach(result.executionApproach);

  // Thinking token buffer for non-Claude models with reasoning
  const buf = 1.0;

  // Per-LLM breakdown
  const perLLM: PerLLMCost[] = (result.llmDistribution || []).map(d => {
    const llmData = LLMDATA[d.llm];
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

  // Total API cost
  const singleRunUSD =
    (payload.in / 1e6) * primaryLlmData.in +
    (payload.out / 1e6) * primaryLlmData.out;
  const apiMonthlyUSD = singleRunUSD * runs * buf;

  // Platform cost
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
    // Legacy
    usd: totalMonthlyUSD,
    inr: totalMonthlyUSD * USD,
  };
}
