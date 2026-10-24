import React from 'react';
import { X, ExternalLink, Key, CheckCircle, Radio, AlertCircle } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'hi' | 'en';
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === 'hi' ? 'YouTube लाइव स्ट्रीम की (Stream Key) गाइड' : 'YouTube Live Stream Key Guide'}
              </h2>
              <p className="text-xs text-slate-400">
                {lang === 'hi'
                  ? 'बिना किसी सॉफ्टवेयर (OBS) के सीधे 24/7 लाइव स्ट्रीम करने का आसान तरीका'
                  : 'How to stream pre-recorded video 24/7 directly using Stream Key'}
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
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          <div className="p-4 bg-red-950/30 border border-red-800/40 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200 space-y-1">
              <p className="font-semibold text-red-300">
                {lang === 'hi' ? 'किसी बाहरी सॉफ्टवेयर (OBS) की जरूरत नहीं!' : 'No external software (OBS) required!'}
              </p>
              <p>
                {lang === 'hi'
                  ? 'यह कस्टम डैशबोर्ड बैकएंड पर सीधे FFmpeg RTMP इंजन से YouTube सर्वर पर वीडियो भेजता है। बस स्ट्रीम की पेस्ट करें और "Go Live" दबाएं।'
                  : 'This dashboard runs a built-in FFmpeg RTMP engine directly to YouTube servers. Simply paste your Stream Key and hit Go Live.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              {lang === 'hi' ? 'YouTube से Stream Key कैसे प्राप्त करें (4 आसान स्टेप्स):' : 'How to get YouTube Stream Key:'}
            </h3>

            {/* Step 1 */}
            <div className="flex gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                1
              </div>
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {lang === 'hi' ? 'YouTube Studio खोलें' : 'Open YouTube Studio'}
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'hi'
                    ? 'अपने ब्राउज़र में YouTube Studio पर जाएं और अपने चैनल से लॉगिन करें।'
                    : 'Go to YouTube Studio and log in to your YouTube channel.'}
                </p>
                <a
                  href="https://studio.youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 underline font-medium pt-1"
                >
                  studio.youtube.com <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                2
              </div>
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {lang === 'hi' ? '"Go Live" (लाइव जाएं) पर क्लिक करें' : 'Click "Go Live"'}
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'hi'
                    ? 'ऊपर दाईं ओर "Create" बटन दबाएं और "Go Live" चुनें।'
                    : 'Click "Create" button on top right and select "Go live".'}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-red-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                3
              </div>
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {lang === 'hi' ? 'Stream Key (स्ट्रीम की) कॉपी करें' : 'Copy your Stream Key'}
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'hi'
                    ? 'स्ट्रीम सेटिंग्स में "Stream key (paste in encoder)" के आगे "Copy" पर क्लिक करें। (उदा: xxxx-xxxx-xxxx-xxxx-xxxx)'
                    : 'In stream settings, locate "Stream key (paste in encoder)" and click Copy.'}
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                4
              </div>
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {lang === 'hi' ? 'डैशबोर्ड में पेस्ट करें और "Go Live" दबाएं' : 'Paste in Dashboard and Click Go Live'}
                </div>
                <p className="text-xs text-slate-400">
                  {lang === 'hi'
                    ? 'जिस चैनल पर लाइव करना है, उसके Stream Key बॉक्स में पेस्ट करें और "🔴 GO LIVE" दबाएं। वीडियो 24/7 लूप पर लाइव शुरू हो जाएगी!'
                    : 'Paste the key in your target channel card and click GO LIVE. Your video will stream in continuous 24/7 loop!'}
                </p>
              </div>
            </div>
          </div>

          {/* 24/7 Tips */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/40 space-y-2">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4" />
              {lang === 'hi' ? '24/7 नॉन-स्टॉप लाइव के फायदे:' : '24/7 Non-stop Streaming Features:'}
            </h4>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc pl-4">
              <li>{lang === 'hi' ? 'वीडियो बिना रुके बार-बार लूप होता रहेगा (Loop Always ON).' : 'Video loops continuously without stopping.'}</li>
              <li>{lang === 'hi' ? 'इंटरनेट या YouTube ड्रॉप होने पर ऑटो-रिकनेक्ट खुद काम करेगा।' : 'Auto-reconnect automatically recovers from transient network drops.'}</li>
              <li>{lang === 'hi' ? '5 अलग-अलग YouTube चैनलों पर एक साथ 5 अलग वीडियो लाइव कर सकते हैं।' : 'Simultaneously stream 5 different videos on 5 distinct YouTube channels.'}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-red-600/20"
          >
            {lang === 'hi' ? 'समझ आ गया (Got it)' : 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};
