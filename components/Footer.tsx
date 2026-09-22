"use client";
export function Footer({ onNav }: { onNav: (v: any)=>void }) {
  return (
    <footer className="mt-16 border-t border-[#e9ddd0] bg-[#fdf6ec]">
      <div className="max-w-[1180px] mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h4 className="logo text-[18px] font-bold">Oooii Oooii</h4>
          <p className="text-[12px] text-[#6b5a4a] mt-2 leading-relaxed">Daily motivational book by Manjula Upashantha. Newest first, unread tracking, left image right writing.</p>
        </div>
        <div>
          <h5 className="text-[11px] uppercase tracking-[0.2em] font-semibold">Explore</h5>
          <ul className="mt-3 space-y-2 text-[12px] text-[#6b5a4a]">
            <li><button onClick={()=>onNav('home')} className="hover:text-[#1a1a1a]">Library — Newest First</button></li>
            <li><a href="/payment" className="hover:text-[#1a1a1a]">Pricing & Lifetime</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-[11px] uppercase tracking-[0.2em] font-semibold">Legal</h5>
          <ul className="mt-3 space-y-2 text-[12px] text-[#6b5a4a]">
            <li><a href="/privacy" className="hover:text-[#1a1a1a]">Privacy Policy</a></li>
            <li><a href="/terms" className="hover:text-[#1a1a1a]">Terms of Service</a></li>
            <li><a href="/refund" className="hover:text-[#1a1a1a]">Refund Policy</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-[11px] uppercase tracking-[0.2em] font-semibold">Contact</h5>
          <ul className="mt-3 space-y-1 text-[12px] text-[#6b5a4a]">
            <li>support@oooii-oooii.com</li>
            <li>contact@oooii-oooii.com</li>
            <li>noreply@oooii-oooii.com (system)</li>
            <li className="pt-2"><a href="/contact" className="px-3 py-1 rounded-full bg-[#1a1a1a] text-white text-[11px]">Contact Form</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center py-4 border-t border-[#f0e6d6] text-[11px] text-[#a08e7a]">© 2026 Oooii Oooii • Dalugama, Sri Lanka • Built as real Next.js with page.tsx files</div>
    </footer>
  );
}
