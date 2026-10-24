// My Inner Circle: private circles for friends and family.
// Only members of a circle can see or post in it. Anyone signed in can join with an invite code;
// creating a circle needs a Community or Off the Record plan (Hallie can always create).
import crypto from "crypto";
import { config, sb, sessionEmail, opaqueId, readBody, ADMIN_EMAIL } from "./_lib.js";

const MAX_MEMBERS = 20;
const MAX_OWNED = 5;
const MAX_POST = 2000;
const BANNED = ["fuck", "shit", "bitch", "cunt", "nigger", "faggot"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L

const enc = encodeURIComponent;
const list = (r) => (Array.isArray(r.data) ? r.data : []);
const clean = (s, max) => String(s || "").replace(/\s+/g, " ").trim().slice(0, max);
const hasBanned = (s) => BANNED.some((w) => new RegExp(`\\b${w}`, "i").test(s));

// ── This week's challenge and question ──
// Everyone gets the same ones. They change every Sunday (Central time), so nobody has to set them.
const CHALLENGES = [
  "Take a 20-minute walk three times this week.",
  "Put your phone away during one meal every day.",
  "Text someone you've been missing and tell them why.",
  "Drink a full glass of water before your coffee each morning.",
  "Set it down: write one worry on paper, then throw the paper away.",
  "Go to bed 30 minutes earlier on two nights this week.",
  "Spend 10 minutes outside without your phone.",
  "Write down three things you're grateful for before bed, three nights this week.",
  "Do one kind thing for someone without telling them.",
  "Clear one small space: a drawer, a counter, or your car.",
  "Say no to one thing that drains you.",
  "Stretch for 5 minutes every morning.",
  "Eat one meal slowly, with no screens.",
  "Try something new: a recipe, a trail, or a song.",
  "Write a short letter to your younger self.",
  "Give yourself one full hour of rest with no guilt.",
];
const QUESTIONS = [
  "What's one thing you're putting down this week, and one thing you want to make room for?",
  "What's something small that made you smile recently?",
  "Who showed up for you when you needed it, and how?",
  "What does rest actually look like for you?",
  "What's a memory that still makes you laugh?",
  "What's one thing you wish people asked you about?",
  "What are you proud of that nobody sees?",
  "When do you feel most like yourself?",
  "What's something you're learning right now?",
  "What would you tell yourself from a year ago?",
  "What's a boundary you're working on?",
  "What's been heavy lately?",
  "What's a tradition you want to keep, or start?",
  "What does a perfect ordinary day look like for you?",
  "What are you looking forward to?",
  "What's one thing you need from the people who love you?",
];
const NOTE_MAX = 200;

export function weekInfo(now = new Date()) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay()); // back to Sunday
  const key = d.toISOString().slice(0, 10);
  const n = Math.round((d - new Date("2026-10-18T00:00:00Z")) / (7 * 864e5));
  const pick = (arr) => arr[((n % arr.length) + arr.length) % arr.length];
  return { key, challenge: pick(CHALLENGES), question: pick(QUESTIONS) };
}

function newCode() {
  const b = crypto.randomBytes(6);
  return Array.from(b, (x) => CODE_CHARS[x % CODE_CHARS.length]).join("");
}

async function me(email) {
  const r = await sb(`users?email=eq.${enc(email)}&select=username,plan`);
  const u = list(r)[0] || {};
  return { name: u.username || email.split("@")[0], plan: u.plan || "free" };
}

async function membership(circleId, email) {
  if (!UUID.test(String(circleId || ""))) return null;
  const r = await sb(`circle_members?circle_id=eq.${circleId}&user_email=eq.${enc(email)}&select=role`);
  return list(r)[0] || null;
}

async function circleFor(postId) {
  if (!UUID.test(String(postId || ""))) return null;
  return list(await sb(`circle_posts?id=eq.${postId}&select=id,circle_id,user_email,content`))[0] || null;
}

