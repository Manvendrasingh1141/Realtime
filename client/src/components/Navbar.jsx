import React from 'react';
import { Radio, Users, Sparkles } from 'lucide-react';

export default function Navbar({ isConnected, currentUser, onHomeClick }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={onHomeClick}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
              Jugaad
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Real-Time Collaborative Messaging</p>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {/* Socket Connection Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="hidden xs:inline">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>

          {/* Anonymous User Tag */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/60 text-slate-300 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="truncate max-w-[120px]">{currentUser}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
