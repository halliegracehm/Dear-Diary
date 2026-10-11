import { useState, useEffect, useRef, useCallback } from "react";
import * as React from "react";

const SUPABASE_URL = "https://xwhpyslvwnnbvyydimmg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aHB5c2x2d25uYnZ5eWRpbW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTkwOTIsImV4cCI6MjA4ODIzNTA5Mn0.bdxjpBNI6qEBFjSrRjBVCKqUU8oPBUL-8LzXKgxxJ4A";
const ADMIN_EMAIL = "halliegracehm@gmail.com";
const RC_API_KEY = "appl_fzxjgNhvORlWaNPqmUTHtIaVytR";

function isNativeApp(){return typeof window!=="undefined"&&typeof window.NativelyPurchases!=="undefined";}
async function rcLogin(u,e){return new Promise(r=>{if(!isNativeApp()){r({status:"FAILED"});return;}try{new window.NativelyPurchases().login(u,e,r);}catch(err){r({status:"FAILED"});}});}
async function rcPurchase(p){return new Promise(r=>{if(!isNativeApp()){r({status:"FAILED"});return;}try{new window.NativelyPurchases().purchasePackage(p,r);}catch(e){r({status:"FAILED"});}});}
async function rcRestore(){return new Promise(r=>{if(!isNativeApp()){r({status:"FAILED"});return;}try{new window.NativelyPurchases().restore(r);}catch(e){r({status:"FAILED"});}});}
async function rcGetPlan(userId){try{const r=await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,{headers:{"Authorization":`Bearer ${RC_API_KEY}`,"Content-Type":"application/json","X-Platform":"ios"}});if(!r.ok)return null;const d=await r.json();const s=d?.subscriber?.subscriptions||{};const now=new Date();const ok=k=>s[k]?.expires_date&&new Date(s[k].expires_date)>now;if(Object.keys(s).some(k=>k.includes("offtherecord")&&ok(k)))return"offtherecord";if(Object.keys(s).some(k=>k.includes("community")&&ok(k)))return"community";return"free";}catch{return null;}}

const store = {
  get(key, fallback = null) { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};
const persist = {
  get(key, fallback = null) { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} },
  remove(key) { try { localStorage.removeItem(key); } catch {} }
};

function SetItDownPage() {
  const [step, setStep] = useState("context");
  const [word, setWord] = useState("");
  const [status, setStatus] = useState("idle");
  const [charCount, setCharCount] = useState(0);
  const handleChange = (e) => { const val = e.target.value.replace(/\s/g, ""); if (val.length <= 40) { setWord(val); setCharCount(val.length); } };
  const handleSubmit = async () => {
    const trimmed = word.trim(); if (!trimmed) return; setStatus("submitting");
    try {
      const res = await fetch("/api/db", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: "set_it_down_submissions", method: "POST", prefer: "return=minimal", body: { word: trimmed.toLowerCase(), event_tag: "set-it-down-saturday" } }) });
      if (res.status === 503) { await sbDirect("set_it_down_submissions", { method: "POST", prefer: "return=minimal", body: JSON.stringify({ word: trimmed.toLowerCase(), event_tag: "set-it-down-saturday" }) }); setStep("success"); setStatus("idle"); setWord(""); setCharCount(0); return; }
      if (!res.ok) throw new Error("Failed");
      setStep("success"); setStatus("idle"); setWord(""); setCharCount(0);
    } catch (e) { console.error(e); setStatus("error"); }
  };
  const SID = {
    page: { minHeight:"100vh", background:"linear-gradient(175deg,#2b2443 0%,#3d3354 60%,#54476a 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"'Georgia',serif", position:"relative", overflow:"hidden" },
    glow1: { position:"absolute", top:"-10%", left:"-10%", width:"60%", height:"60%", background:"radial-gradient(circle,rgba(157,127,224,0.12) 0%,transparent 70%)", pointerEvents:"none" },
    glow2: { position:"absolute", bottom:"-10%", right:"-10%", width:"60%", height:"60%", background:"radial-gradient(circle,rgba(196,181,244,0.07) 0%,transparent 70%)", pointerEvents:"none" },
    card: { position:"relative", background:"rgba(255,255,255,0.04)", backdropFilter:"blur(12px)", border:"1px solid rgba(196,181,244,0.15)", borderRadius:"24px", padding:"48px 36px", maxWidth:"460px", width:"100%", textAlign:"center", boxShadow:"0 24px 60px rgba(0,0,0,0.45)" },
    eyebrow: { color:"#c4b5f4", fontSize:"11px", letterSpacing:"3px", textTransform:"uppercase", margin:"0 0 12px", opacity:0.75 },
    title: { color:"#fff", fontSize:"clamp(26px,6vw,36px)", fontWeight:"normal", lineHeight:1.25, marginBottom:"24px", letterSpacing:"-0.5px" },
    subtitle: { color:"rgba(255,255,255,0.5)", fontSize:"15px", lineHeight:1.65, marginBottom:"28px" },
    contextBox: { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(196,181,244,0.12)", borderRadius:"16px", padding:"20px 22px", marginBottom:"18px", textAlign:"left", display:"flex", flexDirection:"column", gap:"14px" },
    contextLine: { color:"rgba(255,255,255,0.75)", fontSize:"15px", lineHeight:1.55, margin:0, display:"flex", gap:"12px", alignItems:"flex-start" },
    contextNum: { color:"#c4b5f4", fontWeight:"normal", flexShrink:0, marginTop:"1px", opacity:0.8 },
    contextNote: { color:"rgba(255,255,255,0.35)", fontSize:"13px", lineHeight:1.6, marginBottom:"28px", fontStyle:"italic" },
    formArea: { display:"flex", flexDirection:"column", gap:"14px", alignItems:"center" },
    inputWrapper: { position:"relative", width:"100%" },
    input: { width:"100%", padding:"18px 48px 18px 20px", fontSize:"20px", fontFamily:"'Georgia',serif", color:"#fff", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(196,181,244,0.3)", borderRadius:"14px", outline:"none", textAlign:"center", letterSpacing:"2px", boxSizing:"border-box" },
    charCount: { position:"absolute", right:"14px", top:"50%", transform:"translateY(-50%)", fontSize:"11px", color:"rgba(196,181,244,0.45)", fontFamily:"monospace" },
    errorMsg: { color:"#f87171", fontSize:"13px", margin:0 },
    backBtn: { background:"transparent", border:"none", color:"rgba(255,255,255,0.25)", fontSize:"13px", fontFamily:"'Georgia',serif", cursor:"pointer", padding:"4px 8px", letterSpacing:"0.5px" },
    btn: { background:"linear-gradient(135deg,#a48fbf,#7f6a9a)", color:"#fff", border:"none", borderRadius:"50px", padding:"16px 40px", fontSize:"16px", fontFamily:"'Georgia',serif", letterSpacing:"0.5px", cursor:"pointer", boxShadow:"0 8px 24px rgba(157,127,224,0.3)", width:"100%", maxWidth:"320px" },
    ghostBtn: { background:"transparent", border:"1px solid rgba(196,181,244,0.25)", color:"#c4b5f4", borderRadius:"50px", padding:"10px 28px", fontSize:"13px", fontFamily:"'Georgia',serif", cursor:"pointer", letterSpacing:"0.5px", marginBottom:"8px" },
    footer: { marginTop:"32px", color:"rgba(255,255,255,0.18)", fontSize:"10px", letterSpacing:"1.5px", textTransform:"uppercase" },
  };
  return (
    <div style={SID.page}><div style={SID.glow1}/><div style={SID.glow2}/>
      <div style={SID.card}>
        {step==="context"&&<><div style={{fontSize:"40px",marginBottom:"16px"}}>🍃</div><p style={SID.eyebrow}>Set It Down Saturday</p><h1 style={SID.title}>Before we walk,<br/>we set it down.</h1><div style={SID.contextBox}><p style={SID.contextLine}><span style={SID.contextNum}>1.</span>Think of one thing weighing on you today.</p><p style={SID.contextLine}><span style={SID.contextNum}>2.</span>Give it one word.</p><p style={SID.contextLine}><span style={SID.contextNum}>3.</span>Set it down here, anonymously, before we take our walk.</p></div><p style={SID.contextNote}>You don't have to explain it. No one will know it's yours.</p><button style={SID.btn} onClick={()=>setStep("input")}>I'm ready → Set It Down</button><p style={SID.footer}>Anonymous · My Inner Mind</p></>}
        {step==="input"&&<><p style={SID.eyebrow}>Set It Down Saturday</p><h1 style={SID.title}>What are you<br/>setting down today?</h1><p style={SID.subtitle}>One word. No name. No explanation.<br/>Just let it go.</p><div style={SID.formArea}><div style={SID.inputWrapper}><input type="text" value={word} onChange={handleChange} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="one word..." style={SID.input} disabled={status==="submitting"} autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}/><span style={SID.charCount}>{charCount}/40</span></div>{status==="error"&&<p style={SID.errorMsg}>Something went wrong. Try again.</p>}<button onClick={handleSubmit} disabled={!word.trim()||status==="submitting"} style={{...SID.btn,opacity:!word.trim()||status==="submitting"?0.4:1}}>{status==="submitting"?"Setting it down...":"Set It Down ↓"}</button><button onClick={()=>setStep("context")} style={SID.backBtn}>← Back</button></div><p style={SID.footer}>Anonymous · My Inner Mind</p></>}
        {step==="success"&&<><div style={{fontSize:"52px",marginBottom:"16px"}}>🍃</div><h1 style={{color:"#fff",fontSize:"30px",fontWeight:"normal",marginBottom:"12px"}}>It's set down.</h1><p style={{color:"rgba(255,255,255,0.5)",fontSize:"15px",lineHeight:1.65,marginBottom:"8px"}}>You don't have to carry it on the walk.<br/>Just breathe, move, and be here.</p><p style={{color:"#c4b5f4",fontSize:"16px",marginBottom:"28px",opacity:0.85}}>Now go enjoy the walk. 🌿</p><button onClick={()=>setStep("input")} style={SID.ghostBtn}>Set down another word</button><div style={{marginTop:28,padding:"20px 22px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(196,181,244,0.15)",borderRadius:16,textAlign:"center"}}><p style={{color:"rgba(255,255,255,0.45)",fontSize:13,lineHeight:1.7,marginBottom:14,fontStyle:"italic",margin:"0 0 14px"}}>Want to keep journaling? My Inner Mind is a free space to write, reflect, and grow. 🌿</p><a href="https://myinnermind.halliewho.com" style={{display:"inline-block",background:"linear-gradient(135deg,#a48fbf,#7f6a9a)",color:"#fff",borderRadius:"50px",padding:"11px 28px",fontSize:13,fontFamily:"'Georgia',serif",textDecoration:"none",letterSpacing:"0.5px",boxShadow:"0 6px 20px rgba(157,127,224,0.25)"}}>Start Journaling Free →</a></div><p style={SID.footer}>Anonymous · My Inner Mind</p><div style={{marginTop:16}}><a href="/" style={{color:"rgba(196,181,244,0.5)",fontSize:12,textDecoration:"none"}}>← Back to My Inner Mind</a></div></>}
      </div>
    </div>
  );
}

const HALLIE_PROMPTS = [
  {week:1,prompt:"What's one thing you've been carrying lately that you're ready to set down?",note:"From Hallie 🌿"},
  {week:2,prompt:"Where in your life are you being too hard on yourself right now?",note:"From Hallie 🌿"},
  {week:3,prompt:"What does rest actually look like for you? Not what it's supposed to look like.",note:"From Hallie 🌿"},
  {week:4,prompt:"Think of someone who has shaped you quietly. What did they give you?",note:"From Hallie 🌿"},
  {week:5,prompt:"What version of yourself are you most proud of? What made you that way?",note:"From Hallie 🌿"},
  {week:6,prompt:"If your body could talk right now, what would it say it needs?",note:"From Hallie 🌿"},
  {week:7,prompt:"What's a chapter of your life you haven't given yourself credit for surviving?",note:"From Hallie 🌿"},
  {week:8,prompt:"What are you currently growing toward, even if it's slow?",note:"From Hallie 🌿"},
  {week:9,prompt:"What boundary have you been afraid to set? What would change if you did?",note:"From Hallie 🌿"},
  {week:10,prompt:"What's a feeling you keep pushing away? What would happen if you just let it in?",note:"From Hallie 🌿"},
  {week:11,prompt:"Describe a moment recently when you felt truly like yourself.",note:"From Hallie 🌿"},
  {week:12,prompt:"What's the kindest thing you could do for yourself this week?",note:"From Hallie 🌿"},
];

function getTimeGreeting(){const h=new Date().getHours();if(h>=5&&h<12)return{greeting:"Good morning. 🌸",sub:"What's on your heart before the day takes over?"};if(h>=12&&h<17)return{greeting:"Hey, you. 🌿",sub:"How are you actually doing right now?"};if(h>=17&&h<20)return{greeting:"You made it through. 🍂",sub:"The day is winding down. How are you feeling?"};return{greeting:"Still up? 🌙",sub:"Sometimes the quietest hours hold the most honest thoughts."};}
const HALLIE_DESK_NOTES=["Real talk: we apologize for taking up space even in our own journals. You don't have to do that here. Write messy. Write honest. Write the version nobody else gets to see. 🌿","Healing isn't linear. Neither is growth. Some weeks you'll write every day. Some weeks life gets loud and you won't. Both count. You're still in it either way. 💛","The entries that feel too small to write, like 'I was tired today. I made tea. I just existed.', those are the ones you'll treasure most someday. Don't edit your life. Just write it. 🌿","I built this because I needed it. A space that felt soft. That didn't rush me. That felt like a friend sitting across from me who actually gets it. I hope it feels that way for you too. 💌","This week, try writing without a prompt. Just open a new entry and let whatever comes, come. The first sentence is always the hardest. After that, you'll surprise yourself. ✨","You are not behind. Not in your healing, not in your life, not in any of it. You're exactly where you're supposed to be. Now write about it. 🌸","The feelings we keep avoiding are usually the ones that need the most room. What have you been dancing around lately? Today might be the day you finally say it. 🌿"];
function getWeeklyDeskNote(){const w=Math.ceil((new Date()-new Date(new Date().getFullYear(),0,1))/(7*24*60*60*1000));return HALLIE_DESK_NOTES[w%HALLIE_DESK_NOTES.length];}
function getWeeklyHalliePrompt(){const w=Math.ceil((new Date()-new Date(new Date().getFullYear(),0,1))/(7*24*60*60*1000));return HALLIE_PROMPTS[(w-1)%HALLIE_PROMPTS.length];}

function spawnConfetti(){const emojis=["🌸","✨","🌿","💛","🌟","💫","🍃","🌺","⭐","💕"];for(let i=0;i<18;i++){setTimeout(()=>{const el=document.createElement("div");el.textContent=emojis[Math.floor(Math.random()*emojis.length)];el.style.cssText=`position:fixed;pointer-events:none;z-index:9999;font-size:${14+Math.random()*18}px;left:${10+Math.random()*80}%;top:${20+Math.random()*40}%;transition:all ${0.8+Math.random()*1}s ease-out;opacity:1;transform:translate(0,0) rotate(0deg)`;document.body.appendChild(el);requestAnimationFrame(()=>{el.style.transform=`translate(${-80+Math.random()*160}px,${-120-Math.random()*120}px) rotate(${-180+Math.random()*360}deg)`;el.style.opacity="0";});setTimeout(()=>el.remove(),2000);},i*60);}}

// Session token from /api/auth. The server decides what each signed-in person can read or change.
const TOKEN_KEY="myinnermind_token";
function getToken(){try{return localStorage.getItem(TOKEN_KEY)||"";}catch{return "";}}
function setToken(t){try{t?localStorage.setItem(TOKEN_KEY,t):localStorage.removeItem(TOKEN_KEY);}catch{}}
async function authCall(action,payload={}){const t=getToken();const res=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json",...(t?{Authorization:`Bearer ${t}`}:{})},body:JSON.stringify({action,...payload})});let data={};try{data=await res.json();}catch{}if(res.status===401&&data?.error==="signed_out")window.dispatchEvent(new Event("mim-signed-out"));return{ok:res.ok,status:res.status,...data};}
async function sbDirect(path,options={}){const res=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{method:options.method||"GET",headers:{"apikey":SUPABASE_KEY,"Authorization":`Bearer ${SUPABASE_KEY}`,"Content-Type":"application/json","Prefer":options.prefer||"return=representation"},body:options.body});if(res.status===204)return[];return res.json();}
async function sbQuery(path,options={}){try{const t=getToken();const res=await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json",...(t?{Authorization:`Bearer ${t}`}:{})},body:JSON.stringify({path,method:options.method||"GET",body:options.body?JSON.parse(options.body):undefined,prefer:options.prefer||"return=representation"})});let data=null;if(res.status===503){data=await sbDirect(path,options);}else{if(res.status===401){window.dispatchEvent(new Event("mim-signed-out"));return[];}const text=await res.text();data=text?JSON.parse(text):[];}if(data===null||data===undefined)return[];if(data?.code||data?.error){console.error("Database error:",data);return[];}return data;}catch(e){console.error("Network error:",e);return[];}}
async function sbGet(table,filters=""){return sbQuery(`${table}?${filters}`);}
async function sbInsert(table,data){return sbQuery(table,{method:"POST",body:JSON.stringify(data)});}
async function sbUpdate(table,filters,data){return sbQuery(`${table}?${filters}`,{method:"PATCH",body:JSON.stringify(data)});}
async function sbDelete(table,filters){return sbQuery(`${table}?${filters}`,{method:"DELETE",prefer:"return=minimal"});}
async function sbUpsert(table,data){return sbQuery(table,{method:"POST",body:JSON.stringify(data),prefer:"resolution=merge-duplicates,return=representation"});}

const MOODS=[{emoji:"🌟",label:"Radiant",color:"#f59e0b"},{emoji:"😊",label:"Happy",color:"#84cc16"},{emoji:"😌",label:"Calm",color:"#06b6d4"},{emoji:"😐",label:"Neutral",color:"#94a3b8"},{emoji:"😔",label:"Low",color:"#8b5cf6"},{emoji:"😢",label:"Sad",color:"#3b82f6"},{emoji:"😤",label:"Frustrated",color:"#ef4444"}];
const TAG_OPTIONS=["personal","work","gratitude","dreams","health","family","travel","ideas"];
const TAG_COLORS={personal:"#c8895a",work:"#7a8c6e",gratitude:"#c4956a",dreams:"#9b7eb8",health:"#6b9e78",family:"#c07060",travel:"#5b8fa8",ideas:"#b8955a"};
const PLANS={free:{name:"Free",price:"$0/mo",color:"#94a3b8",features:["30 entries/mo","Basic moods & tags","1 Hallie prompt/mo","Intro journaling experience"]},community:{name:"Community",price:"$6.99/mo",color:"#c8895a",features:["Unlimited entries","Full community access","All Hallie prompts","Streak rewards","Story of the Month"]},offtherecord:{name:"Off the Record",price:"$12.99/mo",color:"#7a4a1e",features:["Everything in Community","Hallie's Insight","PDF export","Deeper guided prompts","Challenge access","Private intentional space"]}};
const THEMES={original:{name:"Original",icon:"🌿",bg:"linear-gradient(180deg,#eef0ec 0%,#f3eee4 30%,#f5ebdc 65%,#efe2cf 100%)",header:"rgba(243,242,236,0.88)",text:"#5a2e0e",subtext:"#b08060",accent:"#c8895a",accentDark:"#7a4a1e",border:"rgba(200,137,90,0.15)"},midnight:{name:"Midnight",icon:"🌙",bg:"linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",header:"rgba(20,20,40,0.95)",text:"#e8d5b0",subtext:"#a08060",accent:"#d4956a",accentDark:"#f0c080",border:"rgba(212,149,106,0.2)"},plum:{name:"Plum & Rose",icon:"💜",bg:"linear-gradient(160deg,#2d1b3d 0%,#3d1a3a 50%,#4a1942 100%)",header:"rgba(40,15,45,0.95)",text:"#f0d0e8",subtext:"#c090b0",accent:"#e0709a",accentDark:"#f0a0c0",border:"rgba(200,80,140,0.25)"}};
const AFFIRMATIONS=["I am safe in this moment.","I don't have to solve everything right now.","I am allowed to slow down.","I can take this one breath at a time.","My feelings are valid, even when they're heavy.","I am becoming someone I'm proud of.","I trust myself to handle what comes.","I don't need permission to take up space.","I am enough, even on my hardest days.","I honor the person I'm growing into.","I am allowed to outgrow people and patterns.","Healing doesn't have a deadline.","I am learning, not failing.","Every small step still counts.","I release what no longer serves me.","I show up for my life, even when it's hard.","I am building something meaningful.","My consistency matters more than perfection.","I can start again as many times as I need.","I am capable of creating the life I want.","No is a complete sentence.","I protect my peace without guilt.","I don't have to explain my boundaries.","I choose what I allow into my life.","I deserve relationships that feel safe and mutual.","I am doing the best I can with what I have.","I speak to myself with kindness.","I don't need to be perfect to be worthy.","I am allowed to rest without earning it.","I hold space for all parts of me."];
function getDailyAffirmation(){return AFFIRMATIONS[Math.floor(Date.now()/(24*60*60*1000))%AFFIRMATIONS.length];}
const NIGHT_PROMPTS=["What's one thing you're leaving in today that you don't want to carry into tomorrow?","How does your body feel right now, honestly?","What would you tell yourself at the start of today if you could go back?","What went unsaid today that you want to say here?","What are you grateful for that you didn't get to acknowledge today?","What does quiet feel like for you tonight?","If today had a color, what would it be and why?","What do you need more of right now: rest, connection, or solitude?"];
function getNightPrompt(){return NIGHT_PROMPTS[Math.floor(Date.now()/(24*60*60*1000))%NIGHT_PROMPTS.length];}
function isNightTime(){return new Date().getHours()>=20;}
function getTodayStr(){
  const d=new Date();
  const year=d.getFullYear();
  const month=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}
function formatDate(d){
  const date=new Date(d);
  return date.toLocaleDateString("en-US",{
    weekday:"long",
    year:"numeric",
    month:"long",
    day:"numeric",
    timeZone:"America/New_York"
  });
}
function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return String(h);}
function calcStreak(entries){if(!entries?.length)return 0;const dates=[...new Set(entries.map(e=>e.date))].sort().reverse();let streak=0,check=getTodayStr();for(const d of dates){if(d===check){streak++;check=prevDay(check);}else if(d<check)break;}return streak;}
function prevDay(dateStr){const d=new Date(dateStr);d.setDate(d.getDate()-1);return d.toISOString().split("T")[0];}
// Gentle consistency: count the days someone showed up, never punish a missed day
function daysThisMonth(entries){const m=getTodayStr().slice(0,7);return new Set((entries||[]).filter(e=>e.date?.startsWith(m)).map(e=>e.date)).size;}
function bestMonthDays(entries){const by={};(entries||[]).forEach(e=>{if(!e.date)return;const m=e.date.slice(0,7);(by[m]=by[m]||new Set()).add(e.date);});return Math.max(0,...Object.values(by).map(x=>x.size));}
function streakReward(days){if(days>=14)return{label:"Showing up beautifully 🏆",discount:"GRATEFUL20",pct:"20%"};if(days>=10)return{label:"Finding your rhythm ✨",discount:"GRATEFUL15",pct:"15%"};if(days>=7)return{label:"Gently consistent 🌱",discount:"GRATEFUL10",pct:"10%"};return null;}
function exportToPDF(entries,username){const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#3a2010;background:#fffdf8}h1{font-size:28px;color:#7a4a1e;border-bottom:2px solid #c8895a;padding-bottom:12px}.entry{margin:28px 0;padding:24px;border:1px solid #e8d0b0;border-radius:12px;background:#fdf8f0}.meta{font-size:13px;color:#b08060;margin-bottom:6px}.title{font-size:20px;font-weight:bold;color:#5a2e0e;margin-bottom:10px}.content{font-size:15px;line-height:1.85;font-style:italic;white-space:pre-wrap}.tag{display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;margin:2px;background:#f0e0c8;color:#8a5020}</style></head><body><h1>🌿 ${username}'s Journal</h1><p style="color:#b08060">Exported ${new Date().toLocaleDateString()}</p>${entries.map(e=>`<div class="entry"><div class="meta">${formatDate(e.date)}${e.mood?` · ${e.mood.emoji} ${e.mood.label}`:""}</div><div class="title">${e.title||"Untitled"}</div><div class="content">${(e.content||"").replace(/</g,"&lt;")}</div>${e.tags?.length?`<div style="margin-top:12px">${e.tags.map(t=>`<span class="tag">${t}</span>`).join("")}</div>`:""}</div>`).join("")}</body></html>`;try{const blob=new Blob([html],{type:"text/html"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`${username}-journal.html`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);}catch{alert("To save your journal, please use a desktop browser.");}}

async function callClaude(messages,system=""){try{const res=await fetch("/api/ai-completion",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages,system})});const data=await res.json();return data.text||"";}catch(e){console.error("callClaude error:",e);return "";}}
async function getAIInsight(entry){return callClaude([{role:"user",content:`Journal entry titled "${entry.title}":\n\n${entry.content}\n\nMood: ${entry.mood?.label||"not set"}`}],"You are a warm, thoughtful journaling companion. In 3-4 sentences, offer a gentle, insightful reflection on this journal entry. Be encouraging and kind. Do not ask questions. Write in second person.");}
async function getAIPrompt(){const day=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});return callClaude([{role:"user",content:`Today is ${day}. Give me a single thoughtful journaling prompt. Just the prompt itself, no preamble.`}],"You generate warm, introspective daily journaling prompts. 1-2 sentences max.");}

const COMMUNITY_TIER_CONFIG={free:{label:"Free",color:"#7a9e7e",bg:"rgba(122,158,126,0.08)",border:"rgba(122,158,126,0.2)"},community:{label:"Community",color:"#c8895a",bg:"rgba(200,137,90,0.08)",border:"rgba(200,137,90,0.2)"},premium:{label:"Off the Record",color:"#9b7eb8",bg:"rgba(155,126,184,0.08)",border:"rgba(155,126,184,0.2)"}};
const COMMUNITY_TIER_ORDER={free:0,community:1,premium:2};
const COMMUNITY_MOOD_TAGS=[{emoji:"🌸",label:"Blooming"},{emoji:"🌱",label:"Growing"},{emoji:"☁️",label:"Cloudy"},{emoji:"🔥",label:"Fired Up"},{emoji:"🌊",label:"Overwhelmed"},{emoji:"✨",label:"Grateful"},{emoji:"💪",label:"Strong"},{emoji:"🌙",label:"Tired"},{emoji:"😂",label:"Joyful"},{emoji:"🙏",label:"At Peace"}];
const COMMUNITY_REACTIONS=["❤️","🙌","✨","🫂","💛","🌿"];
const DAILY_PROMPTS={"daily-checkin":"How are you showing up today? What's on your heart right now?","gratitude":"Name three things, big or small, that you're grateful for today.","big-wins":"What's a win you had recently that you haven't celebrated yet?","healing":"What's one thing you're releasing this week?","morning":"What does your ideal morning look like? What did you do today?","anxiety":"What's something that's been living in your head rent-free? Let it out here.","manifesting":"Write it like it's already happened. What are you calling in?","motherhood":"What's a moment with your kid(s) recently that made your heart full?","single":"What's something you love about your life right now, just as it is?","career":"What are you building? What step are you taking this week?"};
const AMBIENT_SOUNDS=[{id:"birds",name:"Birds Chirping",icon:"🐦",type:"birds"},{id:"leaves",name:"Leaves Rustling",icon:"🍃",type:"leaves"},{id:"waves",name:"Waves Crashing",icon:"🌊",type:"waves"},{id:"static",name:"White Noise",icon:"📻",type:"static"}];
const ambientStopRef={current:null};

export default function App() {
  const [screen,setScreen]=useState("splash");
  const [currentUser,setCurrentUser]=useState(null);
  const [authMode,setAuthMode]=useState("login");
  const [authForm,setAuthForm]=useState({username:"",email:"",password:""});
  const [authError,setAuthError]=useState("");
  const [authLoading,setAuthLoading]=useState(false);
  const [pwaPrompt,setPwaPrompt]=useState(null);

  useEffect(()=>{const h=()=>{store.remove("myinnerminduser");setToken("");setCurrentUser(null);setAuthMode("login");setAuthError("Please sign in again. 🌿");setScreen("auth");};window.addEventListener("mim-signed-out",h);return()=>window.removeEventListener("mim-signed-out",h);},[]);
  useEffect(()=>{const handler=(e)=>{e.preventDefault();setPwaPrompt(e);};window.addEventListener("beforeinstallprompt",handler);return()=>window.removeEventListener("beforeinstallprompt",handler);},[]);

useEffect(()=>{
  if(window.location.pathname==="/set-it-down"){
    setScreen("setitdown");
    return;
  }
  const shared=window.location.pathname.match(/^\/c\/([a-z0-9-]+)/i);
  if(shared){try{sessionStorage.setItem("mim_pending_challenge",shared[1]);}catch{}if(!store.get("myinnerminduser")||!getToken()){setScreen("challenge");return;}}

  const params=new URLSearchParams(window.location.search);
  const justUpgraded=params.get("upgraded")==="true";
  const saved=store.get("myinnerminduser");

  if(!saved||!getToken()){
    if(saved){store.remove("myinnerminduser");setAuthError("For your privacy, we've upgraded how accounts are protected. Please sign in once more. 🌿");setAuthForm(f=>({...f,email:saved.email||""}));setTimeout(()=>{setAuthMode("login");setScreen("auth");},1800);return;}
    setTimeout(()=>setScreen("landing"),1800);
    return;
  }

  authCall("me")
    .then(result=>{
      if(result.status===401){store.remove("myinnerminduser");setToken("");setAuthMode("login");setScreen("auth");return;}
      const fresh=result?.user||saved;

      store.set("myinnerminduser",fresh);
      setCurrentUser(fresh);
      setScreen("app");

      if(justUpgraded){
        window.history.replaceState({}, "", "/");
      }
    })
    .catch(e=>{
      console.error("Session refresh failed:",e);
      setCurrentUser(saved);
      setScreen("app");
    });
},[]);
  async function handleAuth(){
    setAuthError("");setAuthLoading(true);
    const email=authForm.email.toLowerCase().trim();
    try{
      if(authMode==="register"){
        if(!authForm.username||!email||!authForm.password){setAuthError("All fields are required.");return;}
        if(authForm.password.length<6){setAuthError("Password must be at least 6 characters.");return;}
        const r=await authCall("register",{email,username:authForm.username,password:authForm.password});
        if(r.status===503){const existing=await sbGet("users",`email=eq.${encodeURIComponent(email)}`);if(existing?.length>0){setAuthError("An account with that email already exists.");return;}const result=await sbInsert("users",{email,username:authForm.username,password_hash:hashStr(authForm.password),plan:"free"});if(result?.length>0){r.ok=true;r.user=result[0];r.token="legacy";}}
        if(!r.ok&&r.error){setAuthError(r.error);return;}
        if(r.user&&r.token){const u=r.user;setToken(r.token);store.set("myinnerminduser",u);fetch("/api/add-to-mailchimp",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,name:authForm.username})}).catch(()=>{});setCurrentUser(u);setScreen("onboarding");}
        else{setAuthError("Something went wrong. Please try again.");}
      }else{
        if(!email||!authForm.password){setAuthError("Email and password are required.");return;}
        const r=await authCall("login",{email,password:authForm.password});
        if(r.status===503){const result=await sbGet("users",`email=eq.${encodeURIComponent(email)}`);if(!result?.length){setAuthError("No account found with that email.");return;}if(result[0].password_hash!==hashStr(authForm.password)){setAuthError("Incorrect password.");return;}r.ok=true;r.user=result[0];r.token="legacy";}
        if(!r.ok||!r.user||!r.token){setAuthError(r.error||"Something went wrong. Please try again.");return;}
        const user=r.user;setToken(r.token);
        store.set("myinnerminduser",user);setCurrentUser(user);setScreen("app");
        if(isNativeApp())rcLogin(user.email,user.email).then(()=>{});
      }
    }catch(e){setAuthError("Connection error. Please try again.");}
    finally{setAuthLoading(false);}
  }

  function handleLogout(){
    if(ambientStopRef.current){ambientStopRef.current();ambientStopRef.current=null;}
    store.remove("myinnerminduser");setToken("");setCurrentUser(null);setScreen("landing");
    setAuthForm({username:"",email:"",password:""});
    if(window.location.pathname!=="/"){window.history.replaceState({},"","/");}
  }

  async function upgradePlan(plan){
    if(!currentUser)return;
    const r=await authCall("sync_plan");
    const updated=r.user||currentUser;store.set("myinnerminduser",updated);setCurrentUser(updated);
  }

  if(screen==="splash")return <Splash/>;
  if(screen==="setitdown")return <SetItDownPage/>;
  if(screen==="challenge"){const id=(()=>{try{return sessionStorage.getItem("mim_pending_challenge");}catch{return null;}})();return <PublicChallengePage id={id} onStart={()=>{setAuthMode("register");setAuthError("");setScreen("auth");}} onSignIn={()=>{setAuthMode("login");setAuthError("");setScreen("auth");}}/>;}
  if(screen==="landing")return <LandingScreen onGetStarted={()=>{setAuthMode("register");setScreen("auth");}} onSignIn={()=>{setAuthMode("login");setScreen("auth");}}/>;
  if(screen==="onboarding")return <OnboardingScreen user={currentUser} onDone={()=>setScreen("app")}/>;
  if(screen==="auth")return <AuthScreen mode={authMode} form={authForm} error={authError} loading={authLoading} pwaPrompt={pwaPrompt} onChange={f=>setAuthForm(p=>({...p,...f}))} onSubmit={handleAuth} onToggle={()=>{setAuthMode(m=>m==="login"?"register":"login");setAuthError("");}}/>;
  return <JournalApp user={currentUser} onLogout={handleLogout} onUpgradePlan={upgradePlan} pwaPrompt={pwaPrompt} onPwaInstalled={()=>setPwaPrompt(null)}/>;
}

