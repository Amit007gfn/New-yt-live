import React from 'react';
import {
  Radio,
  Play,
  Square,
  Plus,
  HelpCircle,
  Globe,
  Activity,
  Server,
  Tv,
} from 'lucide-react';
import { SystemInfo } from '../types';

interface HeaderProps {
  systemInfo: SystemInfo | null;
  totalChannels: number;
  liveChannelsCount: number;
  onStartAll: () => Promise<void>;
  onStopAll: () => Promise<void>;
  onOpenAddModal: () => void;
  onOpenGuideModal: () => void;
  lang: 'hi' | 'en';
  setLang: (lang: 'hi' | 'en') => void;
}

export const Header: React.FC<HeaderProps> = ({
  systemInfo,
  totalChannels,
  liveChannelsCount,
  onStartAll,
  onStopAll,
  onOpenAddModal,
  onOpenGuideModal,
  lang,
  setLang,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-red-600/25 border border-red-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  {lang === 'hi' ? '24/7 यूट्यूब लाइव स्ट्रीमर' : '24/7 YouTube Live Studio'}
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                  No OBS Needed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'hi'
                  ? 'रिकॉर्डेड वीडियो को सीधे Stream Key से बिना किसी सॉफ्टवेयर के 24/7 लाइव करें'
                  : 'Stream pre-recorded videos 24/7 directly via Stream Key without external software'}
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Status Counter Pill */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 font-medium">
                <Tv className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {totalChannels} {lang === 'hi' ? 'चैनल' : 'Channels'}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveChannelsCount > 0 ? 'bg-red-500 animate-ping' : 'bg-slate-500'
                  }`}
                />
                <span className={liveChannelsCount > 0 ? 'text-red-400' : 'text-slate-400'}>
                  {liveChannelsCount} {lang === 'hi' ? 'लाइव 24/7' : 'LIVE'}
                </span>
              </div>
            </div>

            {/* Guide Button */}
            <button
              onClick={onOpenGuideModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 transition shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'hi' ? 'स्ट्रीम की गाइड' : 'Stream Key Guide'}</span>
            </button>

            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            {/* Add Channel */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नया चैनल' : 'Add Channel'}</span>
            </button>

            {/* Start All / Stop All */}
            {liveChannelsCount > 0 ? (
              <button
                onClick={onStopAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-700 hover:bg-rose-600 text-white transition shadow-sm shadow-rose-900/30"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>{lang === 'hi' ? 'सभी बंद करें' : 'Stop All'}</span>
              </button>
            ) : (
              <button
                onClick={onStartAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-sm shadow-red-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{lang === 'hi' ? 'सभी लाइव करें' : 'Go Live All'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
