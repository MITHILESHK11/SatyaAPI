import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Zap, Globe, Code, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="bg-zinc-950 min-h-screen text-zinc-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-medium"
          >
            <ShieldCheck className="w-4 h-4" />
            SatyaAPI Fact-Checking API
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-tight"
          >
            Detect Misinformation in <span className="text-emerald-500">Vernacular News</span> Instantly.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto"
          >
            The fastest, most accurate API for fact-checking Indian vernacular news. Powered by Gemini 2.5 Flash and a verified bilingual database.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-8"
          >
            <Link 
              to="/login"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              Get API Key <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/playground"
              className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-semibold transition-all"
            >
              Try Playground
            </Link>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl"
          >
            <Globe className="w-10 h-10 text-indigo-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Multilingual Support</h3>
            <p className="text-zinc-400">Process claims in English, Hindi, Marathi, Tamil, and Telugu with automatic language detection and noise stripping.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl"
          >
            <Zap className="w-10 h-10 text-amber-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Ultra-Fast Routing</h3>
            <p className="text-zinc-400">Smart verdict routing uses Zero-LLM paths for unverifiable claims and Gemini Flash-Lite for high-confidence matches to save costs.</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl"
          >
            <Code className="w-10 h-10 text-emerald-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Developer First</h3>
            <p className="text-zinc-400">Simple REST API with batch processing, comprehensive documentation, and an embeddable widget for your website.</p>
          </motion.div>
        </div>

        {/* Pricing Section */}
        <div className="mt-32 text-center">
          <h2 className="text-3xl font-bold text-white mb-12">Simple, Transparent Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {/* Free */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-white">Starter</h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
                $0
                <span className="ml-1 text-xl font-medium text-zinc-500">/mo</span>
              </div>
              <ul className="mt-8 space-y-4 text-zinc-400">
                <li className="flex items-center gap-3"><CheckIcon /> 1,000 requests/month</li>
                <li className="flex items-center gap-3"><CheckIcon /> Standard support</li>
                <li className="flex items-center gap-3"><CheckIcon /> 1 API Key</li>
              </ul>
              <Link to="/login" className="mt-8 block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-center rounded-xl font-medium transition-colors">Get Started</Link>
            </div>
            
            {/* Pro */}
            <div className="bg-zinc-900 border border-emerald-500/50 p-8 rounded-2xl relative shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              <div className="absolute top-0 right-6 transform -translate-y-1/2">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Pro</h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
                $49
                <span className="ml-1 text-xl font-medium text-zinc-500">/mo</span>
              </div>
              <ul className="mt-8 space-y-4 text-zinc-400">
                <li className="flex items-center gap-3"><CheckIcon /> 50,000 requests/month</li>
                <li className="flex items-center gap-3"><CheckIcon /> Priority support</li>
                <li className="flex items-center gap-3"><CheckIcon /> Up to 5 API Keys</li>
                <li className="flex items-center gap-3"><CheckIcon /> Batch processing</li>
              </ul>
              <Link to="/login" className="mt-8 block w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-center rounded-xl font-medium transition-colors">Start Free Trial</Link>
            </div>

            {/* Enterprise */}
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl">
              <h3 className="text-xl font-semibold text-white">Enterprise</h3>
              <div className="mt-4 flex items-baseline text-5xl font-extrabold text-white">
                Custom
              </div>
              <ul className="mt-8 space-y-4 text-zinc-400">
                <li className="flex items-center gap-3"><CheckIcon /> Unlimited requests</li>
                <li className="flex items-center gap-3"><CheckIcon /> 24/7 SLA</li>
                <li className="flex items-center gap-3"><CheckIcon /> Custom models</li>
                <li className="flex items-center gap-3"><CheckIcon /> Dedicated account manager</li>
              </ul>
              <a href="mailto:contact@satyaapi.com" className="mt-8 block w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-center rounded-xl font-medium transition-colors">Contact Sales</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function CheckIcon() {
  return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
}
import { CheckCircle2 } from 'lucide-react';
