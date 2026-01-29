
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
  BrainCircuit,
  Phone,
  RefreshCw,
  Globe
} from 'lucide-react';

const AspectRatios = [
  { id: '1:1', label: '1:1', sub: 'Kotak', icon: Square },
  { id: '3:4', label: '3:4', sub: 'Portrait', icon: RectangleVertical },
  { id: '16:9', label: '16:9', sub: 'Lebar', icon: RectangleHorizontal },
  { id: '9:16', label: '9:16', sub: 'Story', icon: Smartphone },
];

const LoadingMessages = [
  "JOHAN Pro Engine: Neural Link Established...",
  "JOHAN Pro Engine: Analyzing style geometry...",
  "JOHAN Pro Engine: Processing US-Central Cloud...",
  "JOHAN Pro Engine: Synthesizing output..."
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
  </svg>
);

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('Liminho binaragawan dengan otot sixpack, kompetisi di panggung, ultra realistic, cinematic.');
  const [references, setReferences] = useState<{file: File, preview: string, base64: string}[]>([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LoadingMessages[0]);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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

  const generateImage = async () => {
    if (!prompt.trim() && references.length === 0) return;
    setIsGenerating(true);
    setError(null);

    try {
      // MENGGUNAKAN process.env.API_KEY SESUAI ATURAN
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      let styleText = "";

      if (references.length > 0) {
        try {
          const analysisResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { 
              parts: [
                ...references.map(ref => ({ inlineData: { mimeType: ref.file.type, data: ref.base64 } })),
                { text: "Describe the lighting and artistic style for an image prompt." }
              ] 
            }
          });
          styleText = analysisResponse.text || "";
        } catch (e) { console.warn("Analysis failed."); }
      }

      // Gunakan gemini-2.5-flash-image sebagai engine utama yang lebih stabil
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { 
          parts: [{ text: `${prompt}. ${styleText}. High detail, cinematic.` }] 
        },
        config: {
          imageConfig: { aspectRatio: aspectRatio as any }
        }
      });

      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (imagePart?.inlineData?.data) {
        setResultImage(`data:image/png;base64,${imagePart.inlineData.data}`);
      } else {
        throw new Error("Engine returned empty data. Possible regional block.");
      }

    } catch (err: any) {
      console.error("Critical Engine Error:", err);
      // Jika error 429 atau limit 0, berikan saran spesifik
      if (err.message?.includes("429") || err.message?.includes("limit: 0")) {
        setError("REGION_BLOCKED: Google membatasi akses AI Image di wilayah Anda. Gunakan VPN (USA) atau deploy ke Vercel dengan config Region US.");
      } else {
        setError(err.message || "An error occurred.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full text-[#e4e4e7] bg-transparent">
      {/* SIDEBAR */}
      <aside className="w-full lg:w-[380px] border-b lg:border-r border-white/10 bg-black/80 backdrop-blur-3xl flex flex-col shrink-0">
        <div className="p-8 border-b border-white/10 flex flex-col items-center gap-4">
          <JohanLogo className="w-40 h-40 drop-shadow-[0_0_20px_rgba(0,243,255,0.3)]" />
          <div className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 border border-lime-400/20 rounded-full">
            <Phone className="w-3 h-3 text-lime-400" />
            <span className="text-[10px] font-black text-lime-400">+62-813-41-300-100</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Moodboard Staging</h3>
            <div className="grid grid-cols-4 gap-2">
              {references.map((ref, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg border border-white/10 overflow-hidden">
                  <img src={ref.preview} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" />
                  <button onClick={() => setReferences(p => p.filter((_, i) => i !== idx))} className="absolute inset-0 bg-red-500/80 opacity-0 hover:opacity-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
              {references.length < 5 && (
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border border-dashed border-white/20 hover:border-cyan-400 flex items-center justify-center transition-all group">
                  <Plus className="w-5 h-5 text-zinc-600 group-hover:text-cyan-400" />
                </button>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Aspect Frame</h3>
            <div className="grid grid-cols-2 gap-2">
              {AspectRatios.map(Ratio => (
                <button
                  key={Ratio.id}
                  onClick={() => setAspectRatio(Ratio.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    aspectRatio === Ratio.id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.1)]' : 'border-white/5 bg-white/5 text-zinc-500'
                  }`}
                >
                  <Ratio.icon className="w-4 h-4 shrink-0" />
                  <span className="text-[10px] font-bold">{Ratio.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Prompt Core</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-xs focus:border-cyan-400 outline-none resize-none text-white font-medium"
            />
          </section>
        </div>

        <div className="p-6 bg-black/40 border-t border-white/10">
          <button 
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 rounded-xl flex items-center justify-center gap-3 font-black text-xs tracking-widest btn-johan disabled:opacity-30"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isGenerating ? "PROCESSING..." : "EXECUTE RENDER"}
          </button>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main className="flex-1 flex flex-col relative bg-black/10 backdrop-blur-sm">
        <header className="h-20 px-10 flex justify-between items-center border-b border-white/5 bg-black/20 backdrop-blur-md z-10">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-cyan-400 tracking-[0.4em] uppercase">Johan Studio Station</h2>
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 text-lime-400" />
              <p className="text-[8px] text-zinc-500 font-mono uppercase">Current Gateway: US-EAST (VERCEL_CONFIG)</p>
            </div>
          </div>
        </header>

        <div className="flex-1 relative flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-6 text-center">
               <div className="w-20 h-20 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)]">
                  <BrainCircuit className="w-8 h-8 text-cyan-400 animate-pulse" />
               </div>
               <h2 className="text-sm font-black text-white uppercase tracking-[0.4em] flicker">{loadingMsg}</h2>
            </div>
          ) : resultImage ? (
            <div className="relative group animate-in zoom-in duration-500 flex flex-col items-center max-w-4xl w-full">
               <div className="relative p-1 bg-gradient-to-br from-cyan-400 to-magenta-500 rounded-3xl overflow-hidden shadow-2xl">
                 <img src={resultImage} className="rounded-[1.4rem] max-h-[70vh] w-full object-contain" />
               </div>
               <button onClick={() => {const a=document.createElement('a');a.href=resultImage;a.download=`render-${Date.now()}.png`;a.click();}} className="mt-8 flex items-center gap-4 px-10 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
                  <Download className="w-5 h-5" /> DOWNLOAD RENDER
               </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 text-center opacity-40">
              <ImageIcon className="w-16 h-16" />
              <p className="text-[10px] font-mono tracking-widest uppercase">Awaiting Command Sequence...</p>
              
              {error && (
                <div className="mt-4 p-5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-left max-w-md">
                  <div className="flex items-center gap-2 font-black text-[10px] uppercase mb-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> REGION_FAULT_DETECTED
                  </div>
                  <p className="text-[9px] leading-relaxed font-mono opacity-80">{error}</p>
                  <div className="mt-3 p-2 bg-black/40 rounded border border-red-500/20 text-[8px] font-mono">
                    SOLUSI: Aktifkan VPN ke Server United States (USA) lalu refresh halaman ini.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <footer className="h-10 px-10 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between text-[8px] font-black text-zinc-700 tracking-widest">
          <span>JOHAN_STUDIO // BUILD_2.5_STABLE</span>
          <span className="text-lime-400 animate-pulse">GATEWAY_US_READY</span>
        </footer>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
