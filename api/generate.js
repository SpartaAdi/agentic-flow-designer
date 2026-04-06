export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const { system, user, model = "gemini-2.5-flash" } = req.body;

  if (!user) {
    return res.status(400).json({ error: "Missing user message" });
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const geminiBody = {
    contents: [
      {
        role: "user",
        parts: [{ text: user }]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 16384,
      responseMimeType: "application/json"
    }
  };

  if (system) {
    geminiBody.systemInstruction = {
      parts: [{ text: system }]
    };
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(response.status).json({ error: "Gemini API error", detail: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return res.status(200).json({ text });
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Internal server error", detail: err.message });
  }
}
