// Every database read/write from the app goes through here.
// The caller's identity comes from a signed session token, never from the request itself.
import { config, sb, sessionEmail, publicUser, opaqueId, readBody, ADMIN_EMAIL } from "./_lib.js";

// Private tables: each row belongs to one person, identified by this column.
const OWNED = {
  entries: "user_email",
  grove_entries: "user_email",
  grove_activity_log: "user_email",
  grove_activity_prefs: "user_email",
  letters: "user_email",
  trackers: "user_email",
  tracker_logs: "user_email",
  therapy_items: "user_email",
  community_members: "user_id",
  blocked_users: "blocker_id",
};

// Shared tables and what members may do with them.
const SHARED = {
  communities: ["GET"],
  community_posts: ["GET", "POST", "DELETE"],
  post_reactions: ["GET", "POST", "DELETE"],
  reports: ["POST"],
  users: ["GET"],
  set_it_down_submissions: ["POST", "GET"], // GET is Hallie only
};

const PUBLIC_WRITE = new Set(["set_it_down_submissions"]); // no sign-in needed

function rows(body) { return Array.isArray(body) ? body : [body]; }

// ── Community tiers ──
// Communities have a min_tier; a member's plan decides which ones they can read and post in.
// "premium" is the communities table's name for the Off the Record tier.
const TIER_LEVEL = { free: 0, community: 1, premium: 2, offtherecord: 2 };

// Ids of the communities this person's plan unlocks.
async function allowedCommunityIds(me) {
  const [u, cs] = await Promise.all([
    sb(`users?email=eq.${encodeURIComponent(me)}&select=plan`),
    sb("communities?select=id,min_tier"),
  ]);
  const plan = Array.isArray(u.data) && u.data[0] ? u.data[0].plan : "free";
  const level = TIER_LEVEL[plan] ?? 0;
  if (!Array.isArray(cs.data)) return [];
  return cs.data.filter((c) => (TIER_LEVEL[c.min_tier] ?? 0) <= level).map((c) => String(c.id));
}

function buildQuery(params) {
  const s = params.toString();
  return s ? `?${s}` : "";
}

