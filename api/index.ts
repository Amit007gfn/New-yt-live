import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(express.json());

// In Vercel serverless environment, provide in-memory/fallback channels response
let channels = [
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

app.get('/api/channels', (_req: Request, res: Response) => {
  res.json({ channels });
});

app.post('/api/channels', (req: Request, res: Response) => {
  const { name, rtmpServer, streamKey, videoPath, videoTitle, resolution, bitrate, loop } = req.body;
  const newChannel = {
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
  channels.push(newChannel as any);
  res.json({ success: true, channel: newChannel });
});

app.put('/api/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = channels.findIndex((c) => c.id === id);
  if (idx !== -1) {
    channels[idx] = { ...channels[idx], ...req.body };
    return res.json({ success: true, channel: channels[idx] });
  }
  res.status(404).json({ error: 'Channel not found' });
});

app.delete('/api/channels/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  channels = channels.filter((c) => c.id !== id);
  res.json({ success: true });
});

app.get('/api/videos', (_req: Request, res: Response) => {
  res.json({
    videos: [
      {
        filename: 'sample_test_stream.mp4',
        path: 'uploads/sample_test_stream.mp4',
        sizeMB: '1.20',
        createdAt: new Date().toISOString(),
        isSample: true,
      },
      {
        filename: 'lofi_ambient_loop.mp4',
        path: 'uploads/lofi_ambient_loop.mp4',
        sizeMB: '1.50',
        createdAt: new Date().toISOString(),
        isSample: true,
      },
    ],
  });
});

app.get('/api/system', (_req: Request, res: Response) => {
  res.json({
    activeStreamsCount: 0,
    totalChannels: channels.length,
    ffmpegInstalled: false,
    isServerless: true,
    platform: 'vercel',
    uptime: process.uptime(),
  });
});

export default app;
