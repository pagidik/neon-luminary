import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";

/* ── Design Tokens ─────────────────────────────────────────── */
const C = {
  surface:      "#0e0e0f",
  surfaceCtr:   "#19191b",
  surfaceLow:   "#131314",
  surfaceHigh:  "#201f21",
  surfaceTop:   "#262627",
  surfaceBrt:   "#2c2c2d",
  primary:      "#97a9ff",
  secondary:    "#c180ff",
  tertiary:     "#a0ffc4",
  onSurface:    "#ffffff",
  onVariant:    "#adaaab",
  outlineFaint: "rgba(72,72,73,0.15)",
  primaryGlow:  "rgba(151,169,255,0.08)",
  tertiaryGlow: "rgba(160,255,196,0.08)",
  shadow:       "0 0 15px rgba(151,169,255,0.05)",
};

const CATS = ["LLMs","Tools","Startups","Research","Coding AI","Business"];
const WL   = { S:30, M:60, L:9999 };

const trunc = (text, n) => {
  const w = text.split(" ");
  return w.length <= n ? text : w.slice(0, n).join(" ") + "…";
};
const getSummary = (item, mode, len) => {
  const lim = WL[len];
  const text = mode === "ELI5" ? (item.eli5 || item.summary)
             : mode === "Business" ? (item.business || item.summary)
             : item.summary;
  return trunc(text, lim);
};
const catColor = (cat) => ({
  LLMs: C.primary, Tools: C.tertiary, Startups: "#ff9070",
  Research: C.tertiary, "Coding AI": C.secondary, Business: "#7dd3fc",
}[cat] || C.primary);

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString([], { month:"short", day:"numeric" }) + " · " + d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
};

