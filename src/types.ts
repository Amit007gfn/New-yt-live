export interface StreamStats {
  fps: number;
  bitrate: string;
  speed: string;
  time: string;
  frame: number;
}

export interface Channel {
  id: string;
  name: string;
  rtmpServer: string;
  streamKey: string;
  videoPath: string;
  videoTitle: string;
  loop: boolean;
  resolution: '1080p' | '720p' | 'original';
  bitrate: string;
  audioBitrate: string;
  fps: number;
  autoRestart: boolean;
  isLive: boolean;
  status: 'idle' | 'starting' | 'live' | 'error' | 'stopped';
  startedAt: number | null;
  uptimeSeconds?: number;
  errorMessage?: string;
  stats: StreamStats;
}

export interface VideoFile {
  filename: string;
  path: string;
  sizeMB: string;
  createdAt: string;
  isSample: boolean;
}

export interface SystemInfo {
  activeStreamsCount: number;
  totalChannels: number;
  ffmpegInstalled: boolean;
  platform: string;
  uptime: number;
}
