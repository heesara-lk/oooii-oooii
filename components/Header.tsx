"use client";
export function Header({ freePicks, isLifetime, onNav }: { freePicks: string[]; isLifetime: boolean; onNav: (v: string)=>void }) {
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-[#f6efe2]/80 border-b border-[#e9ddd0]">
      <div className="max-w-[1180px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="logo text-[22px] font-bold">Oooii Oooii</h1>
          <span className="hidden md:inline text-[10px] tracking-[0.2em] uppercase text-[#9a8470]">Daily Book • Newest First</span>
        </div>
        <div className="flex items-center gap-3">
          {!isLifetime ? <span className="text-[11px] px-3 py-1 rounded-full bg-[#f5efe0] border border-[#e9ddd0]">{freePicks.length}/5 free picks used</span> : <span className="text-[11px] px-3 py-1 rounded-full bg-[#1a1a1a] text-white">Lifetime Member</span>}
          <button onClick={()=>onNav('admin')} className="text-[11px] uppercase tracking-[0.16em]">Admin</button>
        </div>
      </div>
    </header>
  );
}