function publicCircle(c, role, count) {
  return {
    id: c.id, name: c.name, emoji: c.emoji, prompt: c.prompt, created_at: c.created_at,
    role, member_count: count,
    invite_code: role === "owner" ? c.invite_code : undefined,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!config()) return res.status(503).json({ error: "not_configured" });
  const email = sessionEmail(req);
  if (!email) return res.status(401).json({ error: "signed_out" });
  const isAdmin = email === ADMIN_EMAIL;
  const body = readBody(req);
  const { action } = body;
  const fail = (status, error) => res.status(status).json({ error });

  try {
    // ── My circles ──
    if (action === "mine") {
      const mine = list(await sb(`circle_members?user_email=eq.${enc(email)}&select=circle_id,role`));
      const profile = await me(email);
      const canCreate = isAdmin || profile.plan === "community" || profile.plan === "offtherecord";
      if (!mine.length) return res.status(200).json({ circles: [], can_create: canCreate });
      const ids = mine.map((m) => m.circle_id).join(",");
      const [cs, ms, ns] = await Promise.all([
        sb(`circles?id=in.(${ids})&order=created_at.asc`),
        sb(`circle_members?circle_id=in.(${ids})&select=circle_id`),
        sb(`circle_notes?to_email=eq.${enc(email)}&seen=eq.false&select=circle_id`),
      ]);
      const counts = {};
      list(ms).forEach((m) => { counts[m.circle_id] = (counts[m.circle_id] || 0) + 1; });
      const unread = {};
      list(ns).forEach((n) => { unread[n.circle_id] = (unread[n.circle_id] || 0) + 1; });
      const roles = Object.fromEntries(mine.map((m) => [m.circle_id, m.role]));
      return res.status(200).json({
        circles: list(cs).map((c) => ({ ...publicCircle(c, roles[c.id], counts[c.id] || 1), new_notes: unread[c.id] || 0 })),
        can_create: canCreate,
      });
    }

    // ── Start a circle ──
    if (action === "create") {
      const profile = await me(email);
      if (!(isAdmin || profile.plan === "community" || profile.plan === "offtherecord")) return fail(403, "needs_plan");
      const name = clean(body.name, 40);
      if (!name) return fail(400, "Give your circle a name.");
      if (hasBanned(name)) return fail(400, "Please choose a different name.");
      const owned = list(await sb(`circles?owner_email=eq.${enc(email)}&select=id`));
      if (owned.length >= MAX_OWNED && !isAdmin) return fail(400, `You can start up to ${MAX_OWNED} circles.`);
      let made = null;
      for (let i = 0; i < 5 && !made; i++) {
        const r = await sb("circles", { method: "POST", body: { name, emoji: clean(body.emoji, 8) || "🌿", owner_email: email, invite_code: newCode(), prompt: clean(body.prompt, 280) || null } });
        if (r.ok) made = list(r)[0];
      }
      if (!made) return fail(500, "Couldn't create the circle. Please try again.");
      await sb("circle_members", { method: "POST", body: { circle_id: made.id, user_email: email, display_name: profile.name, role: "owner" } });
      return res.status(200).json({ circle: publicCircle(made, "owner", 1) });
    }

    // ── Join with an invite code ──
    if (action === "join") {
      const code = String(body.code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length !== 6) return fail(400, "Invite codes are 6 letters and numbers.");
      const c = list(await sb(`circles?invite_code=eq.${code}`))[0];
      if (!c) return fail(404, "That code didn't match a circle. Check it and try again.");
      const already = await membership(c.id, email);
      const count = list(await sb(`circle_members?circle_id=eq.${c.id}&select=id`)).length;
      if (!already) {
        if (count >= MAX_MEMBERS) return fail(400, "This circle is full.");
        const profile = await me(email);
        await sb("circle_members", { method: "POST", body: { circle_id: c.id, user_email: email, display_name: profile.name, role: "member" } });
      }
      return res.status(200).json({ circle: publicCircle(c, already?.role || "member", already ? count : count + 1) });
    }

    // Everything below needs a circle (or a post in one) that this person belongs to
    let circleId = body.circle_id;
    let post = null;
    if (["delete_post", "react", "report"].includes(action)) {
      post = await circleFor(body.post_id);
      if (!post) return fail(404, "not_found");
      circleId = post.circle_id;
    }
    const mem = await membership(circleId, email);
    if (!mem && !(isAdmin && action === "delete_post")) return fail(403, "not_a_member");
    const isOwner = mem?.role === "owner";

    // ── Open a circle: details, members, this week, notes and posts ──
    if (action === "open") {
      const week = weekInfo();
      const [c, ms, ps, blocks, cks, ns] = await Promise.all([
        sb(`circles?id=eq.${circleId}`),
        sb(`circle_members?circle_id=eq.${circleId}&order=joined_at.asc&select=user_email,display_name,role`),
        sb(`circle_posts?circle_id=eq.${circleId}&order=created_at.desc&limit=100`),
        sb(`blocked_users?blocker_id=eq.${enc(email)}&select=blocked_id`),
        sb(`circle_checkins?circle_id=eq.${circleId}&week_key=eq.${week.key}&select=user_email`),
        sb(`circle_notes?circle_id=eq.${circleId}&to_email=eq.${enc(email)}&order=created_at.desc&limit=30`),
      ]);
      const blocked = new Set(list(blocks).map((b) => b.blocked_id));
      const isBlocked = (e) => e !== email && (blocked.has(e) || blocked.has(opaqueId(e)));
      const posts = list(ps).filter((p) => !isBlocked(p.user_email));
      const reacts = posts.length ? list(await sb(`circle_reactions?post_id=in.(${posts.map((p) => p.id).join(",")})&select=post_id,user_email`)) : [];
      const members = list(ms);
      const memberEmails = new Set(members.map((m) => m.user_email));
      const done = new Set(list(cks).map((x) => x.user_email).filter((e) => memberEmails.has(e)));
      const answered = new Set(list(ps).filter((p) => p.prompt === week.question && p.created_at >= week.key && memberEmails.has(p.user_email)).map((p) => p.user_email));
      const notes = list(ns).filter((n) => !isBlocked(n.from_email));
      const unseen = notes.filter((n) => !n.seen).map((n) => n.id);
      if (unseen.length) await sb(`circle_notes?id=in.(${unseen.join(",")})`, { method: "PATCH", body: { seen: true }, prefer: "return=minimal" });
      return res.status(200).json({
        circle: publicCircle(list(c)[0] || {}, mem.role, members.length),
        week: { challenge: week.challenge, question: week.question, i_did_it: done.has(email), answered: answered.has(email), answered_count: answered.size },
        members: members.map((m) => ({ key: opaqueId(m.user_email), name: m.display_name, role: m.role, me: m.user_email === email, did_challenge: done.has(m.user_email), answered: answered.has(m.user_email) })),
        notes: notes.map((n) => ({ id: n.id, from: n.from_name, message: n.message, created_at: n.created_at, new: !n.seen })),
        posts: posts.map((p) => {
          const rs = reacts.filter((r) => r.post_id === p.id);
          return {
            id: p.id, name: p.display_name, content: p.content, prompt: p.prompt, kind: p.kind || "post", created_at: p.created_at,
            author: opaqueId(p.user_email), mine: p.user_email === email,
            hearts: rs.length, hearted: rs.some((r) => r.user_email === email),
          };
        }),
      });
    }

    // ── This week's challenge: I did it (tap again to undo) ──
    if (action === "checkin") {
      const week = weekInfo();
      const where = `circle_checkins?circle_id=eq.${circleId}&user_email=eq.${enc(email)}&week_key=eq.${week.key}`;
      const existing = list(await sb(where));
      if (existing.length) await sb(where, { method: "DELETE", prefer: "return=minimal" });
      else {
        const r = await sb("circle_checkins", { method: "POST", body: { circle_id: circleId, user_email: email, week_key: week.key }, prefer: "return=minimal" });
        if (!r.ok) return fail(500, "Couldn't save that. Please try again.");
      }
      return res.status(200).json({ did_it: !existing.length });
    }

    // ── Send an affirmation to one person in the circle ──
    if (action === "send_note") {
      const message = clean(body.message, NOTE_MAX);
      if (!message) return fail(400, "Write a note first.");
      if (hasBanned(message)) return fail(400, "Please choose different wording.");
      const ms = list(await sb(`circle_members?circle_id=eq.${circleId}&select=user_email`));
      const to = ms.find((m) => opaqueId(m.user_email) === body.to);
      if (!to || to.user_email === email) return fail(400, "Pick someone in your circle.");
      const profile = await me(email);
      const r = await sb("circle_notes", { method: "POST", body: { circle_id: circleId, from_email: email, from_name: profile.name, to_email: to.user_email, message }, prefer: "return=minimal" });
      if (!r.ok) return fail(500, "Couldn't send that. Please try again.");
      return res.status(200).json({ ok: true });
    }

    // ── Share something ──
    if (action === "post") {
      const content = String(body.content || "").trim().slice(0, MAX_POST);
      if (!content) return fail(400, "Write something first.");
      if (hasBanned(content)) return fail(400, "Your post has language that isn't allowed here. Please revise and try again. 🌿");
      const profile = await me(email);
      const kind = body.kind === "grove" ? "grove" : "post";
      const row = { circle_id: circleId, user_email: email, display_name: profile.name, content, prompt: body.answer ? weekInfo().question : null };
      if (kind !== "post") row.kind = kind; // plain posts work even before the kind column exists
      const r = await sb("circle_posts", { method: "POST", body: row });
      const p = list(r)[0];
      if (!p) return fail(500, "Couldn't share that. Please try again.");
      return res.status(200).json({ post: { id: p.id, name: p.display_name, content: p.content, prompt: p.prompt, kind, created_at: p.created_at, author: opaqueId(email), mine: true, hearts: 0, hearted: false } });
    }

    if (action === "delete_post") {
      if (!(post.user_email === email || isOwner || isAdmin)) return fail(403, "forbidden");
      await sb(`circle_posts?id=eq.${post.id}`, { method: "DELETE", prefer: "return=minimal" });
      return res.status(200).json({ ok: true });
    }

    // ── 💛 toggle ──
    if (action === "react") {
      const existing = list(await sb(`circle_reactions?post_id=eq.${post.id}&user_email=eq.${enc(email)}`));
      if (existing.length) await sb(`circle_reactions?post_id=eq.${post.id}&user_email=eq.${enc(email)}`, { method: "DELETE", prefer: "return=minimal" });
      else await sb("circle_reactions", { method: "POST", body: { post_id: post.id, user_email: email }, prefer: "return=minimal" });
      return res.status(200).json({ hearted: !existing.length });
    }

    if (action === "report") {
      await sb("circle_reports", { method: "POST", body: { circle_id: circleId, post_id: post.id, reporter_email: email, reported_email: post.user_email, content: post.content.slice(0, 1000) }, prefer: "return=minimal" });
      if (process.env.RESEND_API_KEY) {
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from: "My Inner Mind <hello@halliewho.com>", to: ADMIN_EMAIL, subject: "A circle post was reported", text: `Reported by ${email}\nPosted by ${post.user_email}\n\n${post.content.slice(0, 1000)}` }),
        }).catch(() => null);
      }
      return res.status(200).json({ ok: true });
    }

    // ── Owner tools ──
    if (action === "set_prompt") {
      if (!isOwner) return fail(403, "owner_only");
      const prompt = clean(body.prompt, 280) || null;
      if (prompt && hasBanned(prompt)) return fail(400, "Please choose different wording.");
      await sb(`circles?id=eq.${circleId}`, { method: "PATCH", body: { prompt }, prefer: "return=minimal" });
      return res.status(200).json({ prompt });
    }

    if (action === "new_code") {
      if (!isOwner) return fail(403, "owner_only");
      for (let i = 0; i < 5; i++) {
        const code = newCode();
        const r = await sb(`circles?id=eq.${circleId}`, { method: "PATCH", body: { invite_code: code }, prefer: "return=minimal" });
        if (r.ok) return res.status(200).json({ invite_code: code });
      }
      return fail(500, "Couldn't make a new code. Please try again.");
    }

    if (action === "remove_member") {
      if (!isOwner) return fail(403, "owner_only");
      const ms = list(await sb(`circle_members?circle_id=eq.${circleId}&select=user_email,role`));
      const target = ms.find((m) => opaqueId(m.user_email) === body.member);
      if (!target || target.role === "owner") return fail(400, "Can't remove that person.");
      await sb(`circle_members?circle_id=eq.${circleId}&user_email=eq.${enc(target.user_email)}`, { method: "DELETE", prefer: "return=minimal" });
      return res.status(200).json({ ok: true });
    }

    if (action === "leave") {
      if (isOwner) return fail(400, "You started this circle. You can delete it instead.");
      await sb(`circle_members?circle_id=eq.${circleId}&user_email=eq.${enc(email)}`, { method: "DELETE", prefer: "return=minimal" });
      return res.status(200).json({ ok: true });
    }

    if (action === "delete_circle") {
      if (!isOwner) return fail(403, "owner_only");
      await sb(`circles?id=eq.${circleId}`, { method: "DELETE", prefer: "return=minimal" });
      return res.status(200).json({ ok: true });
    }

    return fail(400, "Unknown action");
  } catch (err) {
    console.error("circles error", action, err);
    return fail(500, "Something went wrong. Please try again.");
  }
}
