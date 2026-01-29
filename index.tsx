
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
  Download, 
  Image as ImageIcon, 
  AlertTriangle, 
  Key,
  BrainCircuit,
  Phone,
  ChevronDown
} from 'lucide-react';

// Global declarations for AI Studio environment
declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string;
  };
};

const AspectRatios = [
  { id: '1:1', label: '1:1', sub: 'Kotak', icon: Square },
  { id: '3:4', label: '3:4', sub: 'Portrait', icon: RectangleVertical },
  { id: '16:9', label: '16:9', sub: 'Lebar', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16', sub: 'Story', icon: Smartphone },
];

const LoadingMessages = [
  "Lagi ngerakit pixel gratisan...",
  "Analisis gaya lewat Gemini Flash...",
  "Nge-render Nanobanana Engine...",
  "Dikit lagi jadi, sabar bos...",
  "Poles cahaya dikit lagi...",
  "Karya JOHAN hampir siap..."
];

const JohanLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 500 500" className={`${className} select-none`}>
    <defs>
      <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00f3ff" />
        <stop offset="100%" stopColor="#ff00ff" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <g className="origin-center animate-[spin_10s_linear_infinite]">
      <circle cx="250" cy="250" r="230" fill="none" stroke="url(#cyberGrad)" strokeWidth="2" strokeDasharray="50 30" opacity="0.3" />
    </g>
    <g className="origin-center animate-[spin_15s_linear_infinite_reverse]">
      <circle cx="250" cy="250" r="210" fill="none" stroke="#39ff14" strokeWidth="1" strokeDasharray="10 20" opacity="0.2" />
    </g>
    <g className="origin-center animate-[spin_20s_linear_infinite]">
       <circle cx="250" cy="250" r="190" fill="none" stroke="url(#cyberGrad)" strokeWidth="4" strokeDasharray="2 10" opacity="0.5" />
    </g>

    <path id="phonePath" d="M 100, 250 a 150,150 0 1,1 300,0 a 150,150 0 1,1 -300,0" fill="none" />
    <text className="origin-center animate-[spin_12s_linear_infinite]">
      <textPath href="#phonePath" startOffset="0%" fill="#39ff14" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', fontWeight: 'bold', letterSpacing: '4px' }}>
        +62-813-41-300-100 • JOHAN STUDIO • +62-813-41-300-100 • JOHAN STUDIO •
      </textPath>
    </text>

    <g className="flicker">
      <text x="50%" y="265" textAnchor="middle" fill="#00f3ff" filter="url(#glow)" style={{ fontSize: '110px', fontFamily: 'Arial Black, sans-serif', fontWeight: 900, letterSpacing: '-5px' }}>JOHAN</text>
      <rect x="150" y="275" width="200" height="2" fill="#ff00ff" className="animate-pulse" />
      <text x="50%" y="305" textAnchor="middle" fill="#ffffff" style={{ fontSize: '14px', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '8px', opacity: 0.8 }}>PROGRAMMER FREELANCER</text>
    </g>
    
    <rect x="50" y="0" width="400" height="1" fill="#00f3ff" opacity="0.5">
      <animate attributeName="y" from="150" to="350" dur="3s" repeatCount="indefinite" />
    </rect>
  </svg>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [references, setReferences] = useState<{file: File, preview: string, base64: string}[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LoadingMessages[0]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultSectionRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll logic for mobile
  useEffect(() => {
    if ((isGenerating || resultImage) && window.innerWidth < 1024) {
      resultSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isGenerating, resultImage]);

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

  const generateImage = async () => {
    if (!prompt.trim() && references.length === 0) {
      setError("Isi dulu deskripsi ide lu bos!");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let finalStyleContext = "";

      if (references.length > 0) {
        const parts: any[] = references.map(ref => ({
          inlineData: { mimeType: ref.file.type, data: ref.base64 }
        }));
        parts.push({ text: "Analisis gaya artistik gambar ini secara teknis untuk prompt AI. Berikan deskripsi gaya singkat." });

        const analysisResponse = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: { parts }
        });
        finalStyleContext = analysisResponse.text || "";
      }

      const genParts = [{ text: `${prompt}. Style: ${finalStyleContext}. High quality render.` }];

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: genParts },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imagePart?.inlineData?.data) {
        setResultImage(`data:image/png;base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error("Respon kosong. Cek API Key lu bos.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Gagal render gambar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateKey = async () => {
    try {
      await (window as any).aistudio.openSelectKey();
      setError(null);
    } catch (e) {
      alert("Gunakan browser yang mendukung AI Studio.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full text-[#e4e4e7] bg-transparent">
      {/* SIDEBAR / CONTROLS (Atas di Mobile, Kiri di Desktop) */}
      <aside className="w-full lg:w-[380px] border-b lg:border-r lg:border-b-0 border-white/10 bg-black/80 backdrop-blur-3xl flex flex-col shrink-0 z-20">
        <div className="p-6 lg:p-8 border-b border-white/10 relative">
          <div className="flex flex-col items-center gap-2">
            <JohanLogo className="w-32 h-32 lg:w-48 lg:h-48 drop-shadow-[0_0_25px_rgba(0,243,255,0.4)]" />
            <div className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-full">
               <Phone className="w-3 h-3 text-lime-400" />
               <span className="text-[9px] lg:text-[10px] font-black text-lime-400 tracking-wider">+62-813-41-300-100</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-visible lg:overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Moodboard</h3>
              <span className="text-[9px] text-zinc-500 uppercase">{references.length}/5 Images</span>
            </div>
            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {references.map((ref, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-white/10 overflow-hidden group">
                  <img src={ref.preview} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <button onClick={() => removeReference(idx)} className="absolute inset-0 bg-red-500/80 opacity-0 hover:opacity-100 flex items-center justify-center transition-all">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {references.length < 5 && (
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-white/20 hover:border-cyan-400/50 hover:bg-cyan-400/5 flex items-center justify-center transition-all group">
                  <Plus className="w-5 h-5 text-zinc-600 group-hover:text-cyan-400" />
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Resolution Aspect</h3>
            <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
              {AspectRatios.map(Ratio => (
                <button
                  key={Ratio.id}
                  onClick={() => setAspectRatio(Ratio.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    aspectRatio === Ratio.id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'border-white/5 bg-white/5 text-zinc-500 hover:border-white/20'
                  }`}
                >
                  <Ratio.icon className="w-4 h-4 shrink-0" />
                  <div className="flex flex-col items-start overflow-hidden">
                    <span className="text-[10px] font-bold">{Ratio.label}</span>
                    <span className="text-[7px] opacity-50 uppercase tracking-tighter truncate">{Ratio.sub}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Prompt Engineering</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your visual concept..."
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-xs focus:border-cyan-400 outline-none resize-none text-white font-medium transition-all"
            />
          </section>
        </div>

        <div className="p-6 bg-black/40 border-t border-white/10 lg:sticky lg:bottom-0">
          <button 
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs tracking-widest transition-all ${
              isGenerating || !prompt.trim() ? 'bg-zinc-900 text-zinc-700' : 'btn-johan'
            }`}
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 animate-bounce text-lime-400" />
                PROCESSING...
              </>
            ) : "EXECUTE RENDER"}
          </button>
          
          <div className="mt-4 flex lg:hidden justify-center items-center gap-2 text-[9px] font-black text-cyan-400/40 uppercase tracking-widest">
            Scroll down for result <ChevronDown className="w-3 h-3 animate-bounce" />
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS / RESULT (Bawah di Mobile, Kanan di Desktop) */}
      <main ref={resultSectionRef} className="flex-1 flex flex-col relative overflow-hidden min-h-screen lg:min-h-0 bg-black/10 backdrop-blur-sm">
        <header className="h-20 px-6 lg:px-10 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-cyan-400 tracking-[0.5em] uppercase">Johan Nanobanana</h2>
            <p className="text-[8px] text-zinc-500 font-mono">STATION: FLASH_CORE_V2 // LOCATION: SURABAYA_ID</p>
          </div>
          <button onClick={handleUpdateKey} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase transition-all tracking-widest">
             <Key className="w-3 h-3 text-cyan-400" /> ACCESS
          </button>
        </header>

        <div className="flex-1 relative flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-10 z-10 text-center py-20 lg:py-0">
               <div className="relative w-24 h-24 lg:w-32 lg:h-32">
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-400 animate-[spin_3s_linear_infinite] border-t-transparent shadow-[0_0_20px_rgba(0,243,255,0.4)]"></div>
                  <div className="absolute inset-4 rounded-full border-2 border-magenta-500 animate-[spin_5s_linear_infinite_reverse] border-b-transparent"></div>
                  <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 lg:w-12 lg:h-12 text-cyan-400 animate-pulse" />
               </div>
               <div className="space-y-2">
                 <h2 className="text-lg lg:text-xl font-black text-white uppercase tracking-[0.4em] flicker">{loadingMsg}</h2>
                 <p className="text-[8px] lg:text-[9px] text-cyan-400/60 font-mono animate-pulse uppercase">Syncing with neural nodes...</p>
               </div>
            </div>
          ) : resultImage ? (
            <div className="relative group animate-in zoom-in duration-700 flex flex-col items-center max-w-5xl w-full py-10 lg:py-0">
               <div className="relative p-1 bg-gradient-to-br from-cyan-400 to-magenta-500 rounded-3xl overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
                 <img src={resultImage} className="rounded-[1.4rem] max-h-[65vh] lg:max-h-[70vh] w-full object-contain" />
                 <div className="absolute top-4 right-4 flex gap-2">
                    <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white border border-white/10 uppercase tracking-tighter">RENDER_COMPLETE</div>
                 </div>
               </div>
               
               <button onClick={() => {const a=document.createElement('a');a.href=resultImage;a.download=`johan-${Date.now()}.png`;a.click();}} className="mt-8 lg:mt-10 flex items-center gap-4 px-10 py-4 lg:px-12 lg:py-5 bg-white text-black rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-[0.2em] hover:scale-105 hover:bg-cyan-400 transition-all shadow-xl">
                  <Download className="w-5 h-5" /> EXPORT FINAL ASSET
               </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8 text-center max-w-lg py-20 lg:py-0">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent group-hover:from-cyan-500/20 transition-all"></div>
                 <ImageIcon className="w-8 h-8 lg:w-10 lg:h-10 text-zinc-800 group-hover:text-zinc-600 transition-all" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-[0.5em] opacity-40">Mainframe Standby</h2>
                <p className="text-[9px] lg:text-[10px] text-zinc-600 font-mono tracking-widest max-w-xs mx-auto">WAITING FOR INPUT STREAM // READY TO GENERATE VISUAL NEURONS</p>
              </div>
              
              {error && (
                <div className="w-full p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-left animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-wider mb-2">
                    <AlertTriangle className="w-5 h-5" /> PROTOCOL_ERROR
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-80 font-mono">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* FOOTER BAR */}
        <footer className="hidden lg:flex h-10 px-10 border-t border-white/5 bg-black/40 backdrop-blur-xl items-center justify-between z-10 shrink-0">
          <div className="flex gap-6 items-center">
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Status: <span className="text-lime-400">Online</span></span>
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Network: <span className="text-cyan-400">Flash_Grid_v2</span></span>
          </div>
          <div className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">Johan Cybernetics &copy; 2024</div>
        </footer>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
