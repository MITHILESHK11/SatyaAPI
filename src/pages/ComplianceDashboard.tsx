import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, FileText, CheckCircle, AlertTriangle, Clock, Settings, Search, Filter } from 'lucide-react';

// Types
type RuleStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ACTIVE' | 'ARCHIVED';
type RuleType = 'THRESHOLD' | 'RANGE' | 'AGGREGATION';

interface ComplianceRule {
  id: number;
  name: string;
  description: string;
  status: RuleStatus;
  type: RuleType;
  target_table: string;
  created_at: string;
}

interface Violation {
  id: number;
  rule_id: number;
  transaction_id: number;
  justification: string;
  is_false_positive: boolean;
  created_at: string;
}

const mockRules: ComplianceRule[] = [
  { id: 1, name: 'Large Transfer Limit', description: 'Flag transfers > $10,000', status: 'ACTIVE', type: 'THRESHOLD', target_table: 'ibm_aml_transactions', created_at: '2023-10-27T10:00:00Z' },
  { id: 2, name: 'High Frequency Velocity', description: 'Flag > 5 transfers in 24h', status: 'PENDING_APPROVAL', type: 'AGGREGATION', target_table: 'ibm_aml_transactions', created_at: '2023-10-28T14:30:00Z' },
  { id: 3, name: 'Suspicious Currency Pair', description: 'Flag specific currency pairs', status: 'DRAFT', type: 'RANGE', target_table: 'ibm_aml_transactions', created_at: '2023-10-29T09:15:00Z' },
];

const mockViolations: Violation[] = [
  { id: 101, rule_id: 1, transaction_id: 54321, justification: 'Amount $15,000 > Threshold $10,000', is_false_positive: false, created_at: '2023-10-30T08:00:00Z' },
  { id: 102, rule_id: 1, transaction_id: 54322, justification: 'Amount $12,500 > Threshold $10,000', is_false_positive: true, created_at: '2023-10-30T08:05:00Z' },
];

export default function ComplianceDashboard() {
  const [activeTab, setActiveTab] = useState<'rules' | 'violations'>('rules');
  const [rules, setRules] = useState<ComplianceRule[]>(mockRules);
  const [violations, setViolations] = useState<Violation[]>(mockViolations);

  const getStatusColor = (status: RuleStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PENDING_APPROVAL': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'DRAFT': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'APPROVED': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'ARCHIVED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-500" />
            Data Policy Compliance Agent
          </h1>
          <p className="text-zinc-400 mt-2">Deterministic enforcement engine for IBM AML dataset.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Upload Policy PDF
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'rules' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Rule Management
          {activeTab === 'rules' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('violations')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'violations' ? 'text-indigo-400' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Violation Logs
          {activeTab === 'violations' && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />
          )}
        </button>
      </div>

      {/* Content */}
      <main>
        {activeTab === 'rules' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Extracted Rules</h2>
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="text" placeholder="Search rules..." className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64" />
                </div>
                <button className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors">
                  <Filter className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-950/50 border-b border-zinc-800 text-zinc-400">
                  <tr>
                    <th className="px-6 py-4 font-medium">Rule Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Target Table</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {rules.map(rule => (
                    <tr key={rule.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-zinc-200">{rule.name}</div>
                        <div className="text-zinc-500 text-xs mt-1">{rule.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-zinc-300">{rule.type}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">{rule.target_table}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(rule.status)}`}>
                          {rule.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {rule.status === 'PENDING_APPROVAL' && (
                          <button className="text-indigo-400 hover:text-indigo-300 text-xs font-medium mr-3">Review & Approve</button>
                        )}
                        <button className="text-zinc-400 hover:text-zinc-300 text-xs font-medium">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'violations' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Violations</h2>
            </div>

            <div className="grid gap-4">
              {violations.map(violation => (
                <div key={violation.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${violation.is_false_positive ? 'bg-zinc-800 text-zinc-500' : 'bg-red-500/10 text-red-500'}`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-zinc-200">Rule ID: {violation.rule_id} triggered on Transaction #{violation.transaction_id}</h3>
                      <span className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(violation.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-3">{violation.justification}</p>
                    <div className="flex items-center gap-3">
                      {violation.is_false_positive ? (
                        <span className="text-xs font-medium text-zinc-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Marked as False Positive
                        </span>
                      ) : (
                        <button className="text-xs font-medium text-zinc-400 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-600 px-3 py-1.5 rounded transition-colors">
                          Mark False Positive
                        </button>
                      )}
                      <button className="text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/50 px-3 py-1.5 rounded transition-colors">
                        View Transaction Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
