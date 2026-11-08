import express from "express";

// Optional demo adapter. FastAPI owns real signing; this route never mints tokens.
export const convaiRouter = express.Router();
convaiRouter.use((req, res, next) => {
  res.vary("Origin");
  res.setHeader("Cache-Control", "no-store");
  const origin = req.headers.origin;
  const allowed = (process.env.CORS_ALLOWLIST || "https://www.elevatedmovements.com,https://elevatedmovements.com")
    .split(",").map(value => value.trim()).filter(Boolean);
  if (origin && !allowed.includes(origin)) {
    res.status(403).json({ ok: false, error: "Origin not allowed" }); return;
  }
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.sendStatus(204); return; }
  next();
});
convaiRouter.get("/signed-url", async (req, res) => {
  const day = Number(req.query.challenge_day ?? 1);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    res.status(400).json({ ok: false, error: "challenge_day must be an integer from 1 to 7" }); return;
  }
  const backend = process.env.BACKEND_URL?.replace(/\/$/, "");
  if (!backend) {
    res.status(503).json({ ok: false, error: "Configure BACKEND_URL for the FastAPI signing service" }); return;
  }
  try {
    const upstream = await fetch(`${backend}/convai/signed-url?challenge_day=${day}`, { signal: AbortSignal.timeout(25000) });
    if (!upstream.ok) {
      console.error("[convai] upstream failed", { status: upstream.status });
      res.status(upstream.status === 503 ? 503 : 502).json({ ok: false, error: "Voice service unavailable" }); return;
    }
    const data = await upstream.json() as { signed_url?: string };
    if (!data.signed_url?.startsWith("wss://")) throw new Error("Invalid upstream response");
    res.json({ ok: true, signed_url: data.signed_url, url: data.signed_url, challenge_day: day });
  } catch {
    console.error("[convai] signing service request failed");
    res.status(502).json({ ok: false, error: "Voice service unavailable" });
  }
});
