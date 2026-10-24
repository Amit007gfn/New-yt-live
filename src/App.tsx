import React, { useState, useEffect, useCallback } from 'react';
import { Channel, SystemInfo } from './types';
import { Header } from './components/Header';
import { ChannelCard } from './components/ChannelCard';
import { VideoUploadModal } from './components/VideoUploadModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { LogsModal } from './components/LogsModal';
import { GuideModal } from './components/GuideModal';
import { AddChannelModal } from './components/AddChannelModal';
import {
  Radio,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  ShieldCheck,
  Zap,
  Upload,
  Cloud,
  Server,
  AlertCircle,
} from 'lucide-react';

// Default 5 channels so the app NEVER displays 0 channels on cold start or Vercel
const DEFAULT_CHANNELS: Channel[] = [
  {
    id: 'ch-1',
    name: 'चैनल 1 - मुख्य लाइव (Main Channel)',
    rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: '',
    videoPath: 'uploads/sample_test_stream.mp4',
    videoTitle: 'Test Live Stream Video',
    loop: true,
    resolution: '720p',
    bitrate: '2500k',
    audioBitrate: '128k',
    fps: 30,
    autoRestart: true,
    isLive: false,
    status: 'idle',
    startedAt: null,
    stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
  },
  {
    id: 'ch-2',
    name: 'चैनल 2 - लो-फाई / म्यूजिक (Lofi Beats)',
    rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: '',
    videoPath: 'uploads/lofi_ambient_loop.mp4',
    videoTitle: 'Lofi Ambient Color Loop',
    loop: true,
    resolution: '720p',
    bitrate: '2500k',
    audioBitrate: '128k',
    fps: 30,
    autoRestart: true,
    isLive: false,
    status: 'idle',
    startedAt: null,
    stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
  },
  {
    id: 'ch-3',
    name: 'चैनल 3 - गेमिंग 24/7 (Gaming Live)',
    rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: '',
    videoPath: 'uploads/sample_test_stream.mp4',
    videoTitle: 'Test Live Stream Video',
    loop: true,
    resolution: '720p',
    bitrate: '3000k',
    audioBitrate: '128k',
    fps: 30,
    autoRestart: true,
    isLive: false,
    status: 'idle',
    startedAt: null,
    stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
  },
  {
    id: 'ch-4',
    name: 'चैनल 4 - भक्ति / भजन / पॉडकास्ट (Devotional)',
    rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: '',
    videoPath: 'uploads/lofi_ambient_loop.mp4',
    videoTitle: 'Lofi Ambient Color Loop',
    loop: true,
    resolution: '720p',
    bitrate: '2500k',
    audioBitrate: '128k',
    fps: 30,
    autoRestart: true,
    isLive: false,
    status: 'idle',
    startedAt: null,
    stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
  },
  {
    id: 'ch-5',
    name: 'चैनल 5 - समाचार / अपडेट्स (News & Alerts)',
    rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: '',
    videoPath: 'uploads/sample_test_stream.mp4',
    videoTitle: 'Test Live Stream Video',
    loop: true,
    resolution: '720p',
    bitrate: '2500k',
    audioBitrate: '128k',
    fps: 30,
    autoRestart: true,
    isLive: false,
    status: 'idle',
    startedAt: null,
    stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
  },
];

// Safe JSON fetcher that NEVER crashes with "Unexpected token 'T', The page c... is not valid JSON"
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      // Server returned HTML or text (such as Vercel 404 "The page could not be found")
      return {
        ok: false,
        status: res.status,
        error:
          res.status === 404
            ? 'API endpoint not found (404)'
            : `Server returned non-JSON response (${res.status})`,
      };
    }

    const data = await res.json();
    return {
      ok: res.ok,
      status: res.status,
      data,
      error: !res.ok ? data?.error || `HTTP ${res.status}` : undefined,
    };
  } catch (err: any) {
    return { ok: false, status: 0, error: err.message || 'Network error' };
  }
}