function Splash(){return(<div style={{...S.page,justifyContent:"center",alignItems:"center",flexDirection:"column",gap:14}}><div style={S.texture}/><div style={{fontSize:64,animation:"float 2.5s ease-in-out infinite"}}>🌿</div><div style={{fontFamily:"'Lora',serif",fontSize:36,color:"#7a4a1e",fontWeight:600,textAlign:"center"}}>My Inner Mind</div><div style={{color:"#b08060",fontSize:15,fontStyle:"italic"}}>Reflections & Growth</div><style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}*{box-sizing:border-box;margin:0;padding:0}`}</style></div>);}

function PWABanner({prompt,onDismiss}){const [installing,setInstalling]=useState(false);if(!prompt)return null;async function handleInstall(){setInstalling(true);prompt.prompt();const result=await prompt.userChoice;if(result.outcome==="accepted")onDismiss();setInstalling(false);}return(<div style={{position:"fixed",bottom:20,left:"50%",transform:"translateX(-50%)",zIndex:999,width:"calc(100% - 32px)",maxWidth:440,background:"linear-gradient(135deg,#7a4a1e,#c8895a)",borderRadius:20,padding:"14px 20px",boxShadow:"0 8px 32px rgba(120,70,20,0.35)",display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:32}}>🌿</span><div style={{flex:1}}><div style={{color:"#fff",fontWeight:700,fontSize:14,fontFamily:"'Nunito',sans-serif"}}>Add to your Home Screen</div><div style={{color:"rgba(255,255,255,0.8)",fontSize:12,marginTop:2}}>Open My Inner Mind like an app, anytime</div></div><div style={{display:"flex",gap:8}}><button onClick={onDismiss} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:12,padding:"7px 12px",color:"#fff",fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Later</button><button onClick={handleInstall} disabled={installing} style={{background:"#fff",border:"none",borderRadius:12,padding:"7px 14px",color:"#7a4a1e",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{installing?"...":"Install"}</button></div></div>);}

function PasswordInput({style,...props}){const [show,setShow]=useState(false);return(<div style={{position:"relative"}}><input {...props} type={show?"text":"password"} autoCapitalize="none" autoCorrect="off" spellCheck={false} style={{...style,paddingRight:52}}/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"} style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",width:40,height:36,border:"none",background:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"#b08060",padding:0}}>{show?(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18"/><path d="M10.6 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1"/><path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>):(<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>)}</button></div>);}

// ── SHEET (bottom sheet used for Support and Set It Down) ──
function PageHeader({kicker,title,sub,right}){return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",gap:12,padding:"6px 0 2px"}}><div style={{minWidth:0}}>{kicker&&<div style={{fontSize:11,letterSpacing:"2.2px",textTransform:"uppercase",color:"rgba(61,42,26,0.6)",fontWeight:700,marginBottom:10}}>{kicker}</div>}<h1 style={{fontFamily:"'Lora',serif",fontWeight:600,fontSize:32,lineHeight:1.15,color:"#3d2a1a",margin:0,letterSpacing:"-0.3px"}}>{title}</h1>{sub&&<p style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:15.5,lineHeight:1.55,color:"rgba(61,42,26,0.66)",margin:"8px 0 0"}}>{sub}</p>}</div>{right}</div>);}
function Sheet({onClose,children,dark}){
  useEffect(()=>{const k=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",k);const prev=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{window.removeEventListener("keydown",k);document.body.style.overflow=prev;};},[]);
  return(<div role="dialog" aria-modal="true" onClick={onClose} style={{position:"fixed",inset:0,zIndex:500,background:"rgba(40,24,12,0.42)",backdropFilter:"blur(3px)",WebkitBackdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
    <style>{`@keyframes mimSheetUp{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}`}</style>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:520,maxHeight:"92vh",overflowY:"auto",background:dark?"linear-gradient(175deg,#2b2443 0%,#3d3354 60%,#54476a 100%)":"#fffaf3",borderRadius:"24px 24px 0 0",padding:"14px 22px calc(26px + env(safe-area-inset-bottom))",boxShadow:"0 -10px 40px rgba(40,24,12,0.25)",animation:"mimSheetUp .28s ease-out",fontFamily:"'Nunito',sans-serif"}}>
      <div style={{width:40,height:4,borderRadius:2,background:dark?"rgba(255,255,255,0.25)":"rgba(122,74,30,0.2)",margin:"0 auto 14px"}}/>
      {children}
    </div>
  </div>);
}

// ── NEED SUPPORT NOW ──
function SupportSheet({onClose,onBreathe,onSetItDown}){
  const row={display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:16,background:"rgba(255,255,255,0.9)",border:"1px solid rgba(200,137,90,0.18)",textDecoration:"none",color:"#5a2e0e"};
  const label={fontWeight:800,fontSize:15};const sub={fontSize:12,color:"#9a7050",marginTop:2,lineHeight:1.4};
  return(<Sheet onClose={onClose}>
    <h2 style={{fontFamily:"'Lora',serif",fontSize:24,color:"#5a2e0e",fontWeight:600,margin:"0 0 6px"}}>You don't have to hold this alone.</h2>
    <p style={{fontSize:14,color:"#9a7050",lineHeight:1.6,margin:"0 0 18px"}}>If you're thinking about hurting yourself or you're in crisis, reach out right now. Real people are there 24/7, for free.</p>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <a href="tel:988" style={{...row,background:"linear-gradient(135deg,rgba(155,126,184,0.16),rgba(200,137,90,0.1))",border:"1px solid rgba(155,126,184,0.35)"}}><span style={{fontSize:26}}>📞</span><div style={{flex:1}}><div style={label}>Call 988</div><div style={sub}>Suicide &amp; Crisis Lifeline (US). Call any time.</div></div><span style={{color:"#9b7eb8",fontWeight:800}}>›</span></a>
      <a href="sms:988" style={row}><span style={{fontSize:26}}>💬</span><div style={{flex:1}}><div style={label}>Text 988</div><div style={sub}>Same Lifeline, by text.</div></div><span style={{color:"#c8895a",fontWeight:800}}>›</span></a>
      <a href="sms:741741&body=HOME" style={row}><span style={{fontSize:26}}>✉️</span><div style={{flex:1}}><div style={label}>Text HOME to 741741</div><div style={sub}>Crisis Text Line. A trained counselor texts back.</div></div><span style={{color:"#c8895a",fontWeight:800}}>›</span></a>
      <a href="tel:911" style={{...row,border:"1px solid rgba(192,80,64,0.3)"}}><span style={{fontSize:26}}>🚨</span><div style={{flex:1}}><div style={{...label,color:"#a03a2a"}}>In danger right now? Call 911</div><div style={sub}>Or go to your nearest emergency room.</div></div><span style={{color:"#a03a2a",fontWeight:800}}>›</span></a>
      <a href="https://findahelpline.com" target="_blank" rel="noreferrer" style={row}><span style={{fontSize:26}}>🌍</span><div style={{flex:1}}><div style={label}>Outside the US?</div><div style={sub}>findahelpline.com lists free helplines in your country.</div></div><span style={{color:"#c8895a",fontWeight:800}}>›</span></a>
    </div>
    <div style={{fontSize:11,fontWeight:800,color:"#b08060",textTransform:"uppercase",letterSpacing:"1px",margin:"22px 0 10px"}}>Not in crisis, just heavy?</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <button onClick={onBreathe} style={{...row,justifyContent:"center",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:14}}>🌬️ Breathe with me</button>
      <button onClick={onSetItDown} style={{...row,justifyContent:"center",cursor:"pointer",fontFamily:"inherit",fontWeight:800,fontSize:14}}>🪨 Set it down</button>
    </div>
    <p style={{fontSize:11,color:"#b08060",textAlign:"center",fontStyle:"italic",marginTop:16,lineHeight:1.5}}>My Inner Mind is a space for reflection, not a replacement for professional care.</p>
    <button onClick={onClose} style={{...S.ghostBtn,width:"100%",marginTop:8}}>Close</button>
  </Sheet>);
}

// ── SET IT DOWN (in the app, anonymous, goes to Hallie) ──
function SetItDownPanel({onDone,compact}){
  const [text,setText]=useState("");const [status,setStatus]=useState("idle");
  async function send(){const t=text.trim();if(!t)return;setStatus("sending");try{const res=await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:"set_it_down_submissions",method:"POST",prefer:"return=minimal",body:{word:t,event_tag:"app"}})});if(!res.ok)throw new Error("failed");setStatus("sent");setText("");}catch{setStatus("error");}}
  const ink="#f6f1ea",muted="rgba(246,241,234,0.62)",accent="#c4b5f4";
  if(status==="sent")return(<div style={{textAlign:"center",padding:compact?"8px 0":"18px 0"}}>
    <style>{`@keyframes mimFloatAway{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-60px) scale(.6);opacity:0}}`}</style>
    <div style={{fontSize:40,animation:"mimFloatAway 2.4s ease-out forwards"}}>🪨</div>
    <h3 style={{fontFamily:"'Lora',serif",fontSize:22,color:ink,fontWeight:600,margin:"4px 0 8px"}}>You set it down.</h3>
    <p style={{fontSize:14,color:muted,lineHeight:1.6,margin:"0 0 18px"}}>It's not yours to carry right now. Hallie receives every one, anonymously. Take one slow breath before you go.</p>
    <div style={{display:"flex",gap:8,justifyContent:"center"}}><button onClick={()=>setStatus("idle")} style={{background:"transparent",border:`1px solid ${accent}55`,color:accent,borderRadius:30,padding:"9px 18px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Set down something else</button>{onDone&&<button onClick={onDone} style={{background:"linear-gradient(135deg,#a48fbf,#7f6a9a)",border:"none",color:"#fff",borderRadius:30,padding:"9px 20px",fontSize:13,fontWeight:700,cursor:"pointer"}}>Done</button>}</div>
  </div>);
  return(<div>
    {!compact&&<div style={{fontSize:11,letterSpacing:"2.5px",textTransform:"uppercase",color:accent,opacity:0.85,marginBottom:10,fontWeight:700}}>Set It Down</div>}
    <h3 style={{fontFamily:"'Lora',serif",fontSize:compact?19:24,color:ink,fontWeight:600,margin:"0 0 8px",lineHeight:1.3}}>What are you ready to set down?</h3>
    <p style={{fontSize:13.5,color:muted,lineHeight:1.6,margin:"0 0 16px"}}>A word, a worry, a name, a feeling. Wherever you are, you can put it down here. It goes to Hallie with no name attached, and it doesn't come back to you.</p>
    <textarea value={text} onChange={e=>setText(e.target.value.slice(0,140))} placeholder="I'm setting down..." rows={3} style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(196,181,244,0.3)",borderRadius:14,padding:"14px 16px",color:ink,fontSize:16,fontFamily:"'Lora',serif",resize:"none",outline:"none"}}/>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,gap:10}}>
      <span style={{fontSize:11,color:muted}}>{text.length}/140 · anonymous</span>
      <button disabled={!text.trim()||status==="sending"} onClick={send} style={{background:"linear-gradient(135deg,#a48fbf,#7f6a9a)",border:"none",color:"#fff",borderRadius:30,padding:"12px 24px",fontSize:14,fontWeight:800,cursor:"pointer",opacity:!text.trim()?0.5:1}}>{status==="sending"?"Setting it down...":"Set it down 🪨"}</button>
    </div>
    {status==="error"&&<p style={{fontSize:12,color:"#f8a8a8",marginTop:10}}>That didn't go through. Check your connection and try again.</p>}
  </div>);
}
function SetItDownSheet({onClose}){return(<Sheet onClose={onClose} dark><SetItDownPanel onDone={onClose}/><button onClick={onClose} style={{background:"none",border:"none",color:"rgba(246,241,234,0.5)",fontSize:13,width:"100%",marginTop:18,cursor:"pointer"}}>Close</button></Sheet>);}

// Hallie's private view of what people set down
function SetItDownAdmin(){
  const [rows,setRows]=useState(null);const [filter,setFilter]=useState("all");
  useEffect(()=>{sbGet("set_it_down_submissions","limit=1000").then(d=>{const list=Array.isArray(d)?d:[];list.sort((a,b)=>String(b.created_at||b.id||"").localeCompare(String(a.created_at||a.id||"")));setRows(list);});},[]);
  const inApp=r=>r.event_tag==="app"||r.event_tag==="walk";const shown=(rows||[]).filter(r=>filter==="all"||(filter==="app"?inApp(r):!inApp(r)));
  return(<div style={{background:"linear-gradient(175deg,#2b2443 0%,#3d3354 60%,#54476a 100%)",borderRadius:20,padding:"20px 22px",color:"#f6f1ea"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,gap:8,flexWrap:"wrap"}}>
      <div><div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#c4b5f4",fontWeight:700}}>Set It Down</div><div style={{fontFamily:"'Lora',serif",fontSize:18,marginTop:4}}>{rows?`${rows.length} things set down`:"Loading..."}</div></div>
      <div style={{display:"flex",gap:6}}>{[["all","All"],["app","In app"],["event","Scan / events"]].map(([k,l])=>(<button key={k} onClick={()=>setFilter(k)} style={{padding:"5px 11px",borderRadius:14,border:"1px solid rgba(196,181,244,0.35)",background:filter===k?"rgba(196,181,244,0.2)":"transparent",color:"#e8e0ff",fontSize:11,fontWeight:700,cursor:"pointer"}}>{l}</button>))}</div>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:420,overflowY:"auto"}}>
      {shown.map((r,i)=>(<div key={r.id||i} style={{padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(196,181,244,0.12)"}}><div style={{fontFamily:"'Lora',serif",fontSize:15,lineHeight:1.5}}>{r.word}</div><div style={{fontSize:10.5,color:"rgba(246,241,234,0.5)",marginTop:3}}>{r.event_tag==="app"?"In the app":r.event_tag==="walk"?"Set It Down Walk":(r.event_tag||"Scan page")}{r.created_at?` · ${new Date(r.created_at).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}`:""}</div></div>))}
      {rows&&!shown.length&&<p style={{fontSize:13,color:"rgba(246,241,234,0.6)",fontStyle:"italic"}}>Nothing here yet.</p>}
    </div>
  </div>);
}

// ── BRING TO THERAPY ──
async function addTherapyItem(text,entry){const row={id:(()=>{try{return crypto.randomUUID();}catch{return `${Date.now()}_${Math.random().toString(36).slice(2)}`;}})(),text:text.slice(0,600),entry_id:entry?.id||null,entry_date:entry?.date||null,discussed:false};const r=await sbInsert("therapy_items",row);return Array.isArray(r)&&r.length>0;}

function TherapyList(){
  const [items,setItems]=useState(null);const [draft,setDraft]=useState("");const [showDone,setShowDone]=useState(false);const [msg,setMsg]=useState("");
  async function load(){const d=await sbGet("therapy_items","order=created_at.desc");setItems(Array.isArray(d)?d:[]);}
  useEffect(()=>{load();},[]);
  async function add(){const t=draft.trim();if(!t)return;setDraft("");await addTherapyItem(t);load();}
  async function toggle(it){setItems(xs=>xs.map(x=>x.id===it.id?{...x,discussed:!x.discussed}:x));await sbUpdate("therapy_items",`id=eq.${encodeURIComponent(it.id)}`,{discussed:!it.discussed});}
  async function remove(it){setItems(xs=>xs.filter(x=>x.id!==it.id));await sbDelete("therapy_items",`id=eq.${encodeURIComponent(it.id)}`);}
  const open=(items||[]).filter(i=>!i.discussed);const done=(items||[]).filter(i=>i.discussed);
  async function share(){const text=["Things I want to talk about:",...open.map(i=>`• ${i.text}`)].join("\n");try{if(navigator.share){await navigator.share({title:"For my next session",text});return;}await navigator.clipboard.writeText(text);setMsg("Copied. Paste it wherever you like.");}catch(e){if(e?.name!=="AbortError")setMsg("Couldn't share on this device.");}}
  return(<div style={{background:"linear-gradient(135deg,rgba(91,143,168,0.08),rgba(200,137,90,0.05))",border:"1px solid rgba(91,143,168,0.22)",borderRadius:20,padding:"18px 20px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,marginBottom:12}}>
      <div><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>🛋️</span><span style={{fontWeight:700,color:"#4a7a92",fontSize:11,textTransform:"uppercase",letterSpacing:"0.6px"}}>Bring to therapy</span></div><div style={{fontSize:12,color:"#9a7050",marginTop:4,lineHeight:1.45}}>Jot things down when they come up, so you don't forget them when you're in the room.</div></div>
      {open.length>0&&<button onClick={share} style={{...S.ghostBtn,padding:"5px 12px",fontSize:11,flexShrink:0}}>Share</button>}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:10}}><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Something I want to talk about..." style={{...S.input,flex:1}} maxLength={600}/><button onClick={add} disabled={!draft.trim()} style={{...S.saveBtn,padding:"0 16px",opacity:draft.trim()?1:0.5,background:"linear-gradient(135deg,#6f9fb8,#5b8fa8)"}}>Add</button></div>
    {items===null?<p style={{fontSize:12,color:"#b08060",fontStyle:"italic"}}>Loading...</p>:open.length===0?<p style={{fontSize:12,color:"#b08060",fontStyle:"italic"}}>Nothing on your list yet. You can also add any journal entry with "Bring to therapy".</p>:(
      <div style={{display:"flex",flexDirection:"column",gap:6}}>{open.map(it=>(<div key={it.id} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:"rgba(255,252,246,0.95)",borderRadius:12,border:"1px solid rgba(91,143,168,0.15)"}}><button onClick={()=>toggle(it)} aria-label="Mark as talked about" style={{width:22,height:22,borderRadius:"50%",border:"1.5px solid #5b8fa8",background:"transparent",flexShrink:0,marginTop:1,cursor:"pointer"}}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:13.5,color:"#5a2e0e",lineHeight:1.5,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{it.text}</div>{it.entry_date&&<div style={{fontSize:10.5,color:"#b08060",marginTop:2}}>From your journal · {new Date(it.entry_date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>}</div><button onClick={()=>remove(it)} aria-label="Remove" style={{background:"none",border:"none",color:"#c8a888",fontSize:16,cursor:"pointer",padding:0}}>×</button></div>))}</div>
    )}
    {done.length>0&&<button onClick={()=>setShowDone(v=>!v)} style={{background:"none",border:"none",color:"#7a9aaa",fontSize:12,cursor:"pointer",marginTop:10,padding:0}}>{showDone?"Hide":"Show"} {done.length} talked about ✓</button>}
    {showDone&&<div style={{display:"flex",flexDirection:"column",gap:4,marginTop:6}}>{done.map(it=>(<div key={it.id} style={{display:"flex",gap:10,alignItems:"center",fontSize:12.5,color:"#a08a70",textDecoration:"line-through",padding:"4px 2px"}}><button onClick={()=>toggle(it)} aria-label="Move back to list" style={{width:18,height:18,borderRadius:"50%",border:"none",background:"#5b8fa8",color:"#fff",fontSize:10,flexShrink:0,cursor:"pointer"}}>✓</button><span style={{flex:1}}>{it.text}</span><button onClick={()=>remove(it)} aria-label="Remove" style={{background:"none",border:"none",color:"#c8a888",fontSize:14,cursor:"pointer",padding:0}}>×</button></div>))}</div>}
    {msg&&<p style={{fontSize:12,color:"#5b8fa8",marginTop:8}}>{msg}</p>}
  </div>);
}

// ── PODCAST ──
function PodcastPlayer(){
  const [data,setData]=useState(null);const [playing,setPlaying]=useState(null);
  useEffect(()=>{fetch("/api/podcast").then(r=>r.json()).then(setData).catch(()=>setData({episodes:[]}));},[]);
  const eps=data?.episodes||[];
  return(<div style={{paddingTop:6}}>
    {!data?<p style={{fontSize:13,color:"#b08060",fontStyle:"italic"}}>Finding the latest episodes...</p>:eps.length===0?(
      <p style={{fontSize:13,color:"#b08060",lineHeight:1.6}}>Couldn't load episodes right now. <a href="https://halliegracehm.podbean.com/" target="_blank" rel="noreferrer" style={{color:"#c8895a",fontWeight:700}}>Listen on Podbean →</a></p>
    ):(<div style={{display:"flex",flexDirection:"column",gap:10}}>
      {eps.slice(0,6).map(ep=>(<div key={ep.url||ep.title} style={{padding:"12px 14px",borderRadius:14,background:playing===ep.url?"rgba(155,126,184,0.1)":"rgba(255,252,246,0.9)",border:`1px solid ${playing===ep.url?"rgba(155,126,184,0.35)":"rgba(200,137,90,0.15)"}`}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {ep.image&&<img src={ep.image} alt="" onError={e=>{e.currentTarget.style.display="none";}} style={{width:44,height:44,borderRadius:10,objectFit:"cover",flexShrink:0}}/>}
          <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:"#5a2e0e",fontSize:13.5,lineHeight:1.35}}>{ep.title}</div><div style={{fontSize:11,color:"#b08060",marginTop:2}}>{ep.date?new Date(ep.date).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):""}{ep.duration?` · ${ep.duration}`:""}</div></div>
          {ep.url&&playing!==ep.url&&<button onClick={()=>setPlaying(ep.url)} aria-label={`Play ${ep.title}`} style={{width:38,height:38,borderRadius:"50%",border:"none",background:"linear-gradient(135deg,#b39ad0,#9b7eb8)",color:"#fff",fontSize:14,cursor:"pointer",flexShrink:0}}>▶</button>}
        </div>
        {playing===ep.url&&<audio src={ep.url} controls autoPlay style={{width:"100%",marginTop:10,height:36}}/>}
      </div>))}
      <a href={data.link||"https://halliegracehm.podbean.com/"} target="_blank" rel="noreferrer" style={{fontSize:12,color:"#c8895a",fontWeight:700,textAlign:"center",textDecoration:"none",marginTop:2}}>All episodes →</a>
    </div>)}
  </div>);
}

// ── SHAREABLE STORIES + PUBLIC CHALLENGE LINKS ──
function pickOne(list){return list[Math.floor(Math.random()*list.length)];}
// Inspirational, challenge-style words for shared stories
const STORY_COPY={
  walk:()=>({kicker:"Set It Down Walk",title:pickOne(["Take ten minutes for yourself today.","You don't have to carry it all the way home.","Ten minutes. One walk. A little lighter."]),body:"Walk anywhere for ten minutes, set one thing down, and notice how you feel. Come walk with me."}),
  bingoPlaying:(m)=>({kicker:`${m} Joy Bingo`,title:pickOne(["Notice the little joys this month.","Five small joys in a row. Can you find them?","Joy is a practice. Play along."]),body:"Laugh till it hurts. Dance in the kitchen. Text an old friend. Little moments count."}),
  bingoWon:(m,n)=>({kicker:`${m} Joy Bingo`,title:pickOne([n>1?`${n} rows of little joys. Your turn.`:"I found five little joys in a row. Your turn.","Bingo! The little moments count.","Five little joys, one row. Come play."]),body:"A monthly card of small, human moments. Play this month's card with me."}),
  challengeInvite:(c)=>({kicker:c.title,title:pickOne([`Join me for the ${c.title}.`,`A few quiet minutes a day. Want to join me?`,`Your invitation: the ${c.title}.`]),body:c.desc}),
  challengeDone:(c)=>({kicker:c.title,title:pickOne([`I finished all ${c.duration} days. Want to start yours?`,`${c.duration} days of showing up for myself. Join me next.`]),body:c.desc}),
};
function challengeLink(id){try{return `${window.location.origin}/c/${id}`;}catch{return `/c/${id}`;}}
function prettyLink(url){return String(url).replace(/^https?:\/\//,"");}

function wrapLines(ctx,text,maxW){const words=String(text||"").split(/\s+/);const lines=[];let line="";for(const w of words){const t=line?line+" "+w:w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);line=w;}else line=t;}if(line)lines.push(line);return lines;}

// 1080x1920 story image (Instagram / TikTok stories), drawn with the Home screen's skies and hills
const STORY_SKIES={
  day:{sky:[[0,"#dfe7e6"],[0.45,"#e9e6dc"],[0.75,"#efe2cf"],[1,"#e8d4bb"]],r:["#cfc7b3","#aab09a","#7f8c73"],text:"#3d2a1a",sub:"rgba(61,42,26,0.68)",glass:"rgba(255,252,246,0.72)",line:"rgba(122,74,30,0.16)",link:"#7a4a1e",orb:"#fff6e2",glow:[255,226,170]},
  dusk:{sky:[[0,"#d9a88a"],[0.35,"#c98f86"],[0.68,"#9a7790"],[1,"#5e4f72"]],r:["#8a6f86","#65506b","#45374f"],text:"#fffaf5",sub:"rgba(255,250,245,0.84)",glass:"rgba(255,255,255,0.16)",line:"rgba(255,255,255,0.3)",link:"#fff1e4",orb:"#ffe0c2",glow:[255,200,160]},
  dawn:{sky:[[0,"#e9d3c4"],[0.38,"#e3b9ad"],[0.7,"#c9a3ae"],[1,"#a58ea6"]],r:["#b49aac","#8f7891","#6c5873"],text:"#fffaf5",sub:"rgba(255,250,245,0.86)",glass:"rgba(255,255,255,0.18)",line:"rgba(255,255,255,0.34)",link:"#fff4ec",orb:"#fff1dc",glow:[255,226,190]},
};
async function makeStoryImage({kicker,title:rawTitle,body:rawBody,sky="day",accent="#c8895a",grid,trail,url,cta="Take the challenge · It's free"}){
  const noDash=t=>t?String(t).replace(/\s*—\s*/g,". "):t;const title=noDash(rawTitle),body=noDash(rawBody);
  try{await Promise.all([document.fonts.load("600 96px Lora"),document.fonts.load("italic 400 48px Lora"),document.fonts.load("700 40px Nunito")]);}catch{}
  const P=STORY_SKIES[sky]||STORY_SKIES.day;const W=1080,H=1920,M=104;
  const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,H);P.sky.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,W,H);
  // soft light source, top right, like Home
  const [gr,gg,gb]=P.glow;const glow=x.createRadialGradient(W-170,250,0,W-170,250,320);glow.addColorStop(0,`rgba(${gr},${gg},${gb},0.6)`);glow.addColorStop(1,`rgba(${gr},${gg},${gb},0)`);x.fillStyle=glow;x.fillRect(0,0,W,H);
  const orb=x.createRadialGradient(W-178,238,4,W-170,250,40);orb.addColorStop(0,"#ffffff");orb.addColorStop(1,P.orb);x.fillStyle=orb;x.beginPath();x.arc(W-170,250,40,0,Math.PI*2);x.fill();
  // layered ridgelines (same shapes as Home)
  const top=H*0.64,hgt=H-top;x.save();x.setTransform(W/400,0,0,hgt/220,0,top);
  [["M0 92 C 50 70, 90 78, 130 64 S 210 40, 260 58 S 340 76, 400 54 L400 220 L0 220 Z",0.75],["M0 132 C 60 110, 110 124, 170 104 S 270 92, 320 112 S 380 118, 400 106 L400 220 L0 220 Z",0.88],["M0 172 C 70 152, 140 166, 210 150 S 330 156, 400 144 L400 220 L0 220 Z",1]].forEach(([d,o],i)=>{x.globalAlpha=o;x.fillStyle=P.r[i];try{x.fill(new Path2D(d));}catch{}});
  x.globalAlpha=1;
  if(trail){x.setLineDash([3,5]);x.lineWidth=1.6;x.strokeStyle="rgba(255,250,240,0.7)";x.beginPath();x.moveTo(40,220);x.bezierCurveTo(90,185,60,160,140,150);x.bezierCurveTo(210,140,230,120,300,112);x.stroke();x.setLineDash([]);}
  x.restore();
  // words (kept inside the safe area: below ~250px from top, above ~340px from bottom)
  let y=330;x.textAlign="left";const light=P.text==="#fffaf5";if(light){x.shadowColor="rgba(60,30,40,0.22)";x.shadowBlur=18;}
  x.fillStyle=P.sub;x.font="700 30px Nunito, sans-serif";x.fillText(String(kicker||"My Inner Mind").toUpperCase().split("").join(String.fromCharCode(8202)),M,y);y+=40;
  x.fillStyle=P.text;x.font="600 92px Lora, Georgia, serif";for(const l of wrapLines(x,title,W-2*M-40).slice(0,4)){y+=104;x.fillText(l,M,y);}y+=34;
  if(body){x.fillStyle=P.sub;x.font="italic 400 44px Lora, Georgia, serif";for(const l of wrapLines(x,body,W-2*M).slice(0,4)){y+=62;x.fillText(l,M,y);}y+=20;}
  x.shadowColor="transparent";x.shadowBlur=0;
  const cardTop=grid?1330:Math.min(1330,y+110);
  if(grid){const n=5,gy=y+40,size=Math.min(W-2*M,cardTop-50-gy),cell=size/n,gx=(W-size)/2;for(let i=0;i<25;i++){const r=Math.floor(i/n),cc=i%n,on=grid[i];const px=gx+cc*cell+5,py=gy+r*cell+5,sz=cell-10;x.fillStyle=on?accent:P.glass;x.beginPath();x.roundRect?x.roundRect(px,py,sz,sz,Math.min(22,sz/4)):x.rect(px,py,sz,sz);x.fill();if(!on){x.strokeStyle=P.line;x.lineWidth=2;x.stroke();}if(on){x.fillStyle="#fff";x.font=`700 ${Math.round(sz*0.42)}px Nunito, sans-serif`;x.textAlign="center";x.fillText(i===12?"★":"✓",px+sz/2,py+sz/2+sz*0.15);x.textAlign="left";}}}
  // glass call-to-action card, like the cards on Home
  x.fillStyle=P.glass;x.beginPath();x.roundRect?x.roundRect(M,cardTop,W-2*M,200,40):x.rect(M,cardTop,W-2*M,200);x.fill();x.strokeStyle=P.line;x.lineWidth=2;x.stroke();
  x.textAlign="center";x.fillStyle=P.text;x.font="700 46px Nunito, sans-serif";x.fillText(cta,W/2,cardTop+88);
  if(url){x.fillStyle=P.link;x.font="600 34px Nunito, sans-serif";x.fillText(prettyLink(url),W/2,cardTop+148);}
  x.fillStyle=P.text;x.globalAlpha=0.85;x.font="600 italic 40px Lora, Georgia, serif";x.fillText("My Inner Mind",W/2,cardTop+270);x.globalAlpha=1;
  return await new Promise(r=>c.toBlob(r,"image/png"));
}

async function shareStory(opts,setMsg){
  try{
    const blob=await makeStoryImage(opts);const file=new File([blob],"my-inner-mind-story.png",{type:"image/png"});
    if(opts.url){try{await navigator.clipboard.writeText(opts.url);}catch{}}
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:opts.title});setMsg&&setMsg(opts.url?"Link copied. Add it with a link sticker on your story 🔗":"Shared 🌿");return;}
    const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download="my-inner-mind-story.png";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),4000);
    setMsg&&setMsg(opts.url?"Image saved and link copied. Post the image, then add the link sticker 🔗":"Image saved 🌿");
  }catch(e){if(e?.name!=="AbortError"){console.error(e);setMsg&&setMsg("Couldn't share from this device. Try copying the link instead.");}}
}

function ShareRow({story,url,label="Share to your story",accent="#c8895a"}){
  const [msg,setMsg]=useState("");
  async function copy(){try{await navigator.clipboard.writeText(url);setMsg("Link copied 🔗");}catch{setMsg(url);}}
  return(<div><div style={{display:"flex",gap:8}}>
    <button onClick={()=>shareStory({...story,url},setMsg)} style={{flex:1,padding:"11px 12px",borderRadius:14,border:"none",background:`linear-gradient(135deg,${accent}cc,${accent})`,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>📲 {label}</button>
    {url&&<button onClick={copy} style={{padding:"11px 14px",borderRadius:14,border:`1px solid ${accent}55`,background:"transparent",color:accent,fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>🔗 Copy link</button>}
  </div>{msg&&<p style={{fontSize:12,color:accent,marginTop:8,textAlign:"center",lineHeight:1.45}}>{msg}</p>}</div>);
}

// ── JOY BINGO ──
const JOY_SQUARES=["Laughed till it hurt","Danced in the kitchen","Texted an old friend","Ate something new","Watched a sunrise or sunset","Complimented a stranger","Took a no-phone walk","Sang out loud","Made something with your hands","Said no without explaining","Drank water before coffee","Wrote 3 things you're grateful for","Called someone you love","Tried a new route","Read 10 pages for fun","Rested without guilt","Cooked a favorite meal","Wore the outfit","Played a song from your childhood","Asked for help","Spent 10 minutes outside","Cleared one small space","Celebrated a small win","Hugged someone (or yourself)","Went to bed early","Gave something away","Learned one new thing","Moved your body for joy","Left a kind review","Looked at old photos and smiled"];
function bingoCard(monthKey){let seed=0;for(const ch of monthKey)seed=(seed*31+ch.charCodeAt(0))>>>0;const pool=[...JOY_SQUARES];const out=[];while(out.length<24){seed=(seed*1664525+1013904223)>>>0;out.push(pool.splice(seed%pool.length,1)[0]);}out.splice(12,0,"Free space: breathe");return out;}
function bingoLines(marks){const L=[];for(let i=0;i<5;i++){L.push([0,1,2,3,4].map(j=>i*5+j));L.push([0,1,2,3,4].map(j=>j*5+i));}L.push([0,6,12,18,24]);L.push([4,8,12,16,20]);return L.filter(l=>l.every(k=>marks.has(k)));}

function JoyBingo({user,onBack}){
  const month=getTodayStr().slice(0,7);const key=`bingo_${user.email}_${month}`;const card=bingoCard(month);
  const [marks,setMarks]=useState(()=>new Set([12,...(persist.get(key)||[])]));
  const lines=bingoLines(marks);const prev=useRef(lines.length);
  useEffect(()=>{if(lines.length>prev.current)spawnConfetti();prev.current=lines.length;},[lines.length]);
  function toggle(i){if(i===12)return;const n=new Set(marks);n.has(i)?n.delete(i):n.add(i);setMarks(n);persist.set(key,[...n].filter(k=>k!==12));}
  const inLine=new Set(lines.flat());const monthName=new Date().toLocaleDateString("en-US",{month:"long"});const accent="#d07a4a";
  const grid=Array.from({length:25},(_,i)=>marks.has(i));
  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <button onClick={onBack} style={{...S.ghostBtn,alignSelf:"flex-start"}}>← Challenges</button>
    <div style={{background:"rgba(255,252,246,0.72)",border:"1px solid rgba(122,74,30,0.14)",borderRadius:24,padding:"22px",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)"}}>
      <div style={{fontSize:11,fontWeight:800,color:accent,letterSpacing:"1.5px",textTransform:"uppercase"}}>{monthName} · Free challenge</div>
      <h2 style={{fontFamily:"'Lora',serif",fontSize:30,color:"#3d2a1a",fontWeight:600,margin:"8px 0 6px"}}>Joy Bingo</h2>
      <p style={{fontSize:13.5,color:"#9a7050",lineHeight:1.6}}>Small joys count. Tap a square when you do it. Get five in a row, any direction, for a bingo. A new card arrives every month.</p>
      <div style={{fontSize:13,fontWeight:800,color:accent,marginTop:10}}>{lines.length?`${lines.length} bingo${lines.length>1?"s":""}! 🎉`:`${marks.size-1} of 24 joys found`}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
      {card.map((t,i)=>{const on=marks.has(i);const hot=inLine.has(i);return(<button key={i} onClick={()=>toggle(i)} aria-pressed={on} style={{aspectRatio:"1",borderRadius:12,padding:4,border:`1.5px solid ${on?accent:"rgba(200,137,90,0.2)"}`,background:i===12?"linear-gradient(135deg,#e8a06a,#d07a4a)":on?(hot?"linear-gradient(135deg,#e8a06a,#d07a4a)":"rgba(208,122,74,0.18)"):"rgba(255,252,246,0.95)",color:on&&(hot||i===12)?"#fff":"#5a2e0e",fontSize:9.5,fontWeight:700,lineHeight:1.2,cursor:i===12?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",fontFamily:"'Nunito',sans-serif",transition:"all .2s",overflow:"hidden"}}>{i===12?"★ breathe":t}</button>);})}
    </div>
    <ShareRow accent={accent} url={challengeLink("joy-bingo")} label={lines.length?"Share my bingo":"Share my card"} story={{sky:"day",...(lines.length?STORY_COPY.bingoWon(monthName,lines.length):STORY_COPY.bingoPlaying(monthName)),accent,grid}}/>
  </div>);
}

// ── SET IT DOWN WALK ──
function SetItDownWalk({user,onBack}){
  const key=`walks_${user.email}`;const [walks,setWalks]=useState(()=>persist.get(key)||[]);
  const [step,setStep]=useState("intro");const [before,setBefore]=useState(null);const [after,setAfter]=useState(null);const [left,setLeft]=useState(600);const [running,setRunning]=useState(false);const [text,setText]=useState("");const [sending,setSending]=useState(false);
  const month=getTodayStr().slice(0,7);const monthWalks=walks.filter(w=>w.date.startsWith(month));const goal=4;
  useEffect(()=>{if(!running)return;const t=setInterval(()=>setLeft(s=>{if(s<=1){clearInterval(t);setRunning(false);playSoftChime();setStep("setdown");return 0;}return s-1;}),1000);return()=>clearInterval(t);},[running]);
  async function setDown(){const t=text.trim();setSending(true);if(t){try{await fetch("/api/db",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path:"set_it_down_submissions",method:"POST",prefer:"return=minimal",body:{word:t,event_tag:"walk"}})});}catch{}}setSending(false);setText("");setStep("after");}
  function finish(v){setAfter(v);const w={date:getTodayStr(),before,after:v};const next=[...walks,w];setWalks(next);persist.set(key,next);setStep("done");if(next.filter(x=>x.date.startsWith(month)).length===goal)spawnConfetti();}
  const dark={background:"linear-gradient(180deg,#c98f86 0%,#9a7790 50%,#5e4f72 100%)",borderRadius:24,padding:"24px 22px",color:"#f6f1ea"};
  const scale=(val,set)=>(<div style={{display:"flex",gap:8,justifyContent:"center",marginTop:14}}>{[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>set(n)} style={{width:50,height:50,borderRadius:"50%",border:`1.5px solid ${val===n?"#c4b5f4":"rgba(196,181,244,0.3)"}`,background:val===n?"rgba(196,181,244,0.25)":"transparent",color:"#f6f1ea",fontSize:17,fontWeight:800,cursor:"pointer"}}>{n}</button>))}</div>);
  const lighter=after!=null&&before!=null?before-after:0;const mm=String(Math.floor(left/60)).padStart(1,"0"),ss=String(left%60).padStart(2,"0");
  return(<div style={{display:"flex",flexDirection:"column",gap:16}}>
    <button onClick={onBack} style={{...S.ghostBtn,alignSelf:"flex-start"}}>← Challenges</button>
    <div style={dark}>
      {step==="intro"&&(<div>
        <div style={{fontSize:11,letterSpacing:"2px",textTransform:"uppercase",color:"#c4b5f4",fontWeight:700}}>Free challenge · wherever you are</div>
        <h2 style={{fontFamily:"'Lora',serif",fontSize:30,fontWeight:600,margin:"8px 0 6px"}}>Set It Down Walk</h2>
        <p style={{fontSize:14,color:"rgba(246,241,234,0.72)",lineHeight:1.65}}>Ten minutes, anywhere: around the block, a parking lot, a hallway. Notice how heavy you feel, walk, set one thing down, then notice again. Aim for {goal} walks this month. Saturdays are extra special.</p>
        <div style={{display:"flex",gap:6,margin:"16px 0"}}>{Array.from({length:goal}).map((_,i)=>(<div key={i} style={{flex:1,height:8,borderRadius:4,background:i<monthWalks.length?"#c4b5f4":"rgba(196,181,244,0.18)"}}/>))}</div>
        <div style={{fontSize:12,color:"rgba(246,241,234,0.6)",marginBottom:16}}>{monthWalks.length} of {goal} walks this month</div>
        <button onClick={()=>{setBefore(null);setAfter(null);setLeft(600);setStep("before");}} style={{width:"100%",padding:"14px",borderRadius:30,border:"none",background:"linear-gradient(135deg,#a48fbf,#7f6a9a)",color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer"}}>Start a walk</button>
      </div>)}
      {step==="before"&&(<div style={{textAlign:"center"}}><h3 style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:600}}>Before you go</h3><p style={{fontSize:14,color:"rgba(246,241,234,0.7)",marginTop:6}}>How heavy do you feel right now? (1 = light, 5 = heavy)</p>{scale(before,setBefore)}<button disabled={!before} onClick={()=>{setStep("walk");setRunning(true);}} style={{marginTop:22,padding:"12px 28px",borderRadius:30,border:"none",background:"linear-gradient(135deg,#a48fbf,#7f6a9a)",color:"#fff",fontWeight:800,cursor:"pointer",opacity:before?1:0.5}}>Start my 10 minutes</button></div>)}
      {step==="walk"&&(<div style={{textAlign:"center",padding:"10px 0"}}><div style={{fontSize:12,letterSpacing:"2px",textTransform:"uppercase",color:"#c4b5f4",fontWeight:700}}>Walking</div><div style={{fontFamily:"'Lora',serif",fontSize:64,fontWeight:600,margin:"10px 0"}}>{mm}:{ss}</div><p style={{fontSize:14,color:"rgba(246,241,234,0.7)",lineHeight:1.6,maxWidth:320,margin:"0 auto"}}>Put your phone away. Notice your feet, the air, three things you can hear. Think about what you're ready to set down.</p><div style={{display:"flex",gap:8,justifyContent:"center",marginTop:20}}><button onClick={()=>setRunning(r=>!r)} style={{padding:"10px 20px",borderRadius:30,border:"1px solid rgba(196,181,244,0.4)",background:"transparent",color:"#e8e0ff",fontWeight:700,cursor:"pointer"}}>{running?"Pause":"Resume"}</button><button onClick={()=>{setRunning(false);setStep("setdown");}} style={{padding:"10px 20px",borderRadius:30,border:"none",background:"rgba(196,181,244,0.25)",color:"#fff",fontWeight:700,cursor:"pointer"}}>I'm done walking</button></div></div>)}
      {step==="setdown"&&(<div><h3 style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:600}}>Now set it down 🪨</h3><p style={{fontSize:14,color:"rgba(246,241,234,0.7)",margin:"6px 0 14px",lineHeight:1.6}}>One word or a short phrase. It goes to Hallie anonymously, or you can keep it to yourself.</p><textarea value={text} onChange={e=>setText(e.target.value.slice(0,140))} rows={3} placeholder="I'm setting down..." style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(196,181,244,0.3)",borderRadius:14,padding:"14px 16px",color:"#f6f1ea",fontSize:16,fontFamily:"'Lora',serif",resize:"none",outline:"none"}}/><div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:12}}><button onClick={()=>{setText("");setStep("after");}} style={{padding:"10px 16px",borderRadius:30,border:"1px solid rgba(196,181,244,0.35)",background:"transparent",color:"#e8e0ff",fontWeight:700,cursor:"pointer"}}>Keep it private</button><button disabled={!text.trim()||sending} onClick={setDown} style={{padding:"10px 20px",borderRadius:30,border:"none",background:"linear-gradient(135deg,#a48fbf,#7f6a9a)",color:"#fff",fontWeight:800,cursor:"pointer",opacity:text.trim()?1:0.5}}>{sending?"Setting it down...":"Set it down"}</button></div></div>)}
      {step==="after"&&(<div style={{textAlign:"center"}}><h3 style={{fontFamily:"'Lora',serif",fontSize:22,fontWeight:600}}>And now?</h3><p style={{fontSize:14,color:"rgba(246,241,234,0.7)",marginTop:6}}>How heavy do you feel after your walk?</p>{scale(after,finish)}</div>)}
      {step==="done"&&(<div style={{textAlign:"center"}}><div style={{fontSize:44}}>🌿</div><h3 style={{fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,margin:"6px 0"}}>{lighter>0?"You feel lighter.":"You showed up for yourself."}</h3><p style={{fontSize:14,color:"rgba(246,241,234,0.7)",lineHeight:1.6}}>{lighter>0?`From ${before} to ${after} on the heaviness scale. `:""}{monthWalks.length>=goal?`That's ${monthWalks.length} walks this month. You did it. 🏅`:`${monthWalks.length} of ${goal} walks this month.`}</p><button onClick={()=>setStep("intro")} style={{marginTop:16,padding:"10px 22px",borderRadius:30,border:"1px solid rgba(196,181,244,0.4)",background:"transparent",color:"#e8e0ff",fontWeight:700,cursor:"pointer"}}>Done</button></div>)}
    </div>
    <ShareRow accent="#7c5cbf" url={challengeLink("set-it-down-walk")} label="Invite someone to walk" story={{sky:"dusk",...STORY_COPY.walk(),accent:"#9a7790"}}/>
  </div>);
}

