import { Redis } from '@upstash/redis';

// ── Week 4 TODO: Convert full result screen ───────────────────────────
// Components to build: FlowChart.tsx, CostBreakdown.tsx, TabBar.tsx,
// RefinementBox.tsx, UxBadge.tsx.
// This shell already handles SSR Redis loading for read-only permalinks.

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadBlueprint(id: string) {
  // Validate id format (same logic as /api/load)
  if (!id || id.length > 36 || !/^[0-9a-f-]+$/i.test(id)) return null;

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  try {
    const raw = await redis.get(`bp:${id}`);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadBlueprint(id);

  if (!data) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <p style={{ color: 'var(--er-tx)', fontSize: 14 }}>
            Blueprint not found or expired (90-day TTL).
          </p>
          <a
            href="/"
            className="btn-p"
            style={{ display: 'block', marginTop: 16, textDecoration: 'none' }}
          >
            ← Build a new blueprint
          </a>
        </div>
      </main>
    );
  }

  // Full result UI is built in Week 4.
  // For now: confirm SSR load is working.
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 28, marginBottom: 8 }}>✅</p>
        <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Blueprint loaded (read-only)
        </h1>
        <p style={{ color: 'var(--txt2)', fontSize: 13, marginBottom: 8 }}>
          ID: <code style={{ fontSize: 11 }}>{id}</code>
        </p>
        <p style={{ color: 'var(--txt2)', fontSize: 13 }}>
          Platform: <strong>{data?.result?.platform ?? '—'}</strong>
        </p>
        <p style={{ color: 'var(--txt3)', fontSize: 12, marginTop: 16 }}>
          Full result UI → Week 4 conversion
        </p>
        <a
          href="/"
          className="btn-s"
          style={{ display: 'block', marginTop: 16, textDecoration: 'none' }}
        >
          ← Build your own
        </a>
      </div>
    </main>
  );
}
