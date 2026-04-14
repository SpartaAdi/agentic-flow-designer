'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBlueprintStore } from '../lib/state';
import { CLARIFY } from '../lib/prompts';
import { fetchQuestions } from '../lib/api';
import { EXEC_OPTIONS } from '../lib/constants';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loading from '../components/Loading';

export default function IntakePage() {
  const router = useRouter();
  const { intake, setIntake, setQuestions, setAnswers, result, reset } = useBlueprintStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [mounted, setMounted] = useState(false);

  const useCaseRef = useRef<HTMLTextAreaElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (result) setShowResume(true);
    // Redirect legacy ?id= permalinks
    const id = new URLSearchParams(location.search).get('id');
    if (id && /^[0-9a-f-]+$/i.test(id)) {
      router.push(`/result/${id}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: Parameters<typeof setIntake>[0], val: string) => setIntake(key, val);

  const handleSubmit = async () => {
    if (useCaseRef.current) setIntake('useCase', useCaseRef.current.value);
    if (companyRef.current) setIntake('company', companyRef.current.value);
    const i = useBlueprintStore.getState().intake;
    if (!i.userType || !i.useCase?.trim() || !i.usageIntent || !i.execPref) {
      setError('Please complete all required fields.'); return;
    }
    setError('');
    setIsLoading(true);
    try {
      const prompt = CLARIFY.replace('INTAKE_DATA', JSON.stringify(i));
      const data = await fetchQuestions('Return only valid JSON. No markdown.', prompt);
      const qs = data.questions ?? [];
      const init: Record<number, string | string[]> = {};
      qs.forEach(q => { init[q.id] = q.multiSelect ? [] : ''; });
      setQuestions(qs);
      setAnswers(init);
      router.push('/questions');
    } catch (e: unknown) {
      setError('Error: ' + (e instanceof Error ? e.message : String(e)));
      setIsLoading(false);
    }
  };

  const Opt = ({ label, icon, k, v }: { label: string; icon?: string; k: keyof typeof intake; v: string }) => (
    <div className={`opt${intake[k] === v ? ' sel' : ''}`} onClick={() => set(k, v)}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span style={{ fontWeight: intake[k] === v ? 500 : 400 }}>{label}</span>
    </div>
  );

  if (!mounted || isLoading) {
    return (
      <>
        {mounted && <Header screen="intake" />}
        <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px' }}>
          <Loading stage="clarify" />
        </div>
        <Footer />
      </>
    );
  }

  const conditional = () => {
    if (intake.userType === 'Student') return (
      <div style={{ marginBottom: 16 }}>
        <span className="lbl">Field of study *</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }} className="two-col">
          {['Arts & Humanities', 'Engineering & CS', 'Science & Research', 'Commerce & Business'].map(f =>
            <Opt key={f} label={f} k="field" v={f} />
          )}
        </div>
      </div>
    );
    if (intake.userType === 'Working Professional') return (
      <div style={{ marginBottom: 16, display: 'grid', gap: 9 }}>
        <div>
          <span className="lbl">Organisation size *</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
            {['Startup (< 200)', 'Mid-size (200–1000)', 'Enterprise (1000+)'].map(o =>
              <div key={o} className={`opt${intake.orgType === o ? ' sel' : ''}`} onClick={() => set('orgType', o)} style={{ justifyContent: 'center' }}>
                <span style={{ fontSize: 12, textAlign: 'center' }}>{o}</span>
              </div>
            )}
          </div>
        </div>
        <select className="inp" value={intake.dept} onChange={e => set('dept', e.target.value)}>
          <option value="">Department *</option>
          {['Operations', 'Marketing', 'Sales', 'HR', 'Product', 'Finance', 'Technology / IT', 'Other'].map(d =>
            <option key={d}>{d}</option>
          )}
        </select>
        <input ref={companyRef} className="inp" placeholder="Company name (optional)" defaultValue={intake.company} />
      </div>
    );
    if (intake.userType === 'CXO / Founder') return (
      <div style={{ marginBottom: 16, display: 'grid', gap: 9 }}>
        <select className="inp" value={intake.role} onChange={e => set('role', e.target.value)}>
          <option value="">Your role *</option>
          {['CEO / Founder / MD', 'CTO / CIO', 'CMO / VP Marketing', 'CFO / VP Finance', 'COO / VP Operations', 'Other C-Suite'].map(r =>
            <option key={r}>{r}</option>
          )}
        </select>
        <select className="inp" value={intake.dept} onChange={e => set('dept', e.target.value)}>
          <option value="">Use case relates to which function? *</option>
          {['Operations', 'Marketing', 'Sales', 'HR', 'Product', 'Finance', 'Technology', 'Other'].map(d =>
            <option key={d}>{d}</option>
          )}
        </select>
        <input ref={companyRef} className="inp" placeholder="Company name (optional)" defaultValue={intake.company} />
      </div>
    );
    return null;
  };

  return (
    <>
      <Header screen="intake" />
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px' }}>
        <div className="fu">
          {/* Resume banner */}
          {showResume && result && (
            <div style={{ background: 'var(--pr-bg)', border: '1px solid var(--bdr)', borderRadius: 'var(--rl)', padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--pr-tx)' }}>You have a saved blueprint</span>
              <div style={{ display: 'flex', gap: 7 }}>
                <button className="btn-p" style={{ width: 'auto', padding: '7px 14px', fontSize: 12 }} onClick={() => router.push('/result')}>Resume →</button>
                <button className="btn-s" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => { reset(); setShowResume(false); }}>Dismiss</button>
              </div>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--txt)', marginBottom: 8, lineHeight: 1.2 }}>
              Design your <span style={{ color: 'var(--pr)' }}>AI workflow</span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--txt2)', lineHeight: 1.6 }}>
              Tell us what you want to automate. Get a step-by-step blueprint with the right tools, platforms, and cost in ₹ — in under 60 seconds.
            </p>
          </div>

          {error && <div style={{ background: 'var(--er-bg)', border: '1px solid var(--er)', borderRadius: 'var(--r)', padding: '10px 14px', marginBottom: 14, fontSize: 13, color: 'var(--er-tx)' }}>{error}</div>}

          {/* User type */}
          <div style={{ marginBottom: 16 }}>
            <span className="lbl">1. Who are you? *</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }} className="two-col">
              {[['Student','🎓'],['Working Professional','💼'],['CXO / Founder','👔'],['Builder / Tinkerer','🔧'],['Other','🙋']].map(([lb,ic]) =>
                <Opt key={lb} label={lb} icon={ic} k="userType" v={lb} />
              )}
            </div>
          </div>

          {conditional()}

          {/* Use case */}
          <div style={{ marginBottom: 16 }}>
            <span className="lbl">2. Describe your use case *</span>
            <textarea
              ref={useCaseRef}
              className="inp"
              rows={4}
              style={{ resize: 'vertical' }}
              placeholder="e.g. I want to automatically research companies before my sales calls, pull their latest news and LinkedIn activity, and send myself a briefing 30 minutes before each meeting."
              defaultValue={intake.useCase}
            />
            <p style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 5 }}>2–3 sentences gives the best recommendation</p>
          </div>

          {/* Intent */}
          <div style={{ marginBottom: 16 }}>
            <span className="lbl">3. How will you use this? *</span>
            <div style={{ display: 'flex', gap: 7 }}>
              {[['Personal / Learning','🧪'],['Production Use','🏭']].map(([lb,ic]) =>
                <div key={lb} className={`opt${intake.usageIntent === lb ? ' sel' : ''}`} onClick={() => set('usageIntent', lb)} style={{ flex: 1 }}>
                  <span style={{ fontSize: 16 }}>{ic}</span><span>{lb}</span>
                </div>
              )}
            </div>
          </div>

          {/* Execution preference */}
          <div style={{ marginBottom: 24 }}>
            <span className="lbl">4. What kind of solution are you looking for? *</span>
            <div style={{ display: 'grid', gap: 7 }}>
              {EXEC_OPTIONS
                .filter(opt => !opt.restrictTo || opt.restrictTo.includes(intake.userType))
                .map(({ icon, label, desc }) => (
                  <div
                    key={label}
                    className={`opt${intake.execPref === label ? ' sel' : ''}`}
                    onClick={() => set('execPref', label)}
                    style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span style={{ fontWeight: 500 }}>{label}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--txt2)', paddingLeft: 24 }}>{desc}</span>
                  </div>
                ))}
            </div>
          </div>

          <button className="btn-p" onClick={handleSubmit} style={{ padding: 14 }}>
            Analyse my use case →
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
