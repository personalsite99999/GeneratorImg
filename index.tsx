import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// Initialize Lucide icons helper
declare const lucide: any;

const AspectRatios = [
  { id: '1:1', label: '1:1', sub: 'Kotak', icon: 'square' },
  { id: '4:5', label: '4:5', sub: 'Portrait', icon: 'rectangle-vertical' },
  { id: '16:9', label: '16:9', sub: 'Lebar', icon: 'rectangle-horizontal' },
  { id: '9:16', label: '9:16', sub: 'Story', icon: 'smartphone' },
];

const LoadingMessages = [
  "Lagi nge-scan vibes JOHAN mode...",
  "Ekstrak pola neon magenta...",
  "Lagi ngeracik prompt sama Gemini...",
  "Nanobanana lagi ngerender pixel...",
  "Poles dikit lagi biar gokil...",
  "Karya lu hampir mateng bos..."
];

// SVG Logo Component with Techno Graphic Animations
const JohanLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 400 400" className={`${className} select-none`}>
    <defs>
      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00f3ff" />
        <stop offset="50%" stopColor="#ff00ff" />
        <stop offset="100%" stopColor="#00f3ff" />
      </linearGradient>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00f3ff" />
        <stop offset="100%" stopColor="#9d00ff" />
      </linearGradient>
      <filter id="neonGlow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="glitchFilter">
        <feOffset dx="2" dy="0" in="SourceGraphic" result="offset1" />
        <feFlood floodColor="#ff00ff" result="color1" />
        <feComposite in="color1" in2="offset1" operator="in" result="comp1" />
        <feOffset dx="-2" dy="0" in="SourceGraphic" result="offset2" />
        <feFlood floodColor="#00f3ff" result="color2" />
        <feComposite in="color2" in2="offset2" operator="in" result="comp2" />
        <feMerge>
          <feMergeNode in="comp1" />
          <feMergeNode in="comp2" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    
    {/* Background Circle for contrast */}
    <circle cx="200" cy="200" r="185" fill="black" fillOpacity="0.4" />

    {/* Rotating Outer Rings */}
    <g className="animate-spin-slow-cw">
      <circle cx="200" cy="200" r="180" fill="none" stroke="url(#ringGrad)" strokeWidth="4" strokeDasharray="60 30" filter="url(#neonGlow)" />
    </g>
    <g className="animate-spin-slow-ccw">
      <circle cx="200" cy="200" r="170" fill="none" stroke="#ff00ff" strokeWidth="2" strokeDasharray="10 20" opacity="0.6" />
    </g>
    
    {/* Main Name: JOHAN with Glitch Effect */}
    <g className="techno-glitch">
      <text 
        x="50%" 
        y="45%" 
        textAnchor="middle" 
        fill="url(#textGrad)" 
        className="font-black"
        style={{ fontSize: '95px', fontFamily: 'Arial Black, sans-serif', filter: 'url(#neonGlow)' }}
      >
        JOHAN
      </text>
    </g>
    
    {/* Script: Programmer Freelancer - Enhanced visibility */}
    <g className="flicker-slow">
      <rect x="70" y="205" width="260" height="40" fill="black" fillOpacity="0.7" rx="10" />
      <text 
        x="50%" 
        y="235" 
        textAnchor="middle" 
        fill="#ffffff" 
        style={{ fontSize: '30px', fontFamily: 'Brush Script MT, cursive', fontStyle: 'italic', textShadow: '0 0 10px rgba(255,255,255,0.8)' }}
      >
        Programmer Freelancer
      </text>
    </g>
    
    {/* Digital Display for Numbers */}
    <g className="digital-pulse">
      <rect x="75" y="265" width="250" height="45" rx="8" fill="#000000" stroke="#39ff14" strokeWidth="1" strokeOpacity="0.3" />
      <text 
        x="50%" 
        y="297" 
        textAnchor="middle" 
        fill="#39ff14" 
        style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', filter: 'drop-shadow(0 0 8px #39ff14)' }}
      >
        +62-813-41-300-100
      </text>
    </g>
    
    {/* Interactive HUD Elements */}
    <circle cx="200" cy="20" r="5" fill="#39ff14" className="animate-pulse" />
    <path d="M190 380 L210 380" stroke="#ff00ff" strokeWidth="2" className="animate-bounce" />
    
    {/* Scanning Line */}
    <line x1="20" y1="0" x2="380" y2="0" stroke="rgba(0, 243, 255, 0.2)" strokeWidth="2" className="animate-scan-y" />
  </svg>
);

