'use client';
import { useEffect, useRef } from 'react';
import { TIPS } from '../lib/constants';

interface LoadingProps {
  stage: 'clarify' | 'generate' | 'share';
}

export default function Loading({ stage }: LoadingProps) {
  const tipRef = useRef<HTMLParagraphElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const dur = stage === 'clarify' ? '12s' : '28s';
  const msg = stage === 'clarify' ? 'Analysing your use case and preparing questions…'
            : stage === 'share'   ? 'Saving your blueprint…'
            : 'Building your AI workflow blueprint…';
  const sub = stage === 'clarify' ? '~10 seconds' : stage === 'share' ? '' : '~25 seconds';

  const steps = stage === 'clarify'
    ? ['Reading your use case', 'Identifying requirements', 'Preparing questions']
    : stage === 'share' ? []
    : ['Analysing your answers', 'Decomposing into tasks', 'Selecting optimal tools', 'Checking tool availability', 'Calculating costs in ₹', 'Assembling your blueprint'];

  const firstTip = TIPS[Math.floor(Math.random() * TIPS.length)];

  useEffect(() => {
    if (stage !== 'generate') return;
    let idx = 0;
    intervalRef.current = setInterval(() => {
      if (!tipRef.current) return;
      idx = (idx + 1) % TIPS.length;
      tipRef.current.textContent = TIPS[idx];
      tipRef.current.style.animation = 'none';
      void tipRef.current.offsetWidth;
      tipRef.current.style.animation = 'tipFade .4s ease forwards';
    }, 4500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [stage]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '40px 20px', textAlign: 'center' }}>
      <div className="spin-el" style={{ marginBottom: 20 }} />
      <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--txt)', marginBottom: 6 }}>{msg}</p>
      {sub && <p style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 24 }}>{sub}</p>}
      {stage !== 'share' && (
        <div style={{ width: 280, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 24 }}>
          <div className="pbar" style={{ '--dur': dur } as React.CSSProperties} />
        </div>
      )}
      {steps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--txt3)' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 600, color: 'var(--txt3)' }}>{i + 1}</div>
              {s}
            </div>
          ))}
        </div>
      )}
      {stage === 'generate' && (
        <div style={{ maxWidth: 360, background: 'var(--bg2)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', padding: '14px 18px', textAlign: 'left' }}>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>While you wait</p>
          <p ref={tipRef} style={{ margin: 0, fontSize: 13, color: 'var(--txt2)', lineHeight: 1.6, animation: 'tipFade .4s ease forwards' }}>
            {firstTip}
          </p>
        </div>
      )}
    </div>
  );
}
