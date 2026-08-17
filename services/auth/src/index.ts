import cors from "cors";
import express from "express";
import { OAuth2Client } from "google-auth-library";
import { getPrisma } from "@minus1days/db";
import { signAppToken, verifyAppToken } from "@minus1days/shared/dist/cjs/auth";
import { env } from "./env";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = getPrisma();
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

app.get("/health", (_req, res) => res.json({ ok: true, service: "auth" }));

/** Real login: client sends the Google ID token obtained via Google Identity Services on the front end. */
app.post("/auth/google", async (req, res) => {
  const { idToken } = req.body ?? {};
  if (typeof idToken !== "string") return res.status(400).json({ error: "idToken required" });
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) return res.status(401).json({ error: "invalid_google_token" });

    const user = await prisma.user.upsert({
      where: { googleSub: payload.sub },
      update: {
        email: payload.email,
        displayName: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
      },
      create: {
        googleSub: payload.sub,
        email: payload.email,
        displayName: payload.name ?? payload.email,
        avatarUrl: payload.picture ?? null,
        stats: { create: {} },
      },
    });

    const token = signAppToken(
      { userId: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl },
      env.JWT_SECRET
    );
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl } });
  } catch (err) {
    console.error("[auth] google verify failed", err);
    res.status(401).json({ error: "google_verification_failed" });
  }
});

/**
 * Dev-only shortcut so the whole stack can be smoke-tested without real Google OAuth
 * credentials configured. Disabled whenever NODE_ENV=production.
 */
if (process.env.NODE_ENV !== "production") {
  app.post("/auth/dev-login", async (req, res) => {
    const { displayName, email } = req.body ?? {};
    if (typeof displayName !== "string" || displayName.trim().length === 0) {
      return res.status(400).json({ error: "displayName required" });
    }
    const fakeEmail = typeof email === "string" && email.length > 0 ? email : `${displayName.toLowerCase().replace(/\s+/g, ".")}@dev.local`;
    const user = await prisma.user.upsert({
      where: { googleSub: `dev:${fakeEmail}` },
      update: { displayName },
      create: { googleSub: `dev:${fakeEmail}`, email: fakeEmail, displayName, stats: { create: {} } },
    });
    const token = signAppToken(
      { userId: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl },
      env.JWT_SECRET
    );
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, avatarUrl: user.avatarUrl } });
  });
}

app.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "missing_token" });
  try {
    const decoded = verifyAppToken(token, env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, include: { stats: true } });
    if (!user) return res.status(404).json({ error: "user_not_found" });
    res.json({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      stats: user.stats ?? { gamesPlayed: 0, wins: 0, losses: 0 },
    });
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
});

app.listen(env.PORT, () => console.log(`[auth] listening on :${env.PORT}`));
