import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface SaveBody {
  result?: unknown;
  intake?: {
    userType?: string;
    usageIntent?: string;
    execPref?: string;
    useCase?: string;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  let body: SaveBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { result, intake } = body;

  if (!result || typeof result !== 'object') {
    return NextResponse.json({ error: 'Missing or invalid result payload' }, { status: 400 });
  }

  const id = randomUUID();

  // Store only what is needed for the read-only view.
  // TTL: 90 days (7,776,000 seconds). Keeps storage lean.
  const payload = {
    id,
    result,
    // Minimal intake summary — no PII like company name
    intakeSummary: {
      userType: intake?.userType ?? '',
      usageIntent: intake?.usageIntent ?? '',
      execPref: intake?.execPref ?? '',
      useCase: intake?.useCase ? String(intake.useCase).slice(0, 200) : '',
    },
    createdAt: Date.now(),
  };

  try {
    await redis.set(`bp:${id}`, JSON.stringify(payload), { ex: 7776000 });
    // Next.js routing: result is at /result/[id]
    return NextResponse.json({ id, url: `/result/${id}` });
  } catch (err) {
    console.error('Redis save error:', err);
    return NextResponse.json(
      { error: 'Failed to save blueprint', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
