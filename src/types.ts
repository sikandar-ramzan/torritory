/* eslint-disable @typescript-eslint/no-explicit-any */

export interface TorrentFile {
  name: string;
  length: number;
  path: string;
  progress: number;
  downloaded: number;
  type: "video" | "audio" | "image" | "document" | "other";
  webTorrentFile?: any;
}

export interface TrackerInfo {
  external: {
    total: number;
    active: number;
    trackers: string[];
  };
  internal: {
    total: number;
    active: number;
    trackers: string[];
  };
  totalActive: number;
  lastUpdated: Date;
}

export interface TorrentInfo {
  name: string;
  infoHash: string;
  magnetURI: string;
  length: number;
  files: TorrentFile[];
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  numPeers: number;
  timeRemaining: number;
  ready: boolean;
  done: boolean;
  paused: boolean;
  webTorrentInstance?: any;
  trackerInfo: TrackerInfo;
  boostMode?: boolean; // Whether this torrent was created with boost mode
}

export interface TorrentUploadProps {
  onFileUpload: (file: File) => void;
}

export interface TorrentDetailsProps {
  torrent: TorrentInfo;
  onDownloadFile: (file: TorrentFile) => void;
  onPauseTorrent: () => void;
  onResumeTorrent: () => void;
  onDeleteTorrent: () => void;
  onBoostTorrent?: () => void;
  formatBytes: (bytes: number) => string;
  formatTime: (seconds: number) => string;
}

export interface SpeedLimits {
  download: number;
  upload: number;
}

export interface TrackerStats {
  cached: boolean;
  lastFetched: Date | null;
  httpsCount: number;
  wssCount: number;
  httpCount: number;
  wsCount: number;
  totalCount: number;
  safeCount: number;
  unsafeCount: number;
}

export interface TrackerUrls {
  https: string[];
  wss: string[];
  http?: string[];
  ws?: string[];
}

export interface TrackerCache {
  trackers: TrackerUrls;
  lastFetched: number;
  ttl: number; // Time to live in milliseconds
}

export interface BoostModeState {
  enabled: boolean;
  warningAccepted: boolean;
  showWarning: boolean;
}

export interface MagnetValidationResult {
  isValid: boolean;
  error?: string;
}

export type TorrentStatus =
  | "downloading"
  | "paused"
  | "completed"
  | "error"
  | "stopped";
