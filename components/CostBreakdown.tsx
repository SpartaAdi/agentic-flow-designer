'use client';
import { useState } from 'react';
import { PLATDATA, LLMDATA, PAYLOAD, USD } from '../lib/constants';
import type { CostResult } from '../lib/calcCost';
import type { BlueprintResult } from '../lib/state';

interface CostBreakdownProps {
  result: BlueprintResult;
  cost: CostResult;
}

export default function CostBreakdown({ result, cost }: CostBreakdownProps) {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const platData = PLATDATA[result.platformRecommendation];
  const llmData = LLMDATA[result.primaryLLM];
  const payloadData = PAYLOAD[cost.payloadKey];

  const inr = (usd: number) => '₹' + Math.round(usd * USD).toLocaleString('en-IN');

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <span className="lbl">Monthly cost estimate</span>

      <div className="row">
        <span style={{ color: 'var(--txt2)' }}>Platform</span>
        <span style={{ fontWeight: 600, color: result.freemiumVerdict === 'Freemium sufficient' ? 'var(--ok-tx)' : 'var(--wn-tx)' }}>
          {result.freemiumVerdict === 'Freemium sufficient' ? 'Free to start' : (platData?.paidINR || '—')}
        </span>
      </div>

      <div className="row">
        <span style={{ color: 'var(--txt2)' }}>AI API (~{cost.runs} runs/mo)</span>
        <span style={{ fontWeight: 600 }}>{inr(cost.apiMonthlyUSD)}</span>
      </div>

      {/* Per-LLM breakdown (if multi-model) */}
      {cost.perLLM.length > 1 && cost.perLLM.map(p => (
        <div key={p.llm} className="row" style={{ paddingLeft: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>↳ {p.llm} ({p.taskCount} task{p.taskCount > 1 ? 's' : ''})</span>
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{inr(p.monthlyUSD)}</span>
        </div>
      ))}

      <div style={{ marginTop: 10, background: 'var(--bg2)', borderRadius: 'var(--r)', padding: 10, textAlign: 'center' }}>
        <p style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 2 }}>Total estimated</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>{inr(cost.totalMonthlyUSD)}</p>
        <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>≈ ${cost.totalMonthlyUSD.toFixed(2)}/mo</p>
      </div>

      {/* Assumption transparency card */}
      <button
        onClick={() => setShowAssumptions(!showAssumptions)}
        style={{ marginTop: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--pr-tx)', fontFamily: 'inherit', padding: 0 }}
      >
        {showAssumptions ? '▲' : '▼'} How this estimate was calculated
      </button>

      {showAssumptions && (
        <div className="fu" style={{ marginTop: 8, background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: 11, color: 'var(--txt2)', lineHeight: 1.7 }}>
          <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--txt)', fontSize: 12 }}>Assumptions used</p>
          <p style={{ margin: '0 0 3px' }}>📄 Payload size: <strong>{cost.payloadKey}</strong> = {payloadData?.in.toLocaleString('en-IN')} input tokens, {payloadData?.out.toLocaleString('en-IN')} output tokens per run</p>
          <p style={{ margin: '0 0 3px' }}>🔁 Run frequency: <strong>{cost.runs} runs/month</strong> {cost.freqFromUser ? '(from your answers)' : '(default for ' + result.executionApproach + ')'}</p>
          {llmData && (
            <p style={{ margin: '0 0 3px' }}>🤖 Primary model: <strong>{result.primaryLLM}</strong> @ ${llmData.in}/1M input, ${llmData.out}/1M output</p>
          )}
          <p style={{ margin: '0 0 3px' }}>
            🧮 Math: (({payloadData?.in.toLocaleString('en-IN')}/1M × ${llmData?.in}) + ({payloadData?.out.toLocaleString('en-IN')}/1M × ${llmData?.out})) × {cost.runs} = ${cost.apiMonthlyUSD.toFixed(4)}/mo
          </p>
          <p style={{ margin: 0, color: 'var(--txt3)', fontSize: 10 }}>Exchange rate: $1 = ₹{USD}. Verify current rate before budgeting.</p>
        </div>
      )}
    </div>
  );
}
