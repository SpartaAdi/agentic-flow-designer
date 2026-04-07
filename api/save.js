import { Redis } from "@upstash/redis";
import { randomUUID } from "crypto";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { result, intake } = req.body;

  if (!result || typeof result !== "object") {
    return res.status(400).json({ error: "Missing or invalid result payload" });
  }

  const id = randomUUID();

  // Store only what is needed for the read-only view.
  // TTL: 90 days (7,776,000 seconds). Keeps storage lean.
  const payload = {
    id,
    result,
    // Minimal intake summary — no PII like company name
    intakeSummary: {
      userType: intake?.userType || "",
      usageIntent: intake?.usageIntent || "",
      execPref: intake?.execPref || "",
      useCase: intake?.useCase ? intake.useCase.slice(0, 200) : "",
    },
    createdAt: Date.now(),
  };

  try {
    await redis.set(`bp:${id}`, JSON.stringify(payload), { ex: 7776000 });
    return res.status(200).json({ id, url: `/?id=${id}` });
  } catch (err) {
    console.error("Redis save error:", err);
    return res.status(500).json({ error: "Failed to save blueprint", detail: err.message });
  }
}
