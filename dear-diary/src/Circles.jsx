// My Inner Circle: private circles for friends and family.
// The server (/api/circles) decides who can see and post in each circle.
import * as React from "react";
import { useState, useEffect } from "react";

const C = {
  ink: "#3d2a1a", brown: "#5a2e0e", text: "#5a3a1a", muted: "#b08060", accent: "#c8895a",
  card: "rgba(255,252,246,0.95)", line: "rgba(200,137,90,0.15)", soft: "rgba(200,137,90,0.07)",
};
const AFFIRMATIONS = [
  "Thinking of you today 💛",
  "I'm proud of you.",
  "You don't have to carry it all alone.",
  "You're doing better than you think.",
  "I'm really glad you're in my life.",
  "Rest is allowed. Take it.",
  "You make this circle better.",
  "One step at a time is still progress.",
  "I see how hard you're trying.",
  "You are loved exactly as you are.",
];
const MOODS = ["🌧️ Heavy", "🌥️ Low", "⛅ Okay", "🌤️ Good", "☀️ Great"];
const EMOJIS = ["🪺", "🌲", "🏕️", "🍂", "🪶", "🐦", "⛰️", "🔥", "🌙", "🌾"];
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
const label = { fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8, color: C.accent };
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

function confettiBurst() {
  const em = ["🍃", "🍂", "🪶", "✨", "🌿"];
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      const el = document.createElement("div");
      el.textContent = em[i % em.length];
      el.style.cssText = `position:fixed;pointer-events:none;z-index:9999;font-size:${16 + Math.random() * 14}px;left:${10 + Math.random() * 80}%;top:40%;transition:all 1.4s ease-out;opacity:1`;
      document.body.appendChild(el);
      requestAnimationFrame(() => { el.style.transform = `translateY(${-120 - Math.random() * 160}px)`; el.style.opacity = "0"; });
      setTimeout(() => el.remove(), 1500);
    }, i * 40);
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

export const PENDING_KEY = "mim_pending_circle";
export function inviteLink(code) { return `https://myinnermind.halliewho.com/join/${code}`; }

async function shareInvite(circle) {
  const text = `Join my circle "${circle.name}" on My Inner Mind 🌿\n\nTap to join: ${inviteLink(circle.invite_code)}\n\nOr open the app, go to Communities, tap "Join a circle" and enter this code: ${circle.invite_code}`;
  try {
    if (navigator.share) { await navigator.share({ text }); return; }
  } catch (e) { if (e?.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); alert("Invite copied. Paste it in a text to your people. 💛"); }
  catch { alert(`Your invite code is ${circle.invite_code}`); }
}

// Join a circle from an invite link (after sign-in). Returns the circle or an error message.
export async function joinFromLink(code) {
  try { localStorage.removeItem(PENDING_KEY); } catch {}
  const r = await circles("join", { code });
  return r.ok ? { circle: r.circle } : { error: r.error || "Couldn't join that circle." };
}

