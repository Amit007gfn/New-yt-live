import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import multer from 'multer';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Ensure data and uploads folders exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Channel Interface
export interface ChannelConfig {
  id: string;
  name: string;
  rtmpServer: string; // default "rtmp://a.rtmp.youtube.com/live2"
  streamKey: string;
  videoPath: string; // relative to workspace or absolute
  videoTitle: string;
  loop: boolean;
  resolution: '1080p' | '720p' | 'original';
  bitrate: string; // e.g. "2500k"
  audioBitrate: string; // e.g. "128k"
  fps: number;
  autoRestart: boolean;
  isLive: boolean;
  status: 'idle' | 'starting' | 'live' | 'error' | 'stopped';
  startedAt: number | null;
  errorMessage?: string;
  stats: {
    fps: number;
    bitrate: string;
    speed: string;
    time: string;
    frame: number;
  };
}

const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');

// Default initial channels (5 channels as requested)
const defaultChannels: ChannelConfig[] = [
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

// Load or initialize channels
let channels: ChannelConfig[] = [];

function loadChannels() {
  try {
    if (fs.existsSync(CHANNELS_FILE)) {
      const data = fs.readFileSync(CHANNELS_FILE, 'utf-8');
      channels = JSON.parse(data);
      // Reset live statuses on server start
      channels.forEach((ch) => {
        ch.isLive = false;
        ch.status = 'idle';
        ch.startedAt = null;
        ch.stats = { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 };
      });
    } else {
      channels = [...defaultChannels];
      saveChannels();
    }
  } catch (err) {
    console.error('Error loading channels:', err);
    channels = [...defaultChannels];
  }
}

function saveChannels() {
  try {
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving channels:', err);
  }
}

loadChannels();

// Runtime state for active processes and logs
const activeProcesses = new Map<string, ChildProcess>();
const channelLogs = new Map<string, string[]>();
const restartTimeouts = new Map<string, NodeJS.Timeout>();

function appendLog(channelId: string, message: string) {
  if (!channelLogs.has(channelId)) {
    channelLogs.set(channelId, []);
  }
  const logs = channelLogs.get(channelId)!;
  const timeStr = new Date().toLocaleTimeString();
  logs.push(`[${timeStr}] ${message}`);
  if (logs.length > 150) {
    logs.shift();
  }
}

// Multer upload setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 * 5 }, // 5GB limit for large videos
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper to construct RTMP stream destination URL
function getRtmpDestination(channel: ChannelConfig): string {
  const server = channel.rtmpServer.trim().replace(/\/+$/, '');
  const key = channel.streamKey.trim();
  return `${server}/${key}`;
}

// Start FFmpeg streaming process for a channel
function startStream(channelId: string): { success: boolean; error?: string } {
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) {
    return { success: false, error: 'चैनल नहीं मिला (Channel not found)' };
  }

  if (activeProcesses.has(channelId)) {
    return { success: false, error: 'यह चैनल पहले से लाइव चल रहा है (Already streaming)' };
  }

  if (!channel.streamKey || channel.streamKey.trim() === '') {
    return {
      success: false,
      error: 'स्ट्रीम की (Stream Key) दर्ज नहीं की गई है। कृपया YouTube Studio से अपनी स्ट्रीम की यहाँ डालें।',
    };
  }

  // Check if video file exists
  let resolvedVideoPath = channel.videoPath;
  if (!path.isAbsolute(resolvedVideoPath)) {
    resolvedVideoPath = path.resolve(process.cwd(), channel.videoPath);
  }

  if (!fs.existsSync(resolvedVideoPath)) {
    // If not found, check if default sample is available
    const fallbackPath = path.resolve(UPLOADS_DIR, 'sample_test_stream.mp4');
    if (fs.existsSync(fallbackPath)) {
      resolvedVideoPath = fallbackPath;
      channel.videoPath = 'uploads/sample_test_stream.mp4';
      saveChannels();
    } else {
      return { success: false, error: `वीडियो फ़ाइल नहीं मिली: ${channel.videoPath}` };
    }
  }

  const destination = getRtmpDestination(channel);
  appendLog(channelId, `Starting 24/7 stream engine for ${channel.name}`);
  appendLog(channelId, `Video source: ${path.basename(resolvedVideoPath)}`);
  appendLog(channelId, `Target RTMP: ${channel.rtmpServer} (Key masked)`);

  // Build FFmpeg command arguments
  // -re: read input at real-time native frame rate (essential for live streams)
  // -stream_loop -1: continuous 24/7 infinite loop!
  const args: string[] = ['-re'];

  if (channel.loop) {
    args.push('-stream_loop', '-1');
  }

  args.push('-i', resolvedVideoPath);

  // Video encoding settings optimized for YouTube Live 24/7 stability
  args.push('-c:v', 'libx264');
  args.push('-preset', 'veryfast');
  args.push('-b:v', channel.bitrate || '2500k');
  args.push('-maxrate', channel.bitrate || '2500k');
  args.push('-bufsize', '5000k');
  args.push('-pix_fmt', 'yuv420p');
  args.push('-g', '60'); // keyframe interval of 2 seconds at 30fps

  // Resolution scaling if requested
  if (channel.resolution === '1080p') {
    args.push('-vf', 'scale=1920:1080');
  } else if (channel.resolution === '720p') {
    args.push('-vf', 'scale=1280:720');
  }

  // Audio settings: AAC 128k 44.1kHz (YouTube standard)
  args.push('-c:a', 'aac');
  args.push('-b:a', channel.audioBitrate || '128k');
  args.push('-ar', '44100');

  // Output format FLV to RTMP destination
  args.push('-f', 'flv', destination);

  channel.status = 'starting';
  channel.isLive = true;
  channel.startedAt = Date.now();
  channel.errorMessage = undefined;

  try {
    const ffmpegProc = spawn('ffmpeg', args);
    activeProcesses.set(channelId, ffmpegProc);

    // Parse FFmpeg stderr output for progress & stats
    ffmpegProc.stderr.on('data', (data: Buffer) => {
      const line = data.toString();
      // Keep recent logs
      const trimmed = line.trim();
      if (trimmed) {
        appendLog(channelId, trimmed);
      }

      // Check for live transition
      if (channel.status === 'starting' && line.includes('frame=')) {
        channel.status = 'live';
      }

      // Parse stats: frame=  120 fps= 30 q=28.0 size= 1200kB time=00:00:04.00 bitrate=2400.0kbits/s speed=1.0x
      const frameMatch = line.match(/frame=\s*(\d+)/);
      const fpsMatch = line.match(/fps=\s*([\d.]+)/);
      const bitrateMatch = line.match(/bitrate=\s*([\d.]+\w+)/);
      const speedMatch = line.match(/speed=\s*([\d.]+x)/);
      const timeMatch = line.match(/time=\s*([\d:.]+)/);

      if (frameMatch) channel.stats.frame = parseInt(frameMatch[1], 10);
      if (fpsMatch) channel.stats.fps = parseFloat(fpsMatch[1]);
      if (bitrateMatch) channel.stats.bitrate = bitrateMatch[1];
      if (speedMatch) channel.stats.speed = speedMatch[1];
      if (timeMatch) channel.stats.time = timeMatch[1];
    });

    ffmpegProc.on('error', (err) => {
      appendLog(channelId, `Process error: ${err.message}`);
      channel.status = 'error';
      channel.errorMessage = err.message;
      channel.isLive = false;
      activeProcesses.delete(channelId);
      saveChannels();
    });

    ffmpegProc.on('close', (code) => {
      appendLog(channelId, `FFmpeg process exited with code ${code}`);
      activeProcesses.delete(channelId);

      // If stopped on purpose
      if (channel.status === 'stopped') {
        channel.isLive = false;
        saveChannels();
        return;
      }

      // If unexpected exit and autoRestart is enabled (24/7 reliability)
      if (channel.autoRestart && channel.isLive) {
        channel.status = 'starting';
        appendLog(channelId, `Auto-restart 24/7 activated. Reconnecting stream in 3 seconds...`);
        const timer = setTimeout(() => {
          if (channel.isLive) {
            startStream(channelId);
          }
        }, 3000);
        restartTimeouts.set(channelId, timer);
      } else {
        channel.status = 'idle';
        channel.isLive = false;
        saveChannels();
      }
    });

    return { success: true };
  } catch (err: any) {
    channel.status = 'error';
    channel.isLive = false;
    channel.errorMessage = err.message;
    return { success: false, error: err.message };
  }
}

