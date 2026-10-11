import crypto from "crypto";
import {
  config, sb, getUser, publicUser, signToken, sessionEmail, hashPassword, checkPassword,
  revenueCatPlan, readBody,
} from "./_lib.js";

const RESET_MAX_ATTEMPTS = 5;

function normEmail(e) { return String(e || "").toLowerCase().trim(); }

async function issue(res, user) {
  return res.status(200).json({ user: publicUser(user), token: signToken(user.email) });
}

async function syncPlan(user) {
  const plan = await revenueCatPlan(user.email);
  if (plan && plan !== "free" && plan !== user.plan) {
    const r = await sb(`users?email=eq.${encodeURIComponent(user.email)}`, { method: "PATCH", body: { plan } });
    if (r.ok && Array.isArray(r.data) && r.data[0]) return r.data[0];
    return { ...user, plan };
  }
  return user;
}

async function sendResetEmail(email, code) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "My Inner Mind <hello@halliewho.com>",
      to: email,
      subject: "Your My Inner Mind reset code 🌿",
      html: `<div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:40px;background:#fffdf8;color:#5a2e0e;"><div style="font-size:36px;margin-bottom:16px;">🌿</div><h1 style="font-size:24px;margin-bottom:8px;">Reset your password</h1><p style="color:#b08060;font-size:15px;line-height:1.6;margin-bottom:24px;">Use the code below to reset your My Inner Mind password. It expires in 15 minutes.</p><div style="background:#f5e8d3;border-radius:12px;padding:24px;text-align:center;font-size:32px;font-weight:bold;letter-spacing:8px;color:#7a4a1e;margin-bottom:24px;">${code}</div><p style="color:#b08060;font-size:13px;">If you didn't request this, you can safely ignore this email.</p><p style="color:#c8895a;font-size:13px;margin-top:24px;">With love, Hallie 🌿</p></div>`,
    }),
  });
  return r.ok;
}

// reset_code is stored as "<code>|<wrong attempts>"
function parseReset(u) {
  const [code, attempts] = String(u?.reset_code || "").split("|");
  return { code, attempts: Number(attempts) || 0, expiry: Number(u?.reset_expiry) || 0 };
}

async function checkResetCode(email, code) {
  const u = await getUser(email);
  if (!u) return { error: "Something went wrong." };
  const r = parseReset(u);
  if (!r.code) return { error: "Please request a new code." };
  if (Date.now() > r.expiry) return { error: "That code has expired. Please request a new one." };
  if (r.attempts >= RESET_MAX_ATTEMPTS) return { error: "Too many tries. Please request a new code." };
  if (String(code || "") !== r.code) {
    await sb(`users?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: { reset_code: `${r.code}|${r.attempts + 1}` } });
    return { error: "That code is incorrect." };
  }
  return { user: u };
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ service: "my-inner-mind-auth", configured: !!config() });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!config()) return res.status(503).json({ error: "not_configured" });
  const body = readBody(req);
  const action = body.action;

  try {
    if (action === "register") {
      const email = normEmail(body.email);
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      if (!username || !email || !password) return res.status(400).json({ error: "All fields are required." });
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
      if (await getUser(email)) return res.status(409).json({ error: "An account with that email already exists." });
      const r = await sb("users", { method: "POST", body: { email, username, password_hash: hashPassword(password), plan: "free" } });
      if (!r.ok || !r.data?.[0]) return res.status(500).json({ error: "Something went wrong. Please try again." });
      return issue(res, r.data[0]);
    }

    if (action === "login") {
      const email = normEmail(body.email);
      if (!email || !body.password) return res.status(400).json({ error: "Email and password are required." });
      let user = await getUser(email);
      if (!user) return res.status(404).json({ error: "No account found with that email." });
      const check = checkPassword(String(body.password), user.password_hash);
      if (!check.ok) return res.status(401).json({ error: "Incorrect password." });
      if (check.upgrade) {
        const r = await sb(`users?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: { password_hash: hashPassword(String(body.password)) } });
        if (r.ok && r.data?.[0]) user = r.data[0];
      }
      user = await syncPlan(user);
      return issue(res, user);
    }

    if (action === "reset_send") {
      const email = normEmail(body.email);
      const user = await getUser(email);
      if (!user) return res.status(404).json({ error: "No account found with that email address." });
      const code = String(crypto.randomInt(100000, 1000000));
      await sb(`users?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: { reset_code: `${code}|0`, reset_expiry: Date.now() + 15 * 60 * 1000 } });
      if (!(await sendResetEmail(email, code))) return res.status(500).json({ error: "Couldn't send the email. Please try again." });
      return res.status(200).json({ ok: true });
    }

    if (action === "reset_verify") {
      const r = await checkResetCode(normEmail(body.email), body.code);
      if (r.error) return res.status(400).json({ error: r.error });
      return res.status(200).json({ ok: true });
    }

    if (action === "reset_password") {
      const email = normEmail(body.email);
      const password = String(body.password || "");
      if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
      const r = await checkResetCode(email, body.code);
      if (r.error) return res.status(400).json({ error: r.error });
      await sb(`users?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: { password_hash: hashPassword(password), reset_code: null, reset_expiry: null } });
      return res.status(200).json({ ok: true });
    }

    // Everything below requires a signed-in session
    const email = sessionEmail(req);
    if (!email) return res.status(401).json({ error: "signed_out" });

    if (action === "me") {
      const user = await getUser(email);
      if (!user) return res.status(401).json({ error: "signed_out" });
      return res.status(200).json({ user: publicUser(user) });
    }

    if (action === "sync_plan") {
      const user = await getUser(email);
      if (!user) return res.status(401).json({ error: "signed_out" });
      return res.status(200).json({ user: publicUser(await syncPlan(user)) });
    }

    if (action === "change_password") {
      const user = await getUser(email);
      if (!user) return res.status(401).json({ error: "signed_out" });
      const next = String(body.next || "");
      if (next.length < 6) return res.status(400).json({ error: "New password must be at least 6 characters." });
      if (!checkPassword(String(body.current || ""), user.password_hash).ok) return res.status(401).json({ error: "Current password is incorrect." });
      await sb(`users?email=eq.${encodeURIComponent(email)}`, { method: "PATCH", body: { password_hash: hashPassword(next) } });
      return res.status(200).json({ ok: true });
    }

    if (action === "delete_account") {
      const e = encodeURIComponent(email);
      const del = (path) => sb(path, { method: "DELETE", prefer: "return=minimal" }).catch(() => null);
      await Promise.all([
        del(`entries?user_email=eq.${e}`),
        del(`grove_entries?user_email=eq.${e}`),
        del(`grove_activity_log?user_email=eq.${e}`),
        del(`grove_activity_prefs?user_email=eq.${e}`),
        del(`letters?user_email=eq.${e}`),
        del(`trackers?user_email=eq.${e}`),
        del(`tracker_logs?user_email=eq.${e}`),
        del(`community_posts?user_id=eq.${e}`),
        del(`community_members?user_id=eq.${e}`),
        del(`post_reactions?user_id=eq.${e}`),
        del(`blocked_users?blocker_id=eq.${e}`),
      ]);
      await del(`users?email=eq.${e}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    console.error("auth error", action, err);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

