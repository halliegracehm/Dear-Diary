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
const TIER_LABELS = { free:{label:"Free",color:"#7a9e7e"}, community:{label:"Community",color:"#c9857a"}, premium:{label:"Off the Record",color:"#c9a96e"} };
const MOOD_TAGS = [{emoji:"🌸",label:"Blooming"},{emoji:"🌱",label:"Growing"},{emoji:"☁️",label:"Cloudy"},{emoji:"🔥",label:"Fired Up"},{emoji:"🌊",label:"Overwhelmed"},{emoji:"✨",label:"Grateful"},{emoji:"💪",label:"Strong"},{emoji:"🌙",label:"Tired"},{emoji:"😂",label:"Joyful"},{emoji:"🙏",label:"At Peace"}];
const REACTIONS = ["❤️","🙌","✨","🫂","💛","🌿"];
const DAILY_PROMPTS = {"daily-checkin":"How are you showing up today? What's on your heart right now?","gratitude":"Name three things — big or small — that you're grateful for today.","big-wins":"What's a win you had recently that you haven't celebrated yet?","healing":"What's one thing you're releasing this week?","morning":"What does your ideal morning look like? What did you do today?","anxiety":"What's something that's been living in your head rent-free? Let it out here.","manifesting":"Write it like it's already happened. What are you calling in?","motherhood":"What's a moment with your kid(s) recently that made your heart full?","single":"What's something you love about your life right now, just as it is?","career":"What are you building? What step are you taking this week?"};

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
              if(r.user_id===user?.id)mrm[r.post_id]=r.emoji;
            });
            setReactions(rm);setMyReactions(mrm);
          }
        }
      }
    } catch(e){console.error(e);}
    setPostsLoading(false);
  }

  async function checkMembership(communityId) {
    if(!user?.id)return;
    const data=await sbGet("community_members",`user_id=eq.${user.id}&community_id=eq.${communityId}`);
    setIsMember(prev=>({...prev,[communityId]:Array.isArray(data)&&data.length>0}));
  }

  async function joinCommunity(communityId) {
    if(!user?.id)return;
    await sbInsert("community_members",{user_id:user.id,community_id:communityId});
    setIsMember(prev=>({...prev,[communityId]:true}));
    setMemberCounts(prev=>({...prev,[communityId]:(prev[communityId]||0)+1}));
  }

  async function submitPost() {
    if(!newPost.trim()||!activeCommunity||!user?.id)return;
    setSubmitting(true);
    try {
      const data=await sbInsert("community_posts",{user_id:user.id,community_id:activeCommunity.id,content:newPost.trim(),mood_tag:selectedMood?`${selectedMood.emoji} ${selectedMood.label}`:null,is_prompt_response:isPromptMode,daily_prompt:isPromptMode?DAILY_PROMPTS[activeCommunity.slug]:null});
      if(Array.isArray(data)&&data[0]) setPosts(prev=>[{...data[0],users:{username:user.username}},...prev]);
      setNewPost("");setSelectedMood(null);setIsPromptMode(false);
    } catch(e){console.error(e);}
    setSubmitting(false);
  }

  async function reactToPost(postId,emoji) {
    if(!user?.id)return;
    const existing=myReactions[postId];
    if(existing===emoji){
      await sbDelete("post_reactions",`user_id=eq.${user.id}&post_id=eq.${postId}`);
      setMyReactions(prev=>{const n={...prev};delete n[postId];return n;});
      setReactions(prev=>{const n={...prev};if(n[postId]?.[emoji])n[postId][emoji]=Math.max(0,n[postId][emoji]-1);return n;});
    } else {
      if(existing)await sbDelete("post_reactions",`user_id=eq.${user.id}&post_id=eq.${postId}`);
      await sbInsert("post_reactions",{user_id:user.id,post_id:postId,emoji});
      setMyReactions(prev=>({...prev,[postId]:emoji}));
      setReactions(prev=>{const n={...prev,[postId]:{...(prev[postId]||{})}};if(existing)n[postId][existing]=Math.max(0,(n[postId][existing]||1)-1);n[postId][emoji]=(n[postId][emoji]||0)+1;return n;});
    }
  }

  function canAccess(community){return (TIER_ORDER[userTier]??0)>=(TIER_ORDER[community.min_tier]??0);}
  function timeAgo(d){const diff=Date.now()-new Date(d).getTime(),mins=Math.floor(diff/60000);if(mins<1)return"just now";if(mins<60)return`${mins}m ago`;const hrs=Math.floor(mins/60);if(hrs<24)return`${hrs}h ago`;return`${Math.floor(hrs/24)}d ago`;}

  if(view==="list"){
    const grouped={free:communities.filter(c=>c.min_tier==="free"),community:communities.filter(c=>c.min_tier==="community"),premium:communities.filter(c=>c.min_tier==="premium")};
    return(
      <div style={S.container}>
        <div style={S.header}><h2 style={S.headerTitle}>Communities 🌿</h2><p style={S.headerSub}>Find your people. Share your story. Grow together.</p></div>
        {loading?<div style={S.loading}>Loading communities...</div>:Object.entries(grouped).map(([tier,list])=>(
          <div key={tier} style={S.tierSection}>
            <div style={S.tierLabel}><span style={{...S.tierDot,background:TIER_LABELS[tier].color}}/>{TIER_LABELS[tier].label}</div>
            {list.map(community=>{
              const accessible=canAccess(community);
              return(
                <div key={community.id} style={{...S.communityCard,opacity:accessible?1:0.6,cursor:accessible?"pointer":"default"}} onClick={()=>{if(accessible){setActiveCommunity(community);setView("community");}}}>
                  <div style={S.communityEmoji}>{community.emoji}</div>
                  <div style={S.communityInfo}>
                    <div style={S.communityName}>{community.name}</div>
                    <div style={S.communityDesc}>{community.description}</div>
                    <div style={S.communityMeta}>👥 {memberCounts[community.id]||0} members</div>
                  </div>
                  {!accessible?<div style={{...S.lockBadge,background:TIER_LABELS[community.min_tier].color+"22",color:TIER_LABELS[community.min_tier].color,borderColor:TIER_LABELS[community.min_tier].color+"44"}}>🔒 {TIER_LABELS[community.min_tier].label}</div>:<div style={S.arrowIcon}>→</div>}
                </div>
              );
            })}
          </div>
        ))}
        {userTierLevel<2&&<div style={{...S.upgradeBanner,cursor:"pointer"}} onClick={onUpgrade}><div style={S.upgradeBannerText}>✨ Unlock all 10 communities</div><div style={S.upgradeBannerSub}>Upgrade to Community or Off the Record →</div></div>}
      </div>
    );
  }

  const prompt=DAILY_PROMPTS[activeCommunity?.slug];
  const hasAccess=activeCommunity&&canAccess(activeCommunity);
  const joined=isMember[activeCommunity?.id];

  return(
    <div style={S.container}>
      <div style={S.backRow}>
        <button style={S.backBtn} onClick={()=>{setView("list");setActiveCommunity(null);setPosts([]);}}>← Back</button>
        <div style={S.communityTitle}>{activeCommunity?.emoji} {activeCommunity?.name}</div>
        {!joined&&hasAccess&&<button style={S.joinBtn} onClick={()=>joinCommunity(activeCommunity.id)}>+ Join</button>}
        {joined&&<div style={S.joinedBadge}>✓ Joined</div>}
      </div>
      {prompt&&(
        <div style={S.promptCard}>
          <div style={S.promptLabel}>✦ Today's Prompt</div>
          <div style={S.promptText}>"{prompt}"</div>
          <button style={S.promptBtn} onClick={()=>{setIsPromptMode(true);setNewPost("");}}>Answer this prompt</button>
        </div>
      )}
      {hasAccess&&(
        <div style={S.composer}>
          {isPromptMode&&<div style={S.promptModeTag}>Answering: <em>"{prompt?.substring(0,50)}..."</em><button style={S.clearPromptBtn} onClick={()=>setIsPromptMode(false)}>✕</button></div>}
          <textarea style={S.composerInput} placeholder={isPromptMode?"Share your answer...":"What's on your heart today?"} value={newPost} onChange={e=>setNewPost(e.target.value)} rows={3}/>
          <div style={S.moodRow}>{MOOD_TAGS.map(mood=><button key={mood.label} style={{...S.moodTag,background:selectedMood?.label===mood.label?"#7a9e7e22":"transparent",borderColor:selectedMood?.label===mood.label?"#7a9e7e":"#e0d8cc",color:selectedMood?.label===mood.label?"#4a7050":"#9a8878"}} onClick={()=>setSelectedMood(selectedMood?.label===mood.label?null:mood)}>{mood.emoji} {mood.label}</button>)}</div>
          <div style={S.composerFooter}>
            {selectedMood&&<span style={S.selectedMoodDisplay}>{selectedMood.emoji} {selectedMood.label}</span>}
            <button style={{...S.postBtn,opacity:!newPost.trim()||submitting?0.5:1}} disabled={!newPost.trim()||submitting} onClick={submitPost}>{submitting?"Sharing...":"Share 🌿"}</button>
          </div>
        </div>
      )}
      {postsLoading?<div style={S.loading}>Loading posts...</div>:posts.length===0?<div style={S.emptyPosts}><div style={{fontSize:36,marginBottom:12}}>{activeCommunity?.emoji}</div><div style={S.emptyPostsText}>Be the first to share something here.<br/>This community is waiting for you. 🌿</div></div>:posts.map(post=>(
        <div key={post.id} style={S.postCard}>
          {post.is_prompt_response&&<div style={S.postPromptTag}>✦ {post.daily_prompt?.substring(0,60)}...</div>}
          <div style={S.postHeader}>
            <div style={S.postAvatar}>{post.users?.username?.[0]?.toUpperCase()||"?"}</div>
            <div><div style={S.postAuthor}>{post.users?.username||"Anonymous"}</div><div style={S.postTime}>{timeAgo(post.created_at)}</div></div>
            {post.mood_tag&&<div style={S.postMoodTag}>{post.mood_tag}</div>}
          </div>
          <div style={S.postContent}>{post.content}</div>
          <div style={S.reactionsRow}>{REACTIONS.map(emoji=>{const count=reactions[post.id]?.[emoji]||0;const isMine=myReactions[post.id]===emoji;return<button key={emoji} style={{...S.reactionBtn,background:isMine?"#7a9e7e22":"transparent",borderColor:isMine?"#7a9e7e":"#e8e0d4",fontWeight:isMine?"600":"400"}} onClick={()=>reactToPost(post.id,emoji)}>{emoji}{count>0&&<span style={S.reactionCount}>{count}</span>}</button>;})}</div>
        </div>
      ))}
    </div>
  );
}

