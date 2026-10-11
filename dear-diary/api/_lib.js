// Shared server helpers. Files starting with "_" are not deployed as endpoints.
import crypto from "crypto";

export const ADMIN_EMAIL = "halliegracehm@gmail.com";
const RC_PUBLIC_KEY = "appl_fzxjgNhvORlWaNPqmUTHtIaVytR";

const DEFAULT_SUPABASE_URL = "https://xwhpyslvwnnbvyydimmg.supabase.co"; // public project URL

function serviceKey() {
  const env = process.env;
  const named = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE;
  if (named) return named;
  // Otherwise use any SUPABASE_* variable whose name mentions SERVICE or SECRET
  const k = Object.keys(env).find((n) => /^SUPABASE/i.test(n) && /(SERVICE|SECRET)/i.test(n) && env[n]);
  return k ? env[k] : "";
}

export function config() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = serviceKey();
  return url && key ? { url: url.replace(/\/$/, ""), key } : null;
}

// Signing key for session tokens. SESSION_SECRET if set, otherwise derived from the service key.
function signingKey() {
  const base = process.env.SESSION_SECRET || serviceKey();
  return crypto.createHmac("sha256", base).update("myinnermind-session-v1").digest();
}

const b64u = (buf) => Buffer.from(buf).toString("base64url");

export function signToken(email) {
  const payload = b64u(JSON.stringify({ e: email, iat: Date.now() }));
  const sig = b64u(crypto.createHmac("sha256", signingKey()).update(payload).digest());
  return `${payload}.${sig}`;
}

const TOKEN_MAX_AGE = 180 * 24 * 60 * 60 * 1000; // 180 days

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expected = b64u(crypto.createHmac("sha256", signingKey()).update(payload).digest());
  const a = Buffer.from(sig || ""), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.e || Date.now() - data.iat > TOKEN_MAX_AGE) return null;
    return data.e;
  } catch { return null; }
}

export function sessionEmail(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || "";
  return verifyToken(h.replace(/^Bearer\s+/i, ""));
}

// ── Passwords ──
// The old app used a 32-bit string hash. We still accept it once, then upgrade to scrypt.
export function legacyHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return String(h);
}

export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pw, salt, 32);
  return `s1$${b64u(salt)}$${b64u(hash)}`;
}

export function checkPassword(pw, stored) {
  if (!stored || typeof pw !== "string") return { ok: false };
  if (stored.startsWith("s1$")) {
    const [, salt, hash] = stored.split("$");
    const test = crypto.scryptSync(pw, Buffer.from(salt, "base64url"), 32);
    const want = Buffer.from(hash, "base64url");
    return { ok: test.length === want.length && crypto.timingSafeEqual(test, want), upgrade: false };
  }
  return { ok: legacyHash(pw) === stored, upgrade: true };
}

// ── Supabase (service role, server only) ──
export async function sb(path, { method = "GET", body, prefer } = {}) {
  const c = config();
  const res = await fetch(`${c.url}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: c.key,
      // Legacy service_role keys are JWTs and go in both headers; new sb_secret_ keys go in apikey only
      ...(c.key.startsWith("eyJ") ? { Authorization: `Bearer ${c.key}` } : {}),
      "Content-Type": "application/json",
      Prefer: prefer || "return=representation",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

export async function getUser(email) {
  const r = await sb(`users?email=eq.${encodeURIComponent(email)}`);
  return Array.isArray(r.data) ? r.data[0] || null : null;
}

// What the app is allowed to see about a user
export function publicUser(u) {
  if (!u) return null;
  const { password_hash, reset_code, reset_expiry, ...rest } = u;
  return rest;
}

// Stable, non-reversible id for showing other members without exposing their email
export function opaqueId(email) {
  if (!email || email === "anonymous") return email;
  return "m_" + crypto.createHmac("sha256", signingKey()).update("member:" + email).digest("base64url").slice(0, 16);
}

export async function revenueCatPlan(email) {
  try {
    const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(email)}`, {
      headers: { Authorization: `Bearer ${RC_PUBLIC_KEY}`, "Content-Type": "application/json", "X-Platform": "ios" },
    });
    if (!r.ok) return null;
    const d = await r.json();
    const s = d?.subscriber?.subscriptions || {};
    const now = new Date();
    const active = (k) => s[k]?.expires_date && new Date(s[k].expires_date) > now;
    if (Object.keys(s).some((k) => k.includes("offtherecord") && active(k))) return "offtherecord";
    if (Object.keys(s).some((k) => k.includes("community") && active(k))) return "community";
    return "free";
  } catch { return null; }
}

export function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch { return {}; }
}
