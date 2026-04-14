import { Redis } from '@upstash/redis';
import type { BlueprintResult } from '../../../lib/state';
import PermalinkView from './PermalinkView';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function loadBlueprint(id: string): Promise<{ result: BlueprintResult } | null> {
  if (!id || id.length > 36 || !/^[0-9a-f-]+$/i.test(id)) return null;
  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    const raw = await redis.get(`bp:${id}`);
    if (!raw) return null;
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return payload as { result: BlueprintResult };
  } catch {
    return null;
  }
}

export default async function PermalinkPage({ params }: PageProps) {
  const { id } = await params;
  const data = await loadBlueprint(id);

  if (!data?.result) {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>🔍</p>
          <p style={{ color: 'var(--er-tx)', fontSize: 14, marginBottom: 12 }}>Blueprint not found or expired (90-day TTL).</p>
          <a href="/" className="btn-p" style={{ display: 'block', textDecoration: 'none' }}>← Build a new blueprint</a>
        </div>
      </main>
    );
  }

  return <PermalinkView result={data.result} shareId={id} />;
}
