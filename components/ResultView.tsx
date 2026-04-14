'use client';
import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PLATDATA, LLMDATA, VDICT, AICONS, TCOL, AFFILIATE_LINKS, VERIFY_LINKS, inrFmt } from '../lib/constants';
import { calcCost } from '../lib/calcCost';
import { useBlueprintStore } from '../lib/state';
import type { BlueprintResult, Question, DetailedStep } from '../lib/state';
import FlowChart from './FlowChart';
import CostBreakdown from './CostBreakdown';
import RefinementBox from './RefinementBox';
import Footer from './Footer';
import Header from './Header';

interface ResultViewProps {
  result: BlueprintResult;
  answers: Record<number, string | string[]>;
  questions: Question[];
  isReadOnly?: boolean;
  shareId?: string | null;
  onRefine?: (note: string) => void;
  onReset?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  saveFlash?: boolean;
  shareFlash?: boolean;
}

type Tab = 'summary' | 'architecture' | 'guide';

export default function ResultView({
  result, answers, questions,
  isReadOnly = false, shareId = null,
  onRefine, onReset, onSave, onShare,
  saveFlash = false, shareFlash = false,
}: ResultViewProps) {
  const [tab, setTab] = useState<Tab>('summary');
  const router = useRouter();

  const cost = calcCost(result, answers, questions);
  const platInfo = PLATDATA[result.platformRecommendation] || PLATDATA['None (Direct LLM)'];
  const llmInfo = LLMDATA[result.primaryLLM];
  const vInfo = VDICT[result.freemiumVerdict] || VDICT['Freemium to start upgrade likely'];
  const aIcon = AICONS[result.executionApproach] || '⚙';

  // Confidence badge
  const confScore = result.confidenceScore ?? 8;
  const confBg = confScore >= 8 ? 'var(--ok-bg)' : confScore >= 5 ? 'var(--wn-bg)' : 'var(--er-bg)';
  const confColor = confScore >= 8 ? 'var(--ok-tx)' : confScore >= 5 ? 'var(--wn-tx)' : 'var(--er-tx)';
  const confLabel = confScore >= 8 ? 'High confidence' : confScore >= 5 ? 'Review assumptions' : 'Verify before acting';

  const handleReset = () => {
    if (onReset) { onReset(); return; }
    router.push('/');
  };

  // ── Executive Summary Hero ────────────────────────────────────────────
  const hero = (
    <div style={{ background: 'var(--pr-bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', padding: 20, marginBottom: 14, boxShadow: 'var(--sh)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <span className="lbl" style={{ color: 'var(--pr-tx)' }}>Your blueprint</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--txt)', lineHeight: 1.25, marginBottom: 6 }}>{result.title}</h2>
          <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.55, margin: 0 }}>{result.executionRationale}</p>
        </div>
        {cost && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>Est. monthly cost</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt)', lineHeight: 1, margin: 0 }}>{inrFmt(cost.totalMonthlyUSD)}</p>
            <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>≈ ${cost.totalMonthlyUSD.toFixed(2)}/mo</p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span className="pill" style={{ background: 'var(--pr)', color: '#fff' }}>{aIcon} {result.executionApproach}</span>
        <span className="pill" style={{ background: 'var(--surf)', color: 'var(--txt)', border: '1px solid var(--bdr)' }}>
          {AFFILIATE_LINKS[result.platformRecommendation]
            ? <a href={AFFILIATE_LINKS[result.platformRecommendation]} target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>🔧 {result.platformRecommendation} ↗</a>
            : <>🔧 {result.platformRecommendation}</>}
        </span>
        <span className="pill" style={{ background: 'var(--surf)', color: 'var(--txt)', border: '1px solid var(--bdr)' }}>
          {AFFILIATE_LINKS[result.primaryLLM]
            ? <a href={AFFILIATE_LINKS[result.primaryLLM]} target="_blank" rel="noopener" style={{ color: 'inherit', textDecoration: 'none' }}>🤖 {result.primaryLLM} ↗</a>
            : <>🤖 {result.primaryLLM}</>}
        </span>
        <span className="pill" style={{ background: vInfo.bg, color: vInfo.color }}>{vInfo.label}</span>
        {result.estimatedTimeSaved && (
          <span className="pill" style={{ background: 'var(--ok-bg)', color: 'var(--ok-tx)' }}>⏱ Saves {result.estimatedTimeSaved}</span>
        )}
        <span className="pill" style={{ background: confBg, color: confColor }} title={result.confidenceRationale}>
          {confScore}/10 — {confLabel}
        </span>
      </div>
    </div>
  );

  // ── Cliff Warning ─────────────────────────────────────────────────────
  const cliffWarn = result.cliffWarning ? (
    <div style={{ background: 'var(--er-bg)', border: '1px solid var(--er)', borderRadius: 'var(--r)', padding: '12px 15px', marginBottom: 12, display: 'flex', gap: 9 }}>
      <span style={{ flexShrink: 0, fontSize: 16 }}>⚠</span>
      <div>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--er-tx)' }}>Cost notice — long-context pricing</p>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>{result.cliffWarning}</p>
      </div>
    </div>
  ) : null;

  // ── Tab 1: Summary & ROI ──────────────────────────────────────────────
  const tabSummary = (
    <div className="fu">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }} className="three-col">
        {/* Platform card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <span className="lbl">Platform</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
            {AFFILIATE_LINKS[result.platformRecommendation]
              ? <a href={AFFILIATE_LINKS[result.platformRecommendation]} target="_blank" rel="noopener" style={{ color: 'var(--pr-tx)', textDecoration: 'none' }}>{result.platformRecommendation} ↗</a>
              : result.platformRecommendation}
          </p>
          <p style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8, lineHeight: 1.45 }}>{result.platformRationale}</p>
          <span className="pill" style={{ background: vInfo.bg, color: vInfo.color, display: 'inline-flex', marginBottom: 8 }}>{vInfo.label}</span>
          {platInfo && (
            <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: 8, marginTop: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 2 }}>Free tier: {platInfo.free}</p>
              <p style={{ fontSize: 11, color: 'var(--wn-tx)', marginBottom: 4 }}>Paid: {platInfo.paid} / {platInfo.paidINR}</p>
              {VERIFY_LINKS[result.platformRecommendation] && (
                <a href={VERIFY_LINKS[result.platformRecommendation].pricing} target="_blank" rel="noopener" className="btn-s" style={{ fontSize: 10, padding: '3px 8px', display: 'inline-block', textDecoration: 'none' }}>↗ Verify pricing</a>
              )}
            </div>
          )}
        </div>

        {/* AI engine card */}
        <div className="card" style={{ marginBottom: 0 }}>
          <span className="lbl">AI engine</span>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>
            {AFFILIATE_LINKS[result.primaryLLM]
              ? <a href={AFFILIATE_LINKS[result.primaryLLM]} target="_blank" rel="noopener" style={{ color: 'var(--pr-tx)', textDecoration: 'none' }}>{result.primaryLLM} ↗</a>
              : result.primaryLLM}
          </p>
          <p style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 8, lineHeight: 1.45 }}>{result.llmRationale}</p>
          {llmInfo && (
            <div style={{ borderTop: '1px solid var(--bdr)', paddingTop: 8, marginTop: 6 }}>
              <p style={{ fontSize: 11, color: 'var(--ok-tx)', marginBottom: 2 }}>Input: ${llmInfo.in}/1M · {inrFmt(llmInfo.in / 1000)}/K</p>
              <p style={{ fontSize: 11, color: 'var(--wn-tx)', marginBottom: 2 }}>Output: ${llmInfo.out}/1M · {inrFmt(llmInfo.out / 1000)}/K</p>
              <p style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>{llmInfo.note}</p>
              {VERIFY_LINKS[result.primaryLLM] && (
                <a href={VERIFY_LINKS[result.primaryLLM].pricing} target="_blank" rel="noopener" className="btn-s" style={{ fontSize: 10, padding: '3px 8px', display: 'inline-block', textDecoration: 'none' }}>↗ Verify pricing</a>
              )}
            </div>
          )}
        </div>

        {/* Cost breakdown card */}
        {cost
          ? <CostBreakdown result={result} cost={cost} />
          : <div className="card" style={{ marginBottom: 0 }}><p style={{ fontSize: 12, color: 'var(--txt2)' }}>Varies by usage</p></div>}
      </div>

      {/* Billing note */}
      <div style={{ background: 'var(--pr-bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ</span>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>{result.billingNote}</p>
      </div>

      {/* ROI */}
      {result.roiAssessment && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>{result.roiAssessment.worthIt ? '✅' : '🤔'}</span>
            <div>
              <span className="lbl" style={{ marginBottom: 1 }}>Is it worth it?</span>
              <p style={{ fontSize: 13, fontWeight: 500, color: result.roiAssessment.worthIt ? 'var(--ok-tx)' : 'var(--wn-tx)', margin: 0 }}>
                {result.roiAssessment.worthIt ? 'Worth the investment' : 'Consider simpler alternatives first'}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.55, marginBottom: result.roiAssessment.alternatives?.length ? 14 : 0 }}>
            {result.roiAssessment.summary}
          </p>
          {result.roiAssessment.alternatives?.length > 0 && (
            <>
              <span className="lbl">Simpler alternatives — you decide what works</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} className="two-col">
                {result.roiAssessment.alternatives.map((a, i) => (
                  <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '12px 14px' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{a.name}</p>
                    <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.4 }}>{a.description}</p>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      <span className="pill" style={{ background: 'var(--ok-bg)', color: 'var(--ok-tx)', fontSize: 11 }}>💰 {a.cost}</span>
                      <span className="pill" style={{ background: 'var(--bg3)', color: 'var(--txt2)', fontSize: 11 }}>Best for: {a.bestFor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '9px 13px', marginBottom: 16 }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--txt3)', lineHeight: 1.5 }}>
          ⚠ Cost estimates are approximate. Platform pricing verified April 2026 — verify at: make.com · n8n.io · zapier.com · relevanceai.com · anthropic.com · openai.com · ai.google.dev · USD/INR at ₹84 (verify current rate)
        </p>
      </div>
    </div>
  );

  // ── Tab 2: Workflow Architecture ──────────────────────────────────────
  const tabArchitecture = (
    <div className="fu">
      <FlowChart tasks={result.tasks || []} llmDistribution={result.llmDistribution || []} />

      {/* Task breakdown */}
      <div className="card">
        <span className="lbl">How it works · {result.tasks?.length} steps</span>
        {result.tasks?.map((t, i) => {
          const llmColor = t.llm?.includes('Claude') ? 'var(--ok)' : t.llm?.includes('Gemini') ? 'var(--wn)' : t.llm?.includes('GPT') ? 'var(--pr)' : 'var(--txt3)';
          const llmBg = t.llm?.includes('Claude') ? 'var(--ok-bg)' : t.llm?.includes('Gemini') ? 'var(--wn-bg)' : t.llm?.includes('GPT') ? 'var(--pr-bg)' : 'var(--bg2)';
          return (
            <div key={t.number} style={{ display: 'flex', gap: 11, padding: '10px 0', borderBottom: i < result.tasks.length - 1 ? '1px solid var(--bdr)' : 'none' }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: (TCOL[t.type] || 'var(--pr)') + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: TCOL[t.type] || 'var(--pr)' }}>{t.number}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{t.name}</span>
                  <span className="pill" style={{ background: (TCOL[t.type] || 'var(--pr)') + '15', color: TCOL[t.type] || 'var(--pr)', fontSize: 10 }}>{t.type}</span>
                  {t.isUxSuggestion && <span className="pill" style={{ background: 'var(--wn-bg)', color: 'var(--wn-tx)', fontSize: 10 }}>💡 UX Suggestion</span>}
                </div>
                <p style={{ margin: '0 0 5px', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.45 }}>{t.description}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {t.llm && t.llm !== 'None' && (
                    <>
                      <span className="pill" style={{ background: llmBg, color: llmColor, border: `1px solid ${llmColor}30`, fontSize: 10 }}>🤖 {t.llm}</span>
                      {t.llmReason && <span style={{ fontSize: 10, color: 'var(--txt3)', fontStyle: 'italic' }}>{t.llmReason}</span>}
                    </>
                  )}
                  {t.platform && <span className="pill" style={{ background: 'var(--bg2)', color: 'var(--txt2)', fontSize: 10 }}>🔧 {t.platform}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tool analysis */}
      {result.toolAnalysis && (() => {
        const ta = result.toolAnalysis;
        const gaps = ta.toolsGap?.filter(g => g.tool) || [];
        const conflicts = ta.toolsPrivacyConflict?.filter(c => c.tool) || [];
        return (
          <div className="card">
            <span className="lbl">Tools you need</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: gaps.length || conflicts.length ? 12 : 0 }}>
              {ta.toolsRequired?.map(t => {
                const has = ta.toolsUserHas?.includes(t);
                const blocked = ta.toolsBlocked?.includes(t);
                const missing = !has && !blocked;
                const c = missing ? 'var(--er-tx)' : blocked ? 'var(--wn-tx)' : 'var(--ok-tx)';
                const bg = missing ? 'var(--er-bg)' : blocked ? 'var(--wn-bg)' : 'var(--ok-bg)';
                return (
                  <span key={t} className="pill" style={{ background: bg, color: c }}>
                    {missing ? '⚠' : blocked ? '🔒' : '✓'} {t}
                  </span>
                );
              })}
            </div>
            {gaps.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--er-tx)', marginBottom: 7 }}>Tools you need but don&apos;t currently have</p>
                {gaps.map((g, i) => (
                  <div key={i} style={{ background: 'var(--er-bg)', border: '1px solid var(--er)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 7 }}>
                    <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: 'var(--er-tx)' }}>{g.tool}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--txt2)' }}>{g.reason}</p>
                    {g.workaround && <p style={{ margin: 0, fontSize: 11, color: 'var(--txt3)' }}>💡 Alternative: {g.workaround}</p>}
                  </div>
                ))}
              </>
            )}
            {conflicts.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--wn-tx)', marginBottom: 7 }}>Tools required but restricted by your data policy</p>
                {conflicts.map((c, i) => (
                  <div key={i} style={{ background: 'var(--wn-bg)', border: '1px solid var(--wn)', borderRadius: 'var(--r)', padding: '10px 12px', marginBottom: 7 }}>
                    <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 600, color: 'var(--wn-tx)' }}>{c.tool}</p>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--txt2)' }}>{c.issue}</p>
                    {c.workaround && <p style={{ margin: 0, fontSize: 11, color: 'var(--txt3)' }}>💡 Alternative: {c.workaround}</p>}
                  </div>
                ))}
              </>
            )}
            {gaps.length === 0 && conflicts.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: 10, background: 'var(--ok-bg)', borderRadius: 'var(--r)' }}>
                <span>✓</span>
                <span style={{ fontSize: 13, color: 'var(--ok-tx)' }}>You have all the tools needed. No gaps or privacy conflicts detected.</span>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  // ── Tab 3: Step-by-Step Guide ─────────────────────────────────────────
  const StepCard = ({ step }: { step: DetailedStep }) => {
    const [copied, setCopied] = useState(false);

    const copyPrompt = useCallback(() => {
      navigator.clipboard.writeText(step.promptTemplate).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }, [step.promptTemplate]);

    return (
      <div className="step-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--pr-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--pr-tx)', flexShrink: 0 }}>
            S{step.taskNumber}
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--txt)', display: 'flex', alignItems: 'center', gap: 6 }}>
              {step.taskName}
              {step.isUxSuggestion && <span className="pill" style={{ background: 'var(--wn-bg)', color: 'var(--wn-tx)', fontSize: 10 }}>💡 UX Suggestion</span>}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--txt3)' }}>⏱ {step.setupTime}</p>
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.55, marginBottom: 10 }}>{step.description}</p>
        {step.promptTemplate && (
          <div style={{ background: 'var(--bg3)', borderRadius: 'var(--r)', padding: '10px 13px', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Prompt to use</p>
              <button
                className={`copy-btn${copied ? ' copied' : ''}`}
                onClick={copyPrompt}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {copied
                    ? <polyline points="20 6 9 17 4 12"/>
                    : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                </svg>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--pr-tx)', fontFamily: 'monospace', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{step.promptTemplate}</p>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: '8px 10px' }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>Input</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--txt2)' }}>{step.input}</p>
          </div>
          <div style={{ background: 'var(--bg2)', borderRadius: 'var(--r)', padding: '8px 10px' }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, color: 'var(--txt3)', textTransform: 'uppercase' }}>Output</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--txt2)' }}>{step.output}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {step.platform && <span className="pill" style={{ background: 'var(--bg2)', color: 'var(--txt2)', fontSize: 11 }}>🔧 {step.platform}</span>}
          {step.llm && step.llm !== 'None' && <span className="pill" style={{ background: 'var(--bg2)', color: 'var(--txt2)', fontSize: 11 }}>🤖 {step.llm}</span>}
        </div>
        {step.connection && <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--txt3)' }}>→ {step.connection}</p>}
      </div>
    );
  };

  const tabGuide = (
    <div className="fu">
      <p style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 14, lineHeight: 1.5 }}>Written for beginners. No prior experience needed.</p>
      {result.detailedSteps?.length > 0
        ? result.detailedSteps.map(step => <StepCard key={step.taskNumber} step={step} />)
        : <div className="card"><p style={{ fontSize: 13, color: 'var(--txt2)' }}>Step-by-step guide not available for this blueprint.</p></div>}
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--r)', padding: '9px 13px', marginTop: 12 }}>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--txt3)', lineHeight: 1.5 }}>
          ⚠ Pricing verified April 2026. Verify at official sources before building.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Header
        screen="result"
        isReadOnly={isReadOnly}
        hasResult={true}
        shareId={shareId}
        onSave={onSave}
        onShare={onShare}
        saveFlash={saveFlash}
        shareFlash={shareFlash}
      />
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px' }}>
        <div className="fu">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }} className="no-print">
            <button className="btn-s" style={{ fontSize: 12, padding: '7px 12px' }} onClick={() => window.print()}>🖨 Print / Save PDF</button>
          </div>
          {hero}
          {cliffWarn}

          {/* Tab bar */}
          <div className="tab-bar no-print" role="tablist">
            {(['summary', 'architecture', 'guide'] as Tab[]).map(t => (
              <button
                key={t}
                className={`tab-btn${tab === t ? ' active' : ''}`}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
              >
                {t === 'summary' ? '📊 Summary & ROI' : t === 'architecture' ? '⚙ Workflow Architecture' : '📋 Step-by-Step Guide'}
              </button>
            ))}
          </div>

          {tab === 'summary' && tabSummary}
          {tab === 'architecture' && tabArchitecture}
          {tab === 'guide' && tabGuide}

          {!isReadOnly && onRefine && (
            <RefinementBox onRefine={onRefine} onReset={handleReset} />
          )}

          {!isReadOnly && (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)', marginTop: 12 }} className="no-print">
              Session auto-saved · Use the Save button in the header anytime
            </p>
          )}
        </div>

        {!isReadOnly && (
          <button
            className="fab no-print"
            id="refine-fab"
            onClick={() => {
              document.getElementById('refinement-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => (document.getElementById('refineArea') as HTMLTextAreaElement)?.focus(), 300);
            }}
          >
            🔁 <span>Refine</span>
          </button>
        )}
      </div>
      <Footer />
    </>
  );
}
