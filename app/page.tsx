"use client";
import { useState, useEffect, useMemo } from "react";
import { Essay } from "@/lib/types";
import { SAMPLE_ESSAYS } from "@/lib/sampleData";
import { EssayCard } from "@/components/EssayCard";
import { BookReader } from "@/components/BookReader";
import { AdminPanel } from "@/components/AdminPanel";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

type View = 'home'|'reading'|'admin';

// DB row type
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
  // Admin auth
  const [isAdminAuthed, setIsAdminAuthed] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminChecking, setAdminChecking] = useState(false);

  useEffect(() => {
    const load = async () => {
      const configured = isSupabaseConfigured();
      setIsSupabase(!!configured);

      try {
        setFreePicks(JSON.parse(localStorage.getItem('oooii_free_picks') || '[]'));
        setReadHistory(JSON.parse(localStorage.getItem('oooii_read_history') || '[]'));
        setLikes(JSON.parse(localStorage.getItem('oooii_likes') || '{}'));
        setLikeCounts(JSON.parse(localStorage.getItem('oooii_like_counts') || '{}'));
        setIsLifetime(localStorage.getItem('oooii_lifetime') === 'true');
      } catch {}

      if (configured && supabase) {
        const { data, error } = await supabase
          .from('essays')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped = (data as EssayRow[]).map(rowToEssay);
          setEssays(mapped);
        } else if (!error && data && data.length === 0) {
          console.log("Supabase empty, using samples.");
          try {
            const custom = JSON.parse(localStorage.getItem('oooii_essays_custom') || '[]');
            if (custom.length) {
              setEssays(prev => [...custom, ...prev].sort((a,b)=>b.createdAt-a.createdAt));
            }
          } catch {}
        } else {
          console.error("Supabase fetch error:", error);
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

  useEffect(() => { localStorage.setItem('oooii_free_picks', JSON.stringify(freePicks)); }, [freePicks]);
  useEffect(() => { localStorage.setItem('oooii_read_history', JSON.stringify(readHistory)); }, [readHistory]);
  useEffect(() => { localStorage.setItem('oooii_likes', JSON.stringify(likes)); }, [likes]);
  useEffect(() => { localStorage.setItem('oooii_like_counts', JSON.stringify(likeCounts)); }, [likeCounts]);

  useEffect(() => {
    try {
      if (sessionStorage.getItem('oooii_admin_authed') === 'true') {
        setIsAdminAuthed(true);
      }
    } catch {}
  }, []);

  const sortedEssays = useMemo(() => [...essays].sort((a,b)=>b.createdAt-a.createdAt), [essays]);
  const todayEssay = sortedEssays[0];
  const unreadEssays = sortedEssays.filter(e => !readHistory.includes(e.id));
  const newEssays = sortedEssays.filter(e => Date.now() - e.createdAt < 72*3600*1000);

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
      if (!user && !isLifetime && freePicks.length >= 5) { setShowPaywall(true); return; } // fallback if not logged yet but reached 5 via localStorage bypass attempt
    }
    if (!alreadyPicked && !isLifetime) {
      setFreePicks(prev => [...prev, id]);
      // Update server count if logged in
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
      if (error) {
        console.error("Supabase insert error:", error);
        alert("Failed to save to cloud: " + error.message);
      }
    } else {
      try {
        const existing = JSON.parse(localStorage.getItem('oooii_essays_custom')||'[]');
        localStorage.setItem('oooii_essays_custom', JSON.stringify([e, ...existing]));
      } catch {}
    }
  };

  const deleteEssay = async (id: string) => {
    setEssays(prev => prev.filter(e=>e.id!==id));
    if (isSupabase && supabase) {
      await supabase.from('essays').delete().eq('id', id);
    } else {
      try {
        const existing = JSON.parse(localStorage.getItem('oooii_essays_custom')||'[]');
        localStorage.setItem('oooii_essays_custom', JSON.stringify(existing.filter((e:Essay)=>e.id!==id)));
      } catch {}
    }
  };

  const updateEssay = async (e: Essay) => {
    setEssays(prev => prev.map(x=> x.id===e.id ? e : x));
    if (isSupabase && supabase) {
      const row = essayToRow(e);
      await supabase.from('essays').update(row).eq('id', e.id);
    } else {
      try {
        const existing = JSON.parse(localStorage.getItem('oooii_essays_custom')||'[]');
        const updated = existing.map((x:Essay)=> x.id===e.id ? e : x);
        localStorage.setItem('oooii_essays_custom', JSON.stringify(updated));
      } catch {}
    }
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur">
            <div className="paper rounded-[20px] border border-[#e9ddd0] p-8 max-w-[440px] text-center book-shadow">
              <h3 className="serif-head text-[26px] font-bold">You have chosen 5 free chapters</h3>
              <p className="text-[13px] text-[#6b5a4a] mt-2">Unlock lifetime forever — one payment, daily newest first.</p>
              <button onClick={()=>{ setIsLifetime(true); localStorage.setItem('oooii_lifetime','true'); setShowPaywall(false); }} className="mt-5 w-full py-3 rounded-full bg-[#1a1a1a] text-white text-[12px] uppercase">Unlock Lifetime $29 — Demo</button>
              <button onClick={()=>setShowPaywall(false)} className="mt-3 text-[11px] uppercase text-[#9a8470]">Close</button>
            </div>
          </div>
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
    } catch (e) {
      setAdminError('Login failed — check ADMIN_PASSWORD in Vercel');
    }
    setAdminChecking(false);
  };

  if (view==='admin') {
    if (!isAdminAuthed) {
      return (
        <div className="min-h-screen bg-[#f6efe2]">
          <Header freePicks={freePicks} isLifetime={isLifetime} onNav={(v)=>setView(v as any)} />
          <div className="max-w-[400px] mx-auto px-4 py-20">
            <button onClick={()=>setView('home')} className="mb-6 px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase">← Back to Library</button>
            <div className="paper rounded-[16px] border border-[#e9ddd0] p-6">
              <h2 className="serif-head text-[24px] font-bold">Admin Login</h2>
              <p className="text-[12px] text-[#6b5a4a] mt-1">Only you can publish. Enter your admin password set in Vercel.</p>
              <input
                type="password"
                value={adminPassInput}
                onChange={e=>setAdminPassInput(e.target.value)}
                onKeyDown={e=> e.key==='Enter' && handleAdminLogin()}
                placeholder="Admin password"
                className="mt-4 w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]"
              />
              {adminError && <p className="mt-2 text-[11px] text-red-600">{adminError}</p>}
              <button onClick={handleAdminLogin} disabled={adminChecking} className="mt-4 w-full py-3 rounded-full bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.16em] disabled:opacity-50">
                {adminChecking ? 'Checking...' : 'Unlock Admin'}
              </button>
              <p className="mt-3 text-[10px] text-[#9a8470]">Set ADMIN_PASSWORD in Vercel → Settings → Environment Variables (Secret, not NEXT_PUBLIC_)</p>
            </div>
          </div>
          <Footer onNav={setView} />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#f6efe2]">
        <Header freePicks={freePicks} isLifetime={isLifetime} onNav={(v)=>setView(v as any)} />
        <div className="max-w-[900px] mx-auto px-4">
          <div className="flex gap-2">
            <button onClick={()=>setView('home')} className="mt-4 px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase">← Back to Library</button>
            <button onClick={()=>{ setIsAdminAuthed(false); try{ sessionStorage.removeItem('oooii_admin_authed'); }catch{} }} className="mt-4 px-4 py-2 rounded-full border border-[#e9ddd0] bg-[#fdf6ec] text-[11px] uppercase">Lock Admin</button>
          </div>
          <div className={`mt-3 p-3 rounded-[12px] border text-[11px] ${isSupabase ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
            {isSupabase ? '✓ Connected to Supabase — uploads go live to all readers worldwide' : '⚠ Local mode — add Supabase keys in Vercel to make uploads live for everyone (see README)'}
          </div>
        </div>
        <AdminPanel essays={essays} onAdd={addEssay} onDelete={deleteEssay} onUpdate={updateEssay} />
        <Footer onNav={setView} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe2]">
      <Header freePicks={freePicks} isLifetime={isLifetime} onNav={(v)=>setView(v as any)} />
      
      <div className="max-w-[1180px] mx-auto px-4 py-8">
        {todayEssay && (
          <div className="mb-10">
            <p className="text-[11px] tracking-[0.28em] uppercase text-[#c9a86a] font-bold">Today Chapter • Newest First {isSupabase ? '• Live Cloud' : '• Local Demo'}</p>
            <div onClick={()=>openEssay(todayEssay.id)} className="mt-3 paper rounded-[22px] overflow-hidden border border-[#c9a86a]/30 flex flex-col md:flex-row book-shadow cursor-pointer group">
              <img src={todayEssay.image} alt={todayEssay.title} className="md:w-1/2 h-[320px] md:h-[420px] object-cover group-hover:scale-[1.02] transition-transform duration-700" />
              <div className="md:w-1/2 p-8 flex flex-col justify-center">
                <span className="inline-block px-3 py-1 rounded-full bg-[#c9a86a] text-white text-[10px] uppercase tracking-[0.16em]">NEW TODAY • {todayEssay.date}</span>
                <h2 className="serif-head text-[34px] leading-[1.1] font-bold mt-4">{todayEssay.title}</h2>
                <p className="text-[14px] text-[#6b5a4a] mt-3 leading-relaxed">{todayEssay.excerpt}</p>
                <button className="mt-6 px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase tracking-[0.16em] w-fit">Read Today Chapter →</button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10">
          <div className="flex items-center justify-between">
            <h3 className="serif-head text-[22px] font-bold">Unread For You • {unreadEssays.length} waiting</h3>
            <span className="text-[11px] text-[#9a8470]">{newEssays.length} NEW • {readHistory.length} READ</span>
          </div>
          {unreadEssays.length===0 ? <p className="mt-3 text-[13px] text-[#9a8470] p-4 rounded-[12px] bg-[#fdf6ec] border border-[#e9ddd0]">You are all caught up. Explore full library below.</p> : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {unreadEssays.slice(0,6).map(e=> (
                <EssayCard key={e.id} essay={{...e, likes: likeCounts[e.id] || e.likes}} isRead={false} isNew={Date.now()-e.createdAt<72*3600*1000} isFreePick={freePicks.includes(e.id)} onOpen={()=>openEssay(e.id)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <h3 className="serif-head text-[22px] font-bold">Full Library — Newest First</h3>
            <div className="flex gap-2">
              {(['all','unread','new','read'] as const).map(f=>(
                <button key={f} onClick={()=>setFilter(f)} className={`px-3 py-1.5 rounded-full text-[11px] uppercase border ${filter===f ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-[#fdf6ec] border-[#e9ddd0] text-[#6b5a4a]'}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search essays..." className="flex-1 px-4 py-2.5 rounded-full border border-[#e9ddd0] bg-[#fdf6ec] text-[13px]" />
            <span className="text-[11px] text-[#9a8470] py-2.5">{filtered.length} essays • sorted newest first</span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.slice(0,100).map(e=>(
              <EssayCard key={e.id} essay={{...e, likes: likeCounts[e.id] || e.likes}} isRead={readHistory.includes(e.id)} isNew={Date.now()-e.createdAt<72*3600*1000} isFreePick={freePicks.includes(e.id)} onOpen={()=>openEssay(e.id)} />
            ))}
          </div>
        </div>
      </div>

      <Footer onNav={setView} />

      {showPaywall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur">
          <div className="paper rounded-[20px] border border-[#e9ddd0] p-8 max-w-[440px] text-center book-shadow">
            <h3 className="serif-head text-[26px] font-bold">You have chosen 5 free chapters</h3>
            <p className="text-[13px] text-[#6b5a4a] mt-2">Free picks stay yours. Unlock lifetime — one payment $29, newest first forever.</p>
            <button onClick={()=>{ setIsLifetime(true); localStorage.setItem('oooii_lifetime','true'); setShowPaywall(false); }} className="mt-5 w-full py-3 rounded-full bg-[#1a1a1a] text-white text-[12px] uppercase">Unlock Lifetime $29 — Demo</button>
            <button onClick={()=>setShowPaywall(false)} className="mt-3 text-[11px] uppercase text-[#9a8470]">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
