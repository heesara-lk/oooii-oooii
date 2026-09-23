"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
type Props = {
  freePicks: number;
  onClose: () => void;
  onSubscribed: () => void;
  onAuth: (user: any) => void;
  currentUserEmail?: string | null;
};
export function AuthPaywall({ freePicks, onClose, onSubscribed, onAuth, currentUserEmail }: Props) {
  const [mode, setMode] = useState<'otp_email'|'otp_verify'|'pay'>('otp_email');
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [hasAccount, setHasAccount] = useState(!!currentUserEmail);
  useEffect(() => {
    if (currentUserEmail) { setHasAccount(true); if (freePicks >= 5) setMode('pay'); }
    else { setHasAccount(false); setMode('otp_email'); }
    if (currentUserEmail && freePicks >= 5) setMode('pay');
  }, [currentUserEmail, freePicks]);
  const handleSendOtp = async () => {
    setErr(""); setMsg(""); setLoading(true);
    if (!supabase) { setErr("Supabase not configured"); setLoading(false); return; }
    if (!email.includes('@')) { setErr("Valid email required"); setLoading(false); return; }
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined, shouldCreateUser: true } });
      if (error) throw error;
      setMsg(`OTP sent to ${email}`);
      setMode('otp_verify');
    } catch (e:any) { setErr(e.message); }
    setLoading(false);
  };
  const handleVerifyOtp = async () => {
    setErr(""); setMsg(""); setLoading(true);
    if (!supabase) { setErr("Supabase not configured"); setLoading(false); return; }
    if (otp.length < 6) { setErr("6-digit OTP required"); setLoading(false); return; }
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (error) throw error;
      if (data.session?.user) {
        onAuth(data.session.user);
        setHasAccount(true);
        setMsg("Verified! 3 more free reads");
        try { await supabase.from('profiles').update({ free_reads_used: freePicks }).eq('id', data.session.user.id); } catch {}
        if (freePicks >= 5) setMode('pay'); else { onClose(); }
      }
    } catch (e:any) { setErr("OTP invalid: " + e.message); }
    setLoading(false);
  };
  const handleMockPayment = async () => {
    setErr(""); setLoading(true);
    if (!supabase) { setErr("Supabase not configured"); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Create account first"); setMode('otp_email'); setLoading(false); return; }
    const { error } = await supabase.from('profiles').update({ is_lifetime: true }).eq('id', user.id);
    if (error) { setErr(error.message); setLoading(false); return; }
    try { localStorage.setItem('oooii_lifetime','true'); } catch {}
    onSubscribed(); onClose(); setLoading(false);
  };
  const isBefore = freePicks >= 2 && freePicks < 5 && !hasAccount;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur">
      <div className="paper rounded-[20px] border border-[#e9ddd0] p-6 max-w-[440px] w-full book-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="serif-head text-[22px] font-bold leading-[1.1]">{isBefore ? `You read ${freePicks}/2 free` : `You read ${freePicks}/5 free`}</h3>
            <p className="text-[12px] text-[#6b5a4a] mt-2">{isBefore ? "Step 1: OTP account to get 3 more free" : "Step 2: Unlock lifetime - $29"}</p>
            {currentUserEmail && <p className="text-[11px] text-green-700 mt-1">Signed in as {currentUserEmail}</p>}
          </div>
          <button onClick={onClose} className="ml-4 text-[11px] uppercase text-[#9a8470]">X</button>
        </div>
        {mode === 'otp_email' && (
          <>
            <div className="mt-5 p-3 rounded-[12px] bg-blue-50 border border-blue-200">
              <p className="text-[12px] font-bold text-blue-800">Email OTP - same as heesara.lk</p>
            </div>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" className="mt-4 w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec] text-[13px]" />
            {err && <p className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded">{err}</p>}
            {msg && <p className="mt-2 text-[11px] text-green-700 bg-green-50 p-2 rounded">{msg}</p>}
            <button onClick={handleSendOtp} disabled={loading} className="mt-4 w-full py-3 rounded-full bg-[#1a1a1a] text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50">{loading ? 'Sending...' : 'Send OTP Code'}</button>
          </>
        )}
        {mode === 'otp_verify' && (
          <>
            <div className="mt-5 p-3 rounded-[12px] bg-blue-50 border border-blue-200">
              <p className="text-[12px] font-bold text-blue-800">Check email: {email}</p>
            </div>
            <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="123456" maxLength={6} className="mt-4 w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec] text-[18px] tracking-widest text-center" />
            {err && <p className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded">{err}</p>}
            {msg && <p className="mt-2 text-[11px] text-green-700 bg-green-50 p-2 rounded">{msg}</p>}
            <button onClick={handleVerifyOtp} disabled={loading} className="mt-4 w-full py-3 rounded-full bg-[#2D8A4E] text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50">{loading ? 'Verifying...' : 'Verify OTP'}</button>
            <div className="flex gap-2 mt-3">
              <button onClick={()=>setMode('otp_email')} className="flex-1 py-2 rounded-full border border-[#e9ddd0] bg-[#fdf6ec] text-[11px] uppercase">Change Email</button>
              <button onClick={handleSendOtp} disabled={loading} className="flex-1 py-2 rounded-full border border-blue-200 bg-blue-50 text-[11px] uppercase">Resend OTP</button>
            </div>
          </>
        )}
        {mode === 'pay' && (
          <>
            <div className="mt-5 p-4 rounded-[12px] bg-[#fdf6ec] border border-[#e9ddd0]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#c9a86a] font-bold">5 free used</p>
              <h4 className="serif-head text-[18px] font-bold mt-1">Unlock Lifetime - $29</h4>
            </div>
            {err && <p className="mt-2 text-[11px] text-red-600 bg-red-50 p-2 rounded">{err}</p>}
            <button onClick={handleMockPayment} disabled={loading} className="mt-4 w-full py-3 rounded-full bg-[#c9a86a] text-white text-[11px] uppercase tracking-[0.16em] disabled:opacity-50">{loading ? 'Unlocking...' : 'Unlock Lifetime $29 - Demo'}</button>
          </>
        )}
      </div>
    </div>
  );
}
