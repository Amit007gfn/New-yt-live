import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Video, Check, Film, PlayCircle, Loader2, HardDrive, CheckCircle2, ChevronDown } from 'lucide-react';
import { VideoFile, Channel } from '../types';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channels: Channel[];
  currentVideoPath: string;
  onSelectVideo: (channelId: string, videoPath: string, videoTitle: string) => void;
  lang: 'hi' | 'en';
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  channelId,
  channels,
  currentVideoPath,
  onSelectVideo,
  lang,
}) => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTargetChannel, setSelectedTargetChannel] = useState(channelId || channels[0]?.id || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/videos');
      const data = await res.json();
      setVideos(data.videos || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVideos();
      setErrorMsg(null);
      if (channelId) {
        setSelectedTargetChannel(channelId);
      } else if (channels.length > 0) {
        setSelectedTargetChannel(channels[0].id);
      }
    }
  }, [isOpen, channelId, channels]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 95);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          setUploadProgress(100);
          setTimeout(() => {
            setUploading(false);
            fetchVideos();
            if (res.videoPath) {
              const target = selectedTargetChannel || channelId || channels[0]?.id;
              if (target) {
                onSelectVideo(target, res.videoPath, res.originalName || file.name);
              }
              onClose();
            }
          }, 300);
        } else {
          setUploading(false);
          setErrorMsg(lang === 'hi' ? 'अपलोड विफल रहा। कृपया दोबारा प्रयास करें।' : 'Upload failed. Please try again.');
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setErrorMsg(lang === 'hi' ? 'नेटवर्क त्रुटि हुई।' : 'Network error during upload.');
      };

      xhr.send(formData);
    } catch (err: any) {
      setUploading(false);
      setErrorMsg(err.message || 'Upload error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === 'hi' ? 'वीडियो अपलोड और चयन करें' : 'Upload & Select Video'}</span>
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'hi'
                  ? 'अपनी रिकॉर्डेड वीडियो (MP4, MKV, MOV) अपलोड करें जो 24/7 लाइव चलेगी'
                  : 'Upload your recorded video file to stream 24/7 on YouTube'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-700 text-xs text-red-200 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Target Channel Selector */}
          {channels.length > 0 && (
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-xs font-semibold text-slate-300">
                {lang === 'hi' ? 'यह वीडियो किस चैनल पर लगानी है?' : 'Apply this video to channel:'}
              </span>
              <select
                value={selectedTargetChannel}
                onChange={(e) => setSelectedTargetChannel(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
              >
                {channels.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    #{i + 1} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Dropzone - High Visibility */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-7 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              dragActive
                ? 'border-emerald-400 bg-emerald-950/30 scale-[1.01]'
                : 'border-emerald-500/50 hover:border-emerald-400 bg-emerald-950/10 hover:bg-emerald-950/20'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            {uploading ? (
              <div className="w-full max-w-sm space-y-3 py-3">
                <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
                <p className="text-sm font-bold text-white">
                  {lang === 'hi' ? 'वीडियो अपलोड हो रही है...' : 'Uploading video file...'} ({uploadProgress}%)
                </p>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-200 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3 border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">
                  {lang === 'hi' ? 'कंप्यूटर से वीडियो फ़ाइल चुनें (Click to Upload Video)' : 'Click to Upload Video from Computer'}
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  {lang === 'hi'
                    ? 'MP4, MKV, WebM, MOV वीडियो सपोर्टेड है। अपलोड होते ही 24/7 लूपिंग के लिए तैयार हो जाएगी।'
                    : 'Supports MP4, MKV, WebM, MOV. Ready for continuous 24/7 looping once uploaded.'}
                </p>
                <button
                  type="button"
                  className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition pointer-events-none"
                >
                  {lang === 'hi' ? 'फ़ाइल चुनें (.MP4 / .MKV)' : 'Choose Video File'}
                </button>
              </>
            )}
          </div>

          {/* Video Preview if selected */}
          {previewPath && (
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  {lang === 'hi' ? 'वीडियो प्रीव्यू (Preview)' : 'Video Preview'}
                </span>
                <button
                  onClick={() => setPreviewPath(null)}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  {lang === 'hi' ? 'छुपाएं' : 'Hide'}
                </button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden max-h-60">
                <video src={`/${previewPath}`} controls autoPlay loop className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* Available Videos List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'hi' ? 'पहले से मौजूद वीडियो लाइब्रेरी:' : 'Saved Video Library:'}
              </h4>
              <span className="text-xs text-slate-400">{videos.length} videos</span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
              </div>
            ) : videos.length === 0 ? (
              <div className="p-6 bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                {lang === 'hi' ? 'अभी कोई वीडियो उपलब्ध नहीं है। ऊपर अपलोड करें।' : 'No videos found. Upload one above.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-52 overflow-y-auto pr-1">
                {videos.map((vid) => {
                  const isSelected = currentVideoPath === vid.path;
                  return (
                    <div
                      key={vid.path}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/20'
                          : 'border-slate-750 bg-slate-800/60 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{vid.filename}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{vid.sizeMB} MB</span>
                            <span>•</span>
                            <span>{vid.isSample ? 'Built-in Test Video' : 'User Upload'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewPath(vid.path)}
                          className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                        >
                          {lang === 'hi' ? 'प्रीव्यू' : 'Preview'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const target = selectedTargetChannel || channelId || channels[0]?.id;
                            if (target) {
                              onSelectVideo(target, vid.path, vid.filename);
                            }
                            onClose();
                          }}
                          className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {lang === 'hi' ? 'सक्रिय' : 'Active'}
                            </>
                          ) : (
                            lang === 'hi' ? 'चुनें' : 'Select'
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-750 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            {lang === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
