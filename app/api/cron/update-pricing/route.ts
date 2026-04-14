import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import pricingData from '../../../../lib/pricing-data.json';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Vercel Cron jobs call this endpoint on a schedule defined in vercel.json.
// It reads the curated pricing-data.json and writes a timestamped snapshot to Redis.
// When prices change (quarterly), update pricing-data.json and the cron propagates it.
//
// Security: Vercel automatically attaches Authorization: Bearer <CRON_SECRET>
// when invoking crons. We verify it to block direct unauthenticated hits.

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = {
      models: pricingData.models,
      exchangeRate: pricingData.exchangeRate,
      updatedAt: Date.now(),
      source: 'cron',
    };

    // TTL: 7 days (604800s). Cron runs daily so this is a safe safety net.
    await redis.set('pricing:live', JSON.stringify(payload), { ex: 604800 });

    return NextResponse.json({
      ok: true,
      message: 'Pricing refreshed',
      updatedAt: new Date(payload.updatedAt).toISOString(),
      models: Object.keys(payload.models).length,
    });
  } catch (err) {
    console.error('[cron/update-pricing] Redis error:', err);
    return NextResponse.json(
      { error: 'Failed to update pricing', detail: String(err) },
      { status: 500 }
    );
  }
}
