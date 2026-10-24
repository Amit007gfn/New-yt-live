import React, { useEffect, useState, useRef } from 'react';
import { X, Terminal, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string | null;
  channelName: string;
  lang: 'hi' | 'en';
}

export const LogsModal: React.FC<LogsModalProps> = ({ isOpen, onClose, channelId, channelName, lang }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    if (!channelId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/channels/${channelId}/logs`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && channelId) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen, channelId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleClear = async () => {
    if (!channelId) return;
    await fetch(`/api/channels/${channelId}/logs/clear`, { method: 'POST' });
    setLogs([]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[75vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">
                  {lang === 'hi' ? 'लाइव स्ट्रीम कंसोल लॉग्स' : 'Live Stream Console Logs'}
                </h3>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                  {channelName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">FFmpeg RTMP 24/7 Engine Output</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLogs}
              title={lang === 'hi' ? 'रिफ्रेश करें' : 'Refresh'}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              onClick={handleCopy}
              title={lang === 'hi' ? 'लॉग्स कॉपी करें' : 'Copy Logs'}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleClear}
              title={lang === 'hi' ? 'लॉग्स साफ़ करें' : 'Clear Logs'}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div
          ref={scrollRef}
          className="flex-1 bg-black/95 p-4 font-mono text-xs text-emerald-400/90 overflow-y-auto leading-relaxed select-text space-y-1"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-8 text-center">
              {lang === 'hi'
                ? 'अभी कोई लॉग दर्ज नहीं हुआ है। जब आप स्ट्रीम शुरू करेंगे तो यहाँ रियल-टाइम लॉग्स दिखेंगे।'
                : 'No logs yet. Logs will appear here in real-time when the stream starts.'}
            </div>
          ) : (
            logs.map((line, idx) => (
              <div
                key={idx}
                className={`py-0.5 whitespace-pre-wrap break-all ${
                  line.includes('error') || line.includes('Error') || line.includes('failed')
                    ? 'text-red-400 font-semibold'
                    : line.includes('Starting') || line.includes('live')
                    ? 'text-cyan-300 font-semibold'
                    : line.includes('frame=')
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {line}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{lang === 'hi' ? 'ऑटो-रिफ्रेश सक्रिय (Auto-updating every 2.5s)' : 'Auto-updating every 2.5s'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-medium transition"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
