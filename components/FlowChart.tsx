'use client';
import { useState } from 'react';
import { TCOL, AFFILIATE_LINKS, VERIFY_LINKS } from '../lib/constants';
import type { BlueprintTask, LLMDistribution } from '../lib/state';

interface FlowChartProps {
  tasks: BlueprintTask[];
  llmDistribution: LLMDistribution[];
  isAutonomous?: boolean;
}

export default function FlowChart({ tasks, llmDistribution, isAutonomous = false }: FlowChartProps) {
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const llmColor = (llm: string) =>
    llm?.includes('Claude') ? 'var(--ok)' : llm?.includes('Gemini') ? 'var(--wn)' : 'var(--pr)';
  const llmBg = (llm: string) =>
    llm?.includes('Claude') ? 'var(--ok-bg)' : llm?.includes('Gemini') ? 'var(--wn-bg)' : 'var(--pr-bg)';

  // Autonomous mode: nodes have a green-tinted border and a subtle "auto" indicator
  const nodeStyle = (isActive: boolean) => ({
    background: isActive ? (isAutonomous ? 'var(--ok-bg)' : 'var(--pr-bg)') : 'var(--bg2)',
    border: `1px solid ${isActive
      ? (isAutonomous ? 'var(--ok)' : 'var(--pr)')
      : (isAutonomous ? 'var(--ok)40' : 'var(--bdr)')}`,
    borderRadius: 'var(--r)', padding: '9px 12px',
    textAlign: 'center' as const, minWidth: 88, flexShrink: 0,
    cursor: 'pointer', transition: 'all .15s',
    boxShadow: isActive ? 'var(--sh2)' : 'none',
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span className="lbl" style={{ margin: 0 }}>Workflow overview</span>
        {isAutonomous && (
          <span className="pill" style={{ background: 'var(--ok-bg)', color: 'var(--ok-tx)', fontSize: 10 }}>
            🤖 Fully automated
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 12 }}>
        {isAutonomous
          ? 'Each step runs autonomously — click any node to see the agent instruction'
          : 'Click any step to see details'}
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'flex-start', marginBottom: 12 }}>
        {tasks.map((t, i) => {
          const isActive = activeNode === t.number;
          return (
            <div key={t.number} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div onClick={() => setActiveNode(isActive ? null : t.number)} style={nodeStyle(isActive)}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: TCOL[t.type] || 'var(--pr)', margin: '0 auto 5px' }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt)', marginBottom: 2 }}>
                  {isAutonomous && <span style={{ marginRight: 3, fontSize: 9 }}>⚙</span>}
                  {t.name}
                </div>
                {t.llm && t.llm !== 'None' && (
                  <div style={{ fontSize: 9, fontWeight: 500, color: llmColor(t.llm) }}>
                    {t.llm.split(' ').slice(0, 2).join(' ')}
                  </div>
                )}
                <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{t.platform || ''}</div>
              </div>
              {i < tasks.length - 1 && (
                <span style={{ color: isAutonomous ? 'var(--ok)' : 'var(--bdr2)', fontSize: 14, flexShrink: 0 }}>→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded node tooltip */}
      {activeNode !== null && (() => {
        const t = tasks.find(x => x.number === activeNode);
        if (!t) return null;
        const affLink = AFFILIATE_LINKS[t.llm];
        const verifyLink = VERIFY_LINKS[t.llm];
        return (
          <div className="fu" style={{
            background: isAutonomous ? 'var(--ok-bg)' : 'var(--pr-bg)',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r)', padding: '12px 14px', marginBottom: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: TCOL[t.type] || 'var(--pr)', flexShrink: 0 }} />
              <strong style={{ fontSize: 13, color: 'var(--txt)' }}>{t.name}</strong>
              <span className="pill" style={{ background: (TCOL[t.type] || 'var(--pr)') + '20', color: TCOL[t.type] || 'var(--pr)', fontSize: 10 }}>{t.type}</span>
              {isAutonomous && (
                <span className="pill" style={{ background: 'var(--ok-bg)', color: 'var(--ok-tx)', fontSize: 10 }}>⚙ Auto</span>
              )}
              {t.isUxSuggestion && (
                <span className="pill" style={{ background: 'var(--wn-bg)', color: 'var(--wn-tx)', fontSize: 10 }}>💡 UX Suggestion</span>
              )}
            </div>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--txt2)', lineHeight: 1.5 }}>{t.description}</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {t.llm && t.llm !== 'None' && (
                <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span className="pill" style={{ background: llmBg(t.llm), color: llmColor(t.llm), fontSize: 10 }}>🤖 {t.llm}</span>
                  {affLink && <a href={affLink} target="_blank" rel="noopener" style={{ fontSize: 10, color: 'var(--pr-tx)', textDecoration: 'none' }}>↗</a>}
                  {verifyLink && <a href={verifyLink.pricing} target="_blank" rel="noopener" className="btn-s" style={{ fontSize: 10, padding: '2px 7px' }}>↗ Verify pricing</a>}
                </span>
              )}
              {t.platform && <span className="pill" style={{ background: 'var(--bg3)', color: 'var(--txt2)', fontSize: 10 }}>🔧 {t.platform}</span>}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--txt3)', fontStyle: 'italic' }}>{t.llmReason}</p>
          </div>
        );
      })()}

      {/* LLM distribution pills */}
      {llmDistribution?.length > 0 && (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingTop: 10, borderTop: '1px solid var(--bdr)', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 500 }}>AI engines used:</span>
          {llmDistribution.map(d => (
            <span key={d.llm} className="pill" style={{ background: llmBg(d.llm), color: llmColor(d.llm), border: `1px solid ${llmColor(d.llm)}40`, fontSize: 10 }}>
              {d.llm} · {d.taskCount} step{d.taskCount > 1 ? 's' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
