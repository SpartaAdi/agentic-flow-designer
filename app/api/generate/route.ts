import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
  }

  let body: { system?: string; user?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { system, user, model = 'gemini-2.5-flash' } = body;

  if (!user) {
    return NextResponse.json({ error: 'Missing user message' }, { status: 400 });
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiBody: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 16384,
      responseMimeType: 'application/json',
    },
  };

  if (system) {
    geminiBody.systemInstruction = { parts: [{ text: system }] };
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return NextResponse.json(
        { error: 'Gemini API error', detail: errText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return NextResponse.json({ text });
  } catch (err) {
    console.error('Handler error:', err);
    return NextResponse.json(
      { error: 'Internal server error', detail: (err as Error).message },
      { status: 500 }
    );
  }
}
