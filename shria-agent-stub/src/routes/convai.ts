import type { Request, Response } from "express";
import express from "express";

export const convaiRouter = express.Router();

convaiRouter.get("/signed-url", async (req: Request, res: Response) => {
  try {
    const origin = (req.headers.origin as string) || "";

    const allowlist = (process.env.CORS_ALLOWLIST || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (allowlist.length && !allowlist.includes(origin)) {
      return res.status(403).json({ ok: false, error: "Origin not allowed" });
    }

    const challenge_day = Number(req.query.challenge_day || 0) || undefined;

    // TODO: replace this block with real token/signing code for your provider
    const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
    const url = `wss://convai.example/ws?token=FAKE_TOKEN&day=${challenge_day ?? ""}`;

    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    else res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Vary", "Origin");

    return res.json({ ok: true, url, expiresAt, challenge_day });
  } catch (err: any) {
    console.error("[convai] signed-url error:", err);
    return res.status(500).json({ ok: false, error: err?.message || "internal" });
  }
});