// ── Landing page for someone who taps an invite link before signing in ──
export function CircleInvitePage({ code, onStart, onSignIn }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    fetch("/api/circles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "preview", code }) })
      .then((r) => (r.ok ? r.json() : { missing: true })).then(setInfo).catch(() => setInfo({ missing: true }));
  }, [code]);
  const page = { position: "fixed", inset: 0, overflowY: "auto", fontFamily: "'Nunito',sans-serif",
    background: "radial-gradient(120% 60% at 50% 0%, #f4ead2 0%, rgba(244,234,210,0) 70%), linear-gradient(180deg, #efe4cc 0px, #f6eedd 260px, #fbf5ea 100%)" };
  return (
    <div style={page}>
      <Branches />
      <div style={{ position: "relative", maxWidth: 440, margin: "0 auto", padding: "120px 24px 40px", textAlign: "center" }}>
        {!info ? (
          <p style={{ color: C.muted, fontStyle: "italic" }}>Opening your invite...</p>
        ) : info.missing ? (
          <>
            <h1 style={{ fontFamily: "'Lora',serif", fontSize: 26, color: C.brown, margin: "0 0 10px" }}>This invite isn't working</h1>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.6, margin: "0 0 24px" }}>The code may have changed. Ask the person who invited you for a new link.</p>
            <button style={btn(true)} onClick={onStart}>Explore My Inner Mind</button>
          </>
        ) : (
          <>
            <Nest count={info.member_count} />
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: C.muted, marginTop: 8 }}>You're invited to a private circle</div>
            <h1 style={{ fontFamily: "'Lora',serif", fontSize: 32, color: C.brown, margin: "8px 0 6px", lineHeight: 1.2 }}>{info.name}</h1>
            <p style={{ color: C.muted, fontSize: 14, margin: "0 0 22px" }}>{info.member_count} {info.member_count === 1 ? "person is" : "people are"} already here</p>
            <div style={{ ...card, padding: "18px 20px", textAlign: "left", marginBottom: 24 }}>
              <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", color: C.text, fontSize: 15, lineHeight: 1.65, margin: 0 }}>A small, private space on My Inner Mind for checking in on each other, a weekly card to answer together, and a little love sent back and forth. 🌿</p>
            </div>
            <button style={{ ...btn(true), width: "100%", padding: "14px", fontSize: 16 }} onClick={onStart}>Create a free account to join</button>
            <button style={{ ...linkBtn, fontSize: 14, marginTop: 16, fontWeight: 700, color: C.accent }} onClick={onSignIn}>I already have an account</button>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 18 }}>You'll be added to the circle as soon as you're signed in.</p>
          </>
        )}
      </div>
    </div>
  );
}

// ── The "My Circles" section at the top of Communities ──
export function MyCircles({ onOpen, onUpgrade }) {
  const [list, setList] = useState(null);
  const [canCreate, setCanCreate] = useState(false);
  const [mode, setMode] = useState(null); // null | "join" | "create"
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🪺");
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
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(200,137,90,0.25)", background: C.soft, color: C.brown }}>🪺 My Inner Circle</div>
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
              {c.new_notes > 0 && <span style={{ background: C.accent, color: "white", borderRadius: 12, padding: "3px 9px", fontSize: 11, fontWeight: 800 }}>💛 {c.new_notes}</span>}
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

// ── Tree and nest artwork for the circle screen ──
function Leaf({ x, y, r = 0, s = 1, c = "#8fae78" }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path d="M0 0 C 8 -10, 24 -10, 32 0 C 24 10, 8 10, 0 0 Z" fill={c} />
      <path d="M2 0 L 28 0" stroke="rgba(60,80,40,0.25)" strokeWidth="1" />
    </g>
  );
}

function Branches() {
  // A branch reaching in from each top corner, drawn behind everything
  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMin slice" aria-hidden="true"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 260, pointerEvents: "none" }}>
      <path d="M-10 40 C 60 50, 110 80, 150 120" stroke="#7a5233" strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M60 52 C 70 30, 90 22, 108 20" stroke="#7a5233" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M110 92 C 104 110, 100 130, 102 150" stroke="#7a5233" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Leaf x={18} y={38} r={-30} c="#7f9f6a" />
      <Leaf x={40} y={46} r={40} s={0.9} c="#a3bf8c" />
      <Leaf x={92} y={22} r={-20} s={0.85} c="#8fae78" />
      <Leaf x={104} y={20} r={30} s={0.75} c="#6f8c5d" />
      <Leaf x={130} y={104} r={50} s={0.9} c="#8fae78" />
      <Leaf x={100} y={146} r={80} s={0.7} c="#a3bf8c" />
      <Leaf x={75} y={64} r={70} s={0.8} c="#6f8c5d" />
      <path d="M410 70 C 350 70, 300 92, 262 130" stroke="#7a5233" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M330 78 C 324 56, 306 44, 288 40" stroke="#7a5233" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Leaf x={380} y={66} r={200} c="#7f9f6a" />
      <Leaf x={356} y={72} r={140} s={0.9} c="#a3bf8c" />
      <Leaf x={300} y={44} r={200} s={0.8} c="#8fae78" />
      <Leaf x={286} y={40} r={150} s={0.7} c="#6f8c5d" />
      <Leaf x={276} y={118} r={120} s={0.85} c="#8fae78" />
      <Leaf x={318} y={90} r={100} s={0.75} c="#6f8c5d" />
      <circle cx="170" cy="40" r="2" fill="#e9c98f" opacity="0.7" />
      <circle cx="240" cy="28" r="1.6" fill="#e9c98f" opacity="0.6" />
      <circle cx="210" cy="64" r="1.4" fill="#e9c98f" opacity="0.6" />
    </svg>
  );
}

