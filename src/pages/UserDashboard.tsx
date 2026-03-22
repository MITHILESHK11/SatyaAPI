import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, HelpCircle, BarChart3, Clock } from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCalls: 0,
    trueCount: 0,
    falseCount: 0,
    misleadingCount: 0,
    unverifiableCount: 0,
  });
  const [recentChecks, setRecentChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/user/usage', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch usage data');
      const data = await response.json();

      setStats({
        totalCalls: data.totalCalls,
        trueCount: data.breakdown.TRUE || 0,
        falseCount: data.breakdown.FALSE || 0,
        misleadingCount: data.breakdown.MISLEADING || 0,
        unverifiableCount: data.breakdown.UNVERIFIABLE || 0,
      });
      
      setRecentChecks(data.recentLogs || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'TRUE': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'FALSE': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'MISLEADING': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      default: return <HelpCircle className="w-5 h-5 text-zinc-500" />;
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
      className="max-w-7xl mx-auto space-y-8"
    >
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome, {user?.displayName || 'Developer'}</h1>
          <p className="text-zinc-400 mt-1">Here's an overview of your API usage and recent activity.</p>
        </div>
        <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-sm font-medium text-zinc-300">API Status: Operational</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Total API Calls</h3>
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="text-4xl font-bold text-white">{stats.totalCalls}</div>
          <div className="mt-2 text-sm text-zinc-500">This billing cycle</div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">True Verdicts</h3>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-4xl font-bold text-white">{stats.trueCount}</div>
          <div className="mt-2 text-sm text-zinc-500">{((stats.trueCount / (stats.totalCalls || 1)) * 100).toFixed(1)}% of total</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">False Verdicts</h3>
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-4xl font-bold text-white">{stats.falseCount}</div>
          <div className="mt-2 text-sm text-zinc-500">{((stats.falseCount / (stats.totalCalls || 1)) * 100).toFixed(1)}% of total</div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-zinc-400 font-medium">Misleading</h3>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-4xl font-bold text-white">{stats.misleadingCount}</div>
          <div className="mt-2 text-sm text-zinc-500">{((stats.misleadingCount / (stats.totalCalls || 1)) * 100).toFixed(1)}% of total</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Placeholder */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-400" />
              Daily Usage
            </h2>
            <select className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-1.5 outline-none">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2 pt-8">
            {/* Mock Chart Bars */}
            {[40, 70, 45, 90, 65, 85, 100].map((height, i) => (
              <div key={i} className="w-full bg-zinc-800/50 rounded-t-sm relative group">
                <div 
                  className="absolute bottom-0 w-full bg-emerald-500/80 rounded-t-sm transition-all duration-500"
                  style={{ height: `${height}%` }}
                ></div>
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-xs text-white px-2 py-1 rounded transition-opacity">
                  {height * 12} calls
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-zinc-500">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-zinc-400" />
              Recent Checks
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {loading ? (
              <div className="text-center py-8 text-zinc-500">Loading history...</div>
            ) : recentChecks.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">No recent checks found.</div>
            ) : (
              recentChecks.map((check) => (
                <div key={check.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <p className="text-sm text-zinc-300 line-clamp-2 flex-1 leading-relaxed">
                      "{check.claim}"
                    </p>
                    {getVerdictIcon(check.verdict)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getVerdictColor(check.verdict)}`}>
                      {check.verdict}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {check.timestamp ? new Date(check.timestamp).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
