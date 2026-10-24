// My Inner Circle: private circles for friends and family.
// The server (/api/circles) decides who can see and post in each circle.
import * as React from "react";
import { useState, useEffect } from "react";

const C = {
  ink: "#3d2a1a", brown: "#5a2e0e", text: "#5a3a1a", muted: "#b08060", accent: "#c8895a",
  card: "rgba(255,252,246,0.95)", line: "rgba(200,137,90,0.15)", soft: "rgba(200,137,90,0.07)",
};
const EMOJIS = ["🌿", "💛", "🌸", "🏡", "☀️", "🌙", "🥾", "☕", "🌊", "✨"];
const card = { background: C.card, borderRadius: 18, border: `1px solid ${C.line}`, boxShadow: "0 2px 12px rgba(160,100,50,0.08)" };
const btn = (solid) => ({
  background: solid ? C.accent : "transparent", color: solid ? "white" : C.accent,
  border: `1px solid ${C.accent}`, borderRadius: 20, padding: "8px 16px", fontSize: 13, fontWeight: 700,
  cursor: "pointer", fontFamily: "'Nunito',sans-serif",
});
const input = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1.5px solid rgba(200,137,90,0.2)",
  borderRadius: 14, fontSize: 15, fontFamily: "'Nunito',sans-serif", color: C.ink, background: "white", outline: "none",
};
const linkBtn = { background: "none", border: "none", padding: 0, fontSize: 12, color: C.muted, cursor: "pointer", fontFamily: "'Nunito',sans-serif" };

function getToken() { try { return localStorage.getItem("myinnermind_token") || ""; } catch { return ""; } }

async function circles(action, payload = {}) {
  try {
    const t = getToken();
    const res = await fetch("/api/circles", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
      body: JSON.stringify({ action, ...payload }),
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 401) window.dispatchEvent(new Event("mim-signed-out"));
    return { ok: res.ok, ...data };
  } catch {
    return { ok: false, error: "No connection. Please try again." };
  }
}

function timeAgo(d) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

async function shareInvite(circle) {
  const text = `Join my circle "${circle.name}" on My Inner Mind 🌿\n\nOpen the app, go to Communities, tap "Join a circle" and enter this code: ${circle.invite_code}`;
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); alert("Invite copied. Paste it in a text to your people. 💛"); }
  catch { alert(`Your invite code is ${circle.invite_code}`); }
}

