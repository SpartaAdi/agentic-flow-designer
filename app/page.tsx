'use client';

// ── Week 3 TODO: Convert intake screen from index.html to React ────────
// This placeholder confirms Next.js routing is working.
// The full intake UI (user type selector, conditional fields, uxOptimize
// toggle, exec pref) will be built here in Week 3.

export default function IntakePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>🔷</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Blueprint</h1>
        <p style={{ color: 'var(--txt2)', fontSize: 14, marginBottom: 20 }}>
          Next.js migration in progress · Weeks 1–2 scaffold deployed
        </p>
        <p style={{ color: 'var(--txt3)', fontSize: 12, marginBottom: 20 }}>
          API routes ✅ · CSS extracted ✅ · Zustand state ✅
          <br />
          Intake screen conversion → Week 3
        </p>
        <a
          href="https://agentic-flow-designer.vercel.app"
          className="btn-p"
          style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          → Use live app
        </a>
      </div>
      <p style={{ color: 'var(--txt3)', fontSize: 11 }}>
        Blueprint · AI Workflow Designer · Built by Aditya · AI Upskilling Sprint · April 2026
      </p>
    </main>
  );
}
