
import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  Square, 
  RectangleVertical, 
  RectangleHorizontal, 
  Smartphone, 
  X, 
  Plus, 
  Zap, 
  Edit3, 
  Download, 
  Image as ImageIcon, 
  AlertTriangle, 
  Wand2,
  Key,
  ExternalLink,
  Info,
  CreditCard
} from 'lucide-react';

// Global declarations for AI Studio environment
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string;
  };
};

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const AspectRatios = [
  { id: '1:1', label: '1:1', sub: 'Kotak', icon: Square },
  { id: '3:4', label: '3:4', sub: 'Portrait', icon: RectangleVertical },
  { id: '16:9', label: '16:9', sub: 'Lebar', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16', sub: 'Story', icon: Smartphone },
];

const LoadingMessages = [
  "Lagi nembus server Google...",
  "Ngerakit pixel Nanobanana...",
  "Gemini lagi gambar buat lu...",
  "Dikit lagi jadi, sabar bos...",
  "Poles cahaya dikit lagi...",
  "Karya JOHAN hampir siap..."
];

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
    </defs>
    <circle cx="200" cy="200" r="185" fill="black" fillOpacity="0.4" />
    <g className="animate-spin-slow-cw">
      <circle cx="200" cy="200" r="180" fill="none" stroke="url(#ringGrad)" strokeWidth="4" strokeDasharray="60 30" filter="url(#neonGlow)" />
    </g>
    <g className="animate-spin-slow-ccw">
      <circle cx="200" cy="200" r="170" fill="none" stroke="#ff00ff" strokeWidth="2" strokeDasharray="10 20" opacity="0.6" />
    </g>
    <g className="techno-glitch">
      <text x="50%" y="45%" textAnchor="middle" fill="url(#textGrad)" style={{ fontSize: '95px', fontFamily: 'Arial Black, sans-serif', filter: 'url(#neonGlow)', fontWeight: 900 }}>JOHAN</text>
    </g>
    <g className="flicker-slow">
      <rect x="70" y="205" width="260" height="40" fill="black" fillOpacity="0.7" rx="10" />
      <text x="50%" y="235" textAnchor="middle" fill="#ffffff" style={{ fontSize: '30px', fontFamily: 'Brush Script MT, cursive', fontStyle: 'italic', textShadow: '0 0 10px rgba(255,255,255,0.8)' }}>Programmer Freelancer</text>
    </g>
    <g className="digital-pulse">
      <rect x="75" y="265" width="250" height="45" rx="8" fill="#000000" stroke="#39ff14" strokeWidth="1" strokeOpacity="0.3" />
      <text x="50%" y="297" textAnchor="middle" fill="#39ff14" style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', filter: 'drop-shadow(0 0 8px #39ff14)' }}>+62-813-41-300-100</text>
    </g>
    <circle cx="200" cy="20" r="5" fill="#39ff14" className="animate-pulse" />
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
  const [showBillingHint, setShowBillingHint] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;
      return { file, preview: URL.createObjectURL(file), base64 };
    }));
    setReferences(prev => [...prev, ...newRefs].slice(0, 5));
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  const generateImage = async (isEditing = false) => {
    const activePrompt = isEditing ? editPrompt : prompt;
    if (!activePrompt.trim() && references.length === 0) {
      setError("Isi dulu deskripsi ide lu bos!");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowBillingHint(false);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let finalStyleContext = "";

      if (references.length > 0 && !isEditing) {
        setLoadingMsg("Analisis gaya referensi...");
        // FIX: Explicitly type parts as any[] to allow pushing mixed part types (inlineData and text)
        const parts: any[] = references.map(ref => ({
          inlineData: { mimeType: ref.file.type, data: ref.base64 }
        }));
        parts.push({ text: "Analisis gaya artistik dari gambar-gambar ini. Berikan deskripsi gaya teknis singkat." });

        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts }
        });
        finalStyleContext = analysisResponse.text || "";
      }

      setLoadingMsg(isEditing ? "Modifikasi pixel..." : "Ngerender gambar lu...");
      
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
        ? `Edit this: ${activePrompt}`
        : `${activePrompt}. Style: ${finalStyleContext}. High quality render.`;

      parts.push({ text: compositePrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

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
        if (isEditing) setIsEditMode(false);
      } else {
        throw new Error("Respon kosong. Kuota lu kemungkinan masih 0.");
      }

    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Gagal render.";
      
      if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
        msg = "Kuota Habis (Limit 0)! Di dashboard lu tulisannya 'Set up billing', itu penyebabnya bos.";
        setShowBillingHint(true);
      }
      
      setError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateKey = async () => {
    try {
      // FIX: Cast window to any to access aistudio and avoid modifier conflict errors
      await (window as any).aistudio.openSelectKey();
      setError(null);
      setShowBillingHint(false);
    } catch (e) {
      alert("Gunakan browser yang mendukung AI Studio.");
    }
  };

  return (
    <div className="flex h-screen w-full text-[#e4e4e7] overflow-hidden font-inter bg-[#020205]">
      <aside className="w-[380px] border-r border-white/10 bg-[#050508]/95 backdrop-blur-2xl flex flex-col shrink-0 z-20">
        <div className="p-8 border-b border-white/5 relative bg-brick-pattern">
          <div className="flex flex-col items-center gap-4">
            <JohanLogo className="w-40 h-40 drop-shadow-[0_0_20px_rgba(0,243,255,0.3)]" />
            <div className="text-center">
              <h1 className="font-black text-xl tracking-[0.2em] text-white uppercase neon-text-cyan-magenta">NANOBANANA</h1>
              <p className="text-[9px] text-lime-400 font-bold tracking-[0.3em] mt-1 uppercase">JOHAN FREE STUDIO</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Gaya & Mood</h3>
            <div className="grid grid-cols-4 gap-2">
              {references.map((ref, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-white/10 overflow-hidden">
                  <img src={ref.preview} className="w-full h-full object-cover" />
                  <button onClick={() => removeReference(idx)} className="absolute inset-0 bg-red-500/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {references.length < 5 && (
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-white/20 hover:border-lime-400/50 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-zinc-500" />
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Ukuran</h3>
            <div className="grid grid-cols-2 gap-2">
              {AspectRatios.map(Ratio => (
                <button
                  key={Ratio.id}
                  onClick={() => setAspectRatio(Ratio.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    aspectRatio === Ratio.id ? 'border-lime-400 bg-lime-400/10 text-lime-400' : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/20'
                  }`}
                >
                  <Ratio.icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{Ratio.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Prompt</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ide gokil lu apa?"
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-xs focus:outline-none focus:border-cyan-500/50 resize-none text-white"
            />
          </section>
        </div>

        <div className="p-6 bg-black/60 border-t border-white/5">
          <button 
            onClick={() => generateImage(false)}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs tracking-widest transition-all ${
              isGenerating || !prompt.trim() ? 'bg-zinc-900 text-zinc-700' : 'btn-johan'
            }`}
          >
            {isGenerating ? "RENDERING..." : "GASKEUN !"}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 px-8 flex justify-between items-center border-b border-white/5 bg-black/30 backdrop-blur-xl z-10">
          <div className="flex items-center gap-2">
             <div className="px-3 py-1 rounded-full border border-lime-500/20 bg-lime-500/5 text-[9px] font-black text-lime-400 uppercase">
                {isGenerating ? "PROCESSING" : "STANDBY"}
             </div>
          </div>
          <button onClick={handleUpdateKey} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black uppercase transition-all">
             <Key className="w-3 h-3 text-cyan-400" /> API CONFIG
          </button>
        </header>

        <div className="flex-1 relative flex items-center justify-center p-8 overflow-auto cyber-grid">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-8 z-10">
               <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-spin border-t-transparent"></div>
                  <Zap className="absolute inset-0 m-auto w-10 h-10 text-cyan-400 animate-pulse" />
               </div>
               <h2 className="text-xl font-black text-white uppercase tracking-[0.3em] flicker">{loadingMsg}</h2>
            </div>
          ) : resultImage ? (
            <div className="relative group animate-in zoom-in duration-500">
               <img src={resultImage} className="rounded-2xl shadow-2xl border border-white/10 max-h-[75vh] object-contain" />
               <button onClick={() => {const a=document.createElement('a');a.href=resultImage;a.download='johan.png';a.click();}} className="absolute bottom-4 right-4 p-4 bg-white text-black rounded-full shadow-xl hover:scale-110 transition-all">
                  <Download className="w-5 h-5" />
               </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 text-center max-w-md">
              <ImageIcon className="w-16 h-16 text-zinc-800" />
              <h2 className="text-2xl font-black text-white uppercase tracking-[0.3em]">JOHAN LAB</h2>
              
              {error && (
                <div className="w-full p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-left space-y-4">
                  <div className="flex items-center gap-3 font-black text-[11px] uppercase">
                    <AlertTriangle className="w-5 h-5" /> QUOTA ERROR
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-80">{error}</p>
                  
                  {showBillingHint && (
                    <div className="bg-black/40 p-4 rounded-xl space-y-3 border border-red-500/10">
                      <div className="flex items-start gap-2 text-[9px] font-bold text-white">
                        <CreditCard className="w-4 h-4 shrink-0 text-cyan-400" />
                        <span>Sesuai gambar dashboard lu, statusnya "Set up billing". Lu harus klik tombol itu di Google AI Studio dulu bos biar kuota gambarnya kebuka (meskipun lu tetep di Free Tier).</span>
                      </div>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" className="block w-full py-2 bg-white text-black rounded-lg text-center text-[9px] font-black uppercase">
                        BUKA AI STUDIO SEKARANG
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
