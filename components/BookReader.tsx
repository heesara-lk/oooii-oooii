"use client";
import { Essay } from "@/lib/types";

export function BookReader({ 
  essay, 
  allEssays,
  isLiked,
  onLike,
  onBack,
  onNext,
  onPrev,
  onMarkUnread
}: { 
  essay: Essay;
  allEssays: Essay[];
  isLiked: boolean;
  onLike: () => void;
  onBack: () => void;
  onNext: () => void;
  onPrev: () => void;
  onMarkUnread: () => void;
}) {
  const idx = allEssays.findIndex(e => e.id === essay.id);
  const hasNext = idx < allEssays.length - 1;
  const hasPrev = idx > 0;

  return (
    <div className="min-h-screen bg-[#f6efe2] py-6 md:py-10 px-4">
      <div className="max-w-[1180px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="px-4 py-2 rounded-full bg-[#1a1a1a] text-[#fdf6ec] text-[11px] tracking-[0.16em] uppercase">← Back to Library</button>
          <div className="flex gap-2">
            <button disabled={!hasPrev} onClick={onPrev} className="px-4 py-2 rounded-full border border-[#e9ddd0] bg-[#fdf6ec] text-[11px] uppercase disabled:opacity-30">← Newer</button>
            <button disabled={!hasNext} onClick={onNext} className="px-4 py-2 rounded-full border border-[#e9ddd0] bg-[#fdf6ec] text-[11px] uppercase disabled:opacity-30">Older →</button>
          </div>
        </div>

        {/* BOOK CONTAINER - LEFT IMAGE RIGHT WRITING */}
        <div className="paper book-shadow rounded-[22px] overflow-hidden border border-[#e9ddd0] flex flex-col md:flex-row min-h-[72vh]">
          {/* LEFT HALF - IMAGE ONLY */}
          <div className="md:w-1/2 relative bg-[#efe6d6] book-page-left">
            <img src={essay.image} alt={essay.title} className="w-full h-[360px] md:h-full md:min-h-[600px] object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-[12px] italic">“{essay.caption}”</p>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-[1px] w-[2px] h-[84%] -translate-y-1/2 bg-gradient-to-b from-transparent via-[#c9a86a]/30 to-transparent" />
          </div>

          {/* RIGHT HALF - WRITING ONLY */}
          <div className="md:w-1/2 p-7 md:p-10 flex flex-col book-page-right overflow-auto max-h-[78vh]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] tracking-[0.28em] uppercase text-[#c9a86a] font-semibold">{essay.date} • {essay.readTime}</p>
                <h1 className="serif-head text-[32px] md:text-[38px] leading-[1.05] font-bold text-[#1a1a1a] mt-2">{essay.title}</h1>
              </div>
              <button onClick={onLike} className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${isLiked ? 'bg-[#c9a86a] border-[#c9a86a] text-white' : 'bg-[#f5efe0] border-[#e9ddd0] text-[#9a8470] hover:text-[#c9a86a]'}`}>♥</button>
            </div>

            <div className="mt-6 space-y-5 text-[15px] leading-[1.85] text-[#4a3728]">
              {essay.content.map((p,i) => (
                <p key={i} className={i===0 ? 'first-letter:text-[42px] first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:serif-head first-letter:text-[#1a1a1a]' : ''}>{p}</p>
              ))}
            </div>

            <div className="mt-auto pt-8 flex items-center justify-between border-t border-[#f0e6d6]">
              <button onClick={onMarkUnread} className="text-[11px] tracking-[0.16em] uppercase text-[#9a8470] hover:text-[#4a3728]">Mark as unread</button>
              <div className="flex gap-2">
                <button disabled={!hasPrev} onClick={onPrev} className="px-4 py-2 rounded-full bg-[#f5efe0] border border-[#e9ddd0] text-[11px] uppercase disabled:opacity-30">← Previous Chapter</button>
                <button disabled={!hasNext} onClick={onNext} className="px-4 py-2 rounded-full bg-[#1a1a1a] text-[#fdf6ec] text-[11px] uppercase tracking-[0.14em] disabled:opacity-30">Next Chapter →</button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-[11px] tracking-[0.2em] uppercase text-[#a08e7a]">Oooii Oooii • left image • right writing • no sidebar list</p>
      </div>
    </div>
  );
}