// Every challenge that can be shared publicly
function publicChallenges(){return[
  {id:"joy-bingo",icon:"🎉",title:"Joy Bingo",color:"#d07a4a",desc:"A monthly card of small joys. Laugh till it hurts, dance in the kitchen, text an old friend. Five in a row wins.",what:["A fresh 5×5 card every month","Tap squares as you go","Share your bingo to your story"]},
  {id:"set-it-down-walk",icon:"🚶",title:"Set It Down Walk",color:"#7c5cbf",desc:"Ten minutes, anywhere. Notice how heavy you feel, walk, set one thing down, then notice again.",what:["A guided 10-minute walk","Set one thing down, anonymously","See how much lighter you feel"]},
  ...MINI_CHALLENGES.map(c=>({id:c.id,icon:c.icon,title:c.title,color:c.color,desc:c.desc,what:[`${c.duration} days, one short prompt a day`,"Write privately in your journal","Track your progress as you go"]})),
];}

function PublicChallengePage({id,onStart,onSignIn}){
  const c=publicChallenges().find(x=>x.id===id);
  const sky="linear-gradient(180deg,#dfe7e6 0%,#e9e6dc 45%,#efe2cf 75%,#e8d4bb 100%)";
  const wrap={minHeight:"100vh",background:sky,position:"relative",overflow:"hidden",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column",alignItems:"center"};
  const hills=(<svg viewBox="0 0 400 220" preserveAspectRatio="none" style={{position:"absolute",left:0,right:0,bottom:0,width:"100%",height:"30%",pointerEvents:"none"}}><path d="M0 92 C 50 70, 90 78, 130 64 S 210 40, 260 58 S 340 76, 400 54 L400 220 L0 220 Z" fill="#cfc7b3" opacity="0.75"/><path d="M0 132 C 60 110, 110 124, 170 104 S 270 92, 320 112 S 380 118, 400 106 L400 220 L0 220 Z" fill="#aab09a" opacity="0.88"/><path d="M0 172 C 70 152, 140 166, 210 150 S 330 156, 400 144 L400 220 L0 220 Z" fill="#7f8c73"/></svg>);
  const glow=(<><div style={{position:"absolute",top:-30,right:-40,width:220,height:220,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,226,170,0.6) 0%,transparent 65%)"}}/><div style={{position:"absolute",top:40,right:46,width:30,height:30,borderRadius:"50%",background:"radial-gradient(circle at 40% 38%,#fff,#fff6e2 70%)"}}/></>);
  if(!c)return(<div style={{...wrap,justifyContent:"center",padding:24}}><GlobalStyles/>{glow}{hills}<p style={{position:"relative",fontFamily:"'Lora',serif",fontSize:20,color:"#3d2a1a",marginBottom:16}}>That challenge isn't here anymore.</p><button onClick={onStart} style={{...S.saveBtn,position:"relative"}}>Explore My Inner Mind →</button></div>);
  return(<div style={wrap}><GlobalStyles/>{glow}{hills}
    <div style={{position:"relative",zIndex:1,width:"100%",maxWidth:520,padding:"56px 24px 220px"}}>
      <div style={{fontSize:11,fontWeight:700,letterSpacing:"2.2px",textTransform:"uppercase",color:"rgba(61,42,26,0.6)"}}>My Inner Mind · Free challenge</div>
      <h1 style={{fontFamily:"'Lora',serif",fontSize:40,lineHeight:1.12,color:"#3d2a1a",fontWeight:600,letterSpacing:"-0.4px",margin:"14px 0 0"}}>{c.title}</h1>
      <p style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:18,lineHeight:1.6,color:"rgba(61,42,26,0.68)",margin:"14px 0 26px"}}>{c.desc}</p>
      <div style={{background:"rgba(255,252,246,0.62)",border:"1px solid rgba(122,74,30,0.14)",borderRadius:20,padding:"18px 20px",marginBottom:22,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)"}}>
        <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:"rgba(61,42,26,0.6)",fontWeight:700,marginBottom:8}}>What you'll do</div>
        {c.what.map(w=>(<div key={w} style={{display:"flex",gap:10,alignItems:"center",fontSize:15,color:"#3d2a1a",padding:"5px 0"}}><span style={{color:"#7f8c73",fontWeight:900}}>✓</span>{w}</div>))}
      </div>
      <button onClick={onStart} style={{...S.saveBtn,width:"100%",padding:"15px",fontSize:16}}>Take the challenge · It's free</button>
      <button onClick={onSignIn} style={{background:"none",border:"none",color:"rgba(61,42,26,0.7)",fontSize:14,width:"100%",marginTop:14,cursor:"pointer",fontWeight:600}}>I already have an account</button>
      <p style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:14,color:"rgba(61,42,26,0.62)",textAlign:"center",marginTop:22,lineHeight:1.6}}>Private journaling, gentle check-ins, and challenges that remind you to be human.</p>
    </div>
  </div>);
}

