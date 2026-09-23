"use client";
import { useState, useEffect, useMemo } from "react";
import { Essay } from "@/lib/types";
import { SAMPLE_ESSAYS } from "@/lib/sampleData";
import { EssayCard } from "@/components/EssayCard";
import { BookReader } from "@/components/BookReader";
import { AdminPanel } from "@/components/AdminPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthPaywall } from "@/components/AuthPaywall";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

type View = 'home'|'reading'|'admin';
type EssayRow = {
  id: string;
  title: string;
  date: string;
  read_time: string;
  image: string;
  caption: string;
  excerpt: string;
  content: string[];
  likes: number;
  tags: string[] | null;
  created_at: number;
};
function rowToEssay(row: EssayRow): Essay {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    readTime: row.read_time,
    image: row.image,
    caption: row.caption,
    excerpt: row.excerpt,
    content: Array.isArray(row.content) ? row.content : [],
    likes: row.likes || 0,
    tags: row.tags || [],
    createdAt: row.created_at,
  };
}
function essayToRow(essay: Essay): EssayRow {
  return {
    id: essay.id,
    title: essay.title,
    date: essay.date,
    read_time: essay.readTime,
    image: essay.image,
    caption: essay.caption,
    excerpt: essay.excerpt,
    content: essay.content,
    likes: essay.likes,
    tags: essay.tags || [],
    created_at: essay.createdAt,
  };
}

