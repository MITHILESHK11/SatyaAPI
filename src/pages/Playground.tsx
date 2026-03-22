import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, ShieldCheck, AlertTriangle, XCircle, HelpCircle, Loader2, Code2, AlertCircle as AlertIcon, Key } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { performRealtimeFactCheck, FactCheckResult } from '../services/factCheckService';

export default function Playground() {
  const { user } = useAuth();
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'server' | 'general' | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setErrorType(null);

    const apiKey = localStorage.getItem('satyaapi_api_key');
    if (!apiKey) {
      setError('API Key is missing. You must generate an API key to use the Live Playground.');
      setErrorType('auth');
      setLoading(false);
      return;
    }

    try {
      const postId = `playground-${Date.now()}`;
      const data = await performRealtimeFactCheck(claim, postId);
      
      setResult(data);

      // The backend automatically saves to fact_checks and usage_logs
      // so we don't need to manually save to the user's history collection anymore.

    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setErrorType('network');
        setError('Network error: Could not connect to the SatyaAPI API. Please check your internet connection or try again later.');
      } else {
        if (!errorType) setErrorType('general');
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return <ShieldCheck className="w-8 h-8 text-emerald-500" />;
      case 'FALSE': return <XCircle className="w-8 h-8 text-red-500" />;
      case 'MISLEADING': return <AlertTriangle className="w-8 h-8 text-amber-500" />;
      default: return <HelpCircle className="w-8 h-8 text-zinc-500" />;
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FALSE': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'MISLEADING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-white">Live Playground</h1>
        <p className="text-zinc-400 mt-2">Test the SatyaAPI API directly from your browser. Enter any claim in English, Hindi, Marathi, Tamil, or Telugu.</p>
      </header>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-4 w-6 h-6 text-zinc-500" />
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              placeholder="Paste a news headline, WhatsApp forward, or social media post here..."
              className="w-full pl-14 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all resize-none h-32 text-lg"
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !claim.trim()}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</>
              ) : (
                <><ShieldCheck className="w-5 h-5" /> Verify Claim</>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 text-red-400">
            <AlertIcon className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300">API Request Failed</h3>
              <p className="mt-1 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
          {errorType === 'auth' && (
            <Link 
              to="/keys" 
              className="shrink-0 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Manage API Keys
            </Link>
          )}
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
        >
          <div className="p-8 border-b border-zinc-800 flex items-start gap-6">
            <div className={`p-4 rounded-2xl border ${getVerdictColor(result.verdict)}`}>
              {getVerdictIcon(result.verdict)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{result.verdict}</h2>
                <span className="px-2.5 py-1 bg-zinc-800 text-zinc-300 text-xs font-medium rounded-full border border-zinc-700">
                  {(result.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-lg">
                {result.reason}
              </p>
            </div>
          </div>
          
          <div className="bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Code2 className="w-4 h-4" /> API Response
              </h3>
              <div className="flex gap-4 text-xs text-zinc-500">
                <span>Model: <span className="text-zinc-300 font-mono">{result.model_used || 'gemini-2.5-flash-lite'}</span></span>
                <span>Latency: <span className="text-zinc-300 font-mono">{result.processing_time_ms}ms</span></span>
              </div>
            </div>
            <pre className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl overflow-x-auto text-sm text-emerald-400 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
