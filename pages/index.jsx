import Head from "next/head";
import { useState, useRef, useEffect, useCallback } from "react";

/* ── Design Tokens (DESIGN.md) ──────────────────────────────── */
const themes = {
  dark: {
    bg: "#0c0c0e",
    bgEl: "#161618",
    bgHi: "#1e1e22",
    bgHighest: "#28282e",
    bgVariant: "#1a1a1e",
    bgBright: "#2a2a30",
    text: "#e8e9ed",
    muted: "#b0b3ba",
    faint: "#6b6e76",
    accent: "#5e9eff",
    accentDim: "#6daeff",
    accentAlt: "#9d6cf0",
    accentMint: "#3dd9a0",
    accentMuted: "rgba(94,158,255,0.14)",
    accentAltMuted: "rgba(157,108,240,0.14)",
    rule: "rgba(255,255,255,0.06)",
    ruleStrong: "rgba(255,255,255,0.10)",
    success: "#3dd9a0",
    successMuted: "rgba(61,217,160,0.10)",
    warning: "#f0a840",
    error: "#f06070",
    info: "#5aaaf0",
    navBg: "rgba(22,22,24,0.80)",
    toastBg: "rgba(22,22,24,0.90)",
    glow: "0 0 20px rgba(94,158,255,0.12)",
    glowAlt: "0 0 16px rgba(157,108,240,0.14)",
  },
  light: {
    bg: "#f7f8fa",
    bgEl: "#eef0f4",
    bgHi: "#e4e6eb",
    bgHighest: "#d8dae0",
    bgVariant: "#e8eaef",
    bgBright: "#dddfe5",
    text: "#1a1c20",
    muted: "#55585f",
    faint: "#888b93",
    accent: "#1a3fd6",
    accentDim: "#2d4fe0",
    accentAlt: "#8b3dd4",
    accentMint: "#00c77c",
    accentMuted: "rgba(26,63,214,0.10)",
    accentAltMuted: "rgba(139,61,212,0.10)",
    rule: "rgba(26,28,32,0.08)",
    ruleStrong: "rgba(26,28,32,0.14)",
    success: "#00a86b",
    successMuted: "rgba(0,168,107,0.10)",
    warning: "#cc8800",
    error: "#d44060",
    info: "#2878cc",
    navBg: "rgba(247,248,250,0.75)",
    toastBg: "rgba(247,248,250,0.90)",
    glow: "0 0 24px rgba(26,63,214,0.08)",
    glowAlt: "0 0 18px rgba(139,61,212,0.10)",
  },
};
const THEME_LOCKED = false;

const F = {
  display: "'Playfair Display',Georgia,serif",
  body: "'Inter',-apple-system,sans-serif",
  mono: "'Geist Mono',monospace",
};

const CATS = ["LLMs","Tools","Startups","Research","Coding AI","Business"];
const WL = { S:30, M:60 };

const trunc = (text, n) => {
  const w = text.split(" ");
  if (w.length <= n) return text;
  const partial = w.slice(0, n).join(" ");
  const lastDot = partial.lastIndexOf(". ");
  if (lastDot > partial.length * 0.4) return partial.slice(0, lastDot + 1);
  const rest = text.slice(partial.length);
  const nextDot = rest.search(/\.\s|\.$/);
  if (nextDot >= 0) return partial + rest.slice(0, nextDot + 1);
  return text;
};
const getSummary = (item, mode, len) => {
  const source = {
    Intern: item.eli5 || item.summary,
    Techie: item.summary,
    Executive: item.business || item.summary,
  };
  const text = source[mode] || item.summary;
  if (len === "S") return trunc(text, 75);
  if (len === "L") return item.detailed || text;
  return text;
};

const fmtDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString([], { month:"short", day:"numeric" }) + " · " + d.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
};