export default function HomePage() {
  const [essays, setEssays] = useState<Essay[]>(SAMPLE_ESSAYS);
  const [view, setView] = useState<View>('home');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [freePicks, setFreePicks] = useState<string[]>([]);
  const [readHistory, setReadHistory] = useState<string[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [isLifetime, setIsLifetime] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [filter, setFilter] = useState<'all'|'unread'|'new'|'read'>('all');
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSupabase, setIsSupabase] = useState(false);
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminChecking, setAdminChecking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const configured = isSupabaseConfigured();
      setIsSupabase(!!configured);
      try {
        setFreePicks(JSON.parse(localStorage.getItem('oooii_free_picks') || '[]'));
        setReadHistory(JSON.parse(localStorage.getItem('oooii_read_history') || '[]'));
        setLikes(JSON.parse(localStorage.getItem('oooii_likes') || '{}'));
        setLikeCounts(JSON.parse(localStorage.getItem('oooii_like_counts') || '{}'));
      } catch {}

      if (configured && supabase) {
        const sb = supabase;
        try {
          const { data: sessData } = await sb.auth.getSession();
          if (!sessData.session?.user) {
            try { localStorage.removeItem('oooii_lifetime'); } catch {}
            setIsLifetime(false);
          } else {
            setUser(sessData.session.user);
            setUserEmail(sessData.session.user.email || null);
            const { data: prof } = await sb.from('profiles').select('is_lifetime').eq('id', sessData.session.user.id).single();
            if (prof?.is_lifetime) {
              setIsLifetime(true);
              try { localStorage.setItem('oooii_lifetime','true'); } catch {}
            }
          }
          sb.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              setUser(session.user);
              setUserEmail(session.user.email || null);
              const { data: prof } = await sb.from('profiles').select('is_lifetime').eq('id', session.user.id).single();
              if (prof?.is_lifetime) {
                setIsLifetime(true);
                try { localStorage.setItem('oooii_lifetime','true'); } catch {}
              } else {
                setIsLifetime(false);
                try { localStorage.removeItem('oooii_lifetime'); } catch {}
              }
            } else {
              setUser(null);
              setUserEmail(null);
              setIsLifetime(false);
              try { localStorage.removeItem('oooii_lifetime'); } catch {}
            }
          });
        } catch {}

        const { data, error } = await sb.from('essays').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = (data as EssayRow[]).map(rowToEssay);
          setEssays(mapped);
        }
      } else {
        try {
          const custom = JSON.parse(localStorage.getItem('oooii_essays_custom') || '[]');
          if (custom.length) setEssays(prev => [...custom, ...prev].sort((a,b)=>b.createdAt-a.createdAt));
        } catch {}
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => { try{ localStorage.setItem('oooii_free_picks', JSON.stringify(freePicks)); }catch{} }, [freePicks]);
  useEffect(() => { try{ localStorage.setItem('oooii_read_history', JSON.stringify(readHistory)); }catch{} }, [readHistory]);
  useEffect(() => { try{ localStorage.setItem('oooii_likes', JSON.stringify(likes)); }catch{} }, [likes]);
  useEffect(() => { try{ localStorage.setItem('oooii_like_counts', JSON.stringify(likeCounts)); }catch{} }, [likeCounts]);
  useEffect(() => { try{ if (sessionStorage.getItem('oooii_admin_authed') === 'true') setIsAdminAuthed(true); }catch{} }, []);

  const sortedEssays = useMemo(() => [...essays].sort((a,b)=>b.createdAt-a.createdAt), [essays]);
  const todayEssay = sortedEssays[0];

  const filtered = useMemo(() => {
    let list = sortedEssays;
    if (filter==='unread') list = list.filter(e=>!readHistory.includes(e.id));
    if (filter==='read') list = list.filter(e=>readHistory.includes(e.id));
    if (filter==='new') list = list.filter(e=> Date.now() - e.createdAt < 72*3600*1000);
    if (search) list = list.filter(e=> e.title.toLowerCase().includes(search.toLowerCase()) || e.excerpt.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [sortedEssays, filter, readHistory, search]);

  const currentEssay = currentId ? sortedEssays.find(e=>e.id===currentId) : null;

  const openEssay = (id: string) => {
    const alreadyPicked = freePicks.includes(id);
    // Option B: 2 free before account (OTP), 5 total before pay
    if (!alreadyPicked) {
      if (!user && freePicks.length >= 2) { setShowPaywall(true); return; }
      if (user && !isLifetime && freePicks.length >= 5) { setShowPaywall(true); return; }
      if (!user && !isLifetime && freePicks.length >= 5) { setShowPaywall(true); return; }
    }
    if (!alreadyPicked && !isLifetime) {
      setFreePicks(prev => [...prev, id]);
      if (supabase && user) {
        supabase.from('profiles').update({ free_reads_used: freePicks.length + 1 }).eq('id', user.id).then(()=>{});
      }
    }
    if (!readHistory.includes(id)) setReadHistory(prev => [...prev, id]);
    setCurrentId(id);
    setView('reading');
    window.scrollTo({top:0});
  };

  const handleLike = async (id: string) => {
    const liked = !!likes[id];
    const currentEssayObj = essays.find(e=>e.id===id);
    const currentLikeCount = likeCounts[id] || currentEssayObj?.likes || 0;
    const newCount = liked ? currentLikeCount -1 : currentLikeCount +1;
    setLikes(prev => ({...prev, [id]: !liked}));
    setLikeCounts(prev => ({...prev, [id]: newCount}));
    if (isSupabase && supabase && currentEssayObj) {
      await supabase.from('essays').update({ likes: newCount }).eq('id', id);
    }
  };

  const addEssay = async (e: Essay) => {
    setEssays(prev => [e, ...prev].sort((a,b)=>b.createdAt-a.createdAt));
    if (isSupabase && supabase) {
      const row = essayToRow(e);
      const { error } = await supabase.from('essays').insert([row]);
      if (error) alert("Failed to save to cloud: " + error.message);
    }
  };

  const deleteEssay = async (id: string) => {
    setEssays(prev => prev.filter(e=>e.id!==id));
    if (isSupabase && supabase) await supabase.from('essays').delete().eq('id', id);
  };

  const updateEssay = async (e: Essay) => {
    setEssays(prev => prev.map(x=> x.id===e.id ? e : x));
    if (isSupabase && supabase) {
      const row = essayToRow(e);
      await supabase.from('essays').update(row).eq('id', e.id);
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setUserEmail(null);
    setIsLifetime(false);
    try { localStorage.removeItem('oooii_lifetime'); } catch {}
  };

  const handleAuth = (u: any) => {
    setUser(u);
    setUserEmail(u?.email || null);
  };

  const handleSubscribed = () => {
    setIsLifetime(true);
    try { localStorage.setItem('oooii_lifetime','true'); } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6efe2] flex items-center justify-center">
        <p className="serif-head text-[20px]">Loading library...</p>
      </div>
    );
  }

  if (view==='reading' && currentEssay) {
    return (
      <>
        <BookReader 
          essay={currentEssay} 
          allEssays={sortedEssays}
          isLiked={!!likes[currentEssay.id]}
          onLike={()=>handleLike(currentEssay.id)}
          onBack={()=>setView('home')}
          onNext={()=>{ const i=sortedEssays.findIndex(x=>x.id===currentEssay.id); if(i<sortedEssays.length-1) openEssay(sortedEssays[i+1].id); }}
          onPrev={()=>{ const i=sortedEssays.findIndex(x=>x.id===currentEssay.id); if(i>0) openEssay(sortedEssays[i-1].id); }}
          onMarkUnread={()=>{ setReadHistory(prev=>prev.filter(x=>x!==currentEssay.id)); setView('home'); }}
        />
        {showPaywall && (
          <AuthPaywall 
            freePicks={freePicks.length}
            onClose={()=>setShowPaywall(false)}
            onSubscribed={handleSubscribed}
            onAuth={handleAuth}
            currentUserEmail={userEmail}
          />
        )}
      </>
    );
  }

  const handleAdminLogin = async () => {
    setAdminError("");
    setAdminChecking(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassInput })
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setIsAdminAuthed(true);
        try { sessionStorage.setItem('oooii_admin_authed', 'true'); } catch {}
        setAdminPassInput("");
      } else {
        setAdminError(data.error || 'Wrong password');
      }
    } catch {
      setAdminError('Login failed');
    }
    setAdminChecking(false);
  };

  if (view==='admin') {
    if (!isAdminAuthed) {
      return (
        <div className="min-h-screen bg-[#f6efe2]">
          <Header freePicks={freePicks} isLifetime={isLifetime} onNav={(v)=>setView(v as any)} userEmail={userEmail} onSignOut={handleSignOut} onSignInClick={()=>setShowPaywall(true)} />
          <div className="max-w-[400px] mx-auto px-4 py-20">
            <button onClick={()=>setView('home')} className="mb-6 px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase">← Back</button>
            <div className="paper rounded-[16px] border border-[#e9ddd0] p-6">
              <h2 className="serif-head text-[24px] font-bold">Admin Login</h2>
              <input type="password" value={adminPassInput} onChange={e=>setAdminPassInput(e.target.value)} onKeyDown={e=> e.key==='Enter' && handleAdminLogin()} placeholder="Admin password" className="mt-4 w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />
              {adminError && <p className="mt-2 text-[11px] text-red-600">{adminError}</p>}
              <button onClick={handleAdminLogin} disabled={adminChecking} className="mt-4 w-full py-3 rounded-full bg-[#1a1a1a] text-white text-[12px] uppercase">Unlock Admin</button>
            </div>
          </div>
          <Footer onNav={setView} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-[#f6efe2]">
        <Header freePicks={freePicks} isLifetime={isLifetime} onNav={(v)=>setView(v as any)} userEmail={userEmail} onSignOut={handleSignOut} onSignInClick={()=>setShowPaywall(true)} />
        <div className="max-w-[900px] mx-auto px-4">
          <div className="flex gap-2">
            <button onClick={()=>setView('home')} className="mt-4 px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase">← Back</button>
            <button onClick={()=>{ setIsAdminAuthed(false); try{ sessionStorage.removeItem('oooii_admin_authed'); }catch{} }} className="mt-4 px-4 py-2 rounded-full border bg-[#fdf6ec] text-[11px] uppercase">Lock</button>
          </div>
        </div>
        <AdminPanel essays={essays} onAdd={addEssay} onDelete={deleteEssay} onUpdate={updateEssay} />
        <Footer onNav={setView} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe2]">
      <Header freePicks={freePicks} isLifetime={isLifetime} onNav={(v)=>setView(v as any)} userEmail={userEmail} onSignOut={handleSignOut} onSignInClick={()=>setShowPaywall(true)} />
      <div className="max-w-[1180px] mx-auto px-4 py-8">
        {todayEssay && (
          <div className="mb-10">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#c9a86a] font-bold">Today Chapter • Newest First</p>
            <div onClick={()=>openEssay(todayEssay.id)} className="mt-3 paper rounded-[22px] overflow-hidden border border-[#c9a86a]/30 flex flex-col md:flex-row book-shadow cursor-pointer group">
              <img src={todayEssay.image} alt={todayEssay.title} className="md:w-1/2 h-[320px] md:h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-700" />
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 rounded-full bg-[#c9a86a] text-white text-[10px] uppercase">NEW TODAY • {todayEssay.date}</span>
                <h2 className="serif-head text-[34px] leading-[1.1] font-bold mt-4">{todayEssay.title}</h2>
                <p className="text-[14px] text-[#6b5a4a] mt-3">{todayEssay.excerpt}</p>
                <button className="mt-6 px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase w-fit">Read Today →</button>
              </div>
            </div>
          </div>
        )}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <h3 className="serif-head text-[22px] font-bold">Library • {filtered.length} chapters</h3>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={()=>setFilter('all')} className={`px-4 py-2 rounded-full text-[11px] uppercase border ${filter==='all'?'bg-[#1a1a1a] text-white':'bg-[#fdf6ec] border-[#e9ddd0]'}`}>All</button>
            <button onClick={()=>setFilter('unread')} className={`px-4 py-2 rounded-full text-[11px] uppercase border ${filter==='unread'?'bg-[#1a1a1a] text-white':'bg-[#fdf6ec] border-[#e9ddd0]'}`}>Unread</button>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="ml-2 px-4 py-2 rounded-full border border-[#e9ddd0] bg-[#fdf6ec] text-[11px] w-[180px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(essay => (
            <EssayCard key={essay.id} essay={essay} isRead={readHistory.includes(essay.id)} isNew={Date.now()-essay.createdAt < 72*3600*1000} isLiked={!!likes[essay.id]} likeCount={likeCounts[essay.id] || essay.likes} onOpen={()=>openEssay(essay.id)} onLike={()=>handleLike(essay.id)} />
          ))}
        </div>
      </div>
      <Footer onNav={setView} />
      {showPaywall && <AuthPaywall freePicks={freePicks.length} onClose={()=>setShowPaywall(false)} onSubscribed={handleSubscribed} onAuth={handleAuth} currentUserEmail={userEmail} />}
    </div>
  );
}