interface GeneratedItem {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [references, setReferences] = useState<{file: File, preview: string, base64: string}[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LoadingMessages[0]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }, [references, resultImage, isGenerating, isEditMode, history]);

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
      let idx = 0;
      interval = setInterval(() => {
        idx = (idx + 1) % LoadingMessages.length;
        setLoadingMsg(LoadingMessages[idx]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    
    const newRefs = await Promise.all(files.map(async file => {
      const base64 = await fileToBase64(file);
      return {
        file,
        preview: URL.createObjectURL(file),
        base64: base64.split(',')[1]
      };
    }));
    
    setReferences(prev => [...prev, ...newRefs].slice(0, 5));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  const generateImage = async (isEditing = false) => {
    const activePrompt = isEditing ? editPrompt : prompt;
    if (!activePrompt.trim() && references.length === 0) {
      setError("Isi dulu dong khayalan lu atau kasih gambar referensi biar gokil.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let finalStyleContext = "";

      if (references.length > 0 && !isEditing) {
        setLoadingMsg("Analisis vibes gaya lu...");
        const parts = references.map(ref => ({
          inlineData: { mimeType: ref.file.type, data: ref.base64 }
        }));
        parts.push({ text: "Analisis gaya artistik, skema warna, dan mood dari gambar-gambar ini secara mendalam. Berikan prompt teknis yang keren untuk generator gambar AI." } as any);

        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts }
        });
        finalStyleContext = analysisResponse.text || "";
      }

      setLoadingMsg(isEditing ? "Modifikasi pixel..." : "Ngerender karya JOHAN...");
      
      const parts: any[] = [];
      if (isEditing && resultImage) {
        parts.push({
          inlineData: {
            mimeType: 'image/png',
            data: resultImage.split(',')[1]
          }
        });
      }

      const compositePrompt = isEditing 
        ? `Modify this visual with these changes: ${activePrompt}.`
        : `${activePrompt}. Technical Aesthetic Style: ${finalStyleContext}. Maintain high quality cyber-neon aesthetics.`;

      parts.push({ text: compositePrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (imagePart?.inlineData?.data) {
        const newUrl = `data:image/png;base64,${imagePart.inlineData.data}`;
        setResultImage(newUrl);
        
        const historyItem: GeneratedItem = {
          id: Date.now().toString(),
          url: newUrl,
          prompt: activePrompt,
          aspectRatio: aspectRatio
        };
        setHistory(prev => [historyItem, ...prev].slice(0, 10));
        
        if (isEditing) {
          setIsEditMode(false);
          setEditPrompt('');
        }
      } else {
        throw new Error("Gagal dapet data pixel dari core!");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Waduh, koneksi ke lab JOHAN keganggu. Coba lagi ya!");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `johan-design-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex h-screen w-full text-[#e4e4e7] overflow-hidden font-inter">
      {/* SIDEBAR: JOHAN CONTROL PANEL */}
      <aside className="w-[380px] border-r border-white/10 bg-[#050508]/95 backdrop-blur-2xl flex flex-col shrink-0 z-20 relative">
        {/* RE-DESIGNED LOGO AREA */}
        <div className="p-10 border-b border-white/5 relative bg-brick-pattern">
          <div className="flex flex-col items-center gap-6">
            <div className="w-52 h-52 relative group cursor-pointer">
              <JohanLogo className="w-full h-full drop-shadow-[0_0_25px_rgba(0,243,255,0.4)] transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute -inset-4 bg-cyan-500/5 rounded-full animate-pulse-slow pointer-events-none"></div>
            </div>
            <div className="text-center">
              <h1 className="font-black text-2xl tracking-[0.2em] text-white uppercase neon-text-cyan-magenta flicker">NANOBANANA</h1>
              <p className="text-[10px] text-lime-400 font-bold tracking-[0.4em] mt-2 uppercase opacity-80">JOHAN Pro Studio</p>
            </div>
          </div>
          <div className="absolute -bottom-[1px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-500 to-transparent"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          {/* Moodboard / Style Ref */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Style Moodboard</h3>
              <span className="text-[10px] text-zinc-600 bg-white/5 px-2 py-0.5 rounded">[{references.length}/5]</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {references.map((ref, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-white/10 overflow-hidden group hover:border-magenta-500 transition-all">
                  <img src={ref.preview} alt="Ref" className="w-full h-full object-cover" />
                  <button onClick={() => removeReference(idx)} className="absolute inset-0 bg-magenta-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <i data-lucide="x" className="w-5 h-5 text-white"></i>
                  </button>
                </div>
              ))}
              {references.length < 5 && (
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-lime-500/50 hover:bg-lime-500/5 flex items-center justify-center transition-all group">
                  <i data-lucide="plus" className="w-6 h-6 text-zinc-600 group-hover:text-lime-400"></i>
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          </section>

          {/* Aspect Ratio */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Format Kanvas</h3>
            <div className="grid grid-cols-2 gap-3">
              {AspectRatios.map(ratio => (
                <button
                  key={ratio.id}
                  onClick={() => setAspectRatio(ratio.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                    aspectRatio === ratio.id 
                      ? 'border-lime-400 bg-lime-400/10 text-lime-400 shadow-[0_0_15px_rgba(57,255,20,0.15)] scale-[1.02]' 
                      : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/20'
                  }`}
                >
                  <i data-lucide={ratio.icon} className="w-5 h-5"></i>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-black tracking-widest">{ratio.label}</span>
                    <span className="text-[9px] opacity-40 uppercase tracking-tighter font-bold">{ratio.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Prompt Area */}
          <section className="space-y-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-400">Instruksi Visual</h3>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Deskripsikan ide gokil lu di sini..."
                className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-5 text-sm focus:outline-none focus:border-magenta-500/50 transition-all resize-none placeholder:text-zinc-800 font-medium"
              />
            </div>
          </section>
        </div>

        {/* Generate Trigger */}
        <div className="p-8 bg-black/60 border-t border-white/5 backdrop-blur-3xl">
          <button 
            onClick={() => generateImage(false)}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-5 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 ${
              isGenerating || !prompt.trim()
                ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed opacity-50' 
                : 'btn-johan'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center gap-4">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                RENDERING...
              </span>
            ) : (
              <>
                <i data-lucide="zap" className="w-5 h-5"></i>
                GASKEUN !
              </>
            )}
          </button>
        </div>
      </aside>

      {/* VIEWPORT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#020205]">
        <header className="h-20 px-10 flex justify-between items-center border-b border-white/5 bg-black/30 backdrop-blur-xl z-10">
          <div className="flex items-center gap-8">
             <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-lime-500/30 bg-lime-500/5 text-[11px] font-black text-lime-400 tracking-widest">
                <span className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_10px_#39ff14] animate-pulse"></span>
                SYSTEM ONLINE
             </div>
             <div className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
               VIRTUAL_LAB // <span className="text-zinc-400">JOHAN_PRO_GEN</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {resultImage && !isGenerating && (
              <>
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isEditMode ? 'bg-magenta-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  <i data-lucide="edit-3" className="w-3.5 h-3.5"></i> {isEditMode ? 'STOP' : 'POLES'}
                </button>
                <button onClick={downloadImage} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-lime-400 transition-all active:scale-95">
                  <i data-lucide="download" className="w-3.5 h-3.5"></i> SEDOT
                </button>
              </>
            )}
          </div>
        </header>

        {/* Workspace Canvas */}
        <div className="flex-1 relative flex items-center justify-center p-12 overflow-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-12 z-10 animate-in fade-in zoom-in">
               <div className="relative w-48 h-48">
                  <div className="absolute inset-0 rounded-full border-2 border-magenta-500/20 animate-[ping_2s_infinite]"></div>
                  <div className="absolute inset-4 rounded-full border-4 border-cyan-400 animate-[spin_1.5s_linear_infinite] border-t-transparent shadow-[0_0_40px_rgba(0,243,255,0.4)]"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <JohanLogo className="w-28 h-28" />
                  </div>
               </div>
               <div className="text-center space-y-4">
                 <h2 className="text-3xl font-black text-white uppercase tracking-[0.5em] flicker">{loadingMsg}</h2>
                 <p className="text-[10px] text-lime-400/60 font-black uppercase tracking-[0.5em] animate-pulse">Computing High Fidelity Assets...</p>
               </div>
            </div>
          ) : resultImage ? (
            <div className="relative group animate-in zoom-in-95 duration-500 ease-out">
               <img 
                src={resultImage} 
                alt="Hasil Gen" 
                className={`rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] border border-white/5 object-contain max-h-[75vh] ${
                  aspectRatio === '1:1' ? 'aspect-square' :
                  aspectRatio === '4:5' ? 'aspect-[4/5]' :
                  aspectRatio === '16:9' ? 'aspect-[16/9]' :
                  'aspect-[9/16]'
                }`}
              />
              
              {isEditMode && (
                <div className="absolute inset-0 flex items-center justify-center z-30 p-8">
                  <div className="w-[440px] glass border border-magenta-400/40 p-10 rounded-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-magenta-500 rounded-xl shadow-[0_0_15px_rgba(255,0,255,0.3)]">
                        <i data-lucide="wand-2" className="w-5 h-5 text-white"></i>
                      </div>
                      <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Poles Hasilnya</h4>
                    </div>
                    <textarea
                      autoFocus
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="Contoh: 'Ubah suasana jadi lebih gelap', 'Tambahin efek api'..."
                      className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-5 text-sm mb-6 focus:outline-none focus:border-magenta-500/50 resize-none text-white"
                    />
                    <div className="flex gap-4">
                      <button onClick={() => generateImage(true)} className="flex-1 py-4 bg-magenta-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all shadow-lg">
                        APPLY CHANGES
                      </button>
                      <button onClick={() => setIsEditMode(false)} className="px-6 py-4 bg-white/5 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        BATAL
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-12 text-center max-w-lg animate-in fade-in slide-in-from-bottom-20 duration-1000">
              <div className="relative">
                <div className="w-40 h-40 rounded-[3rem] border border-white/5 bg-white/5 flex items-center justify-center rotate-12 relative z-10 shadow-2xl overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-magenta-500/20"></div>
                   <i data-lucide="image" className="w-16 h-16 text-zinc-700 relative z-10"></i>
                </div>
                <div className="absolute -top-4 -right-4 w-40 h-40 rounded-[3rem] border border-white/5 bg-[#09090b] -rotate-12 -z-10 opacity-40"></div>
              </div>
              <div className="space-y-6">
                <h2 className="text-4xl font-black text-white uppercase tracking-[0.4em] neon-text-cyan-magenta flicker">READY TO GEN</h2>
                <p className="text-[12px] text-zinc-500 font-bold uppercase tracking-[0.25em] leading-relaxed px-10">
                  Panel kontrol <span className="text-lime-400">JOHAN STUDIO</span> aktif. 
                  Input ide lu dan tekan tombol gaskeun!
                </p>
              </div>
              {error && (
                <div className="mt-8 flex items-center gap-4 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[11px] font-black uppercase tracking-widest shadow-xl">
                  <i data-lucide="alert-triangle" className="w-5 h-5"></i>
                  <span>SYSTEM ERROR: {error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* History Gallery */}
        {history.length > 0 && (
          <div className="h-40 px-10 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex items-center gap-6 overflow-x-auto scrollbar-hide z-10">
            <div className="flex flex-col gap-2 shrink-0 border-r border-white/10 pr-8">
               <span className="text-[10px] font-black text-lime-500 uppercase tracking-[0.4em]">STAGING</span>
               <span className="text-[9px] font-bold text-zinc-700 uppercase tracking-[0.4em]">HISTORY_LOG</span>
            </div>
            {history.map((item) => (
              <button 
                key={item.id} 
                onClick={() => setResultImage(item.url)}
                className={`h-28 aspect-square rounded-xl border-2 transition-all shrink-0 hover:scale-105 ${resultImage === item.url ? 'border-lime-400 shadow-[0_0_20px_rgba(57,255,20,0.3)]' : 'border-white/5 opacity-40 hover:opacity-100'}`}
              >
                <img src={item.url} alt="History" className="w-full h-full object-cover rounded-lg" />
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
