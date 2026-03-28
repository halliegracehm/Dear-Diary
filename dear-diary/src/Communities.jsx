import { useState, useEffect } from "react";

const SUPABASE_URL = "https://xwhpyslvwnnbvyydimmg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aHB5c2x2d25uYnZ5eWRpbW1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTkwOTIsImV4cCI6MjA4ODIzNTA5Mn0.bdxjpBNI6qEBFjSrRjBVCKqUU8oPBUL-8LzXKgxxJ4A";
const H = { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function sbGet(table, filters="") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}`, { headers: H });
  if (res.status===204) return [];
  return res.json();
}
async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method:"POST", headers:H, body:JSON.stringify(data) });
  if (res.status===204) return [];
  return res.json();
}
async function sbDelete(table, filters) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}`, { method:"DELETE", headers:{...H,"Prefer":"return=minimal"} });
}

const TIER_ORDER = { free:0, community:1, premium:2 };
const TIER_CONFIG = {
  free:      { label:"Free",           color:"#7a9e7e", bg:"rgba(122,158,126,0.08)",  border:"rgba(122,158,126,0.2)"  },
  community: { label:"Community",      color:"#c8895a", bg:"rgba(200,137,90,0.08)",   border:"rgba(200,137,90,0.2)"   },
  premium:   { label:"Off the Record", color:"#9b7eb8", bg:"rgba(155,126,184,0.08)",  border:"rgba(155,126,184,0.2)"  },
};
const MOOD_TAGS = [
  {emoji:"🌸",label:"Blooming"},{emoji:"🌱",label:"Growing"},{emoji:"☁️",label:"Cloudy"},
  {emoji:"🔥",label:"Fired Up"},{emoji:"🌊",label:"Overwhelmed"},{emoji:"✨",label:"Grateful"},
  {emoji:"💪",label:"Strong"},{emoji:"🌙",label:"Tired"},{emoji:"😂",label:"Joyful"},{emoji:"🙏",label:"At Peace"},
];
const REACTIONS = ["❤️","🙌","✨","🫂","💛","🌿"];
const DAILY_PROMPTS = {
  "daily-checkin":"How are you showing up today? What's on your heart right now?",
  "gratitude":"Name three things — big or small — that you're grateful for today.",
  "big-wins":"What's a win you had recently that you haven't celebrated yet?",
  "healing":"What's one thing you're releasing this week?",
  "morning":"What does your ideal morning look like? What did you do today?",
  "anxiety":"What's something that's been living in your head rent-free? Let it out here.",
  "manifesting":"Write it like it's already happened. What are you calling in?",
  "motherhood":"What's a moment with your kid(s) recently that made your heart full?",
  "single":"What's something you love about your life right now, just as it is?",
  "career":"What are you building? What step are you taking this week?",
};

