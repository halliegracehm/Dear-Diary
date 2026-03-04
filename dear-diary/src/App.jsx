import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const MOODS = [
  { emoji: "🌟", label: "Radiant", color: "#f59e0b" },
  { emoji: "😊", label: "Happy", color: "#84cc16" },
  { emoji: "😌", label: "Calm", color: "#06b6d4" },
  { emoji: "😐", label: "Neutral", color: "#94a3b8" },
  { emoji: "😔", label: "Low", color: "#8b5cf6" },
  { emoji: "😢", label: "Sad", color: "#3b82f6" },
  { emoji: "😤", label: "Frustrated", color: "#ef4444" },
];
const TAG_OPTIONS = ["personal","work","gratitude","dreams","health","family","travel","ideas"];
const TAG_COLORS = {
  personal:"#c8895a", work:"#7a8c6e", gratitude:"#c4956a", dreams:"#9b7eb8",
  health:"#6b9e78", family:"#c07060", travel:"#5b8fa8", ideas:"#b8955a",
};
const PLANS = {
  free:  { name:"Free",  price:"$0/mo",  color:"#94a3b8", features:["10 entries/mo","Basic moods & tags","Daily AI prompt"] },
  plus:  { name:"Plus",  price:"$6/mo",  color:"#c8895a", features:["Unlimited entries","AI insights","PDF export","Community feed"] },
  group: { name:"Group", price:"$12/mo", color:"#7a8c6e", features:["Everything in Plus","Group workspace","Shared prompts"] },
};

function getTodayStr() { return new Date().toISOString().split("T")[0]; }
function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US",{ weekday:"long", year:"numeric", month:"long", day:"numeric" });
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return String(h);
}