// ── The "My Circles" section at the top of Communities ──
export function MyCircles({ onOpen, onUpgrade }) {
  const [list, setList] = useState(null);
  const [canCreate, setCanCreate] = useState(false);
  const [mode, setMode] = useState(null); // null | "join" | "create"
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🌿");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const r = await circles("mine");
    setList(r.circles || []);
    setCanCreate(!!r.can_create);
  }
  useEffect(() => { load(); }, []);

  async function join() {
    setBusy(true); setErr("");
    const r = await circles("join", { code });
    setBusy(false);
    if (!r.ok) return setErr(r.error || "Couldn't join. Please try again.");
    setMode(null); setCode(""); onOpen(r.circle);
  }

  async function create() {
    setBusy(true); setErr("");
    const r = await circles("create", { name, emoji });
    setBusy(false);
    if (!r.ok) return setErr(r.error === "needs_plan" ? "Starting a circle is part of the Community plan." : r.error || "Couldn't create it. Please try again.");
    setMode(null); setName(""); onOpen(r.circle, true);
  }

  return (
    <div style={{ padding: "0 16px", marginBottom: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(200,137,90,0.25)", background: C.soft, color: C.brown }}>🔒 My Inner Circle</div>
      </div>
      <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic", fontFamily: "'Lora',serif", margin: "0 0 10px", lineHeight: 1.5 }}>Private spaces for your people. Only members can see what's shared.</p>

      {list === null ? (
        <div style={{ color: C.muted, fontStyle: "italic", fontSize: 13, padding: "8px 0" }}>Loading your circles...</div>
      ) : list.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
          {list.map((c) => (
            <button key={c.id} onClick={() => onOpen(c)} style={{ ...card, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", textAlign: "left", width: "100%", fontFamily: "'Nunito',sans-serif" }}>
              <span style={{ fontSize: 28 }}>{c.emoji}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'Lora',serif", fontWeight: 600, fontSize: 16, color: C.brown }}>{c.name}</span>
                <span style={{ display: "block", fontSize: 12, color: C.muted }}>{c.member_count} {c.member_count === 1 ? "member" : "members"}{c.role === "owner" ? " · you started this" : ""}</span>
              </span>
              <span style={{ color: C.accent, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      )}

      {mode === null && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <button style={btn(false)} onClick={() => { setMode("join"); setErr(""); }}>Join a circle</button>
          <button style={btn(true)} onClick={() => { if (canCreate) { setMode("create"); setErr(""); } else onUpgrade?.(); }}>+ Start a circle{canCreate ? "" : " 💛"}</button>
        </div>
      )}
      {mode === null && !canCreate && <p style={{ fontSize: 11, color: C.muted, margin: "2px 0 0" }}>Anyone can join with an invite. Starting a circle is part of the Community plan.</p>}

      {mode === "join" && (
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontFamily: "'Lora',serif", fontWeight: 600, color: C.brown, marginBottom: 8 }}>Enter your invite code</div>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABC123" maxLength={8} autoCapitalize="characters" style={{ ...input, letterSpacing: 4, fontWeight: 700, textAlign: "center" }} />
          {err && <p style={{ color: "#b4533a", fontSize: 13, margin: "8px 0 0" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={btn(true)} disabled={busy} onClick={join}>{busy ? "Joining..." : "Join"}</button>
            <button style={btn(false)} onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}

      {mode === "create" && (
        <div style={{ ...card, padding: 16 }}>
          <div style={{ fontFamily: "'Lora',serif", fontWeight: 600, color: C.brown, marginBottom: 8 }}>Start a circle</div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sunday Reset, The Sisters, Hiking Crew..." maxLength={40} style={input} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            {EMOJIS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} style={{ fontSize: 22, width: 40, height: 40, borderRadius: 12, cursor: "pointer", border: emoji === e ? `2px solid ${C.accent}` : "1px solid rgba(200,137,90,0.2)", background: emoji === e ? C.soft : "white" }}>{e}</button>
            ))}
          </div>
          {err && <p style={{ color: "#b4533a", fontSize: 13, margin: "8px 0 0" }}>{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button style={btn(true)} disabled={busy || !name.trim()} onClick={create}>{busy ? "Creating..." : "Create"}</button>
            <button style={btn(false)} onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inside one circle ──
export function CircleView({ circle: start, isNew, onBack }) {
  const [circle, setCircle] = useState(start);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState(null);
  const [text, setText] = useState("");
  const [answering, setAnswering] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPeople, setShowPeople] = useState(!!isNew);
  const [editPrompt, setEditPrompt] = useState(false);
  const [promptDraft, setPromptDraft] = useState("");
  const isOwner = circle.role === "owner";

  async function load() {
    const r = await circles("open", { circle_id: start.id });
    if (!r.ok) { alert(r.error === "not_a_member" ? "You're no longer in this circle." : "Couldn't open this circle."); onBack(); return; }
    setCircle((c) => ({ ...c, ...r.circle, invite_code: r.circle.invite_code || c.invite_code }));
    setMembers(r.members || []);
    setPosts(r.posts || []);
  }
  useEffect(() => { load(); }, [start.id]);

  async function share() {
    if (!text.trim()) return;
    setBusy(true);
    const r = await circles("post", { circle_id: circle.id, content: text, prompt: answering ? circle.prompt : null });
    setBusy(false);
    if (!r.ok) return alert(r.error || "Couldn't share that. Please try again.");
    setPosts((p) => [r.post, ...(p || [])]); setText(""); setAnswering(false);
  }

  async function heart(p) {
    setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, hearted: !x.hearted, hearts: x.hearts + (x.hearted ? -1 : 1) } : x)));
    await circles("react", { post_id: p.id });
  }

  async function remove(p) {
    if (!window.confirm("Delete this post?")) return;
    const r = await circles("delete_post", { post_id: p.id });
    if (r.ok) setPosts((ps) => ps.filter((x) => x.id !== p.id));
  }

  async function report(p) {
    if (!window.confirm("Report this post to Hallie for review?")) return;
    await circles("report", { post_id: p.id });
    alert("Thank you. We've received your report and will review it within 24 hours. 🌿");
  }

  async function block(p) {
    if (!window.confirm(`Block ${p.name}? You won't see their posts anymore.`)) return;
    const t = getToken();
    await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify({ path: "blocked_users", method: "POST", body: { blocked_id: p.author } }) }).catch(() => null);
    setPosts((ps) => ps.filter((x) => x.author !== p.author));
    alert("Blocked. Their posts won't appear for you anymore.");
  }

  async function savePrompt() {
    const r = await circles("set_prompt", { circle_id: circle.id, prompt: promptDraft });
    if (!r.ok) return alert(r.error || "Couldn't save that.");
    setCircle((c) => ({ ...c, prompt: r.prompt })); setEditPrompt(false);
  }

  async function newCode() {
    if (!window.confirm("Make a new invite code? The old one will stop working (people already in the circle stay in).")) return;
    const r = await circles("new_code", { circle_id: circle.id });
    if (r.ok) setCircle((c) => ({ ...c, invite_code: r.invite_code }));
  }

  async function removeMember(m) {
    if (!window.confirm(`Remove ${m.name} from this circle?`)) return;
    const r = await circles("remove_member", { circle_id: circle.id, member: m.key });
    if (r.ok) setMembers((ms) => ms.filter((x) => x.key !== m.key));
  }

  async function leaveOrDelete() {
    if (isOwner) {
      if (!window.confirm(`Delete "${circle.name}" for everyone? All its posts will be gone. This can't be undone.`)) return;
      const r = await circles("delete_circle", { circle_id: circle.id });
      if (r.ok) onBack();
    } else {
      if (!window.confirm(`Leave "${circle.name}"?`)) return;
      const r = await circles("leave", { circle_id: circle.id });
      if (r.ok) onBack();
    }
  }

  return (
    <div style={{ fontFamily: "'Nunito',sans-serif", paddingBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(200,137,90,0.12)" }}>
        <button style={{ ...linkBtn, fontSize: 13, fontWeight: 600 }} onClick={onBack}>← Communities</button>
        <button style={{ ...linkBtn, fontSize: 13, fontWeight: 700, color: C.accent }} onClick={() => setShowPeople((s) => !s)}>👥 {members.length || circle.member_count || 1}</button>
      </div>

      <div style={{ textAlign: "center", padding: "20px 16px 14px" }}>
        <div style={{ fontSize: 40, marginBottom: 4 }}>{circle.emoji}</div>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 600, color: C.brown, margin: "0 0 4px" }}>{circle.name}</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>🔒 Private. Only members can see this.</p>
      </div>

      {showPeople && (
        <div style={{ ...card, margin: "0 16px 12px", padding: 16 }}>
          {isOwner && circle.invite_code && (
            <div style={{ textAlign: "center", paddingBottom: 14, marginBottom: 12, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, color: C.accent, marginBottom: 6 }}>Invite code</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, color: C.brown, marginBottom: 10 }}>{circle.invite_code}</div>
              <button style={btn(true)} onClick={() => shareInvite(circle)}>Send invite 💛</button>
              <div><button style={{ ...linkBtn, marginTop: 10 }} onClick={newCode}>Make a new code</button></div>
            </div>
          )}
          <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, color: C.muted, marginBottom: 8 }}>Members</div>
          {members.map((m) => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ color: C.text, fontSize: 14 }}>{m.name}{m.me ? " (you)" : ""}{m.role === "owner" ? " · started this circle" : ""}</span>
              {isOwner && !m.me && <button style={linkBtn} onClick={() => removeMember(m)}>Remove</button>}
            </div>
          ))}
          <div style={{ marginTop: 12 }}><button style={{ ...linkBtn, color: "#b4533a" }} onClick={leaveOrDelete}>{isOwner ? "Delete this circle" : "Leave this circle"}</button></div>
        </div>
      )}

      <div style={{ ...card, margin: "0 16px 12px", padding: "16px 18px" }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8, color: C.accent }}>✦ This week's prompt</div>
        {editPrompt ? (
          <>
            <textarea value={promptDraft} onChange={(e) => setPromptDraft(e.target.value)} maxLength={280} rows={3} style={{ ...input, resize: "vertical" }} placeholder="What's one thing you're putting down this week, and one thing you want to make room for?" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={btn(true)} onClick={savePrompt}>Save</button>
              <button style={btn(false)} onClick={() => setEditPrompt(false)}>Cancel</button>
            </div>
          </>
        ) : circle.prompt ? (
          <>
            <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: 14, color: C.text, lineHeight: 1.7, margin: "0 0 12px" }}>"{circle.prompt}"</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button style={{ ...btn(false), padding: "6px 16px", fontSize: 12 }} onClick={() => { setAnswering(true); setText(""); }}>Answer this →</button>
              {isOwner && <button style={linkBtn} onClick={() => { setPromptDraft(circle.prompt); setEditPrompt(true); }}>Change prompt</button>}
            </div>
          </>
        ) : isOwner ? (
          <button style={{ ...btn(false), padding: "6px 16px", fontSize: 12 }} onClick={() => { setPromptDraft(""); setEditPrompt(true); }}>+ Set a prompt for your circle</button>
        ) : (
          <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic", margin: 0 }}>No prompt yet. Share whatever's on your mind.</p>
        )}
      </div>

      <div style={{ ...card, margin: "0 16px 14px", padding: 16 }}>
        {answering && (
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 8, display: "flex", justifyContent: "space-between", background: C.soft, padding: "6px 10px", borderRadius: 8 }}>
            ✦ Answering this week's prompt<button style={linkBtn} onClick={() => setAnswering(false)}>✕</button>
          </div>
        )}
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} rows={3} style={{ ...input, resize: "vertical" }} placeholder={answering ? "Your answer..." : "Share with your circle..."} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <button style={btn(true)} disabled={busy || !text.trim()} onClick={share}>{busy ? "Sharing..." : "Share"}</button>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {posts === null ? (
          <div style={{ textAlign: "center", color: C.muted, fontStyle: "italic", padding: 30 }}>Loading...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 24px" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>{circle.emoji}</div>
            <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{isOwner && members.length <= 1 ? "Send your invite code, then share the first thing." : "Nothing shared yet. Go first. 🌿"}</p>
          </div>
        ) : posts.map((p) => (
          <div key={p.id} style={{ ...card, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: C.brown, fontSize: 14 }}>{p.name}{p.mine ? " (you)" : ""}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(p.created_at)}</span>
            </div>
            {p.prompt && <div style={{ fontSize: 11, color: C.accent, fontStyle: "italic", marginBottom: 6 }}>✦ {p.prompt}</div>}
            <p style={{ fontFamily: "'Lora',serif", fontSize: 14.5, color: C.text, lineHeight: 1.7, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{p.content}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => heart(p)} style={{ background: p.hearted ? C.soft : "transparent", border: `1px solid ${p.hearted ? C.accent : "rgba(200,137,90,0.25)"}`, borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer", color: C.brown }}>💛 {p.hearts || ""}</button>
              {(p.mine || isOwner) && <button style={linkBtn} onClick={() => remove(p)}>Delete</button>}
              {!p.mine && <button style={linkBtn} onClick={() => report(p)}>🚩 Report</button>}
              {!p.mine && <button style={linkBtn} onClick={() => block(p)}>Block</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
