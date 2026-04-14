'use client';
import { useEffect, useState } from 'react';

interface HeaderProps {
  screen: 'intake' | 'questions' | 'result';
  isReadOnly?: boolean;
  hasResult?: boolean;
  shareId?: string | null;
  onSave?: () => void;
  onShare?: () => void;
  saveFlash?: boolean;
  shareFlash?: boolean;
}

export default function Header({
  screen, isReadOnly = false, hasResult = false,
  shareId = null, onSave, onShare,
  saveFlash = false, shareFlash = false,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('blueprint-theme');
    if (stored === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('blueprint-theme', next);
    setIsDark(!isDark);
  };

  const screens: Array<'intake' | 'questions' | 'result'> = ['intake', 'questions', 'result'];
  const ci = screens.indexOf(screen);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--surf)', borderBottom: '1px solid var(--bdr)',
      height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 24px',
      boxShadow: 'var(--sh)',
    }} className="no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#4285F4"/>
          <rect x="6" y="10" width="20" height="3" rx="1.5" fill="white"/>
          <rect x="6" y="16" width="14" height="3" rx="1.5" fill="white" opacity=".85"/>
          <rect x="6" y="22" width="17" height="3" rx="1.5" fill="white" opacity=".65"/>
          <circle cx="27" cy="11.5" r="2.2" fill="white"/>
          <circle cx="21" cy="17.5" r="2.2" fill="white" opacity=".85"/>
          <circle cx="24" cy="23.5" r="2.2" fill="white" opacity=".65"/>
        </svg>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', letterSpacing: '-.02em' }}>Blueprint</span>
        <span style={{ fontSize: 12, color: 'var(--txt3)' }} className="hide-sm">AI Workflow Designer</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasResult && !isReadOnly && (
          <>
            <button className="btn-s" style={{ fontSize: 12, padding: '7px 12px' }} onClick={onSave}>
              {saveFlash ? '✓ Saved' : 'Save'}
            </button>
            <button
              className="btn-s"
              style={{
                fontSize: 12, padding: '7px 12px',
                color: shareFlash ? 'var(--ok-tx)' : 'var(--pr-tx)',
                borderColor: shareFlash ? 'var(--ok)' : 'var(--pr)',
              }}
              onClick={onShare}
            >
              {shareFlash ? '✓ Link copied!' : shareId ? '🔗 Copy link' : '🔗 Share'}
            </button>
          </>
        )}
        {isReadOnly && (
          <span className="pill" style={{ background: 'var(--pr-bg)', color: 'var(--pr-tx)', fontSize: 11, padding: '5px 10px' }}>
            👁 Read-only view
          </span>
        )}
        <button className="btn-s" style={{ fontSize: 12, padding: '7px 12px' }} onClick={toggleTheme}>
          {isDark ? '☀ Light' : '◑ Dark'}
        </button>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {screens.map((sc, i) => (
            <span key={sc} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: sc === screen ? 'var(--pr)' : i < ci ? 'var(--ok)' : 'var(--bdr)',
              }} />
              {i < screens.length - 1 && (
                <div style={{ width: 18, height: 1.5, background: i < ci ? 'var(--ok)' : 'var(--bdr)' }} />
              )}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
