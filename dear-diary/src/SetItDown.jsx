// src/pages/SetItDown.jsx
// Public anonymous page — no login required
// Route: /set-it-down
// Add to your router: <Route path="/set-it-down" element={<SetItDown />} />

import { useState } from "react";
import { supabase } from "../supabaseClient"; // adjust path if needed

export default function SetItDown() {
  const [step, setStep] = useState("context"); // context | input | success
  const [word, setWord] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | error
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e) => {
    const val = e.target.value.replace(/\s/g, ""); // one word, no spaces
    if (val.length <= 40) {
      setWord(val);
      setCharCount(val.length);
    }
  };

  const handleSubmit = async () => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setStatus("submitting");

    const { error } = await supabase
      .from("set_it_down_submissions")
      .insert({ word: trimmed.toLowerCase(), event_tag: "set-it-down-saturday" });

    if (error) {
      console.error(error);
      setStatus("error");
    } else {
      setStep("success");
      setStatus("idle");
      setWord("");
      setCharCount(0);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.card}>

        {/* ── STEP 1: Context card ── */}
        {step === "context" && (
          <>
            <div style={styles.iconRow}>🍃</div>
            <p style={styles.eyebrow}>Set It Down Saturday</p>
            <h1 style={styles.title}>Before we walk,<br />we set it down.</h1>

            <div style={styles.contextBox}>
              <p style={styles.contextLine}>
                <span style={styles.contextNum}>1.</span>
                Think of one thing weighing on you today — a worry, a feeling, a name, anything.
              </p>
              <p style={styles.contextLine}>
                <span style={styles.contextNum}>2.</span>
                Give it one word.
              </p>
              <p style={styles.contextLine}>
                <span style={styles.contextNum}>3.</span>
                Set it down here — anonymously — before we take our walk.
              </p>
            </div>

            <p style={styles.contextNote}>
              You don't have to explain it. No one will know it's yours.
            </p>

            <button style={styles.button} onClick={() => setStep("input")}>
              I'm ready → Set It Down
            </button>

            <p style={styles.footer}>Anonymous · My Inner Mind · Set It Down Saturday</p>
          </>
        )}

        {/* ── STEP 2: Word input ── */}
        {step === "input" && (
          <>
            <p style={styles.eyebrow}>Set It Down Saturday</p>
            <h1 style={styles.title}>What are you<br />setting down today?</h1>
            <p style={styles.subtitle}>
              One word. No name. No explanation.<br />Just let it go.
            </p>

            <div style={styles.formArea}>
              <div style={styles.inputWrapper}>
                <input
                  type="text"
                  value={word}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="one word..."
                  style={styles.input}
                  disabled={status === "submitting"}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <span style={styles.charCount}>{charCount}/40</span>
              </div>

              {status === "error" && (
                <p style={styles.errorMsg}>Something went wrong. Try again.</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!word.trim() || status === "submitting"}
                style={{
                  ...styles.button,
                  opacity: !word.trim() || status === "submitting" ? 0.4 : 1,
                }}
              >
                {status === "submitting" ? "Setting it down..." : "Set It Down ↓"}
              </button>

              <button onClick={() => setStep("context")} style={styles.backBtn}>
                ← Back
              </button>
            </div>

            <p style={styles.footer}>Anonymous · My Inner Mind</p>
          </>
        )}

        {/* ── STEP 3: Success ── */}
        {step === "success" && (
          <>
            <div style={styles.successIcon}>🍃</div>
            <h1 style={styles.successTitle}>It's set down.</h1>
            <p style={styles.successSub}>
              You don't have to carry it on the walk.<br />
              Just breathe, move, and be here.
            </p>
            <p style={styles.successEncourage}>
              Now go enjoy the walk. 🌿
            </p>
            <button onClick={() => setStep("input")} style={styles.ghostButton}>
              Set down another word
            </button>
            <p style={styles.footer}>Anonymous · My Inner Mind · Set It Down Saturday</p>
          </>
        )}

      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PURPLE = "#2d1b4e";
const LAVENDER = "#c4b5f4";
const ACCENT = "#9d7fe0";

const styles = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(160deg, ${PURPLE} 0%, #1a0f36 60%, #0f0820 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "'Georgia', serif",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow1: {
    position: "absolute",
    top: "-10%",
    left: "-10%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(157,127,224,0.12) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgGlow2: {
    position: "absolute",
    bottom: "-10%",
    right: "-10%",
    width: "60%",
    height: "60%",
    background: "radial-gradient(circle, rgba(196,181,244,0.07) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(196,181,244,0.15)",
    borderRadius: "24px",
    padding: "48px 36px",
    maxWidth: "460px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
  },
  iconRow: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  eyebrow: {
    color: LAVENDER,
    fontSize: "11px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    marginBottom: "12px",
    opacity: 0.75,
  },
  title: {
    color: "#fff",
    fontSize: "clamp(26px, 6vw, 36px)",
    fontWeight: "normal",
    lineHeight: 1.25,
    marginBottom: "24px",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "15px",
    lineHeight: 1.65,
    marginBottom: "28px",
  },

  // Context card steps
  contextBox: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(196,181,244,0.12)",
    borderRadius: "16px",
    padding: "20px 22px",
    marginBottom: "18px",
    textAlign: "left",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  contextLine: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "15px",
    lineHeight: 1.55,
    margin: 0,
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  contextNum: {
    color: LAVENDER,
    fontWeight: "normal",
    flexShrink: 0,
    marginTop: "1px",
    opacity: 0.8,
  },
  contextNote: {
    color: "rgba(255,255,255,0.35)",
    fontSize: "13px",
    lineHeight: 1.6,
    marginBottom: "28px",
    fontStyle: "italic",
  },

  // Input
  formArea: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    alignItems: "center",
  },
  inputWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "18px 48px 18px 20px",
    fontSize: "20px",
    fontFamily: "'Georgia', serif",
    color: "#fff",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(196,181,244,0.3)",
    borderRadius: "14px",
    outline: "none",
    textAlign: "center",
    letterSpacing: "2px",
    boxSizing: "border-box",
  },
  charCount: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "11px",
    color: "rgba(196,181,244,0.45)",
    fontFamily: "monospace",
  },
  errorMsg: {
    color: "#f87171",
    fontSize: "13px",
    margin: 0,
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.25)",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    padding: "4px 8px",
    letterSpacing: "0.5px",
  },

  // Shared button
  button: {
    background: `linear-gradient(135deg, ${ACCENT}, #7c5cbf)`,
    color: "#fff",
    border: "none",
    borderRadius: "50px",
    padding: "16px 40px",
    fontSize: "16px",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.5px",
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(157,127,224,0.3)",
    width: "100%",
    maxWidth: "320px",
  },

  // Success
  successIcon: {
    fontSize: "52px",
    marginBottom: "16px",
  },
  successTitle: {
    color: "#fff",
    fontSize: "30px",
    fontWeight: "normal",
    marginBottom: "12px",
    letterSpacing: "-0.3px",
  },
  successSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "15px",
    lineHeight: 1.65,
    marginBottom: "8px",
  },
  successEncourage: {
    color: LAVENDER,
    fontSize: "16px",
    marginBottom: "28px",
    opacity: 0.85,
  },
  ghostButton: {
    background: "transparent",
    border: "1px solid rgba(196,181,244,0.25)",
    color: LAVENDER,
    borderRadius: "50px",
    padding: "10px 28px",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    letterSpacing: "0.5px",
    marginBottom: "8px",
  },

  footer: {
    marginTop: "32px",
    color: "rgba(255,255,255,0.18)",
    fontSize: "10px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
  },
};
