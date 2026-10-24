import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Download,
  Info,
} from 'lucide-react';
import { Channel } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  targetChannelId: string;
  onSuccess: (channelId: string, videoPath: string, videoTitle: string) => void;
  lang: 'hi' | 'en';
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  channels,
  targetChannelId,
  onSuccess,
  lang,
}) => {
  const [driveUrl, setDriveUrl] = useState('');
  const [selectedChannel, setSelectedChannel] = useState(targetChannelId || channels[0]?.id || '');
  const [videoTitle, setVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [downloadedMB, setDownloadedMB] = useState('0.0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (targetChannelId) {
        setSelectedChannel(targetChannelId);
      } else if (channels.length > 0) {
        setSelectedChannel(channels[0].id);
      }
      setErrorMsg(null);
      setCompleted(false);
      setProgress(0);
      setDownloadedMB('0.0');
    }
  }, [isOpen, targetChannelId, channels]);

  // Poll status of active download job
  useEffect(() => {
    if (!jobId || completed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/drive-download/status/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        const job = data.job;

        if (job) {
          setProgress(job.progress || 0);
          setDownloadedMB(job.downloadedMB || '0.0');

          if (job.status === 'completed') {
            setCompleted(true);
            setLoading(false);
            if (job.videoPath) {
              onSuccess(selectedChannel, job.videoPath, job.videoTitle || 'Google Drive Video');
            }
            clearInterval(interval);
          } else if (job.status === 'error') {
            setErrorMsg(job.error || 'Google Drive से डाउनलोड विफल रहा।');
            setLoading(false);
            setJobId(null);
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [jobId, completed, selectedChannel, onSuccess]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) return;

    setErrorMsg(null);
    setLoading(true);
    setProgress(5);
    setDownloadedMB('0.0');
    setCompleted(false);

    try {
      const res = await fetch('/api/drive-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: driveUrl.trim(),
          channelId: selectedChannel,
          videoTitle: videoTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'त्रुटि हुई। कृपया लिंक जांचें।');
        setLoading(false);
        return;
      }

      if (data.cached) {
        setCompleted(true);
        setLoading(false);
        setProgress(100);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setJobId(data.jobId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'नेटवर्क समस्या');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === 'hi' ? 'Google Drive लिंक से लाइव करें' : 'Stream from Google Drive Link'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'hi'
                  ? 'Drive लिंक पेस्ट करें, वीडियो अपने आप डाउनलोड होकर 24/7 लूप पर लाइव हो जाएगी'
                  : 'Paste Drive link, video will automatically be prepared for 24/7 continuous stream'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/60 border border-red-700 text-xs text-red-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">{errorMsg}</div>
            </div>
          )}

          {/* Target Channel */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {lang === 'hi' ? 'किस YouTube चैनल पर लाइव करना है?' : 'Target YouTube Channel'}
            </label>
            <select
              disabled={loading}
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {channels.map((c, i) => (
                <option key={c.id} value={c.id}>
                  #{i + 1} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Drive Link Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'hi' ? 'Google Drive वीडियो शेयर लिंक' : 'Google Drive Share Link'}</span>
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Video Title (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {lang === 'hi' ? 'वीडियो का नाम (वैकल्पिक)' : 'Custom Video Title (Optional)'}
            </label>
            <input
              type="text"
              disabled={loading}
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder={lang === 'hi' ? 'उदा: 24/7 Bhajan or Lo-Fi Mix' : 'e.g. My 24/7 Stream Video'}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Download Progress Bar */}
          {loading && (
            <div className="p-4 bg-slate-800/90 rounded-xl border border-blue-500/40 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-blue-300 font-semibold">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  {lang === 'hi' ? 'Google Drive से डाउनलोड हो रहा है...' : 'Downloading from Google Drive...'}
                </span>
                <span>{downloadedMB} MB</span>
              </div>
              <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(10, progress)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {lang === 'hi'
                  ? 'डाउनलोड होते ही यह वीडियो 24/7 लूप पर लाइव के लिए सेट हो जाएगी।'
                  : 'Once downloaded, the video will be cached locally for 24/7 uninterrupted looping.'}
              </p>
            </div>
          )}

          {completed && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">
                  {lang === 'hi' ? 'सफलतापूर्वक लोड हो गई!' : 'Successfully Downloaded & Set!'}
                </span>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">
                  {lang === 'hi'
                    ? 'अब आप चैनल कार्ड पर "🔴 Go Live" दबाकर सीधे लाइव शुरू कर सकते हैं।'
                    : 'You can now click Go Live on your channel card.'}
                </p>
              </div>
            </div>
          )}

          {/* Quick Guide on Google Drive Link Sharing */}
          <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
            <div className="font-semibold text-amber-300 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400" />
              <span>{lang === 'hi' ? 'Google Drive लिंक की महत्वपूर्ण सेटिंग:' : 'Google Drive Link Sharing Setting:'}</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
              <li>
                {lang === 'hi'
                  ? 'Google Drive में वीडियो पर Right-click करें और "Share" -> "Share" चुनें।'
                  : 'Right-click video in Google Drive and select "Share".'}
              </li>
              <li>
                {lang === 'hi'
                  ? 'General access को "Anyone with the link" (कोई भी जिसके पास लिंक है) पर सेट करें।'
                  : 'Set General access to "Anyone with the link".'}
              </li>
              <li>{lang === 'hi' ? '"Copy link" दबाकर यहाँ पेस्ट करें।' : 'Click "Copy link" and paste it above.'}</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || !driveUrl.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
                loading || !driveUrl.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{lang === 'hi' ? 'लोड हो रहा है...' : 'Downloading...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{lang === 'hi' ? '📥 Drive से लोड करें' : 'Download & Apply'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