export default function App() {
  // Initialize channels from localStorage or fallback to DEFAULT_CHANNELS
  const [channels, setChannels] = useState<Channel[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('yt_streamer_channels');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Error loading channels from localStorage', e);
      }
    }
    return DEFAULT_CHANNELS;
  });

  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [lang, setLang] = useState<'hi' | 'en'>('hi');

  // Modals state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [activeVideoPath, setActiveVideoPath] = useState<string>('');

  const [driveModalOpen, setDriveModalOpen] = useState(false);
  const [driveTargetChannelId, setDriveTargetChannelId] = useState<string>('');

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
    }, 4500);
  };

  // Helper to persist channels in localStorage
  const persistChannels = (newChannels: Channel[]) => {
    try {
      localStorage.setItem('yt_streamer_channels', JSON.stringify(newChannels));
    } catch (e) {}
  };

  // Fetch channels list and status from backend
  const fetchChannels = useCallback(async () => {
    try {
      const res = await safeFetchJson<{ channels: Channel[] }>('/api/channels');
      if (res.ok && res.data?.channels && res.data.channels.length > 0) {
        setChannels(res.data.channels);
        persistChannels(res.data.channels);
        setBackendAvailable(true);
      } else {
        // Backend not returning valid JSON (e.g. static hosting on Vercel)
        if (res.status === 404 || !res.ok) {
          setBackendAvailable(false);
        }
      }
    } catch (err) {
      setBackendAvailable(false);
    }
  }, []);

  // Fetch system info
  const fetchSystemInfo = useCallback(async () => {
    try {
      const res = await safeFetchJson<SystemInfo>('/api/system');
      if (res.ok && res.data) {
        setSystemInfo(res.data);
        setBackendAvailable(true);
      } else {
        setBackendAvailable(false);
      }
    } catch (err) {
      setBackendAvailable(false);
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    fetchSystemInfo();

    // Poll channels status every 4 seconds if backend is available
    const interval = setInterval(() => {
      fetchChannels();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchChannels, fetchSystemInfo]);

  // Update channel config
  const handleUpdateChannel = async (id: string, updates: Partial<Channel>) => {
    // 1. Immediately update UI state & localStorage
    setChannels((prev) => {
      const updated = prev.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch));
      persistChannels(updated);
      return updated;
    });

    // 2. Sync to server if backend is alive
    try {
      await safeFetchJson(`/api/channels/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      // Ignored since local state is already saved
    }
  };

  // Start live stream
  const handleStartStream = async (id: string) => {
    if (backendAvailable === false) {
      showToast(
        lang === 'hi'
          ? 'सूचना: 24/7 लाइव स्ट्रीमिंग के लिए बैकएंड FFmpeg सर्वर चाहिए। Vercel पर केवल फ़्रंटएंड चलता है; लाइव करने के लिए AI Studio या VPS का उपयोग करें।'
          : 'Notice: 24/7 Live streaming requires an active FFmpeg backend server.',
        'error'
      );
      return;
    }

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>(`/api/channels/${id}/start`, {
        method: 'POST',
      });
      if (res.ok && res.data?.success) {
        showToast(
          lang === 'hi'
            ? '🔴 24/7 लाइव स्ट्रीम शुरू हो गई है! YouTube Studio में चेक करें।'
            : '🔴 24/7 Live stream started! Check YouTube Studio.',
          'success'
        );
        fetchChannels();
      } else {
        showToast(res.error || res.data?.error || 'स्ट्रीम शुरू करने में त्रुटि', 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Error starting stream', 'error');
    }
  };

  // Stop live stream
  const handleStopStream = async (id: string) => {
    // Immediate local state update
    handleUpdateChannel(id, { isLive: false, status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean }>(`/api/channels/${id}/stop`, { method: 'POST' });
      if (res.ok) {
        showToast(lang === 'hi' ? 'लाइव स्ट्रीम रोक दी गई है।' : 'Live stream stopped.', 'info');
        fetchChannels();
      }
    } catch (e: any) {
      // ignore
    }
  };

  // Start All Streams
  const handleStartAll = async () => {
    if (backendAvailable === false) {
      showToast(
        lang === 'hi'
          ? 'सूचना: 24/7 लाइव स्ट्रीमिंग के लिए FFmpeg बैकएंड सर्वर सक्रिय होना चाहिए।'
          : 'Live streaming requires active FFmpeg backend server.',
        'error'
      );
      return;
    }

    try {
      const res = await safeFetchJson('/api/channels/start-all', { method: 'POST' });
      if (res.ok) {
        showToast(
          lang === 'hi'
            ? 'सभी कॉन्फ़िगर किए गए चैनलों पर स्ट्रीम शुरू की जा रही है!'
            : 'Starting streams for configured channels!',
          'success'
        );
        fetchChannels();
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to start all', 'error');
    }
  };

  // Stop All Streams
  const handleStopAll = async () => {
    setChannels((prev) => {
      const updated = prev.map((c) => ({ ...c, isLive: false, status: 'idle' as const }));
      persistChannels(updated);
      return updated;
    });

    try {
      await safeFetchJson('/api/channels/stop-all', { method: 'POST' });
      showToast(lang === 'hi' ? 'सभी लाइव स्ट्रीम बंद कर दी गई हैं।' : 'All live streams stopped.', 'info');
      fetchChannels();
    } catch (e: any) {
      // ignore
    }
  };

  // Add new Channel (Robust, Instant, Safe)
  const handleAddChannel = async (channelData?: {
    name?: string;
    streamKey?: string;
    resolution?: '1080p' | '720p' | 'original';
    bitrate?: string;
  }) => {
    const nextNum = channels.length + 1;
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: channelData?.name?.trim() || `चैनल ${nextNum} - लाइव (Channel ${nextNum})`,
      rtmpServer: 'rtmp://a.rtmp.youtube.com/live2',
      streamKey: channelData?.streamKey?.trim() || '',
      videoPath: 'uploads/sample_test_stream.mp4',
      videoTitle: 'Test Live Stream Video',
      loop: true,
      resolution: channelData?.resolution || '720p',
      bitrate: channelData?.bitrate || '2500k',
      audioBitrate: '128k',
      fps: 30,
      autoRestart: true,
      isLive: false,
      status: 'idle',
      startedAt: null,
      stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
    };

    // 1. Instantly update UI and localStorage so it NEVER fails or delays!
    const updated = [...channels, newChannel];
    setChannels(updated);
    persistChannels(updated);

    showToast(
      lang === 'hi'
        ? `${newChannel.name} सफलतापूर्वक जुड़ गया!`
        : `Channel added successfully!`,
      'success'
    );

    // 2. Sync to server in background if available
    try {
      await safeFetchJson('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel),
      });
    } catch (e) {
      // Ignored since already added locally
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (id: string) => {
    const updated = channels.filter((c) => c.id !== id);
    setChannels(updated);
    persistChannels(updated);
    showToast(lang === 'hi' ? 'चैनल हटा दिया गया।' : 'Channel deleted.', 'info');

    try {
      await safeFetchJson(`/api/channels/${id}`, { method: 'DELETE' });
    } catch (e) {
      // ignore
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

  const openGlobalUpload = () => {
    setActiveChannelId(channels[0]?.id || '');
    setActiveVideoPath('');
    setVideoModalOpen(true);
  };

  const openGlobalDrive = (channelId?: string) => {
    setDriveTargetChannelId(channelId || channels[0]?.id || '');
    setDriveModalOpen(true);
  };

  const liveChannelsCount = channels.filter((c) => c.isLive).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce max-w-md">
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
        onOpenUploadModal={openGlobalUpload}
        onOpenDriveModal={() => openGlobalDrive()}
        lang={lang}
        setLang={setLang}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Vercel or Serverless Deployment Notice (Only shown if backend server is not detected) */}
        {backendAvailable === false && (
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-start gap-3.5 text-xs text-amber-200 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-300">
                {lang === 'hi'
                  ? 'सर्वर कनेक्शन सूचना (Serverless / Static Environment):'
                  : 'Serverless / Static Hosting Environment Detected:'}
              </p>
              <p className="text-slate-300 leading-relaxed">
                {lang === 'hi'
                  ? 'आप इस ऐप को Vercel या स्टैटिक होस्टिंग पर चला रहे हैं। आपके सभी चैनल, सेटिंग्स और Google Drive लिंक सुरक्षित रूप से सेव हैं। 24/7 बिना रुके लाइव स्ट्रीम चलाने के लिए FFmpeg बैकएंड सर्वर (Google AI Studio या VPS/Cloud Run) चालू होना आवश्यक है।'
                  : 'Your channels, Stream Keys, and settings are saved locally. Continuous 24/7 live streaming requires the full-stack FFmpeg background process (hosted on Google AI Studio or Cloud Run/VPS).'}
              </p>
            </div>
          </div>
        )}

        {/* Simple Sada Dashboard Banner / Instructions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-red-400 bg-red-950/60 border border-red-800/50 px-2 py-0.5 rounded-md">
                {lang === 'hi' ? 'सीधा और सादा डैशबोर्ड' : 'Simple 24/7 Studio'}
              </span>
              <span className="text-xs text-slate-400">
                {lang === 'hi'
                  ? '5 YouTube चैनल • Google Drive लिंक या वीडियो अपलोड से 24/7 लाइव'
                  : '5 YouTube Channels • Stream from Google Drive Link or File Upload'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {lang === 'hi'
                ? 'Google Drive लिंक या अपलोड की गई वीडियो से सीधे 24/7 लाइव करें!'
                : 'Stream 24/7 directly using Google Drive links or video uploads!'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px]">
                  1
                </span>
                {lang === 'hi' ? 'Stream Key डालें' : 'Enter Stream Key'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                  2
                </span>
                {lang === 'hi' ? 'Google Drive लिंक डालें या वीडियो चुनें' : 'Paste Drive link or upload'}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold flex items-center justify-center text-[10px]">
                  3
                </span>
                {lang === 'hi' ? '🔴 Go Live दबाएं (24/7 लूपिंग शुरू)' : 'Click Go Live (24/7 Loop)'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Google Drive Button right in Banner */}
            <button
              onClick={() => openGlobalDrive()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-900/30 flex items-center gap-2 transition"
            >
              <Cloud className="w-4 h-4" />
              <span>{lang === 'hi' ? '☁️ Google Drive लिंक' : '☁️ Google Drive Link'}</span>
            </button>

            {/* Direct Upload Video Button in Banner */}
            <button
              onClick={openGlobalUpload}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? '📤 अपलोड' : 'Upload'}</span>
            </button>

            <button
              onClick={() => setGuideModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-amber-300 text-xs font-semibold rounded-xl border border-amber-500/30 flex items-center gap-2 transition"
            >
              <span>{lang === 'hi' ? 'Stream Key गाइड' : 'Stream Key Guide'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Channels Grid */}
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
                onOpenDriveModal={(cId) => openGlobalDrive(cId)}
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

            {/* 1-Click Quick Add Channel Card */}
            <div
              onClick={() => handleAddChannel()}
              role="button"
              tabIndex={0}
              className="rounded-2xl border-2 border-dashed border-slate-700/80 hover:border-red-500/80 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-200 flex flex-col items-center justify-center p-8 text-center cursor-pointer group min-h-[280px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-red-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-md group-hover:shadow-red-600/30 group-hover:scale-105 border border-slate-700 group-hover:border-red-500 mb-3">
                <span className="text-2xl font-bold leading-none">+</span>
              </div>
              <h4 className="text-base font-bold text-slate-200 group-hover:text-white transition">
                {lang === 'hi' ? '+ नया YouTube चैनल जोड़ें' : '+ Add New YouTube Channel'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
                {lang === 'hi'
                  ? `1-क्लिक में चैनल ${channels.length + 1} जोड़ें और लाइव करें`
                  : `Click to add Channel ${channels.length + 1} instantly`}
              </p>
              <span className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 group-hover:bg-red-600 text-slate-300 group-hover:text-white text-xs font-semibold transition border border-slate-700 group-hover:border-red-500">
                {lang === 'hi' ? '➕ नया चैनल' : '➕ Add Channel'}
              </span>
            </div>
          </div>
        </div>

        {/* Feature Highlights / 24/7 Reliability Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'hi' ? 'Google Drive लिंक सपोर्ट' : 'Google Drive Direct Support'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'hi'
                ? 'भारी वीडियो को बार-बार अपलोड करने की जरूरत नहीं। बस Google Drive शेयर लिंक डालें और 24/7 लाइव शुरू करें।'
                : 'No need to manually re-upload heavy video files. Simply paste Drive link.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {lang === 'hi' ? '24/7 ऑटो-रिकनेक्ट सुरक्षा' : 'Auto-Reconnect Protection'}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'hi'
                ? 'यदि YouTube या नेटवर्क कनेक्शन में कोई रुकावट आती है, तो 3 सेकंड में स्ट्रीम स्वतः दोबारा जुड़ जाती है।'
                : 'If network connection drops, the stream automatically reconnects in 3s.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center">
              <Radio className="w-4 h-4" />
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
      <GoogleDriveModal
        isOpen={driveModalOpen}
        onClose={() => setDriveModalOpen(false)}
        channels={channels}
        targetChannelId={driveTargetChannelId}
        onSuccess={(cId, vPath, vTitle) => {
          handleSelectVideo(cId, vPath, vTitle);
          fetchChannels();
        }}
        lang={lang}
      />

      <VideoUploadModal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        channelId={activeChannelId}
        channels={channels}
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
