'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBlueprintStore } from '../../lib/state';
import { SYSPROMPT } from '../../lib/prompts';
import { fetchBlueprint } from '../../lib/api';
import ResultView from '../../components/ResultView';
import Loading from '../../components/Loading';
import Footer from '../../components/Footer';

export default function ResultPage() {
  const router = useRouter();
  const { result, answers, questions, intake, setResult, setShareId, shareId, reset } = useBlueprintStore();
  const [mounted, setMounted] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [shareFlash, setShareFlash] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  // Guard: no result = go back to intake
  useEffect(() => {
    if (mounted && !result) router.push('/');
  }, [mounted, result, router]);

  const handleRefine = useCallback(async (note: string) => {
    setIsRefining(true);
    setError('');
    try {
      const fmtA: Record<number, string> = {};
      Object.entries(answers).forEach(([k, v]) => {
        fmtA[parseInt(k)] = Array.isArray(v) ? v.join(', ') : v as string;
      });
      const payload = {
        intake, clarifyingAnswers: fmtA, questions,
        refinementNote: note,
        previousAnalysis: { title: result?.title },
      };
      const data = await fetchBlueprint(SYSPROMPT, JSON.stringify(payload));
      setResult(data);
      // Reset shareId — the refined result is a different blueprint
      setShareId('');
    } catch (e: unknown) {
      setError('Error: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsRefining(false);
    }
  }, [answers, questions, intake, result, setResult, setShareId]);

  const handleSave = useCallback(() => {
    // State already persists to localStorage via Zustand persist
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    if (!result) return;
    // If already shared, just copy the URL
    if (shareId) {
      const url = `${location.origin}/result/${shareId}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareFlash(true);
      setTimeout(() => setShareFlash(false), 2500);
      return;
    }
    setIsRefining(true); // reuse loading for share
    try {
      const r = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, intake }),
      });
      if (!r.ok) throw new Error(`Save failed: ${r.status}`);
      const { id } = await r.json() as { id: string };
      const url = `${location.origin}/result/${id}`;
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareId(id);
      history.replaceState(null, '', `/result/${id}`);
      setShareFlash(true);
      setTimeout(() => setShareFlash(false), 2500);
    } catch (e: unknown) {
      setError('Share failed: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsRefining(false);
    }
  }, [result, intake, shareId, setShareId]);

  if (!mounted || !result) return null;

  if (isRefining) {
    return (
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '28px 20px' }}>
        <Loading stage="generate" />
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{ background: 'var(--er-bg)', border: '1px solid var(--er)', borderRadius: 'var(--r)', padding: '10px 14px', margin: '14px 20px', fontSize: 13, color: 'var(--er-tx)' }}>
          {error}
          <button style={{ marginLeft: 8, fontSize: 12, color: 'var(--er-tx)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setError('')}>✕</button>
        </div>
      )}
      <ResultView
        result={result}
        answers={answers}
        questions={questions}
        isReadOnly={false}
        shareId={shareId}
        onRefine={handleRefine}
        onReset={() => { reset(); router.push('/'); }}
        onSave={handleSave}
        onShare={handleShare}
        saveFlash={saveFlash}
        shareFlash={shareFlash}
      />
    </>
  );
}
