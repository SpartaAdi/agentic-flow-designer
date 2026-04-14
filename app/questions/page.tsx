'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBlueprintStore } from '../../lib/state';
import { SYSPROMPT } from '../../lib/prompts';
import { fetchBlueprint } from '../../lib/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import Loading from '../../components/Loading';

export default function QuestionsPage() {
  const router = useRouter();
  const { questions, answers, intake, setAnswers, setResult } = useBlueprintStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Guard: if no questions (e.g. direct navigation), redirect to intake
  useEffect(() => {
    if (mounted && questions.length === 0) {
      router.push('/');
    }
  }, [mounted, questions, router]);

  const toggleAns = (qId: number, opt: string, isMulti: boolean, max: number) => {
    const prev = { ...answers };
    if (!isMulti) {
      prev[qId] = opt;
    } else {
      const cur = Array.isArray(prev[qId]) ? (prev[qId] as string[]) : [];
      if (cur.includes(opt)) prev[qId] = cur.filter(o => o !== opt);
      else if (cur.length < max) prev[qId] = [...cur, opt];
    }
    setAnswers(prev);
  };

  const setOther = (qId: number, val: string, isMulti: boolean) => {
    const prev = { ...answers };
    if (isMulti) {
      const cur = Array.isArray(prev[qId]) ? (prev[qId] as string[]).filter(x => !x.startsWith('Other:')) : [];
      prev[qId] = val ? [...cur, `Other: ${val}`] : cur;
    } else {
      prev[qId] = val ? `Other: ${val}` : '';
    }
    setAnswers(prev);
  };

  const isSel = (qId: number, opt: string, isMulti: boolean) =>
    isMulti
      ? Array.isArray(answers[qId]) && (answers[qId] as string[]).includes(opt)
      : answers[qId] === opt;

  const handleGenerate = async (refinementNote?: string) => {
    setError('');
    setIsLoading(true);
    try {
      const fmtA: Record<number, string> = {};
      Object.entries(answers).forEach(([k, v]) => {
        fmtA[parseInt(k)] = Array.isArray(v) ? v.join(', ') : (v as string);
      });
      const payload = { intake, clarifyingAnswers: fmtA, questions };
      if (refinementNote?.trim()) (payload as Record<string, unknown>).refinementNote = refinementNote;
      const data = await fetchBlueprint(SYSPROMPT, JSON.stringify(payload));
      setResult(data);
      router.push('/result');
    } catch (e: unknown) {
      setError('Error: ' + (e instanceof Error ? e.message : String(e)));
      setIsLoading(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <>
        {mounted && <Header screen="questions" />}
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px' }}>
          <Loading stage="generate" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header screen="questions" />
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px' }}>
        <div className="fu">
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 7, marginBottom: 9, flexWrap: 'wrap' }}>
              <span className="pill" style={{ background: 'var(--pr-bg)', color: 'var(--pr-tx)' }}>{questions.length} questions · one round only</span>
              <span className="pill" style={{ background: 'var(--ok-bg)', color: 'var(--ok-tx)' }}>Checkboxes = select all that apply</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--txt)', marginBottom: 5 }}>A few more details</h2>
            <p style={{ fontSize: 13, color: 'var(--txt2)', lineHeight: 1.5 }}>
              Including which tools you use and any privacy constraints — so your blueprint is realistic and actionable.
            </p>
          </div>

          {error && (
            <div style={{ background: 'var(--er-bg)', border: '1px solid var(--er)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--er-tx)' }}>
              {error}
            </div>
          )}

          {questions.map((q, qi) => {
            const isMulti = q.multiSelect === true;
            const maxSel = q.maxSelections || (isMulti ? 999 : 1);
            const curArr = isMulti ? (Array.isArray(answers[q.id]) ? answers[q.id] as string[] : []) : [];
            const otherVal = isMulti
              ? (curArr.filter(x => x.startsWith('Other:'))[0] || '').slice(7)
              : (typeof answers[q.id] === 'string' && (answers[q.id] as string).startsWith('Other:'))
                ? (answers[q.id] as string).slice(7) : '';

            return (
              <div key={q.id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <span style={{ fontSize: 10, color: 'var(--pr-tx)', fontWeight: 700, background: 'var(--pr-bg)', padding: '2px 9px', borderRadius: 20 }}>
                    Q{qi + 1} / {questions.length}
                  </span>
                  {isMulti && (
                    <span style={{ fontSize: 11, color: 'var(--wn-tx)', background: 'var(--wn-bg)', padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
                      Select all that apply
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--txt)', marginBottom: 11, lineHeight: 1.5 }}>{q.question}</p>
                <div style={{ display: 'grid', gap: 6 }}>
                  {q.options.map(opt => {
                    const sel = isSel(q.id, opt, isMulti);
                    const disabled = isMulti && curArr.length >= maxSel && !sel;
                    return (
                      <div
                        key={opt}
                        className={`opt${sel ? ' sel' : ''}`}
                        onClick={() => !disabled && toggleAns(q.id, opt, isMulti, maxSel)}
                        style={{ opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
                      >
                        <div style={{ width: 14, height: 14, borderRadius: isMulti ? 3 : '50%', border: `1.5px solid ${sel ? 'var(--pr)' : 'var(--bdr2)'}`, background: sel ? 'var(--pr)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                          {sel && <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13 }}>{opt}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: isMulti ? 3 : '50%', border: '1.5px solid var(--bdr2)', flexShrink: 0 }} />
                  <input
                    className="inp"
                    style={{ fontSize: 13, padding: '8px 12px' }}
                    placeholder="Other — type anything not listed above…"
                    defaultValue={otherVal}
                    onChange={e => setOther(q.id, e.target.value, isMulti)}
                  />
                </div>
                {isMulti && curArr.length > 0 && (
                  <p style={{ marginTop: 7, fontSize: 12, color: 'var(--pr-tx)' }}>Selected: {curArr.join(' · ')}</p>
                )}
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="btn-s" onClick={() => router.push('/')}>← Back</button>
            <button className="btn-p" onClick={() => handleGenerate()} style={{ flex: 1 }}>
              Generate my blueprint →
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