/* ── Persistence ────────────────────────────────────────────── */
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
  const [news, setNews] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rawPage, setRawPage] = useState(0);
  const [tab, setTab] = useState("feed");
  const [sumLen, setSumLen] = useState("M");
  const [aiMode, setAiMode] = useState("Expert");
  const [bookmarks, setBookmarks] = useState([]);
  const [reactions, setReactions] = useState({});
  const [interests, setInterests] = useState(["LLMs","Tools","Coding AI"]);
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [toast, setToast] = useState(null);
  const [slideDir, setSlideDir] = useState("r");
  const [slideKey, setSlideKey] = useState(0);
  const [audioOn, setAudioOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dark, setDark] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);

  const T = dark ? themes.dark : themes.light;

  useEffect(() => {
    setSumLen(load("sumLen", "M"));
    setAiMode(load("aiMode", "Techie"));
    setBookmarks(load("bookmarks", []));
    setReactions(load("reactions", {}));
    setInterests(load("interests", ["LLMs","Tools","Coding AI"]));
    setDark(load("dark", true));
    setHydrated(true);
  }, []);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => { if (hydrated) save("sumLen", sumLen); }, [sumLen, hydrated]);
  useEffect(() => { if (hydrated) save("aiMode", aiMode); }, [aiMode, hydrated]);
  useEffect(() => { if (hydrated) save("bookmarks", bookmarks); }, [bookmarks, hydrated]);
  useEffect(() => { if (hydrated) save("reactions", reactions); }, [reactions, hydrated]);
  useEffect(() => { if (hydrated) save("interests", interests); }, [interests, hydrated]);
  useEffect(() => { if (hydrated && !THEME_LOCKED) save("dark", dark); }, [dark, hydrated]);
  useEffect(() => { document.documentElement.style.background = T.bg; document.body.style.background = T.bg; }, [T.bg]);

  useEffect(() => {
    fetch("/news-data.json")
      .then(r => r.json())
      .then(data => { setNews(data.stories || []); setUpdatedAt(data.updatedAt || null); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  /* Derived */
  const feed = interests.length ? news.filter(n => interests.includes(n.cat)) : news;
  const displayNews = feed.length ? feed : news;
  const page = Math.min(rawPage, Math.max(0, displayNews.length - 1));
  const item = displayNews[page] ?? displayNews[0];

  const searchResults = news.filter(n => {
    const q = searchQ.toLowerCase();
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
  const related = displayNews.filter((_,i) => i !== page).slice(0,3);

  /* Refs */
  const toastTimer = useRef(null);
  const dragRef = useRef({ x:null, active:false });

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
  const jumpPage = (i) => { setSlideDir(i > page ? "r" : "l"); setSlideKey(k => k+1); setRawPage(i); };
  const jumpToStory = (id) => { const i = displayNews.findIndex(n => n.id === id); setRawPage(Math.max(0, i)); setSlideKey(k => k+1); setTab("feed"); };

  /* Swipe */
  const onTS = e => { dragRef.current = { x:e.touches[0].clientX, active:true }; };
  const onTE = e => { if (!dragRef.current.active) return; const dx = e.changedTouches[0].clientX - dragRef.current.x; if (Math.abs(dx) > 40) goPage(dx < 0 ? 1 : -1); dragRef.current.active = false; };
  const onMD = e => { dragRef.current = { x:e.clientX, active:true }; };
  const onMU = e => { if (!dragRef.current.active) return; const dx = e.clientX - dragRef.current.x; if (Math.abs(dx) > 40) goPage(dx < 0 ? 1 : -1); dragRef.current.active = false; };

  const toggleBkm = (id) => { const has = bookmarks.includes(id); setBookmarks(b => has ? b.filter(x=>x!==id) : [...b, id]); toast$(has ? "Removed" : "Saved", "◇"); };
  const toggleRx = (id, type) => setReactions(r => ({ ...r, [id]: r[id]===type ? null : type }));

  const audioRef = useRef(null);
  const stopAudio = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setAudioOn(false); };
  const playAudio = async (it) => {
    if (audioOn) { stopAudio(); return; }
    setAudioOn(true); toast$("Generating...", "◎");
    try {
      const resp = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: it.title, summary: getSummary(it, aiMode, sumLen), whyItMatters: it.whyItMatters }) });
      if (!resp.ok) throw new Error("api");
      const blob = await resp.blob(); const url = URL.createObjectURL(blob);
      const audio = new Audio(url); audioRef.current = audio;
      audio.onended = () => { stopAudio(); URL.revokeObjectURL(url); };
      audio.onerror = () => { stopAudio(); URL.revokeObjectURL(url); };
      audio.play(); toast$("Playing...", "▶");
    } catch { setAudioOn(false); toast$("Audio unavailable", "✕"); }
  };

  const share = (it) => {
    const t = `${it.title}\n\n${getSummary(it,aiMode,sumLen)}\n\n${it.url}`;
    if (navigator.share) navigator.share({ title:it.title, text:t, url:it.url }).catch(()=>{});
    else navigator.clipboard.writeText(t).then(() => toast$("Copied", "◎"));
  };

  const TABS = [
    { id:"feed", label:"Home" },
    { id:"hot", label:"Trends" },
    { id:"search", label:"Search" },
    { id:"saved", label:"Saved" },
    { id:"settings", label:"Profile" },
  ];

  const NAV_ICONS = {
    feed: [["M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z","M9 22V12h6v10"]],
    hot: [["M23 6l-9.5 9.5-5-5L1 18","M17 6h6v6"]],
    search: [["M21 21l-5.2-5.2","M10 17a7 7 0 110-14 7 7 0 010 14z"]],
    saved: [["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"]],
    settings: [["M12 11a4 4 0 100-8 4 4 0 000 8z","M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"]],
  };
  const NavIcon = ({id, color, size=20}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {(NAV_ICONS[id]?.[0] || []).map((d,i) => <path key={i} d={d} />)}
    </svg>
  );

  const MODE_LABELS = { Intern:"Intern", Techie:"Techie", Executive:"Executive" };
  const LEN_LABELS = { S:"Skim", M:"Focus", L:"Deep Dive" };

  /* ── Shared styles ── */
  const label = { fontFamily:F.mono, fontSize:10, fontWeight:600, letterSpacing:2.5, textTransform:"uppercase", color:T.faint };
  const catLabel = { fontFamily:F.mono, fontSize:10, fontWeight:600, letterSpacing:2, textTransform:"uppercase", color:T.accent };
  const headline = (sz=28) => ({ fontFamily:F.display, fontSize:sz, fontWeight:400, lineHeight:1.12, letterSpacing:sz > 30 ? "-0.5px" : "-0.3px", color:T.text });
  const bodyText = { fontFamily:F.body, fontSize:14, color:T.muted, lineHeight:1.65 };
  const meta = { fontFamily:F.mono, fontSize:10, fontWeight:500, color:T.faint, letterSpacing:0.5 };
  const rule = { borderBottom:`1px solid ${T.rule}` };
  const pad = { padding: isDesktop ? "0 40px" : "0 24px" };

  /* ── Btn helpers ── */
  const PillBtn = ({label:l, on, onClick}) => (
    <button onClick={onClick} style={{ padding:"5px 12px", borderRadius:14, border:`1px solid ${on ? T.accent : T.rule}`, fontFamily:F.mono, fontSize:9, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", background: on ? T.accentMuted : T.bgHi, color: on ? T.accent : T.faint, cursor:"pointer", transition:"all .15s" }}>{l}</button>
  );
  const RxBtn = ({id, type, emoji}) => {
    const on = reactions[id]===type;
    return (
      <button onClick={()=>toggleRx(id,type)} style={{ display:"flex", alignItems:"center", gap:6, background: on ? T.accentMuted : T.bgEl, border:`1px solid ${on ? T.accent : T.rule}`, borderRadius:14, padding:"7px 14px", fontFamily:F.body, fontSize:12, fontWeight:600, color: on ? T.accent : T.muted, cursor:"pointer", transition:"all .15s" }}>
        {emoji} <span style={{ fontFamily:F.mono, fontSize:10 }}>{getCnt(id,type)}</span>
      </button>
    );
  };
  const IcoBtn = ({ico, on, onClick}) => (
    <button onClick={onClick} style={{ width:36, height:36, background: on ? T.accentMuted : T.bgEl, border:`1px solid ${on ? T.accent : T.rule}`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:14, color: on ? T.accent : T.muted, transition:"all .15s", flexShrink:0 }}>{ico}</button>
  );
  const Tag = ({t}) => (
    <span style={{ padding:"3px 10px", borderRadius:14, fontFamily:F.mono, fontSize:9, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", background:T.accentMuted, color:T.accent }}>{t}</span>
  );

  /* Loading */
  if (loading) return (
    <div style={{ minHeight:"100dvh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, transition:"background .3s" }}>
      <div style={{ width:32, height:32, border:`2px solid ${T.rule}`, borderTopColor:T.accent, borderRadius:"50%", animation:"spin .7s linear infinite" }} />
      <span style={{ ...label, color:T.muted }}>Loading briefing...</span>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <>
      <Head>
        <title>Pulse AI - High-End AI Editorial</title>
        <meta name="description" content="Pulse AI - a high-end editorial briefing for AI news, tools, and research." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={T.bg} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta property="og:title" content="Pulse AI - Real-Time Heartbeat of AI News" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight:"100dvh", background:T.bg, color:T.text, display:"flex", flexDirection:"column", maxWidth: isDesktop ? 1080 : 480, margin:"0 auto", position:"relative", transition:"background .3s, color .3s" }}>

        {/* Header */}
        <header style={{ position:"sticky", top:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"space-between", padding: isDesktop ? "16px 40px" : "16px 24px", background:T.navBg, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderBottom:`1px solid ${T.ruleStrong}` }}>
          <div style={{ display:"flex", alignItems:"center", gap: isDesktop ? 32 : 0 }}>
            <div style={{ fontFamily:F.display, fontSize:18, fontWeight:400, color:T.text, letterSpacing:"-0.3px" }}>Pulse AI</div>
            {isDesktop && (
              <nav style={{ display:"flex", gap:4 }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:12, background: tab===t.id ? T.accentMuted : "transparent", border:"none", cursor:"pointer", transition:"all .15s" }}>
                    <NavIcon id={t.id} color={tab===t.id ? T.accent : T.faint} size={16} />
                    <span style={{ fontFamily:F.mono, fontSize:9, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color: tab===t.id ? T.accent : T.faint }}>{t.label}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {updatedAt && <span style={meta}>{fmtDate(updatedAt)}</span>}
            <button onClick={() => setDark(d => !d)} style={{ background:"none", border:`1px solid ${T.rule}`, borderRadius:16, padding:"4px 10px", fontFamily:F.mono, fontSize:9, fontWeight:600, letterSpacing:1, color:T.faint, cursor:"pointer", transition:"all .15s" }}>{dark ? "☀ LIGHT" : "● DARK"}</button>
          </div>
        </header>

        {/* Screen */}
        <div style={{ flex:1, overflow:"hidden", position:"relative" }}>

          {/* ── FEED ── */}
          {tab === "feed" && item && (
            <div style={{ position:"absolute", inset:0 }}>
              <div style={{ position:"absolute", inset:0, overflowY:"auto", display: isDesktop ? "flex" : "block" }}
                onTouchStart={onTS} onTouchEnd={onTE} onMouseDown={onMD} onMouseUp={onMU}>

                {/* Main story column */}
                <div style={{ flex: isDesktop ? 1 : undefined, minWidth:0 }}>
                  <div className={slideDir==="r"?"slide-r":"slide-l"} key={slideKey}>
                    <div style={{ padding: isDesktop ? "32px 48px" : "24px 24px 24px" }}>
                      {/* Featured hero */}
                      <div style={{ borderRadius:20, overflow:"hidden", marginBottom:20, borderBottom:`2px solid ${T.accent}`, position:"relative", background:`linear-gradient(135deg, ${T.bgEl}, ${T.bgHi})` }}>
                        {item.img
                          ? <img src={item.img} alt="" style={{ width:"100%", height: isDesktop ? 320 : 200, objectFit:"cover", display:"block" }} />
                          : <div style={{ padding: isDesktop ? "48px 0" : "36px 0", display:"flex", alignItems:"center", justifyContent:"center" }}>
                              <span style={{ fontSize: isDesktop ? 72 : 56, lineHeight:1 }}>{item.e}</span>
                            </div>
                        }
                      </div>

                      {/* Category + counter */}
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <span style={catLabel}>{item.cat}</span>
                        <span style={meta}>{page+1} / {displayNews.length}</span>
                      </div>

                      {/* Headline - extreme scale */}
                      <h1 style={headline(isDesktop ? 48 : 42)}>{item.title}</h1>

                      {/* Meta row */}
                      <div style={{ display:"flex", gap:16, alignItems:"center", padding:"16px 0", ...rule, marginBottom:20, flexWrap:"wrap" }}>
                        <span style={meta}>{item.src}</span>
                        <span style={{ width:4, height:4, borderRadius:"50%", background:T.accent }} />
                        {updatedAt && <span style={meta}>{fmtDate(updatedAt)}</span>}
                        <span style={{ width:4, height:4, borderRadius:"50%", background:T.accent }} />
                        <span style={meta}>{Math.max(1, Math.ceil(getSummary(item,aiMode,sumLen).split(" ").length/200))} min read</span>
                        <span style={meta}>{(getCnt(item.id,"like")+getCnt(item.id,"fire")).toLocaleString()} reactions</span>
                      </div>

                      {/* Key Takeaway */}
                      <div style={{ borderLeft:`2px solid ${T.success}`, background:T.successMuted, borderRadius:"0 16px 16px 0", padding:"14px 16px", marginBottom:20 }}>
                        <div style={{ ...catLabel, color:T.success, marginBottom:6 }}>Key Takeaway</div>
                        <div style={{ fontFamily:F.body, fontSize:13, fontWeight:500, color:T.text, lineHeight:1.55 }}>{item.whyItMatters}</div>
                      </div>

                      {/* Controls row */}
                      <div style={{ display:"flex", gap:12, marginBottom:12, flexWrap:"wrap", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ ...meta, marginRight:2 }}>I am</span>
                          {["Intern","Techie","Executive"].map(m => <PillBtn key={m} label={MODE_LABELS[m]} on={aiMode===m} onClick={()=>setAiMode(m)} />)}
                        </div>
                        <span style={{ width:1, height:16, background:T.rule }} />
                        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                          <span style={{ ...meta, marginRight:2 }}>I want to</span>
                          {["S","M","L"].map(s => <PillBtn key={s} label={LEN_LABELS[s]} on={sumLen===s} onClick={()=>setSumLen(s)} />)}
                        </div>
                      </div>

                      {/* Summary - unified container for all modes */}
                      <div style={{
                        ...bodyText, marginBottom:20, maxWidth: isDesktop ? 640 : undefined, transition:"all .3s ease",
                        background:T.bgEl,
                        padding:"24px 20px",
                        borderRadius:24,
                        border:`1px solid ${T.rule}`,
                        boxShadow:T.glow,
                        fontSize: isDesktop ? 17 : 16,
                        lineHeight:1.85,
                        color:T.text,
                        fontFamily:F.body,
                      }}>
                        <div style={{ ...label, color:T.accent, marginBottom:12, fontSize:8, letterSpacing:3 }}>{LEN_LABELS[sumLen].toUpperCase()}</div>
                        {(() => {
                          const raw = getSummary(item,aiMode,sumLen);
                          const parts = raw.includes("\n\n") ? raw.split("\n\n") : raw.split(/(?<=\.)\s+/).reduce((acc, s, i) => {
                            const last = acc.length - 1;
                            if (last < 0 || acc[last].split(/(?<=\.)\s+/).length >= 3) acc.push(s);
                            else acc[last] += " " + s;
                            return acc;
                          }, []);
                          return parts.map((p, i) => (
                            <p key={i} style={{ marginBottom: i < parts.length - 1 ? 16 : 0 }}>{p.trim()}</p>
                          ));
                        })()}
                      </div>

                      {/* Tags */}
                      {item.tags?.length > 0 && (
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:20 }}>
                          {item.tool && <Tag t="Featured" />}
                          {item.tags.map(t => <Tag key={t} t={t} />)}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
                        <RxBtn id={item.id} type="like" emoji="△" />
                        <RxBtn id={item.id} type="fire" emoji="⚡" />
                        <div style={{ flex:1 }} />
                        <IcoBtn ico={audioOn?"⏹":"▶"} on={audioOn} onClick={()=>playAudio(item)} />
                        <IcoBtn ico="★" on={bookmarks.includes(item.id)} onClick={()=>toggleBkm(item.id)} />
                        <IcoBtn ico="↗" on={false} onClick={()=>share(item)} />
                      </div>

                      {/* Source link */}
                      <a href={item.url} target="_blank" rel="noreferrer"
                        style={{ fontFamily:F.mono, fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color:T.accent, textDecoration:"none" }}>
                        Read on {item.src} →
                      </a>

                      {/* Related - only on mobile (desktop has sidebar) */}
                      {!isDesktop && <>
                        <div style={{ height:1, background:T.ruleStrong, margin:"32px 0 24px" }} />
                        {related.length > 0 && <>
                          <div style={{ ...label, marginBottom:16 }}>Related</div>
                          {related.map(r => (
                            <div key={r.id} onClick={()=>jumpToStory(r.id)}
                              style={{ padding:"16px 0", ...rule, cursor:"pointer" }}>
                              <div style={catLabel}>{r.cat}</div>
                              <div style={{ fontFamily:F.display, fontSize:18, fontWeight:400, lineHeight:1.2, color:T.text, marginTop:4 }}>{r.title}</div>
                            </div>
                          ))}
                        </>}
                      </>}
                      <div style={{ height:24 }} />
                    </div>
                  </div>
                </div>

                {/* Desktop sidebar - story list */}
                {isDesktop && (
                  <aside style={{ width:300, flexShrink:0, borderLeft:`1px solid ${T.rule}`, overflowY:"auto", padding:"32px 24px" }}>
                    <div style={{ ...label, marginBottom:16 }}>All Stories</div>
                    {displayNews.map((n,i) => (
                      <div key={n.id} onClick={()=>jumpPage(i)}
                        style={{ padding:"12px 0", ...rule, cursor:"pointer", opacity: i===page ? 1 : 0.7, transition:"opacity .15s" }}>
                        <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
                          <span style={{ fontFamily:F.display, fontSize:18, color: i===page ? T.accent : T.faint, minWidth:20, textAlign:"right" }}>{i+1}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:F.display, fontSize:15, fontWeight:400, lineHeight:1.25, color: i===page ? T.text : T.muted }}>{n.title}</div>
                            <div style={{ ...meta, marginTop:3 }}>{n.cat} · {n.src}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </aside>
                )}
              </div>

              {/* Page dots - mobile only */}
              {!isDesktop && (
                <div style={{ position:"absolute", bottom:12, left:0, right:0, display:"flex", justifyContent:"center", gap:5, pointerEvents:"none" }}>
                  {displayNews.map((_,i) => (
                    <div key={i} onClick={()=>jumpPage(i)}
                      style={{ height:2, width: i===page ? 24 : 12, borderRadius:1, background: i===page ? T.accent : T.rule, transition:"all .25s", cursor:"pointer", pointerEvents:"all" }} />
                  ))}
                </div>
              )}

              {/* Arrows */}
              {!isDesktop && page > 0 && <button onClick={()=>goPage(-1)} style={{ position:"absolute", top:"50%", left:0, transform:"translateY(-50%)", background:T.navBg, backdropFilter:"blur(12px)", border:`1px solid ${T.rule}`, borderLeft:"none", color:T.muted, fontSize:18, cursor:"pointer", width:28, height:48, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"0 12px 12px 0" }}>‹</button>}
              {!isDesktop && page < displayNews.length-1 && <button onClick={()=>goPage(1)} style={{ position:"absolute", top:"50%", right:0, transform:"translateY(-50%)", background:T.navBg, backdropFilter:"blur(12px)", border:`1px solid ${T.rule}`, borderRight:"none", color:T.muted, fontSize:18, cursor:"pointer", width:28, height:48, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"12px 0 0 12px" }}>›</button>}
            </div>
          )}

          {/* ── TRENDING ── */}
          {tab === "hot" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ ...pad, paddingTop:24, paddingBottom:12, flexShrink:0 }}>
                <div style={headline(28)}>Trending</div>
                <div style={{ ...label, marginTop:4 }}>Ranked by community signal</div>
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {toolList.length > 0 && <>
                  <div style={{ ...label, ...pad, marginBottom:12 }}>Hot Tools</div>
                  <div style={{ display: isDesktop ? "grid" : "flex", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(160px, 1fr))" : undefined, gap:12, overflowX: isDesktop ? "visible" : "auto", padding: isDesktop ? "0 40px 20px" : "0 24px 20px" }}>
                    {toolList.map(t => (
                      <div key={t.id} onClick={()=>jumpToStory(t.id)}
                        style={{ flexShrink:0, width: isDesktop ? "auto" : 120, padding:16, border:`1px solid ${T.rule}`, borderRadius:16, cursor:"pointer" }}>
                        <span style={{ fontSize:28, display:"block", marginBottom:8 }}>{t.e}</span>
                        <div style={{ fontFamily:F.display, fontSize:14, fontWeight:400, lineHeight:1.25, color:T.text, marginBottom:4 }}>{t.title.split(" ").slice(0,4).join(" ")}...</div>
                        <div style={meta}>{t.src}</div>
                      </div>
                    ))}
                  </div>
                </>}
                <div style={{ ...label, ...pad, marginBottom:8 }}>Top Stories</div>
                <div style={pad}>
                  {trending.map((n,i) => (
                    <div key={n.id} onClick={()=>jumpToStory(n.id)}
                      style={{ display:"flex", alignItems:"baseline", gap:14, padding:"14px 0", ...rule, cursor:"pointer" }}>
                      <span style={{ fontFamily:F.display, fontSize:24, fontWeight:400, minWidth:28, textAlign:"right", flexShrink:0, color: i<3 ? T.accent : T.faint }}>{i+1}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:F.display, fontSize:18, fontWeight:400, lineHeight:1.2, color:T.text }}>{n.title}</div>
                        <div style={{ ...meta, marginTop:4 }}>{n.cat} · {n.src}</div>
                      </div>
                      <span style={{ fontFamily:F.mono, fontSize:10, fontWeight:600, color:T.accent, flexShrink:0 }}>+{getCnt(n.id,"like")+getCnt(n.id,"fire")}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height:16 }} />
              </div>
            </div>
          )}

          {/* ── SEARCH ── */}
          {tab === "search" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ ...pad, paddingTop:24, paddingBottom:12, flexShrink:0 }}>
                <div style={{ ...headline(28), marginBottom:16 }}>Discover</div>
                <div style={{ display:"flex", alignItems:"center", gap:10, border:`1px solid ${T.rule}`, borderRadius:16, padding:"0 14px", marginBottom:14 }}>
                  <span style={{ fontSize:14, color:T.faint }}>○</span>
                  <input placeholder="Search stories, sources..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                    style={{ flex:1, background:"none", border:"none", outline:"none", fontFamily:F.body, fontSize:14, fontWeight:400, color:T.text, padding:"12px 0" }} />
                </div>
                <div style={{ display:"flex", gap:6, overflowX:"auto" }}>
                  {["All",...CATS].map(c => <PillBtn key={c} label={c} on={filterCat===c} onClick={()=>setFilterCat(c)} />)}
                </div>
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {searchResults.length === 0
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12, padding:40 }}>
                      <span style={{ fontFamily:F.display, fontSize:44, color:T.faint, opacity:.4 }}>○</span>
                      <span style={{ fontFamily:F.body, fontSize:14, fontWeight:500, color:T.muted }}>No stories match</span>
                    </div>
                  : <div style={{ ...pad, display: isDesktop ? "grid" : "block", gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined, gap: isDesktop ? "0 32px" : undefined }}>{searchResults.map(n => (
                    <div key={n.id} onClick={()=>jumpToStory(n.id)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 0", ...rule, cursor:"pointer" }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{n.e}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:F.display, fontSize:16, fontWeight:400, lineHeight:1.25, color:T.text, marginBottom:2 }}>{n.title}</div>
                        <div style={meta}>{n.cat} · {n.src}</div>
                      </div>
                      <span style={{ color:T.accent, fontSize:14, flexShrink:0 }}>›</span>
                    </div>
                  ))}</div>
                }
              </div>
            </div>
          )}

          {/* ── SAVED ── */}
          {tab === "saved" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ ...pad, paddingTop:24, paddingBottom:12, flexShrink:0 }}>
                <div style={headline(28)}>Saved</div>
                <div style={{ ...label, marginTop:4 }}>{bookmarks.length} bookmarked</div>
              </div>
              <div style={{ flex:1, overflowY:"auto" }}>
                {bookmarks.length === 0
                  ? <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12, padding:40 }}>
                      <span style={{ fontFamily:F.display, fontSize:44, color:T.faint, opacity:.4 }}>★</span>
                      <span style={{ fontFamily:F.body, fontSize:14, fontWeight:500, color:T.muted, textAlign:"center" }}>Tap ★ on any story to save it here</span>
                    </div>
                  : <div style={pad}>{news.filter(n=>bookmarks.includes(n.id)).map(n => (
                    <div key={n.id} onClick={()=>jumpToStory(n.id)}
                      style={{ display:"flex", gap:12, alignItems:"center", padding:"14px 0", ...rule, cursor:"pointer" }}>
                      <span style={{ fontSize:22, flexShrink:0 }}>{n.e}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:F.display, fontSize:16, fontWeight:400, lineHeight:1.25, color:T.text, marginBottom:2 }}>{n.title}</div>
                        <div style={meta}>{n.cat} · {n.src}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();toggleBkm(n.id);}} style={{ background:"none", border:"none", color:T.faint, cursor:"pointer", fontSize:13, padding:4, flexShrink:0 }}>✕</button>
                    </div>
                  ))}</div>
                }
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab === "settings" && (
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", overflow:"hidden" }}>
              <div style={{ ...pad, paddingTop:24, paddingBottom:12, flexShrink:0 }}>
                <div style={headline(28)}>Profile</div>
              </div>
              <div style={{ flex:1, overflowY:"auto", ...pad }}>
                <div style={{ display: isDesktop ? "grid" : "block", gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined, gap: isDesktop ? "0 48px" : undefined, maxWidth: isDesktop ? 640 : undefined }}>
                  <div>
                    {/* About */}
                    <div style={{ padding:"16px 0", ...rule, marginBottom:16 }}>
                      <div style={{ fontFamily:F.display, fontSize:16, fontWeight:400, color:T.text, marginBottom:4 }}>Pulse AI</div>
                      <div style={{ fontFamily:F.body, fontSize:13, color:T.muted, lineHeight:1.6 }}>Curated daily AI briefing. No tracking, no ads.</div>
                      {updatedAt && <div style={{ ...meta, marginTop:8 }}>Last updated: {fmtDate(updatedAt)}</div>}
                    </div>

                    {/* Theme */}
                    <div style={{ ...label, marginBottom:8 }}>Appearance</div>
                    <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                      <PillBtn label="Dark" on={dark} onClick={() => setDark(true)} />
                      <PillBtn label="Light" on={!dark} onClick={() => setDark(false)} />
                    </div>
                    <div style={{ ...meta, marginBottom:24 }}>Choose your preferred theme</div>
                  </div>

                  <div>
                    {/* Reading Style */}
                    <div style={{ ...label, marginBottom:8 }}>I am</div>
                    <div style={{ display:"flex", gap:8, marginBottom:24 }}>
                      {["Intern","Techie","Executive"].map(m => <PillBtn key={m} label={MODE_LABELS[m]} on={aiMode===m} onClick={()=>setAiMode(m)} />)}
                    </div>

                    {/* Read Mode */}
                    <div style={{ ...label, marginBottom:8 }}>I want to</div>
                    <div style={{ display:"flex", gap:8, marginBottom:24 }}>
                      {["S","M","L"].map(s => <PillBtn key={s} label={LEN_LABELS[s]} on={sumLen===s} onClick={()=>setSumLen(s)} />)}
                    </div>
                  </div>
                </div>

                {/* Interests - full width */}
                <div style={{ ...label, marginBottom:8 }}>My Interests</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:8 }}>
                  {CATS.map(c => <PillBtn key={c} label={c} on={interests.includes(c)} onClick={()=>setInterests(p=>p.includes(c)?p.filter(x=>x!==c):[...p,c])} />)}
                </div>
                <div style={{ ...meta, marginBottom:24 }}>Selected categories filter your feed</div>
              </div>
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", width:"calc(100% - 48px)", maxWidth:432, background:T.toastBg, border:`1px solid ${T.ruleStrong}`, borderRadius:16, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, zIndex:9999, animation:"toastIn .22s ease both" }}>
              <span style={{ fontSize:14 }}>{toast.icon}</span>
              <span style={{ fontFamily:F.body, fontSize:13, fontWeight:500, color:T.text }}>{toast.msg}</span>
            </div>
          )}
        </div>

        {/* Bottom nav - mobile only */}
        <nav style={{ height:64, display: isDesktop ? "none" : "flex", alignItems:"center", justifyContent:"space-around", background:T.navBg, backdropFilter:"blur(24px)", WebkitBackdropFilter:"blur(24px)", borderTop:`1px solid ${T.ruleStrong}`, flexShrink:0, paddingBottom:4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, cursor:"pointer", padding:"6px 14px", background:"none", border:"none" }}>
              <NavIcon id={t.id} color={tab===t.id ? T.accent : T.faint} size={20} />
              <span style={{ fontFamily:F.mono, fontSize:8, fontWeight:600, letterSpacing:1.5, textTransform:"uppercase", color: tab===t.id ? T.accent : T.faint, transition:"color .15s" }}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
