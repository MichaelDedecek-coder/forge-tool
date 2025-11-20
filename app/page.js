'use client';
import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ industry: '', challenge: '' });
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      if (data.result) {
        setResult(data.result);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-4xl bg-black border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* HEADER */}
        <div className="p-8 border-b border-neutral-800 bg-gradient-to-r from-neutral-900 to-neutral-800">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-teal-400 mb-2">
            FORGE Strategy Generator
          </h1>
          <p className="text-neutral-400">Powered by Michael Dědeček & Gemini Pro</p>
        </div>

        {/* BODY */}
        <div className="p-8 grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">Industry</label>
              <input 
                type="text"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-4 focus:border-orange-500 outline-none transition-all text-black"
                placeholder="e.g. Czech Manufacturing..."
                value={formData.industry}
                onChange={(e) => setFormData({...formData, industry: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-500 mb-2">Main Challenge</label>
              <textarea 
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-4 h-32 focus:border-orange-500 outline-none transition-all text-black"
                placeholder="What is the biggest obstacle?"
                value={formData.challenge}
                onChange={(e) => setFormData({...formData, challenge: e.target.value})}
              ></textarea>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={loading || !formData.industry || !formData.challenge}
              className={`w-full py-4 rounded-lg font-bold transition-all ${loading ? 'bg-neutral-800 text-neutral-500' : 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400'}`}
            >
              {loading ? "Consulting with AI..." : "Generate Strategy"}
            </button>
          </div>

          {/* RESULTS */}
          <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 relative min-h-[300px] overflow-y-auto">
            {!result && !loading && (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-600">
                <p>Results will appear here.</p>
              </div>
            )}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-orange-500">
                <p className="animate-pulse">Analyzing patterns...</p>
              </div>
            )}
            {result && (
              <div className="prose prose-invert prose-p:text-neutral-300 prose-headings:text-teal-400">
                <div className="whitespace-pre-wrap">{result}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}