// ─── Storage helpers (localStorage) ──────────────────────────────────────────
function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); return true; } catch { return false; }
}
function lsDel(key) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}
function lsKeys(prefix) {
  try {
    return Object.keys(localStorage).filter(k => k.startsWith(prefix));
  } catch { return []; }
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
function exportToPDF(entries, username) {
  const win = window.open("", "_blank");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#3a2010;background:#fffdf8}
    h1{font-size:28px;color:#7a4a1e;border-bottom:2px solid #c8895a;padding-bottom:12px;margin-bottom:8px}
    .sub{color:#b08060;font-style:italic;margin-bottom:36px}
    .entry{margin:28px 0;padding:24px;border:1px solid #e8d0b0;border-radius:12px;background:#fdf8f0;page-break-inside:avoid}
    .meta{font-size:13px;color:#b08060;margin-bottom:6px;font-weight:bold}
    .title{font-size:20px;font-weight:bold;color:#5a2e0e;margin-bottom:10px}
    .content{font-size:15px;line-height:1.85;font-style:italic;white-space:pre-wrap}
    .tag{display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;margin:3px 2px;background:#f0e0c8;color:#8a5020}
    @media print{body{margin:20px}.entry{break-inside:avoid}}
  </style></head><body>
  <h1>🌿 ${username}'s Journal</h1>
  <p class="sub">Exported on ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</p>
  ${entries.map(e => `
    <div class="entry">
      <div class="meta">${formatDate(e.date)}${e.mood ? ` &nbsp;·&nbsp; ${e.mood.emoji} ${e.mood.label}` : ""}</div>
      <div class="title">${e.title || "Untitled"}</div>
      <div class="content">${(e.content||"").replace(/</g,"&lt;")}</div>
      ${e.tags?.length ? `<div style="margin-top:12px">${e.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>` : ""}
    </div>`).join("")}
  </body></html>`;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

// ─── AI helpers ───────────────────────────────────────────────────────────────
async function callClaude(messages, system = "") {
  const body = { model: "claude-sonnet-4-20250514", max_tokens: 1000, messages };
  if (system) body.system = system;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.map(b => b.text || "").join("") || "";
}

async function getAIInsight(entry) {
  return callClaude(
    [{ role: "user", content: `Journal entry titled "${entry.title}":\n\n${entry.content}\n\nMood: ${entry.mood?.label || "not set"}` }],
    "You are a warm, thoughtful journaling companion. In 3-4 sentences, offer a gentle, insightful reflection on this journal entry. Notice themes, emotions, or growth. Be encouraging and kind. Do not ask questions. Write in second person."
  );
}

async function getDailyPrompt() {
  const day = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return callClaude(
    [{ role: "user", content: `Today is ${day}. Give me a single thoughtful journaling prompt. Just the prompt itself, no preamble.` }],
    "You generate warm, introspective daily journaling prompts. Specific, evocative, and invite genuine reflection. 1-2 sentences max."
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("splash");
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("myinnerminduser");
    if (saved) { setCurrentUser(JSON.parse(saved)); setScreen("app"); }
    else setTimeout(() => setScreen("auth"), 1800);
  }, []);

  async function handleAuth() {
    setAuthError(""); setAuthLoading(true);
    await new Promise(r => setTimeout(r, 300));
    try {
      if (authMode === "register") {
        if (!authForm.username || !authForm.email || !authForm.password) { setAuthError("All fields are required."); return; }
        if (authForm.password.length < 6) { setAuthError("Password must be at least 6 characters."); return; }
        const existing = lsGet(`myinnerminduser:${authForm.email}`);
        if (existing) { setAuthError("An account with that email already exists."); return; }
        const user = { username: authForm.username, email: authForm.email, passwordHash: hashStr(authForm.password), plan: "free", createdAt: Date.now() };
        lsSet(`myinnerminduser:${authForm.email}`, JSON.stringify(user));
        sessionStorage.setItem("myinnerminduser", JSON.stringify(user));
        setCurrentUser(user); setScreen("app");
      } else {
        if (!authForm.email || !authForm.password) { setAuthError("Email and password are required."); return; }
        const raw = lsGet(`myinnerminduser:${authForm.email}`);
        if (!raw) { setAuthError("No account found with that email."); return; }
        const user = JSON.parse(raw);
        if (user.passwordHash !== hashStr(authForm.password)) { setAuthError("Incorrect password."); return; }
        sessionStorage.setItem("myinnerminduser", JSON.stringify(user));
        setCurrentUser(user); setScreen("app");
      }
    } finally { setAuthLoading(false); }
  }

  function handleLogout() {
    sessionStorage.removeItem("myinnerminduser");
    setCurrentUser(null); setScreen("auth");
    setAuthForm({ username: "", email: "", password: "" });
  }

  function upgradePlan(plan) {
    if (!currentUser) return;
    const updated = { ...currentUser, plan };
    lsSet(`myinnerminduser:${currentUser.email}`, JSON.stringify(updated));
    sessionStorage.setItem("myinnerminduser", JSON.stringify(updated));
    setCurrentUser(updated);
  }

  if (screen === "splash") return <Splash />;
  if (screen === "auth") return (
    <AuthScreen mode={authMode} form={authForm} error={authError} loading={authLoading}
      onChange={f => setAuthForm(p => ({ ...p, ...f }))}
      onSubmit={handleAuth}
      onToggle={() => { setAuthMode(m => m === "login" ? "register" : "login"); setAuthError(""); }} />
  );
  return <JournalApp user={currentUser} onLogout={handleLogout} onUpgradePlan={upgradePlan} />;
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ ...S.page, justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 14 }}>
      <div style={S.texture} />
      <div style={{ fontSize: 64, animation: "float 2.5s ease-in-out infinite" }}>🌿</div>
      <div style={{ fontFamily: "'Lora',serif", fontSize: 38, color: "#7a4a1e", fontWeight: 600 }}>My Inner Mind</div>
      <div style={{ color: "#b08060", fontSize: 15, fontStyle: "italic" }}>Reflections & Growth</div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        *{box-sizing:border-box;margin:0;padding:0}
      `}</style>
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function AuthScreen({ mode, form, error, loading, onChange, onSubmit, onToggle }) {
  return (
    <div style={{ ...S.page, justifyContent: "center", alignItems: "center" }}>
      <div style={S.texture} />
      <GlobalStyles />
      <div style={S.authCard}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🌿</div>
          <div style={{ fontFamily: "'Lora',serif", fontSize: 28, color: "#7a4a1e", fontWeight: 600 }}>My Inner Mind</div>
          <div style={{ color: "#b08060", fontSize: 13, marginTop: 5, fontStyle: "italic" }}>
            {mode === "login" ? "Welcome back" : "Begin your journey inward"}
          </div>
        </div>
        {mode === "register" && (
          <Field label="Name">
            <input style={S.input} placeholder="Your name" value={form.username} onChange={e => onChange({ username: e.target.value })} />
          </Field>
        )}
        <Field label="Email">
          <input style={S.input} type="email" placeholder="you@email.com" value={form.email} onChange={e => onChange({ email: e.target.value })} onKeyDown={e => e.key === "Enter" && onSubmit()} />
        </Field>
        <Field label="Password">
          <input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={e => onChange({ password: e.target.value })} onKeyDown={e => e.key === "Enter" && onSubmit()} />
        </Field>
        {error && <div style={S.errorBox}>{error}</div>}
        <button onClick={onSubmit} disabled={loading} style={{ ...S.saveBtn, width: "100%", padding: "13px", fontSize: 15, marginTop: 4 }}>
          {loading ? "One moment..." : mode === "login" ? "Sign In →" : "Create My Journal →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "#b08060" }}>
          {mode === "login" ? "New here? " : "Already have an account? "}
          <button onClick={onToggle} style={{ background: "none", border: "none", color: "#c8895a", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            {mode === "login" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Journal App ─────────────────────────────────────────────────────────
function JournalApp({ user, onLogout, onUpgradePlan }) {
  const [tab, setTab] = useState("journal");
  const [view, setView] = useState("list");
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState(null);
  const [dailyPrompt, setDailyPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [form, setForm] = useState({ id: null, date: getTodayStr(), title: "", content: "", mood: null, tags: [], shared: false });
  const [insight, setInsight] = useState("");
  const [insightLoading, setInsightLoading] = useState(false);

  const isPro = user.plan === "plus" || user.plan === "group";

  useEffect(() => { loadEntries(); loadPrompt(); }, []);

  function loadEntries() {
    const keys = lsKeys(`myinnermindentry:${user.email}:`);
    const loaded = keys.map(k => { try { return JSON.parse(lsGet(k)); } catch { return null; } })
      .filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));
    setEntries(loaded);
  }

  async function loadPrompt() {
    const cached = sessionStorage.getItem("myinnermindPrompt_" + getTodayStr());
    if (cached) { setDailyPrompt(cached); return; }
    setPromptLoading(true);
    try {
      const p = await getDailyPrompt();
      setDailyPrompt(p);
      sessionStorage.setItem("myinnermindPrompt_" + getTodayStr(), p);
    } catch { setDailyPrompt("What is one small thing that brought you comfort today?"); }
    finally { setPromptLoading(false); }
  }

  function saveEntry() {
    if (!form.title.trim() && !form.content.trim()) return;
    const entry = { ...form, id: form.id || `${user.email}_${Date.now()}`, updatedAt: Date.now() };
    lsSet(`myinnermindentry:${user.email}:${entry.id}`, JSON.stringify(entry));
    if (entry.shared) {
      lsSet(`myinnermindcommunity:${entry.id}`, JSON.stringify({ ...entry, authorName: user.username }));
    } else {
      lsDel(`myinnermindcommunity:${entry.id}`);
    }
    loadEntries();
    setView("list");
  }

  function deleteEntry(entry) {
    lsDel(`myinnermindentry:${user.email}:${entry.id}`);
    lsDel(`myinnermindcommunity:${entry.id}`);
    loadEntries();
    setView("list");
  }

  async function fetchInsight(entry) {
    if (!isPro) return;
    setInsight(""); setInsightLoading(true);
    try { setInsight(await getAIInsight(entry)); }
    catch { setInsight("Couldn't load insight right now. Try again in a moment."); }
    finally { setInsightLoading(false); }
  }

  function startNew(prefill = "") {
    setForm({ id: null, date: getTodayStr(), title: "", content: prefill, mood: null, tags: [], shared: false });
    setEditMode(false); setView("write");
  }

  function startEdit(entry) { setForm({ ...entry }); setEditMode(true); setView("write"); }

  const filtered = entries.filter(e => {
    const q = searchQuery.toLowerCase();
    return (!q || e.title?.toLowerCase().includes(q) || e.content?.toLowerCase().includes(q)) &&
           (!filterTag || e.tags?.includes(filterTag));
  });

  return (
    <div style={S.page}>
      <div style={S.texture} />
      <GlobalStyles />

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <button onClick={() => { setTab("journal"); setView("list"); }} style={S.logoBtn}>
            <span style={{ fontSize: 22 }}>🌿</span>
            <span style={S.logoText}>My Inner Mind</span>
          </button>
          <nav style={{ display: "flex", gap: 4 }}>
            {[["journal","📖 Journal"],["community","🌿 Community"],["pricing","💎 Plans"]].map(([t, label]) => (
              <button key={t} onClick={() => { setTab(t); setView("list"); }}
                style={{ ...S.navBtn, ...(tab === t ? S.navBtnActive : {}) }}>{label}</button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={S.userBadge}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#7a4a1e" }}>👤 {user.username}</span>
              <span style={{ ...S.planPill, background: PLANS[user.plan]?.color + "22", color: PLANS[user.plan]?.color }}>
                {user.plan}
              </span>
            </div>
            <button onClick={onLogout} style={S.ghostBtn}>Sign out</button>
          </div>
        </div>
      </header>

      <main style={S.main}>

        {/* ── JOURNAL ── */}
        {tab === "journal" && view === "list" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Prompt card */}
            <div style={S.promptCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>✨</span>
                <span style={{ fontWeight: 700, color: "#7a4a1e", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>Today's Writing Prompt</span>
              </div>
              <p style={{ fontFamily: "'Lora',serif", fontSize: 16, color: "#5a3a1a", fontStyle: "italic", lineHeight: 1.7, marginBottom: 14 }}>
                {promptLoading ? "Finding your prompt for today..." : dailyPrompt || "What are you grateful for right now?"}
              </p>
              <button onClick={() => startNew(dailyPrompt)} style={S.softBtn}>Write to this prompt →</button>
            </div>

            {/* Search + actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", opacity: 0.35, fontSize: 15 }}>🔍</span>
                <input style={{ ...S.input, paddingLeft: 38, width: "100%" }} placeholder="Search your entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              {isPro && (
                <button onClick={() => exportToPDF(entries, user.username)} style={S.ghostBtn}>📄 Export PDF</button>
              )}
              <button onClick={() => startNew()} style={S.newBtn}>+ New Entry</button>
            </div>

            {/* Tag filter */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              <Chip active={!filterTag} onClick={() => setFilterTag(null)}>All</Chip>
              {TAG_OPTIONS.map(t => (
                <Chip key={t} active={filterTag === t} activeColor={TAG_COLORS[t]} onClick={() => setFilterTag(filterTag === t ? null : t)}>{t}</Chip>
              ))}
            </div>

            {/* Entries grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 0" }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>📖</div>
                <p style={{ color: "#b08060", fontFamily: "'Lora',serif", fontStyle: "italic", fontSize: 16 }}>No entries yet — start writing!</p>
                <button onClick={() => startNew()} style={{ ...S.newBtn, marginTop: 18 }}>Write your first entry</button>
              </div>
            ) : (
              <div style={S.grid}>
                {filtered.map(entry => (
                  <EntryCard key={entry.id} entry={entry} onClick={() => { setSelectedEntry(entry); setInsight(""); setView("read"); }} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "journal" && view === "write" && (
          <div style={S.writeCard}>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ ...S.input, width: "auto", fontSize: 13 }} />
            <input style={S.titleInput} placeholder="Give this entry a title..." value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />

            <SectionLabel>How are you feeling?</SectionLabel>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
              {MOODS.map(m => (
                <button key={m.label} title={m.label}
                  onClick={() => setForm(f => ({ ...f, mood: f.mood?.label === m.label ? null : m }))}
                  style={{ width: 42, height: 42, fontSize: 22, borderRadius: 12, cursor: "pointer", transition: "all .15s", border: `2px solid ${form.mood?.label === m.label ? m.color : "transparent"}`, background: form.mood?.label === m.label ? m.color + "25" : "rgba(255,255,255,0.6)" }}>
                  {m.emoji}
                </button>
              ))}
            </div>

            <SectionLabel>Tags</SectionLabel>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 4 }}>
              {TAG_OPTIONS.map(t => (
                <Chip key={t} active={form.tags.includes(t)} activeColor={TAG_COLORS[t]}
                  onClick={() => setForm(f => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t] }))}>
                  {t}
                </Chip>
              ))}
            </div>

            <textarea style={S.textarea} rows={13} placeholder="What's on your mind today? Write freely..."
              value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />

            {isPro && (
              <label style={{ display: "flex", alignItems: "center", gap: 9, cursor: "pointer", fontSize: 14, color: "#8a6040" }}>
                <input type="checkbox" checked={form.shared} onChange={e => setForm(f => ({ ...f, shared: e.target.checked }))}
                  style={{ accentColor: "#c8895a", width: 16, height: 16 }} />
                Share to Community Feed 🌿
              </label>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <button onClick={() => setView("list")} style={S.ghostBtn}>Discard</button>
              <button onClick={saveEntry} style={S.saveBtn}>{editMode ? "Save Changes ✓" : "Save Entry ✨"}</button>
            </div>
          </div>
        )}

        {tab === "journal" && view === "read" && selectedEntry && (
          <div style={S.readCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: "#b08060", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {formatDate(selectedEntry.date)}
                </div>
                {selectedEntry.mood && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "4px 13px", borderRadius: 12, background: "rgba(200,137,90,0.1)", color: "#9a6a3a", fontSize: 13, fontWeight: 600 }}>
                    {selectedEntry.mood.emoji} {selectedEntry.mood.label}
                  </span>
                )}
              </div>
              <button onClick={() => setView("list")} style={S.ghostBtn}>← Back</button>
            </div>

            <h1 style={{ fontFamily: "'Lora',serif", fontSize: 30, color: "#5a2e0e", marginBottom: 14, fontWeight: 600, lineHeight: 1.2 }}>
              {selectedEntry.title || "Untitled"}
            </h1>

            {selectedEntry.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {selectedEntry.tags.map(t => <TagPill key={t} tag={t} />)}
              </div>
            )}

            <div style={{ height: 1, background: "linear-gradient(90deg,rgba(200,137,90,0.3),transparent)", marginBottom: 24 }} />

            <p style={{ fontFamily: "'Lora',serif", fontSize: 17, lineHeight: 1.9, color: "#6a4020", fontStyle: "italic", whiteSpace: "pre-wrap", marginBottom: 32 }}>
              {selectedEntry.content}
            </p>

            {isPro && (
              <div style={S.insightBox}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: insight ? 12 : 0 }}>
                  <span style={{ fontWeight: 700, color: "#7a4a1e", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>✨ AI Reflection</span>
                  {!insight && (
                    <button onClick={() => fetchInsight(selectedEntry)} disabled={insightLoading} style={S.softBtn}>
                      {insightLoading ? "Reflecting..." : "Get Insight"}
                    </button>
                  )}
                </div>
                {insightLoading && <p style={{ color: "#b08060", fontStyle: "italic", fontSize: 14 }}>Reading between the lines...</p>}
                {insight && <p style={{ fontFamily: "'Lora',serif", fontSize: 15, lineHeight: 1.75, color: "#6a4020", fontStyle: "italic" }}>{insight}</p>}
              </div>
            )}

            {!isPro && (
              <div style={{ ...S.insightBox, opacity: 0.7, textAlign: "center", padding: "16px" }}>
                <span style={{ fontSize: 13, color: "#9a7050" }}>✨ Upgrade to Plus to unlock AI Reflections on your entries</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
              <button onClick={() => deleteEntry(selectedEntry)} style={S.deleteBtn}>🗑 Delete</button>
              <button onClick={() => startEdit(selectedEntry)} style={S.saveBtn}>✏️ Edit</button>
            </div>
          </div>
        )}

        {/* ── COMMUNITY ── */}
        {tab === "community" && (
          <CommunityTab currentUser={user} isPro={isPro} onUpgrade={() => setTab("pricing")} />
        )}

        {/* ── PRICING ── */}
        {tab === "pricing" && (
          <PricingTab currentPlan={user.plan} onUpgrade={onUpgradePlan} />
        )}
      </main>
    </div>
  );
}

// ─── Community ────────────────────────────────────────────────────────────────
function CommunityTab({ currentUser, isPro, onUpgrade }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    if (!isPro) return;
    const keys = lsKeys("myinnermindcommunity:");
    const loaded = keys.map(k => { try { return JSON.parse(lsGet(k)); } catch { return null; } })
      .filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    setPosts(loaded);
  }, [isPro]);

  if (!isPro) return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <div style={{ fontSize: 54, marginBottom: 16 }}>🌿</div>
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, color: "#5a2e0e", marginBottom: 12 }}>Community Feed</h2>
      <p style={{ color: "#b08060", fontSize: 16, maxWidth: 400, margin: "0 auto 28px", lineHeight: 1.7, fontStyle: "italic", fontFamily: "'Lora',serif" }}>
        Connect with others through shared reflections. Upgrade to Plus or Group to join the community.
      </p>
      <button onClick={onUpgrade} style={S.saveBtn}>See Plans →</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 26, color: "#5a2e0e" }}>🌿 Community Feed</h2>
        <p style={{ color: "#b08060", fontSize: 13, marginTop: 5 }}>Entries shared by My Inner Mind members</p>
      </div>
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
          <p style={{ color: "#b08060", fontFamily: "'Lora',serif", fontStyle: "italic" }}>
            No shared entries yet. Share one of your own entries to start the community!
          </p>
        </div>
      ) : (
        <div style={S.grid}>
          {posts.map(post => <EntryCard key={post.id} entry={post} showAuthor />)}
        </div>
      )}
    </div>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function PricingTab({ currentPlan, onUpgrade }) {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 30, color: "#5a2e0e", marginBottom: 8 }}>Choose Your Plan</h2>
        <p style={{ color: "#b08060", fontSize: 15, fontStyle: "italic" }}>Grow your practice, together</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 20, marginBottom: 40 }}>
        {Object.entries(PLANS).map(([key, plan]) => (
          <div key={key} style={{ ...S.pricingCard, ...(currentPlan === key ? { borderColor: plan.color, boxShadow: `0 4px 24px ${plan.color}33` } : {}) }}>
            {currentPlan === key && (
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: plan.color, color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 14px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                Current Plan
              </div>
            )}
            <div style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 600, color: "#5a2e0e", marginBottom: 4 }}>{plan.name}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: plan.color, marginBottom: 20, fontFamily: "'Lora',serif" }}>{plan.price}</div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {plan.features.map(f => (
                <li key={f} style={{ fontSize: 14, color: "#7a5030", display: "flex", gap: 8 }}>
                  <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            {currentPlan !== key && (
              <button onClick={() => onUpgrade(key)}
                style={{ ...S.saveBtn, width: "100%", background: `linear-gradient(135deg,${plan.color}cc,${plan.color})`, boxShadow: `0 3px 14px ${plan.color}55` }}>
                {key === "free" ? "Downgrade" : "Upgrade →"}
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(255,252,246,0.85)", border: "1px solid rgba(200,137,90,0.15)", borderRadius: 22, padding: "28px 32px" }}>
        <h3 style={{ fontFamily: "'Lora',serif", fontSize: 20, color: "#5a2e0e", marginBottom: 18 }}>💡 Ways to Monetize with a Group</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
          {[
            { icon: "🧘", title: "Wellness Cohorts", desc: "Therapists or coaches assign journaling to clients" },
            { icon: "📚", title: "Writing Circles", desc: "Book clubs share reflections together" },
            { icon: "🏢", title: "Team Wellness", desc: "Companies buy Group seats for employees" },
            { icon: "🎓", title: "Education", desc: "Classrooms use shared prompts for reflection" },
          ].map(item => (
            <div key={item.title} style={{ padding: "14px 16px", background: "rgba(200,137,90,0.06)", borderRadius: 14 }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div style={{ fontWeight: 700, color: "#7a4a1e", fontSize: 14, marginBottom: 4 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: "#9a7050", lineHeight: 1.55 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────────────────
function EntryCard({ entry, onClick, showAuthor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ ...S.card, cursor: onClick ? "pointer" : "default", transform: hovered ? "translateY(-3px)" : "", boxShadow: hovered ? "0 10px 30px rgba(160,100,50,0.18)" : "0 2px 12px rgba(160,100,50,0.10)" }}
      onClick={onClick} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
        <span style={{ fontSize: 11, color: "#b08060", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.3px" }}>{formatDate(entry.date)}</span>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {entry.shared && <span style={{ fontSize: 11, opacity: 0.5 }}>🌿</span>}
          {entry.mood && <span style={{ fontSize: 18 }}>{entry.mood.emoji}</span>}
        </div>
      </div>
      {showAuthor && <div style={{ fontSize: 12, color: "#c8895a", fontWeight: 700, marginBottom: 4 }}>by {entry.authorName}</div>}
      <h3 style={{ fontFamily: "'Lora',serif", fontSize: 17, color: "#5a2e0e", fontWeight: 600, marginBottom: 8, lineHeight: 1.3 }}>{entry.title || "Untitled"}</h3>
      <p style={{ fontSize: 14, color: "#8a6040", lineHeight: 1.65, fontStyle: "italic", fontFamily: "'Lora',serif" }}>
        {(entry.content || "").slice(0, 110)}{(entry.content || "").length > 110 ? "…" : ""}
      </p>
      {entry.tags?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
          {entry.tags.map(t => <TagPill key={t} tag={t} />)}
        </div>
      )}
    </div>
  );
}

function TagPill({ tag }) {
  return <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700, fontFamily: "'Nunito',sans-serif", letterSpacing: "0.3px", background: TAG_COLORS[tag] + "22", color: TAG_COLORS[tag], border: `1px solid ${TAG_COLORS[tag]}44` }}>{tag}</span>;
}

function Chip({ children, active, activeColor, onClick }) {
  const base = { padding: "5px 14px", borderRadius: 20, border: "1px solid rgba(200,137,90,0.3)", background: "rgba(255,255,255,0.6)", color: "#9a6a3a", fontSize: 13, fontWeight: 600, fontFamily: "'Nunito',sans-serif", cursor: "pointer", transition: "all .15s" };
  const activeStyle = activeColor ? { background: activeColor, color: "#fff", borderColor: activeColor } : { background: "#c8895a", color: "#fff", borderColor: "#c8895a" };
  return <button style={{ ...base, ...(active ? activeStyle : {}) }} onClick={onClick}>{children}</button>;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#b08060", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "#b08060", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>{children}</div>;
}

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Nunito',sans-serif}
      textarea{resize:none}
      button{transition:opacity .15s}
      button:hover{opacity:0.85}
      ::-webkit-scrollbar{width:5px}
      ::-webkit-scrollbar-thumb{background:#d4a87a55;border-radius:3px}
      input::placeholder,textarea::placeholder{opacity:0.45}
    `}</style>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "linear-gradient(160deg,#fdf6ec 0%,#f5e8d3 40%,#ede0cc 100%)", fontFamily: "'Nunito',sans-serif", display: "flex", flexDirection: "column", position: "relative" },
  texture: { position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8895a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0 },
  header: { position: "sticky", top: 0, zIndex: 100, background: "rgba(253,246,236,0.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(200,137,90,0.15)" },
  headerInner: { maxWidth: 960, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
  logoBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: 0 },
  logoText: { fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 600, color: "#7a4a1e" },
  navBtn: { background: "none", border: "1px solid transparent", borderRadius: 20, padding: "6px 13px", color: "#9a7050", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Nunito',sans-serif" },
  navBtnActive: { background: "rgba(200,137,90,0.12)", borderColor: "rgba(200,137,90,0.3)", color: "#7a4a1e" },
  userBadge: { display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "rgba(200,137,90,0.08)", borderRadius: 20, border: "1px solid rgba(200,137,90,0.18)" },
  planPill: { fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.5px" },
  main: { position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "28px 24px 80px", width: "100%" },
  authCard: { background: "rgba(255,252,246,0.97)", border: "1px solid rgba(200,137,90,0.2)", borderRadius: 24, padding: "36px 40px", width: "100%", maxWidth: 400, boxShadow: "0 8px 40px rgba(160,100,50,0.15)", position: "relative", zIndex: 1 },
  input: { width: "100%", padding: "11px 15px", borderRadius: 13, border: "1px solid rgba(200,137,90,0.25)", background: "rgba(255,255,255,0.75)", fontFamily: "'Nunito',sans-serif", fontSize: 15, color: "#5a3a1a", outline: "none" },
  errorBox: { background: "rgba(200,80,60,0.08)", border: "1px solid rgba(200,80,60,0.2)", borderRadius: 10, padding: "8px 14px", color: "#c05040", fontSize: 13, fontWeight: 600, marginBottom: 14 },
  card: { background: "rgba(255,252,246,0.93)", border: "1px solid rgba(200,137,90,0.15)", borderRadius: 20, padding: "20px 22px", transition: "transform .2s, box-shadow .2s" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 },
  promptCard: { background: "linear-gradient(135deg,rgba(200,137,90,0.1),rgba(155,126,184,0.07))", border: "1px solid rgba(200,137,90,0.2)", borderRadius: 20, padding: "20px 24px" },
  writeCard: { background: "rgba(255,252,246,0.97)", border: "1px solid rgba(200,137,90,0.15)", borderRadius: 24, padding: "32px 36px", boxShadow: "0 4px 24px rgba(160,100,50,0.12)", display: "flex", flexDirection: "column", gap: 16, maxWidth: 700, margin: "0 auto" },
  titleInput: { fontFamily: "'Lora',serif", fontSize: 26, fontWeight: 600, color: "#5a2e0e", background: "transparent", border: "none", borderBottom: "2px solid rgba(200,137,90,0.2)", padding: "6px 0", outline: "none", width: "100%" },
  textarea: { fontFamily: "'Lora',serif", fontSize: 16, lineHeight: 1.85, color: "#5a3a1a", background: "rgba(253,248,242,0.85)", border: "1px solid rgba(200,137,90,0.2)", borderRadius: 16, padding: "16px 20px", outline: "none", width: "100%", fontStyle: "italic" },
  readCard: { background: "rgba(255,252,246,0.97)", border: "1px solid rgba(200,137,90,0.15)", borderRadius: 24, padding: "36px 44px", boxShadow: "0 4px 24px rgba(160,100,50,0.12)", maxWidth: 700, margin: "0 auto" },
  insightBox: { background: "linear-gradient(135deg,rgba(200,137,90,0.07),rgba(155,126,184,0.06))", border: "1px solid rgba(200,137,90,0.18)", borderRadius: 16, padding: "18px 22px", marginBottom: 8 },
  pricingCard: { background: "rgba(255,252,246,0.97)", border: "2px solid rgba(200,137,90,0.15)", borderRadius: 22, padding: "28px", position: "relative", transition: "all .2s" },
  saveBtn: { background: "linear-gradient(135deg,#d4956a,#c8895a)", color: "#fff", border: "none", borderRadius: 20, padding: "10px 24px", fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 3px 12px rgba(200,137,90,0.4)" },
  ghostBtn: { background: "none", border: "1px solid rgba(200,137,90,0.3)", borderRadius: 18, padding: "8px 18px", color: "#b08060", fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  softBtn: { background: "rgba(200,137,90,0.13)", border: "1px solid rgba(200,137,90,0.28)", borderRadius: 16, padding: "7px 16px", color: "#9a5a2a", fontFamily: "'Nunito',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  newBtn: { background: "#c8895a", color: "#fff", border: "none", borderRadius: 20, padding: "10px 20px", fontSize: 14, fontWeight: 700, fontFamily: "'Nunito',sans-serif", cursor: "pointer", boxShadow: "0 2px 10px rgba(200,137,90,0.35)", whiteSpace: "nowrap" },
  deleteBtn: { background: "none", border: "1px solid rgba(200,80,60,0.3)", borderRadius: 18, padding: "9px 20px", color: "#c05040", fontFamily: "'Nunito',sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" },
};
