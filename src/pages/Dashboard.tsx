import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Clock, Activity, Zap, FileText, Database, Copy, Search } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface FactCheck {
  id: string;
  claim: string;
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE' | 'ERROR';
  confidence: number;
  reason: string;
  model_used: string;
  timestamp: any;
}

const VerdictBadge = ({ verdict }: { verdict: FactCheck['verdict'] }) => {
  const styles = {
    TRUE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    FALSE: 'bg-red-500/10 text-red-500 border-red-500/20',
    MISLEADING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    UNVERIFIABLE: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    ERROR: 'bg-red-900/10 text-red-600 border-red-900/20',
  };

  const icons = {
    TRUE: CheckCircle2,
    FALSE: XCircle,
    MISLEADING: AlertCircle,
    UNVERIFIABLE: HelpCircle,
    ERROR: AlertCircle,
  };

  const Icon = icons[verdict];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles[verdict]}`}>
      <Icon className="w-3.5 h-3.5" />
      {verdict}
    </span>
  );
};

export default function Dashboard() {
  const [verdicts, setVerdicts] = useState<FactCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inlineClaim, setInlineClaim] = useState('');
  const [inlineResult, setInlineResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalProcessed: 15420,
    avgCompression: 52,
    llmCallsSaved: 3420
  });

  useEffect(() => {
    const fetchVerdicts = async () => {
      try {
        const response = await fetch('/verdicts');
        if (!response.ok) throw new Error('Failed to fetch verdicts');
        const data = await response.json();
        setVerdicts(data);
        setLoading(false);
        setIsConnected(true);
      } catch (error) {
        console.error("Error fetching verdicts:", error);
        setIsConnected(false);
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch('/admin/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchVerdicts();
    fetchStats();
    
    const interval = setInterval(() => {
      fetchVerdicts();
      fetchStats();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const copyApiUrl = () => {
    navigator.clipboard.writeText('https://verivani-api-726587187383.us-central1.run.app/fact-check');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInlineCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineClaim.trim()) return;
    
    setIsChecking(true);
    setInlineResult(null);
    
    try {
      // Mocking API call for inline checker
      await new Promise(resolve => setTimeout(resolve, 1500));
      setInlineResult({
        verdict: inlineClaim.length % 2 === 0 ? 'FALSE' : 'MISLEADING',
        confidence: 0.85,
        reason: 'This is a simulated response from the inline checker.',
        model_used: 'gemini-2.5-flash-lite'
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Live Dashboard</h1>
          <p className="text-zinc-400 mt-1">Real-time fact-checking verdicts across the network.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={copyApiUrl}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-zinc-300 transition-colors border border-zinc-700"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy API URL'}
          </button>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <Activity className={`w-4 h-4 ${isConnected ? 'text-emerald-500 animate-pulse' : 'text-red-500'}`} />
            <span className={`text-sm font-medium ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <h3 className="font-medium">Total Processed</h3>
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalProcessed.toLocaleString()}</div>
          <p className="text-xs text-zinc-500 mt-2">Claims analyzed across all feeds</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-medium">Avg Compression</h3>
          </div>
          <div className="text-3xl font-bold text-white">{stats.avgCompression}%</div>
          <p className="text-xs text-zinc-500 mt-2">Token reduction via noise stripping</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 text-zinc-400 mb-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="font-medium">LLM Calls Saved</h3>
          </div>
          <div className="text-3xl font-bold text-white">{stats.llmCallsSaved.toLocaleString()}</div>
          <p className="text-xs text-zinc-500 mt-2">Via Zero-LLM Vector Search path</p>
        </div>
      </div>

      {/* Inline Checker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Quick Inline Checker</h3>
        <form onSubmit={handleInlineCheck} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={inlineClaim}
              onChange={(e) => setInlineClaim(e.target.value)}
              placeholder="Paste a claim here to check instantly..."
              className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isChecking || !inlineClaim.trim()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {isChecking ? 'Checking...' : 'Verify Claim'}
          </button>
        </form>
        
        {inlineResult && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-4 bg-zinc-950 border border-zinc-800 rounded-lg flex items-start gap-4"
          >
            <VerdictBadge verdict={inlineResult.verdict} />
            <div className="flex-1">
              <p className="text-sm text-zinc-300">{inlineResult.reason}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500 font-mono">
                <span>Confidence: {(inlineResult.confidence * 100).toFixed(0)}%</span>
                <span>Model: {inlineResult.model_used}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Live Verdicts Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-lg font-medium text-white">Recent Verdicts (Auto-polling)</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading live feed...</div>
        ) : verdicts.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No fact checks processed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Claim</th>
                  <th className="px-6 py-3 font-medium">Verdict</th>
                  <th className="px-6 py-3 font-medium">Confidence</th>
                  <th className="px-6 py-3 font-medium">Model Used</th>
                  <th className="px-6 py-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {verdicts.map((check) => (
                  <tr key={check.id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-zinc-200 font-medium truncate max-w-md" title={check.claim}>
                        {check.claim.length > 80 ? check.claim.substring(0, 80) + '...' : check.claim}
                      </div>
                      <div className="text-zinc-500 text-xs mt-1 truncate max-w-md" title={check.reason}>
                        {check.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <VerdictBadge verdict={check.verdict} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${check.confidence > 0.8 ? 'bg-emerald-500' : check.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${check.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-zinc-400 font-mono text-xs">{(check.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-400">
                        {check.model_used}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 text-xs whitespace-nowrap">
                      {check.timestamp ? new Date(check.timestamp).toLocaleTimeString() : 'Just now'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
