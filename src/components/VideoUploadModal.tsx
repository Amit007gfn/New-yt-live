import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Video, Check, Film, PlayCircle, Loader2, HardDrive } from 'lucide-react';
import { VideoFile } from '../types';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  currentVideoPath: string;
  onSelectVideo: (channelId: string, videoPath: string, videoTitle: string) => void;
  lang: 'hi' | 'en';
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({
  isOpen,
  onClose,
  channelId,
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
    }
  }, [isOpen]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setErrorMsg(null);
    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('video', file);

    try {
      // Use XMLHttpRequest for real upload progress
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 90);
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
              onSelectVideo(channelId, res.videoPath, res.originalName || file.name);
              onClose();
            }
          }, 400);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {lang === 'hi' ? 'लाइव स्ट्रीम के लिए वीडियो चुनें / अपलोड करें' : 'Select or Upload Video for Stream'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'hi'
                  ? 'MP4, MKV, WebM या MOV वीडियो जो 24/7 लूप पर लाइव चलेगी'
                  : 'Pre-recorded video files that loop 24/7 on this YouTube channel'}
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-xs text-red-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer ${
              dragActive
                ? 'border-indigo-400 bg-indigo-950/30'
                : 'border-slate-700 hover:border-slate-500 bg-slate-800/40 hover:bg-slate-800/60'
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
              <div className="w-full max-w-xs space-y-3 py-2">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs font-medium text-slate-200">
                  {lang === 'hi' ? 'वीडियो अपलोड हो रही है...' : 'Uploading video...'} ({uploadProgress}%)
                </p>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {lang === 'hi' ? 'अपनी रिकॉर्डेड वीडियो यहाँ अपलोड करें' : 'Click or Drag & Drop Video here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  MP4, MKV, MOV, WebM (24/7 लूपिंग के लिए पूरी तरह अनुकूलित)
                </p>
              </>
            )}
          </div>

          {/* Video Preview if selected */}
          {previewPath && (
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1.5">
                  <PlayCircle className="w-4 h-4 text-emerald-400" />
                  {lang === 'hi' ? 'वीडियो प्रीव्यू (Preview)' : 'Video Preview'}
                </span>
                <button
                  onClick={() => setPreviewPath(null)}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Hide'}
                </button>
              </div>
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <video src={`/${previewPath}`} controls autoPlay loop className="w-full h-full object-contain" />
              </div>
            </div>
          )}

          {/* Available Videos List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                {lang === 'hi' ? 'उपलब्ध वीडियो लाइब्रेरी (Saved & Presets):' : 'Available Video Library:'}
              </h4>
              <span className="text-xs text-slate-400">{videos.length} videos</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...'}
              </div>
            ) : videos.length === 0 ? (
              <div className="p-6 bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                {lang === 'hi' ? 'अभी कोई वीडियो उपलब्ध नहीं है। ऊपर अपलोड करें।' : 'No videos found. Upload one above.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {videos.map((vid) => {
                  const isSelected = currentVideoPath === vid.path;
                  return (
                    <div
                      key={vid.path}
                      className={`p-3 rounded-xl border flex items-center justify-between transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/30'
                          : 'border-slate-750 bg-slate-800/50 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{vid.filename}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span>{vid.sizeMB} MB</span>
                            <span>•</span>
                            <span>{vid.isSample ? 'Built-in Preset' : 'Uploaded'}</span>
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
                            onSelectVideo(channelId, vid.path, vid.filename);
                            onClose();
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {lang === 'hi' ? 'चुना हुआ' : 'Active'}
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
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-medium transition"
          >
            {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};
