import React, { useState, useEffect, useCallback } from 'react';
import { Channel, SystemInfo } from './types';
import { Header } from './components/Header';
import { ChannelCard } from './components/ChannelCard';
import { VideoUploadModal } from './components/VideoUploadModal';
import { LogsModal } from './components/LogsModal';
import { GuideModal } from './components/GuideModal';
import { AddChannelModal } from './components/AddChannelModal';
import {
  Radio,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [activeVideoPath, setActiveVideoPath] = useState<string>('');

  const [logsModalOpen, setLogsModalOpen] = useState(false);
  const [logChannelId, setLogChannelId] = useState<string | null>(null);
  const [logChannelName, setLogChannelName] = useState<string>('');

  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [addChannelModalOpen, setAddChannelModalOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Fetch channels list and status
  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(data.channels || []);
      }
    } catch (err) {
      console.error('Failed to fetch channels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch system info
  const fetchSystemInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/system');
      if (res.ok) {
        const data = await res.json();
        setSystemInfo(data);
      }
    } catch (err) {
      console.error('Failed to fetch system info:', err);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    fetchSystemInfo();

    // Poll channels status every 3 seconds for live streaming stats & health
    const interval = setInterval(() => {
      fetchChannels();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchChannels, fetchSystemInfo]);

  // Update channel config
  const handleUpdateChannel = async (id: string, updates: Partial<Channel>) => {
    try {
      const res = await fetch(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        setChannels((prev) => prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)));
      } else {
        showToast(lang === 'hi' ? 'अपडेट करने में विफल' : 'Failed to update channel', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error updating channel', 'error');
    }
  };

  // Start live stream
  const handleStartStream = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/${id}/start`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(
          lang === 'hi'
            ? '🔴 24/7 लाइव स्ट्रीम शुरू हो गई है! YouTube Studio में चेक करें।'
            : '🔴 24/7 Live stream started! Check YouTube Studio.',
          'success'
        );
        fetchChannels();
      } else {
        showToast(data.error || 'स्ट्रीम शुरू करने में त्रुटि', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error starting stream', 'error');
    }
  };

  // Stop live stream
  const handleStopStream = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/${id}/stop`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'hi' ? 'लाइव स्ट्रीम रोक दी गई है।' : 'Live stream stopped.', 'info');
        fetchChannels();
      }
    } catch (e: any) {
      showToast(e.message || 'Error stopping stream', 'error');
    }
  };

  // Start All Streams
  const handleStartAll = async () => {
    try {
      const res = await fetch('/api/channels/start-all', { method: 'POST' });
      const data = await res.json();
      showToast(
        lang === 'hi'
          ? 'सभी कॉन्फ़िगर किए गए चैनलों पर स्ट्रीम शुरू की जा रही है!'
          : 'Starting streams for configured channels!',
        'success'
      );
      fetchChannels();
    } catch (e: any) {
      showToast(e.message || 'Failed to start all', 'error');
    }
  };

  // Stop All Streams
  const handleStopAll = async () => {
    try {
      const res = await fetch('/api/channels/stop-all', { method: 'POST' });
      showToast(lang === 'hi' ? 'सभी लाइव स्ट्रीम बंद कर दी गई हैं।' : 'All live streams stopped.', 'info');
      fetchChannels();
    } catch (e: any) {
      showToast(e.message || 'Failed to stop all', 'error');
    }
  };

  // Add new Channel
  const handleAddChannel = async (channelData: {
    name: string;
    streamKey: string;
    resolution: '1080p' | '720p' | 'original';
    bitrate: string;
  }) => {
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
      });
      if (res.ok) {
        showToast(lang === 'hi' ? 'नया चैनल सफलतापूर्वक जोड़ा गया!' : 'Channel added successfully!', 'success');
        fetchChannels();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to add channel', 'error');
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (id: string) => {
    try {
      const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(lang === 'hi' ? 'चैनल हटा दिया गया।' : 'Channel deleted.', 'info');
        fetchChannels();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to delete channel', 'error');
    }
  };

  // Video Selected from modal
  const handleSelectVideo = async (channelId: string, videoPath: string, videoTitle: string) => {
    await handleUpdateChannel(channelId, { videoPath, videoTitle });
    showToast(
      lang === 'hi' ? `वीडियो सेट हो गई: ${videoTitle}` : `Video set: ${videoTitle}`,
      'success'
    );
  };

  const liveChannelsCount = channels.filter((c) => c.isLive).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs sm:text-sm font-medium ${
              toast.type === 'success'
                ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-red-950 border-red-600 text-red-200'
                : 'bg-slate-850 border-slate-700 text-slate-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-slate-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        systemInfo={systemInfo}
        totalChannels={channels.length}
        liveChannelsCount={liveChannelsCount}
        onStartAll={handleStartAll}
        onStopAll={handleStopAll}
        onOpenAddModal={() => setAddChannelModalOpen(true)}
        onOpenGuideModal={() => setGuideModalOpen(true)}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simple Sada Dashboard Banner / Instructions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded-md">
                {lang === 'hi' ? 'सीधा और सादा डैशबोर्ड' : 'Simple 24/7 Studio'}
              </span>
              <span className="text-xs text-slate-400">
                {lang === 'hi'
                  ? '5 YouTube चैनल • हर चैनल पर एक-एक अलग वीडियो'
                  : '5 YouTube Channels • Dedicated video stream per channel'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {lang === 'hi'
                ? 'कैसे काम करता है: बस Stream Key डालें और Go Live दबाएं!'
                : 'How it works: Just paste Stream Key and click Go Live!'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                {lang === 'hi' ? 'चैनल में Stream Key डालें' : 'Enter Stream Key'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                {lang === 'hi' ? 'रिकॉर्डेड वीडियो चुनें या अपलोड करें' : 'Pick or upload video'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                {lang === 'hi' ? '🔴 Go Live दबाएं (24/7 लूपिंग शुरू)' : 'Click Go Live (24/7 Loop)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setGuideModalOpen(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center gap-2 transition"
            >
              <span>{lang === 'hi' ? 'Stream Key कहाँ मिलेगी?' : 'Where is Stream Key?'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Channels Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              {lang === 'hi' ? 'चैनल लोड हो रहे हैं...' : 'Loading channels...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Tv className="w-4 h-4 text-red-500" />
                <span>
                  {lang === 'hi'
                    ? `आपके YouTube चैनल (${channels.length})`
                    : `Your YouTube Channels (${channels.length})`}
                </span>
              </h3>
              <span className="text-xs text-slate-400">
                {liveChannelsCount > 0 ? (
                  <span className="text-red-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                    {liveChannelsCount} {lang === 'hi' ? 'चैनल लाइव चल रहे हैं' : 'channels currently LIVE'}
                  </span>
                ) : (
                  lang === 'hi' ? 'सभी चैनल तैयार हैं' : 'All channels ready'
                )}
              </span>
            </div>

            {/* Grid of channels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {channels.map((channel, idx) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  index={idx}
                  onUpdateChannel={handleUpdateChannel}
                  onStartStream={handleStartStream}
                  onStopStream={handleStopStream}
                  onOpenVideoModal={(cId, cPath) => {
                    setActiveChannelId(cId);
                    setActiveVideoPath(cPath);
                    setVideoModalOpen(true);
                  }}
                  onOpenLogsModal={(cId, cName) => {
                    setLogChannelId(cId);
                    setLogChannelName(cName);
                    setLogsModalOpen(true);
                  }}
                  onDeleteChannel={handleDeleteChannel}
                  isOnlyChannel={channels.length <= 1}
                  lang={lang}
                />
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights / 24/7 Reliability Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'hi' ? '24/7 नॉन-स्टॉप लाइव लूप' : '24/7 Continuous Loop'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'hi'
                ? 'रिकॉर्डेड वीडियो खत्म होने पर तुरंत दोबारा बिना किसी लैग के फिर से शुरू हो जाती है।'
                : 'Your recorded video loops seamlessly without buffer or interruptions.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'hi' ? 'ऑटो-रिकनेक्ट सुरक्षा' : 'Auto-Reconnect Protection'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'hi'
                ? 'यदि YouTube या नेटवर्क कनेक्शन में कोई रुकावट आती है, तो 3 सेकंड में स्ट्रीम स्वतः दोबारा जुड़ जाती है।'
                : 'If network connection drops, the stream automatically reconnects in 3s.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'hi' ? 'बिना किसी बाहरी सॉफ्टवेयर के' : 'Zero External Software'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'hi'
                ? 'OBS Studio, vMix या किसी तीसरे पक्ष के सॉफ्टवेयर की कोई जरूरत नहीं। सब कुछ सीधे सर्वर से लाइव होता है।'
                : 'No OBS Studio, vMix, or PC load needed. Everything runs directly on server.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-slate-900/40 text-center text-xs text-slate-500">
        <p>
          24/7 Multi-Channel YouTube Live Streaming Studio • Custom Engine • Built with FFmpeg & RTMP
        </p>
      </footer>

      {/* Modals */}
      <VideoUploadModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        channelId={activeChannelId}
        currentVideoPath={activeVideoPath}
        onSelectVideo={handleSelectVideo}
        lang={lang}
      />

      <LogsModal
        isOpen={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        channelId={logChannelId}
        channelName={logChannelName}
        lang={lang}
      />

      <GuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        lang={lang}
      />

      <AddChannelModal
        isOpen={addChannelModalOpen}
        onClose={() => setAddChannelModalOpen(false)}
        onAddChannel={handleAddChannel}
        channelCount={channels.length}
        lang={lang}
      />
    </div>
  );
}
