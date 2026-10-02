import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
export async function GET() {
  try {
    if (!supabase) return NextResponse.json({ ok: true, msg: 'no supabase' });
    const { error } = await supabase.from('essays').select('id').limit(1);
    if (error) return NextResponse.json({ ok: false, error: error.message, time: new Date().toISOString() });
    return NextResponse.json({ ok: true, time: new Date().toISOString(), msg: 'Supabase pinged' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown', time: new Date().toISOString() });
  }
}
export const dynamic = 'force-dynamic';
