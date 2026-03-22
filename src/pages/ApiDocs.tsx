import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Code2, Terminal, Copy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';

export default function ApiDocs() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('YOUR_API_KEY');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchFirstKey();
  }, [user]);

  const fetchFirstKey = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'api_keys'), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        // We only store the hash, so we can't show the real key here.
        // We'll show a placeholder indicating they need to use their saved key.
        setApiKey('<YOUR_SAVED_API_KEY>');
      }
    } catch (error) {
      console.error('Error fetching key:', error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlCode = `curl -X POST https://api.satyaapi.com/v1/fact-check \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "claim": "The new 5G towers are causing viral outbreaks in Mumbai.",
    "language": "en"
  }'`;

  const pythonCode = `import requests

url = "https://api.satyaapi.com/v1/fact-check"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "${apiKey}"
}
data = {
    "claim": "The new 5G towers are causing viral outbreaks in Mumbai.",
    "language": "en"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())`;

  const jsCode = `const checkFact = async () => {
  const response = await fetch('https://api.satyaapi.com/v1/fact-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': '${apiKey}'
    },
    body: JSON.stringify({
      claim: 'The new 5G towers are causing viral outbreaks in Mumbai.',
      language: 'en'
    })
  });
  
  const data = await response.json();
  console.log(data);
};`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-12"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-500" />
          API Documentation
        </h1>
        <p className="text-zinc-400 mt-2 text-lg">Integrate the SatyaAPI fact-checking engine into your applications.</p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white border-b border-zinc-800 pb-2">Authentication</h2>
        <p className="text-zinc-300 leading-relaxed">
          All API requests must be authenticated using an API key. You can generate an API key from your <a href="/keys" className="text-emerald-400 hover:underline">API Keys dashboard</a>.
          Include the key in the <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-300">X-API-Key</code> header of your HTTP requests.
        </p>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>Keep your API keys secure. Do not embed them directly in client-side code (like frontend React apps) where they can be exposed to the public. Always proxy requests through your own backend.</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white border-b border-zinc-800 pb-2">Endpoints</h2>
        
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded uppercase tracking-wider">POST</span>
                <code className="text-lg text-white font-mono">/v1/fact-check</code>
              </div>
              <p className="text-zinc-400 text-sm">Verify a single claim against the SatyaAPI database.</p>
            </div>
          </div>
          
          <div className="p-6 bg-zinc-950">
            <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Request Examples
            </h3>
            
            <div className="space-y-6">
              {/* cURL */}
              <div>
                <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg border border-zinc-700 border-b-0">
                  <span className="text-xs font-medium text-zinc-300">cURL</span>
                  <button onClick={() => copyCode(curlCode)} className="text-zinc-400 hover:text-white transition-colors">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <pre className="bg-zinc-900 border border-zinc-700 p-4 rounded-b-lg overflow-x-auto text-sm text-zinc-300 font-mono">
                  {curlCode}
                </pre>
              </div>

              {/* Python */}
              <div>
                <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg border border-zinc-700 border-b-0">
                  <span className="text-xs font-medium text-zinc-300">Python</span>
                  <button onClick={() => copyCode(pythonCode)} className="text-zinc-400 hover:text-white transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="bg-zinc-900 border border-zinc-700 p-4 rounded-b-lg overflow-x-auto text-sm text-zinc-300 font-mono">
                  {pythonCode}
                </pre>
              </div>

              {/* JavaScript */}
              <div>
                <div className="flex items-center justify-between bg-zinc-800 px-4 py-2 rounded-t-lg border border-zinc-700 border-b-0">
                  <span className="text-xs font-medium text-zinc-300">JavaScript (Node.js/Fetch)</span>
                  <button onClick={() => copyCode(jsCode)} className="text-zinc-400 hover:text-white transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <pre className="bg-zinc-900 border border-zinc-700 p-4 rounded-b-lg overflow-x-auto text-sm text-zinc-300 font-mono">
                  {jsCode}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-white border-b border-zinc-800 pb-2">Response Format</h2>
        <p className="text-zinc-300 leading-relaxed">
          The API returns a JSON object containing the verdict, confidence score, detailed reasoning, and metadata about the processing pipeline.
        </p>
        <pre className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl overflow-x-auto text-sm text-emerald-400 font-mono">
{`{
  "claim": "The new 5G towers are causing viral outbreaks in Mumbai.",
  "verdict": "FALSE",
  "confidence": 0.98,
  "reason": "This claim is entirely false. There is no scientific evidence linking 5G technology to viral outbreaks. The WHO and local health authorities have debunked this.",
  "supporting_fact_id": "fact_5g_health_001",
  "model_used": "gemini-2.5-flash-lite",
  "processing_time_ms": 342,
  "language": "en"
}`}
        </pre>
      </section>
    </motion.div>
  );
}
import { AlertTriangle } from 'lucide-react';