/* ── Persistence helpers ────────────────────────────────────── */
const load = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try { const v = localStorage.getItem("nl_" + key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const save = (key, val) => {
  try { localStorage.setItem("nl_" + key, JSON.stringify(val)); } catch {}
};

/* ── Main App ──────────────────────────────────────────────── */
export default function NeonLuminary() {
  const [news,       setNews]      = useState([]);
  const [updatedAt,  setUpdatedAt] = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [rawPage,    setRawPage]   = useState(0);
  const [tab,        setTab]       = useState("feed");
  const [sumLen,     setSumLen]    = useState("M");
  const [aiMode,     setAiMode]    = useState("Technical");
  const [bookmarks,  setBookmarks] = useState([]);
  const [reactions,  setReactions] = useState({});
  const [interests,  setInterests] = useState(["LLMs","Tools","Coding AI"]);
  const [searchQ,    setSearchQ]   = useState("");
  const [filterCat,  setFilterCat] = useState("All");
  const [toast,      setToast]     = useState(null);
  const [slideDir,   setSlideDir]  = useState("r");
  const [slideKey,   setSlideKey]  = useState(0);
  const [audioOn,    setAudioOn]   = useState(false);
  const [hydrated,   setHydrated]  = useState(false);

  /* Restore persisted state on mount */
  useEffect(() => {
    setSumLen(load("sumLen", "M"));
    setAiMode(load("aiMode", "Technical"));
    setBookmarks(load("bookmarks", []));
    setReactions(load("reactions", {}));
    setInterests(load("interests", ["LLMs","Tools","Coding AI"]));
    setHydrated(true);
  }, []);

  /* Persist on change (skip initial hydration) */
  useEffect(() => { if (hydrated) save("sumLen", sumLen); }, [sumLen, hydrated]);
  useEffect(() => { if (hydrated) save("aiMode", aiMode); }, [aiMode, hydrated]);
  useEffect(() => { if (hydrated) save("bookmarks", bookmarks); }, [bookmarks, hydrated]);
  useEffect(() => { if (hydrated) save("reactions", reactions); }, [reactions, hydrated]);
  useEffect(() => { if (hydrated) save("interests", interests); }, [interests, hydrated]);

  /* Load static JSON on mount */
  useEffect(() => {
    fetch("/news-data.json")
      .then(r => r.json())
      .then(data => {
        setNews(data.stories || []);
        setUpdatedAt(data.updatedAt || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  /* Derived */
  const feed        = interests.length ? news.filter(n => interests.includes(n.cat)) : news;
  const displayNews = feed.length ? feed : news;
  const page        = Math.min(rawPage, Math.max(0, displayNews.length - 1));
  const item        = displayNews[page] ?? displayNews[0];

  const searchResults = news.filter(n => {
    const q  = searchQ.toLowerCase();
    const mq = !q || n.title.toLowerCase().includes(q) || n.cat.toLowerCase().includes(q) || n.src.toLowerCase().includes(q);
    const mc = filterCat === "All" || n.cat === filterCat;
    return mq && mc;
  });

  const getCnt = (id, type) => {
    const base = { like:(id*37+12), fire:(id*19+5) };
    return base[type] + (reactions[id]===type ? 1 : 0);
  };

  const trending = [...news].sort((a,b) => {
    const sa = getCnt(a.id,"like") + getCnt(a.id,"fire")*1.5;
    const sb = getCnt(b.id,"like") + getCnt(b.id,"fire")*1.5;
    return sb - sa;
  });
  const toolList = news.filter(n => n.tool);
  const related  = displayNews.filter((_,i) => i !== page).slice(0,3);

  /* Refs */
  const toastTimer = useRef(null);
  const dragRef    = useRef({ x:null, active:false });

  const toast$ = useCallback((msg, icon="✦") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, icon });
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }, []);

  /* Navigation */
  const goPage = (dir) => {
    const next = page + dir;
    if (next < 0 || next >= displayNews.length) return;
    setSlideDir(dir > 0 ? "r" : "l");
    setSlideKey(k => k+1);
    setRawPage(next);
  };
  const jumpPage = (i) => {
    setSlideDir(i > page ? "r" : "l");
    setSlideKey(k => k+1);
    setRawPage(i);
  };
  const jumpToStory = (id) => {
    const i = displayNews.findIndex(n => n.id === id);
    setRawPage(Math.max(0, i));
    setSlideKey(k => k+1);
    setTab("feed");
  };

  /* Swipe */
  const onTS = e => { dragRef.current = { x:e.touches[0].clientX, active:true }; };
  const onTE = e => {
    if (!dragRef.current.active) return;
    const dx = e.changedTouches[0].clientX - dragRef.current.x;
    if (Math.abs(dx) > 40) goPage(dx < 0 ? 1 : -1);
    dragRef.current.active = false;
  };
  const onMD = e => { dragRef.current = { x:e.clientX, active:true }; };
  const onMU = e => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    if (Math.abs(dx) > 40) goPage(dx < 0 ? 1 : -1);
    dragRef.current.active = false;
  };

  const toggleBkm = (id) => {
    const has = bookmarks.includes(id);
    setBookmarks(b => has ? b.filter(x=>x!==id) : [...b, id]);
    toast$(has ? "Bookmark removed" : "Saved", "◇");
  };
  const toggleRx = (id, type) =>
    setReactions(r => ({ ...r, [id]: r[id]===type ? null : type }));

  const audioRef = useRef(null);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setAudioOn(false);
  };

  const playAudio = async (it) => {
    if (audioOn) { stopAudio(); return; }
    setAudioOn(true);
    toast$("Generating audio…", "◎");

    try {
      const resp = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: it.title,
          summary: getSummary(it, aiMode, "L"),
          whyItMatters: it.whyItMatters,
        }),
      });
      if (!resp.ok) throw new Error("api");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { stopAudio(); URL.revokeObjectURL(url); };
      audio.onerror = () => { stopAudio(); URL.revokeObjectURL(url); };
      audio.play();
      toast$("Playing briefing…", "▶");
    } catch {
      setAudioOn(false);
      toast$("Audio unavailable", "✕");
    }
  };

  const share = (it) => {
    const t = `${it.title}\n\n${getSummary(it,aiMode,sumLen)}\n\n${it.url}`;
    if (navigator.share) navigator.share({ title:it.title, text:t, url:it.url }).catch(()=>{});
    else navigator.clipboard.writeText(t).then(() => toast$("Copied", "◎"));
  };

  const TABS = [
    { id:"feed",     icon:"⌂",  label:"Home"   },
    { id:"hot",      icon:"↑",  label:"Trends" },
    { id:"search",   icon:"○",  label:"Search" },
    { id:"saved",    icon:"◇",  label:"Saved"  },
    { id:"settings", icon:"◈",  label:"Profile"},
  ];
  const tabIdx = TABS.findIndex(t => t.id === tab);

  /* ── Styles ── */
  const S = {
    app: { minHeight:"100dvh", background:C.surface, color:C.onSurface, display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative" },
    hdr: { position:"sticky", top:0, zIndex:50, height:56, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", background:"rgba(14,14,15,0.85)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${C.outlineFaint}`, boxShadow:C.shadow },
    logo: { fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, letterSpacing:"-.5px", color:C.primary, textTransform:"uppercase", display:"flex", alignItems:"center", gap:8 },
    hdrR: { display:"flex", alignItems:"center", gap:10 },
    freshBadge: { display:"flex", alignItems:"center", gap:5, background:"rgba(160,255,196,.1)", border:"1px solid rgba(160,255,196,.2)", borderRadius:100, padding:"3px 10px", fontFamily:"'Space Grotesk',sans-serif", fontSize:8, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.tertiary },
    freshDot: { width:6, height:6, borderRadius:"50%", background:C.tertiary, animation:"pulseGlow 1.4s ease infinite" },
    cardShell: { background:C.surfaceCtr, borderRadius:16, overflow:"hidden", border:`1px solid ${C.outlineFaint}`, boxShadow:"0 4px 24px rgba(0,0,0,0.4)", margin:"14px 14px 0" },
    hero: { height:220, position:"relative", overflow:"hidden", background:C.surfaceHigh, display:"flex", alignItems:"center", justifyContent:"center" },
    heroEmoji: { fontSize:110, opacity:.18, filter:"grayscale(1)" },
    heroFade: { position:"absolute", inset:0, background:`linear-gradient(to top,${C.surfaceCtr} 0%,rgba(14,14,15,0.5) 50%,transparent 100%)` },
    heroBottom: { position:"absolute", bottom:0, left:0, right:0, padding:16 },
    featBadge: { display:"inline-flex", alignItems:"center", gap:6, background:"rgba(160,255,196,0.12)", border:"1px solid rgba(160,255,196,0.15)", backdropFilter:"blur(8px)", borderRadius:100, padding:"3px 10px", fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", color:C.tertiary, marginBottom:10 },
    featDot: { width:6, height:6, borderRadius:"50%", background:C.tertiary, animation:"pulseGlow 1.8s ease infinite" },
    heroTitle: { fontFamily:"'Space Grotesk',sans-serif", fontSize:21, fontWeight:700, letterSpacing:"-.5px", lineHeight:1.2, color:C.onSurface },
    cardBody: { padding:"18px 18px 20px" },
    why: { background:C.tertiaryGlow, borderRadius:12, borderLeft:`2px solid rgba(160,255,196,0.5)`, padding:"14px 16px", marginBottom:18 },
    whyLbl: { fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.tertiary, marginBottom:8, display:"flex", alignItems:"center", gap:6 },
    whyText: { fontSize:13, fontWeight:500, color:C.onSurface, lineHeight:1.55 },
    metaRow: { display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${C.outlineFaint}`, paddingBottom:14, marginBottom:18 },
    smlWrap: { display:"flex", background:C.surfaceTop, borderRadius:100, padding:3, gap:2 },
    modeRow: { display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" },
    actRow:  { display:"flex", alignItems:"center", gap:8, marginBottom:16 },
    tags:    { display:"flex", gap:6, flexWrap:"wrap", marginBottom:16 },
    dots:    { position:"absolute", bottom:12, left:0, right:0, display:"flex", justifyContent:"center", gap:5, pointerEvents:"none" },
    nav:     { height:68, display:"flex", alignItems:"center", justifyContent:"space-around", background:"rgba(14,14,15,0.9)", backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderTop:`1px solid ${C.outlineFaint}`, flexShrink:0, paddingBottom:4, position:"relative" },
    navInd:  { position:"absolute", bottom:0, height:2, width:24, background:`linear-gradient(90deg,${C.primary},${C.secondary})`, borderRadius:2, transition:"left .3s cubic-bezier(.22,.68,0,1.2)" },
    secHdr:  { fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:"rgba(173,170,171,.6)", display:"flex", alignItems:"center", gap:10, padding:"0 14px", marginBottom:12 },
    secLine: { flex:1, height:1, background:C.outlineFaint },
    toast:   { position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 28px)", maxWidth:452, background:C.surfaceBrt, backdropFilter:"blur(20px)", borderRadius:12, border:`1px solid ${C.outlineFaint}`, padding:"13px 16px", display:"flex", alignItems:"center", gap:10, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", zIndex:9999, animation:"toastIn .22s ease both" },
  };

  /* ── btn helpers ── */
  const SmlBtn = ({s}) => (
    <button onClick={()=>setSumLen(s)} style={{ width:26, height:26, borderRadius:100, fontFamily:"'Space Grotesk',sans-serif", fontSize:10, fontWeight:700, cursor:"pointer", border:"none", background: sumLen===s ? C.primary : "transparent", color: sumLen===s ? "#000e3a" : C.onVariant, transition:"all .18s", display:"flex", alignItems:"center", justifyContent:"center" }}>{s}</button>
  );
  const ModeBtn = ({m}) => (
    <button onClick={()=>setAiMode(m)} style={{ padding:"5px 12px", borderRadius:100, border:`1px solid ${aiMode===m ? "rgba(151,169,255,0.4)" : C.outlineFaint}`, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", color: aiMode===m ? C.primary : C.onVariant, cursor:"pointer", background: aiMode===m ? "rgba(151,169,255,0.15)" : "none", transition:"all .18s" }}>{m}</button>
  );
  const RxBtn = ({id, type, emoji}) => {
    const on = reactions[id]===type;
    return (
      <button onClick={()=>toggleRx(id,type)} style={{ display:"flex", alignItems:"center", gap:6, background: on ? (type==="like"?"rgba(151,169,255,0.18)":"rgba(255,120,80,0.15)") : C.surfaceHigh, border:`1px solid ${on ? (type==="like"?"rgba(151,169,255,0.4)":"rgba(255,120,80,0.35)") : C.outlineFaint}`, borderRadius:100, padding:"7px 14px", fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, color: on ? (type==="like"?C.primary:"#ff9070") : C.onVariant, cursor:"pointer", transition:"all .18s" }}>
        {emoji} <span style={{ fontFamily:"monospace", fontSize:10 }}>{getCnt(id,type)}</span>
      </button>
    );
  };
  const IcoBtn = ({ico, on, onClick}) => (
    <button onClick={onClick} style={{ width:36, height:36, background: on?"rgba(151,169,255,0.18)":C.surfaceHigh, border:`1px solid ${on?"rgba(151,169,255,0.4)":C.outlineFaint}`, borderRadius:100, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14, color: on?C.primary:C.onVariant, transition:"all .18s", flexShrink:0 }}>{ico}</button>
  );
  const Tag = ({t}) => {
    const styles = { Free:{ bg:"rgba(160,255,196,.12)", color:C.tertiary, b:"rgba(160,255,196,.2)" }, Paid:{ bg:"rgba(255,160,90,.1)", color:"#ffb07a", b:"rgba(255,160,90,.2)" }, "Open-source":{ bg:"rgba(193,128,255,.12)", color:C.secondary, b:"rgba(193,128,255,.2)" }, Tool:{ bg:"rgba(151,169,255,.1)", color:C.primary, b:"rgba(151,169,255,.2)" } };
    const s = styles[t] || styles.Tool;
    return <span style={{ padding:"3px 10px", borderRadius:100, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", background:s.bg, color:s.color, border:`1px solid ${s.b}` }}>{t}</span>;
  };
  const NavBtn = ({t}) => (
    <button onClick={()=>setTab(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"6px 14px", background:"none", border:"none", transition:"opacity .18s" }}>
      <span style={{ fontSize:20, color: tab===t.id ? C.primary : C.onVariant, transition:"transform .2s", transform: tab===t.id?"translateY(-2px)":"none" }}>{t.icon}</span>
      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:8, fontWeight:700, letterSpacing:1, textTransform:"uppercase", color: tab===t.id ? C.primary : C.onVariant }}>{t.label}</span>
    </button>
  );

  /* Loading skeleton */
  if (loading) return (
    <div style={{ minHeight:"100dvh", background:C.surface, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ width:40, height:40, border:`3px solid rgba(151,169,255,0.15)`, borderTopColor:C.primary, borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.onVariant }}>Loading briefing…</span>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  /* ── Render ── */
  return (
    <>
      <Head>
        <title>Neon Luminary | AI Briefing</title>
        <meta name="description" content="Daily curated AI news, tools, and research briefings — updated every 24 hours." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0e0e0f" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translacent" />
        <meta property="og:title" content="Neon Luminary | AI Briefing" />
        <meta property="og:description" content="Daily curated AI news — updated every 24 hours." />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={S.app}>
        {/* Header */}
        <header style={S.hdr}>
          <div style={S.logo}>◈ Neon Luminary</div>
          <div style={S.hdrR}>
            {updatedAt && (
              <div style={S.freshBadge}>
                <span style={S.freshDot} />
                {fmtDate(updatedAt)}
              </div>
            )}
            <button onClick={()=>setTab("settings")} style={{ width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", background:"none", border:"none", color:C.primary, cursor:"pointer", fontSize:18, borderRadius:8 }}>◉</button>
          </div>
        </header>

        {/* Screen */}
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>

          {/* ── FEED ── */}
          {tab === "feed" && item && (
            <div style={{ position:"absolute", inset:0 }}>
              <div style={{ position:"absolute", inset:0, overflowY:"auto" }}
                onTouchStart={onTS} onTouchEnd={onTE}
                onMouseDown={onMD} onMouseUp={onMU}>

                <div className={slideDir==="r"?"slide-r":"slide-l"} key={slideKey}>
                  <div style={S.cardShell}>
                    <div style={S.hero}>
                      <span style={S.heroEmoji}>{item.e}</span>
                      <div style={S.heroFade} />
                      <div style={S.heroBottom}>
                        <div style={S.featBadge}>
                          <span style={S.featDot} />
                          Featured: {item.cat}
                        </div>
                        <div style={S.heroTitle}>{item.title}</div>
                      </div>
                      <div style={{ position:"absolute", top:12, right:14, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, color:C.onVariant, letterSpacing:1 }}>
                        {page+1} / {displayNews.length}
                      </div>
                    </div>

                    <div style={S.cardBody}>
                      <div style={S.why}>
                        <div style={S.whyLbl}>💡 Why It Matters</div>
                        <div style={S.whyText}>{item.whyItMatters}</div>
                      </div>

                      <div style={S.metaRow}>
                        <div style={{ display:"flex", gap:10 }}>
                          <span style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:C.onVariant }}>
                            ⏱ {Math.max(1, Math.ceil(getSummary(item,aiMode,sumLen).split(" ").length/200))} min
                          </span>
                          <span style={{ display:"flex", alignItems:"center", gap:4, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:C.onVariant }}>
                            ◎ {(getCnt(item.id,"like")+getCnt(item.id,"fire")).toLocaleString()}
                          </span>
                        </div>
                        <div style={S.smlWrap}>
                          {["S","M","L"].map(s => <SmlBtn key={s} s={s} />)}
                        </div>
                      </div>

                      <div style={S.modeRow}>
                        {["ELI5","Technical","Business"].map(m => <ModeBtn key={m} m={m} />)}
                      </div>

                      <p style={{ fontSize:14, color:C.onVariant, lineHeight:1.75, marginBottom:16 }}>{getSummary(item,aiMode,sumLen)}</p>

                      {item.tags?.length > 0 && (
                        <div style={S.tags}>
                          {item.tool && <Tag t="Tool" />}
                          {item.tags.map(t => <Tag key={t} t={t} />)}
                        </div>
                      )}

                      <div style={S.actRow}>
                        <RxBtn id={item.id} type="like" emoji="👍" />
                        <RxBtn id={item.id} type="fire" emoji="🔥" />
                        <div style={{ flex:1 }} />
                        <IcoBtn ico={audioOn?"⏹":"▶"} on={audioOn}       onClick={()=>playAudio(item)} />
                        <IcoBtn ico="◇"                on={bookmarks.includes(item.id)} onClick={()=>toggleBkm(item.id)} />
                        <IcoBtn ico="↗"                on={false}         onClick={()=>share(item)} />
                      </div>

                      <a href={item.url} target="_blank" rel="noreferrer"
                        style={{ display:"flex", alignItems:"center", gap:6, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:C.tertiary, textDecoration:"none" }}>
                        Read on {item.src} <span>→</span>
                      </a>
                    </div>
                  </div>

                  {related.length > 0 && (
                    <div style={{ marginTop:22, marginBottom:4 }}>
                      <div style={S.secHdr}>
                        <span style={S.secLine} />Related Intel<span style={S.secLine} />
                      </div>
                      {related.map(r => (
                        <div key={r.id} onClick={()=>jumpToStory(r.id)}
                          style={{ padding:"16px 18px", background:C.surfaceLow, borderRadius:12, border:`1px solid ${C.outlineFaint}`, margin:"0 14px 8px", cursor:"pointer" }}>
                          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:"uppercase", color:catColor(r.cat), marginBottom:5 }}>{r.cat}</div>
                          <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:700, letterSpacing:"-.2px", color:C.onSurface, lineHeight:1.35 }}>{r.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ height:24 }} />
                </div>
              </div>

              <div style={S.dots}>
                {displayNews.map((_,i) => (
                  <div key={i} onClick={()=>jumpPage(i)}
                    style={{ height:3, width: i===page ? 26 : 14, borderRadius:2, background: i===page ? C.primary : "rgba(255,255,255,0.15)", transition:"all .25s", cursor:"pointer", pointerEvents:"all" }} />
                ))}
              </div>

              {page > 0 && (
                <button onClick={()=>goPage(-1)} style={{ position:"absolute", top:"50%", left:0, transform:"translateY(-50%)", background:"rgba(14,14,15,0.7)", backdropFilter:"blur(12px)", border:"none", color:C.onSurface, fontSize:18, cursor:"pointer", width:30, height:52, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"0 8px 8px 0", opacity:.7 }}>‹</button>
              )}
              {page < displayNews.length-1 && (
                <button onClick={()=>goPage(1)} style={{ position:"absolute", top:"50%", right:0, transform:"translateY(-50%)", background:"rgba(14,14,15,0.7)", backdropFilter:"blur(12px)", border:"none", color:C.onSurface, fontSize:18, cursor:"pointer", width:30, height:52, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"8px 0 0 8px", opacity:.7 }}>›</button>
              )}
            </div>
          )}

          {/* ── HOT ── */}
          {tab === "hot" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"16px 14px 12px", flexShrink:0 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, letterSpacing:"-.5px", color:C.onSurface, marginBottom:2 }}>Trending</div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color:C.onVariant }}>Ranked by community signal</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
                {toolList.length > 0 && <>
                  <div style={{ ...S.secHdr, marginBottom:10 }}><span style={S.secLine}/>Hot Tools<span style={S.secLine}/></div>
                  <div style={{ display:"flex", gap:10, overflowX:"auto", padding:"0 14px 16px" }}>
                    {toolList.map(t => (
                      <div key={t.id} onClick={()=>jumpToStory(t.id)}
                        style={{ flexShrink:0, width:110, padding:"16px 14px", background:C.surfaceCtr, borderRadius:12, border:`1px solid ${C.outlineFaint}`, cursor:"pointer" }}>
                        <span style={{ fontSize:28, marginBottom:10, display:"block" }}>{t.e}</span>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"-.2px", color:C.onSurface, lineHeight:1.3, marginBottom:3 }}>{t.title.split(" ").slice(0,4).join(" ")}…</div>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:500, color:C.onVariant }}>{t.src}</div>
                      </div>
                    ))}
                  </div>
                </>}
                <div style={{ ...S.secHdr, marginBottom:10 }}><span style={S.secLine}/>Top Stories<span style={S.secLine}/></div>
                {trending.map((n,i) => (
                  <div key={n.id} onClick={()=>jumpToStory(n.id)}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background:C.surfaceCtr, borderRadius:12, border:`1px solid ${C.outlineFaint}`, margin:"0 14px 8px", cursor:"pointer" }}>
                    <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:18, fontWeight:700, width:28, textAlign:"center", flexShrink:0, color: i<3?C.primary:C.onVariant }}>{i+1}</span>
                    <span style={{ fontSize:24, flexShrink:0 }}>{n.e}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"-.2px", color:C.onSurface, marginBottom:2, lineHeight:1.3 }}>{n.title}</div>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:C.onVariant }}>{n.cat} · {n.src}</div>
                    </div>
                    <span style={{ fontFamily:"monospace", fontSize:10, fontWeight:700, color:C.secondary, flexShrink:0 }}>+{getCnt(n.id,"like")+getCnt(n.id,"fire")}</span>
                  </div>
                ))}
                <div style={{ height:16 }} />
              </div>
            </div>
          )}

          {/* ── SEARCH ── */}
          {tab === "search" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"16px 14px 12px", flexShrink:0 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, letterSpacing:"-.5px", color:C.onSurface, marginBottom:14 }}>Discover</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, background:C.surfaceLow, borderRadius:12, border:`1px solid ${C.outlineFaint}`, padding:"0 14px", marginBottom:14 }}>
                  <span style={{ fontSize:16, color:C.onVariant }}>○</span>
                  <input placeholder="Search stories, sources…" value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                    style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:"'Space Grotesk',sans-serif", fontSize:13, fontWeight:500, color:C.onSurface, padding:"13px 0" }} />
                </div>
                <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
                  {["All",...CATS].map(c => (
                    <button key={c} onClick={()=>setFilterCat(c)}
                      style={{ padding:"5px 12px", borderRadius:100, flexShrink:0, border:`1px solid ${filterCat===c?"rgba(151,169,255,0.4)":C.outlineFaint}`, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", background: filterCat===c?"rgba(151,169,255,0.15)":C.surfaceCtr, color: filterCat===c?C.primary:C.onVariant, cursor:"pointer", transition:"all .18s" }}>{c}</button>
                  ))}
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
                {searchResults.length === 0
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, padding:40 }}>
                      <span style={{ fontSize:44, opacity:.3 }}>○</span>
                      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:C.onVariant, textAlign:"center" }}>No stories match</span>
                    </div>
                  : searchResults.map(n => (
                    <div key={n.id} onClick={()=>jumpToStory(n.id)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 18px", background:C.surfaceLow, borderRadius:12, border:`1px solid ${C.outlineFaint}`, margin:"0 14px 8px", cursor:"pointer" }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{n.e}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"-.2px", color:C.onSurface, marginBottom:3, lineHeight:1.3 }}>{n.title}</div>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:C.onVariant }}>{n.cat} · {n.src}</div>
                      </div>
                      <span style={{ color:C.primary, fontSize:14, flexShrink:0 }}>›</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── SAVED ── */}
          {tab === "saved" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"16px 14px 12px", flexShrink:0 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, letterSpacing:"-.5px", color:C.onSurface, marginBottom:2 }}>Saved</div>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color:C.onVariant }}>{bookmarks.length} bookmarked</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", paddingBottom:8 }}>
                {bookmarks.length === 0
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:14, padding:40, textAlign:"center" }}>
                      <span style={{ fontSize:44, opacity:.3 }}>◇</span>
                      <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:14, fontWeight:700, color:C.onVariant }}>Tap ◇ on any story to save it here</span>
                    </div>
                  : news.filter(n=>bookmarks.includes(n.id)).map(n => (
                    <div key={n.id} onClick={()=>jumpToStory(n.id)}
                      style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 18px", background:C.surfaceLow, borderRadius:12, border:`1px solid ${C.outlineFaint}`, margin:"0 14px 8px", cursor:"pointer" }}>
                      <div style={{ width:46, height:46, borderRadius:10, flexShrink:0, background:`linear-gradient(135deg,rgba(151,169,255,0.2),rgba(193,128,255,0.15))`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>{n.e}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:12, fontWeight:700, letterSpacing:"-.2px", color:C.onSurface, marginBottom:3, lineHeight:1.3 }}>{n.title}</div>
                        <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, textTransform:"uppercase", color:C.onVariant }}>{n.cat} · {n.src}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();toggleBkm(n.id);}} style={{ background:"none", border:"none", color:C.onVariant, cursor:"pointer", fontSize:13, padding:4, flexShrink:0 }}>✕</button>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === "settings" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ padding:"16px 14px 12px", flexShrink:0 }}>
                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:22, fontWeight:700, letterSpacing:"-.5px", color:C.onSurface }}>Profile</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", paddingBottom:16 }}>
                {/* About */}
                <div style={{ margin:"0 14px 16px", padding:"16px 18px", background:C.surfaceCtr, borderRadius:16, border:`1px solid ${C.outlineFaint}` }}>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:700, color:C.primary, marginBottom:6 }}>◈ Neon Luminary</div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, color:C.onVariant, lineHeight:1.6 }}>
                    Curated daily AI briefing — updated every 24 hours. No tracking, no ads, no API keys.
                  </div>
                  {updatedAt && <div style={{ marginTop:10, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, color:C.onVariant, textTransform:"uppercase" }}>Last updated: {fmtDate(updatedAt)}</div>}
                </div>

                {[
                  { label:"Summary Length", sub:"S = 100 · M = 150 · L = 200 words", ctrl:<div style={{ display:"flex", background:C.surfaceTop, borderRadius:10, padding:3, gap:2 }}>
                    {["S","M","L"].map(s=><button key={s} onClick={()=>setSumLen(s)} style={{ padding:"6px 12px", borderRadius:8, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", cursor:"pointer", background:sumLen===s?C.primary:"transparent", color:sumLen===s?"#000e3a":C.onVariant, border:"none", transition:"all .18s" }}>{s}</button>)}
                  </div> },
                  { label:"Reading Mode", sub:"ELI5 · Technical · Business", ctrl:<div style={{ display:"flex", background:C.surfaceTop, borderRadius:10, padding:3, gap:2 }}>
                    {[["ELI5","ELI5"],["Tech","Technical"],["Biz","Business"]].map(([l,v])=><button key={l} onClick={()=>setAiMode(v)} style={{ padding:"6px 12px", borderRadius:8, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", cursor:"pointer", background:aiMode===v?C.primary:"transparent", color:aiMode===v?"#000e3a":C.onVariant, border:"none", transition:"all .18s" }}>{l}</button>)}
                  </div> },
                ].map(({label,sub,ctrl}) => (
                  <div key={label}>
                    <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.onVariant, padding:"12px 18px 8px" }}>{label}</div>
                    <div style={{ background:C.surfaceCtr, borderRadius:16, border:`1px solid ${C.outlineFaint}`, margin:"0 14px 4px", padding:"15px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:14 }}>
                      <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:500, letterSpacing:.5, color:C.onVariant }}>{sub}</div>
                      {ctrl}
                    </div>
                  </div>
                ))}

                <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:C.onVariant, padding:"18px 18px 8px" }}>My Interests</div>
                <div style={{ background:C.surfaceCtr, borderRadius:16, border:`1px solid ${C.outlineFaint}`, margin:"0 14px 4px", padding:"16px 18px" }}>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {CATS.map(c => (
                      <button key={c} onClick={()=>setInterests(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])}
                        style={{ padding:"6px 14px", borderRadius:100, border:`1px solid ${interests.includes(c)?"rgba(151,169,255,0.4)":C.outlineFaint}`, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:700, letterSpacing:.8, textTransform:"uppercase", background: interests.includes(c)?"rgba(151,169,255,0.15)":C.surfaceHigh, color: interests.includes(c)?C.primary:C.onVariant, cursor:"pointer", transition:"all .18s" }}>{c}</button>
                    ))}
                  </div>
                  <div style={{ marginTop:12, fontFamily:"'Space Grotesk',sans-serif", fontSize:9, fontWeight:600, letterSpacing:.8, color:C.onVariant, textTransform:"uppercase" }}>Selected categories filter your feed</div>
                </div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div style={S.toast}>
              <span style={{ fontSize:14 }}>{toast.icon}</span>
              <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:11, fontWeight:600, color:C.onSurface, letterSpacing:.3 }}>{toast.msg}</span>
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <nav style={S.nav}>
          {TABS.map((t) => <NavBtn key={t.id} t={t} />)}
          <div style={{ ...S.navInd, left:`${tabIdx*20+10}%`, transform:"translateX(-50%)" }} />
        </nav>
      </div>
    </>
  );
}