// Stop stream process for a channel
function stopStream(channelId: string): boolean {
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) return false;

  // Clear any scheduled auto-restart
  if (restartTimeouts.has(channelId)) {
    clearTimeout(restartTimeouts.get(channelId)!);
    restartTimeouts.delete(channelId);
  }

  channel.status = 'stopped';
  channel.isLive = false;
  channel.startedAt = null;

  const proc = activeProcesses.get(channelId);
  if (proc) {
    appendLog(channelId, `Stopping stream requested by user...`);
    try {
      proc.kill('SIGINT');
      setTimeout(() => {
        if (activeProcesses.has(channelId)) {
          proc.kill('SIGKILL');
          activeProcesses.delete(channelId);
        }
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  }

  channel.status = 'idle';
  saveChannels();
  return true;
}

// API Routes

// Get all channels & their live state
app.get('/api/channels', (_req: Request, res: Response) => {
  const responseData = channels.map((c) => {
    const isRunning = activeProcesses.has(c.id);
    return {
      ...c,
      isLive: isRunning,
      status: isRunning ? c.status : 'idle',
      uptimeSeconds: c.startedAt && isRunning ? Math.floor((Date.now() - c.startedAt) / 1000) : 0,
    };
  });
  res.json({ channels: responseData });
});

// Create a new channel
app.post('/api/channels', (req: Request, res: Response) => {
  const { name, rtmpServer, streamKey, videoPath, videoTitle, resolution, bitrate, loop } = req.body;
  const newChannel: ChannelConfig = {
    id: `ch-${Date.now()}`,
    name: name || `YouTube चैनल ${channels.length + 1}`,
    rtmpServer: rtmpServer || 'rtmp://a.rtmp.youtube.com/live2',
    streamKey: streamKey || '',
    videoPath: videoPath || 'uploads/sample_test_stream.mp4',
    videoTitle: videoTitle || 'Default Video',
    loop: loop !== undefined ? Boolean(loop) : true,
    resolution: resolution || '720p',
    bitrate: bitrate || '2500k',
    audioBitrate: '128k',
    fps: 30,
    autoRestart: true,
    isLive: false,
    status: 'idle',
    startedAt: null,
    stats: { fps: 0, bitrate: '0kbits/s', speed: '0x', time: '00:00:00', frame: 0 },
  };

  channels.push(newChannel);
  saveChannels();
  res.json({ success: true, channel: newChannel });
});

// Update a channel
app.put('/api/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = channels.findIndex((c) => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const existing = channels[idx];
  const { name, rtmpServer, streamKey, videoPath, videoTitle, loop, resolution, bitrate, autoRestart } = req.body;

  channels[idx] = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    rtmpServer: rtmpServer !== undefined ? rtmpServer : existing.rtmpServer,
    streamKey: streamKey !== undefined ? streamKey : existing.streamKey,
    videoPath: videoPath !== undefined ? videoPath : existing.videoPath,
    videoTitle: videoTitle !== undefined ? videoTitle : existing.videoTitle,
    loop: loop !== undefined ? Boolean(loop) : existing.loop,
    resolution: resolution !== undefined ? resolution : existing.resolution,
    bitrate: bitrate !== undefined ? bitrate : existing.bitrate,
    autoRestart: autoRestart !== undefined ? Boolean(autoRestart) : existing.autoRestart,
  };

  saveChannels();
  res.json({ success: true, channel: channels[idx] });
});

