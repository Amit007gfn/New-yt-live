import React, { useState } from 'react';
import { X, Plus, Tv, Key, ShieldCheck } from 'lucide-react';

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChannel: (channelData: {
    name: string;
    streamKey: string;
    resolution: '1080p' | '720p' | 'original';
    bitrate: string;
  }) => Promise<void>;
  channelCount: number;
  lang: 'hi' | 'en';
}

export const AddChannelModal: React.FC<AddChannelModalProps> = ({
  isOpen,
  onClose,
  onAddChannel,
  channelCount,
  lang,
}) => {
  const [name, setName] = useState(`चैनल ${channelCount + 1} - लाइव`);
  const [streamKey, setStreamKey] = useState('');
  const [resolution, setResolution] = useState<'1080p' | '720p' | 'original'>('720p');
  const [bitrate, setBitrate] = useState('2500k');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddChannel({
        name: name.trim() || `YouTube Channel ${channelCount + 1}`,
        streamKey: streamKey.trim(),
        resolution,
        bitrate,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'hi' ? 'नया YouTube चैनल जोड़ें' : 'Add New YouTube Channel'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'hi'
                  ? 'एक और चैनल के लिए 24/7 लाइव स्ट्रीम कॉन्फ़िगर करें'
                  : 'Configure 24/7 stream for another channel'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {lang === 'hi' ? 'चैनल का नाम (Channel Name)' : 'Channel Name'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Channel 6 - Gaming 24/7"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              {lang === 'hi' ? 'YouTube Stream Key' : 'YouTube Stream Key'}
            </label>
            <input
              type="password"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="xxxx-xxxx-xxxx-xxxx-xxxx"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {lang === 'hi'
                ? '(वैकल्पिक: बाद में भी चैनल कार्ड में पेस्ट कर सकते हैं)'
                : '(Optional: You can also paste this later in the channel card)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {lang === 'hi' ? 'क्वालिटी (Quality)' : 'Stream Quality'}
              </label>
              <select
                value={resolution}
                onChange={(e: any) => setResolution(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="720p">720p HD (अनुशंसित - तेज और स्थिर)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="original">Original (वीडियो के अनुसार)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {lang === 'hi' ? 'बिटरेट (Bitrate)' : 'Video Bitrate'}
              </label>
              <select
                value={bitrate}
                onChange={(e) => setBitrate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              >
                <option value="2000k">2000 kbps (कम डेटा)</option>
                <option value="2500k">2500 kbps (YouTube 720p Standard)</option>
                <option value="3500k">3500 kbps (YouTube 1080p)</option>
                <option value="4500k">4500 kbps (High Quality)</option>
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {lang === 'hi'
                ? '24/7 लूपिंग और ऑटो-रिकनेक्ट अपने आप एक्टिव रहेगा।'
                : '24/7 Continuous looping & auto-reconnect are enabled by default.'}
            </span>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-red-600/20"
            >
              <Plus className="w-4 h-4" />
              {loading
                ? lang === 'hi'
                  ? 'जोड़ा जा रहा है...'
                  : 'Adding...'
                : lang === 'hi'
                ? 'चैनल जोड़ें'
                : 'Add Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
