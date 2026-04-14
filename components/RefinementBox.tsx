'use client';
import { useState } from 'react';

interface RefinementBoxProps {
  onRefine: (note: string) => void;
  onReset: () => void;
}

export default function RefinementBox({ onRefine, onReset }: RefinementBoxProps) {
  const [note, setNote] = useState('');

  return (
    <div className="card no-print" id="refinement-section" style={{ border: '1px solid var(--bdr2)' }}>
      <span className="lbl" style={{ color: 'var(--pr-tx)' }}>🔁 Refine your blueprint</span>
      <p style={{ fontSize: 13, color: 'var(--txt2)', marginBottom: 10, lineHeight: 1.45 }}>
        Add new context, correct something, or change your requirements — the entire blueprint will be regenerated.
      </p>
      <textarea
        id="refineArea"
        className="inp"
        rows={3}
        style={{ resize: 'vertical', marginBottom: 10 }}
        placeholder="e.g. I forgot to mention I use HubSpot as my CRM. Also, my company won't allow connecting Slack to external AI tools."
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn-p"
          disabled={!note.trim()}
          onClick={() => onRefine(note)}
          style={{ flex: 1 }}
        >
          Re-analyse with update →
        </button>
        <button className="btn-s" onClick={onReset}>↺ Start over</button>
      </div>
    </div>
  );
}
