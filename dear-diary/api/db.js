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
  set_it_down_submissions: ["POST"],
};

const PUBLIC_WRITE = new Set(["set_it_down_submissions"]); // no sign-in needed

function rows(body) { return Array.isArray(body) ? body : [body]; }

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
      if (table === "set_it_down_submissions") list = list.map((r) => ({ word: String(r.word || "").slice(0, 40), event_tag: r.event_tag }));
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