const S={
  container:{padding:"0 0 80px",maxWidth:480,margin:"0 auto",fontFamily:"'Nunito',sans-serif"},
  header:{padding:"20px 20px 12px"},
  headerTitle:{fontFamily:"'Lora',serif",fontSize:26,fontWeight:400,color:"#3a3028",marginBottom:4},
  headerSub:{fontSize:13,color:"#9a8878",fontStyle:"italic",fontFamily:"'Lora',serif"},
  loading:{textAlign:"center",padding:"40px 20px",color:"#9a8878",fontStyle:"italic",fontFamily:"'Lora',serif"},
  tierSection:{marginBottom:8,padding:"0 16px"},
  tierLabel:{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#b0a090",marginBottom:8,marginTop:16,display:"flex",alignItems:"center",gap:6},
  tierDot:{width:8,height:8,borderRadius:"50%",display:"inline-block"},
  communityCard:{background:"white",borderRadius:16,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:14,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f0ece4"},
  communityEmoji:{fontSize:32,flexShrink:0},
  communityInfo:{flex:1},
  communityName:{fontFamily:"'Lora',serif",fontSize:16,color:"#3a3028",marginBottom:2},
  communityDesc:{fontSize:12,color:"#9a8878",lineHeight:1.4,marginBottom:4},
  communityMeta:{fontSize:11,color:"#b0a090"},
  lockBadge:{fontSize:11,borderRadius:12,padding:"4px 10px",border:"1px solid",flexShrink:0,letterSpacing:0.3},
  arrowIcon:{fontSize:18,color:"#c8b896",flexShrink:0},
  upgradeBanner:{margin:"20px 16px",background:"linear-gradient(135deg,#f5f0e8 0%,#fdf6e8 100%)",border:"1px solid #e8d4a8",borderRadius:16,padding:"16px 20px",textAlign:"center"},
  upgradeBannerText:{fontFamily:"'Lora',serif",fontSize:15,color:"#7a5a2a",marginBottom:4},
  upgradeBannerSub:{fontSize:12,color:"#a08060"},
  backRow:{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderBottom:"1px solid #f0ece4"},
  backBtn:{background:"none",border:"none",fontSize:14,color:"#9a8878",cursor:"pointer",padding:"4px 0",fontFamily:"'Nunito',sans-serif"},
  communityTitle:{flex:1,fontFamily:"'Lora',serif",fontSize:17,color:"#3a3028"},
  joinBtn:{background:"#7a9e7e",color:"white",border:"none",borderRadius:20,padding:"6px 14px",fontSize:12,cursor:"pointer",fontFamily:"'Nunito',sans-serif"},
  joinedBadge:{fontSize:11,color:"#7a9e7e",border:"1px solid #b8d4b0",borderRadius:20,padding:"4px 10px",background:"#f0f8f0"},
  promptCard:{margin:"12px 16px",background:"linear-gradient(135deg,#f5f8f0 0%,#fdfaf5 100%)",border:"1px solid #d0e0c8",borderRadius:16,padding:"16px 18px"},
  promptLabel:{fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#7a9e7e",marginBottom:8},
  promptText:{fontFamily:"'Lora',serif",fontStyle:"italic",fontSize:15,color:"#3a3028",lineHeight:1.6,marginBottom:12},
  promptBtn:{background:"transparent",border:"1px solid #7a9e7e",borderRadius:20,padding:"7px 16px",fontSize:12,color:"#4a7050",cursor:"pointer",fontFamily:"'Nunito',sans-serif"},
  composer:{margin:"8px 16px 12px",background:"white",borderRadius:16,padding:"16px",boxShadow:"0 2px 12px rgba(0,0,0,0.06)",border:"1px solid #f0ece4"},
  promptModeTag:{fontSize:11,color:"#7a9e7e",fontStyle:"italic",marginBottom:8,display:"flex",alignItems:"center",gap:8},
  clearPromptBtn:{background:"none",border:"none",fontSize:12,color:"#b0a090",cursor:"pointer",marginLeft:"auto"},
  composerInput:{width:"100%",padding:"12px 14px",border:"1.5px solid #e8e0d4",borderRadius:12,fontFamily:"'Lora',serif",fontSize:15,color:"#3a3028",resize:"none",outline:"none",lineHeight:1.6,marginBottom:10,boxSizing:"border-box"},
  moodRow:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12},
  moodTag:{border:"1px solid",borderRadius:20,padding:"5px 10px",fontSize:11,cursor:"pointer",fontFamily:"'Nunito',sans-serif"},
  composerFooter:{display:"flex",justifyContent:"space-between",alignItems:"center"},
  selectedMoodDisplay:{fontSize:12,color:"#7a9e7e",fontStyle:"italic"},
  postBtn:{background:"#7a9e7e",color:"white",border:"none",borderRadius:20,padding:"9px 22px",fontSize:13,cursor:"pointer",fontFamily:"'Nunito',sans-serif",marginLeft:"auto"},
  emptyPosts:{textAlign:"center",padding:"40px 20px"},
  emptyPostsText:{fontFamily:"'Lora',serif",fontStyle:"italic",color:"#9a8878",fontSize:15,lineHeight:1.7},
  postCard:{margin:"0 16px 10px",background:"white",borderRadius:16,padding:"16px",boxShadow:"0 2px 10px rgba(0,0,0,0.05)",border:"1px solid #f0ece4"},
  postPromptTag:{fontSize:11,color:"#7a9e7e",fontStyle:"italic",marginBottom:10,padding:"6px 10px",background:"#f0f8f0",borderRadius:8,lineHeight:1.4},
  postHeader:{display:"flex",alignItems:"center",gap:10,marginBottom:10},
  postAvatar:{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#7a9e7e 0%,#a8c887 100%)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:600,flexShrink:0},
  postAuthor:{fontSize:13,fontWeight:500,color:"#3a3028",fontFamily:"'Nunito',sans-serif"},
  postTime:{fontSize:11,color:"#b0a090"},
  postMoodTag:{marginLeft:"auto",fontSize:11,color:"#9a8878",background:"#faf7f2",border:"1px solid #e8e0d4",borderRadius:12,padding:"3px 8px",flexShrink:0},
  postContent:{fontFamily:"'Lora',serif",fontSize:15,color:"#3a3028",lineHeight:1.7,marginBottom:14},
  reactionsRow:{display:"flex",gap:6,flexWrap:"wrap"},
  reactionBtn:{border:"1px solid",borderRadius:20,padding:"5px 10px",fontSize:14,cursor:"pointer",fontFamily:"'Nunito',sans-serif",display:"flex",alignItems:"center",gap:4},
  reactionCount:{fontSize:11,color:"#7a9e7e",fontWeight:600},
};
