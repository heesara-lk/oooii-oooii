"use client";
import { useState } from "react";
import { Essay } from "@/lib/types";

export function AdminPanel({ essays, onAdd, onDelete, onUpdate }: {
  essays: Essay[];
  onAdd: (e: Essay) => void;
  onDelete: (id: string) => void;
  onUpdate: (e: Essay) => void;
}) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!title || !content) return alert("Title and content required");
    const newEssay: Essay = {
      id: editingId || title.toLowerCase().replace(/\s+/g,'-') + '-' + Date.now(),
      title,
      caption: caption || 'A daily note',
      date: new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}),
      readTime: Math.max(2, Math.ceil(content.split(' ').length / 200)) + ' min',
      image: image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop',
      excerpt: content.slice(0,120) + '...',
      content: content.split('\n\n').filter(Boolean),
      likes: editingId ? (essays.find(e=>e.id===editingId)?.likes||0) : 0,
      createdAt: editingId ? (essays.find(e=>e.id===editingId)?.createdAt||Date.now()) : Date.now(),
    };
    if (editingId) onUpdate(newEssay); else onAdd(newEssay);
    setTitle(""); setCaption(""); setContent(""); setImage(""); setEditingId(null);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(essays, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='oooii-essays-backup.json'; a.click();
  };

  return (
    <div className="p-6 max-w-[900px] mx-auto">
      <h2 className="serif-head text-[28px] font-bold">Admin — Upload Daily (for 1000s)</h2>
      <p className="text-[13px] text-[#6b5a4a] mt-1">Newest always goes to first. Image can be upload or URL. Content: blank line = new paragraph.</p>

      <div className="mt-6 paper rounded-[16px] border border-[#e9ddd0] p-5 space-y-4">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Essay Title" className="w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />
        <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Image caption (e.g. Morning light)" className="w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />
        
        <div className="flex gap-3">
          <input type="file" accept="image/*" onChange={e=> e.target.files && handleImageUpload(e.target.files[0])} className="flex-1" />
          <input value={image} onChange={e=>setImage(e.target.value)} placeholder="Or paste image URL" className="flex-1 px-4 py-2 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />
        </div>
        {image && <img src={image} alt="preview" className="w-full h-48 object-cover rounded-[10px] border" />}

        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your motivational essay here...\n\nNew paragraph = blank line" rows={8} className="w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />

        <div className="flex gap-3">
          <button onClick={handleSave} className="px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.16em]">{editingId ? 'Update Essay' : 'Publish — Goes to Top (Newest First)'}</button>
          <button onClick={exportJson} className="px-6 py-3 rounded-full border border-[#e9ddd0] bg-[#f5efe0] text-[12px] uppercase">Export JSON (Backup for 1000s)</button>
          <label className="px-6 py-3 rounded-full border border-[#e9ddd0] bg-[#f5efe0] text-[12px] uppercase cursor-pointer">Import JSON
            <input type="file" accept=".json" className="hidden" onChange={e=>{
              const file = e.target.files?.[0]; if(!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  const data = JSON.parse(reader.result as string);
                  data.forEach((ess: any)=> onAdd(ess));
                  alert('Imported '+data.length+' essays');
                } catch(err){ alert('Invalid JSON') }
              };
              reader.readAsText(file);
            }} />
          </label>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-bold">All Essays ({essays.length}) — sorted newest first</h3>
        <div className="mt-3 space-y-2 max-h-[400px] overflow-auto">
          {essays.slice().sort((a,b)=>b.createdAt-a.createdAt).map(e=>(
            <div key={e.id} className="flex items-center justify-between p-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]">
              <div className="flex gap-3 items-center">
                <img src={e.image} className="w-12 h-12 rounded object-cover" />
                <div>
                  <p className="text-[13px] font-bold">{e.title}</p>
                  <p className="text-[11px] text-[#9a8470]">{new Date(e.createdAt).toLocaleDateString()} • ♥ {e.likes}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>{ setTitle(e.title); setCaption(e.caption); setContent(e.content.join('\n\n')); setImage(e.image); setEditingId(e.id); window.scrollTo({top:0,behavior:'smooth'}); }} className="text-[11px] px-3 py-1 rounded-full border">Edit</button>
                <button onClick={()=> onDelete(e.id)} className="text-[11px] px-3 py-1 rounded-full bg-[#1a1a1a] text-white">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