// Delete a channel
app.delete('/api/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  stopStream(id);
  channels = channels.filter((c) => c.id !== id);
  saveChannels();
  res.json({ success: true });
});

// Start streaming for a single channel
app.post('/api/channels/:id/start', (req: Request, res: Response) => {
  const { id } = req.params;
  const result = startStream(id);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json({ success: true, message: 'लाइव स्ट्रीम शुरू हो गई है (Stream started)' });
});

// Stop streaming for a single channel
app.post('/api/channels/:id/stop', (req: Request, res: Response) => {
  const { id } = req.params;
  const stopped = stopStream(id);
  res.json({ success: stopped, message: 'लाइव स्ट्रीम रोक दी गई है (Stream stopped)' });
});

// Start streaming all configured channels
app.post('/api/channels/start-all', (_req: Request, res: Response) => {
  const results: { id: string; name: string; success: boolean; error?: string }[] = [];
  channels.forEach((ch) => {
    if (ch.streamKey && ch.streamKey.trim() !== '') {
      const res = startStream(ch.id);
      results.push({ id: ch.id, name: ch.name, success: res.success, error: res.error });
    } else {
      results.push({ id: ch.id, name: ch.name, success: false, error: 'स्ट्रीम की गायब है (Stream Key missing)' });
    }
  });
  res.json({ results });
});

// Stop streaming all channels
app.post('/api/channels/stop-all', (_req: Request, res: Response) => {
  channels.forEach((ch) => stopStream(ch.id));
  res.json({ success: true, message: 'सभी चैनल रोक दिए गए हैं (All streams stopped)' });
});

// Get logs for a channel
app.get('/api/channels/:id/logs', (req: Request, res: Response) => {
  const { id } = req.params;
  const logs = channelLogs.get(id) || ['अभी कोई लॉग नहीं है (No logs yet)'];
  res.json({ logs });
});

// Clear logs for a channel
app.post('/api/channels/:id/logs/clear', (req: Request, res: Response) => {
  const { id } = req.params;
  channelLogs.set(id, []);
  res.json({ success: true });
});

// Upload video file
app.post('/api/upload', upload.single('video'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'कोई फ़ाइल अपलोड नहीं की गई (No file uploaded)' });
  }

  const relativePath = `uploads/${req.file.filename}`;
  res.json({
    success: true,
    videoPath: relativePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// List all video files available in uploads
app.get('/api/videos', (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const videoList = files
      .filter((f) => /\.(mp4|mkv|mov|avi|webm|flv|ts)$/i.test(f))
      .map((f) => {
        const fullPath = path.join(UPLOADS_DIR, f);
        const stats = fs.statSync(fullPath);
        return {
          filename: f,
          path: `uploads/${f}`,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime,
          isSample: f.startsWith('sample_') || f.startsWith('lofi_'),
        };
      });
    res.json({ videos: videoList });
  } catch (err) {
    res.status(500).json({ error: 'वीडियो फ़ाइलें लोड करने में विफल' });
  }
});

// System info & FFmpeg status
app.get('/api/system', (_req: Request, res: Response) => {
  res.json({
    activeStreamsCount: activeProcesses.size,
    totalChannels: channels.length,
    ffmpegInstalled: true,
    platform: process.platform,
    uptime: process.uptime(),
  });
});

// Vite frontend integration
async function setupServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Streamer server running at http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error('Failed to start server:', err);
});
