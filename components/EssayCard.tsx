"use client";
import { Essay } from "@/lib/types";

export function EssayCard({ 
  essay, 
  isRead, 
  isNew,
  isFreePick,
  onOpen 
}: { 
  essay: Essay; 
  isRead: boolean; 
  isNew: boolean;
  isFreePick: boolean;
  onOpen: () => void;
}) {
  return (
    <div 
      onClick={onOpen}
      className={`group cursor-pointer paper rounded-[18px] overflow-hidden border book-shadow hover:shadow-[0_24px_40px_-18px_rgba(0,0,0,0.4)] transition-all ${isRead ? 'opacity-[0.85]' : ''} border-[#e9ddd0]`}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img src={essay.image} alt={essay.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
        <div className="absolute top-3 left-3 flex gap-2">
          {isNew && <span className="px-2.5 py-1 rounded-full bg-[#c9a86a] text-white text-[9px] tracking-[0.18em] uppercase font-bold shadow">NEW</span>}
          {!isRead && <span className="px-2.5 py-1 rounded-full bg-[#1a1a1a] text-[#fdf6ec] text-[9px] tracking-[0.16em] uppercase">UNREAD</span>}
          {isRead && <span className="px-2.5 py-1 rounded-full bg-[#f5efe0] border border-[#e9ddd0] text-[#9a8470] text-[9px] tracking-[0.16em] uppercase">✓ READ</span>}
        </div>
        {isFreePick && <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#c9a86a]/90 flex items-center justify-center text-white text-[10px]">♥</div>}
      </div>
      <div className="p-5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a86a]">{essay.date} • {essay.readTime}</p>
        <h3 className="serif-head text-[19px] leading-[1.2] font-bold mt-1 text-[#1a1a1a] group-hover:text-[#4a3728]">{essay.title}</h3>
        <p className="text-[13px] leading-[1.5] text-[#6b5a4a] mt-2 line-clamp-2">{essay.excerpt}</p>
        <div className="flex items-center justify-between mt-4">
          <span className="text-[12px] text-[#9a8470]">♥ {essay.likes}</span>
          <span className="text-[11px] tracking-[0.14em] uppercase text-[#4a3728] font-semibold group-hover:tracking-[0.18em] transition-all">Read →</span>
        </div>
      </div>
    </div>
  );
}
