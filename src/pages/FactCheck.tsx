import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Loader2, AlertCircle, CheckCircle2, XCircle, HelpCircle, Activity, Key } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { performRealtimeFactCheck, FactCheckResult } from '../services/factCheckService';

export default function FactCheck() {
  const [claim, setClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'server' | 'general' | null>(null);
  const { user } = useAuth();

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim()) return;

    setLoading(true);
    setError(null);
    setErrorType(null);
    setResult(null);

    const apiKey = localStorage.getItem('satyaapi_api_key');
    if (!apiKey) {
      setError('API Key is missing. You must generate an API key to use this feature.');
      setErrorType('auth');
      setLoading(false);
      return;
    }

    try {
      // Use the real-time fact check service with Google Search grounding
      const postId = `web-${Date.now()}`;
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

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'FALSE': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'MISLEADING': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return <CheckCircle2 className="w-6 h-6" />;
      case 'FALSE': return <XCircle className="w-6 h-6" />;
      case 'MISLEADING': return <AlertCircle className="w-6 h-6" />;
      default: return <HelpCircle className="w-6 h-6" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-white">Verify a Claim</h1>
        <p className="text-zinc-400 text-lg">
          Paste a news headline, social media post, or forward to check its authenticity against our verified database.
        </p>
      </header>

      <form onSubmit={handleCheck} className="relative">
        <div className="relative flex items-center">
          <textarea
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            placeholder="Enter a claim in English, Hindi, or Marathi..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-6 pr-32 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none h-32 transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!claim.trim() || loading}
            className="absolute right-4 bottom-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>
      </form>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3 text-red-400">
            <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-300">Verification Failed</h3>
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden"
        >
          <div className={`p-6 border-b flex items-center gap-4 ${getVerdictColor(result.verdict)}`}>
            {getVerdictIcon(result.verdict)}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{result.verdict}</h2>
              <p className="text-sm opacity-80 font-medium">
                {(result.confidence * 100).toFixed(1)}% Confidence
              </p>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-2">Reasoning</h3>
              <p className="text-zinc-200 text-lg leading-relaxed">{result.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-zinc-800/50">
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Model Used</h4>
                <div className="flex items-center gap-2 text-sm text-zinc-300 font-mono">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  {result.model_used}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Supporting Fact ID</h4>
                <div className="text-sm text-zinc-300 font-mono">
                  {result.supporting_fact_id || 'None'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
