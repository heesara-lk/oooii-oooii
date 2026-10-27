import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || (!anon && !service)) {
    return NextResponse.json({ok:false, error:"MISSING ENV - check Vercel Production env vars"}, {status:500})
  }
  try {
    const supabase = createClient(url, service || anon!)
    const r1 = await supabase.from('essays').select('id').limit(1)
    const r2 = await supabase.from('profiles').select('id').limit(1)
    if (r1.error) throw r1.error
    return NextResponse.json({ok:true, time:new Date().toISOString(), msg:"Supabase pinged essays+profiles", profilesError: r2.error || null})
  } catch (e:any) {
    return NextResponse.json({ok:false, error:e.message}, {status:500})
  }
}