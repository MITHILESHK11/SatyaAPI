/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Mic, LayoutDashboard, Search, LogOut, LogIn, History as HistoryIcon, Key, BookOpen, PlayCircle } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import { ErrorBoundary } from './ErrorBoundary';
import { ProtectedRoute } from './ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import UserDashboard from './pages/UserDashboard';
import ApiKeys from './pages/ApiKeys';
import Playground from './pages/Playground';
import ApiDocs from './pages/ApiDocs';
import Dashboard from './pages/Dashboard'; // The live feed
import FactCheck from './pages/FactCheck';
import VoiceAssistant from './pages/VoiceAssistant';
import History from './pages/History';
import ComplianceDashboard from './pages/ComplianceDashboard';

function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/keys', label: 'API Keys', icon: Key },
    { path: '/playground', label: 'Playground', icon: PlayCircle },
    { path: '/docs', label: 'Docs', icon: BookOpen },
    { path: '/live-feed', label: 'Live Feed', icon: Search },
  ];

  // Don't show navigation on landing or auth pages if not logged in
  if (!user && (location.pathname === '/' || location.pathname === '/login')) {
    return (
      <nav className="bg-zinc-950 border-b border-zinc-800 text-zinc-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 text-white font-semibold text-xl tracking-tight">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              SatyaAPI
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Sign In</Link>
              <Link to="/login" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-zinc-950 border-b border-zinc-800 text-zinc-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 text-white font-semibold text-xl tracking-tight">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              SatyaAPI
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {user && navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800/50 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {user.photoURL && (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-zinc-700" referrerPolicy="no-referrer" />
                  )}
                  <span className="text-sm font-medium hidden sm:block">{user.displayName}</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-zinc-200 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-zinc-900 text-zinc-100 font-sans selection:bg-emerald-500/30">
            <Navigation />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<AuthPage />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                <Route path="/keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
                <Route path="/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
                <Route path="/docs" element={<ProtectedRoute><ApiDocs /></ProtectedRoute>} />
                <Route path="/live-feed" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                
                {/* Legacy / Other Protected Routes */}
                <Route path="/check" element={<ProtectedRoute><FactCheck /></ProtectedRoute>} />
                <Route path="/voice" element={<ProtectedRoute><VoiceAssistant /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/compliance" element={<ProtectedRoute><ComplianceDashboard /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
