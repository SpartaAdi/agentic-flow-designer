import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id || id.length > 36) {
    return NextResponse.json({ error: 'Missing or invalid id parameter' }, { status: 400 });
  }

  // UUIDs are hex digits and hyphens only
  if (!/^[0-9a-f-]+$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
  }

  try {
    const raw = await redis.get(`bp:${id}`);
    if (!raw) {
      return NextResponse.json({ error: 'Blueprint not found or expired' }, { status: 404 });
    }
    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return NextResponse.json(payload);
  } catch (err) {
    console.error('Redis load error:', err);
    return NextResponse.json(
      { error: 'Failed to load blueprint', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