function Nest({ count = 3 }) {
  // A woven nest holding one speckled egg for each person in the circle
  const n = Math.max(1, Math.min(count, 7));
  const eggs = Array.from({ length: n }, (_, i) => {
    const spread = n === 1 ? 0 : (i - (n - 1) / 2) * (84 / Math.max(n - 1, 1));
    const lift = Math.abs(i - (n - 1) / 2) < 1 ? 0 : 3;
    return { x: 75 + spread, y: 30 + lift, r: (i % 2 ? 1 : -1) * (6 + i * 2) };
  });
  const tones = ["#e8eef0", "#dfe9e4", "#efe6da", "#e4ecef", "#eae2d6", "#dbe6e8", "#efe9de"];
  const twigs = [
    "M8 38 C 40 58, 110 58, 142 38", "M12 44 C 45 62, 105 62, 138 44", "M18 50 C 50 66, 100 66, 132 50",
    "M4 36 C 30 52, 70 54, 96 48", "M54 48 C 80 54, 120 52, 146 36", "M14 42 C 40 38, 60 54, 90 58",
    "M60 58 C 90 54, 110 40, 136 42", "M22 54 C 60 48, 90 64, 128 54",
  ];
  return (
    <svg viewBox="0 0 150 76" width="170" height="86" aria-hidden="true" style={{ display: "block", margin: "0 auto 6px" }}>
      <path d="M6 36 C 20 70, 130 70, 144 36 C 120 48, 30 48, 6 36 Z" fill="#8a5c33" />
      {eggs.map((e, i) => (
        <g key={i} transform={`translate(${e.x} ${e.y}) rotate(${e.r})`}>
          <ellipse cx="0" cy="0" rx="9" ry="11.5" fill={tones[i % tones.length]} stroke="rgba(90,60,30,0.18)" strokeWidth="0.8" />
          <circle cx="-3" cy="-4" r="1" fill="#8d7b68" opacity="0.55" /><circle cx="3" cy="1" r="0.9" fill="#8d7b68" opacity="0.5" />
          <circle cx="-1" cy="5" r="0.8" fill="#8d7b68" opacity="0.45" /><ellipse cx="-3" cy="-5" rx="2.4" ry="3.4" fill="#fff" opacity="0.5" />
        </g>
      ))}
      <path d="M6 36 C 22 50, 128 50, 144 36 C 140 56, 112 70, 75 70 C 38 70, 10 56, 6 36 Z" fill="#9a6a3c" />
      {twigs.map((d, i) => <path key={i} d={d} stroke={["#6b4423", "#b58450", "#8a5a2e", "#c99a64"][i % 4]} strokeWidth={i % 3 === 0 ? 2.4 : 1.6} fill="none" strokeLinecap="round" />)}
      <path d="M2 35 l 10 -4 M146 35 l -9 -5 M30 60 l -8 6 M120 60 l 9 5 M60 66 l -3 7" stroke="#6b4423" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M128 30 C 132 22, 140 20, 146 22 C 140 24, 134 28, 130 34 Z" fill="#c9b49a" opacity="0.9" />
    </svg>
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
  const [week, setWeek] = useState(null);
  const [notes, setNotes] = useState([]);
  const [allNotes, setAllNotes] = useState(false);
  const [noteTo, setNoteTo] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState("");
  const isOwner = circle.role === "owner";

  async function load() {
    const r = await circles("open", { circle_id: start.id });
    if (!r.ok) { alert(r.error === "not_a_member" ? "You're no longer in this circle." : "Couldn't open this circle."); onBack(); return; }
    setCircle((c) => ({ ...c, ...r.circle, invite_code: r.circle.invite_code || c.invite_code }));
    setMembers(r.members || []);
    setPosts(r.posts || []);
    setWeek(r.week || null);
    setNotes(r.notes || []);
  }
  useEffect(() => { load(); }, [start.id]);

  async function share() {
    if (!text.trim()) return;
    setBusy(true);
    const r = await circles("post", { circle_id: circle.id, content: text, answer: answering });
    setBusy(false);
    if (!r.ok) return alert(r.error || "Couldn't share that. Please try again.");
    setPosts((p) => [r.post, ...(p || [])]); setText("");
    if (answering) {
      setAnswering(false);
      if (!week?.answered) { confettiBurst(); load(); } // answering unlocks everyone else's
    }
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

  async function sendReply(p) {
    if (!replyText.trim()) return;
    const r = await circles("reply", { post_id: p.id, content: replyText });
    if (!r.ok) return alert(r.error || "Couldn't send that. Please try again.");
    setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, replies: [...(x.replies || []), r.reply] } : x)));
    setReplyText(""); setReplyOpen(null);
  }

  async function deleteReply(p, rp) {
    if (!window.confirm("Delete this reply?")) return;
    const r = await circles("delete_reply", { reply_id: rp.id });
    if (r.ok) setPosts((ps) => ps.map((x) => (x.id === p.id ? { ...x, replies: x.replies.filter((y) => y.id !== rp.id) } : x)));
  }

  async function reportReply(rp) {
    if (!window.confirm("Report this reply to Hallie for review?")) return;
    await circles("report_reply", { reply_id: rp.id });
    alert("Thank you. We've received your report and will review it within 24 hours. 🌿");
  }

  async function setMood(mood) {
    const r = await circles("post", { circle_id: circle.id, kind: "mood", content: mood });
    if (!r.ok) return alert(r.error || "Couldn't share that. Please try again.");
    setPosts((p) => (r.post.replaced ? (p || []).map((x) => (x.id === r.post.id ? { ...x, content: mood } : x)) : [r.post, ...(p || [])]));
    setMembers((ms) => ms.map((m) => (m.me ? { ...m, mood: { mood, at: r.post.created_at } } : m)));
  }

  async function toggleChallenge() {
    const next = !week.i_did_it;
    setWeek((w) => ({ ...w, i_did_it: next }));
    setMembers((ms) => ms.map((m) => (m.me ? { ...m, did_challenge: next } : m)));
    if (next) confettiBurst();
    const r = await circles("checkin", { circle_id: circle.id });
    if (!r.ok) { alert(r.error || "Couldn't save that. Please try again."); load(); }
  }

  async function sendNote() {
    if (!noteText.trim() || !noteTo) return;
    setSending(true);
    const r = await circles("send_note", { circle_id: circle.id, to: noteTo.key, message: noteText });
    setSending(false);
    if (!r.ok) return alert(r.error || "Couldn't send that. Please try again.");
    alert(`Sent to ${noteTo.name}. 💛`);
    setNoteTo(null); setNoteText("");
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
    <div style={{ fontFamily: "'Nunito',sans-serif", paddingBottom: 24, position: "relative", overflow: "hidden", borderRadius: 20,
      background: "radial-gradient(120% 60% at 50% 0%, #f4ead2 0%, rgba(244,234,210,0) 70%), linear-gradient(180deg, #efe4cc 0px, #f6eedd 260px, #fbf5ea 100%)" }}>
      <Branches />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <button style={{ ...linkBtn, fontSize: 13, fontWeight: 600, background: "rgba(255,252,246,0.8)", padding: "4px 10px", borderRadius: 14 }} onClick={onBack}>← Communities</button>
        <button style={{ ...linkBtn, fontSize: 13, fontWeight: 700, color: C.accent, background: "rgba(255,252,246,0.8)", padding: "4px 10px", borderRadius: 14 }} onClick={() => setShowPeople((s) => !s)}>👥 {members.length || circle.member_count || 1}</button>
      </div>

      <div style={{ position: "relative", textAlign: "center", padding: "34px 16px 16px" }}>
        <Nest count={members.length || circle.member_count || 3} />
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 600, color: C.brown, margin: "0 0 4px" }}>{circle.name}</h2>
        <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>🔒 Private. Only members can see this.</p>
      </div>

      {showPeople && (
        <div style={{ ...card, margin: "0 16px 12px", padding: 16 }}>
          {isOwner && circle.invite_code && (
            <div style={{ textAlign: "center", paddingBottom: 14, marginBottom: 12, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, color: C.accent, marginBottom: 6 }}>Invite code</div>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 6, color: C.brown, marginBottom: 10 }}>{circle.invite_code}</div>
              <button style={btn(true)} onClick={() => shareInvite(circle)}>Send invite link 💛</button>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 8, wordBreak: "break-all" }}>{inviteLink(circle.invite_code)}</div>
              <div><button style={{ ...linkBtn, marginTop: 10 }} onClick={newCode}>Make a new code</button></div>
            </div>
          )}
          {isOwner && (
            <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${C.line}` }}>
              <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, color: C.muted, marginBottom: 8 }}>Circle icon</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EMOJIS.map((e) => (
                  <button key={e} onClick={async () => { const r = await circles("set_emoji", { circle_id: circle.id, emoji: e }); if (r.ok) setCircle((c) => ({ ...c, emoji: e })); }} style={{ fontSize: 20, width: 38, height: 38, borderRadius: 12, cursor: "pointer", border: circle.emoji === e ? `2px solid ${C.accent}` : "1px solid rgba(200,137,90,0.2)", background: circle.emoji === e ? C.soft : "white" }}>{e}</button>
                ))}
              </div>
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

      {notes.length > 0 && (
        <div style={{ ...card, margin: "0 16px 12px", padding: "16px 18px", background: "linear-gradient(135deg,rgba(200,137,90,0.12),rgba(255,252,246,0.97))" }}>
          <div style={label}>🐦 Notes for you</div>
          {(allNotes ? notes : notes.slice(0, 3)).map((n) => (
            <div key={n.id} style={{ padding: "8px 0", borderTop: `1px solid ${C.line}` }}>
              <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: 15, color: C.text, margin: "0 0 2px", lineHeight: 1.5 }}>"{n.message}"</p>
              <span style={{ fontSize: 12, color: C.muted }}>from {n.from} · {timeAgo(n.created_at)}{n.new ? " · new" : ""}</span>
            </div>
          ))}
          {notes.length > 3 && <button style={{ ...linkBtn, marginTop: 6 }} onClick={() => setAllNotes((a) => !a)}>{allNotes ? "Show less" : `See all ${notes.length}`}</button>}
        </div>
      )}

      {members.length > 0 && (
        <div style={{ ...card, margin: "0 16px 12px", padding: "16px 18px" }}>
          <div style={label}>⛅ How's everyone doing?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {members.map((m) => {
              const lvl = m.mood ? MOODS.indexOf(m.mood.mood) : -1;
              return (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 64, fontSize: 13, color: C.text, fontWeight: m.me ? 700 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.me ? "You" : m.name}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 6, background: "rgba(200,137,90,0.1)", overflow: "hidden" }}>
                    {lvl >= 0 && <div style={{ width: `${(lvl + 1) * 20}%`, height: "100%", borderRadius: 6, background: ["#8a9bb0", "#a8a4b8", "#d9b779", "#e3a564", "#f0a63a"][lvl] }} />}
                  </div>
                  <span style={{ width: 82, fontSize: 12, color: lvl >= 0 ? C.text : C.muted, textAlign: "right" }}>{lvl >= 0 ? m.mood.mood : "No check-in"}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>How are you today?</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
            {MOODS.map((md) => {
              const [e, ...w] = md.split(" ");
              const mine = members.find((m) => m.me)?.mood?.mood === md;
              return (
                <button key={md} onClick={() => setMood(md)} style={{ flex: 1, padding: "8px 2px", borderRadius: 12, cursor: "pointer", fontFamily: "'Nunito',sans-serif", border: mine ? `1.5px solid ${C.accent}` : "1px solid rgba(200,137,90,0.2)", background: mine ? C.soft : "white" }}>
                  <div style={{ fontSize: 20 }}>{e}</div>
                  <div style={{ fontSize: 10.5, color: C.text }}>{w.join(" ")}</div>
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Moods show for 24 hours.</div>
        </div>
      )}

      {week && (
        <div style={{ margin: "6px 20px 10px" }}>
          <div style={{ fontFamily: "'Lora',serif", fontSize: 19, fontWeight: 600, color: C.brown }}>🌅 Sunday Set Up</div>
          <p style={{ fontSize: 13, color: C.muted, margin: "2px 0 0", fontStyle: "italic", fontFamily: "'Lora',serif" }}>Getting ready for the week, together. A new challenge and card every Sunday.</p>
        </div>
      )}

      {week && (
        <div style={{ ...card, margin: "0 16px 12px", padding: "16px 18px" }}>
          <div style={{ ...label, color: "#5f7a52" }}>🌱 This week's challenge</div>
          <p style={{ fontFamily: "'Lora',serif", fontSize: 15.5, color: C.ink, lineHeight: 1.6, margin: "0 0 12px" }}>{week.challenge}</p>
          <button onClick={toggleChallenge} style={{ ...btn(week.i_did_it), background: week.i_did_it ? "#6f8c62" : "transparent", borderColor: "#6f8c62", color: week.i_did_it ? "white" : "#5f7a52" }}>{week.i_did_it ? "✓ I did it!" : "I did it"}</button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            {members.map((m) => (
              <span key={m.key} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 14, background: m.did_challenge ? "rgba(111,140,98,0.14)" : "rgba(0,0,0,0.03)", color: m.did_challenge ? "#4f6a44" : C.muted, fontWeight: m.did_challenge ? 700 : 400 }}>{m.did_challenge ? "✓ " : ""}{m.me ? "You" : m.name}</span>
            ))}
          </div>
        </div>
      )}

      {week && (
        <div style={{ ...card, margin: "0 16px 12px", padding: "16px 18px" }}>
          <div style={{ ...label, display: "flex", justifyContent: "space-between" }}><span>🍂 Inner Circle Card</span><span>#{String(week.card?.number || 1).padStart(2, "0")}</span></div>
          <div style={{ fontFamily: "'Lora',serif", fontSize: 19, fontWeight: 600, color: C.brown, lineHeight: 1.3, margin: "2px 0 4px" }}>{week.card?.title}</div>
          {week.card?.lens && <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, color: "#7a4a1e", background: "rgba(122,74,30,0.07)", borderRadius: 10, padding: "2px 9px", marginBottom: 8 }}>{week.card.lens}</div>}
          <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: 15, color: C.text, lineHeight: 1.6, margin: "0 0 10px" }}>{week.question}</p>
          {!week.answered && <p style={{ fontSize: 12, color: C.muted, margin: "0 0 10px" }}>🔒 Answers stay hidden until you share yours. Then leave a kind word on someone else's.</p>}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button style={{ ...btn(!week.answered), padding: "6px 16px", fontSize: 12 }} onClick={() => { setAnswering(true); setText(""); document.getElementById("circle-compose")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>{week.answered ? "Add to my answer" : "Answer the card →"}</button>
            <span style={{ fontSize: 12, color: C.muted }}>{week.answered_count} of {members.length} answered{week.answered ? " · you ✓" : ""}</span>
          </div>
        </div>
      )}

      {members.filter((m) => !m.me).length > 0 && (
        <div style={{ ...card, margin: "0 16px 12px", padding: "16px 18px" }}>
          <div style={label}>🪶 Send some love</div>
          {!noteTo ? (
            <>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 10px" }}>Send a private affirmation to someone in your circle. Only they will see it.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {members.filter((m) => !m.me).map((m) => <button key={m.key} style={{ ...btn(false), padding: "6px 14px", fontSize: 13 }} onClick={() => { setNoteTo(m); setNoteText(""); }}>{m.name}</button>)}
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: C.text, margin: "0 0 8px" }}>To <b>{noteTo.name}</b>. Pick one or write your own:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {AFFIRMATIONS.map((a) => (
                  <button key={a} onClick={() => setNoteText(a)} style={{ fontSize: 12.5, padding: "6px 11px", borderRadius: 14, cursor: "pointer", fontFamily: "'Nunito',sans-serif", textAlign: "left", border: noteText === a ? `1.5px solid ${C.accent}` : "1px solid rgba(200,137,90,0.22)", background: noteText === a ? C.soft : "white", color: C.text }}>{a}</button>
                ))}
              </div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} maxLength={200} rows={2} style={{ ...input, resize: "vertical" }} placeholder="Or write your own..." />
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={btn(true)} disabled={sending || !noteText.trim()} onClick={sendNote}>{sending ? "Sending..." : "Send 💛"}</button>
                <button style={btn(false)} onClick={() => setNoteTo(null)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      <div id="circle-compose" style={{ ...card, margin: "0 16px 14px", padding: 16 }}>
        {answering && (
          <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 8, display: "flex", justifyContent: "space-between", background: C.soft, padding: "6px 10px", borderRadius: 8 }}>
            🍂 Answering this week's card<button style={linkBtn} onClick={() => setAnswering(false)}>✕</button>
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
            <p style={{ fontFamily: "'Lora',serif", fontStyle: "italic", color: C.muted, fontSize: 14, lineHeight: 1.7 }}>{isOwner && members.length <= 1 ? "Send your invite code, then share the first thing." : "Nothing shared yet. Go first. 🪶"}</p>
          </div>
        ) : posts.map((p) => p.kind === "mood" ? (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", marginBottom: 10, borderRadius: 14, background: C.soft, fontSize: 13, color: C.text }}>
            <span><b style={{ color: C.brown }}>{p.mine ? "You" : p.name}</b> {p.mine ? "are" : "is"} feeling {p.content}</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(p.created_at)}</span>
              {!p.mine && <button style={{ ...linkBtn, fontSize: 12 }} onClick={() => heart(p)}>{p.hearted ? "💛" : "🤍"}{p.hearts ? ` ${p.hearts}` : ""}</button>}
            </span>
          </div>
        ) : (
          <div key={p.id} style={{ ...card, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontWeight: 700, color: C.brown, fontSize: 14 }}>{p.name}{p.mine ? " (you)" : ""}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(p.created_at)}</span>
            </div>
            {p.kind === "grove" && <div style={{ fontSize: 11, color: "#5f7a52", fontWeight: 700, marginBottom: 6 }}>🌿 Grove wins today</div>}
            {p.prompt && <div style={{ fontSize: 11, color: C.accent, fontStyle: "italic", marginBottom: 6 }}>✦ {p.prompt}</div>}
            {p.locked ? (
              <div style={{ background: C.soft, borderRadius: 12, padding: "14px 16px", margin: "0 0 4px", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>🍂</div>
                <div style={{ fontSize: 13, color: C.muted }}>{p.name} answered this week's card. Share yours to see it.</div>
              </div>
            ) : (
            <>
            <p style={{ fontFamily: "'Lora',serif", fontSize: 14.5, color: C.text, lineHeight: 1.7, margin: "0 0 10px", whiteSpace: "pre-wrap" }}>{p.content}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <button onClick={() => heart(p)} style={{ background: p.hearted ? C.soft : "transparent", border: `1px solid ${p.hearted ? C.accent : "rgba(200,137,90,0.25)"}`, borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer", color: C.brown }}>💛 {p.hearts || ""}</button>
              {(p.mine || isOwner) && <button style={linkBtn} onClick={() => remove(p)}>Delete</button>}
              {!p.mine && <button style={linkBtn} onClick={() => report(p)}>🚩 Report</button>}
              {!p.mine && <button style={linkBtn} onClick={() => block(p)}>Block</button>}
              <button style={{ ...linkBtn, color: C.accent, fontWeight: 700 }} onClick={() => { setReplyOpen(replyOpen === p.id ? null : p.id); setReplyText(""); }}>Reply</button>
            </div>
            {(p.replies || []).length > 0 && (
              <div style={{ marginTop: 10, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
                {p.replies.map((rp) => (
                  <div key={rp.id} style={{ padding: "5px 0 5px 10px", borderLeft: "2px solid rgba(200,137,90,0.25)", marginBottom: 6 }}>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}><b style={{ color: C.brown }}>{rp.mine ? "You" : rp.name}</b> {rp.content}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: C.muted }}>{timeAgo(rp.created_at)}</span>
                      {(rp.mine || isOwner) && <button style={{ ...linkBtn, fontSize: 11 }} onClick={() => deleteReply(p, rp)}>Delete</button>}
                      {!rp.mine && <button style={{ ...linkBtn, fontSize: 11 }} onClick={() => reportReply(rp)}>Report</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {replyOpen === p.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={500} placeholder={`Say something kind to ${p.mine ? "your circle" : p.name}...`} style={{ ...input, padding: "9px 12px", fontSize: 14 }} onKeyDown={(e) => { if (e.key === "Enter") sendReply(p); }} />
                <button style={{ ...btn(true), padding: "8px 14px" }} disabled={!replyText.trim()} onClick={() => sendReply(p)}>Send</button>
              </div>
            )}
            </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── "Share with my circle" button for the Grove tab ──
export function ShareToCircle({ items, title = "Today's rituals" }) {
  const [list, setList] = useState(null);
  const [picking, setPicking] = useState(false);
  const [sharedTo, setSharedTo] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => { circles("mine").then((r) => setList(r.circles || [])); }, []);
  if (!list || list.length === 0 || !items.length) return null;

  async function shareTo(c) {
    setBusy(true);
    const r = await circles("post", { circle_id: c.id, kind: "grove", content: `${title}:\n${items.join("\n")}` });
    setBusy(false);
    if (!r.ok) return alert(r.error || "Couldn't share that. Please try again.");
    setSharedTo((s) => [...s, c.id]); setPicking(false);
    confettiBurst();
  }

  const green = { ...btn(false), borderColor: "#6f8c62", color: "#5f7a52" };
  return (
    <div style={{ marginTop: 12, textAlign: "center" }}>
      {!picking ? (
        <button style={green} disabled={busy} onClick={() => (list.length === 1 ? shareTo(list[0]) : setPicking(true))}>
          {sharedTo.length ? "✓ Shared with your circle" : "Share today's wins with your circle 💛"}
        </button>
      ) : (
        <div style={{ ...card, padding: 14, textAlign: "left" }}>
          <div style={{ ...label, color: "#5f7a52" }}>Share with</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {list.map((c) => (
              <button key={c.id} style={{ ...green, padding: "6px 14px", fontSize: 13, opacity: sharedTo.includes(c.id) ? 0.5 : 1 }} disabled={busy || sharedTo.includes(c.id)} onClick={() => shareTo(c)}>
                {c.emoji} {c.name}{sharedTo.includes(c.id) ? " ✓" : ""}
              </button>
            ))}
          </div>
          <button style={{ ...linkBtn, marginTop: 10 }} onClick={() => setPicking(false)}>Done</button>
        </div>
      )}
    </div>
  );
}
