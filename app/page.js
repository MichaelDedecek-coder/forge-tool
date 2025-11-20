'use client';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ industry: '', challenge: '' });
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.result) {
        setResult(data.result);
      } else {
        setResult("Error: Could not generate strategy. Please try again.");
      }
    } catch (error) {
      setResult("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-5xl bg-black border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT SIDE: INPUTS */}
        <div className="w-full md:w-1/2 p-8 border-b md:border-b-0 md:border-r border-neutral-800">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300 mb-2">
              FORGE Strategy Generator
            </h1>
            <p className="text-neutral-500 text-sm">Powered by Michael Dědeček & Gemini 2.5</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Industry / Business</label>
              <input 
                type="text"
                className="w-full bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-white placeholder-neutral-700"
                placeholder="e.g. Local Bakery, CNC Manufacturing..."
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Core Challenge</label>
              <textarea 
                className="w-full bg-neutral-900/50 border border-neutral-700 rounded-lg p-4 h-32 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all text-white placeholder-neutral-700 resize-none"
                placeholder="What is holding you back?"
                value={formData.challenge}
                onChange={(e) => setFormData({...formData, challenge: e.target.value})}
              ></textarea>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || !formData.industry || !formData.challenge}
              className={`w-full py-4 rounded-lg font-bold uppercase tracking-wide transition-all transform hover:scale-[1.02] ${loading ? 'bg-neutral-800 text-neutral-500 cursor-wait' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-900/20'}`}
            >
              {loading ? "Analyzing Patterns..." : "Generate Strategy"}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: RESULTS */}
        <div className="w-full md:w-1/2 bg-neutral-900/30 p-8 relative min-h-[400px] flex flex-col">
          {!result && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-700 select-none">
              {/* The "System Ready" Icon */}
              <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
              </svg>
              <p className="text-sm font-medium uppercase tracking-widest opacity-40">System Ready</p>
              <p className="text-xs mt-2 opacity-30">Awaiting Input...</p>
            </div>
          )}
          
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-orange-500">
              <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
              <p className="animate-pulse text-sm font-bold uppercase tracking-widest">Consulting Gemini...</p>
            </div>
          )}

          {result && (
            <div className="animate-fade-in h-full overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-teal-500 font-bold mb-6 uppercase tracking-widest text-xs border-b border-teal-500/20 pb-2">Strategic Analysis</h3>
              <div className="prose prose-invert prose-p:text-neutral-300 prose-strong:text-white prose-strong:font-bold leading-relaxed">
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
