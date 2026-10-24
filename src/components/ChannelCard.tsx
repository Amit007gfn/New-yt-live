import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  Square,
  Key,
  Eye,
  EyeOff,
  Video,
  FileVideo,
  Settings,
  Terminal,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Repeat,
  ExternalLink,
  Upload,
  Loader2,
  Check,
  Film,
  Cloud,
  Download,
  Link as LinkIcon,
} from 'lucide-react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  index: number;
  onUpdateChannel: (id: string, updates: Partial<Channel>) => Promise<void>;
  onStartStream: (id: string) => Promise<void>;
  onStopStream: (id: string) => Promise<void>;
  onOpenVideoModal: (channelId: string, currentVideoPath: string) => void;
  onOpenDriveModal: (channelId: string) => void;
  onOpenLogsModal: (channelId: string, channelName: string) => void;
  onDeleteChannel: (id: string) => Promise<void>;
  isOnlyChannel: boolean;
  lang: 'hi' | 'en';
}

export const ChannelCard: React.FC<ChannelCardProps> = ({
  channel,
  index,
  onUpdateChannel,
  onStartStream,
  onStopStream,
  onOpenVideoModal,
  onOpenDriveModal,
  onOpenLogsModal,
  onDeleteChannel,
  isOnlyChannel,
  lang,
}) => {
  const [showKey, setShowKey] = useState(false);
  const [streamKeyInput, setStreamKeyInput] = useState(channel.streamKey);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(channel.name);
  const [showSettings, setShowSettings] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Direct card upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Direct card Google Drive input state
  const [showDriveInput, setShowDriveInput] = useState(false);
  const [cardDriveUrl, setCardDriveUrl] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveJobId, setDriveJobId] = useState<string | null>(null);
  const [driveProgress, setDriveProgress] = useState(0);
  const [driveDownloadedMB, setDriveDownloadedMB] = useState('0.0');
  const [driveError, setDriveError] = useState<string | null>(null);
  const [driveSuccess, setDriveSuccess] = useState(false);

  // Auto-format uptime seconds into HH:MM:SS
  const formatUptime = (seconds: number = 0) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveKey = async () => {
    if (streamKeyInput !== channel.streamKey) {
      await onUpdateChannel(channel.id, { streamKey: streamKeyInput.trim() });
    }
  };

  const handleSaveName = async () => {
    setIsEditingName(false);
    if (nameInput.trim() && nameInput !== channel.name) {
      await onUpdateChannel(channel.id, { name: nameInput.trim() });
    } else {
      setNameInput(channel.name);
    }
  };

  const handleToggleLive = async () => {
    setActionLoading(true);
    try {
      if (channel.isLive) {
        await onStopStream(channel.id);
      } else {
        if (streamKeyInput !== channel.streamKey) {
          await onUpdateChannel(channel.id, { streamKey: streamKeyInput.trim() });
        }
        await onStartStream(channel.id);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Video File Upload from card
  const handleDirectFileUpload = (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('video', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 95);
        setUploadProgress(percent);
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        setUploadProgress(100);
        setUploadSuccess(true);
        setUploading(false);

        await onUpdateChannel(channel.id, {
          videoPath: res.videoPath,
          videoTitle: res.originalName || file.name,
        });

        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      } else {
        setUploading(false);
        setUploadError(lang === 'hi' ? 'अपलोड विफल रहा' : 'Upload failed');
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setUploadError(lang === 'hi' ? 'नेटवर्क समस्या' : 'Network error');
    };

    xhr.send(formData);
  };

  // Direct Card Google Drive Download
  const handleCardDriveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardDriveUrl.trim()) return;

    setDriveError(null);
    setDriveSuccess(false);
    setDriveLoading(true);
    setDriveProgress(5);
    setDriveDownloadedMB('0.0');

    try {
      const res = await fetch('/api/drive-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: cardDriveUrl.trim(),
          channelId: channel.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDriveError(data.error || 'अमान्य Google Drive लिंक');
        setDriveLoading(false);
        return;
      }

      if (data.cached) {
        setDriveSuccess(true);
        setDriveLoading(false);
        setDriveProgress(100);
        setShowDriveInput(false);
        setCardDriveUrl('');
      } else {
        setDriveJobId(data.jobId);
      }
    } catch (err: any) {
      setDriveError(err.message || 'त्रुटि हुई');
      setDriveLoading(false);
    }
  };

  // Poll status of card drive job
  useEffect(() => {
    if (!driveJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/drive-download/status/${driveJobId}`);
        if (!res.ok) return;
        const data = await res.json();
        const job = data.job;

        if (job) {
          setDriveProgress(job.progress || 0);
          setDriveDownloadedMB(job.downloadedMB || '0.0');

          if (job.status === 'completed') {
            setDriveSuccess(true);
            setDriveLoading(false);
            setDriveJobId(null);
            setShowDriveInput(false);
            setCardDriveUrl('');
            clearInterval(interval);
          } else if (job.status === 'error') {
            setDriveError(job.error || 'Google Drive से डाउनलोड विफल');
            setDriveLoading(false);
            setDriveJobId(null);
            clearInterval(interval);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [driveJobId]);

  const isLive = channel.isLive;
  const isStarting = channel.status === 'starting';

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 shadow-xl overflow-hidden ${
        isLive
          ? 'bg-slate-900/95 border-red-500/70 shadow-red-950/20 ring-1 ring-red-500/30'
          : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-650'
      }`}
    >
      {/* Top Banner / Channel Title & Status */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-850/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm shadow-md transition-all ${
              isLive
                ? 'bg-red-600 text-white animate-pulse shadow-red-600/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isLive ? <Radio className="w-5 h-5" /> : index + 1}
          </div>

          <div className="min-w-0">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  className="bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1 text-sm text-white focus:outline-none focus:border-red-500 font-semibold"
                />
                <button
                  onClick={handleSaveName}
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded"
                >
                  ✓
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3
                  onClick={() => setIsEditingName(true)}
                  title={lang === 'hi' ? 'क्लिक करके नाम बदलें' : 'Click to edit name'}
                  className="text-base font-bold text-white hover:text-red-400 cursor-pointer truncate transition"
                >
                  {channel.name}
                </h3>
                <span className="text-[10px] text-slate-400 border border-slate-700 rounded px-1.5 py-0.2">
                  #{index + 1}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isLive
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isStarting
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLive
                      ? 'bg-red-500 animate-ping'
                      : isStarting
                      ? 'bg-amber-400 animate-bounce'
                      : 'bg-slate-500'
                  }`}
                />
                {isLive
                  ? lang === 'hi'
                    ? '24/7 लाइव चल रहा है'
                    : '24/7 LIVE'
                  : isStarting
                  ? lang === 'hi'
                    ? 'कनेक्ट हो रहा है...'
                    : 'Connecting...'
                  : lang === 'hi'
                  ? 'ऑफलाइन (तैयार)'
                  : 'OFFLINE'}
              </span>

              {isLive && channel.uptimeSeconds !== undefined && (
                <span className="text-xs text-slate-300 font-mono flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
                  <Clock className="w-3 h-3 text-red-400" />
                  {formatUptime(channel.uptimeSeconds)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenLogsModal(channel.id, channel.name)}
            title={lang === 'hi' ? 'लाइव कंसोल लॉग्स देखें' : 'View Stream Logs'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700/80 transition"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'hi' ? 'लॉग्स' : 'Logs'}</span>
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            title={lang === 'hi' ? 'सेटिंग्स' : 'Settings'}
            className={`p-2 rounded-xl text-xs font-medium border transition ${
              showSettings
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700/80'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {!isOnlyChannel && !isLive && (
            <button
              onClick={() => {
                if (
                  confirm(
                    lang === 'hi'
                      ? 'क्या आप सच में इस चैनल को हटाना चाहते हैं?'
                      : 'Are you sure you want to delete this channel?'
                  )
                ) {
                  onDeleteChannel(channel.id);
                }
              }}
              title={lang === 'hi' ? 'चैनल हटाएं' : 'Delete Channel'}
              className="p-2 bg-slate-800 hover:bg-red-950/60 text-slate-500 hover:text-red-400 rounded-xl text-xs font-medium border border-slate-700/80 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Stream Key Input (Highlight & Simple) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === 'hi' ? 'YouTube Stream Key' : 'YouTube Stream Key'}</span>
              <span className="text-red-400">*</span>
            </label>
            <a
              href="https://studio.youtube.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
            >
              {lang === 'hi' ? 'YouTube Studio से लें' : 'Get from YouTube'}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="relative flex items-center">
            <input
              type={showKey ? 'text' : 'password'}
              disabled={isLive}
              value={streamKeyInput}
              onChange={(e) => setStreamKeyInput(e.target.value)}
              onBlur={handleSaveKey}
              placeholder={
                lang === 'hi'
                  ? 'अपनी YouTube Stream Key यहाँ पेस्ट करें...'
                  : 'Paste your YouTube Stream Key here...'
              }
              className={`w-full bg-slate-800/90 border rounded-xl pl-3.5 pr-20 py-2.5 text-xs font-mono text-white placeholder-slate-500 transition focus:outline-none ${
                !channel.streamKey
                  ? 'border-amber-500/60 focus:border-amber-400'
                  : 'border-slate-700 focus:border-red-500'
              } ${isLive ? 'opacity-80 bg-slate-800/50 cursor-not-allowed' : ''}`}
            />

            <div className="absolute right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                title={showKey ? 'Hide Key' : 'Show Key'}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              {streamKeyInput && streamKeyInput !== channel.streamKey && (
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-[10px] font-semibold transition"
                >
                  Save
                </button>
              )}
            </div>
          </div>
          {!channel.streamKey && (
            <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {lang === 'hi'
                ? 'लाइव करने के लिए ऊपर अपनी Stream Key पेस्ट करें।'
                : 'Please paste your Stream Key above to go live.'}
            </p>
          )}
        </div>

        {/* Video Source Box with Direct Upload, Google Drive, and Library */}
        <div className="p-4 bg-slate-850/80 rounded-xl border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'hi' ? 'लाइव चलने वाली वीडियो' : 'Video for 24/7 Stream'}</span>
            </span>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
              {lang === 'hi' ? '24/7 लूप तैयार' : 'Loop Ready'}
            </span>
          </div>

          {/* Currently selected video name */}
          <div className="flex items-center gap-3 p-2.5 bg-slate-900/90 rounded-lg border border-slate-750">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0">
              <FileVideo className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] text-slate-400">{lang === 'hi' ? 'वर्तमान वीडियो:' : 'Current Video:'}</div>
              <div className="text-xs font-semibold text-white truncate" title={channel.videoTitle || channel.videoPath}>
                {channel.videoTitle || channel.videoPath.split('/').pop()}
              </div>
            </div>
          </div>

          {/* Upload Progress Bar if uploading file */}
          {uploading && (
            <div className="p-3 bg-slate-900 rounded-lg border border-indigo-500/40 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-indigo-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {lang === 'hi' ? 'वीडियो अपलोड हो रही है...' : 'Uploading video...'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Google Drive Download Progress Bar */}
          {driveLoading && (
            <div className="p-3 bg-slate-900 rounded-lg border border-blue-500/40 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  {lang === 'hi' ? 'Google Drive से डाउनलोड हो रहा है...' : 'Downloading from Google Drive...'}
                </span>
                <span>{driveDownloadedMB} MB</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(10, driveProgress)}%` }}
                />
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-2 bg-emerald-950/50 border border-emerald-600/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{lang === 'hi' ? 'वीडियो सफलतापूर्वक अपलोड और सेट हो गई!' : 'Video uploaded & applied!'}</span>
            </div>
          )}

          {driveSuccess && (
            <div className="p-2 bg-emerald-950/50 border border-emerald-600/50 rounded-lg text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{lang === 'hi' ? 'Google Drive वीडियो सफलतापूर्वक लोड हो गई!' : 'Google Drive video set!'}</span>
            </div>
          )}

          {uploadError && (
            <div className="p-2 bg-red-950/50 border border-red-600/50 rounded-lg text-xs text-red-300 flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4" />
              <span>{uploadError}</span>
            </div>
          )}

          {driveError && (
            <div className="p-2.5 bg-red-950/50 border border-red-600/50 rounded-lg text-xs text-red-300 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{driveError}</span>
            </div>
          )}

          {/* Inline Google Drive Link Input Form */}
          {showDriveInput && (
            <form onSubmit={handleCardDriveSubmit} className="p-3 bg-slate-900/90 rounded-xl border border-blue-500/40 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5" />
                  {lang === 'hi' ? 'Google Drive लिंक डालें:' : 'Paste Google Drive Link:'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowDriveInput(false)}
                  className="text-slate-400 hover:text-white text-[11px]"
                >
                  ✕ {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  disabled={driveLoading}
                  value={cardDriveUrl}
                  onChange={(e) => setCardDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/.../view"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={driveLoading || !cardDriveUrl.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{driveLoading ? '...' : lang === 'hi' ? 'लोड करें' : 'Load'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                {lang === 'hi'
                  ? 'Drive में "Anyone with the link" (कोई भी देख सकता है) पर शेयर होना चाहिए।'
                  : 'Link must be set to "Anyone with the link" in Drive.'}
              </p>
            </form>
          )}

          {/* Video Action Buttons (3 Direct Choices: Google Drive, Upload, Library) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleDirectFileUpload(e.target.files[0]);
                }
              }}
            />

            {/* Google Drive Button (Highlight) */}
            <button
              type="button"
              disabled={isLive || uploading || driveLoading}
              onClick={() => setShowDriveInput(!showDriveInput)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition shadow-sm ${
                showDriveInput
                  ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/40'
                  : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border-blue-500/40 hover:border-blue-400'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span>{lang === 'hi' ? '☁️ Drive लिंक' : '☁️ Drive Link'}</span>
            </button>

            {/* Direct Upload Button */}
            <button
              type="button"
              disabled={isLive || uploading || driveLoading}
              onClick={() => fileInputRef.current?.click()}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition shadow-sm ${
                isLive
                  ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-emerald-900/30'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? '📤 अपलोड' : '📤 Upload'}</span>
            </button>

            {/* Select from Library Button */}
            <button
              type="button"
              disabled={isLive || uploading || driveLoading}
              onClick={() => onOpenVideoModal(channel.id, channel.videoPath)}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition ${
                isLive
                  ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border-indigo-500/40 hover:border-indigo-400'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>{lang === 'hi' ? '🎬 लाइब्रेरी' : '🎬 Library'}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Settings Drawer */}
        {showSettings && (
          <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700 space-y-3 animate-fadeIn">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>{lang === 'hi' ? 'स्ट्रीम सेटिंग्स (24/7 Controls)' : 'Stream Settings'}</span>
              <span className="text-[10px] text-slate-400 font-normal">YouTube Live Engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  {lang === 'hi' ? 'स्ट्रीम क्वालिटी (Resolution)' : 'Resolution'}
                </label>
                <select
                  disabled={isLive}
                  value={channel.resolution}
                  onChange={(e) => onUpdateChannel(channel.id, { resolution: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="720p">720p HD (1280x720) - अनुशंसित</option>
                  <option value="1080p">1080p Full HD (1920x1080)</option>
                  <option value="original">Original Video Resolution</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  {lang === 'hi' ? 'बिटरेट (Bitrate)' : 'Bitrate'}
                </label>
                <select
                  disabled={isLive}
                  value={channel.bitrate}
                  onChange={(e) => onUpdateChannel(channel.id, { bitrate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-red-500"
                >
                  <option value="2000k">2000 kbps (Light)</option>
                  <option value="2500k">2500 kbps (YouTube Standard)</option>
                  <option value="3500k">3500 kbps (High)</option>
                  <option value="4500k">4500 kbps (Ultra)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-700/60 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isLive}
                  checked={channel.loop}
                  onChange={(e) => onUpdateChannel(channel.id, { loop: e.target.checked })}
                  className="rounded text-red-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300 flex items-center gap-1">
                  <Repeat className="w-3.5 h-3.5 text-indigo-400" />
                  {lang === 'hi' ? '24/7 लूपिंग हमेशा चालू (Loop 24/7)' : '24/7 Infinite Loop'}
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channel.autoRestart}
                  onChange={(e) => onUpdateChannel(channel.id, { autoRestart: e.target.checked })}
                  className="rounded text-red-600 focus:ring-0 bg-slate-900 border-slate-700"
                />
                <span className="text-slate-300">
                  {lang === 'hi' ? 'ऑटो-रिकनेक्ट (Auto-reconnect)' : 'Auto-reconnect if dropped'}
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Live Stream Stats Bar (only when live) */}
        {isLive && (
          <div className="grid grid-cols-4 gap-2 bg-black/40 p-3 rounded-xl border border-red-500/20 text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Status</div>
              <div className="font-bold text-red-400 flex items-center justify-center gap-1 mt-0.5">
                <Activity className="w-3 h-3 animate-pulse" />
                Live
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">FPS</div>
              <div className="font-bold text-slate-200 mt-0.5">{channel.stats?.fps || 30} fps</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Bitrate</div>
              <div className="font-bold text-slate-200 mt-0.5">{channel.stats?.bitrate || channel.bitrate}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Speed</div>
              <div className="font-bold text-emerald-400 mt-0.5">{channel.stats?.speed || '1.0x'}</div>
            </div>
          </div>
        )}

        {/* Big Action Button (Go Live / Stop) */}
        <div>
          <button
            type="button"
            disabled={actionLoading || (!channel.streamKey && !isLive)}
            onClick={handleToggleLive}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isLive
                ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-900/30 ring-1 ring-rose-500'
                : !channel.streamKey
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30 active:scale-[0.99]'
            }`}
          >
            {actionLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{lang === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Processing...'}</span>
              </span>
            ) : isLive ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>
                  {lang === 'hi' ? 'लाइव स्ट्रीम बंद करें (Stop Stream)' : 'Stop Live Stream'}
                </span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>
                  {lang === 'hi' ? '🔴 24/7 लाइव शुरू करें (Go Live)' : '🔴 Start 24/7 Live Stream'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
