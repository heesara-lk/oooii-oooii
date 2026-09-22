"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  freePicks: number;
  onClose: () => void;
  onSubscribed: () => void;
  onAuth: (user: any) => void;
};

export function AuthPaywall({ freePicks, onClose, onSubscribed, onAuth }: Props) {
  const [mode, setMode] = useState<'signup'|'signin'|'pay'>('signup');
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const handleSignup = async () => {
    setErr(""); setLoading(true);
    if (!supabase) { setErr("Supabase not configured"); setLoading(false); return; }
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) { setErr(error.message); setLoading(false); return; }
    // profile will be auto-created by trigger
    if (data.user) {
      onAuth(data.user);
      setMode('pay');
    }
    setLoading(false);
  };

  const handleSignin = async () => {
    setErr(""); setLoading(true);
    if (!supabase) { setErr("Supabase not configured"); setLoading(false); return; }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setLoading(false); return; }
    if (data.user) {
      onAuth(data.user);
      // check if already lifetime
      const { data: prof } = await supabase.from('profiles').select('is_lifetime').eq('id', data.user.id).single();
      if (prof?.is_lifetime) {
        onSubscribed();
        onClose();
      } else {
        setMode('pay');
      }
    }
    setLoading(false);
  };

  const handleMockPayment = async () => {
    setErr(""); setLoading(true);
    if (!supabase) { setErr("Supabase not configured"); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Please sign in first"); setLoading(false); setMode('signin'); return; }
    // Mock payment - mark as lifetime
    const { error } = await supabase.from('profiles').update({ is_lifetime: true }).eq('id', user.id);
    if (error) { setErr(error.message); setLoading(false); return; }
    // also set local flag for instant UX
    try { localStorage.setItem('oooii_lifetime', 'true'); } catch {}
    onSubscribed();
    onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur">
      <div className="paper rounded-[20px] border border-[#e9ddd0] p-6 max-w-[440px] w-full book-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="serif-head text-[24px] font-bold leading-[1.1]">You have read {freePicks} free chapters</h3>
            <p className="text-[12px] text-[#6b5a4a] mt-2">Create your Oooii Oooii account to continue reading. Every free reader becomes a subscriber.</p>
          </div>
          <button onClick={onClose} className="ml-4 text-[11px] uppercase text-[#9a8470]">✕</button>
        </div>

        {mode !== 'pay' && (
          <>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setMode('signup')} className={`px-4 py-2 rounded-full text-[11px] uppercase ${mode==='signup'?'bg-[#1a1a1a] text-white':'bg-[#fdf6ec] border border-[#e9ddd0]'}`}>Create Account</button>
              <button onClick={()=>setMode('signin')} className={`px-4 py-2 rounded-full text-[11px] uppercase ${mode==='signin'?'bg-[#1a1a1a] text-white':'bg-[#fdf6ec] border border-[#e9ddd0]'}`}>Sign In</button>
            </div>

            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="mt-4 w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec] text-[13px]" />
            <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password (min 6)" type="password" className="mt-3 w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec] text-[13px]" />
            {err && <p className="mt-2 text-[11px] text-red-600">{err}</p>}

            <button onClick={mode==='signup'?handleSignup:handleSignin} disabled={loading} className="mt-4 w-full py-3 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50">
              {loading ? 'Please wait...' : mode==='signup' ? 'Create Account & Continue' : 'Sign In & Continue'}
            </button>
            <p className="mt-3 text-[10px] text-[#9a8470] text-center">Free to create account. No credit card yet. After account, unlock lifetime.</p>
          </>
        )}

        {mode === 'pay' && (
          <>
            <div className="mt-5 p-4 rounded-[12px] bg-[#fdf6ec] border border-[#e9ddd0]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#c9a86a] font-bold">Subscriber Access</p>
              <h4 className="serif-head text-[18px] font-bold mt-1">Unlock Lifetime — $29 one time</h4>
              <ul className="mt-2 text-[12px] text-[#6b5a4a] list-disc pl-4 space-y-1">
                <li>All past & future daily chapters</li>
                <li>Newest first every day</li>
                <li>Your account on any device</li>
              </ul>
            </div>
            {err && <p className="mt-2 text-[11px] text-red-600">{err}</p>}
            <button onClick={handleMockPayment} disabled={loading} className="mt-4 w-full py-3 rounded-full bg-[#c9a86a] text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50">
              {loading ? 'Unlocking...' : 'Unlock Lifetime $29 — Demo Payment'}
            </button>
            <p className="mt-2 text-[10px] text-[#9a8470] text-center">Demo: marks your Supabase profile as lifetime. Replace with Stripe later.</p>
            <button onClick={()=>setMode('signin')} className="mt-3 w-full text-[11px] uppercase text-[#9a8470]">Switch account</button>
          </>
        )}
      </div>
    </div>
  );
}