function hideMember(rowsOut, field, me, isAdmin) {
  if (isAdmin || !Array.isArray(rowsOut)) return rowsOut;
  return rowsOut.map((r) => (r && r[field] && r[field] !== me ? { ...r, [field]: opaqueId(r[field]) } : r));
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!config()) return res.status(503).json({ error: "not_configured" });

  const { path = "", method = "GET", body, prefer } = readBody(req);
  const [table, qs = ""] = String(path).split("?");
  const params = new URLSearchParams(qs);
  const M = String(method).toUpperCase();

  if (!OWNED[table] && !SHARED[table]) return res.status(403).json({ error: "forbidden" });
  if ((params.get("select") || "").includes("(")) return res.status(400).json({ error: "bad select" });

  const me = sessionEmail(req);
  if (!me && !(PUBLIC_WRITE.has(table) && M === "POST")) return res.status(401).json({ error: "signed_out" });
  const isAdmin = me === ADMIN_EMAIL;

  try {
    // ── Private tables ──
    if (OWNED[table]) {
      const owner = OWNED[table];
      if (!["GET", "POST", "PATCH", "DELETE"].includes(M)) return res.status(405).json({ error: "method" });

      if (M === "POST") {
        const list = rows(body || {}).map((r) => ({ ...r, [owner]: me }));
        // Upserts must not take over a row that belongs to someone else
        const ids = list.map((r) => r.id).filter((x) => x !== undefined && x !== null);
        if (ids.length && String(prefer || "").includes("merge-duplicates")) {
          const inList = ids.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(",");
          const existing = await sb(`${table}?id=in.(${encodeURIComponent(inList)})&select=id,${owner}`);
          if (Array.isArray(existing.data) && existing.data.some((r) => r[owner] !== me)) return res.status(403).json({ error: "forbidden" });
        }
        const r = await sb(`${table}${buildQuery(params)}`, { method: "POST", body: Array.isArray(body) ? list : list[0], prefer });
        return res.status(r.status).json(r.data);
      }

      params.delete(owner);
      params.append(owner, `eq.${me}`);
      let patch = body;
      if (M === "PATCH") { patch = { ...(body || {}) }; delete patch[owner]; }
      const r = await sb(`${table}${buildQuery(params)}`, { method: M, body: M === "PATCH" ? patch : undefined, prefer });
      let out = r.data;
      if (table === "blocked_users") out = hideMember(out, "blocked_id", me, false);
      return res.status(r.status).json(out);
    }

    // ── Shared tables ──
    if (!SHARED[table].includes(M)) return res.status(403).json({ error: "forbidden" });

    if (table === "users") {
      if (!isAdmin) { params.delete("email"); params.append("email", `eq.${me}`); }
      const r = await sb(`users${buildQuery(params)}`);
      return res.status(r.status).json(Array.isArray(r.data) ? r.data.map(publicUser) : r.data);
    }

    if (M === "GET") {
      if (table === "set_it_down_submissions" && !isAdmin) return res.status(403).json({ error: "forbidden" });
      if (table === "community_posts" && !isAdmin) {
        const allowed = await allowedCommunityIds(me);
        if (!allowed.length) return res.status(200).json([]);
        params.append("community_id", `in.(${allowed.join(",")})`);
      }
      const r = await sb(`${table}${buildQuery(params)}`);
      let out = r.data;
      if (table === "community_posts" || table === "post_reactions") out = hideMember(out, "user_id", me, isAdmin);
      return res.status(r.status).json(out);
    }

    if (M === "POST") {
      let list = rows(body || {});
      if (table === "community_posts") list = list.map((r) => (r.is_anonymous === true && r.user_id === "anonymous" ? r : { ...r, user_id: me }));
      if (table === "post_reactions") list = list.map((r) => ({ ...r, user_id: me }));
      if (table === "reports") list = list.map((r) => ({ ...r, reporter_id: me }));
      if (!isAdmin && (table === "community_posts" || table === "post_reactions")) {
        const allowed = new Set(await allowedCommunityIds(me));
        let communityIds = list.map((r) => r.community_id);
        if (table === "post_reactions") {
          // Reactions point at a post; look up which community each post is in
          const postIds = [...new Set(list.map((r) => r.post_id).filter((x) => x !== undefined && x !== null))];
          if (!postIds.length) return res.status(403).json({ error: "forbidden" });
          const p = await sb(`community_posts?id=in.(${postIds.map(encodeURIComponent).join(",")})&select=id,community_id`);
          const byPost = new Map((Array.isArray(p.data) ? p.data : []).map((x) => [String(x.id), x.community_id]));
          communityIds = list.map((r) => byPost.get(String(r.post_id)));
        }
        if (communityIds.some((id) => id === undefined || id === null || !allowed.has(String(id)))) {
          return res.status(403).json({ error: "tier_locked" });
        }
      }
      if (table === "set_it_down_submissions") list = list.map((r) => ({ word: String(r.word || "").trim().slice(0, ["app", "walk"].includes(r.event_tag) ? 140 : 40), event_tag: ["app", "walk"].includes(r.event_tag) ? r.event_tag : (r.event_tag || "set-it-down-saturday") }));
      const r = await sb(table, { method: "POST", body: Array.isArray(body) ? list : list[0], prefer });
      let out = r.data;
      if (table === "community_posts" || table === "post_reactions") out = hideMember(out, "user_id", me, isAdmin);
      return res.status(r.status).json(out);
    }

    if (M === "DELETE") {
      // Members can only remove their own posts and reactions; Hallie can remove any post.
      if (!(isAdmin && table === "community_posts")) { params.delete("user_id"); params.append("user_id", `eq.${me}`); }
      const r = await sb(`${table}${buildQuery(params)}`, { method: "DELETE", prefer });
      return res.status(r.status).json(r.data);
    }

    return res.status(403).json({ error: "forbidden" });
  } catch (err) {
    console.error("db error", table, M, err);
    return res.status(500).json({ error: "server_error" });
  }
}
