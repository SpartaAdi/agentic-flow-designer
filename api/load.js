import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string" || id.length > 36) {
    return res.status(400).json({ error: "Missing or invalid id parameter" });
  }

  // UUIDs are hex digits and hyphens only
  if (!/^[0-9a-f-]+$/i.test(id)) {
    return res.status(400).json({ error: "Invalid id format" });
  }

  try {
    const raw = await redis.get(`bp:${id}`);
    if (!raw) {
      return res.status(404).json({ error: "Blueprint not found or expired" });
    }
    const payload = typeof raw === "string" ? JSON.parse(raw) : raw;
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Redis load error:", err);
    return res.status(500).json({ error: "Failed to load blueprint", detail: err.message });
  }
}