export default function Communities({ user, userTier="free", onUpgrade }) {
  const [communities,setCommunities]=useState([]);
  const [activeCommunity,setActiveCommunity]=useState(null);
  const [posts,setPosts]=useState([]);
  const [newPost,setNewPost]=useState("");
  const [selectedMood,setSelectedMood]=useState(null);
  const [isPromptMode,setIsPromptMode]=useState(false);
  const [loading,setLoading]=useState(true);
  const [postsLoading,setPostsLoading]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [reactions,setReactions]=useState({});
  const [myReactions,setMyReactions]=useState({});
  const [memberCounts,setMemberCounts]=useState({});
  const [isMember,setIsMember]=useState({});
  const [view,setView]=useState("list");
  const userTierLevel = TIER_ORDER[userTier]??0;
  const userKey = user?.email || user?.id || null;

  useEffect(()=>{loadCommunities();},[]);
  useEffect(()=>{ if(activeCommunity){loadPosts(activeCommunity.id);checkMembership(activeCommunity.id);} },[activeCommunity]);

  async function loadCommunities() {
    setLoading(true);
    try {
      const data = await sbGet("communities","order=min_tier.asc");
      if(Array.isArray(data)) setCommunities(data);
      const members = await sbGet("community_members","select=community_id");
      if(Array.isArray(members)){
        const counts={};
        members.forEach(m=>{counts[m.community_id]=(counts[m.community_id]||0)+1;});
        setMemberCounts(counts);
      }
    } catch(e){console.error(e);}
    setLoading(false);
  }

  async function loadPosts(communityId) {
    setPostsLoading(true);
    try {
      const data = await sbGet("community_posts",`community_id=eq.${communityId}&order=created_at.desc&limit=50&select=*,users(username)`);
      if(Array.isArray(data)){
        setPosts(data);
        const ids=data.map(p=>p.id);
        if(ids.length>0){
          const reactionData=await sbGet("post_reactions",`post_id=in.(${ids.join(",")})`);
          if(Array.isArray(reactionData)){
            const rm={},mrm={};
            reactionData.forEach(r=>{
              if(!rm[r.post_id])rm[r.post_id]={};
              rm[r.post_id][r.emoji]=(rm[r.post_id][r.emoji]||0)+1;
              if(r.user_id===userKey)mrm[r.post_id]=r.emoji;
            });
            setReactions(rm);setMyReactions(mrm);
          }
        }
      }
    } catch(e){console.error(e);}
    setPostsLoading(false);
  }

  async function checkMembership(communityId) {
    if(!userKey)return;
    const data=await sbGet("community_members",`user_id=eq.${encodeURIComponent(userKey)}&community_id=eq.${communityId}`);
    setIsMember(prev=>({...prev,[communityId]:Array.isArray(data)&&data.length>0}));
  }

  async function joinCommunity(communityId) {
    if(!userKey)return;
    await sbInsert("community_members",{user_id:userKey,community_id:communityId});
    setIsMember(prev=>({...prev,[communityId]:true}));
    setMemberCounts(prev=>({...prev,[communityId]:(prev[communityId]||0)+1}));
  }

  async function submitPost() {
    if(!newPost.trim()||!activeCommunity||!userKey)return;
    setSubmitting(true);
    try {
      const data=await sbInsert("community_posts",{
        user_id:userKey,
        community_id:activeCommunity.id,
        content:newPost.trim(),
        mood_tag:selectedMood?`${selectedMood.emoji} ${selectedMood.label}`:null,
        is_prompt_response:isPromptMode,
        daily_prompt:isPromptMode?DAILY_PROMPTS[activeCommunity.slug]:null,
      });
      if(Array.isArray(data)&&data[0]) {
        setPosts(prev=>[{...data[0],users:{username:user?.username||user?.name||"Anonymous"}},...prev]);
      }
      setNewPost("");setSelectedMood(null);setIsPromptMode(false);
    } catch(e){console.error(e);}
    setSubmitting(false);
  }

  async function reactToPost(postId,emoji) {
    if(!userKey)return;
    const existing=myReactions[postId];
    if(existing===emoji){
      await sbDelete("post_reactions",`user_id=eq.${encodeURIComponent(userKey)}&post_id=eq.${postId}`);
      setMyReactions(prev=>{const n={...prev};delete n[postId];return n;});
      setReactions(prev=>{const n={...prev};if(n[postId]&&n[postId][emoji])n[postId][emoji]=Math.max(0,n[postId][emoji]-1);return n;});
    } else {
      if(existing)await sbDelete("post_reactions",`user_id=eq.${encodeURIComponent(userKey)}&post_id=eq.${postId}`);
      await sbInsert("post_reactions",{user_id:userKey,post_id:postId,emoji});
      setMyReactions(prev=>({...prev,[postId]:emoji}));
      setReactions(prev=>{
        const n={...prev,[postId]:{...(prev[postId]||{})}};
        if(existing)n[postId][existing]=Math.max(0,(n[postId][existing]||1)-1);
        n[postId][emoji]=(n[postId][emoji]||0)+1;
        return n;
      });
    }
  }

  function canAccess(community){return (TIER_ORDER[userTier]??0)>=(TIER_ORDER[community.min_tier]??0);}
  function timeAgo(d){
    const diff=Date.now()-new Date(d).getTime(),mins=Math.floor(diff/60000);
    if(mins<1)return"just now";
    if(mins<60)return`${mins}m ago`;
    const hrs=Math.floor(mins/60);
    if(hrs<24)return`${hrs}h ago`;
    return`${Math.floor(hrs/24)}d ago`;
  }

  if(view==="list"){
    const grouped={
      free:communities.filter(c=>c.min_tier==="free"),
      community:communities.filter(c=>c.min_tier==="community"),
      premium:communities.filter(c=>c.min_tier==="premium"),
    };
    return(
      <div style={S.container}>
        <div style={S.header}>
          <div style={S.headerEmoji}>🌿</div>
          <h2 style={S.headerTitle}>Communities</h2>
          <p style={S.headerSub}>Find your people. You don't have to grow alone.</p>
        </div>
        {loading ? (
          <div style={S.loading}>Loading your communities...</div>
        ) : (
          Object.entries(grouped).map(([tier,list])=>(
            <div key={tier} style={S.tierSection}>
              <div style={S.tierHeader}>
                <div style={{...S.tierPill,background:TIER_CONFIG[tier].bg,borderColor:TIER_CONFIG[tier].border,color:TIER_CONFIG[tier].color}}>
                  {tier==="free"?"✦ Free":tier==="community"?"💛 Community":"🔒 Off the Record"}
                </div>
              </div>
              <div style={S.tierGrid}>
                {list.map(community=>{
                  const accessible=canAccess(community);
                  const cfg=TIER_CONFIG[community.min_tier];
                  return(
                    <div key={community.id}
                      style={{...S.communityCard,opacity:accessible?1:0.55,cursor:accessible?"pointer":"default",borderColor:accessible?cfg.border:"rgba(200,180,160,0.15)"}}
                      onClick={()=>{if(accessible){setActiveCommunity(community);setView("community");}}}>
                      <div style={{...S.communityCardTop,background:accessible?cfg.bg:"rgba(200,180,160,0.06)"}}>
                        <span style={S.communityEmoji}>{community.emoji}</span>
                        {!accessible&&<div style={{...S.lockPill,background:cfg.bg,color:cfg.color,borderColor:cfg.border}}>🔒 {cfg.label}</div>}
                        {accessible&&memberCounts[community.id]>0&&<div style={S.memberPill}>👥 {memberCounts[community.id]}</div>}
                      </div>
                      <div style={S.communityCardBody}>
                        <div style={S.communityName}>{community.name}</div>
                        <div style={S.communityDesc}>{community.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        {userTierLevel<1&&(
          <div style={S.upgradeBanner} onClick={onUpgrade}>
            <div style={S.upgradeEmoji}>💛</div>
            <div style={S.upgradeTitle}>Unlock more communities</div>
            <div style={S.upgradeSub}>Healing & Growth, Morning Routines, Anxiety & Overthinking, and more — upgrade to Community or Off the Record.</div>
            <div style={S.upgradeBtn}>See Plans →</div>
          </div>
        )}
      </div>
    );
  }

  const prompt=DAILY_PROMPTS[activeCommunity?.slug];
  const hasAccess=activeCommunity&&canAccess(activeCommunity);
  const joined=isMember[activeCommunity?.id];
  const cfg=TIER_CONFIG[activeCommunity?.min_tier||"free"];

  return(
    <div style={S.container}>
      <div style={S.backBar}>
        <button style={S.backBtn} onClick={()=>{setView("list");setActiveCommunity(null);setPosts([]);}}>← Communities</button>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {!joined&&hasAccess&&<button style={{...S.joinBtn,background:cfg.color}} onClick={()=>joinCommunity(activeCommunity.id)}>+ Join</button>}
          {joined&&<div style={{...S.joinedBadge,color:cfg.color,borderColor:cfg.border,background:cfg.bg}}>✓ Member</div>}
        </div>
      </div>
      <div style={{...S.communityHero,background:`linear-gradient(135deg,${cfg.bg},rgba(253,246,236,0.5))`}}>
        <div style={S.heroEmoji}>{activeCommunity?.emoji}</div>
        <h2 style={S.heroTitle}>{activeCommunity?.name}</h2>
        <p style={S.heroDesc}>{activeCommunity?.description}</p>
      </div>
      {prompt&&(
        <div style={S.promptCard}>
          <div style={{...S.promptLabel,color:cfg.color}}>✦ Today's Prompt</div>
          <p style={S.promptText}>"{prompt}"</p>
          <button style={{...S.promptBtn,color:cfg.color,borderColor:cfg.color}} onClick={()=>{setIsPromptMode(true);setNewPost("");}}>Answer this →</button>
        </div>
      )}
      {hasAccess&&(
        <div style={S.composer}>
          {isPromptMode&&(
            <div style={S.promptModeTag}>
              ✦ Answering today's prompt
              <button style={S.clearBtn} onClick={()=>setIsPromptMode(false)}>✕</button>
            </div>
          )}
          <textarea style={S.textarea}
            placeholder={isPromptMode?"Share your thoughts here...":"What's on your heart today?"}
            value={newPost} onChange={e=>setNewPost(e.target.value)} rows={3}/>
          <div style={S.moodRow}>
            {MOOD_TAGS.map(mood=>(
              <button key={mood.label}
                style={{...S.moodTag,background:selectedMood?.label===mood.label?"rgba(200,137,90,0.15)":"transparent",borderColor:selectedMood?.label===mood.label?"#c8895a":"rgba(200,180,160,0.3)",color:selectedMood?.label===mood.label?"#7a4a1e":"#b08060"}}
                onClick={()=>setSelectedMood(selectedMood?.label===mood.label?null:mood)}>
                {mood.emoji} {mood.label}
              </button>
            ))}
          </div>
          <div style={S.composerFooter}>
            {selectedMood&&<span style={S.moodSelected}>{selectedMood.emoji} {selectedMood.label}</span>}
            <button
              style={{...S.postBtn,background:cfg.color,opacity:!newPost.trim()||submitting?0.5:1}}
              disabled={!newPost.trim()||submitting}
              onClick={submitPost}>
              {submitting?"Sharing...":"Share 🌿"}
            </button>
          </div>
        </div>
      )}
      {postsLoading?(
        <div style={S.loading}>Loading posts...</div>
      ):posts.length===0?(
        <div style={S.emptyState}>
          <div style={{fontSize:40,marginBottom:12}}>{activeCommunity?.emoji}</div>
          <p style={S.emptyText}>No posts yet — be the first to share something here.</p>
          <p style={{...S.emptyText,fontSize:12,marginTop:4,opacity:0.6}}>Your words might be exactly what someone needed to read. 🌿</p>
        </div>
      ):(
        <div style={{padding:"0 16px"}}>
          {posts.map(post=>(
            <div key={post.id} style={S.postCard}>
              {post.is_prompt_response&&(
                <div style={{...S.promptResponseTag,color:cfg.color,background:cfg.bg,borderColor:cfg.border}}>
                  ✦ Prompt response
                </div>
              )}
              <div style={S.postHeader}>
                <div style={{...S.avatar,background:`linear-gradient(135deg,${cfg.color}88,${cfg.color})`}}>
                  {(post.users?.username||post.users?.name||"?")[0].toUpperCase()}
                </div>
                <div style={{flex:1}}>
                  <div style={S.postAuthor}>{post.users?.username||post.users?.name||"Anonymous"}</div>
                  <div style={S.postTime}>{timeAgo(post.created_at)}</div>
                </div>
                {post.mood_tag&&<div style={S.postMood}>{post.mood_tag}</div>}
              </div>
              <p style={S.postContent}>{post.content}</p>
              <div style={S.reactionsRow}>
                {REACTIONS.map(emoji=>{
                  const count=reactions[post.id]?.[emoji]||0;
                  const isMine=myReactions[post.id]===emoji;
                  return(
                    <button key={emoji}
                      style={{...S.reactionBtn,background:isMine?"rgba(200,137,90,0.12)":"transparent",borderColor:isMine?"#c8895a":"rgba(200,180,160,0.3)",fontWeight:isMine?700:400}}
                      onClick={()=>reactToPost(post.id,emoji)}>
                      {emoji}{count>0&&<span style={S.reactionCount}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const S={
  container:{ fontFamily:"'Nunito',sans-serif", paddingBottom:20 },
  header:{ textAlign:"center", padding:"28px 24px 20px" },
  headerEmoji:{ fontSize:36, marginBottom:8 },
  headerTitle:{ fontFamily:"'Lora',serif", fontSize:28, fontWeight:600, color:"#5a2e0e", marginBottom:6 },
  headerSub:{ fontSize:14, color:"#b08060", fontStyle:"italic", fontFamily:"'Lora',serif", lineHeight:1.6 },
  loading:{ textAlign:"center", padding:"40px 20px", color:"#b08060", fontStyle:"italic", fontFamily:"'Lora',serif" },
  tierSection:{ marginBottom:4, padding:"0 16px" },
  tierHeader:{ marginBottom:10, marginTop:16 },
  tierPill:{ display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", padding:"4px 12px", borderRadius:20, border:"1px solid" },
  tierGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 },
  communityCard:{ background:"rgba(255,252,246,0.95)", borderRadius:18, border:"1px solid", overflow:"hidden", boxShadow:"0 2px 12px rgba(160,100,50,0.08)" },
  communityCardTop:{ padding:"16px 14px 10px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" },
  communityEmoji:{ fontSize:28 },
  lockPill:{ fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:10, border:"1px solid", letterSpacing:"0.3px", textTransform:"uppercase" },
  memberPill:{ fontSize:10, color:"#b08060", background:"rgba(200,137,90,0.08)", borderRadius:10, padding:"2px 8px" },
  communityCardBody:{ padding:"0 14px 14px" },
  communityName:{ fontFamily:"'Lora',serif", fontSize:14, fontWeight:600, color:"#5a2e0e", marginBottom:4, lineHeight:1.3 },
  communityDesc:{ fontSize:11, color:"#b08060", lineHeight:1.5 },
  upgradeBanner:{ margin:"20px 16px", background:"linear-gradient(135deg,rgba(200,137,90,0.1),rgba(155,126,184,0.07))", border:"1px solid rgba(200,137,90,0.25)", borderRadius:20, padding:"24px", textAlign:"center", cursor:"pointer" },
  upgradeEmoji:{ fontSize:32, marginBottom:8 },
  upgradeTitle:{ fontFamily:"'Lora',serif", fontSize:17, fontWeight:600, color:"#5a2e0e", marginBottom:6 },
  upgradeSub:{ fontSize:13, color:"#b08060", lineHeight:1.65, marginBottom:16, fontFamily:"'Lora',serif", fontStyle:"italic" },
  upgradeBtn:{ display:"inline-block", background:"linear-gradient(135deg,#d4956a,#c8895a)", color:"white", borderRadius:20, padding:"9px 24px", fontSize:13, fontWeight:700, cursor:"pointer" },
  backBar:{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid rgba(200,137,90,0.12)" },
  backBtn:{ background:"none", border:"none", fontSize:13, color:"#b08060", cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:600 },
  joinBtn:{ color:"white", border:"none", borderRadius:20, padding:"7px 16px", fontSize:12, cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700 },
  joinedBadge:{ fontSize:11, borderRadius:20, padding:"5px 12px", border:"1px solid", fontWeight:700, fontFamily:"'Nunito',sans-serif" },
  communityHero:{ padding:"24px 20px 20px", textAlign:"center", margin:"0 16px 16px", borderRadius:18, border:"1px solid rgba(200,137,90,0.12)" },
  heroEmoji:{ fontSize:44, marginBottom:8 },
  heroTitle:{ fontFamily:"'Lora',serif", fontSize:22, fontWeight:600, color:"#5a2e0e", marginBottom:6 },
  heroDesc:{ fontSize:13, color:"#b08060", fontStyle:"italic", fontFamily:"'Lora',serif", lineHeight:1.6 },
  promptCard:{ margin:"0 16px 14px", background:"rgba(255,252,246,0.95)", borderRadius:16, padding:"18px 20px", border:"1px solid rgba(200,137,90,0.15)", boxShadow:"0 2px 12px rgba(160,100,50,0.08)" },
  promptLabel:{ fontSize:10, letterSpacing:2, textTransform:"uppercase", fontWeight:700, marginBottom:10 },
  promptText:{ fontFamily:"'Lora',serif", fontStyle:"italic", fontSize:15, color:"#5a3a1a", lineHeight:1.7, marginBottom:14 },
  promptBtn:{ background:"transparent", border:"1px solid", borderRadius:20, padding:"7px 18px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Nunito',sans-serif" },
  composer:{ margin:"0 16px 14px", background:"rgba(255,252,246,0.97)", borderRadius:18, padding:"18px", boxShadow:"0 2px 16px rgba(160,100,50,0.1)", border:"1px solid rgba(200,137,90,0.15)" },
  promptModeTag:{ fontSize:11, color:"#c8895a", fontWeight:700, marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(200,137,90,0.07)", padding:"6px 10px", borderRadius:8 },
  clearBtn:{ background:"none", border:"none", fontSize:12, color:"#b08060", cursor:"pointer" },
  textarea:{ width:"100%", padding:"12px 14px", border:"1.5px solid rgba(200,137,90,0.2)", borderRadius:12, fontFamily:"'Lora',serif", fontSize:15, color:"#5a3a1a", resize:"none", outline:"none", lineHeight:1.7, marginBottom:12, background:"rgba(253,248,242,0.8)", boxSizing:"border-box", fontStyle:"italic" },
  moodRow:{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 },
  moodTag:{ border:"1px solid", borderRadius:20, padding:"5px 11px", fontSize:11, cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:600 },
  composerFooter:{ display:"flex", justifyContent:"space-between", alignItems:"center" },
  moodSelected:{ fontSize:12, color:"#c8895a", fontWeight:600, fontStyle:"italic" },
  postBtn:{ color:"white", border:"none", borderRadius:20, padding:"9px 24px", fontSize:13, cursor:"pointer", fontFamily:"'Nunito',sans-serif", fontWeight:700, marginLeft:"auto" },
  emptyState:{ textAlign:"center", padding:"48px 24px" },
  emptyText:{ fontFamily:"'Lora',serif", fontStyle:"italic", color:"#b08060", fontSize:15, lineHeight:1.7 },
  postCard:{ background:"rgba(255,252,246,0.95)", borderRadius:18, padding:"18px", marginBottom:10, border:"1px solid rgba(200,137,90,0.12)", boxShadow:"0 2px 10px rgba(160,100,50,0.07)" },
  promptResponseTag:{ fontSize:10, fontWeight:700, letterSpacing:"0.5px", textTransform:"uppercase", padding:"4px 10px", borderRadius:8, border:"1px solid", marginBottom:10, display:"inline-block" },
  postHeader:{ display:"flex", alignItems:"center", gap:10, marginBottom:12 },
  avatar:{ width:36, height:36, borderRadius:"50%", color:"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, flexShrink:0 },
  postAuthor:{ fontSize:13, fontWeight:700, color:"#5a2e0e", fontFamily:"'Nunito',sans-serif" },
  postTime:{ fontSize:11, color:"#b08060", marginTop:1 },
  postMood:{ marginLeft:"auto", fontSize:11, color:"#9a7050", background:"rgba(200,137,90,0.08)", border:"1px solid rgba(200,137,90,0.2)", borderRadius:12, padding:"3px 10px", flexShrink:0, fontWeight:600 },
  postContent:{ fontFamily:"'Lora',serif", fontSize:15, color:"#5a3a1a", lineHeight:1.8, marginBottom:14, fontStyle:"italic" },
  reactionsRow:{ display:"flex", gap:6, flexWrap:"wrap" },
  reactionBtn:{ border:"1px solid", borderRadius:20, padding:"5px 11px", fontSize:13, cursor:"pointer", fontFamily:"'Nunito',sans-serif", display:"flex", alignItems:"center", gap:4 },
  reactionCount:{ fontSize:11, color:"#c8895a", fontWeight:700 },
};
