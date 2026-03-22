import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, HelpCircle, Clock, Activity, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '../AuthContext';

interface UserHistory {
  id: string;
  claim: string;
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIABLE' | 'ERROR';
  confidence: number;
  reason: string;
  reasoning?: string;
  model_used: string;
  timestamp: any;
}

const VerdictBadge = ({ verdict }: { verdict: UserHistory['verdict'] }) => {
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

export default function History() {
  const [history, setHistory] = useState<UserHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'fact_checks'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newHistory = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserHistory[];
      setHistory(newHistory);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <HistoryIcon className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
        <h2 className="text-xl font-medium text-zinc-300">Sign in to view your history</h2>
        <p className="text-zinc-500 mt-2">Your fact-check history will appear here once you log in.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Your History</h1>
          <p className="text-zinc-400 mt-1">A record of all the claims you have fact-checked.</p>
        </div>
      </header>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
            <p className="text-zinc-400">You haven't checked any claims yet.</p>
          </div>
        ) : (
          history.map((check, index) => (
            <motion.div
              key={check.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <VerdictBadge verdict={check.verdict} />
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {check.timestamp?.toDate().toLocaleTimeString() || 'Just now'}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-zinc-100 leading-snug">
                    "{check.claim}"
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {check.reasoning || check.reason}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-light text-white">
                    {check.confidence ? (check.confidence * 100).toFixed(0) + '%' : 'N/A'}
                  </div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">
                    Confidence
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-2 font-mono">
                    {check.model_used}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
