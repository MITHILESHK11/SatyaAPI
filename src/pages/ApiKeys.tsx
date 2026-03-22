import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { motion } from 'motion/react';
import { Key, Copy, Trash2, Plus, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  createdAt: any;
  lastUsed: any;
  hash: string;
}

export default function ApiKeys() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchKeys();
  }, [user]);

  const fetchKeys = async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch('/user/keys', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch keys');
      const keysData = await response.json();
      setKeys(keysData);
    } catch (error) {
      console.error('Error fetching keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newKeyName.trim()) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/user/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newKeyName })
      });
      
      if (!response.ok) throw new Error('Failed to generate key');
      const data = await response.json();
      
      // Save to localStorage for use in Playground and FactCheck
      localStorage.setItem('satyaapi_api_key', data.key);
      
      // Log the action for auditing
      try {
        await addDoc(collection(db, 'users', user.uid, 'audit_logs'), {
          action: 'API_KEY_CREATED',
          keyName: newKeyName,
          timestamp: serverTimestamp(),
          details: `Generated new API key named "${newKeyName}"`
        });
      } catch (logError) {
        console.error('Failed to write audit log:', logError);
      }

      setGeneratedKey(data.key);
      setNewKeyName('');
      fetchKeys();
    } catch (error) {
      console.error('Error generating key:', error);
    }
  };

  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);

  const confirmRevokeKey = async () => {
    if (!user || !keyToRevoke) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/user/keys/${keyToRevoke}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to revoke key');
      
      // Log the action for auditing
      try {
        const keyObj = keys.find(k => k.id === keyToRevoke);
        const keyName = keyObj ? keyObj.name : 'Unknown Key';
        await addDoc(collection(db, 'users', user.uid, 'audit_logs'), {
          action: 'API_KEY_REVOKED',
          keyName: keyName,
          timestamp: serverTimestamp(),
          details: `Revoked API key named "${keyName}"`
        });
      } catch (logError) {
        console.error('Failed to write audit log:', logError);
      }

      fetchKeys();
      setKeyToRevoke(null);
    } catch (error) {
      console.error('Error revoking key:', error);
    }
  };

  const revokeKey = (keyId: string) => {
    setKeyToRevoke(keyId);
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadKey = () => {
    if (generatedKey) {
      const element = document.createElement("a");
      const file = new Blob([`SATYA_API_KEY=${generatedKey}\n`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `satya_api_key.env`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">API Keys</h1>
        <p className="text-zinc-400 mt-1">Manage your API keys for authenticating requests to SatyaAPI.</p>
      </header>

      {generatedKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <h3 className="text-lg font-medium text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            New API Key Generated
          </h3>
          <p className="text-zinc-300 mt-2 text-sm">
            Please copy this key and store it somewhere safe. For security reasons, <strong>we only store a one-way hash of your key, so we cannot show it to you again</strong>.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="flex-1 bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-lg text-emerald-300 font-mono text-sm break-all">
              {generatedKey}
            </code>
            <button
              onClick={copyKey}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0 relative"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -40, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
                >
                  Copied to clipboard!
                </motion.div>
              )}
            </button>
            <button
              onClick={downloadKey}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
          <button 
            onClick={() => setGeneratedKey(null)}
            className="mt-4 text-sm text-zinc-500 hover:text-zinc-300 underline"
          >
            I have saved my key
          </button>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-medium text-white mb-4">Create New Key</h2>
        <form onSubmit={generateKey} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g., Production Server, Widget Embed"
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={!newKeyName.trim()}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Generate Key
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
          <h2 className="text-lg font-medium text-white">Active Keys</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading keys...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            You don't have any API keys yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-950 text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Prefix</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                  <th className="px-6 py-3 font-medium">Last Used</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-zinc-500" />
                        <span className="text-zinc-200 font-medium">{key.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-zinc-400 font-mono bg-zinc-950 px-2 py-1 rounded">
                        {(key as any).prefix || 'vv_........'}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {key.createdAt ? new Date(key.createdAt).toLocaleDateString() : 'Just now'}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Revoke API Key</h3>
            </div>
            <p className="text-zinc-400 mb-6">
              Are you sure you want to revoke this key? Any applications using it will immediately lose access. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setKeyToRevoke(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRevokeKey}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
              >
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
