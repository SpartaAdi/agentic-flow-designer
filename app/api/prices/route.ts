import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import pricingData from '../../../lib/pricing-data.json';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const MAX_AGE_MS = 48 * 60 * 60 * 1000; // 48 hours

export interface LivePricingResponse {
  models: Record<string, { in: number; out: number; cliff: number | null; note: string }>;
  exchangeRate: number;
  updatedAt: number;    // Unix ms
  source: 'live' | 'fallback';
}

export async function GET() {
  try {
    const raw = await redis.get('pricing:live');

    if (raw) {
      const cached = typeof raw === 'string' ? JSON.parse(raw) : raw as LivePricingResponse;
      const ageMs = Date.now() - cached.updatedAt;

      if (ageMs <= MAX_AGE_MS) {
        return NextResponse.json({ ...cached, source: 'live' } as LivePricingResponse, {
          headers: { 'Cache-Control': 'public, s-maxage=3600' },
        });
      }
    }
  } catch (err) {
    // Redis miss or parse error — fall through to curated fallback
    console.warn('[api/prices] Redis read failed, using fallback:', err);
  }

  // Fallback: return curated pricing-data.json with a synthetic timestamp
  // (the date string from the file is the last manual update date)
  const fallbackMs = new Date(pricingData.updatedAt).getTime();
  return NextResponse.json({
    models: pricingData.models,
    exchangeRate: pricingData.exchangeRate,
    updatedAt: fallbackMs,
    source: 'fallback',
  } as LivePricingResponse, {
    headers: { 'Cache-Control': 'public, s-maxage=3600' },
  });
}
