"use client";
import { useState } from "react";
import { Essay } from "@/lib/types";
import { supabase } from "@/lib/supabaseClient";

function compressToWebP(file: File, maxWidth = 1200, quality = 0.78): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas failed')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Compress failed'));
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

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
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadMsg(`Compressing ${ (file.size/1024/1024).toFixed(2)}MB → WebP...`);
    try {
      const blob = await compressToWebP(file, 1200, 0.78);
      const kb = (blob.size / 1024).toFixed(0);
      setUploadMsg(`Compressed to ${kb}KB WebP, uploading to Supabase...`);

      if (supabase) {
        const fileName = `${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.webp`;
        const { error: uploadError } = await supabase.storage.from('essay-images').upload(fileName, blob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) {
          console.error(uploadError);
          // Fallback to base64 if bucket not created yet
          setUploadMsg(`Storage upload failed (${uploadError.message}), using local preview. Create bucket essay-images.`);
          const reader = new FileReader();
          reader.onload = () => setImage(reader.result as string);
          reader.readAsDataURL(file);
          setUploading(false);
          return;
        }
        const { data } = supabase.storage.from('essay-images').getPublicUrl(fileName);
        setImage(data.publicUrl);
        setUploadMsg(`✓ Uploaded ${kb}KB WebP CDN URL`);
      } else {
        // No supabase configured, use base64 preview
        const url = URL.createObjectURL(blob);
        setImage(url);
        setUploadMsg(`✓ Compressed to ${kb}KB (local, no Supabase configured)`);
      }
    } catch (e: any) {
      console.error(e);
      setUploadMsg(`Compress failed: ${e.message}, using original`);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
    setUploading(false);
    setTimeout(()=>setUploadMsg(""), 4000);
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
      <h2 className="serif-head text-[28px] font-bold">Admin — Auto-Compress WebP Upload</h2>
      <p className="text-[13px] text-[#6b5a4a] mt-1">Drop 5MB phone photo → auto-compress to ~200KB WebP → upload to Supabase Storage CDN → newest first for 1000s.</p>

      <div className="mt-6 paper rounded-[16px] border border-[#e9ddd0] p-5 space-y-4">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Essay Title" className="w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />
        <input value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Image caption (e.g. Morning light)" className="w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <label className={`block w-full px-4 py-3 rounded-[10px] border-2 border-dashed text-center cursor-pointer ${uploading?'bg-[#f5efe0] border-[#c9a86a]':'bg-[#fdf6ec] border-[#e9ddd0] hover:border-[#c9a86a]'}`}>
              <span className="text-[12px]">{uploading ? 'Compressing & Uploading...' : '📸 Drop image or Click to upload (5MB → 200KB WebP)'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e=> e.target.files && handleImageUpload(e.target.files[0])} disabled={uploading} />
            </label>
            {uploadMsg && <p className="mt-2 text-[11px] text-[#6b5a4a]">{uploadMsg}</p>}
          </div>
          <input value={image} onChange={e=>setImage(e.target.value)} placeholder="Or paste image URL (CDN)" className="flex-1 px-4 py-2 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec] h-fit" />
        </div>
        {image && <img src={image} alt="preview" className="w-full h-64 object-cover rounded-[10px] border" />}

        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Write your motivational essay here...\n\nNew paragraph = blank line" rows={8} className="w-full px-4 py-3 rounded-[10px] border border-[#e9ddd0] bg-[#fdf6ec]" />

        <div className="flex gap-3 flex-wrap">
          <button onClick={handleSave} disabled={uploading} className="px-6 py-3 rounded-full bg-[#1a1a1a] text-white text-[12px] uppercase tracking-[0.16em] disabled:opacity-50">{editingId ? 'Update Essay' : 'Publish — Auto WebP → Top'}</button>
          <button onClick={exportJson} className="px-6 py-3 rounded-full border border-[#e9ddd0] bg-[#f5efe0] text-[12px] uppercase">Export JSON</button>
        </div>
        <p className="text-[10px] text-[#9a8470]">Bucket must exist: Supabase → Storage → New bucket → Name: essay-images → Public ON. Then run storage SQL.</p>
      </div>

      <div className="mt-8">
        <h3 className="font-bold">All Essays ({essays.length}) — newest first</h3>
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