function AuthScreen({mode,form,error,loading,pwaPrompt,onChange,onSubmit,onToggle}){
  const [showForgot,setShowForgot]=useState(false);const [pwaDismissed,setPwaDismissed]=useState(false);
  if(showForgot)return <ForgotPasswordScreen onBack={()=>setShowForgot(false)}/>;
  return(<div style={{...S.page,justifyContent:"center",alignItems:"center"}}><div style={S.texture}/><GlobalStyles/><div style={S.authCard}><div style={{textAlign:"center",marginBottom:28}}><div style={{fontSize:44,marginBottom:10}}>🌿</div><div style={{fontFamily:"'Lora',serif",fontSize:26,color:"#7a4a1e",fontWeight:600}}>My Inner Mind</div><div style={{color:"#b08060",fontSize:13,marginTop:5,fontStyle:"italic"}}>{mode==="login"?"Welcome back":"Begin your journey inward"}</div></div>{mode==="register"&&(<Field label="Name"><input style={S.input} placeholder="Your name" value={form.username} onChange={e=>onChange({username:e.target.value})}/></Field>)}
    {mode==="register"&&(<p style={{fontSize:11,color:"#b08060",lineHeight:1.6,marginBottom:14,textAlign:"center"}}>By creating an account, you agree to our <a href="https://halliewho.com/terms-of-use/" target="_blank" rel="noopener noreferrer" style={{color:"#c8895a",textDecoration:"underline"}}>Terms of Use</a> and <a href="https://halliewho.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{color:"#c8895a",textDecoration:"underline"}}>Privacy Policy</a>.</p>)}
  <Field label="Email"><input style={S.input} type="email" placeholder="you@email.com" value={form.email} onChange={e=>onChange({email:e.target.value})} onKeyDown={e=>e.key==="Enter"&&onSubmit()}/></Field><Field label="Password"><PasswordInput style={S.input} placeholder="••••••••" value={form.password} onChange={e=>onChange({password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&onSubmit()}/></Field>{mode==="login"&&(<div style={{textAlign:"right",marginTop:-8,marginBottom:12}}><button onClick={()=>setShowForgot(true)} style={{background:"none",border:"none",color:"#c8895a",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>Forgot password?</button></div>)}{error&&<div style={S.errorBox}>{error}</div>}<button onClick={onSubmit} disabled={loading} style={{...S.saveBtn,width:"100%",padding:"13px",fontSize:15,marginTop:4}}>{loading?"One moment...":mode==="login"?"Sign In →":"Create My Journal →"}</button><div style={{textAlign:"center",marginTop:18,fontSize:13,color:"#b08060"}}>{mode==="login"?"New here? ":"Already have an account? "}<button onClick={onToggle} style={{background:"none",border:"none",color:"#c8895a",fontWeight:700,cursor:"pointer",fontSize:13}}>{mode==="login"?"Create an account":"Sign in"}</button></div></div>{!pwaDismissed&&<PWABanner prompt={pwaPrompt} onDismiss={()=>setPwaDismissed(true)}/>}</div>);
}

function ForgotPasswordScreen({onBack}){
  const [step,setStep]=useState("email");const [email,setEmail]=useState("");const [code,setCode]=useState("");const [newPassword,setNewPassword]=useState("");const [confirmPassword,setConfirmPassword]=useState("");const [error,setError]=useState("");const [loading,setLoading]=useState(false);const [sentTo,setSentTo]=useState("");
  async function handleSendCode(){setError("");setLoading(true);const normalizedEmail=email.toLowerCase().trim();try{const r=await authCall("reset_send",{email:normalizedEmail});if(!r.ok){setError(r.error||"Something went wrong. Please try again.");return;}setSentTo(normalizedEmail);setStep("verify");}catch{setError("Something went wrong. Please try again.");}finally{setLoading(false);}}
  async function handleVerifyCode(){setError("");setLoading(true);try{const r=await authCall("reset_verify",{email:sentTo,code});if(!r.ok){setError(r.error||"That code is incorrect.");return;}setStep("reset");}catch{setError("Connection error. Please try again.");}finally{setLoading(false);}}
  async function handleResetPassword(){setError("");if(newPassword.length<6){setError("Password must be at least 6 characters.");return;}if(newPassword!==confirmPassword){setError("Passwords don't match.");return;}setLoading(true);try{const r=await authCall("reset_password",{email:sentTo,code,password:newPassword});if(!r.ok){setError(r.error||"Something went wrong. Please try again.");return;}setStep("done");}catch{setError("Something went wrong. Please try again.");}finally{setLoading(false);}}
  return(<div style={{...S.page,justifyContent:"center",alignItems:"center"}}><div style={S.texture}/><GlobalStyles/><div style={S.authCard}><div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:40,marginBottom:10}}>🔑</div><div style={{fontFamily:"'Lora',serif",fontSize:22,color:"#7a4a1e",fontWeight:600}}>Reset Password</div></div>{step==="email"&&<><p style={{fontSize:13,color:"#9a7050",marginBottom:20,lineHeight:1.6,textAlign:"center"}}>Enter your email and we'll send you a reset code.</p><Field label="Email"><input style={S.input} type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSendCode()}/></Field>{error&&<div style={S.errorBox}>{error}</div>}<button onClick={handleSendCode} disabled={loading||!email} style={{...S.saveBtn,width:"100%",padding:"13px",marginTop:4}}>{loading?"Checking...":"Send Reset Code →"}</button><div style={{textAlign:"center",marginTop:16}}><button onClick={onBack} style={{background:"none",border:"none",color:"#b08060",fontSize:13,cursor:"pointer"}}>← Back to sign in</button></div></>}{step==="verify"&&<><div style={{background:"rgba(200,137,90,0.08)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:20,fontSize:13,color:"#9a7050",lineHeight:1.6,textAlign:"center"}}>A reset code has been sent to <strong>{sentTo}</strong>. Check your inbox!</div><Field label="Enter 6-digit code"><input style={{...S.input,letterSpacing:"4px",fontSize:20,textAlign:"center"}} placeholder="000000" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,""))} onKeyDown={e=>e.key==="Enter"&&handleVerifyCode()}/></Field>{error&&<div style={S.errorBox}>{error}</div>}<button onClick={handleVerifyCode} disabled={loading||code.length!==6} style={{...S.saveBtn,width:"100%",padding:"13px",marginTop:4}}>{loading?"Verifying...":"Verify Code →"}</button><div style={{textAlign:"center",marginTop:16}}><button onClick={()=>setStep("email")} style={{background:"none",border:"none",color:"#b08060",fontSize:13,cursor:"pointer"}}>← Try a different email</button></div></>}{step==="reset"&&<><p style={{fontSize:13,color:"#9a7050",marginBottom:20,lineHeight:1.6,textAlign:"center"}}>Choose a new password for your account.</p><Field label="New Password"><PasswordInput style={S.input} placeholder="At least 6 characters" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></Field><Field label="Confirm Password"><PasswordInput style={S.input} placeholder="Type it again" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleResetPassword()}/></Field>{error&&<div style={S.errorBox}>{error}</div>}<button onClick={handleResetPassword} disabled={loading} style={{...S.saveBtn,width:"100%",padding:"13px",marginTop:4}}>{loading?"Saving...":"Set New Password →"}</button></>}{step==="done"&&<div style={{textAlign:"center",padding:"10px 0"}}><div style={{fontSize:48,marginBottom:14}}>✅</div><p style={{fontFamily:"'Lora',serif",fontSize:18,color:"#5a2e0e",marginBottom:8}}>Password updated!</p><p style={{fontSize:13,color:"#b08060",marginBottom:24}}>You can now sign in with your new password.</p><button onClick={onBack} style={{...S.saveBtn,padding:"12px 32px"}}>Sign In →</button></div>}</div></div>);
}

function JournalApp({user,onLogout,onUpgradePlan,pwaPrompt,onPwaInstalled}){
  const [pendingChallenge]=useState(()=>{try{return sessionStorage.getItem("mim_pending_challenge");}catch{return null;}});const [tab,setTab]=useState(pendingChallenge?"challenges":"home");const [view,setView]=useState("list");const [entries,setEntries]=useState([]);const [selectedEntry,setSelectedEntry]=useState(null);const [searchQuery,setSearchQuery]=useState("");const [filterTag,setFilterTag]=useState(null);const [filterMood,setFilterMood]=useState(null);const [aiPrompt,setAiPrompt]=useState("");const [promptLoading,setPromptLoading]=useState(false);const [loading,setLoading]=useState(true);const [dbError,setDbError]=useState(false);const [form,setForm]=useState({id:null,date:getTodayStr(),title:"",content:"",mood:null,tags:[],shared:false,submitToFeature:false});const [editMode,setEditMode]=useState(false);const [insight,setInsight]=useState("");const [insightLoading,setInsightLoading]=useState(false);const [pwaDismissed,setPwaDismissed]=useState(false);const [showRecap,setShowRecap]=useState(false);const [sharePrompt,setSharePrompt]=useState(null);React.useEffect(()=>{window._setSharePrompt=setSharePrompt;return()=>{delete window._setSharePrompt;};},[]);const [theme,setTheme]=useState(()=>persist.get("theme_"+user.email)||"original");
  const T=THEMES[theme]||THEMES.original;
  const isPro=user.plan==="community"||user.plan==="offtherecord";
  const isOTR=user.plan==="offtherecord";
  const isAdmin=user.email===ADMIN_EMAIL;
  const streak=daysThisMonth(entries);
  const reward=isPro?streakReward(streak):null;
  const halliePrompt=getWeeklyHalliePrompt();

  useEffect(()=>{const handler=(e)=>{if(e.detail==="admin"&&isAdmin)setTab("admin");};window.addEventListener("hallie-nav",handler);return()=>window.removeEventListener("hallie-nav",handler);},[isAdmin]);

  const [sheet,setSheet]=useState(null); // "support" | "setitdown"
  const [toast,setToast]=useState("");
  // Ambient sound lives at the app level so it keeps playing on every tab
  useEffect(()=>{if(pendingChallenge){try{sessionStorage.removeItem("mim_pending_challenge");}catch{}if(window.location.pathname.startsWith("/c/"))window.history.replaceState({},"","/");}},[]);
  const ambient=useAmbientSound();const [ambientPlaying,setAmbientPlaying]=useState(null);
  function toggleAmbient(s){if(ambientPlaying===s.id){ambient.stop();setAmbientPlaying(null);}else{ambient.play(s);setAmbientPlaying(s.id);}}
  function stopAmbient(){ambient.stop();setAmbientPlaying(null);}
  useEffect(()=>()=>{ambient.stop();},[]);
  useEffect(()=>{const el=document.querySelector(`.mim-tabs [data-tab="${tab}"]`);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",inline:"nearest",block:"nearest"});},[tab]);

  function handleTabChange(newTab){
    setTab(newTab);setView("list");
  }

  useEffect(()=>{
    loadEntries();loadAiPrompt();
    const recapKey=`myinnermind_recap_${new Date().toISOString().slice(0,7)}`;
    const lastRecap=store.get(`myinnermind_lastrecap_${user.email}`);
    if(lastRecap!==recapKey){const now=new Date();if(now.getDate()<=3){store.set(`myinnermind_lastrecap_${user.email}`,recapKey);setTimeout(()=>setShowRecap(true),1500);}}
  },[]);

  async function loadEntries(){setLoading(true);setDbError(false);try{const data=await sbGet("entries",`user_email=eq.${encodeURIComponent(user.email)}&order=date.desc`);if(Array.isArray(data)){setEntries(data);}else{setDbError(true);}}catch{setDbError(true);}finally{setLoading(false);}}
  async function loadAiPrompt(){const cached=store.get("myinnermindPrompt_"+getTodayStr());if(cached){setAiPrompt(cached);return;}setPromptLoading(true);try{const p=await getAIPrompt();setAiPrompt(p);store.set("myinnermindPrompt_"+getTodayStr(),p);}catch{setAiPrompt("What is one small thing that brought you comfort today?");}finally{setPromptLoading(false);}}

  async function saveEntry(){
    if(!form.title.trim()&&!form.content.trim())return;
    const thisMonth=getTodayStr().slice(0,7);
    const monthCount=entries.filter(e=>e.date?.startsWith(thisMonth)).length;
    if(user.plan==="free"&&monthCount>=30&&!form.id){alert("You've reached 30 entries this month. Visit halliewho.com to unlock unlimited journaling! 🌿");return;}
    const entry={id:form.id||`${user.email}_${Date.now()}`,user_email:user.email,date:form.date,title:form.title,content:form.content,mood:form.mood,tags:form.tags,shared:form.shared,submit_to_feature:form.submitToFeature,author_name:user.username,updated_at:Date.now()};
    await sbUpsert("entries",entry);await loadEntries();setView("list");if(!form.id)spawnConfetti();
  }

  async function deleteEntry(entry){if(!window.confirm("Delete this entry? This can't be undone."))return;await sbDelete("entries",`id=eq.${entry.id}`);await loadEntries();setView("list");}
  async function fetchInsight(entry){if(!isOTR)return;setInsight("");setInsightLoading(true);try{setInsight(await getAIInsight(entry));}catch{setInsight("Couldn't load insight right now.");}finally{setInsightLoading(false);}}
  function startNew(prefill=""){setForm({id:null,date:getTodayStr(),title:"",content:prefill,mood:null,tags:[],shared:false,submitToFeature:false});setEditMode(false);setView("write");}
  function startEdit(entry){setForm({id:entry.id,date:entry.date,title:entry.title,content:entry.content,mood:entry.mood,tags:entry.tags||[],shared:entry.shared||false,submitToFeature:entry.submit_to_feature||false});setEditMode(true);setView("write");}

  const filtered=entries.filter(e=>{const q=searchQuery.toLowerCase();return(!q||e.title?.toLowerCase().includes(q)||e.content?.toLowerCase().includes(q))&&(!filterTag||e.tags?.includes(filterTag))&&(!filterMood||e.mood?.label===filterMood);});
  const lastMonthStr=new Date(new Date().getFullYear(),new Date().getMonth()-1,1).toISOString().slice(0,7);
  const hasLastMonthEntries=entries.some(e=>e.date?.startsWith(lastMonthStr));

  return(
    <div style={{...S.page,background:T.bg}}>
      <div style={S.texture}/><GlobalStyles/>
      <header style={{...S.header,background:T.header}}>
        <div style={{...S.headerInner,flexDirection:"column",gap:0,padding:"8px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",marginBottom:6}}>
            <button onClick={()=>handleTabChange("journal")} style={S.logoBtn}><span style={{fontSize:20}}>🌿</span><span style={{...S.logoText,fontSize:16,whiteSpace:"nowrap"}}>My Inner Mind</span></button>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              
              <button onClick={()=>setSheet("support")} aria-label="Need support now" style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:20,border:"1px solid rgba(155,126,184,0.35)",flexShrink:0,background:"rgba(155,126,184,0.1)",color:"#7a5a9e",fontSize:11.5,fontWeight:800,cursor:"pointer",fontFamily:"'Nunito',sans-serif",whiteSpace:"nowrap"}}><span style={{fontSize:13}}>🤍</span>Support</button>
              <ProfileMenu user={user} theme={theme} T={T} onLogout={onLogout} onTheme={(key)=>{setTheme(key);persist.set("theme_"+user.email,key);}} onUpgradeTab={()=>handleTabChange("upgrade")} onAccountTab={()=>handleTabChange("account")}/>
            </div>
          </div>
          <nav className="mim-tabs" onScroll={e=>{const el=e.currentTarget;const m=(el.scrollLeft+el.clientWidth>=el.scrollWidth-4)?"none":"linear-gradient(90deg,#000 88%,transparent)";el.style.webkitMaskImage=m;el.style.maskImage=m;}} style={{display:"flex",gap:6,width:"calc(100% + 32px)",margin:"0 -16px",padding:"2px 16px 4px",overflowX:"auto",overflowY:"hidden",scrollSnapType:"x proximity",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",WebkitMaskImage:"linear-gradient(90deg,#000 88%,transparent)",maskImage:"linear-gradient(90deg,#000 88%,transparent)"}}>
           {[["home","🌙"],["journal","📖"],["nest","🪹"],["grove","🌲"],["journey","🌱"],["challenges","🏆"],["letters","💌"],["community","🌿"]].map(([t,icon])=>(
              <button key={t} data-tab={t} onClick={()=>handleTabChange(t)} style={{...S.navBtn,...(tab===t?S.navBtnActive:{}),border:tab===t?"1px solid rgba(200,137,90,0.3)":"1px solid transparent",padding:"6px 0",width:68,minWidth:68,flex:"0 0 68px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3,scrollSnapAlign:"start",whiteSpace:"nowrap"}}>
                <span style={{fontSize:18,lineHeight:1}}>{icon}</span><span style={{fontSize:10,lineHeight:1.1,textTransform:"capitalize",fontWeight:tab===t?700:500}}>{t}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{...S.main,color:T.text}}>
        {sharePrompt&&<SharePromptCard prompt={sharePrompt} onClose={()=>setSharePrompt(null)}/>}{dbError&&tab==="journal"&&<div style={{background:"rgba(200,80,60,0.08)",border:"1px solid rgba(200,80,60,0.2)",borderRadius:16,padding:"16px 20px",marginBottom:20,display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:24}}>🌿</span><div><div style={{fontWeight:700,color:"#c05040",fontSize:14}}>Having trouble connecting</div><div style={{fontSize:13,color:"#9a7050",marginTop:3}}>Check your connection and <button onClick={loadEntries} style={{background:"none",border:"none",color:"#c8895a",fontWeight:700,cursor:"pointer",fontSize:13,padding:0}}>try again</button></div></div></div>}

        {tab==="journal"&&view==="list"&&(
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            {showRecap&&hasLastMonthEntries&&<MonthlyRecap entries={entries} user={user} onDismiss={()=>setShowRecap(false)}/>}
            {(()=>{const g=getTimeGreeting();return(<div style={{textAlign:"center",padding:"8px 0 4px"}}><div style={{fontFamily:"'Lora',serif",fontSize:22,color:T.accentDark,fontWeight:600,marginBottom:4}}>{g.greeting}</div><div style={{fontSize:13,color:T.subtext,fontStyle:"italic"}}>{g.sub}</div></div>);})()}
            <IntentionBanner user={user} onWrite={startNew} theme={T}/>
            {entries.length>0&&!loading&&<GentleNudge entries={entries} theme={T}/>}
            <MoodChart entries={entries} theme={T}/>
            <BadgesSection entries={entries} user={user} theme={T}/>
            {reward&&(<div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.12),rgba(200,137,90,0.08))",border:"1px solid rgba(245,158,11,0.3)",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:32}}>🌿</span><div style={{flex:1}}><div style={{fontWeight:700,color:"#92400e",fontSize:14}}>{reward.label}: you showed up {streak} days this month</div><div style={{fontSize:13,color:"#b45309",marginTop:3}}>Use code <strong>{reward.discount}</strong> for {reward.pct} off any gratitude journal at halliewho.com</div></div></div>)}
            <JournalingTimeBanner/>
            <div style={{...S.promptCard,background:"linear-gradient(135deg,rgba(122,74,30,0.08),rgba(200,137,90,0.06))",border:"1px solid rgba(122,74,30,0.18)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:18}}>💌</span><span style={{fontWeight:700,color:"#7a4a1e",fontSize:12,textTransform:"uppercase",letterSpacing:"0.6px"}}>Hallie's Prompt This Week</span></div><p style={{fontFamily:"'Lora',serif",fontSize:16,color:"#5a3a1a",fontStyle:"italic",lineHeight:1.7,marginBottom:6}}>"{halliePrompt.prompt}"</p><div style={{fontSize:12,color:"#b08060",marginBottom:12}}>{halliePrompt.note}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>startNew(halliePrompt.prompt)} style={S.softBtn}>Write to this →</button><button onClick={()=>setSharePrompt(halliePrompt.prompt)} style={{...S.softBtn,background:"rgba(122,74,30,0.08)",border:"1px solid rgba(122,74,30,0.2)",color:"#7a4a1e"}}>Share 🌿</button></div></div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}><div style={{flex:1,position:"relative"}}><span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",opacity:0.35,fontSize:15}}>🔍</span><input style={{...S.input,paddingLeft:38,width:"100%"}} placeholder="Search your entries..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>{isOTR&&<button onClick={()=>exportToPDF(entries,user.username)} style={S.ghostBtn}>📄 Export</button>}<button onClick={()=>startNew()} style={S.newBtn}>+ New</button></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}><Chip active={!filterTag} onClick={()=>setFilterTag(null)}>All</Chip>{TAG_OPTIONS.map(t=><Chip key={t} active={filterTag===t} activeColor={TAG_COLORS[t]} onClick={()=>setFilterTag(filterTag===t?null:t)}>{t}</Chip>)}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}><Chip active={!filterMood} onClick={()=>setFilterMood(null)}>All Moods</Chip>{MOODS.map(m=><Chip key={m.label} active={filterMood===m.label} activeColor={m.color} onClick={()=>setFilterMood(filterMood===m.label?null:m.label)}>{m.emoji} {m.label}</Chip>)}</div>
            {loading?(<div style={{textAlign:"center",padding:"70px 0",color:"#b08060",fontStyle:"italic"}}>Loading your journal...</div>):filtered.length===0?(<div style={{textAlign:"center",padding:"70px 0"}}><div style={{fontSize:52,marginBottom:14}}>📖</div><p style={{color:"#b08060",fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:16}}>{searchQuery||filterTag||filterMood?"No entries match your search.":"No entries yet. Start writing!"}</p><button onClick={()=>startNew()} style={{...S.newBtn,marginTop:18}}>Write your first entry</button></div>):(<div style={S.grid}>{filtered.map(entry=><EntryCard key={entry.id} entry={entry} onClick={()=>{setSelectedEntry(entry);setInsight("");setView("read");}}/>)}</div>)}
          </div>
        )}

        {tab==="journal"&&view==="write"&&(
          <div style={S.writeCard}>
            <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={{...S.input,width:"auto",fontSize:13}}/>
            <input style={S.titleInput} placeholder="Give this entry a title..." value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus/>
            <SectionLabel>How are you feeling?</SectionLabel>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:4}}>{MOODS.map(m=>(<button key={m.label} title={m.label} onClick={()=>setForm(f=>({...f,mood:f.mood?.label===m.label?null:m}))} style={{width:42,height:42,fontSize:22,borderRadius:12,cursor:"pointer",transition:"all .15s",border:`2px solid ${form.mood?.label===m.label?m.color:"transparent"}`,background:form.mood?.label===m.label?m.color+"25":"rgba(255,255,255,0.6)"}}>{m.emoji}</button>))}</div>
            <SectionLabel>Tags</SectionLabel>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:4}}>{TAG_OPTIONS.map(t=>(<Chip key={t} active={form.tags.includes(t)} activeColor={TAG_COLORS[t]} onClick={()=>setForm(f=>({...f,tags:f.tags.includes(t)?f.tags.filter(x=>x!==t):[...f.tags,t]}))}>{t}</Chip>))}</div>
            <textarea style={S.textarea} rows={12} placeholder="What's on your mind? Write freely..." value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))}/>
            {form.content.trim()&&<div style={{fontSize:11,color:"#b08060",textAlign:"right",marginTop:-8}}>{form.content.trim().split(/\s+/).filter(Boolean).length} words</div>}
            {isPro&&(<label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",fontSize:14,color:"#8a6040"}}><input type="checkbox" checked={form.shared} onChange={e=>setForm(f=>({...f,shared:e.target.checked}))} style={{accentColor:"#c8895a",width:16,height:16}}/>Share to Community Feed 🌿</label>)}
            <label style={{display:"flex",alignItems:"center",gap:9,cursor:"pointer",fontSize:14,color:"#7a4a1e",background:"rgba(200,137,90,0.06)",padding:"10px 14px",borderRadius:12,border:"1px solid rgba(200,137,90,0.18)"}}><input type="checkbox" checked={form.submitToFeature} onChange={e=>setForm(f=>({...f,submitToFeature:e.target.checked}))} style={{accentColor:"#c8895a",width:16,height:16}}/><div><div style={{fontWeight:700,fontSize:13}}>🎙️ Submit for Story of the Month</div><div style={{fontSize:11,color:"#b08060",marginTop:1}}>Hallie may feature this on the podcast, anonymously unless you say otherwise</div></div></label>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}><button onClick={()=>setView("list")} style={S.ghostBtn}>Discard</button><button onClick={saveEntry} style={S.saveBtn}>{editMode?"Save Changes ✓":"Save Entry ✨"}</button></div>
          </div>
        )}

        {tab==="journal"&&view==="read"&&selectedEntry&&(
          <div style={S.readCard}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
              <div><div style={{fontSize:12,color:"#b08060",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.4px"}}>{formatDate(selectedEntry.date)}</div>{selectedEntry.mood&&<span style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,padding:"4px 13px",borderRadius:12,background:"rgba(200,137,90,0.1)",color:"#9a6a3a",fontSize:13,fontWeight:600}}>{selectedEntry.mood.emoji} {selectedEntry.mood.label}</span>}{selectedEntry.submit_to_feature&&<span style={{display:"inline-flex",alignItems:"center",gap:5,marginTop:8,marginLeft:8,padding:"4px 13px",borderRadius:12,background:"rgba(122,74,30,0.1)",color:"#7a4a1e",fontSize:12,fontWeight:600}}>🎙️ Submitted</span>}</div>
              <button onClick={()=>setView("list")} style={S.ghostBtn}>← Back</button>
            </div>
            <h1 style={{fontFamily:"'Lora',serif",fontSize:28,color:"#5a2e0e",marginBottom:14,fontWeight:600,lineHeight:1.2}}>{selectedEntry.title||"Untitled"}</h1>
            {selectedEntry.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>{selectedEntry.tags.map(t=><TagPill key={t} tag={t}/>)}</div>}
            <div style={{height:1,background:"linear-gradient(90deg,rgba(200,137,90,0.3),transparent)",marginBottom:24}}/>
            <p style={{fontFamily:"'Lora',serif",fontSize:16,lineHeight:1.9,color:"#6a4020",fontStyle:"italic",whiteSpace:"pre-wrap",marginBottom:32}}>{selectedEntry.content}</p>
            {isOTR&&(<div style={S.insightBox}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:insight?12:0}}><span style={{fontWeight:700,color:"#7a4a1e",fontSize:12,textTransform:"uppercase",letterSpacing:"0.5px"}}>✨ Hallie's Insight</span>{!insight&&<button onClick={()=>fetchInsight(selectedEntry)} disabled={insightLoading} style={S.softBtn}>{insightLoading?"Reflecting...":"Get Insight"}</button>}</div>{insightLoading&&<p style={{color:"#b08060",fontStyle:"italic",fontSize:14}}>Reading between the lines...</p>}{insight&&<p style={{fontFamily:"'Lora',serif",fontSize:15,lineHeight:1.75,color:"#6a4020",fontStyle:"italic"}}>{insight}</p>}</div>)}
            {!isOTR&&(<div style={{...S.insightBox,textAlign:"center"}}><p style={{fontSize:13,color:"#9a7050",marginBottom:10}}>✨ Hallie's Insight is available on the Off the Record plan.</p></div>)}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:24,gap:8,flexWrap:"wrap"}}><button onClick={()=>deleteEntry(selectedEntry)} style={S.deleteBtn}>🗑 Delete</button><div style={{display:"flex",gap:8}}><button onClick={async()=>{const t=[selectedEntry.title,(selectedEntry.content||"").slice(0,220)+((selectedEntry.content||"").length>220?"…":"")].filter(Boolean).join(": ");const ok=await addTherapyItem(t,selectedEntry);setToast(ok?"Added to your therapy list 🛋️":"Couldn't add it. Try again.");setTimeout(()=>setToast(""),2600);}} style={{...S.ghostBtn}}>🛋️ Bring to therapy</button><button onClick={()=>startEdit(selectedEntry)} style={S.saveBtn}>✏️ Edit</button></div></div>
          </div>
        )}

        {tab==="admin"&&isAdmin&&<AdminTab/>}
        {tab==="account"&&<AccountTab user={user} onLogout={onLogout}/>}
        {tab==="upgrade"&&<UpgradeTab currentPlan={user.plan} user={user} onUpgradePlan={onUpgradePlan}/>}
        {tab==="nest"&&<NestTab user={user} isPro={isPro} isOTR={isOTR} aiPrompt={aiPrompt} promptLoading={promptLoading} onWrite={(prefill)=>{handleTabChange("journal");startNew(prefill);}} theme={T} ambientPlaying={ambientPlaying} onToggleAmbient={toggleAmbient}/>}
        {tab==="journey"&&<JourneyTab entries={entries} user={user}/>}
        {tab==="letters"&&<LettersTab user={user}/>}
        {tab==="challenges"&&<ChallengesTab openId={pendingChallenge} entries={entries} user={user} onWrite={(prefill)=>{handleTabChange("journal");startNew(prefill);}}/>}
        {tab==="community"&&<CommunitiesTab user={user} userTier={user.plan} onUpgrade={()=>handleTabChange("upgrade")}/>}{tab==="grove"&&<GroveTab user={user}/>}
        {tab==="home"&&<HomeTab user={user} onNavigate={(go)=>{if(go==="write"){handleTabChange("journal");startNew();}else if(go==="setitdown"){setSheet("setitdown");}else handleTabChange(go);}}/>}
      </main>
      {ambientPlaying&&(()=>{const s=AMBIENT_SOUNDS.find(x=>x.id===ambientPlaying);return(<div style={{position:"fixed",left:"50%",transform:"translateX(-50%)",bottom:"calc(16px + env(safe-area-inset-bottom))",zIndex:200,display:"flex",alignItems:"center",gap:10,padding:"8px 8px 8px 14px",background:"rgba(255,252,246,0.97)",border:"1px solid rgba(91,143,168,0.35)",borderRadius:30,boxShadow:"0 6px 24px rgba(90,46,14,0.15)",backdropFilter:"blur(10px)",fontFamily:"'Nunito',sans-serif"}}><button onClick={()=>handleTabChange("nest")} style={{background:"none",border:"none",display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:0}}><span style={{fontSize:18}}>{s?.icon||"🎵"}</span><span style={{fontSize:12,fontWeight:700,color:"#5b8fa8",whiteSpace:"nowrap"}}>{s?.name||"Ambient sound"}</span></button><button onClick={stopAmbient} aria-label="Stop sound" style={{width:30,height:30,borderRadius:"50%",border:"none",background:"rgba(91,143,168,0.15)",color:"#5b8fa8",fontSize:12,fontWeight:800,cursor:"pointer"}}>■</button></div>);})()}
      {sheet==="support"&&<SupportSheet onClose={()=>setSheet(null)} onBreathe={()=>{setSheet(null);handleTabChange("nest");}} onSetItDown={()=>setSheet("setitdown")}/>}
      {sheet==="setitdown"&&<SetItDownSheet onClose={()=>setSheet(null)}/>}
      {toast&&<div role="status" style={{position:"fixed",left:"50%",transform:"translateX(-50%)",top:"calc(110px + env(safe-area-inset-top))",zIndex:600,background:"#5a2e0e",color:"#fffaf3",padding:"10px 18px",borderRadius:24,fontSize:13,fontWeight:700,boxShadow:"0 6px 20px rgba(40,24,12,0.25)",fontFamily:"'Nunito',sans-serif"}}>{toast}</div>}
      {!pwaDismissed&&<PWABanner prompt={pwaPrompt} onDismiss={()=>{setPwaDismissed(true);onPwaInstalled();}}/>}
    </div>
  );
}

// ── UPGRADE TAB — Apple IAP via Natively/RevenueCat ──
function UpgradeTab({currentPlan,user,onUpgradePlan}){
  const [purchasing,setPurchasing]=useState(null);
  const [restoring,setRestoring]=useState(false);
  const [msg,setMsg]=useState("");
  const inApp=isNativeApp();

  async function handlePurchase(planKey){
    setPurchasing(planKey);setMsg("");
    await rcLogin(user.email,user.email);
    const pkgId=planKey==="community"?"community2":"offtherecord2";
    const result=await rcPurchase(pkgId);
    if(result.status==="SUCCESS"){
      const newPlan=await rcGetPlan(user.email);
      if(newPlan&&newPlan!=="free"){await onUpgradePlan(newPlan);setMsg(`Welcome to ${PLANS[newPlan].name}! 🌿`);}
      else{setMsg("Purchase complete! Sign out and back in to refresh. 🌿");}
    }else if(!result.error?.includes("cancel")){
      setMsg("Something went wrong. Try restoring purchases or email hello@halliewho.com");
    }
    setPurchasing(null);
  }

  async function handleRestore(){
    if(!inApp){setMsg("Visit halliewho.com to manage your subscription.");return;}
    setRestoring(true);setMsg("");
    await rcLogin(user.email,user.email);
    const result=await rcRestore();
    if(result.status==="SUCCESS"){
      const newPlan=await rcGetPlan(user.email);
      if(newPlan&&newPlan!=="free"){await onUpgradePlan(newPlan);setMsg(`Restored! Welcome back to ${PLANS[newPlan].name} 🌿`);}
      else{setMsg("No active purchases found.");}
    }else{setMsg("Couldn't restore. Email hello@halliewho.com for help.");}
    setRestoring(false);
  }

  const plan=PLANS[currentPlan];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:20,padding:"8px 0"}}>
      <div style={{textAlign:"center",padding:"24px 0 8px"}}>
        <div style={{fontSize:48,marginBottom:12}}>🌿</div>
        <h2 style={{fontFamily:"'Lora',serif",fontSize:28,color:"#5a2e0e",marginBottom:10,fontWeight:600}}>Go Deeper</h2>
        <p style={{fontFamily:"'Lora',serif",fontSize:15,color:"#9a7050",fontStyle:"italic",lineHeight:1.75,maxWidth:380,margin:"0 auto"}}>Build your inner world first. Choose the plan that fits where you are right now.</p>
      </div>
      {msg&&<div style={{background:"rgba(100,170,100,0.1)",border:"1px solid rgba(100,170,100,0.3)",borderRadius:16,padding:"14px 20px",textAlign:"center",fontSize:14,color:"#3a8050",fontFamily:"'Lora',serif",fontStyle:"italic"}}>{msg}</div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {Object.entries(PLANS).map(([key,p])=>(
          <div key={key} style={{background:"rgba(255,252,246,0.97)",border:`2px solid ${currentPlan===key?p.color:"rgba(200,137,90,0.15)"}`,borderRadius:20,padding:"20px 22px",position:"relative"}}>
            {currentPlan===key&&<div style={{position:"absolute",top:-12,left:20,background:p.color,color:"#fff",fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:20,textTransform:"uppercase",letterSpacing:"0.5px"}}>Current Plan</div>}
            <div style={{marginBottom:10}}><div style={{fontFamily:"'Lora',serif",fontSize:18,fontWeight:600,color:"#5a2e0e"}}>{p.name}</div><div style={{fontSize:22,fontWeight:800,color:p.color,marginTop:2}}>{p.price}</div></div>
            <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:7,marginBottom:currentPlan!==key&&key!=="free"?14:0}}>{p.features.map(f=><li key={f} style={{fontSize:13,color:"#7a5030",display:"flex",gap:8}}><span style={{color:p.color,fontWeight:700,flexShrink:0}}>✓</span>{f}</li>)}</ul>
            {currentPlan!==key&&key!=="free"&&(
              <button onClick={()=>handlePurchase(key)} disabled={!!purchasing} style={{...S.saveBtn,width:"100%",background:`linear-gradient(135deg,${p.color}cc,${p.color})`,opacity:purchasing===key?0.6:1}}>
                {purchasing===key?"Opening...":`Join ${p.name} →`}
              </button>
            )}
          </div>
        ))}
     </div>
      {<button onClick={handleRestore} disabled={restoring} style={{...S.ghostBtn,width:"100%",textAlign:"center",opacity:restoring?0.6:1}}>{restoring?"Restoring...":"Restore Purchases"}</button>}
      <div style={{textAlign:"center",fontSize:12,color:"#b08060",lineHeight:1.6}}>
        Subscriptions auto-renew. Cancel anytime in Settings → Apple ID → Subscriptions.
      </div>
      <div style={{textAlign:"center",fontSize:12,color:"#b08060",lineHeight:1.8,display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
        <a href="https://halliewho.com/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{color:"#c8895a",textDecoration:"underline"}}>Privacy Policy</a>
        <a href="https://halliewho.com/terms-of-use/" target="_blank" rel="noopener noreferrer" style={{color:"#c8895a",textDecoration:"underline"}}>Terms of Use</a>
      </div>
    </div>
  );
}
// ── ACCOUNT TAB ──
function AccountTab({user,onLogout}){
  const [activeSection,setActiveSection]=useState(null);const [currentPw,setCurrentPw]=useState("");const [newPw,setNewPw]=useState("");const [confirmPw,setConfirmPw]=useState("");const [pwStatus,setPwStatus]=useState("");const [askMsg,setAskMsg]=useState("");const [askSent,setAskSent]=useState(false);const [askLoading,setAskLoading]=useState(false);

  async function handlePasswordChange(){setPwStatus("");if(!currentPw||!newPw||!confirmPw){setPwStatus("error:All fields required.");return;}if(newPw.length<6){setPwStatus("error:New password must be at least 6 characters.");return;}if(newPw!==confirmPw){setPwStatus("error:Passwords don't match.");return;}const r=await authCall("change_password",{current:currentPw,next:newPw});if(!r.ok){setPwStatus("error:"+(r.error||"Could not update password."));return;}setPwStatus("success:Password updated! 🌿");setCurrentPw("");setNewPw("");setConfirmPw("");}
  async function handleAskHallie(){if(!askMsg.trim())return;setAskLoading(true);try{await fetch("/api/ask-hallie",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:user.email,username:user.username,message:askMsg})});setAskSent(true);setAskMsg("");}catch{setAskSent(true);}setAskLoading(false);}

  const plan=PLANS[user.plan];
  const sections=[{id:"plan",icon:"💎",label:"My Plan"},{id:"password",icon:"🔑",label:"Change Password"},{id:"ask",icon:"💌",label:"Ask Hallie"},{id:"faq",icon:"🌿",label:"Help & FAQ"},{id:"delete",icon:"🗑️",label:"Delete Account"}];
  const FAQ=[
    {q:"How do I upgrade my plan?",a:"Tap Plans & Upgrade from your profile menu to subscribe directly in the app. Your plan unlocks immediately."},
    {q:"How do I cancel my subscription?",a:"Email hello@halliewho.com and we'll take care of it within 24 hours. No hard feelings, ever."},
    {q:"Is my journal private?",a:"Yes. Your entries are private by default. You choose what you share to the community feed."},
    {q:"What's Story of the Month?",a:"Each month, Hallie reads community submissions and may feature a story anonymously on the My Inner Mind podcast."},
    {q:"Can I export my journal?",a:"Off the Record members can export all entries as an HTML file from the journal view."},
    {q:"How does showing up work?",a:"Every day you write counts toward this month. Missing a day never takes anything away, and your count starts fresh each month."},
  ];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      <div style={{textAlign:"center",padding:"20px 0 8px"}}><div style={{fontSize:40,marginBottom:8}}>⚙️</div><h2 style={{fontFamily:"'Lora',serif",fontSize:24,color:"#5a2e0e",fontWeight:600}}>Account Settings</h2><p style={{fontSize:13,color:"#b08060",fontStyle:"italic",marginTop:4}}>Hey {user.username} 🌿</p></div>
      {sections.map(s=>(
        <div key={s.id} style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:20,overflow:"hidden",boxShadow:"0 2px 12px rgba(160,100,50,0.07)"}}>
          <button onClick={()=>setActiveSection(activeSection===s.id?null:s.id)} style={{width:"100%",background:"none",border:"none",padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left"}}>
            <div style={{width:42,height:42,borderRadius:14,background:s.id==="delete"?"rgba(200,80,60,0.08)":"rgba(200,137,90,0.1)",border:`1px solid ${s.id==="delete"?"rgba(200,80,60,0.2)":"rgba(200,137,90,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{s.icon}</div>
            <span style={{fontWeight:700,color:s.id==="delete"?"#c05040":"#5a2e0e",fontSize:15,fontFamily:"'Nunito',sans-serif",flex:1}}>{s.label}</span>
            <span style={{fontSize:16,color:"#b08060"}}>{activeSection===s.id?"▲":"▼"}</span>
          </button>
          {activeSection==="plan"&&s.id==="plan"&&(
            <div style={{padding:"0 20px 20px"}}>
              <div style={{background:`linear-gradient(135deg,${plan.color}18,${plan.color}08)`,border:`1px solid ${plan.color}33`,borderRadius:16,padding:"18px",marginBottom:14,textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:800,color:plan.color,fontFamily:"'Lora',serif",marginBottom:4}}>{plan.name}</div>
                <div style={{fontSize:20,fontWeight:700,color:"#7a4a1e",marginBottom:10}}>{plan.price}</div>
                <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:8,textAlign:"left"}}>{plan.features.map(f=><li key={f} style={{fontSize:13,color:"#7a5030",display:"flex",gap:8}}><span style={{color:plan.color,fontWeight:700}}>✓</span>{f}</li>)}</ul>
              </div>
            </div>
          )}
          {activeSection==="password"&&s.id==="password"&&(
            <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:12}}>
              <Field label="Current Password"><PasswordInput style={S.input} placeholder="••••••••" value={currentPw} onChange={e=>setCurrentPw(e.target.value)}/></Field>
              <Field label="New Password"><PasswordInput style={S.input} placeholder="At least 6 characters" value={newPw} onChange={e=>setNewPw(e.target.value)}/></Field>
              <Field label="Confirm New Password"><PasswordInput style={S.input} placeholder="Type it again" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)}/></Field>
              {pwStatus&&<div style={{padding:"10px 14px",borderRadius:12,fontSize:13,fontWeight:600,background:pwStatus.startsWith("success")?"rgba(100,170,100,0.1)":"rgba(200,80,60,0.08)",border:pwStatus.startsWith("success")?"1px solid rgba(100,170,100,0.3)":"1px solid rgba(200,80,60,0.2)",color:pwStatus.startsWith("success")?"#3a8050":"#c05040"}}>{pwStatus.replace(/^(success|error):/,"")}</div>}
              <button onClick={handlePasswordChange} style={S.saveBtn}>Update Password →</button>
            </div>
          )}
          {activeSection==="ask"&&s.id==="ask"&&(
            <div style={{padding:"0 20px 20px"}}>
              {!askSent?(<><p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#7a5030",fontStyle:"italic",lineHeight:1.7,marginBottom:14}}>Have a question, a thought, or something on your heart? Hallie reads every message. 🌿</p><textarea style={{...S.textarea,minHeight:120,marginBottom:12}} placeholder="Hey Hallie..." value={askMsg} onChange={e=>setAskMsg(e.target.value)} rows={4}/><button onClick={handleAskHallie} disabled={!askMsg.trim()||askLoading} style={{...S.saveBtn,width:"100%",opacity:!askMsg.trim()||askLoading?0.5:1}}>{askLoading?"Sending...":"Send to Hallie 💌"}</button></>):(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{fontSize:36,marginBottom:10}}>💌</div><p style={{fontFamily:"'Lora',serif",fontSize:16,color:"#5a2e0e",fontStyle:"italic",lineHeight:1.7}}>Your message is on its way. Hallie will read it. 🌿</p><button onClick={()=>setAskSent(false)} style={{...S.ghostBtn,marginTop:14}}>Send another</button></div>)}
            </div>
          )}
          {activeSection==="faq"&&s.id==="faq"&&(
            <div style={{padding:"0 20px 20px",display:"flex",flexDirection:"column",gap:12}}>
              {FAQ.map((item,i)=>(<div key={i} style={{borderBottom:"1px solid rgba(200,137,90,0.1)",paddingBottom:12}}><div style={{fontWeight:700,color:"#5a2e0e",fontSize:14,marginBottom:5}}>🌿 {item.q}</div><div style={{fontSize:13,color:"#8a6040",lineHeight:1.65,fontFamily:"'Lora',serif",fontStyle:"italic"}}>{item.a}</div></div>))}
              <div style={{fontSize:12,color:"#b08060",textAlign:"center",paddingTop:4}}>Still have questions? <strong>hello@halliewho.com</strong></div>
            </div>
          )}
          {activeSection==="delete"&&s.id==="delete"&&(<div style={{padding:"0 20px 20px"}}><DeleteAccountSection user={user} onDeleted={onLogout}/></div>)}
        </div>
      ))}
    </div>
  );
}

// ── DELETE ACCOUNT — Apple guideline 5.1.1(v) compliant ──
function DeleteAccountSection({user,onDeleted}){
  const [step,setStep]=useState("warn");const [loading,setLoading]=useState(false);
  async function handleDelete(){
    setLoading(true);
    try{
      const r=await authCall("delete_account");if(!r.ok)throw new Error(r.error||"delete failed");
      store.remove("myinnerminduser");setToken("");
      persist.remove("challenges_joined_"+user.email);
      persist.remove("letters_"+user.email);
      persist.remove("theme_"+user.email);
      setTimeout(()=>onDeleted(),1000);
    }catch(e){console.error(e);setLoading(false);alert("Something went wrong. Please try again or email hello@halliewho.com.");}
  }
  if(step==="warn")return(<div><p style={{fontSize:14,color:"#9a7050",lineHeight:1.7,marginBottom:16,fontFamily:"'Lora',serif",fontStyle:"italic"}}>Deleting your account permanently removes all your journal entries, community posts, and personal data. This cannot be undone.</p><button onClick={()=>setStep("confirm")} style={{...S.deleteBtn,width:"100%",padding:"11px"}}>I want to delete my account</button></div>);
  return(<div><div style={{background:"rgba(200,80,60,0.06)",border:"1px solid rgba(200,80,60,0.2)",borderRadius:14,padding:"16px",marginBottom:16}}><p style={{fontSize:14,fontWeight:700,color:"#c05040",marginBottom:6}}>⚠️ Are you absolutely sure?</p><p style={{fontSize:13,color:"#9a7050",lineHeight:1.65}}>Every entry, every letter, every community post. Gone forever. Account for <strong>{user.email}</strong> will be fully deleted.</p></div><div style={{display:"flex",gap:10}}><button onClick={()=>setStep("warn")} style={{...S.ghostBtn,flex:1}}>Cancel</button><button onClick={handleDelete} disabled={loading} style={{flex:2,background:"#c05040",color:"#fff",border:"none",borderRadius:20,padding:"11px",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",opacity:loading?0.6:1}}>{loading?"Deleting...":"Yes, Delete My Account"}</button></div></div>);
}

// ── COMMUNITIES ──
function CommunitiesTab({user,userTier="free",onUpgrade}){
  const [communities,setCommunities]=useState([]);const [activeCommunity,setActiveCommunity]=useState(null);const [posts,setPosts]=useState([]);const [newPost,setNewPost]=useState("");const [selectedMood,setSelectedMood]=useState(null);const [isPromptMode,setIsPromptMode]=useState(false);const [loading,setLoading]=useState(true);const [postsLoading,setPostsLoading]=useState(false);const [submitting,setSubmitting]=useState(false);const [reactions,setReactions]=useState({});const [myReactions,setMyReactions]=useState({});const [isMember,setIsMember]=useState({});const [view,setView]=useState("list");const [isAnon,setIsAnon]=useState(false);const [submitToMonth,setSubmitToMonth]=useState(false);const [communityView,setCommunityView]=useState("feed");
const userTierLevel=COMMUNITY_TIER_ORDER[userTier]??0;const userKey=user?.email||null;
  const [blockedIds,setBlockedIds]=useState([]);
  useEffect(()=>{if(userKey)sbGet("blocked_users",`blocker_id=eq.${encodeURIComponent(userKey)}`).then(d=>{if(Array.isArray(d))setBlockedIds(d.map(b=>b.blocked_id));});},[userKey]);
  async function reportPost(postId,reportedUserId){if(!userKey)return;await sbInsert("reports",{reporter_id:userKey,reported_user_id:reportedUserId,post_id:postId,reason:"User reported"});alert("Thank you. We've received your report and will review it within 24 hours. 🌿");}
  async function blockUser(blockedUserId){if(!userKey||blockedUserId===userKey)return;await sbInsert("blocked_users",{blocker_id:userKey,blocked_id:blockedUserId});setBlockedIds(prev=>[...prev,blockedUserId]);setPosts(prev=>prev.filter(p=>p.user_id!==blockedUserId));alert("User blocked. Their posts won't appear for you anymore.");}

  useEffect(()=>{loadCommunities();},[]);
  useEffect(()=>{if(activeCommunity){loadPosts(activeCommunity.id);checkMembership(activeCommunity.id);}},[activeCommunity]);

  async function loadCommunities(){setLoading(true);try{const data=await sbGet("communities","order=min_tier.asc");if(Array.isArray(data))setCommunities(data);}catch(e){console.error(e);}setLoading(false);}
  async function loadPosts(communityId){setPostsLoading(true);setPosts([]);try{const data=await sbGet("community_posts",`community_id=eq.${communityId}&order=created_at.desc&limit=50&select=*`);if(Array.isArray(data)){setPosts(data);const ids=data.map(p=>p.id);if(ids.length>0){const rd=await sbGet("post_reactions",`post_id=in.(${ids.join(",")})`);if(Array.isArray(rd)){const rm={},mrm={};rd.forEach(r=>{if(!rm[r.post_id])rm[r.post_id]={};rm[r.post_id][r.emoji]=(rm[r.post_id][r.emoji]||0)+1;if(r.user_id===userKey)mrm[r.post_id]=r.emoji;});setReactions(rm);setMyReactions(mrm);}}}}catch(e){console.error(e);}setPostsLoading(false);}
  async function checkMembership(communityId){if(!userKey)return;const data=await sbGet("community_members",`user_id=eq.${encodeURIComponent(userKey)}&community_id=eq.${communityId}`);setIsMember(prev=>({...prev,[communityId]:Array.isArray(data)&&data.length>0}));}
  async function joinCommunity(communityId){if(!userKey)return;await sbInsert("community_members",{user_id:userKey,community_id:communityId});setIsMember(prev=>({...prev,[communityId]:true}));}
  async function submitPost(){const bannedWords=["fuck","shit","bitch","ass","damn","cunt","nigger","faggot"];
if(!newPost.trim()||!activeCommunity||!userKey)return;
if(bannedWords.some(w=>newPost.toLowerCase().includes(w))){alert("Your post contains language that isn't allowed in this community. Please revise and try again. 🌿");return;}setSubmitting(true);try{const data=await sbInsert("community_posts",{user_id:userKey,display_name:isAnon?"Anonymous":user?.username||userKey?.split("@")[0]||"Anonymous",community_id:activeCommunity.id,content:newPost.trim(),mood_tag:selectedMood?`${selectedMood.emoji} ${selectedMood.label}`:null,is_prompt_response:isPromptMode,daily_prompt:isPromptMode?DAILY_PROMPTS[activeCommunity.slug]:null,is_anonymous:isAnon,submit_to_sotm:submitToMonth});if(Array.isArray(data)&&data[0])setPosts(prev=>[{...data[0],display_name:isAnon?"Anonymous":user?.username||user?.email?.split("@")[0]||"Anonymous"},...prev]);setNewPost("");setSelectedMood(null);setIsPromptMode(false);setIsAnon(false);setSubmitToMonth(false);}catch(e){console.error(e);}setSubmitting(false);}
  async function reactToPost(postId,emoji){if(!userKey)return;const existing=myReactions[postId];if(existing===emoji){await sbDelete("post_reactions",`user_id=eq.${encodeURIComponent(userKey)}&post_id=eq.${postId}`);setMyReactions(prev=>{const n={...prev};delete n[postId];return n;});setReactions(prev=>{const n={...prev};if(n[postId]&&n[postId][emoji])n[postId][emoji]=Math.max(0,n[postId][emoji]-1);return n;});}else{if(existing)await sbDelete("post_reactions",`user_id=eq.${encodeURIComponent(userKey)}&post_id=eq.${postId}`);await sbInsert("post_reactions",{user_id:userKey,post_id:postId,emoji});setMyReactions(prev=>({...prev,[postId]:emoji}));setReactions(prev=>{const n={...prev,[postId]:{...(prev[postId]||{})}};if(existing)n[postId][existing]=Math.max(0,(n[postId][existing]||1)-1);n[postId][emoji]=(n[postId][emoji]||0)+1;return n;});}}
  function canAccess(community){return(COMMUNITY_TIER_ORDER[userTier]??0)>=(COMMUNITY_TIER_ORDER[community.min_tier]??0);}
  function timeAgo(d){const diff=Date.now()-new Date(d).getTime(),mins=Math.floor(diff/60000);if(mins<1)return"just now";if(mins<60)return`${mins}m ago`;const hrs=Math.floor(mins/60);if(hrs<24)return`${hrs}h ago`;return`${Math.floor(hrs/24)}d ago`;}

  if(view==="list"){
    const grouped={free:communities.filter(c=>c.min_tier==="free"),community:communities.filter(c=>c.min_tier==="community"),premium:communities.filter(c=>c.min_tier==="premium")};
    return(<div style={{fontFamily:"'Nunito',sans-serif"}}><div style={{padding:"0 0 16px"}}><PageHeader kicker="Together" title="Communities" sub="Find your people. You don't have to grow alone."/>
    <p style={{fontSize:11,color:"#b08060",marginTop:6}}>To report inappropriate content, email <a href="mailto:hello@halliewho.com" style={{color:"#c8895a"}}>hello@halliewho.com</a></p></div>{loading?<div style={{textAlign:"center",padding:"40px",color:"#b08060",fontStyle:"italic"}}>Loading communities...</div>:Object.entries(grouped).map(([tier,list])=>(list.length===0?null:<div key={tier} style={{marginBottom:4,padding:"0 16px"}}><div style={{marginBottom:8,marginTop:14}}><div style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",padding:"4px 12px",borderRadius:20,border:"1px solid",background:COMMUNITY_TIER_CONFIG[tier].bg,borderColor:COMMUNITY_TIER_CONFIG[tier].border,color:COMMUNITY_TIER_CONFIG[tier].color}}>{tier==="free"?"✦ Free":tier==="community"?"💛 Community":"🔒 Off the Record"}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:8}}>{list.map(community=>{const accessible=canAccess(community);const cfg=COMMUNITY_TIER_CONFIG[community.min_tier];return(<div key={community.id} style={{background:"rgba(255,252,246,0.95)",borderRadius:18,border:`1px solid ${accessible?cfg.border:"rgba(200,180,160,0.15)"}`,overflow:"hidden",boxShadow:"0 2px 12px rgba(160,100,50,0.08)",opacity:accessible?1:0.55,cursor:accessible?"pointer":"default"}} onClick={()=>{if(accessible){setActiveCommunity(community);setView("community");}}}><div style={{padding:"14px 14px 8px",display:"flex",alignItems:"flex-start",justifyContent:"space-between",background:accessible?cfg.bg:"rgba(200,180,160,0.06)"}}><span style={{fontSize:26}}>{community.emoji}</span>{!accessible&&<div style={{fontSize:9,fontWeight:700,padding:"3px 8px",borderRadius:10,border:"1px solid",background:cfg.bg,color:cfg.color,borderColor:cfg.border,letterSpacing:"0.3px",textTransform:"uppercase"}}>🔒 {cfg.label}</div>}</div><div style={{padding:"0 12px 12px"}}><div style={{fontFamily:"'Lora',serif",fontSize:13,fontWeight:600,color:"#5a2e0e",marginBottom:3,lineHeight:1.3}}>{community.name}</div><div style={{fontSize:11,color:"#b08060",lineHeight:1.4}}>{community.description}</div></div></div>);})}</div></div>))}{userTierLevel<1&&(<div style={{margin:"16px 16px 0",background:"linear-gradient(135deg,rgba(200,137,90,0.1),rgba(155,126,184,0.07))",border:"1px solid rgba(200,137,90,0.25)",borderRadius:20,padding:"22px",textAlign:"center",cursor:"pointer"}} onClick={onUpgrade}><div style={{fontSize:28,marginBottom:6}}>💛</div><div style={{fontFamily:"'Lora',serif",fontSize:16,fontWeight:600,color:"#5a2e0e",marginBottom:5}}>Unlock more communities</div><div style={{fontSize:13,color:"#b08060",lineHeight:1.6,marginBottom:14,fontStyle:"italic"}}>Healing & Growth, Morning Routines, Anxiety & Overthinking and more.</div><div style={{display:"inline-block",background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"white",borderRadius:20,padding:"8px 22px",fontSize:13,fontWeight:700}}>See Plans →</div></div>)}</div>);
  }

  const prompt=DAILY_PROMPTS[activeCommunity?.slug];const hasAccess=activeCommunity&&canAccess(activeCommunity);const joined=isMember[activeCommunity?.id];const cfg=COMMUNITY_TIER_CONFIG[activeCommunity?.min_tier||"free"];

  return(<div style={{fontFamily:"'Nunito',sans-serif"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid rgba(200,137,90,0.12)"}}><button style={{background:"none",border:"none",fontSize:13,color:"#b08060",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:600}} onClick={()=>{setView("list");setActiveCommunity(null);setPosts([]);}}>← Communities</button><div style={{display:"flex",alignItems:"center",gap:8}}>{!joined&&hasAccess&&<button style={{background:cfg.color,color:"white",border:"none",borderRadius:20,padding:"7px 16px",fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:700}} onClick={()=>joinCommunity(activeCommunity.id)}>+ Join</button>}{joined&&<div style={{fontSize:11,borderRadius:20,padding:"5px 12px",border:`1px solid ${cfg.border}`,fontWeight:700,color:cfg.color,background:cfg.bg}}>✓ Member</div>}</div></div><div style={{padding:"20px 20px 16px",textAlign:"center",margin:"0 16px 14px",borderRadius:18,border:"1px solid rgba(200,137,90,0.12)",background:`linear-gradient(135deg,${cfg.bg},rgba(253,246,236,0.5))`}}><div style={{fontSize:40,marginBottom:6}}>{activeCommunity?.emoji}</div><h2 style={{fontFamily:"'Lora',serif",fontSize:20,fontWeight:600,color:"#5a2e0e",marginBottom:5}}>{activeCommunity?.name}</h2><p style={{fontSize:13,color:"#b08060",fontStyle:"italic",fontFamily:"'Lora',serif",lineHeight:1.5}}>{activeCommunity?.description}</p></div><div style={{display:"flex",gap:0,margin:"0 16px 14px",background:"rgba(200,137,90,0.06)",borderRadius:14,padding:4}}><button onClick={()=>setCommunityView("feed")} style={{flex:1,padding:"8px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,background:communityView==="feed"?"white":"transparent",color:communityView==="feed"?"#5a2e0e":"#b08060",boxShadow:communityView==="feed"?"0 1px 6px rgba(0,0,0,0.08)":"none",transition:"all 0.2s"}}>💬 Feed</button><button onClick={()=>setCommunityView("stories")} style={{flex:1,padding:"8px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,background:communityView==="stories"?"white":"transparent",color:communityView==="stories"?"#5a2e0e":"#b08060",boxShadow:communityView==="stories"?"0 1px 6px rgba(0,0,0,0.08)":"none",transition:"all 0.2s"}}>🎙️ Story of the Month</button></div>
  {communityView==="stories"&&<StoryOfTheMonth communityId={activeCommunity?.id} cfg={cfg}/>}
  {communityView==="feed"&&<>{prompt&&(<div style={{margin:"0 16px 12px",background:"rgba(255,252,246,0.95)",borderRadius:16,padding:"16px 18px",border:"1px solid rgba(200,137,90,0.15)",boxShadow:"0 2px 12px rgba(160,100,50,0.08)"}}><div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",fontWeight:700,marginBottom:8,color:cfg.color}}>✦ Today's Prompt</div><p style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:14,color:"#5a3a1a",lineHeight:1.7,marginBottom:12}}>"{prompt}"</p><button style={{background:"transparent",border:`1px solid ${cfg.color}`,borderRadius:20,padding:"6px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif",color:cfg.color}} onClick={()=>{setIsPromptMode(true);setNewPost("");}}>Answer this →</button></div>)}{hasAccess&&(<div style={{margin:"0 16px 12px",background:"rgba(255,252,246,0.97)",borderRadius:18,padding:"16px",boxShadow:"0 2px 16px rgba(160,100,50,0.1)",border:"1px solid rgba(200,137,90,0.15)"}}>{isPromptMode&&(<div style={{fontSize:11,color:"#c8895a",fontWeight:700,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(200,137,90,0.07)",padding:"6px 10px",borderRadius:8}}>✦ Answering today's prompt<button style={{background:"none",border:"none",fontSize:12,color:"#b08060",cursor:"pointer"}} onClick={()=>setIsPromptMode(false)}>✕</button></div>)}<textarea style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(200,137,90,0.2)",borderRadius:12,fontFamily:"'Lora',serif",fontSize:14,color:"#5a3a1a",resize:"none",outline:"none",lineHeight:1.7,marginBottom:10,background:"rgba(253,248,242,0.8)",boxSizing:"border-box",fontStyle:"italic"}} placeholder={isPromptMode?"Share your thoughts here...":"What's on your heart today?"} value={newPost} onChange={e=>setNewPost(e.target.value)} rows={3}/><div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>{COMMUNITY_MOOD_TAGS.map(mood=>(<button key={mood.label} style={{border:"1px solid",borderRadius:20,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:600,background:selectedMood?.label===mood.label?"rgba(200,137,90,0.15)":"transparent",borderColor:selectedMood?.label===mood.label?"#c8895a":"rgba(200,180,160,0.3)",color:selectedMood?.label===mood.label?"#7a4a1e":"#b08060"}} onClick={()=>setSelectedMood(selectedMood?.label===mood.label?null:mood)}>{mood.emoji} {mood.label}</button>))}</div><div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:10}}><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:"#9a7050"}}><input type="checkbox" checked={isAnon} onChange={e=>setIsAnon(e.target.checked)} style={{accentColor:"#c8895a",width:14,height:14}}/>Post anonymously</label><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,color:"#7a4a1e",background:"rgba(122,74,30,0.05)",padding:"8px 10px",borderRadius:10,border:"1px solid rgba(122,74,30,0.12)"}}><input type="checkbox" checked={submitToMonth} onChange={e=>setSubmitToMonth(e.target.checked)} style={{accentColor:"#c8895a",width:14,height:14}}/><span>🎙️ <strong>Submit for Story of the Month</strong></span></label></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>{selectedMood&&<span style={{fontSize:12,color:"#c8895a",fontWeight:600,fontStyle:"italic"}}>{selectedMood.emoji} {selectedMood.label}</span>}<button style={{background:cfg.color,color:"white",border:"none",borderRadius:20,padding:"8px 22px",fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:700,marginLeft:"auto",opacity:!newPost.trim()||submitting?0.5:1}} disabled={!newPost.trim()||submitting} onClick={submitPost}>{submitting?"Sharing...":"Share 🌿"}</button></div></div>)}{postsLoading?<div style={{textAlign:"center",padding:"40px",color:"#b08060",fontStyle:"italic"}}>Loading posts...</div>:posts.length===0?(<div style={{textAlign:"center",padding:"40px 24px"}}><div style={{fontSize:36,marginBottom:10}}>{activeCommunity?.emoji}</div><p style={{fontFamily:"'Lora',serif",fontStyle:"italic",color:"#b08060",fontSize:14,lineHeight:1.7}}>No posts yet. Be the first to share something here. 🌿</p></div>):(<div style={{padding:"0 16px"}}>{posts.filter(p=>!blockedIds.includes(p.user_id)).map(post=>(<div key={post.id} style={{background:"rgba(255,252,246,0.95)",borderRadius:18,padding:"16px",marginBottom:10,border:"1px solid rgba(200,137,90,0.12)",boxShadow:"0 2px 10px rgba(160,100,50,0.07)"}}>{post.submit_to_sotm&&<div style={{fontSize:10,fontWeight:700,color:"#7a4a1e",background:"rgba(122,74,30,0.08)",border:"1px solid rgba(122,74,30,0.15)",padding:"3px 10px",borderRadius:8,marginBottom:10,display:"inline-block"}}>🎙️ Submitted for Story of the Month</div>}{post.is_prompt_response&&<div style={{fontSize:10,fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",padding:"3px 10px",borderRadius:8,border:`1px solid ${cfg.border}`,marginBottom:10,display:"inline-block",color:cfg.color,background:cfg.bg}}>✦ Prompt response</div>}<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}><div style={{width:34,height:34,borderRadius:"50%",background:post.is_anonymous?"linear-gradient(135deg,#b0a090,#9a8878)":`linear-gradient(135deg,${cfg.color}88,${cfg.color})`,color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>{post.is_anonymous?"👤":(post.user_id||"?")[0].toUpperCase()}</div><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#5a2e0e"}}>{post.is_anonymous?"Anonymous":post.display_name||post.user_id?.split("@")[0]||"Anonymous"}</div><div style={{fontSize:11,color:"#b08060",marginTop:1}}>{timeAgo(post.created_at)}</div></div>{post.mood_tag&&<div style={{fontSize:11,color:"#9a7050",background:"rgba(200,137,90,0.08)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:12,padding:"3px 10px",flexShrink:0,fontWeight:600}}>{post.mood_tag}</div>}</div><p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#5a3a1a",lineHeight:1.8,marginBottom:12,fontStyle:"italic"}}>{post.content}</p>{post.user_id!==userKey&&<div style={{display:"flex",gap:10,marginBottom:8}}><button onClick={()=>reportPost(post.id,post.user_id)} style={{background:"none",border:"none",fontSize:11,color:"#b08060",cursor:"pointer",padding:0}}>🚩 Report</button><button onClick={()=>blockUser(post.user_id)} style={{background:"none",border:"none",fontSize:11,color:"#b08060",cursor:"pointer",padding:0}}>🚫 Block</button></div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{COMMUNITY_REACTIONS.map(emoji=>{const count=reactions[post.id]?.[emoji]||0;const isMine=myReactions[post.id]===emoji;return(<button key={emoji} style={{border:"1px solid",borderRadius:20,padding:"4px 10px",fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:4,background:isMine?"rgba(200,137,90,0.12)":"transparent",borderColor:isMine?"#c8895a":"rgba(200,180,160,0.3)",fontWeight:isMine?700:400}} onClick={()=>reactToPost(post.id,emoji)}>{emoji}{count>0&&<span style={{fontSize:11,color:"#c8895a",fontWeight:700}}>{count}</span>}</button>);})}</div></div>))}</div>)}</>}</div>);
}

// ── AMBIENT SOUND ──
function useAmbientSound(){
  const ctxRef=useRef(null);const nodesRef=useRef([]);
  const stop=useCallback(()=>{nodesRef.current.forEach(n=>{try{n.stop&&n.stop();n.disconnect&&n.disconnect();}catch(e){}});nodesRef.current=[];if(ctxRef.current){ctxRef.current.close();ctxRef.current=null;}ambientStopRef.current=null;},[]);
  const play=useCallback((sound)=>{
    stop();const AudioCtx=window.AudioContext||window.webkitAudioContext;const ctx=new AudioCtx();ctxRef.current=ctx;ambientStopRef.current=stop;
    const master=ctx.createGain();master.gain.value=0.4;master.connect(ctx.destination);const nodes=[];
    function makeNoise(color){const bufSize=ctx.sampleRate*3;const buf=ctx.createBuffer(1,bufSize,ctx.sampleRate);const data=buf.getChannelData(0);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(let i=0;i<bufSize;i++){const w=Math.random()*2-1;if(color==="pink"){b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;data[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)/7;b6=w*0.115926;}else{data[i]=w;}}const src=ctx.createBufferSource();src.buffer=buf;src.loop=true;return src;}
    if(sound.type==="birds"){const src=makeNoise("pink");const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=1200;bp.Q.value=0.3;const g=ctx.createGain();g.gain.value=0.2;src.connect(bp);bp.connect(g);g.connect(master);src.start();nodes.push(src);function scheduleChirp(){if(!ctxRef.current)return;const n=2+Math.floor(Math.random()*3);for(let i=0;i<n;i++){setTimeout(function(){const sw=2+Math.floor(Math.random()*3);for(let s=0;s<sw;s++){setTimeout(function(){const osc=ctx.createOscillator();const eg=ctx.createGain();const f=2000+Math.random()*2000;osc.type="sine";osc.frequency.setValueAtTime(f,ctx.currentTime);osc.frequency.linearRampToValueAtTime(f*1.2,ctx.currentTime+0.05);osc.frequency.linearRampToValueAtTime(f*0.95,ctx.currentTime+0.1);eg.gain.setValueAtTime(0,ctx.currentTime);eg.gain.linearRampToValueAtTime(0.1,ctx.currentTime+0.01);eg.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12);osc.connect(eg);eg.connect(master);osc.start();osc.stop(ctx.currentTime+0.15);},s*110);}},i*400+Math.random()*300);}setTimeout(scheduleChirp,2000+Math.random()*4000);}scheduleChirp();}
    else if(sound.type==="leaves"){const src=makeNoise("pink");const hi=ctx.createBiquadFilter();hi.type="highpass";hi.frequency.value=800;const lo=ctx.createBiquadFilter();lo.type="lowpass";lo.frequency.value=5000;const g=ctx.createGain();g.gain.value=0.85;src.connect(hi);hi.connect(lo);lo.connect(g);g.connect(master);src.start();nodes.push(src);const lfo=ctx.createOscillator();const lfoG=ctx.createGain();lfoG.gain.value=0.3;lfo.frequency.value=0.08+Math.random()*0.05;lfo.connect(lfoG);lfoG.connect(g.gain);lfo.start();nodes.push(lfo);function scheduleGust(){if(!ctxRef.current)return;const src2=makeNoise("pink");const bp=ctx.createBiquadFilter();bp.type="bandpass";bp.frequency.value=2000+Math.random()*1000;bp.Q.value=0.5;const eg=ctx.createGain();const dur=0.6+Math.random()*1.2;eg.gain.setValueAtTime(0,ctx.currentTime);eg.gain.linearRampToValueAtTime(0.45,ctx.currentTime+0.2);eg.gain.linearRampToValueAtTime(0,ctx.currentTime+dur);src2.connect(bp);bp.connect(eg);eg.connect(master);src2.start();src2.stop(ctx.currentTime+dur+0.1);setTimeout(scheduleGust,3000+Math.random()*6000);}scheduleGust();}
    else if(sound.type==="waves"){const src=makeNoise("pink");const lo=ctx.createBiquadFilter();lo.type="lowpass";lo.frequency.value=350;const mid=ctx.createBiquadFilter();mid.type="bandpass";mid.frequency.value=180;mid.Q.value=0.4;const g=ctx.createGain();g.gain.value=1.4;src.connect(lo);lo.connect(mid);mid.connect(g);g.connect(master);src.start();nodes.push(src);const lfo=ctx.createOscillator();const lfoG=ctx.createGain();lfoG.gain.value=0.5;lfo.frequency.value=0.12;lfo.connect(lfoG);lfoG.connect(g.gain);lfo.start();nodes.push(lfo);function scheduleCrash(){if(!ctxRef.current)return;const s=makeNoise("white");const hp=ctx.createBiquadFilter();hp.type="highpass";hp.frequency.value=600;const eg=ctx.createGain();const dur=1.5+Math.random()*1.5;eg.gain.setValueAtTime(0,ctx.currentTime);eg.gain.linearRampToValueAtTime(0.4,ctx.currentTime+0.15);eg.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+dur);s.connect(hp);hp.connect(eg);eg.connect(master);s.start();s.stop(ctx.currentTime+dur+0.1);setTimeout(scheduleCrash,4000+Math.random()*3000);}scheduleCrash();}
    else if(sound.type==="static"){const src=makeNoise("white");const lo=ctx.createBiquadFilter();lo.type="lowpass";lo.frequency.value=8000;const hi=ctx.createBiquadFilter();hi.type="highpass";hi.frequency.value=200;const g=ctx.createGain();g.gain.value=0.75;src.connect(lo);lo.connect(hi);hi.connect(g);g.connect(master);src.start();nodes.push(src);}
    nodesRef.current=nodes;
  },[stop]);
  return{play,stop};
}

function AmbientPlayer({playing,onToggle}){const toggle=onToggle;return(<div style={{paddingTop:8}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>{AMBIENT_SOUNDS.map(s=>(<button key={s.id} onClick={()=>toggle(s)} style={{background:playing===s.id?"rgba(91,143,168,0.18)":"rgba(91,143,168,0.05)",border:`1.5px solid ${playing===s.id?"#5b8fa8":"rgba(91,143,168,0.18)"}`,borderRadius:16,padding:"16px 10px",display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",transition:"all 0.2s"}}><span style={{fontSize:28}}>{s.icon}</span><span style={{fontSize:12,fontWeight:700,color:playing===s.id?"#5b8fa8":"#7a5030",fontFamily:"'Nunito',sans-serif",textAlign:"center",lineHeight:1.3}}>{s.name}</span>{playing===s.id&&<span style={{fontSize:9,color:"#5b8fa8",fontWeight:700,letterSpacing:"1px"}}>▶ PLAYING</span>}</button>))}</div><p style={{fontSize:11,color:"#b08060",textAlign:"center",fontStyle:"italic",marginTop:6}}>Tap a sound to play · Tap again to stop<br/>Your sound keeps playing as you move around the app 🌿</p></div>);}

function NestTab({user,isPro,isOTR,aiPrompt,promptLoading,onWrite,theme,ambientPlaying,onToggleAmbient}){
  const T=theme||THEMES.original;const [openSections,setOpenSections]=useState([]);const isOpen=(id)=>openSections.includes(id);const affirmation=getDailyAffirmation();const weekIndex=Math.ceil((new Date()-new Date(new Date().getFullYear(),0,1))/(7*24*60*60*1000))%WEEKLY_BREATHWORK.length;const weeklyBreath=WEEKLY_BREATHWORK[weekIndex];const nightTime=isNightTime();
  function toggleSection(id){setOpenSections(o=>o.includes(id)?o.filter(x=>x!==id):[...o,id]);}
  return(<div style={{display:"flex",flexDirection:"column",gap:0}}><div style={{padding:"0 0 20px"}}><PageHeader kicker="A soft place" title="Your Nest" sub="Pause here. Breathe here. Come back to yourself here."/></div><div style={{display:"flex",flexDirection:"column",gap:14}}><NestCard icon="💫" title="Daily Affirmation" subtitle="Your daily reminder to soften and center" color={T.accent} onOpen={()=>toggleSection("affirmation")} open={isOpen("affirmation")}>{isOpen("affirmation")&&(<div style={{textAlign:"center",padding:"16px 0 8px"}}><p style={{fontFamily:"'Lora',serif",fontSize:18,color:T.text,fontStyle:"italic",lineHeight:1.65,marginBottom:14}}>"{affirmation}"</p><button onClick={(e)=>{e.stopPropagation();if(window._setSharePrompt)window._setSharePrompt(affirmation);}} style={{...S.softBtn,background:"rgba(122,74,30,0.08)",border:"1px solid rgba(122,74,30,0.2)",color:"#7a4a1e"}}>Share 💫</button></div>)}</NestCard><NestCard icon="🌬️" title="Breathwork" subtitle={`This week: ${weeklyBreath.name}: ${weeklyBreath.desc}`} color="#7a8c6e" onOpen={()=>toggleSection("breath")} open={isOpen("breath")}>{isOpen("breath")&&<BreathworkPlayer exercise={weeklyBreath}/>}</NestCard><NestCard icon="🧘" title="2-min Meditation" subtitle="Pause for 2 minutes. Sit back, settle in, return to calm." color="#9b7eb8" onOpen={()=>toggleSection("meditation")} open={isOpen("meditation")}>{isOpen("meditation")&&<MeditationPlayer isOTR={isOTR}/>}</NestCard><NestCard icon="🎵" title="Ambient Sounds" subtitle="Birds, leaves, waves, or white noise. Find your calm." color="#5b8fa8" onOpen={()=>toggleSection("sound")} open={isOpen("sound")}>{isOpen("sound")&&<AmbientPlayer playing={ambientPlaying} onToggle={onToggleAmbient}/>}</NestCard><NestCard icon="🪨" title="Set It Down" subtitle="Put down what you've been carrying. It goes to Hallie, anonymously." color="#7c5cbf" onOpen={()=>toggleSection("setitdown")} open={isOpen("setitdown")}>{isOpen("setitdown")&&<div style={{background:"linear-gradient(175deg,#2b2443 0%,#3d3354 60%,#54476a 100%)",borderRadius:16,padding:"20px 18px"}}><SetItDownPanel compact/></div>}</NestCard><NestCard icon="🎙️" title="Listen" subtitle="The latest from the My Inner Mind podcast." color="#9b7eb8" onOpen={()=>toggleSection("podcast")} open={isOpen("podcast")}>{isOpen("podcast")&&<PodcastPlayer/>}</NestCard><NestCard icon={nightTime?"🌙":"✨"} title={nightTime?"Tonight's Reflection":"Today's Prompt"} subtitle={nightTime?"Softly close the day with intention.":"A gentle nudge for self-reflection."} color={nightTime?"#6b5ba8":"#c8895a"} onOpen={()=>toggleSection("prompt")} open={isOpen("prompt")}>{isOpen("prompt")&&(<div style={{padding:"12px 0 4px"}}><p style={{fontFamily:"'Lora',serif",fontSize:15,color:T.text,fontStyle:"italic",lineHeight:1.7,marginBottom:14}}>{nightTime?getNightPrompt():(promptLoading?"Finding your prompt...":aiPrompt||"What are you grateful for right now?")}</p><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={(e)=>{e.stopPropagation();onWrite(nightTime?getNightPrompt():aiPrompt);}} style={S.softBtn}>Write to this →</button><button onClick={(e)=>{e.stopPropagation();if(window._setSharePrompt)window._setSharePrompt(nightTime?getNightPrompt():aiPrompt);}} style={{...S.softBtn,background:"rgba(122,74,30,0.08)",border:"1px solid rgba(122,74,30,0.2)",color:"#7a4a1e"}}>Share 🌿</button></div></div>)}</NestCard></div></div>);
}

function NestCard({icon,title,subtitle,color,onOpen,open,children}){const lastChildren=useRef(children);if(open&&children)lastChildren.current=children;const [mounted,setMounted]=useState(open);useEffect(()=>{if(open){setMounted(true);return;}const t=setTimeout(()=>setMounted(false),320);return()=>clearTimeout(t);},[open]);const body=open?children:(mounted?lastChildren.current:null);return(<div style={{background:"rgba(255,252,246,0.93)",border:`1px solid ${open?color+"55":"rgba(200,137,90,0.12)"}`,borderRadius:20,overflow:"hidden",transition:"border-color 0.3s, box-shadow 0.3s",boxShadow:open?"0 6px 22px rgba(90,46,14,0.07)":"none"}}><button onClick={onOpen} aria-expanded={open} style={{width:"100%",background:"none",border:"none",padding:"18px 20px",display:"flex",alignItems:"center",gap:14,cursor:"pointer",textAlign:"left"}} type="button"><div style={{width:44,height:44,borderRadius:14,background:`${color}18`,border:`1px solid ${color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{icon}</div><div style={{flex:1}}><div style={{fontWeight:700,color:"#5a2e0e",fontSize:15,fontFamily:"'Nunito',sans-serif"}}>{title}</div><div style={{fontSize:12,color:"#b08060",marginTop:2,lineHeight:1.4}}>{subtitle}</div></div><span style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,background:open?`${color}22`:"rgba(200,137,90,0.08)",transition:"background 0.3s"}}><svg width="14" height="14" viewBox="0 0 14 14" style={{transition:"transform 0.32s ease",transform:open?"rotate(180deg)":"rotate(0deg)"}}><path d="M3 5.5 L7 9.5 L11 5.5" stroke={open?color:"#b08060"} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg></span></button><div style={{display:"grid",gridTemplateRows:open?"1fr":"0fr",transition:"grid-template-rows 0.32s ease"}}><div style={{overflow:"hidden",minHeight:0}}><div style={{padding:"0 20px 18px",opacity:open?1:0,transition:"opacity 0.25s ease"}}>{body}</div></div></div></div>);}

const WEEKLY_BREATHWORK=[{id:"box",name:"Box Breathing",desc:"Calm your nervous system",inhale:4,hold1:4,exhale:4,hold2:4,cycles:4,color:"#7a8c6e"},{id:"478",name:"4-7-8 Breathing",desc:"For sleep & deep calm",inhale:4,hold1:7,exhale:8,hold2:0,cycles:3,color:"#9b7eb8"},{id:"belly",name:"Belly Breathing",desc:"Deep grounding breath",inhale:5,hold1:2,exhale:6,hold2:1,cycles:4,color:"#c8895a"},{id:"reset",name:"Quick Reset",desc:"1-minute instant calm",inhale:3,hold1:1,exhale:5,hold2:0,cycles:5,color:"#5b8fa8"}];
const MEDITATIONS=[{id:"return",name:"Return to Calm",duration:"2 min",free:true,steps:["Find a comfortable position and gently close your eyes.","Take a slow breath in through your nose... and release it through your mouth.","Notice where your body is holding tension right now. Just notice. No need to fix anything.","With your next exhale, imagine that tension softening. Just a little.","You are safe in this moment. Nothing needs your attention right now.","Breathe in what you need... breathe out what you don't.","Rest here for a moment. You are allowed to simply be.","When you're ready, slowly open your eyes. Carry this calm with you."]},{id:"morning",name:"Morning Intention",duration:"2 min",free:false,steps:["Begin your day by arriving fully in your body.","Take three deep breaths before you do anything else.","Ask yourself: what do I want to feel today?","Not what you want to accomplish. How you want to feel.","Let that feeling settle into your chest like warmth.","You get to choose your energy today, even when things feel uncertain.","Set one gentle intention. Just one. Something that honors you.","Carry it like a quiet thread through your whole day."]},{id:"release",name:"Let It Go",duration:"2 min",free:false,steps:["Think of one thing you've been holding onto today.","It could be a worry, a conversation, a feeling, anything weighing on you.","Breathe it in fully. Really acknowledge it.","Now with your exhale, imagine placing it down. Not throwing it away. Just setting it down.","You don't have to carry everything all the time.","Some things aren't yours to solve tonight.","Breathe in peace. Breathe out weight.","You are lighter than you think. Rest now."]}];

function BreathworkPlayer({exercise}){const [phase,setPhase]=useState("ready");const [count,setCount]=useState(0);const [cycle,setCycle]=useState(0);const [running,setRunning]=useState(false);const [size,setSize]=useState(120);useEffect(()=>{if(!running)return;const phases=[{name:"Breathe in",duration:exercise.inhale,size:180},...(exercise.hold1?[{name:"Hold",duration:exercise.hold1,size:180}]:[]),{name:"Breathe out",duration:exercise.exhale,size:120},...(exercise.hold2?[{name:"Hold",duration:exercise.hold2,size:120}]:[])];let phaseIdx=0,elapsed=0;setPhase(phases[0].name);setSize(phases[0].size);const interval=setInterval(()=>{elapsed++;setCount(phases[phaseIdx].duration-elapsed);if(elapsed>=phases[phaseIdx].duration){elapsed=0;phaseIdx=(phaseIdx+1)%phases.length;if(phaseIdx===0){setCycle(c=>{if(c+1>=exercise.cycles){setRunning(false);setPhase("done");clearInterval(interval);return 0;}return c+1;});}setPhase(phases[phaseIdx].name);setSize(phases[phaseIdx].size);}},1000);return()=>clearInterval(interval);},[running,exercise]);return(<div style={{textAlign:"center",padding:"16px 0"}}><div style={{position:"relative",width:200,height:200,margin:"0 auto 20px"}}><div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:size,height:size,borderRadius:"50%",background:`${exercise.color}22`,border:`3px solid ${exercise.color}`,transition:"all 1s ease-in-out",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><div style={{fontSize:13,fontWeight:700,color:exercise.color,textAlign:"center",lineHeight:1.3}}>{phase==="done"?"Done ✓":phase==="ready"?"Tap to begin":phase}</div>{running&&<div style={{fontSize:24,fontWeight:800,color:exercise.color}}>{count}</div>}</div></div></div><div style={{fontSize:12,color:"#b08060",marginBottom:14}}>Cycle {cycle+1} of {exercise.cycles}</div>{!running&&phase!=="done"&&<button onClick={()=>{setRunning(true);setCycle(0);}} style={{...S.saveBtn,padding:"10px 28px"}}>Begin →</button>}{running&&<button onClick={()=>{setRunning(false);setPhase("ready");setCycle(0);}} style={S.ghostBtn}>Stop</button>}{phase==="done"&&<div style={{fontSize:16,color:"#7a4a1e",fontFamily:"'Lora',serif",fontStyle:"italic"}}>Well done 🌿 Take a moment to notice how you feel.</div>}</div>);}

// Pre-recorded narration clips: src/meditations/<meditationId>/<step>.mp3
const MEDITATION_AUDIO=(()=>{const files=import.meta.glob("./meditations/*/*.mp3",{eager:true,as:"url"});const out={};for(const [path,url] of Object.entries(files)){const m=path.match(/meditations\/([^/]+)\/(\d+)\.mp3$/);if(!m)continue;(out[m[1]]=out[m[1]]||[])[Number(m[2])-1]=url;}return out;})();
function pickCalmVoice(){if(!window.speechSynthesis)return null;const voices=window.speechSynthesis.getVoices()||[];const en=voices.filter(v=>/^en/i.test(v.lang));const preferred=["Samantha","Ava","Allison","Susan","Karen","Moira","Tessa","Serena","Victoria","Google US English","Microsoft Aria","Microsoft Jenny"];for(const name of preferred){const v=en.find(x=>x.name.includes(name));if(v)return v;}return en.find(v=>/female/i.test(v.name))||en.find(v=>v.lang==="en-US")||en[0]||null;}
function playSoftChime(){try{const AudioCtx=window.AudioContext||window.webkitAudioContext;const ctx=new AudioCtx();[528,792].forEach((f,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.type="sine";o.frequency.value=f;g.gain.setValueAtTime(0,ctx.currentTime+i*0.25);g.gain.linearRampToValueAtTime(0.12,ctx.currentTime+i*0.25+0.05);g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.25+3);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*0.25);o.stop(ctx.currentTime+i*0.25+3.1);});setTimeout(()=>{try{ctx.close();}catch(e){}},4000);}catch(e){}}
function meditationPauseFor(step){const t=step.toLowerCase();if(/breath|breathe|rest here|simply be|settle/.test(t))return 9000;return 6000;}

function MeditationPlayer({isOTR}){
  const ttsSupported=typeof window!=="undefined"&&"speechSynthesis" in window&&typeof window.SpeechSynthesisUtterance!=="undefined";const voiceSupported=ttsSupported||Object.keys(MEDITATION_AUDIO).length>0;const audioRef=useRef(null);
  const [selected,setSelected]=useState(null);const [stepIdx,setStepIdx]=useState(0);const [mode,setMode]=useState(voiceSupported?"voice":"read");const [status,setStatus]=useState("idle");
  const tokenRef=useRef(0);const timerRef=useRef(null);const voiceRef=useRef(null);
  const available=isOTR?MEDITATIONS:MEDITATIONS.filter(m=>m.free);
  useEffect(()=>{if(!ttsSupported)return;const load=()=>{voiceRef.current=pickCalmVoice();};load();window.speechSynthesis.addEventListener?.("voiceschanged",load);return()=>{window.speechSynthesis.removeEventListener?.("voiceschanged",load);};},[]);
  function halt(){tokenRef.current++;clearTimeout(timerRef.current);if(ttsSupported)window.speechSynthesis.cancel();if(audioRef.current){audioRef.current.onended=null;audioRef.current.onerror=null;audioRef.current.pause();}}
  useEffect(()=>()=>halt(),[]);
  function speakFrom(med,idx){
    halt();const token=tokenRef.current;setStepIdx(idx);setStatus("playing");
    const next=()=>{if(token!==tokenRef.current)return;if(idx>=med.steps.length-1){timerRef.current=setTimeout(()=>{if(token!==tokenRef.current)return;playSoftChime();setStatus("done");},2500);}else{timerRef.current=setTimeout(()=>{if(token===tokenRef.current)speakFrom(med,idx+1);},meditationPauseFor(med.steps[idx]));}};
    const clip=MEDITATION_AUDIO[med.id]?.[idx];
    if(clip){if(!audioRef.current)audioRef.current=new Audio();const a=audioRef.current;a.src=clip;a.onended=next;a.onerror=()=>{if(token===tokenRef.current)setStatus("paused");};a.play().catch(()=>{if(token===tokenRef.current)setStatus("paused");});return;}
    if(!ttsSupported){setStatus("paused");return;}
    const text=med.steps[idx].replace(/—/g,", ");const u=new SpeechSynthesisUtterance(text);
    if(voiceRef.current)u.voice=voiceRef.current;u.rate=0.82;u.pitch=1;u.volume=1;
    u.onend=next;
    u.onerror=()=>{if(token!==tokenRef.current)return;setStatus("paused");};
    window.speechSynthesis.speak(u);
  }
  function begin(m){setSelected(m);setStepIdx(0);if(mode==="voice"&&voiceSupported){speakFrom(m,0);}else{setStatus("idle");}}
  function pause(){halt();setStatus("paused");}
  function resume(){speakFrom(selected,stepIdx);}
  function exit(){halt();setSelected(null);setStepIdx(0);setStatus("idle");}

  if(selected&&mode==="voice"){
    const step=selected.steps[stepIdx];const done=status==="done";
    return(<div style={{padding:"8px 0"}}><style>{`@keyframes mimGlow{0%,100%{transform:scale(0.92);opacity:0.55}50%{transform:scale(1.08);opacity:1}}`}</style>
      <div style={{background:"linear-gradient(160deg,rgba(155,126,184,0.16),rgba(200,137,90,0.08))",borderRadius:20,padding:"28px 20px 22px",marginBottom:14,textAlign:"center"}}>
        <div style={{width:96,height:96,margin:"0 auto 18px",borderRadius:"50%",background:"radial-gradient(circle,rgba(155,126,184,0.45),rgba(155,126,184,0.08) 70%)",animation:status==="playing"?"mimGlow 6s ease-in-out infinite":"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34}}>{done?"🌿":"🧘"}</div>
        <div style={{fontSize:11,fontWeight:700,color:"#9b7eb8",textTransform:"uppercase",letterSpacing:"1.2px",marginBottom:10}}>{done?"Complete":status==="paused"?"Paused":"Close your eyes · Just listen"}</div>
        <p style={{fontFamily:"'Lora',serif",fontSize:15,color:"#7a5030",fontStyle:"italic",lineHeight:1.7,minHeight:52,opacity:0.8}}>{done?"Well done. Take this calm with you.":step}</p>
        <div style={{display:"flex",justifyContent:"center",gap:6,marginTop:14}}>{selected.steps.map((_,i)=>(<span key={i} style={{width:7,height:7,borderRadius:"50%",background:(done||i<=stepIdx)?"#9b7eb8":"rgba(155,126,184,0.22)",transition:"background 0.4s"}}/>))}</div>
      </div>
      <div style={{display:"flex",justifyContent:"center",gap:8}}>
        <button onClick={exit} style={S.ghostBtn}>← Back</button>
        {status==="playing"&&<button onClick={pause} style={S.saveBtn}>⏸ Pause</button>}
        {status==="paused"&&<button onClick={resume} style={S.saveBtn}>▶ Resume</button>}
        {done&&<button onClick={exit} style={{...S.saveBtn,background:"linear-gradient(135deg,#7a8c6e,#6a7c5e)"}}>Complete ✓</button>}
      </div>
      <p style={{fontSize:11,color:"#b08060",textAlign:"center",fontStyle:"italic",marginTop:12}}>Turn your volume up and silent mode off. Pairs beautifully with an Ambient Sound.</p>
    </div>);
  }

  if(selected){const step=selected.steps[stepIdx];const isLast=stepIdx===selected.steps.length-1;return(<div style={{padding:"8px 0"}}><div style={{background:"linear-gradient(135deg,rgba(155,126,184,0.1),rgba(200,137,90,0.07))",borderRadius:16,padding:"20px",marginBottom:14,minHeight:100,display:"flex",alignItems:"center",justifyContent:"center"}}><p style={{fontFamily:"'Lora',serif",fontSize:16,color:"#5a2e0e",fontStyle:"italic",lineHeight:1.75,textAlign:"center"}}>{step}</p></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:12,color:"#b08060"}}>{stepIdx+1} / {selected.steps.length}</div><div style={{display:"flex",gap:8}}><button onClick={exit} style={S.ghostBtn}>← Back</button>{!isLast?<button onClick={()=>setStepIdx(i=>i+1)} style={S.saveBtn}>Next →</button>:<button onClick={exit} style={{...S.saveBtn,background:"linear-gradient(135deg,#7a8c6e,#6a7c5e)"}}>Complete ✓</button>}</div></div></div>);}

  return(<div style={{display:"flex",flexDirection:"column",gap:10,paddingTop:8}}>
    {voiceSupported&&(<div style={{display:"flex",gap:0,background:"rgba(155,126,184,0.08)",borderRadius:14,padding:4}}>{[["voice","🎧 Guide me (voice)"],["read","📖 Read at my pace"]].map(([k,l])=>(<button key={k} onClick={(e)=>{e.stopPropagation();setMode(k);}} style={{flex:1,padding:"8px 6px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,background:mode===k?"rgba(255,252,246,0.98)":"transparent",color:mode===k?"#7a5a9e":"#b08060",boxShadow:mode===k?"0 1px 4px rgba(90,46,14,0.08)":"none"}}>{l}</button>))}</div>)}
    {available.map(m=>(<button key={m.id} onClick={()=>begin(m)} style={{background:"rgba(155,126,184,0.08)",border:"1px solid rgba(155,126,184,0.2)",borderRadius:14,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}><div><div style={{fontWeight:700,color:"#5a2e0e",fontSize:14}}>{m.name}</div><div style={{fontSize:12,color:"#b08060",marginTop:2}}>{m.duration}{mode==="voice"&&voiceSupported?" · voice guided":""}</div></div><span style={{fontSize:18}}>{mode==="voice"&&voiceSupported?"▶":"›"}</span></button>))}
    {!isOTR&&<div style={{fontSize:12,color:"#b08060",textAlign:"center",fontStyle:"italic",padding:"4px 0"}}>✨ More meditations on Off the Record at halliewho.com</div>}
  </div>);
}

const MINI_CHALLENGES=[{id:"healing7",icon:"🌱",title:"7-Day Healing Series",duration:7,color:"#7a9e7e",desc:"A gentle week of turning inward. Release, restore, and come back to yourself.",days:[{day:1,prompt:"What are you carrying right now that isn't yours to carry? Write it out and then write: I release this."},{day:2,prompt:"Describe a wound that has taught you something beautiful. How did that pain shape you?"},{day:3,prompt:"Write a letter to a younger version of yourself who needed to hear something they never got to hear."},{day:4,prompt:"What does healing look like for you? Not what it's supposed to look like, but what it actually feels like?"},{day:5,prompt:"Who in your life makes you feel most like yourself? What do they see in you that you sometimes forget?"},{day:6,prompt:"Name three ways you have grown in the last year that no one else would notice but you."},{day:7,prompt:"Write yourself a blessing. Something you wish someone had said to you. Say it to yourself now."}]},{id:"gratitude5",icon:"🙏",title:"5-Day Gratitude Reset",duration:5,color:"#c8895a",desc:"Not toxic positivity. Real, specific gratitude that rewires how you see your life.",days:[{day:1,prompt:"Write about something you almost missed today, a small moment that could have gone unnoticed but didn't."},{day:2,prompt:"Who is someone in your life who shows up quietly? Write them a thank you they'll never see."},{day:3,prompt:"What is something about your body you are grateful for today? Not how it looks. What it does."},{day:4,prompt:"Write about a hard season that gave you something you wouldn't trade. What did difficulty teach you?"},{day:5,prompt:"Write a love letter to your own life, exactly as it is right now, imperfect and in process."}]},{id:"confidence10",icon:"🔥",title:"10-Day Confidence Builder",duration:10,color:"#c47c2a",desc:"Call yourself back. Rebuild your belief in who you are and what you're capable of.",days:[{day:1,prompt:"Write about a time you did something that scared you. How did it feel on the other side?"},{day:2,prompt:"What is something you are actually really good at that you rarely let yourself claim?"},{day:3,prompt:"Write about a version of yourself you've been afraid to become. What's stopping you?"},{day:4,prompt:"Describe your dream life in present tense, as if it's already happening. How do you live?"},{day:5,prompt:"What would you do this week if you weren't afraid of what people thought?"},{day:6,prompt:"Write about a compliment you've received that you dismissed. Receive it now."},{day:7,prompt:"What are three things you've built, created, or overcome that prove you are more capable than you think?"},{day:8,prompt:"What boundary would change your life if you set it? Write it out as a declaration."},{day:9,prompt:"Who are you becoming? Describe that person in detail. What do they believe about themselves?"},{day:10,prompt:"Write a manifesto for yourself. Five things you believe about who you are and what you deserve."}]},{id:"letters7",icon:"💌",title:"7-Day Letters to Yourself",duration:7,color:"#9b7eb8",desc:"One letter a day. To your past, your future, your fears, your dreams, your people.",days:[{day:1,prompt:"Write a letter to 16-year-old you. What did they need to know that no one told them?"},{day:2,prompt:"Write a letter to the person you were a year ago. How far have you come since then?"},{day:3,prompt:"Write a letter to your fear. Not to fight it. To understand it."},{day:4,prompt:"Write a letter to someone you need to forgive, even if you're not ready. Just start."},{day:5,prompt:"Write a letter to your future self five years from now. What do you hope they feel?"},{day:6,prompt:"Write a letter to your body. Everything you've put it through and everything it's carried for you."},{day:7,prompt:"Write a letter from your future self back to you, right now, today. What do they want you to know?"}]},{id:"lettinggo5",icon:"🌊",title:"5-Day Letting Go",duration:5,color:"#5b8fa8",desc:"Release what no longer serves you. Five days to lighten the load you've been carrying.",days:[{day:1,prompt:"What is the story about yourself that you keep telling, and is it actually true?"},{day:2,prompt:"What relationship (past or present) are you still carrying? What would it feel like to set it down?"},{day:3,prompt:"Write about a version of yourself you've outgrown. Say goodbye to that version with love."},{day:4,prompt:"What expectation of yourself or your life is causing you the most pain right now?"},{day:5,prompt:"Write a release ritual. Everything you are choosing to leave in this season. Then write: I am free."}]}];

function ChallengesTab({entries,user,onWrite,openId}){
  const [special,setSpecial]=useState(()=>openId==="joy-bingo"?"bingo":openId==="set-it-down-walk"?"walk":null);
  const [activeChallenge,setActiveChallenge]=useState(null);const [joined,setJoined]=useState(()=>persist.get(`challenges_joined_${user.email}`)||{});const [view,setView]=useState("list");
  const thisMonth=new Date().toISOString().slice(0,7);const monthEntries=entries.filter(e=>e.date?.startsWith(thisMonth));const daysInMonth=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate();const today=new Date().getDate();const journaledDays=new Set(monthEntries.map(e=>new Date(e.date).getDate()));
  function joinChallenge(id){const updated={...joined,[id]:{joinedDate:getTodayStr(),daysCompleted:[]}};setJoined(updated);persist.set(`challenges_joined_${user.email}`,updated);}
  function getChallengeDay(id){if(!joined[id])return 0;const start=new Date(joined[id].joinedDate);const now=new Date();return Math.floor((now-start)/(24*60*60*1000))+1;}
  function getCompletedDays(id){return joined[id]?.daysCompleted||[];}
  function markDayComplete(challengeId,day){const updated={...joined,[challengeId]:{...joined[challengeId],daysCompleted:[...new Set([...(joined[challengeId]?.daysCompleted||[]),day])]}};setJoined(updated);persist.set(`challenges_joined_${user.email}`,updated);}
  useEffect(()=>{if(openId&&!special){const c=MINI_CHALLENGES.find(x=>x.id===openId);if(c){setActiveChallenge(c);setView("detail");}}},[]);
  if(special==="bingo")return <JoyBingo user={user} onBack={()=>setSpecial(null)}/>;
  if(special==="walk")return <SetItDownWalk user={user} onBack={()=>setSpecial(null)}/>;

  if(view==="detail"&&activeChallenge){
    const c=activeChallenge;const isJoined=!!joined[c.id];const currentDay=Math.min(getChallengeDay(c.id),c.duration);const completedDays=getCompletedDays(c.id);const todayPrompt=c.days[currentDay-1];const progress=completedDays.length/c.duration;
    return(<div style={{display:"flex",flexDirection:"column",gap:16}}><button onClick={()=>{setView("list");setActiveChallenge(null);}} style={{...S.ghostBtn,alignSelf:"flex-start"}}>← Challenges</button><div style={{background:`linear-gradient(135deg,${c.color}15,${c.color}05)`,border:`1px solid ${c.color}30`,borderRadius:24,padding:"24px"}}><div style={{fontSize:40,marginBottom:8}}>{c.icon}</div><h2 style={{fontFamily:"'Lora',serif",fontSize:24,color:"#5a2e0e",marginBottom:6,fontWeight:600}}>{c.title}</h2><p style={{fontSize:14,color:"#b08060",fontStyle:"italic",fontFamily:"'Lora',serif",lineHeight:1.6,marginBottom:16}}>{c.desc}</p>{isJoined&&(<div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#b08060",marginBottom:6}}><span>Day {currentDay} of {c.duration}</span><span>{completedDays.length} completed</span></div><div style={{background:"rgba(200,137,90,0.15)",borderRadius:20,height:8,overflow:"hidden"}}><div style={{background:`linear-gradient(90deg,${c.color},${c.color}cc)`,height:"100%",width:`${progress*100}%`,borderRadius:20,transition:"width 0.5s"}}/></div></div>)}{isJoined&&(<div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>{c.days.map(d=>(<div key={d.day} style={{width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,background:completedDays.includes(d.day)?c.color:d.day===currentDay?"rgba(200,137,90,0.15)":"rgba(200,137,90,0.06)",color:completedDays.includes(d.day)?"white":d.day===currentDay?"#7a4a1e":"#b08060",border:`1px solid ${completedDays.includes(d.day)?c.color:d.day===currentDay?"#c8895a":"rgba(200,137,90,0.2)"}`}}>{completedDays.includes(d.day)?"✓":d.day}</div>))}</div>)}{!isJoined&&(<button onClick={()=>joinChallenge(c.id)} style={{...S.saveBtn,background:`linear-gradient(135deg,${c.color}cc,${c.color})`}}>Start This Challenge →</button>)}</div>{isJoined&&todayPrompt&&(<div style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:20,padding:"22px"}}><div style={{fontSize:11,fontWeight:700,color:c.color,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:10}}>{completedDays.includes(currentDay)?"✓ Day "+currentDay+" Complete":"✦ Day "+currentDay+": Today's Prompt"}</div><p style={{fontFamily:"'Lora',serif",fontSize:17,color:"#5a2e0e",fontStyle:"italic",lineHeight:1.75,marginBottom:16}}>"{todayPrompt.prompt}"</p>{!completedDays.includes(currentDay)?(<button onClick={()=>{markDayComplete(c.id,currentDay);spawnConfetti();onWrite(todayPrompt.prompt);}} style={{...S.saveBtn,background:`linear-gradient(135deg,${c.color}cc,${c.color})`}}>Write Today's Entry →</button>):(<div style={{display:"flex",alignItems:"center",gap:8,color:c.color,fontSize:14,fontWeight:600}}><span>✓</span><span>You wrote today. Come back tomorrow. 🌿</span></div>)}</div>)}<div><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>All {c.duration} Days</div>{c.days.map(d=>(<div key={d.day} style={{background:"rgba(255,252,246,0.9)",border:`1px solid ${completedDays.includes(d.day)?"rgba(200,137,90,0.3)":"rgba(200,137,90,0.12)"}`,borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",gap:12,alignItems:"flex-start",opacity:isJoined&&d.day>currentDay?0.5:1}}><div style={{width:28,height:28,borderRadius:"50%",background:completedDays.includes(d.day)?c.color:"rgba(200,137,90,0.1)",color:completedDays.includes(d.day)?"white":"#b08060",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{completedDays.includes(d.day)?"✓":d.day}</div><p style={{fontFamily:"'Lora',serif",fontSize:13,color:"#6a4020",fontStyle:"italic",lineHeight:1.6,margin:0}}>{d.prompt}</p></div>))}</div><ShareRow accent={c.color} url={challengeLink(c.id)} label={completedDays.length>=c.duration?"Share that I finished":"Invite someone to join"} story={{sky:"day",...(completedDays.length>=c.duration?STORY_COPY.challengeDone(c):STORY_COPY.challengeInvite(c)),accent:c.color}}/></div>);
  }

  return(<div style={{display:"flex",flexDirection:"column",gap:20}}><PageHeader kicker="Grow a little" title="Challenges" sub="Small, kind invitations. Try one, share one."/><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px"}}>Free challenges to share</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[{k:"bingo",icon:"🎉",title:"Joy Bingo",sub:"A monthly card of small joys",bg:"rgba(255,252,246,0.78)",bd:"rgba(122,74,30,0.16)",fg:"#3d2a1a"},{k:"walk",icon:"🚶",title:"Set It Down Walk",sub:"10 minutes, anywhere",bg:"linear-gradient(180deg,#c98f86 0%,#9a7790 50%,#5e4f72 100%)",bd:"rgba(196,181,244,0.3)",fg:"#f6f1ea"}].map(f=>(<button key={f.k} onClick={()=>setSpecial(f.k)} style={{textAlign:"left",padding:"18px 16px",borderRadius:20,border:`1px solid ${f.bd}`,background:f.bg,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}><div style={{fontSize:30}}>{f.icon}</div><div style={{fontFamily:"'Lora',serif",fontSize:17,fontWeight:600,color:f.fg,marginTop:8}}>{f.title}</div><div style={{fontSize:12,color:f.fg,opacity:0.7,marginTop:3}}>{f.sub}</div></button>))}</div><div style={{background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(200,137,90,0.07))",border:"1px solid rgba(245,158,11,0.25)",borderRadius:22,padding:"22px"}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}><span style={{fontSize:32}}>🌱</span><div><div style={{fontFamily:"'Lora',serif",fontSize:18,fontWeight:600,color:"#5a2e0e"}}>Monthly Show-Up Calendar</div><div style={{fontSize:12,color:"#b08060",marginTop:2}}>Every day you show up gets a check. No pressure, no chains.</div></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:12}}>{["S","M","T","W","T","F","S"].map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:10,color:"#b08060",fontWeight:700,padding:"2px 0"}}>{d}</div>))}{Array.from({length:new Date(new Date().getFullYear(),new Date().getMonth(),1).getDay()}).map((_,i)=>(<div key={`empty-${i}`}/>))}{Array.from({length:daysInMonth}).map((_,i)=>{const day=i+1;const done=journaledDays.has(day);const isToday=day===today;const future=day>today;return(<div key={day} style={{aspectRatio:"1",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,background:done?"#c8895a":isToday?"rgba(200,137,90,0.15)":future?"rgba(200,137,90,0.04)":"rgba(200,137,90,0.08)",color:done?"white":isToday?"#7a4a1e":"#b08060",border:isToday?"1px solid #c8895a":"1px solid transparent"}}>{done?"✓":day}</div>);})}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#b08060"}}><span>🌱 {journaledDays.size} days you showed up</span><span>{journaledDays.size}/{today} days this month</span></div></div><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px"}}>Themed Challenges</div>{MINI_CHALLENGES.map(c=>{const isJoined=!!joined[c.id];const completed=getCompletedDays(c.id).length;const done=completed>=c.duration;return(<div key={c.id} style={{background:"rgba(255,252,246,0.95)",border:`1px solid ${isJoined?"rgba(200,137,90,0.25)":"rgba(200,137,90,0.12)"}`,borderRadius:20,padding:"18px 20px",cursor:"pointer",transition:"all 0.2s",boxShadow:"0 2px 12px rgba(160,100,50,0.08)"}} onClick={()=>{setActiveChallenge(c);setView("detail");}}><div style={{display:"flex",alignItems:"center",gap:14}}><div style={{width:52,height:52,borderRadius:16,background:`${c.color}15`,border:`1px solid ${c.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{c.icon}</div><div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}><div style={{fontFamily:"'Lora',serif",fontSize:16,fontWeight:600,color:"#5a2e0e"}}>{c.title}</div>{done&&<span style={{fontSize:10,fontWeight:800,background:c.color,color:"white",padding:"2px 8px",borderRadius:10,textTransform:"uppercase"}}>Complete!</span>}{isJoined&&!done&&<span style={{fontSize:10,fontWeight:700,background:`${c.color}20`,color:c.color,padding:"2px 8px",borderRadius:10}}>In progress</span>}</div><div style={{fontSize:12,color:"#b08060",lineHeight:1.4,marginBottom:isJoined?8:0}}>{c.desc}</div>{isJoined&&(<div style={{background:"rgba(200,137,90,0.12)",borderRadius:10,height:5,overflow:"hidden"}}><div style={{background:`linear-gradient(90deg,${c.color},${c.color}cc)`,height:"100%",width:`${(completed/c.duration)*100}%`,borderRadius:10,transition:"width 0.5s"}}/></div>)}</div><div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}><span style={{fontSize:11,fontWeight:700,color:"#b08060"}}>{c.duration}d</span><span style={{fontSize:16,color:"#c8b896"}}>→</span></div></div></div>);})}</div>);
}

function EntryCard({entry,onClick,showAuthor}){const [hovered,setHovered]=useState(false);const moodColor=entry.mood?.color;const moodBg=moodColor?`linear-gradient(160deg,rgba(255,252,246,0.97) 0%,${moodColor}11 100%)`:"rgba(255,252,246,0.93)";const moodBorder=moodColor?`1px solid ${moodColor}33`:"1px solid rgba(200,137,90,0.15)";return(<div style={{...S.card,background:moodBg,border:moodBorder,cursor:onClick?"pointer":"default",transform:hovered?"translateY(-3px)":"",boxShadow:hovered?"0 10px 30px rgba(160,100,50,0.18)":"0 2px 12px rgba(160,100,50,0.10)"}} onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:11,color:"#b08060",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.3px"}}>{formatDate(entry.date)}</span><div style={{display:"flex",gap:5,alignItems:"center"}}>{entry.submit_to_feature&&<span style={{fontSize:11}}>🎙️</span>}{entry.shared&&<span style={{fontSize:11,opacity:0.5}}>🌿</span>}{entry.mood&&<span style={{fontSize:18}}>{entry.mood.emoji}</span>}</div></div>{showAuthor&&<div style={{fontSize:12,color:"#c8895a",fontWeight:700,marginBottom:4}}>by {entry.author_name}</div>}<h3 style={{fontFamily:"'Lora',serif",fontSize:17,color:"#5a2e0e",fontWeight:600,marginBottom:8,lineHeight:1.3}}>{entry.title||"Untitled"}</h3><p style={{fontSize:14,color:"#8a6040",lineHeight:1.65,fontStyle:"italic",fontFamily:"'Lora',serif"}}>{(entry.content||"").slice(0,110)}{(entry.content||"").length>110?"…":""}</p>{entry.tags?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:10}}>{entry.tags.map(t=><TagPill key={t} tag={t}/>)}</div>}</div>);}
function TagPill({tag}){return <span style={{padding:"3px 10px",borderRadius:12,fontSize:11,fontWeight:700,fontFamily:"'Nunito',sans-serif",letterSpacing:"0.3px",background:TAG_COLORS[tag]+"22",color:TAG_COLORS[tag],border:`1px solid ${TAG_COLORS[tag]}44`}}>{tag}</span>;}
function Chip({children,active,activeColor,onClick}){const base={padding:"5px 14px",borderRadius:20,border:"1px solid rgba(200,137,90,0.3)",background:"rgba(255,255,255,0.6)",color:"#9a6a3a",fontSize:13,fontWeight:600,fontFamily:"'Nunito',sans-serif",cursor:"pointer",transition:"all .15s"};const activeStyle=activeColor?{background:activeColor,color:"#fff",borderColor:activeColor}:{background:"#c8895a",color:"#fff",borderColor:"#c8895a"};return <button style={{...base,...(active?activeStyle:{})}} onClick={onClick}>{children}</button>;}
function Field({label,children}){return <div style={{marginBottom:16}}><label style={{display:"block",fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>{label}</label>{children}</div>;}
function SectionLabel({children}){return <div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:8}}>{children}</div>;}
function GlobalStyles(){return <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Nunito:wght@400;500;600;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Nunito',sans-serif}textarea{resize:none}button{transition:opacity .15s}button:hover{opacity:0.85}::-webkit-scrollbar{width:5px}.mim-tabs::-webkit-scrollbar{display:none}@media (max-width:430px){.mim-plan-badge{display:none!important}}.mim-tabs button:focus{outline:none}.mim-tabs button:focus-visible{outline:2px solid #c8895a;outline-offset:1px}::-webkit-scrollbar-thumb{background:#d4a87a55;border-radius:3px}input::placeholder,textarea::placeholder{opacity:0.45}`}</style>;}

const S={page:{minHeight:"100vh",background:"linear-gradient(180deg,#eef0ec 0%,#f3eee4 30%,#f5ebdc 65%,#efe2cf 100%)",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column",position:"relative",overflowX:"hidden"},texture:{position:"fixed",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8895a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:0},header:{position:"sticky",top:0,zIndex:100,background:"rgba(243,242,236,0.88)",backdropFilter:"blur(14px)",borderBottom:"1px solid rgba(200,137,90,0.15)"},headerInner:{maxWidth:960,margin:"0 auto",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8},logoBtn:{background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8,padding:0},logoText:{fontFamily:"'Lora',serif",fontSize:18,fontWeight:600,color:"#7a4a1e"},navBtn:{background:"none",border:"1px solid transparent",borderRadius:20,padding:"6px 10px",color:"#9a7050",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"'Nunito',sans-serif"},navBtnActive:{background:"rgba(200,137,90,0.12)",borderColor:"rgba(200,137,90,0.3)",color:"#7a4a1e"},main:{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"24px 16px 100px",width:"100%",overflowX:"hidden",boxSizing:"border-box"},authCard:{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:24,padding:"36px 40px",width:"100%",maxWidth:400,boxShadow:"0 8px 40px rgba(160,100,50,0.15)",position:"relative",zIndex:1},input:{width:"100%",padding:"11px 15px",borderRadius:13,border:"1px solid rgba(200,137,90,0.25)",background:"rgba(255,255,255,0.75)",fontFamily:"'Nunito',sans-serif",fontSize:15,color:"#5a3a1a",outline:"none"},errorBox:{background:"rgba(200,80,60,0.08)",border:"1px solid rgba(200,80,60,0.2)",borderRadius:10,padding:"8px 14px",color:"#c05040",fontSize:13,fontWeight:600,marginBottom:14},card:{background:"rgba(255,252,246,0.93)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:20,padding:"20px 22px",transition:"transform .2s, box-shadow .2s"},grid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16},promptCard:{background:"linear-gradient(135deg,rgba(200,137,90,0.1),rgba(155,126,184,0.07))",border:"1px solid rgba(200,137,90,0.2)",borderRadius:20,padding:"20px 24px"},writeCard:{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:24,padding:"28px 24px",boxShadow:"0 4px 24px rgba(160,100,50,0.12)",display:"flex",flexDirection:"column",gap:16,maxWidth:700,margin:"0 auto"},titleInput:{fontFamily:"'Lora',serif",fontSize:24,fontWeight:600,color:"#5a2e0e",background:"transparent",border:"none",borderBottom:"2px solid rgba(200,137,90,0.2)",padding:"6px 0",outline:"none",width:"100%"},textarea:{fontFamily:"'Lora',serif",fontSize:16,lineHeight:1.85,color:"#5a3a1a",background:"rgba(253,248,242,0.85)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:16,padding:"16px 20px",outline:"none",width:"100%",fontStyle:"italic"},readCard:{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:24,padding:"28px 24px",boxShadow:"0 4px 24px rgba(160,100,50,0.12)",maxWidth:700,margin:"0 auto"},insightBox:{background:"linear-gradient(135deg,rgba(200,137,90,0.07),rgba(155,126,184,0.06))",border:"1px solid rgba(200,137,90,0.18)",borderRadius:16,padding:"18px 22px",marginBottom:8},saveBtn:{background:"linear-gradient(135deg,#7f5434,#5e3b22)",color:"#fffaf3",border:"none",borderRadius:22,padding:"11px 24px",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 14px rgba(61,42,26,0.18)"},ghostBtn:{background:"none",border:"1px solid rgba(200,137,90,0.3)",borderRadius:18,padding:"8px 18px",color:"#b08060",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"},softBtn:{background:"rgba(200,137,90,0.13)",border:"1px solid rgba(200,137,90,0.28)",borderRadius:16,padding:"7px 16px",color:"#9a5a2a",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"},newBtn:{background:"#c8895a",color:"#fff",border:"none",borderRadius:20,padding:"10px 20px",fontSize:14,fontWeight:700,fontFamily:"'Nunito',sans-serif",cursor:"pointer",boxShadow:"0 2px 10px rgba(200,137,90,0.35)",whiteSpace:"nowrap"},deleteBtn:{background:"none",border:"1px solid rgba(200,80,60,0.3)",borderRadius:18,padding:"9px 20px",color:"#c05040",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:600,cursor:"pointer"}};
S.texture={display:"none"};


// ── SHARE PROMPT CARD ──
function SharePromptCard({prompt, onClose}){
  const canvasRef = React.useRef(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;

    // Background - warm cream gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#fdf6ec");
    grad.addColorStop(0.5, "#f5e8d3");
    grad.addColorStop(1, "#ede0cc");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle texture dots
    ctx.fillStyle = "rgba(200,137,90,0.04)";
    for(let x=0;x<W;x+=60){for(let y=0;y<H;y+=60){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}}

    // Card
    ctx.fillStyle = "rgba(255,252,246,0.92)";
    roundRect(ctx, 80, 80, W-160, H-160, 40);
    ctx.fill();

    // Top accent line
    ctx.strokeStyle = "#c8895a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(160, 160); ctx.lineTo(W-160, 160);
    ctx.stroke();

    // Leaf emoji
    ctx.font = "72px serif";
    ctx.textAlign = "center";
    ctx.fillText("🌿", W/2, 260);

    // Eyebrow
    ctx.fillStyle = "#c8895a";
    ctx.font = "bold 28px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("BUILD YOUR INNER WORLD 🌿", W/2, 330);

    // Prompt text - wrapped
    ctx.fillStyle = "#5a2e0e";
    ctx.font = "italic 52px Georgia, serif";
    const words = prompt.split(" ");
    let line = "", lines = [];
    for(const word of words){
      const test = line + word + " ";
      if(ctx.measureText(test).width > W-320 && line){lines.push(line.trim());line="";}
      line += word + " ";
    }
    if(line) lines.push(line.trim());
    if(lines.length > 0) lines[0] = '"' + lines[0];
    const lastIdx = lines.length - 1;
    lines[lastIdx] = lines[lastIdx] + '"';
    const lineH = 72;
    const totalH = lines.length * lineH;
    const startY = H/2 - totalH/2 + 20;
    lines.forEach((l, i) => { ctx.fillText(l, W/2, startY + i*lineH); });

    // Bottom divider
    ctx.strokeStyle = "rgba(200,137,90,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(160, H-220); ctx.lineTo(W-160, H-220);
    ctx.stroke();

    // Hallie attribution
    ctx.fillStyle = "#b08060";
    ctx.font = "italic 32px Georgia, serif";
    ctx.fillText("Hallie, My Inner Mind", W/2, H-160);

    // halliewho.com
    ctx.fillStyle = "#c8895a";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("myinnermind.halliewho.com", W/2, H-110);
  }, [prompt]);

  function roundRect(ctx, x, y, w, h, r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}

  function handleDownload(){
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "my-inner-mind-prompt.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleShare(){
    const canvas = canvasRef.current;
    try {
      canvas.toBlob(async (blob) => {
        const file = new File([blob], "prompt.png", {type:"image/png"});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file], text: prompt + "\n\nMy Inner Mind by Hallie\nmyinnermind.halliewho.com"});
        } else {
          handleDownload();
        }
      });
    } catch { handleDownload(); }
  }

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(90,46,14,0.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:"#fffdf8",borderRadius:24,padding:"24px",maxWidth:460,width:"100%",boxShadow:"0 20px 60px rgba(90,46,14,0.3)"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontFamily:"'Lora',serif",fontSize:18,color:"#5a2e0e",fontWeight:600}}>Share This Prompt</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,color:"#b08060",cursor:"pointer"}}>×</button>
        </div>
        <canvas ref={canvasRef} style={{width:"100%",borderRadius:16,marginBottom:16,border:"1px solid rgba(200,137,90,0.2)"}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={handleShare} style={{...S.saveBtn,flex:1,textAlign:"center"}}>Share Image 🌿</button>
          <button onClick={handleDownload} style={{...S.ghostBtn,flex:1,textAlign:"center"}}>Download</button>
        </div>
        <p style={{fontSize:11,color:"#b08060",textAlign:"center",marginTop:10,fontStyle:"italic"}}>Save and share to Instagram, TikTok, or Stories</p>
      </div>
    </div>
  );
}

function LandingScreen({onGetStarted,onSignIn}){return(<div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf6ec 0%,#f5e8d3 50%,#ede0cc 100%)",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column",position:"relative",overflowX:"hidden"}}><div style={{position:"fixed",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8895a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:0}}/><GlobalStyles/><nav style={{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 24px",maxWidth:960,margin:"0 auto",width:"100%"}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:24}}>🌿</span><span style={{fontFamily:"'Lora',serif",fontSize:18,fontWeight:600,color:"#7a4a1e"}}>My Inner Mind</span></div><button onClick={onSignIn} style={{background:"none",border:"1px solid rgba(200,137,90,0.4)",borderRadius:20,padding:"8px 20px",color:"#7a4a1e",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>Sign In</button></nav><div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"60px 24px 40px",width:"100%",textAlign:"center"}}><div style={{display:"inline-block",background:"rgba(200,137,90,0.12)",border:"1px solid rgba(200,137,90,0.3)",borderRadius:20,padding:"6px 16px",fontSize:12,fontWeight:700,color:"#c8895a",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:24}}>✨ A space built with you in mind</div><h1 style={{fontFamily:"'Lora',serif",fontSize:"clamp(32px,6vw,58px)",color:"#5a2e0e",fontWeight:600,lineHeight:1.15,marginBottom:20}}>Journal together.<br/><span style={{color:"#c8895a",fontStyle:"italic"}}>Grow together.</span></h1><p style={{fontSize:"clamp(15px,2vw,18px)",color:"#9a7050",lineHeight:1.75,maxWidth:560,margin:"0 auto 36px",fontFamily:"'Lora',serif",fontStyle:"italic"}}>A space for building a softer, stronger, more intentional life. Come back to yourself here.</p><div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}><button onClick={onGetStarted} style={{background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"#fff",border:"none",borderRadius:24,padding:"14px 32px",fontFamily:"'Nunito',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(200,137,90,0.45)"}}>Start Journaling Free →</button><button onClick={onSignIn} style={{background:"rgba(255,255,255,0.7)",border:"1px solid rgba(200,137,90,0.3)",borderRadius:24,padding:"14px 28px",color:"#7a4a1e",fontFamily:"'Nunito',sans-serif",fontSize:15,fontWeight:600,cursor:"pointer"}}>I have an account</button></div></div><div style={{position:"relative",zIndex:1,maxWidth:960,margin:"0 auto",padding:"20px 24px 60px",width:"100%"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20,marginBottom:48}}>{[{icon:"💌",title:"Hallie's Weekly Prompts",desc:"Every week, a personal prompt from Hallie to guide your reflection."},{icon:"🌿",title:"10 Communities",desc:"Find your people: Daily Check-in, Healing & Growth, Parenthood and more."},{icon:"🎙️",title:"Story of the Month",desc:"Submit your entry and Hallie may feature your story on the podcast."},{icon:"✨",title:"Hallie's Insight",desc:"Get a warm, thoughtful insight on any entry."}].map(f=>(<div key={f.title} style={{background:"rgba(255,252,246,0.9)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:20,padding:"24px"}}><div style={{fontSize:32,marginBottom:12}}>{f.icon}</div><div style={{fontFamily:"'Lora',serif",fontSize:17,fontWeight:600,color:"#5a2e0e",marginBottom:8}}>{f.title}</div><div style={{fontSize:14,color:"#9a7050",lineHeight:1.65}}>{f.desc}</div></div>))}</div><div style={{background:"linear-gradient(135deg,rgba(122,74,30,0.09),rgba(200,137,90,0.06))",border:"1px solid rgba(122,74,30,0.18)",borderRadius:24,padding:"36px",textAlign:"center",marginBottom:48}}><div style={{fontSize:36,marginBottom:16}}>🌿</div><p style={{fontFamily:"'Lora',serif",fontSize:"clamp(16px,2.5vw,20px)",color:"#5a2e0e",fontStyle:"italic",lineHeight:1.75,maxWidth:600,margin:"0 auto 20px"}}>"I built this because I needed it. A space that felt like a real conversation with someone who gets it: honest, warm, and actually helpful."</p><div style={{fontSize:13,fontWeight:700,color:"#c8895a",textTransform:"uppercase",letterSpacing:"0.5px"}}>Hallie, My Inner Mind</div></div><div style={{textAlign:"center"}}><button onClick={onGetStarted} style={{background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"#fff",border:"none",borderRadius:24,padding:"16px 40px",fontFamily:"'Nunito',sans-serif",fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 20px rgba(200,137,90,0.4)"}}>Join the Community →</button><div style={{fontSize:13,color:"#b08060",marginTop:12}}>Free to start · No credit card required</div></div></div></div>);}

function OnboardingScreen({user,onDone}){const [step,setStep]=useState(0);const [answer,setAnswer]=useState("");const [saving,setSaving]=useState(false);const welcomePrompt="What brought you here today? And I mean the real answer, not the surface one.";async function handleFinish(){setSaving(true);if(answer.trim()){const entry={id:`${user.email}_onboarding`,user_email:user.email,date:new Date().toISOString().split("T")[0],title:"My first entry 🌿",content:answer,mood:null,tags:["personal"],shared:false,submit_to_feature:false,author_name:user.username,updated_at:Date.now()};await sbUpsert("entries",entry).catch(()=>{});}setSaving(false);onDone();}return(<div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fdf6ec 0%,#f5e8d3 50%,#ede0cc 100%)",fontFamily:"'Nunito',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",position:"relative"}}><div style={{position:"fixed",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c8895a' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:0}}/><GlobalStyles/><div style={{position:"relative",zIndex:1,width:"100%",maxWidth:540}}>{step===0&&(<div style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:28,padding:"44px 40px",textAlign:"center",boxShadow:"0 8px 40px rgba(160,100,50,0.12)"}}><div style={{fontSize:56,marginBottom:16}}>🌿</div><h2 style={{fontFamily:"'Lora',serif",fontSize:28,color:"#5a2e0e",marginBottom:12,fontWeight:600}}>Welcome, {user.username}!</h2><p style={{fontSize:15,color:"#9a7050",lineHeight:1.7,marginBottom:28,fontFamily:"'Lora',serif",fontStyle:"italic"}}>You've found your space to think, feel, and grow.</p><div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:28}}>{[{icon:"💌",text:"Weekly prompts from Hallie"},{icon:"🌿",text:"10 communities to find your people"},{icon:"✨",text:"AI reflections on your entries"}].map(i=>(<div key={i.text} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(200,137,90,0.06)",borderRadius:14,padding:"12px 16px",textAlign:"left"}}><span style={{fontSize:20}}>{i.icon}</span><span style={{fontSize:14,color:"#7a5030",fontWeight:600}}>{i.text}</span></div>))}</div><button onClick={()=>setStep(1)} style={{background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"#fff",border:"none",borderRadius:20,padding:"13px 32px",fontFamily:"'Nunito',sans-serif",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 12px rgba(200,137,90,0.4)",width:"100%"}}>Let's write something →</button></div>)}{step===1&&(<div style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:28,padding:"40px",boxShadow:"0 8px 40px rgba(160,100,50,0.12)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}><span style={{fontSize:20}}>💌</span><span style={{fontSize:11,fontWeight:700,color:"#c8895a",textTransform:"uppercase",letterSpacing:"0.8px"}}>A welcome prompt from Hallie</span></div><p style={{fontFamily:"'Lora',serif",fontSize:18,color:"#5a2e0e",fontStyle:"italic",lineHeight:1.7,marginBottom:24}}>"{welcomePrompt}"</p><textarea style={{width:"100%",minHeight:180,fontFamily:"'Lora',serif",fontSize:15,lineHeight:1.85,color:"#5a3a1a",background:"rgba(253,248,242,0.85)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:16,padding:"16px 20px",outline:"none",fontStyle:"italic",resize:"none",boxSizing:"border-box"}} placeholder="Write freely. This is just for you..." value={answer} onChange={e=>setAnswer(e.target.value)} autoFocus/><div style={{display:"flex",justifyContent:"space-between",marginTop:20,gap:12}}><button onClick={onDone} style={{background:"none",border:"1px solid rgba(200,137,90,0.3)",borderRadius:18,padding:"10px 20px",color:"#b08060",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Skip for now</button><button onClick={handleFinish} disabled={saving} style={{background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"#fff",border:"none",borderRadius:20,padding:"10px 28px",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 3px 12px rgba(200,137,90,0.4)"}}>{saving?"Saving...":"Save & Enter →"}</button></div></div>)}</div></div>);}

function AdminTab(){const [users,setUsers]=useState([]);const [loading,setLoading]=useState(true);const [search,setSearch]=useState("");useEffect(()=>{loadUsers();},[]);async function loadUsers(){setLoading(true);try{const data=await sbGet("users","order=id.desc");setUsers(Array.isArray(data)?data:[]);}catch{setUsers([]);}finally{setLoading(false);}}const filtered=users.filter(u=>u.email?.toLowerCase().includes(search.toLowerCase())||u.username?.toLowerCase().includes(search.toLowerCase()));const counts={free:0,community:0,offtherecord:0};users.forEach(u=>{if(counts[u.plan]!==undefined)counts[u.plan]++;});return(<div style={{display:"flex",flexDirection:"column",gap:20}}><div><h2 style={{fontFamily:"'Lora',serif",fontSize:26,color:"#5a2e0e"}}>🔐 Admin Dashboard</h2><p style={{color:"#b08060",fontSize:13,marginTop:4}}>Only visible to you, Hallie 🌿</p></div><SetItDownAdmin/><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:14}}>{[{label:"Total Members",value:users.length,color:"#7a4a1e"},{label:"Free",value:counts.free,color:"#94a3b8"},{label:"Community",value:counts.community,color:"#c8895a"},{label:"Off the Record",value:counts.offtherecord,color:"#7a4a1e"}].map(s=>(<div key={s.label} style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:18,padding:"20px",textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:s.color,fontFamily:"'Lora',serif"}}>{s.value}</div><div style={{fontSize:12,color:"#b08060",fontWeight:700,marginTop:4,textTransform:"uppercase",letterSpacing:"0.4px"}}>{s.label}</div></div>))}</div><div style={{position:"relative"}}><span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",opacity:0.35,fontSize:15}}>🔍</span><input style={{width:"100%",padding:"11px 15px 11px 38px",borderRadius:13,border:"1px solid rgba(200,137,90,0.25)",background:"rgba(255,255,255,0.75)",fontFamily:"'Nunito',sans-serif",fontSize:14,color:"#5a3a1a",outline:"none",boxSizing:"border-box"}} placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)}/></div>{loading?<div style={{textAlign:"center",padding:"40px",color:"#b08060",fontStyle:"italic"}}>Loading members...</div>:<div style={{display:"flex",flexDirection:"column",gap:10}}>{filtered.map(u=>(<div key={u.id} style={{background:"rgba(255,252,246,0.93)",border:"1px solid rgba(200,137,90,0.12)",borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div><div style={{fontWeight:700,color:"#5a2e0e",fontSize:14}}>{u.username}</div><div style={{fontSize:12,color:"#b08060",marginTop:2}}>{u.email}</div></div><span style={{fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:10,textTransform:"uppercase",letterSpacing:"0.5px",background:PLANS[u.plan]?.color+"22",color:PLANS[u.plan]?.color}}>{u.plan}</span></div>))}</div>}</div>);}

const BADGES=[{id:"first_entry",icon:"🌱",label:"First Entry",desc:"You wrote your first entry",check:(entries)=>entries.length>=1},{id:"ten_entries",icon:"📖",label:"10 Entries",desc:"You've written 10 journal entries",check:(entries)=>entries.length>=10},{id:"streak_7",icon:"🌱",label:"7 Days in a Month",desc:"You showed up 7 days in one month",check:(entries)=>bestMonthDays(entries)>=7},{id:"streak_30",icon:"🌳",label:"20 Days in a Month",desc:"You showed up 20 days in one month",check:(entries)=>bestMonthDays(entries)>=20},{id:"community_share",icon:"🌿",label:"Community Sharer",desc:"You shared your first entry",check:(entries)=>entries.some(e=>e.shared)},{id:"off_the_record",icon:"✨",label:"Off the Record",desc:"You went deeper",check:(_,user)=>user.plan==="offtherecord"}];
function BadgesSection({entries,user}){const earned=BADGES.filter(b=>b.check(entries,user));const unearned=BADGES.filter(b=>!b.check(entries,user));if(!earned.length&&!unearned.length)return null;return(<div style={{background:"rgba(255,252,246,0.9)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:20,padding:"20px 22px"}}><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:14}}>Your Badges</div><div style={{display:"flex",flexWrap:"wrap",gap:10}}>{earned.map(b=>(<div key={b.id} title={b.desc} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 14px",background:"linear-gradient(135deg,rgba(200,137,90,0.12),rgba(122,74,30,0.08))",border:"1px solid rgba(200,137,90,0.3)",borderRadius:14,minWidth:70}}><span style={{fontSize:28}}>{b.icon}</span><span style={{fontSize:10,fontWeight:700,color:"#7a4a1e",textAlign:"center",lineHeight:1.3}}>{b.label}</span></div>))}{unearned.map(b=>(<div key={b.id} title={`Locked: ${b.desc}`} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 14px",background:"rgba(200,200,200,0.08)",border:"1px solid rgba(200,200,200,0.2)",borderRadius:14,minWidth:70,opacity:0.4,filter:"grayscale(1)"}}><span style={{fontSize:28}}>{b.icon}</span><span style={{fontSize:10,fontWeight:700,color:"#9a9a9a",textAlign:"center",lineHeight:1.3}}>{b.label}</span></div>))}</div></div>);}

function MoodChart({entries}){const last14=entries.filter(e=>e.mood).slice(0,14).reverse();if(last14.length<2)return null;const moodScore={Radiant:7,Happy:6,Calm:5,Neutral:4,Low:3,Sad:2,Frustrated:1};const points=last14.map((e,i)=>({x:i,y:moodScore[e.mood?.label]||4,mood:e.mood,date:e.date}));const w=280,h=80,pad=10;const xs=points.map((_,i)=>pad+i*(w-2*pad)/(points.length-1));const ys=points.map(p=>h-pad-(p.y-1)*(h-2*pad)/6);const path=points.map((p,i)=>`${i===0?"M":"L"}${xs[i]},${ys[i]}`).join(" ");return(<div style={{background:"rgba(255,252,246,0.9)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:20,padding:"20px 22px"}}><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>Mood This Month</div><svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:80}}><defs><linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c8895a" stopOpacity="0.3"/><stop offset="100%" stopColor="#c8895a" stopOpacity="0"/></linearGradient></defs><path d={`${path} L${xs[xs.length-1]},${h} L${xs[0]},${h} Z`} fill="url(#moodGrad)"/><path d={path} fill="none" stroke="#c8895a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>{points.map((p,i)=><circle key={i} cx={xs[i]} cy={ys[i]} r="3" fill={p.mood?.color||"#c8895a"} stroke="#fff" strokeWidth="1.5"/>)}</svg><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#b08060",marginTop:4}}><span>😢 Low</span><span>😌 Calm</span><span>🌟 Radiant</span></div></div>);}

function MonthlyRecap({entries,user,onDismiss}){const now=new Date();const lastMonth=new Date(now.getFullYear(),now.getMonth()-1,1);const monthStr=lastMonth.toISOString().slice(0,7);const monthName=lastMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"});const monthEntries=entries.filter(e=>e.date?.startsWith(monthStr));const streak=new Set(monthEntries.map(e=>e.date)).size;const topMood=(()=>{const counts={};monthEntries.forEach(e=>{if(e.mood?.label)counts[e.mood.label]=(counts[e.mood.label]||0)+1;});return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];})();const topTag=(()=>{const counts={};monthEntries.forEach(e=>e.tags?.forEach(t=>{counts[t]=(counts[t]||0)+1;}));return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];})();return(<div style={{position:"fixed",inset:0,background:"rgba(90,46,14,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onDismiss}><div style={{background:"#fffdf8",borderRadius:28,padding:"36px 32px",maxWidth:400,width:"100%",boxShadow:"0 20px 60px rgba(90,46,14,0.3)",position:"relative"}} onClick={e=>e.stopPropagation()}><div style={{textAlign:"center",marginBottom:24}}><div style={{fontSize:48,marginBottom:8}}>🌿</div><h2 style={{fontFamily:"'Lora',serif",fontSize:24,color:"#5a2e0e",marginBottom:4,fontWeight:600}}>{monthName} Recap</h2><p style={{fontSize:13,color:"#b08060",fontStyle:"italic"}}>Look how far you've come</p></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>{[{label:"Entries Written",value:monthEntries.length,icon:"📖"},{label:"Days You Showed Up",value:`${streak} days`,icon:"🌱"},{label:"Top Mood",value:topMood?`${MOODS.find(m=>m.label===topMood[0])?.emoji} ${topMood[0]}`:"Not yet",icon:"💭"},{label:"Top Tag",value:topTag?`#${topTag[0]}`:"Not yet",icon:"🏷️"}].map(s=>(<div key={s.label} style={{background:"rgba(200,137,90,0.07)",borderRadius:16,padding:"14px",textAlign:"center"}}><div style={{fontSize:22,marginBottom:4}}>{s.icon}</div><div style={{fontSize:20,fontWeight:800,color:"#7a4a1e",fontFamily:"'Lora',serif"}}>{s.value}</div><div style={{fontSize:11,color:"#b08060",marginTop:2}}>{s.label}</div></div>))}</div><p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#7a5030",fontStyle:"italic",textAlign:"center",lineHeight:1.7,marginBottom:20}}>{monthEntries.length===0?"A new month is a fresh page. Start writing yours. 🌱":monthEntries.length<5?"Every entry matters. Keep showing up for yourself. 🌿":"You showed up for yourself this month. That's everything. ✨"}</p><button onClick={onDismiss} style={{width:"100%",background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"#fff",border:"none",borderRadius:20,padding:"12px",fontFamily:"'Nunito',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer"}}>Keep Going →</button></div></div>);}

function IntentionBanner({user,onWrite}){const weekKey=`intention_${user.email}_${Math.ceil((new Date()-new Date(new Date().getFullYear(),0,1))/(7*24*60*60*1000))}`;const [intention,setIntention]=useState(()=>persist.get(weekKey)||"");const [editing,setEditing]=useState(false);const [draft,setDraft]=useState("");function save(){persist.set(weekKey,draft);setIntention(draft);setEditing(false);}if(editing)return(<div style={{background:"linear-gradient(135deg,rgba(155,126,184,0.1),rgba(200,137,90,0.07))",border:"1px solid rgba(155,126,184,0.25)",borderRadius:20,padding:"20px 24px"}}><div style={{fontSize:11,fontWeight:700,color:"#9b7eb8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>🎯 This Week's Intention</div><input style={{width:"100%",padding:"10px 14px",borderRadius:12,border:"1px solid rgba(155,126,184,0.3)",background:"rgba(255,255,255,0.8)",fontFamily:"'Lora',serif",fontSize:15,color:"#5a3a1a",outline:"none",marginBottom:12,boxSizing:"border-box"}} placeholder="I intend to..." value={draft} onChange={e=>setDraft(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&save()}/><div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(false)} style={{background:"none",border:"1px solid rgba(155,126,184,0.3)",borderRadius:14,padding:"7px 16px",color:"#9b7eb8",fontFamily:"'Nunito',sans-serif",fontSize:13,cursor:"pointer"}}>Cancel</button><button onClick={save} style={{background:"#9b7eb8",border:"none",borderRadius:14,padding:"7px 20px",color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"}}>Set Intention ✓</button></div></div>);return(<div style={{background:"linear-gradient(135deg,rgba(155,126,184,0.1),rgba(200,137,90,0.07))",border:"1px solid rgba(155,126,184,0.25)",borderRadius:20,padding:"18px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:"#9b7eb8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:4}}>🎯 This Week's Intention</div>{intention?<p style={{fontFamily:"'Lora',serif",fontSize:15,color:"#5a3a1a",fontStyle:"italic"}}>{intention}</p>:<p style={{fontSize:13,color:"#b08060"}}>Set an intention for this week, something to come back to.</p>}</div><button onClick={()=>{setDraft(intention);setEditing(true);}} style={{background:"rgba(155,126,184,0.15)",border:"1px solid rgba(155,126,184,0.3)",borderRadius:14,padding:"7px 14px",color:"#9b7eb8",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{intention?"Edit":"Set →"}</button></div>);}

function JourneyTab({entries,user}){const thisMonth=new Date().toISOString().slice(0,7);const monthEntries=entries.filter(e=>e.date?.startsWith(thisMonth));const topMood=(()=>{const counts={};entries.forEach(e=>{if(e.mood?.label)counts[e.mood.label]=(counts[e.mood.label]||0)+1;});const top=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];return top?MOODS.find(m=>m.label===top[0]):null;})();const oneYearAgo=new Date();oneYearAgo.setFullYear(oneYearAgo.getFullYear()-1);const oneYearAgoStr=oneYearAgo.toISOString().split("T")[0];const onThisDay=entries.find(e=>e.date===oneYearAgoStr);return(<div style={{display:"flex",flexDirection:"column",gap:20}}><PageHeader kicker="Your growth" title="My Journey" sub="Everything you've been growing, all in one place."/><div style={{background:"linear-gradient(135deg,rgba(155,126,184,0.08),rgba(200,137,90,0.05))",border:"1px solid rgba(155,126,184,0.2)",borderRadius:18,padding:"18px 20px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:16}}>🖊️</span><span style={{fontWeight:700,color:"#9b7eb8",fontSize:11,textTransform:"uppercase",letterSpacing:"0.6px"}}>A note for your journey</span></div><p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#5a2e0e",fontStyle:"italic",lineHeight:1.75,margin:0}}>{getWeeklyDeskNote()}</p><p style={{fontSize:11,color:"#b08060",marginTop:8}}>Hallie 🌿</p></div><TherapyList/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>{[{icon:"📖",label:"Total Entries",value:entries.length},{icon:"📅",label:"This Month",value:monthEntries.length},{icon:"💭",label:"Top Mood",value:topMood?`${topMood.emoji} ${topMood.label}`:"Not yet",wide:true}].map(s=>(<div key={s.label} style={{gridColumn:s.wide?"1 / -1":"auto",background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:18,padding:"18px",textAlign:"center"}}><div style={{fontSize:26,marginBottom:6}}>{s.icon}</div><div style={{fontSize:22,fontWeight:800,color:"#7a4a1e",fontFamily:"'Lora',serif"}}>{s.value}</div><div style={{fontSize:11,color:"#b08060",marginTop:3,textTransform:"uppercase",letterSpacing:"0.4px"}}>{s.label}</div></div>))}</div>{onThisDay&&(<div style={{background:"linear-gradient(135deg,rgba(155,126,184,0.1),rgba(200,137,90,0.07))",border:"1px solid rgba(155,126,184,0.25)",borderRadius:18,padding:"18px 20px"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><span style={{fontSize:16}}>🗓️</span><span style={{fontWeight:700,color:"#9b7eb8",fontSize:11,textTransform:"uppercase",letterSpacing:"0.6px"}}>On this day, one year ago</span></div><p style={{fontFamily:"'Lora',serif",fontSize:15,fontWeight:600,color:"#5a2e0e",marginBottom:6}}>{onThisDay.title||"Untitled"}</p><p style={{fontFamily:"'Lora',serif",fontSize:13,color:"#7a5030",fontStyle:"italic",lineHeight:1.65}}>{(onThisDay.content||"").slice(0,160)}{(onThisDay.content||"").length>160?"…":""}</p></div>)}<MoodChart entries={entries}/><GrowthTree entries={entries}/><BadgesSection entries={entries} user={user}/><div style={{background:"linear-gradient(135deg,rgba(122,74,30,0.08),rgba(200,137,90,0.06))",border:"1px solid rgba(122,74,30,0.15)",borderRadius:20,padding:"20px 24px"}}><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>This Month at a Glance</div><div style={{display:"flex",flexWrap:"wrap",gap:10}}>{(()=>{const tagCounts={};monthEntries.forEach(e=>e.tags?.forEach(t=>{tagCounts[t]=(tagCounts[t]||0)+1;}));return Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([tag,count])=>(<div key={tag} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",background:TAG_COLORS[tag]+"22",border:`1px solid ${TAG_COLORS[tag]}44`,borderRadius:12}}><span style={{fontSize:12,fontWeight:700,color:TAG_COLORS[tag]}}>{tag}</span><span style={{fontSize:11,color:"#b08060"}}>×{count}</span></div>));})()}{monthEntries.length===0&&<p style={{fontSize:13,color:"#b08060",fontStyle:"italic"}}>No entries yet this month. Start writing! 🌱</p>}</div></div></div>);}

const GROVE_MOODS=[{emoji:"🌱",label:"Grounded"},{emoji:"🌊",label:"Overwhelmed"},{emoji:"🔥",label:"Fired Up"},{emoji:"🌙",label:"Tired"},{emoji:"✨",label:"Hopeful"}];

const GROVE_CATEGORIES=["Body Love","Stillness & Peace","Heart & Connection","Rest & Restore","Joy & Play","Morning & Intention"];

const GROVE_ACTIVITIES=[
  {key:"bath",emoji:"🛁",name:"Draw a slow bath",desc:"Add Epsom salts, dim the lights. Let it be a ritual, not a rush.",category:"Body Love"},
  {key:"stretch",emoji:"🧘",name:"10 minutes of gentle stretching",desc:"Move your body with intention. Feel every muscle say thank you.",category:"Body Love"},
  {key:"walk",emoji:"🚶",name:"A mindful walk outside",desc:"No destination. Just move and notice what's beautiful around you.",category:"Body Love"},
  {key:"water",emoji:"💧",name:"Drink 3 full glasses of water",desc:"Your body is asking for this. Hydration is self love.",category:"Body Love"},
  {key:"skincare",emoji:"✨",name:"Full skincare ritual",desc:"Cleanse, moisturize, massage. Touch yourself with genuine tenderness.",category:"Body Love"},
  {key:"dance",emoji:"💃",name:"Dance it out",desc:"Put on a song that moves you and just go. No one is watching.",category:"Body Love"},
  {key:"nourish",emoji:"🥗",name:"Cook something nourishing",desc:"A meal made with love for yourself. No guilt, just care.",category:"Body Love"},
  {key:"candle",emoji:"🕯️",name:"Candle breathing moment",desc:"Light a candle. Breathe in for 4, hold for 4, out for 6. Five rounds.",category:"Stillness & Peace"},
  {key:"tea",emoji:"🍵",name:"Slow tea ceremony",desc:"Make your favorite warm drink. Sit down. No phone. Just taste it.",category:"Stillness & Peace"},
  {key:"silence",emoji:"🌙",name:"10 minutes of silence",desc:"No music, no scrolling. Just you and the quiet. Let it feel good.",category:"Stillness & Peace"},
  {key:"breathe",emoji:"🌬️",name:"Box breathing practice",desc:"In for 4, hold for 4, out for 4, hold for 4. Repeat 5 times.",category:"Stillness & Peace"},
  {key:"sunrise",emoji:"🌅",name:"Watch the sky change",desc:"Sunrise or sunset. Step outside and witness something beautiful.",category:"Stillness & Peace"},
  {key:"barefoot",emoji:"🌿",name:"Barefoot on the earth",desc:"Find grass, sand, or soil. Stand on it barefoot. Just breathe.",category:"Stillness & Peace"},
  {key:"voicenote",emoji:"💌",name:"Send a voice note of love",desc:"Tell someone you're thinking of them. No reason needed.",category:"Heart & Connection"},
  {key:"gratitude",emoji:"🙏",name:"Write 5 things you're grateful for",desc:"Real, specific things. Not generic. Things that actually moved you today.",category:"Heart & Connection"},
  {key:"letter",emoji:"📝",name:"Write a letter to your future self",desc:"Tell them what you're working through. Tell them they're going to be okay.",category:"Heart & Connection"},
  {key:"compliment",emoji:"💛",name:"Say something kind to yourself",desc:"In the mirror, out loud. Your name + something you genuinely love about yourself.",category:"Heart & Connection"},
  {key:"forgive",emoji:"🌸",name:"Forgive yourself for something",desc:'Write it down then write: "I release this with love." Mean it.',category:"Heart & Connection"},
  {key:"callsomeone",emoji:"📞",name:"Call someone you love",desc:"Not text. Call. Let your voice be heard. Let theirs warm you.",category:"Heart & Connection"},
  {key:"nap",emoji:"😴",name:"Take a guilt-free nap",desc:"Set a timer for 20-30 minutes. Rest is productive. You deserve this.",category:"Rest & Restore"},
  {key:"earlybed",emoji:"🌙",name:"Go to bed 30 min early",desc:"Create a wind-down ritual. Your nervous system will thank you.",category:"Rest & Restore"},
  {key:"journal",emoji:"📓",name:"Brain dump journaling",desc:"Write whatever is in your head for 10 minutes. Don't edit. Just release.",category:"Rest & Restore"},
  {key:"offline",emoji:"📵",name:"1 hour completely offline",desc:"Put the phone in another room. No peeking. Just be present.",category:"Rest & Restore"},
  {key:"cozy",emoji:"🧸",name:"Create a cozy moment",desc:"Soft blanket, warm drink, something comforting. Let yourself just be held.",category:"Rest & Restore"},
  {key:"create",emoji:"🎨",name:"Make something creative",desc:"Draw, write, cook, build: anything made by your hands for joy.",category:"Joy & Play"},
  {key:"laugh",emoji:"😂",name:"Watch something that makes you laugh",desc:"Belly laughs are medicine. Give yourself 20 minutes of pure joy.",category:"Joy & Play"},
  {key:"music",emoji:"🎵",name:"Full album listen",desc:"Put on something you love. Lie down. Just listen all the way through.",category:"Joy & Play"},
  {key:"flowers",emoji:"🌸",name:"Buy yourself flowers",desc:"Or pick something beautiful from outside. Put it where you'll see it.",category:"Joy & Play"},
  {key:"newplace",emoji:"🗺️",name:"Go somewhere new",desc:"A coffee shop, a street, a park you've never visited. Novelty is joy.",category:"Joy & Play"},
  {key:"morning",emoji:"☀️",name:"Intentional morning",desc:"Before your phone: water, stretch, one deep breath, one intention set.",category:"Morning & Intention"},
  {key:"intention",emoji:"🌱",name:"Set a daily intention",desc:"Write one word or sentence that will guide your day. Return to it.",category:"Morning & Intention"},
  {key:"affirmmorning",emoji:"🪞",name:"Morning mirror affirmation",desc:'Look yourself in the eyes and say: "Today I choose myself." Mean it.',category:"Morning & Intention"},
];

// ── MY TRACKERS — personal symptom, habit and ritual tracking with a shareable report ──
const TRACKER_KINDS=[{k:"scale",label:"1 to 5 scale",hint:"How strong or how good"},{k:"yesno",label:"Yes / No",hint:"Did it happen today"},{k:"number",label:"Number",hint:"Hours, glasses, minutes"},{k:"note",label:"Quick note",hint:"A few words"}];
const TRACKER_PRESETS=[{name:"Sleep quality",emoji:"😴",kind:"scale"},{name:"Energy",emoji:"⚡",kind:"scale"},{name:"Anxiety",emoji:"🌀",kind:"scale"},{name:"Headache",emoji:"🤕",kind:"scale"},{name:"Took my meds",emoji:"💊",kind:"yesno"},{name:"Water",emoji:"💧",kind:"number",unit:"glasses"},{name:"Hours slept",emoji:"🛏️",kind:"number",unit:"hours"},{name:"Movement",emoji:"🚶‍♀️",kind:"yesno"},{name:"Cycle",emoji:"🌸",kind:"yesno"}];
const T_GREEN="#7a8c6e";const T_INK="#5a2e0e";const T_MUTED="#b08060";
function tDateStr(d){const x=new Date(d);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;}
function tDaysAgo(n){const d=new Date();d.setDate(d.getDate()-n);return tDateStr(d);}
function tUid(){try{return crypto.randomUUID();}catch{return `${Date.now()}_${Math.random().toString(36).slice(2,10)}`;}}
function tPretty(ds){return new Date(ds+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"});}

function summarizeTracker(t,logs){
  const vals=logs.filter(l=>l.tracker_id===t.id).sort((a,b)=>a.date.localeCompare(b.date));
  const days=vals.length;
  const notes=vals.filter(l=>l.note&&String(l.note).trim()).map(l=>({date:l.date,note:String(l.note).trim()}));
  if(t.kind==="scale"||t.kind==="number"){
    const nums=vals.map(l=>Number(l.value)).filter(v=>!isNaN(v));
    if(!nums.length)return{days,notes,line:"No entries in this period"};
    const avg=nums.reduce((a,b)=>a+b,0)/nums.length;const half=Math.floor(nums.length/2);
    let trend="";if(nums.length>=4){const a=nums.slice(0,half).reduce((x,y)=>x+y,0)/half;const b=nums.slice(half).reduce((x,y)=>x+y,0)/(nums.length-half);const diff=b-a;trend=Math.abs(diff)<(t.kind==="scale"?0.3:Math.max(0.05*Math.abs(a),0.1))?"steady":diff>0?"going up":"going down";}
    const unit=t.kind==="scale"?" / 5":(t.unit?` ${t.unit}`:"");
    return{days,notes,avg,min:Math.min(...nums),max:Math.max(...nums),trend,series:vals.map(l=>({date:l.date,v:Number(l.value)})),line:`Average ${avg.toFixed(1)}${unit} · range ${Math.min(...nums)} to ${Math.max(...nums)}${trend?` · ${trend}`:""}`};
  }
  if(t.kind==="yesno"){const yes=vals.filter(l=>Number(l.value)===1).length;return{days,notes,yes,series:vals.map(l=>({date:l.date,v:Number(l.value)})),line:days?`Yes on ${yes} of ${days} logged days (${Math.round(yes/days*100)}%)`:"No entries in this period"};}
  return{days,notes,line:days?`${days} notes`:"No entries in this period"};
}

function TrackerSection({user}){
  const [trackers,setTrackers]=useState([]);const [logs,setLogs]=useState([]);const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);const [showReport,setShowReport]=useState(false);const [openNote,setOpenNote]=useState(null);
  const today=tDateStr(new Date());
  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);const [t,l]=await Promise.all([sbGet("trackers","archived=eq.false&order=sort.asc"),sbGet("tracker_logs",`date=gte.${tDaysAgo(120)}&order=date.asc`)]);setTrackers(Array.isArray(t)?t:[]);setLogs(Array.isArray(l)?l:[]);setLoading(false);}
  function logFor(id,date=today){return logs.find(l=>l.tracker_id===id&&l.date===date);}
  async function saveLog(t,patch){
    const prev=logFor(t.id);const row={id:`${t.id}_${today}`,tracker_id:t.id,date:today,value:prev?.value??null,note:prev?.note??null,...patch};
    setLogs(ls=>[...ls.filter(l=>!(l.tracker_id===t.id&&l.date===today)),row]);
    await sbUpsert("tracker_logs",row);
  }
  async function clearLog(t){setLogs(ls=>ls.filter(l=>!(l.tracker_id===t.id&&l.date===today)));await sbDelete("tracker_logs",`id=eq.${encodeURIComponent(`${t.id}_${today}`)}`);}
  async function saveTracker(t){
    const row={id:t.id||tUid(),name:t.name.trim(),emoji:t.emoji||"🌿",kind:t.kind,unit:t.kind==="number"?(t.unit||"").trim()||null:null,archived:false,sort:t.sort??trackers.length};
    setTrackers(ts=>{const i=ts.findIndex(x=>x.id===row.id);return i>=0?ts.map(x=>x.id===row.id?row:x):[...ts,row];});setEditing(null);
    await sbUpsert("trackers",row);
  }
  async function removeTracker(t){if(!window.confirm(`Remove "${t.name}"? Its history will be hidden from reports.`))return;setTrackers(ts=>ts.filter(x=>x.id!==t.id));setEditing(null);await sbUpdate("trackers",`id=eq.${encodeURIComponent(t.id)}`,{archived:true});}

  const card={background:"rgba(255,252,246,0.97)",border:"1px solid rgba(122,140,110,0.2)",borderRadius:20,padding:"18px"};
  const pill=(on)=>({padding:"8px 0",flex:1,borderRadius:12,border:`1.5px solid ${on?T_GREEN:"rgba(122,140,110,0.22)"}`,background:on?"rgba(122,140,110,0.16)":"transparent",color:on?"#4a5c3e":"#8a6040",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif"});

  if(showReport)return <TrackerReport user={user} trackers={trackers} onClose={()=>setShowReport(false)}/>;

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:10,gap:10}}>
      <div><div style={{fontSize:11,fontWeight:700,color:T_MUTED,textTransform:"uppercase",letterSpacing:"0.6px"}}>My Trackers</div><div style={{fontSize:12,color:T_MUTED,fontStyle:"italic",marginTop:2}}>Notice your patterns. Share them if you want to.</div></div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        {trackers.length>0&&<button onClick={()=>setShowReport(true)} style={{...S.ghostBtn,padding:"5px 12px",fontSize:11}}>Report</button>}
        <button onClick={()=>setEditing({name:"",emoji:"🌿",kind:"scale"})} style={{...S.ghostBtn,padding:"5px 12px",fontSize:11}}>+ Add</button>
      </div>
    </div>

    {editing&&(<div style={{...card,marginBottom:12,border:`1px solid ${T_GREEN}55`}}>
      <div style={{fontWeight:700,color:T_INK,fontSize:14,marginBottom:12}}>{editing.id?"Edit tracker":"New tracker"}</div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <input value={editing.emoji} onChange={e=>setEditing({...editing,emoji:[...e.target.value].slice(-2).join("")})} style={{...S.input,width:56,textAlign:"center",fontSize:20,padding:"10px 0"}} aria-label="Emoji"/>
        <input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="What do you want to track?" style={{...S.input,flex:1}} maxLength={40}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
        {TRACKER_KINDS.map(k=>(<button key={k.k} onClick={()=>setEditing({...editing,kind:k.k})} style={{...pill(editing.kind===k.k),padding:"10px 8px",textAlign:"left",flex:"none"}}><div>{k.label}</div><div style={{fontSize:10,fontWeight:500,opacity:0.8,marginTop:2}}>{k.hint}</div></button>))}
      </div>
      {editing.kind==="number"&&<input value={editing.unit||""} onChange={e=>setEditing({...editing,unit:e.target.value})} placeholder="Unit (optional): hours, glasses, mg..." style={{...S.input,marginBottom:10}} maxLength={20}/>}
      {!editing.id&&(<div style={{marginBottom:12}}><div style={{fontSize:11,color:T_MUTED,marginBottom:6}}>Or start from an idea:</div><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{TRACKER_PRESETS.filter(p=>!trackers.some(t=>t.name===p.name)).map(p=>(<button key={p.name} onClick={()=>setEditing({...editing,...p})} style={{padding:"5px 10px",borderRadius:14,border:"1px solid rgba(122,140,110,0.25)",background:"transparent",fontSize:12,color:"#6a5030",cursor:"pointer"}}>{p.emoji} {p.name}</button>))}</div></div>)}
      <div style={{display:"flex",gap:8,justifyContent:"space-between"}}>
        {editing.id?<button onClick={()=>removeTracker(editing)} style={S.deleteBtn}>Remove</button>:<span/>}
        <div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(null)} style={S.ghostBtn}>Cancel</button><button disabled={!editing.name.trim()} onClick={()=>saveTracker(editing)} style={{...S.saveBtn,background:`linear-gradient(135deg,#8ca07e,${T_GREEN})`,opacity:editing.name.trim()?1:0.5}}>Save</button></div>
      </div>
    </div>)}

    {loading?<p style={{fontSize:13,color:T_MUTED,fontStyle:"italic"}}>Loading your trackers...</p>:trackers.length===0&&!editing?(
      <div style={{...card,textAlign:"center"}}>
        <div style={{fontSize:30,marginBottom:6}}>📈</div>
        <p style={{fontFamily:"'Lora',serif",fontSize:15,color:T_INK,marginBottom:4}}>Track what matters to you</p>
        <p style={{fontSize:12,color:T_MUTED,lineHeight:1.55,marginBottom:14}}>Symptoms, sleep, meds, energy, anything. Log it in a tap, see your patterns, and make a report for your doctor or therapist when you need one.</p>
        <button onClick={()=>setEditing({name:"",emoji:"🌿",kind:"scale"})} style={{...S.saveBtn,background:`linear-gradient(135deg,#8ca07e,${T_GREEN})`}}>Create my first tracker</button>
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {trackers.map(t=>{const l=logFor(t.id);const v=l?.value;const hist=[...Array(14)].map((_,i)=>logFor(t.id,tDaysAgo(13-i)));return(
          <div key={t.id} style={card}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <span style={{fontSize:22}}>{t.emoji}</span>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:T_INK,fontSize:14}}>{t.name}</div><div style={{fontSize:11,color:T_MUTED}}>{l?"Logged today":"Not logged today"}</div></div>
              <div style={{display:"flex",gap:2,alignItems:"flex-end",height:22}} aria-label="Last 14 days">{hist.map((h,i)=>{const val=h?.value;let ht=4,op=0.18;if(h){if(t.kind==="scale")ht=4+Number(val)*3.6;else if(t.kind==="yesno")ht=Number(val)===1?18:6;else ht=12;op=0.85;}return <span key={i} style={{width:4,height:ht,borderRadius:2,background:T_GREEN,opacity:op}}/>;})}</div>
              <button onClick={()=>setEditing({...t})} aria-label={`Edit ${t.name}`} style={{background:"none",border:"none",color:T_MUTED,fontSize:16,cursor:"pointer",padding:"0 2px"}}>⋯</button>
            </div>
            {t.kind==="scale"&&(<div><div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>Number(v)===n?clearLog(t):saveLog(t,{value:n})} style={pill(Number(v)===n)}>{n}</button>))}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:T_MUTED,marginTop:4,padding:"0 4px"}}><span>low</span><span>high</span></div></div>)}
            {t.kind==="yesno"&&(<div style={{display:"flex",gap:6}}>{[[1,"Yes"],[0,"No"]].map(([n,lab])=>(<button key={n} onClick={()=>l&&Number(v)===n?clearLog(t):saveLog(t,{value:n})} style={pill(l&&Number(v)===n)}>{lab}</button>))}</div>)}
            {t.kind==="number"&&(<div style={{display:"flex",alignItems:"center",gap:8}}><button onClick={()=>saveLog(t,{value:Math.max(0,(Number(v)||0)-1)})} style={{...pill(false),flex:"none",width:44}}>−</button><input inputMode="decimal" value={v??""} placeholder="0" onChange={e=>{const x=e.target.value.replace(/[^0-9.]/g,"");if(x==="")clearLog(t);else saveLog(t,{value:Number(x)});}} style={{...S.input,textAlign:"center",flex:1,padding:"9px"}}/><button onClick={()=>saveLog(t,{value:(Number(v)||0)+1})} style={{...pill(false),flex:"none",width:44}}>+</button>{t.unit&&<span style={{fontSize:12,color:T_MUTED,minWidth:40}}>{t.unit}</span>}</div>)}
            {t.kind==="note"&&(<textarea defaultValue={l?.note||""} placeholder="A few words about today..." onBlur={e=>{const x=e.target.value.trim();if(!x&&l)clearLog(t);else if(x!==(l?.note||""))saveLog(t,{note:x,value:null});}} style={{...S.textarea,minHeight:60}} rows={2}/>)}
            {t.kind!=="note"&&(openNote===t.id?(<textarea autoFocus defaultValue={l?.note||""} placeholder="Add a note for today (optional)" onBlur={e=>{const x=e.target.value.trim();setOpenNote(null);if(x!==(l?.note||""))saveLog(t,{note:x||null});}} style={{...S.textarea,minHeight:52,marginTop:10}} rows={2}/>):(<button onClick={()=>setOpenNote(t.id)} style={{background:"none",border:"none",color:T_MUTED,fontSize:12,cursor:"pointer",marginTop:8,padding:0}}>{l?.note?`📝 ${l.note.length>48?l.note.slice(0,48)+"…":l.note}`:"+ add a note"}</button>))}
          </div>);})}
      </div>
    )}
    <p style={{fontSize:11,color:T_MUTED,fontStyle:"italic",textAlign:"center",marginTop:10,lineHeight:1.5}}>Your trackers are private to you. They're for noticing patterns, not for diagnosing anything.</p>
  </div>);
}

function TrackerReport({user,trackers,onClose}){
  const [range,setRange]=useState(30);const [picked,setPicked]=useState(()=>new Set(trackers.map(t=>t.id)));const [incMood,setIncMood]=useState(true);const [incRituals,setIncRituals]=useState(true);const [incNotes,setIncNotes]=useState(true);
  const [logs,setLogs]=useState([]);const [moods,setMoods]=useState([]);const [rituals,setRituals]=useState([]);const [loading,setLoading]=useState(true);const [msg,setMsg]=useState("");
  const from=tDaysAgo(range-1);const to=tDateStr(new Date());
  useEffect(()=>{(async()=>{setLoading(true);const [l,m,r]=await Promise.all([sbGet("tracker_logs",`date=gte.${from}&order=date.asc`),sbGet("grove_entries",`created_at=gte.${from}T00:00:00&order=created_at.asc`),sbGet("grove_activity_log",`date=gte.${from}&order=date.asc`)]);setLogs(Array.isArray(l)?l:[]);setMoods(Array.isArray(m)?m:[]);setRituals(Array.isArray(r)?r:[]);setLoading(false);})();},[range]);
  const chosen=trackers.filter(t=>picked.has(t.id));
  const sums=chosen.map(t=>({t,s:summarizeTracker(t,logs)}));
  const moodCounts={};moods.forEach(m=>{const k=String(m.mood||"").trim();if(k)moodCounts[k]=(moodCounts[k]||0)+1;});
  const moodList=Object.entries(moodCounts).sort((a,b)=>b[1]-a[1]);
  const ritualCounts={};rituals.forEach(r=>{const k=`${r.activity_emoji||""} ${r.activity_label||r.activity_key}`.trim();ritualCounts[k]=(ritualCounts[k]||0)+1;});
  const ritualList=Object.entries(ritualCounts).sort((a,b)=>b[1]-a[1]);
  const periodLabel=`${tPretty(from)} to ${tPretty(to)}, ${new Date().getFullYear()}`;

  function textSummary(){
    const L=[`My Inner Mind: personal tracking summary`,`${user.username||""} · ${periodLabel}`,``];
    sums.forEach(({t,s})=>{L.push(`${t.emoji} ${t.name}: ${s.line} (${s.days} days logged)`);if(incNotes)s.notes.forEach(n=>L.push(`   ${tPretty(n.date)}: ${n.note}`));});
    if(incMood&&moodList.length){L.push("",`Mood check-ins (${moods.length}):`);moodList.forEach(([k,c])=>L.push(`   ${k}: ${c}`));}
    if(incRituals&&ritualList.length){L.push("",`Self-care rituals completed (${rituals.length}):`);ritualList.forEach(([k,c])=>L.push(`   ${k}: ${c}`));}
    L.push("","Self-reported tracking for personal reflection. Not a medical record or diagnosis.");return L.join("\n");
  }

  async function buildPdf(){
    const {jsPDF}=await import("jspdf");const doc=new jsPDF({unit:"pt",format:"letter"});
    const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=54;let y=M;
    const ink=[90,46,14],muted=[150,110,80],green=[122,140,110],line=[230,215,200];
    const clean=s=>String(s||"").replace(/[^\x20-\x7E -ÿ]/g,"").replace(/\s+/g," ").trim();
    const need=h=>{if(y+h>H-M){doc.addPage();y=M;}};
    doc.setFont("times","bold");doc.setFontSize(22);doc.setTextColor(...ink);doc.text("Personal Tracking Summary",M,y);y+=20;
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(...muted);doc.text(`${clean(user.username)||"My Inner Mind member"}  ·  ${periodLabel}  ·  Generated ${tPretty(to)}`,M,y);y+=12;
    doc.setDrawColor(...line);doc.line(M,y,W-M,y);y+=24;
    sums.forEach(({t,s})=>{
      need(110);doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(...ink);doc.text(clean(t.name),M,y);
      doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...muted);doc.text(`${s.days} of ${range} days logged`,W-M,y,{align:"right"});y+=15;
      doc.setFontSize(10.5);doc.setTextColor(60,40,25);doc.text(clean(s.line),M,y);y+=12;
      if(s.series&&s.series.length){
        const cw=W-2*M,ch=46,x0=M,y0=y+6;const max=t.kind==="scale"?5:t.kind==="yesno"?1:Math.max(...s.series.map(p=>p.v),1);
        doc.setDrawColor(...line);doc.setLineWidth(0.5);doc.line(x0,y0+ch,x0+cw,y0+ch);
        const day0=new Date(from+"T12:00:00").getTime();const bw=Math.max(1.5,cw/range-1.5);
        doc.setFillColor(...green);
        s.series.forEach(p=>{const i=Math.round((new Date(p.date+"T12:00:00").getTime()-day0)/86400000);if(i<0||i>=range)return;const hgt=Math.max(1.5,(p.v/max)*ch);doc.rect(x0+i*(cw/range),y0+ch-hgt,bw,hgt,"F");});
        doc.setFontSize(8);doc.setTextColor(...muted);doc.text(tPretty(from),x0,y0+ch+11);doc.text(tPretty(to),x0+cw,y0+ch+11,{align:"right"});
        if(t.kind!=="yesno")doc.text(`max ${max}`,x0,y0-2);
        y=y0+ch+24;
      }else y+=8;
      if(incNotes&&s.notes.length){doc.setFontSize(9.5);doc.setTextColor(...muted);doc.text("Notes",M,y);y+=12;doc.setTextColor(60,40,25);s.notes.forEach(n=>{const lines=doc.splitTextToSize(`${tPretty(n.date)}: ${clean(n.note)}`,W-2*M-10);need(lines.length*12+4);doc.text(lines,M+10,y);y+=lines.length*12+2;});y+=6;}
      y+=10;
    });
    const block=(title,list,total)=>{need(40+list.length*13);doc.setFont("helvetica","bold");doc.setFontSize(13);doc.setTextColor(...ink);doc.text(title,M,y);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...muted);doc.text(`${total} total`,W-M,y,{align:"right"});y+=16;doc.setFontSize(10.5);doc.setTextColor(60,40,25);list.forEach(([k,c])=>{doc.text(`${clean(k)||"Other"}`,M,y);doc.text(String(c),W-M,y,{align:"right"});y+=13;});y+=14;};
    if(incMood&&moodList.length)block("Mood check-ins",moodList,moods.length);
    if(incRituals&&ritualList.length)block("Self-care rituals completed",ritualList,rituals.length);
    need(40);doc.setDrawColor(...line);doc.line(M,y,W-M,y);y+=16;doc.setFontSize(8.5);doc.setTextColor(...muted);
    doc.text(doc.splitTextToSize("Self-reported by the person named above using the My Inner Mind app, for personal reflection and to support conversations with their care team. This is not a medical record, assessment or diagnosis.",W-2*M),M,y);
    return doc;
  }
  async function sharePdf(){
    setMsg("");try{const doc=await buildPdf();const blob=doc.output("blob");const name=`tracking-summary-${to}.pdf`;const file=new File([blob],name,{type:"application/pdf"});
      if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"My tracking summary"});return;}
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);setMsg("Your PDF has been downloaded.");
    }catch(e){if(e?.name!=="AbortError"){console.error(e);setMsg("Couldn't make the PDF here. Try Copy summary instead.");}}
  }
  async function copySummary(){try{await navigator.clipboard.writeText(textSummary());setMsg("Summary copied. Paste it into an email or message.");}catch{setMsg("Couldn't copy on this device.");}}

  const chip=(on)=>({padding:"7px 12px",borderRadius:14,border:`1.5px solid ${on?T_GREEN:"rgba(122,140,110,0.22)"}`,background:on?"rgba(122,140,110,0.14)":"transparent",color:on?"#4a5c3e":"#8a6040",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Nunito',sans-serif"});
  const card={background:"rgba(255,252,246,0.97)",border:"1px solid rgba(122,140,110,0.2)",borderRadius:20,padding:"18px"};
  return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><button onClick={onClose} style={S.ghostBtn}>← Trackers</button><div style={{fontSize:11,fontWeight:700,color:T_MUTED,textTransform:"uppercase",letterSpacing:"0.6px"}}>Share a report</div></div>
    <div style={card}>
      <div style={{fontSize:12,fontWeight:700,color:T_INK,marginBottom:8}}>Time period</div>
      <div style={{display:"flex",gap:6,marginBottom:14}}>{[7,30,90].map(n=>(<button key={n} onClick={()=>setRange(n)} style={{...chip(range===n),flex:1}}>{n} days</button>))}</div>
      <div style={{fontSize:12,fontWeight:700,color:T_INK,marginBottom:8}}>Include</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
        {trackers.map(t=>(<button key={t.id} onClick={()=>{const n=new Set(picked);n.has(t.id)?n.delete(t.id):n.add(t.id);setPicked(n);}} style={chip(picked.has(t.id))}>{t.emoji} {t.name}</button>))}
        <button onClick={()=>setIncMood(v=>!v)} style={chip(incMood)}>🌲 Mood check-ins</button>
        <button onClick={()=>setIncRituals(v=>!v)} style={chip(incRituals)}>🌿 Rituals</button>
        <button onClick={()=>setIncNotes(v=>!v)} style={chip(incNotes)}>📝 My notes</button>
      </div>
    </div>
    <div style={card}>
      <div style={{fontFamily:"'Lora',serif",fontSize:17,color:T_INK,fontWeight:600}}>Preview</div>
      <div style={{fontSize:11,color:T_MUTED,marginBottom:12}}>{periodLabel}</div>
      {loading?<p style={{fontSize:13,color:T_MUTED,fontStyle:"italic"}}>Gathering your data...</p>:(<div style={{display:"flex",flexDirection:"column",gap:12}}>
        {sums.map(({t,s})=>(<div key={t.id}><div style={{fontWeight:700,color:T_INK,fontSize:13}}>{t.emoji} {t.name} <span style={{fontWeight:500,color:T_MUTED,fontSize:11}}>· {s.days} days logged</span></div><div style={{fontSize:12,color:"#6a4020",marginTop:2}}>{s.line}</div>{incNotes&&s.notes.length>0&&<div style={{fontSize:11,color:T_MUTED,marginTop:4}}>{s.notes.length} note{s.notes.length>1?"s":""} included</div>}</div>))}
        {incMood&&<div><div style={{fontWeight:700,color:T_INK,fontSize:13}}>🌲 Mood check-ins <span style={{fontWeight:500,color:T_MUTED,fontSize:11}}>· {moods.length}</span></div><div style={{fontSize:12,color:"#6a4020",marginTop:2}}>{moodList.length?moodList.slice(0,4).map(([k,c])=>`${k} ×${c}`).join(" · "):"None in this period"}</div></div>}
        {incRituals&&<div><div style={{fontWeight:700,color:T_INK,fontSize:13}}>🌿 Rituals completed <span style={{fontWeight:500,color:T_MUTED,fontSize:11}}>· {rituals.length}</span></div><div style={{fontSize:12,color:"#6a4020",marginTop:2}}>{ritualList.length?ritualList.slice(0,4).map(([k,c])=>`${k} ×${c}`).join(" · "):"None in this period"}</div></div>}
      </div>)}
    </div>
    <div style={{display:"flex",gap:8}}><button disabled={loading} onClick={sharePdf} style={{...S.saveBtn,flex:1,background:`linear-gradient(135deg,#8ca07e,${T_GREEN})`}}>Share PDF</button><button disabled={loading} onClick={copySummary} style={{...S.ghostBtn,flex:1}}>Copy summary</button></div>
    {msg&&<p style={{fontSize:12,color:T_GREEN,textAlign:"center"}}>{msg}</p>}
    <p style={{fontSize:11,color:T_MUTED,fontStyle:"italic",textAlign:"center",lineHeight:1.5}}>Nothing is sent anywhere unless you share it. You choose who sees this.</p>
  </div>);
}

function GroveTab({user}){
  const [entries,setEntries]=useState([]);
  const [loading,setLoading]=useState(true);
  const [selectedMood,setSelectedMood]=useState(null);
  const [note,setNote]=useState("");
  const [saving,setSaving]=useState(false);

  const [enabledKeys,setEnabledKeys]=useState(null);
  const [todayCompletions,setTodayCompletions]=useState([]);
  const [selectedActivities,setSelectedActivities]=useState([]);
  const [completingActivities,setCompletingActivities]=useState(false);
  const [customizing,setCustomizing]=useState(false);

  useEffect(()=>{loadEntries();loadPrefs();loadTodayActivities();},[]);

 async function loadEntries(){
    setLoading(true);
    try{
      const data=await sbGet("grove_entries",`user_email=eq.${encodeURIComponent(user.email)}&order=created_at.desc&limit=10`);
      if(Array.isArray(data)){
  setEntries(data.map(e=>({
    ...e,
    date:e.created_at
  })));
}
    }catch(e){console.error(e);}
    setLoading(false);
  }

  async function loadPrefs(){
    try{
      const data=await sbGet("grove_activity_prefs",`user_email=eq.${encodeURIComponent(user.email)}`);
      if(Array.isArray(data)&&data.length&&Array.isArray(data[0].enabled_activities)&&data[0].enabled_activities.length){
        setEnabledKeys(new Set(data[0].enabled_activities));
      }else{
        setEnabledKeys(new Set(GROVE_ACTIVITIES.map(a=>a.key)));
      }
    }catch(e){
      setEnabledKeys(new Set(GROVE_ACTIVITIES.map(a=>a.key)));
    }
  }

  async function loadTodayActivities(){
    try{
      const today=getTodayStr();
      const data=await sbGet("grove_activity_log",`user_email=eq.${encodeURIComponent(user.email)}&date=eq.${today}`);
      if(Array.isArray(data))setTodayCompletions(data.map(d=>d.activity_key));
    }catch(e){console.error(e);}
  }

  async function checkIn(){
    if(!selectedMood)return;
    setSaving(true);
    try{
      await sbInsert("grove_entries",{
        id:`${user.email}_${Date.now()}`,
        user_email:user.email,
        mood:`${selectedMood.emoji} ${selectedMood.label}`,
        note:note||null,
      });
      setSelectedMood(null);
      setNote("");
      await loadEntries();
      spawnConfetti();
    }catch(e){
  console.error("Check-in save failed:",e);
  alert("Your check-in couldn't be saved. Please try again.");
}
    setSaving(false);
  }

  function toggleSelectActivity(key){
    const remaining=5-todayCompletions.length;
    if(selectedActivities.includes(key)){
      setSelectedActivities(selectedActivities.filter(k=>k!==key));
    }else{
      if(selectedActivities.length>=remaining)return;
      setSelectedActivities([...selectedActivities,key]);
    }
  }

  async function completeSelectedActivities(){
  if(selectedActivities.length===0)return;

  setCompletingActivities(true);

  const today=getTodayStr();

  try{
    for(const key of selectedActivities){
      const activity=GROVE_ACTIVITIES.find(a=>a.key===key);
      if(!activity)continue;

      await sbInsert("grove_activity_log",{
        id:`${user.email}_${key}_${Date.now()}`,
        user_email:user.email,
        activity_key:key,
        activity_label:activity.name,
        activity_emoji:activity.emoji,
        date:today,
      });
    }
    setSelectedActivities([]);
    spawnConfetti();

  }catch(e){
    console.error(e);
  }

  setCompletingActivities(false);
}

  async function toggleActivityPref(key){
    const next=new Set(enabledKeys);
    if(next.has(key))next.delete(key);else next.add(key);
    setEnabledKeys(next);
    try{
      await sbUpsert("grove_activity_prefs",{
        user_email:user.email,
        enabled_activities:Array.from(next),
      });
    }catch(e){console.error(e);}
  }

  const remaining=5-todayCompletions.length;
  const enabledActivities=enabledKeys?GROVE_ACTIVITIES.filter(a=>enabledKeys.has(a.key)):[];

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <PageHeader kicker="Check in" title="The Grove" sub="How are you feeling right now?"/>

      <div style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(122,140,110,0.2)",borderRadius:20,padding:"20px"}}>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",marginBottom:14}}>
          {GROVE_MOODS.map(m=>(
            <button key={m.label} onClick={()=>setSelectedMood(selectedMood?.label===m.label?null:m)}
              style={{padding:"10px 16px",borderRadius:16,cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,
                border:`1.5px solid ${selectedMood?.label===m.label?"#7a8c6e":"rgba(122,140,110,0.25)"}`,
                background:selectedMood?.label===m.label?"rgba(122,140,110,0.15)":"transparent",
                color:selectedMood?.label===m.label?"#5a6c4e":"#8a6040"}}>
              {m.emoji} {m.label}
            </button>
          ))}
        </div>
        <textarea style={{...S.textarea,minHeight:70,marginBottom:12}} placeholder="Want to add a note? (optional)" value={note} onChange={e=>setNote(e.target.value)} rows={2}/>
        <button onClick={checkIn} disabled={!selectedMood||saving}
          style={{...S.saveBtn,width:"100%",background:"linear-gradient(135deg,#8ca07e,#7a8c6e)",opacity:!selectedMood||saving?0.5:1}}>
          {saving?"Checking in...":"Check In 🌿"}
        </button>
      </div>

      <TrackerSection user={user}/>

      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px"}}>Today's Self-Care Rituals</div>
          <button onClick={()=>setCustomizing(!customizing)} style={{...S.ghostBtn,padding:"4px 12px",fontSize:11}}>
            {customizing?"Done":"Customize"}
          </button>
        </div>

        {customizing?(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <p style={{fontSize:12,color:"#b08060",fontStyle:"italic"}}>Turn off any activities you never want to see. Everything is on by default.</p>
            {GROVE_CATEGORIES.map(cat=>(
              <div key={cat}>
                <div style={{fontSize:11,fontWeight:700,color:"#7a8c6e",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{cat}</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {GROVE_ACTIVITIES.filter(a=>a.category===cat).map(a=>(
                    <label key={a.key} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"rgba(255,252,246,0.9)",border:"1px solid rgba(122,140,110,0.15)",borderRadius:12,cursor:"pointer"}}>
                      <input type="checkbox" checked={enabledKeys?enabledKeys.has(a.key):true} onChange={()=>toggleActivityPref(a.key)} style={{accentColor:"#7a8c6e",width:16,height:16}}/>
                      <span style={{fontSize:16}}>{a.emoji}</span>
                      <span style={{fontSize:13,color:"#5a2e0e"}}>{a.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ):todayCompletions.length>=5?(
          <div style={{textAlign:"center",padding:"30px 20px",background:"rgba(255,252,246,0.93)",border:"1px solid rgba(122,140,110,0.15)",borderRadius:20}}>
            <div style={{fontSize:36,marginBottom:10}}>🌟</div>
            <p style={{fontFamily:"'Lora',serif",fontStyle:"italic",color:"#5a6c4e",fontSize:15,lineHeight:1.7}}>You completed all 5 rituals today. Your grove is glowing. 🌿</p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {GROVE_CATEGORIES.map(cat=>{
              const catActs=enabledActivities.filter(a=>a.category===cat);
              if(!catActs.length)return null;
              return(
                <div key={cat}>
                  <div style={{fontSize:11,fontWeight:700,color:"#7a8c6e",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{cat}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {catActs.map(a=>{
                      const isDone=todayCompletions.includes(a.key);
                      const isSelected=selectedActivities.includes(a.key);
                      return(
                        <div key={a.key} onClick={()=>!isDone&&toggleSelectActivity(a.key)}
                          style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:14,cursor:isDone?"default":"pointer",
                            background:isDone?"rgba(212,168,67,0.08)":isSelected?"rgba(122,140,110,0.15)":"rgba(255,252,246,0.93)",
                            border:`1px solid ${isDone?"rgba(212,168,67,0.2)":isSelected?"#7a8c6e":"rgba(122,140,110,0.15)"}`,opacity:isDone?0.6:1}}>
                          <span style={{fontSize:22}}>{a.emoji}</span>
                          <div style={{flex:1}}>
                            <div style={{fontSize:14,fontWeight:600,color:"#5a2e0e"}}>{a.name}</div>
                            <div style={{fontSize:11,color:"#b08060"}}>{a.desc}</div>
                          </div>
                          <div style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(122,140,110,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,
                            background:isDone?"#d4a843":isSelected?"#7a8c6e":"transparent",color:isDone||isSelected?"#fff":"transparent"}}>
                            {isDone||isSelected?"✓":""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button onClick={completeSelectedActivities} disabled={selectedActivities.length===0||completingActivities}
              style={{...S.saveBtn,width:"100%",background:"linear-gradient(135deg,#d4a843,#c8895a)",opacity:selectedActivities.length===0||completingActivities?0.5:1}}>
              {completingActivities?"Blooming...":`Complete ${selectedActivities.length||""} & Bloom 🌿`}
            </button>
          </div>
        )}
      </div>

      <div>
        <div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>Recent Check-Ins</div>
        {loading?(
          <div style={{textAlign:"center",padding:"20px",color:"#b08060",fontStyle:"italic"}}>Loading...</div>
        ):entries.length===0?(
          <div style={{textAlign:"center",padding:"20px",color:"#b08060",fontStyle:"italic",fontFamily:"'Lora',serif"}}>No check-ins yet. Start above. 🌱</div>
        ):(
          entries.map(e=>(
            <div key={e.id} style={{background:"rgba(255,252,246,0.93)",border:"1px solid rgba(122,140,110,0.15)",borderRadius:14,padding:"12px 16px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:e.note?6:0}}>
                <span style={{fontWeight:700,color:"#5a6c4e",fontSize:14}}>{e.mood}</span>
                <span style={{fontSize:11,color:"#b08060"}}>{new Date(e.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
              </div>
              {e.note&&<p style={{fontSize:13,color:"#8a6040",fontStyle:"italic",fontFamily:"'Lora',serif"}}>{e.note}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
function GentleNudge({entries,theme}){const T=theme||THEMES.original;const [dismissed,setDismissed]=useState(()=>store.get("nudge_"+(entries?.[0]?.user_email||""))||false);if(dismissed)return null;const lastEntry=entries[0];if(!lastEntry)return null;const daysSince=Math.floor((Date.now()-new Date(lastEntry.date).getTime())/(24*60*60*1000));if(daysSince<5)return null;return(<div style={{background:`linear-gradient(135deg,${T.accent}10,${T.accent}06)`,border:`1px dashed ${T.accent}40`,borderRadius:18,padding:"14px 20px",display:"flex",alignItems:"center",gap:14}}><span style={{fontSize:28}}>🌱</span><div style={{flex:1}}><div style={{fontWeight:700,color:T.accentDark,fontSize:14}}>We've missed you</div><div style={{fontSize:13,color:T.subtext,marginTop:2}}>It's been {daysSince} days since your last entry. No pressure. Just here when you're ready. 🌿</div></div><button onClick={()=>{store.set("nudge_"+(entries?.[0]?.user_email||"anon"),true);setDismissed(true);}} style={{background:"none",border:"none",color:T.subtext,fontSize:18,cursor:"pointer",padding:4}}>×</button></div>);}

function GrowthTree({entries}){const count=entries.length;const stage=count===0?0:count<5?1:count<15?2:count<30?3:count<60?4:5;const trees=["🌱","🌿","🪴","🌳","🌲","🎋"];const labels=["Plant your seed","Sprouting","Growing","Rooted","Thriving","Flourishing"];const next=[1,5,15,30,60,Infinity];const prevMilestone=stage>0?next[stage-1]:0;const nextMilestone=next[stage];const progress=stage>=5?1:Math.min(1,(count-prevMilestone)/(nextMilestone-prevMilestone));return(<div style={{background:"rgba(255,252,246,0.9)",border:"1px solid rgba(200,137,90,0.15)",borderRadius:20,padding:"20px 22px",textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:12}}>Your Growth</div><div style={{fontSize:64,marginBottom:8}}>{trees[stage]}</div><div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#5a2e0e",fontWeight:600,marginBottom:4}}>{labels[stage]}</div><div style={{fontSize:13,color:"#b08060",marginBottom:12}}>{count} {count===1?"entry":"entries"} written</div>{stage<5&&(<div style={{background:"rgba(200,137,90,0.1)",borderRadius:12,height:8,overflow:"hidden"}}><div style={{background:"linear-gradient(90deg,#c8895a,#d4956a)",height:"100%",width:`${progress*100}%`,transition:"width 0.5s",borderRadius:12}}/></div>)}{stage<5&&<div style={{fontSize:11,color:"#b08060",marginTop:6}}>{nextMilestone-count} more entries to {labels[stage+1]}</div>}</div>);}

// REPLACES your existing LettersTab function entirely.

function LettersTab({user}){
  const [letters,setLetters]=useState([]);
  const [loading,setLoading]=useState(true);
  const [writing,setWriting]=useState(false);
  const [form,setForm]=useState({title:"",content:"",deliverIn:30});

  useEffect(()=>{loadLetters();},[]);

  async function loadLetters(){
    setLoading(true);
    try{
      const data=await sbGet("letters",`user_email=eq.${encodeURIComponent(user.email)}&order=written.desc`);
      if(Array.isArray(data))setLetters(data);
    }catch(e){console.error(e);}
    setLoading(false);
  }

  async function saveLetter(){
    if(!form.content.trim())return;
    const deliverOn=new Date(Date.now()+form.deliverIn*24*60*60*1000).toISOString();
    try{
      await sbInsert("letters",{
        id:`${user.email}_${Date.now()}`,
        user_email:user.email,
        title:form.title||"A letter to my future self",
        content:form.content,
        deliver_on:deliverOn,
        deliver_in:form.deliverIn,
        opened:false,
      });
      await loadLetters();
      setWriting(false);
      setForm({title:"",content:"",deliverIn:30});
    }catch(e){console.error(e);}
  }

  async function openLetter(id){
    try{
      await sbUpdate("letters",`id=eq.${id}`,{opened:true});
      setLetters(letters.map(l=>l.id===id?{...l,opened:true}:l));
    }catch(e){console.error(e);}
  }

  const ready=letters.filter(l=>new Date(l.deliver_on)<=new Date());
  const waiting=letters.filter(l=>new Date(l.deliver_on)>new Date());

  return(
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div>
        <PageHeader kicker="Across time" title="Letters to Future Me" sub="Write to the person you're becoming." right={<button onClick={()=>setWriting(true)} style={{...S.newBtn,flexShrink:0}}>+ Write</button>}/>
      </div>

      {writing&&(
        <div style={{background:"rgba(255,252,246,0.97)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:24,padding:"28px 24px",boxShadow:"0 4px 24px rgba(160,100,50,0.12)"}}>
          <input style={{...S.titleInput,marginBottom:16}} placeholder="Give this letter a title..." value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
          <textarea style={{...S.textarea,minHeight:160,marginBottom:16}} placeholder="Dear future me..." value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} autoFocus/>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Deliver in</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[{label:"30 days",val:30},{label:"60 days",val:60},{label:"90 days",val:90},{label:"6 months",val:180},{label:"1 year",val:365}].map(o=>(
                <button key={o.val} onClick={()=>setForm(f=>({...f,deliverIn:o.val}))} style={{padding:"6px 14px",borderRadius:14,border:`1px solid ${form.deliverIn===o.val?"#c8895a":"rgba(200,137,90,0.3)"}`,background:form.deliverIn===o.val?"rgba(200,137,90,0.15)":"transparent",color:form.deliverIn===o.val?"#7a4a1e":"#b08060",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Nunito',sans-serif"}}>{o.label}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button onClick={()=>setWriting(false)} style={S.ghostBtn}>Cancel</button>
            <button onClick={saveLetter} style={S.saveBtn}>Seal & Send ✉️</button>
          </div>
        </div>
      )}

      {loading?(
        <div style={{textAlign:"center",padding:"40px 0",color:"#b08060",fontStyle:"italic"}}>Loading your letters...</div>
      ):(
        <>
          {ready.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#c8895a",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>📬 Ready to open ({ready.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {ready.map(l=>(
                  <div key={l.id} style={{background:"linear-gradient(135deg,rgba(200,137,90,0.1),rgba(122,74,30,0.07))",border:"1px solid rgba(200,137,90,0.3)",borderRadius:18,padding:"18px 20px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontFamily:"'Lora',serif",fontSize:16,color:"#5a2e0e",fontWeight:600}}>{l.title}</div>
                        <div style={{fontSize:11,color:"#b08060",marginTop:2}}>Written {new Date(l.written).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
                      </div>
                      {!l.opened&&<button onClick={()=>openLetter(l.id)} style={{...S.saveBtn,padding:"6px 16px",fontSize:12}}>Open ✉️</button>}
                    </div>
                    {l.opened&&<p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#7a5030",lineHeight:1.75,fontStyle:"italic",whiteSpace:"pre-wrap"}}>{l.content}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {waiting.length>0&&(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:10}}>🔒 Sealed ({waiting.length})</div>
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {waiting.map(l=>(
                  <div key={l.id} style={{background:"rgba(200,137,90,0.05)",border:"1px dashed rgba(200,137,90,0.25)",borderRadius:16,padding:"14px 18px",opacity:0.7}}>
                    <div style={{fontFamily:"'Lora',serif",fontSize:15,color:"#5a2e0e",fontWeight:600,marginBottom:4}}>{l.title}</div>
                    <div style={{fontSize:12,color:"#b08060"}}>Opens {new Date(l.deliver_on).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {letters.length===0&&!writing&&(
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <div style={{fontSize:52,marginBottom:14}}>💌</div>
              <p style={{fontFamily:"'Lora',serif",fontSize:16,color:"#b08060",fontStyle:"italic",marginBottom:20}}>Write a letter to your future self.<br/>It'll be waiting when you're ready.</p>
              <button onClick={()=>setWriting(true)} style={S.saveBtn}>Write Your First Letter →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
// REPLACES your existing HomeTab function entirely.
function ProfileMenu({user,theme,T,onLogout,onTheme,onUpgradeTab,onAccountTab}){
  const [open,setOpen]=useState(false);const isAdmin=user.email===ADMIN_EMAIL;const plan=PLANS[user.plan];
  function pick(fn){fn();setOpen(false);}
  return(<div style={{position:"relative"}}><button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",background:"rgba(200,137,90,0.08)",borderRadius:20,border:"1px solid rgba(200,137,90,0.18)",cursor:"pointer"}}><span style={{fontSize:12,fontWeight:600,color:"#7a4a1e",whiteSpace:"nowrap",maxWidth:96,overflow:"hidden",textOverflow:"ellipsis"}}>👤 {user.username}</span><span className="mim-plan-badge" style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:8,textTransform:"uppercase",background:plan?.color+"22",color:plan?.color}}>{plan?.name}</span><span style={{fontSize:10,color:"#b08060"}}>{open?"▲":"▼"}</span></button>{open&&(<div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:"#fffdf8",border:"1px solid rgba(200,137,90,0.2)",borderRadius:18,padding:"12px",minWidth:200,boxShadow:"0 8px 32px rgba(120,70,20,0.2)",zIndex:200}}><div style={{fontSize:11,fontWeight:700,color:"#b08060",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Theme</div><div style={{display:"flex",gap:6,marginBottom:12}}>{Object.entries(THEMES).map(([key,t])=>(<button key={key} onClick={()=>pick(()=>onTheme(key))} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 4px",borderRadius:12,border:`1px solid ${theme===key?"#c8895a":"rgba(200,137,90,0.2)"}`,background:theme===key?"rgba(200,137,90,0.12)":"transparent",cursor:"pointer"}}><span style={{fontSize:20}}>{t.icon}</span><span style={{fontSize:9,fontWeight:600,color:theme===key?"#7a4a1e":"#b08060"}}>{t.name}</span></button>))}</div><div style={{height:1,background:"rgba(200,137,90,0.15)",marginBottom:10}}/><button onClick={()=>pick(onAccountTab)} style={{width:"100%",background:"rgba(200,137,90,0.08)",border:"1px solid rgba(200,137,90,0.2)",borderRadius:14,padding:"8px",color:"#7a4a1e",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:8}}>⚙️ Account Settings</button><button onClick={()=>pick(onUpgradeTab)} style={{width:"100%",background:"linear-gradient(135deg,#d4956a,#c8895a)",border:"none",borderRadius:14,padding:"8px",color:"#fff",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:8}}>💎 Plans & Upgrade</button>{isAdmin&&<button onClick={()=>pick(()=>{const e=new CustomEvent("hallie-nav",{detail:"admin"});window.dispatchEvent(e);})} style={{width:"100%",background:"rgba(122,74,30,0.08)",border:"1px solid rgba(122,74,30,0.15)",borderRadius:14,padding:"8px",color:"#7a4a1e",fontFamily:"'Nunito',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:8}}>🔐 Admin Dashboard</button>}<button onClick={()=>pick(onLogout)} style={{width:"100%",background:"none",border:"1px solid rgba(200,80,60,0.25)",borderRadius:14,padding:"8px",color:"#c05040",fontFamily:"'Nunito',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sign out</button></div>)}</div>);
}
function HomeTab({user,onNavigate}){
  const g=getTimeGreeting();const hour=new Date().getHours();
  const greeting=g.greeting.replace(/\s*[^\w\s.,'?!]+\s*$/u,"").trim();
  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const affirmation=getDailyAffirmation();
  // Muted, time-of-day palettes: sky, three ridge layers (far → near), text, glass
  let P;
  if(hour>=5&&hour<8)P={sky:"linear-gradient(180deg,#e9d3c4 0%,#e3b9ad 38%,#c9a3ae 70%,#a58ea6 100%)",r:["#b49aac","#8f7891","#6c5873"],text:"#fffaf5",sub:"rgba(255,250,245,0.82)",glass:"rgba(255,255,255,0.16)",line:"rgba(255,255,255,0.32)",orb:"#fff1dc",orbGlow:"rgba(255,226,190,0.55)"};
  else if(hour>=8&&hour<17)P={sky:"linear-gradient(180deg,#dfe7e6 0%,#e9e6dc 45%,#efe2cf 75%,#e8d4bb 100%)",r:["#cfc7b3","#aab09a","#7f8c73"],text:"#3d2a1a",sub:"rgba(61,42,26,0.66)",glass:"rgba(255,252,246,0.58)",line:"rgba(122,74,30,0.14)",orb:"#fff6e2",orbGlow:"rgba(255,226,170,0.6)"};
  else if(hour>=17&&hour<20)P={sky:"linear-gradient(180deg,#d9a88a 0%,#c98f86 35%,#9a7790 68%,#5e4f72 100%)",r:["#8a6f86","#65506b","#45374f"],text:"#fffaf5",sub:"rgba(255,250,245,0.8)",glass:"rgba(255,255,255,0.13)",line:"rgba(255,255,255,0.26)",orb:"#ffe0c2",orbGlow:"rgba(255,200,160,0.5)"};
  else P={sky:"linear-gradient(180deg,#1f1a33 0%,#2b2443 40%,#3d3354 75%,#54476a 100%)",r:["#3b3150","#2c243e","#1d182b"],text:"#f6f1ea",sub:"rgba(246,241,234,0.72)",glass:"rgba(255,255,255,0.08)",line:"rgba(255,255,255,0.16)",orb:"#f3ead8",orbGlow:"rgba(243,234,216,0.35)",stars:true};
  const night=!!P.stars;
  const actions=[{k:"write",label:"Write",hint:"Journal",go:"write"},{k:"breathe",label:"Breathe",hint:"Nest",go:"nest"},{k:"checkin",label:"Check in",hint:"Grove",go:"grove"},{k:"setdown",label:"Set it down",hint:"Let it go",go:"setitdown"}];
  return(
    <div style={{margin:"-24px -16px -100px -16px",minHeight:"calc(100vh - 64px)",position:"relative",overflow:"hidden",background:P.sky,display:"flex",flexDirection:"column"}}>
      <style>{`@keyframes mimDrift{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes mimTwinkle{0%,100%{opacity:.25}50%{opacity:.9}}@keyframes mimRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>
      {/* soft light source */}
      <div style={{position:"absolute",top:-30,right:-40,width:200,height:200,borderRadius:"50%",background:`radial-gradient(circle,${P.orbGlow} 0%,transparent 65%)`,pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:16,right:30,width:28,height:28,borderRadius:"50%",background:`radial-gradient(circle at 40% 38%,#fff,${P.orb} 70%)`,opacity:0.95,animation:"mimDrift 9s ease-in-out infinite",pointerEvents:"none"}}/>
      {night&&[...Array(18)].map((_,i)=>(<div key={i} style={{position:"absolute",width:i%5===0?2.5:1.5,height:i%5===0?2.5:1.5,borderRadius:"50%",background:"#fff",left:`${(i*53+7)%96}%`,top:`${(i*29+5)%42}%`,animation:`mimTwinkle ${3+(i%4)}s ease-in-out infinite`,animationDelay:`${(i%7)*0.5}s`,pointerEvents:"none"}}/>))}

      {/* layered ridgelines */}
      <svg viewBox="0 0 400 220" preserveAspectRatio="none" style={{position:"absolute",left:0,right:0,bottom:0,width:"100%",height:"34%",pointerEvents:"none"}}>
        
        <path d="M0 92 C 50 70, 90 78, 130 64 S 210 40, 260 58 S 340 76, 400 54 L400 220 L0 220 Z" fill={P.r[0]} opacity="0.75"/>
        
        <path d="M0 132 C 60 110, 110 124, 170 104 S 270 92, 320 112 S 380 118, 400 106 L400 220 L0 220 Z" fill={P.r[1]} opacity="0.88"/>
        <path d="M0 172 C 70 152, 140 166, 210 150 S 330 156, 400 144 L400 220 L0 220 Z" fill={P.r[2]}/>
      </svg>

      {/* content */}
      <div style={{position:"relative",zIndex:1,padding:"40px 24px 0",maxWidth:520,width:"100%",margin:"0 auto",animation:"mimRise .6s ease-out both"}}>
        <div style={{fontSize:11,letterSpacing:"2.2px",textTransform:"uppercase",color:P.sub,fontWeight:700,marginBottom:12}}>{dateStr}</div>
        <h1 style={{fontFamily:"'Lora',serif",fontWeight:600,fontSize:34,lineHeight:1.15,color:P.text,margin:0,letterSpacing:"-0.3px"}}>{greeting}</h1>
        <p style={{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:16,lineHeight:1.55,color:P.sub,margin:"10px 0 0",maxWidth:340}}>{g.sub}</p>

        <div style={{marginTop:32,padding:"20px 22px",borderRadius:20,background:P.glass,border:`1px solid ${P.line}`,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)"}}>
          <div style={{fontSize:10,letterSpacing:"2px",textTransform:"uppercase",color:P.sub,fontWeight:700,marginBottom:10}}>Today's reminder</div>
          <p style={{fontFamily:"'Lora',serif",fontSize:18,lineHeight:1.6,color:P.text,margin:0}}>{affirmation}</p>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginTop:14}}>
          {actions.map(a=>(<button key={a.k} onClick={()=>onNavigate&&onNavigate(a.go)} style={{padding:"14px 8px",borderRadius:16,background:P.glass,border:`1px solid ${P.line}`,backdropFilter:"blur(14px)",WebkitBackdropFilter:"blur(14px)",cursor:"pointer",textAlign:"center",fontFamily:"'Nunito',sans-serif"}}>
            <div style={{fontFamily:"'Lora',serif",fontSize:16,fontWeight:600,color:P.text}}>{a.label}</div>
            <div style={{fontSize:10,letterSpacing:"1.4px",textTransform:"uppercase",color:P.sub,marginTop:3,fontWeight:700}}>{a.hint}</div>
          </button>))}
        </div>
      </div>
      <div style={{flex:1,minHeight:180}}/>
    </div>
  );
}

function JournalingTimeBanner(){const [dismissed,setDismissed]=useState(()=>persist.get("journaling_banner_dismissed")||false);if(dismissed)return null;return(<div style={{background:"linear-gradient(135deg,rgba(122,74,30,0.07),rgba(155,126,184,0.06))",border:"1px solid rgba(122,74,30,0.15)",borderRadius:18,padding:"16px 20px",display:"flex",gap:14,alignItems:"flex-start"}}><span style={{fontSize:28,flexShrink:0}}>⏱️</span><div style={{flex:1}}><div style={{fontSize:11,fontWeight:700,color:"#9b7eb8",textTransform:"uppercase",letterSpacing:"0.6px",marginBottom:5}}>The sweet spot</div><p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#5a3a1a",fontStyle:"italic",lineHeight:1.65,marginBottom:4}}>"5 to 15 minutes is all it takes, and 10 is the sweet spot. Enough time to get past the surface and into something real."</p><p style={{fontSize:11,color:"#b08060"}}>Hallie 🌿</p></div><button onClick={()=>{persist.set("journaling_banner_dismissed",true);setDismissed(true);}} style={{background:"none",border:"none",fontSize:16,color:"#c8b896",cursor:"pointer",flexShrink:0,padding:2}}>×</button></div>);}

function StoryOfTheMonth({communityId,cfg}){const [stories,setStories]=useState([]);const [loading,setLoading]=useState(true);const [anonContent,setAnonContent]=useState("");const [submitting,setSubmitting]=useState(false);const [submitted,setSubmitted]=useState(false);useEffect(()=>{loadStories();},[communityId]);async function loadStories(){setLoading(true);try{const filters=communityId?`submit_to_sotm=eq.true&community_id=eq.${communityId}&order=created_at.desc`:`submit_to_sotm=eq.true&order=created_at.desc`;const data=await sbGet("community_posts",`${filters}&select=*`);if(Array.isArray(data))setStories(data);}catch(e){console.error(e);}setLoading(false);}async function submitAnon(){if(!anonContent.trim())return;setSubmitting(true);try{await sbInsert("community_posts",{user_id:"anonymous",community_id:communityId,content:anonContent.trim(),is_anonymous:true,submit_to_sotm:true});setSubmitted(true);setAnonContent("");}catch(e){console.error(e);}setSubmitting(false);}return(<div style={{padding:"0 16px"}}><div style={{background:"linear-gradient(135deg,rgba(122,74,30,0.08),rgba(200,137,90,0.05))",border:"1px solid rgba(122,74,30,0.15)",borderRadius:18,padding:"20px",marginBottom:16,textAlign:"center"}}><div style={{fontSize:32,marginBottom:8}}>🎙️</div><h3 style={{fontFamily:"'Lora',serif",fontSize:18,color:"#5a2e0e",marginBottom:6,fontWeight:600}}>Story of the Month</h3><p style={{fontSize:13,color:"#b08060",lineHeight:1.6,marginBottom:16,fontStyle:"italic",fontFamily:"'Lora',serif"}}>Hallie reads every submission and may feature your story, anonymously, on the My Inner Mind podcast. No account needed.</p>{!submitted?(<div style={{textAlign:"left"}}><textarea style={{width:"100%",padding:"12px 14px",border:"1.5px solid rgba(200,137,90,0.2)",borderRadius:12,fontFamily:"'Lora',serif",fontSize:14,color:"#5a3a1a",resize:"none",outline:"none",lineHeight:1.7,marginBottom:10,background:"rgba(253,248,242,0.9)",boxSizing:"border-box",fontStyle:"italic",minHeight:100}} placeholder="Share something from your heart. It will always be kept anonymous." value={anonContent} onChange={e=>setAnonContent(e.target.value)} rows={4}/><button style={{width:"100%",background:"linear-gradient(135deg,#d4956a,#c8895a)",color:"white",border:"none",borderRadius:20,padding:"11px",fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif",fontWeight:700,opacity:!anonContent.trim()||submitting?0.5:1}} disabled={!anonContent.trim()||submitting} onClick={submitAnon}>{submitting?"Submitting...":"Submit Anonymously 🎙️"}</button></div>):(<div style={{background:"rgba(122,74,30,0.06)",borderRadius:14,padding:"16px"}}><div style={{fontSize:28,marginBottom:6}}>💛</div><p style={{fontFamily:"'Lora',serif",fontStyle:"italic",color:"#7a4a1e",fontSize:14,lineHeight:1.6}}>Your story has been submitted. Thank you for trusting us with it. Hallie will read it. 🌿</p></div>)}</div>{loading?<div style={{textAlign:"center",padding:"20px",color:"#b08060",fontStyle:"italic"}}>Loading submissions...</div>:stories.length===0?<div style={{textAlign:"center",padding:"20px",color:"#b08060",fontStyle:"italic",fontFamily:"'Lora',serif"}}>No submissions yet. Be the first. 🌿</div>:(stories.map(s=>(<div key={s.id} style={{background:"rgba(255,252,246,0.95)",borderRadius:16,padding:"16px",marginBottom:10,border:"1px solid rgba(122,74,30,0.1)"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#b0a090,#9a8878)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>👤</div><div><div style={{fontSize:12,fontWeight:700,color:"#5a2e0e"}}>Anonymous</div><div style={{fontSize:10,color:"#b08060"}}>Submitted for Story of the Month</div></div><span style={{marginLeft:"auto",fontSize:10,color:"#7a4a1e",background:"rgba(122,74,30,0.08)",border:"1px solid rgba(122,74,30,0.15)",padding:"2px 8px",borderRadius:10,fontWeight:700}}>🎙️ SOTM</span></div><p style={{fontFamily:"'Lora',serif",fontSize:14,color:"#5a3a1a",lineHeight:1.8,fontStyle:"italic"}}>{s.content}</p></div>)))}</div>);}
