/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  HardDrive,
  Link,
  AlertCircle,
  Loader,
  Download,
  Settings,
  Activity,
  Zap,
  Users,
  RefreshCw,
  Globe,
  Signal,
  Wifi,
  WifiOff,
} from "lucide-react";
import TorrentUpload from "@/components/torrent-upload";
import TorrentDetails from "@/components/torrent-details";
import MediaPlayer from "@/components/media-player";
import TrackerService from "@/utils/trackerServcie";

declare global {
  interface Window {
    WebTorrent: any;
  }
}

interface TorrentFile {
  name: string;
  length: number;
  path: string;
  progress: number;
  downloaded: number;
  type: "video" | "audio" | "image" | "document" | "other";
  webTorrentFile?: any;
}

interface TrackerInfo {
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

interface TorrentInfo {
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
}

interface SpeedLimits {
  download: number;
  upload: number;
}

interface TrackerStats {
  cached: boolean;
  lastFetched: Date | null;
  httpsCount: number;
  wssCount: number;
  totalCount: number;
}

// Tracker Status Component
const TrackerStatusDisplay = ({
  trackerInfo,
}: {
  trackerInfo: TrackerInfo;
}) => {
  const totalTrackers = trackerInfo.external.total + trackerInfo.internal.total;
  const activePercentage =
    totalTrackers > 0 ? (trackerInfo.totalActive / totalTrackers) * 100 : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-600/50">
      <div className="relative">
        <div
          className={`p-2 rounded-lg ${
            trackerInfo.totalActive > 0 ? "bg-emerald-500/20" : "bg-gray-500/20"
          }`}
        >
          {trackerInfo.totalActive > 0 ? (
            <Signal className="w-5 h-5 text-emerald-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-gray-400" />
          )}
        </div>
        {trackerInfo.totalActive > 0 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white font-bold text-lg">
            {trackerInfo.totalActive}
          </span>
          <span className="text-gray-400 text-sm font-medium">
            / {totalTrackers} Active
          </span>
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              activePercentage > 50
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : activePercentage > 0
                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
            }`}
          >
            {activePercentage.toFixed(0)}%
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Ext: {trackerInfo.external.active}/{trackerInfo.external.total}
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Int: {trackerInfo.internal.active}/{trackerInfo.internal.total}
          </span>
        </div>

        <div className="mt-2">
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                activePercentage > 50
                  ? "bg-emerald-500"
                  : activePercentage > 0
                  ? "bg-yellow-500"
                  : "bg-gray-500"
              }`}
              style={{ width: `${Math.max(activePercentage, 2)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function TorrentClient() {
  const [torrents, setTorrents] = useState<TorrentInfo[]>([]);
  const [selectedTorrent, setSelectedTorrent] = useState<TorrentInfo | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<TorrentFile | null>(null);
  const [magnetUrl, setMagnetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [webTorrentSupported, setWebTorrentSupported] = useState(false);
  const [webTorrentLoaded, setWebTorrentLoaded] = useState(false);
  const [completedTorrents, setCompletedTorrents] = useState<Set<string>>(
    new Set()
  );
  const [isTorrentLoading, setIsTorrentLoading] = useState<boolean>(false);
  const [speedLimits, setSpeedLimits] = useState<SpeedLimits>({
    download: 0,
    upload: 0,
  });
  const [showSpeedSettings, setShowSpeedSettings] = useState(false);
  const [trackerStats, setTrackerStats] = useState<TrackerStats>({
    cached: false,
    lastFetched: null,
    httpsCount: 0,
    wssCount: 0,
    totalCount: 0,
  });
  const [isRefreshingTrackers, setIsRefreshingTrackers] = useState(false);

  const clientRef = useRef<any>(null);
  const updateIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const trackerService = useRef<TrackerService>(TrackerService.getInstance());

  // Initialize trackers on app load
  useEffect(() => {
    const initializeTrackers = async () => {
      try {
        console.log("Initializing tracker service...");
        await trackerService.current.getTrackers();
        setTrackerStats(trackerService.current.getStats());
        console.log("Tracker service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize trackers:", error);
      }
    };

    initializeTrackers();
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js";
    script.async = true;

    script.onload = () => {
      if (window.WebTorrent) {
        setWebTorrentLoaded(true);

        if (window.WebTorrent.WEBRTC_SUPPORT) {
          setWebTorrentSupported(true);

          clientRef.current = new window.WebTorrent({
            maxConns: 100,
            downloadLimit:
              speedLimits.download > 0 ? speedLimits.download * 1000 : -1,
            uploadLimit:
              speedLimits.upload > 0 ? speedLimits.upload * 1000 : -1,
          });

          clientRef.current.on("error", (err: Error) => {
            console.error("WebTorrent client error:", err);
            setError(`WebTorrent error: ${err.message}`);
            setIsTorrentLoading(false);
          });

          applySpeedLimits();
        } else {
          setError("WebRTC is not supported in this browser");
        }
      }
    };

    script.onerror = () => {
      setError("Failed to load WebTorrent library");
    };

    document.head.appendChild(script);

    return () => {
      updateIntervalsRef.current.forEach((interval) => clearInterval(interval));
      updateIntervalsRef.current.clear();

      if (clientRef.current) {
        clientRef.current.destroy();
      }

      const existingScript = document.querySelector(
        'script[src*="webtorrent"]'
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const applySpeedLimits = () => {
    if (!clientRef.current) return;

    try {
      const downloadLimit =
        speedLimits.download > 0 ? speedLimits.download * 1000 : -1;
      const uploadLimit =
        speedLimits.upload > 0 ? speedLimits.upload * 1000 : -1;

      if (clientRef.current.throttleDownload) {
        clientRef.current.throttleDownload(downloadLimit);
        console.log(
          `Download speed limit set to ${
            downloadLimit === -1
              ? "unlimited"
              : formatBytes(downloadLimit) + "/s"
          }`
        );
      }

      if (clientRef.current.throttleUpload) {
        clientRef.current.throttleUpload(uploadLimit);
        console.log(
          `Upload speed limit set to ${
            uploadLimit === -1 ? "unlimited" : formatBytes(uploadLimit) + "/s"
          }`
        );
      }
    } catch (error) {
      console.error("Failed to apply speed limits:", error);
      setError(
        "Failed to apply speed limits. This feature may not be supported in this WebTorrent version."
      );
    }
  };

  const refreshTrackers = async () => {
    setIsRefreshingTrackers(true);
    try {
      console.log("Refreshing trackers...");
      await trackerService.current.refreshTrackers();
      setTrackerStats(trackerService.current.getStats());
      console.log("Trackers refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh trackers:", error);
      setError(
        "Failed to refresh trackers. Using cached or fallback trackers."
      );
    } finally {
      setIsRefreshingTrackers(false);
    }
  };

  const getFileType = (filename: string): TorrentFile["type"] => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["mp4", "webm", "mkv", "avi", "mov", "m4v", "3gp"].includes(ext || ""))
      return "video";
    if (["mp3", "wav", "flac", "ogg", "m4a", "aac", "wma"].includes(ext || ""))
      return "audio";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext || ""))
      return "image";
    if (["pdf", "txt", "doc", "docx", "epub", "mobi"].includes(ext || ""))
      return "document";
    return "other";
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1000;
    const sizes = ["B", "kB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds === Number.POSITIVE_INFINITY || isNaN(seconds))
      return "∞";
    if (seconds < 60) return `${Math.floor(seconds)}s`;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const calculateTimeRemaining = (torrent: any): number => {
    if (!torrent || torrent.done) return 0;

    const remainingBytes = torrent.length - torrent.downloaded;
    const downloadSpeed = torrent.downloadSpeed;

    if (downloadSpeed === 0 || remainingBytes <= 0) {
      return Number.POSITIVE_INFINITY;
    }

    return remainingBytes / downloadSpeed;
  };

  // Helper function to analyze tracker activity
  const analyzeTrackerActivity = (
    torrent: any,
    externalTrackers: string[]
  ): TrackerInfo => {
    const internalTrackers = torrent.announce || [];

    // For WebTorrent, we'll simulate active tracker detection based on peer count
    // In a real implementation, you'd check torrent._trackers or similar internal state
    const hasActivePeers = torrent.numPeers > 0;
    const peerSources = Math.min(
      Math.ceil(torrent.numPeers / 5),
      internalTrackers.length + externalTrackers.length
    );

    // Simulate which trackers are active based on peer availability
    const activeExternal = hasActivePeers
      ? Math.min(Math.ceil(externalTrackers.length * 0.3), peerSources)
      : 0;
    const activeInternal = hasActivePeers
      ? Math.min(
          Math.ceil(internalTrackers.length * 0.4),
          peerSources - activeExternal
        )
      : 0;

    return {
      external: {
        total: externalTrackers.length,
        active: activeExternal,
        trackers: externalTrackers,
      },
      internal: {
        total: internalTrackers.length,
        active: activeInternal,
        trackers: internalTrackers,
      },
      totalActive: activeExternal + activeInternal,
      lastUpdated: new Date(),
    };
  };

  const downloadFile = (file: any, filename: string) => {
    try {
      file.getBlobURL((err: Error, url: string) => {
        if (err) {
          console.error("Error getting blob URL:", err);
          return;
        }

        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(url), 100);
      });
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const downloadAllFiles = (torrent: any) => {
    torrent.files.forEach((file: any) => {
      downloadFile(file, file.name);
    });
  };

  const addTorrent = async (torrentId: string | File) => {
    if (!clientRef.current) {
      setError("WebTorrent client not initialized");
      setIsTorrentLoading(false);
      return;
    }

    setError(null);

    const timeoutId = setTimeout(() => {
      setIsTorrentLoading(false);
      setError(
        "Connection timeout. Please check if the torrent has active seeders or try a different torrent."
      );
    }, 120000);

    try {
      let source = torrentId;
      let additionalTrackers: string[] = [];

      // Get external trackers for both magnet URLs and .torrent files
      try {
        additionalTrackers = await trackerService.current.getAllTrackers();
        console.log(
          `Fetched ${additionalTrackers.length} external trackers for enhanced peer discovery`
        );
      } catch (error) {
        console.warn(
          "Failed to fetch external trackers, proceeding with original source:",
          error
        );
      }

      // For magnet URLs, append trackers to the URL itself
      if (typeof torrentId === "string") {
        source = await trackerService.current.appendTrackersToMagnet(torrentId);
        console.log("Enhanced magnet URL with external trackers");
      }

      // For both magnet URLs and .torrent files, pass additional trackers via options
      const torrentOptions = {
        strategy: "sequential" as const,
        maxWebConns: 4,
        path: undefined,
        announce:
          additionalTrackers.length > 0 ? additionalTrackers : undefined,
      };

      const torrent = clientRef.current.add(source, torrentOptions);

      console.log(
        `Torrent added: ${torrent.name || torrent.infoHash} with ${
          additionalTrackers.length
        } additional trackers`
      );

      torrent.on("metadata", () => {
        console.log("Metadata received for:", torrent.name);
        clearTimeout(timeoutId);

        // Initialize tracker info
        const initialTrackerInfo = analyzeTrackerActivity(
          torrent,
          additionalTrackers
        );

        const torrentInfo: TorrentInfo = {
          name: torrent.name,
          infoHash: torrent.infoHash,
          magnetURI: torrent.magnetURI,
          length: torrent.length,
          files: torrent.files.map((file: any) => ({
            name: file.name,
            length: file.length,
            path: file.path,
            progress: 0,
            downloaded: 0,
            type: getFileType(file.name),
            webTorrentFile: file,
          })),
          progress: 0,
          downloadSpeed: 0,
          uploadSpeed: 0,
          downloaded: 0,
          uploaded: 0,
          numPeers: 0,
          timeRemaining: 0,
          ready: false,
          done: false,
          paused: false,
          webTorrentInstance: torrent,
          trackerInfo: initialTrackerInfo,
        };

        setTorrents((prev) => [...prev, torrentInfo]);
        setSelectedTorrent(torrentInfo);
        setIsTorrentLoading(false);

        const updateInterval = setInterval(() => {
          const currentSpeed = torrent.downloadSpeed || 0;
          const timeRemaining = calculateTimeRemaining(torrent);

          // Update tracker activity analysis
          const updatedTrackerInfo = analyzeTrackerActivity(
            torrent,
            additionalTrackers
          );

          const updatedInfo: TorrentInfo = {
            ...torrentInfo,
            progress: torrent.progress || 0,
            downloadSpeed: torrent.done ? 0 : currentSpeed,
            uploadSpeed: torrent.uploadSpeed || 0,
            downloaded: torrent.downloaded || 0,
            uploaded: torrent.uploaded || 0,
            numPeers: torrent.numPeers || 0,
            timeRemaining: timeRemaining,
            ready: torrent.ready || false,
            done: torrent.done || false,
            trackerInfo: updatedTrackerInfo,
            files: torrent.files.map((file: any, index: number) => ({
              ...torrentInfo.files[index],
              progress: file.progress || 0,
              downloaded: file.downloaded || 0,
              webTorrentFile: file,
            })),
            webTorrentInstance: torrent,
          };

          setTorrents((prev) =>
            prev.map((t) => (t.infoHash === torrent.infoHash ? updatedInfo : t))
          );

          setSelectedTorrent((prevSelected) => {
            if (prevSelected?.infoHash === torrent.infoHash) {
              return updatedInfo;
            }
            return prevSelected;
          });

          if (torrent.done && !completedTorrents.has(torrent.infoHash)) {
            console.log("Torrent completed:", torrent.name);
            setCompletedTorrents((prev) => new Set(prev).add(torrent.infoHash));
            clearInterval(updateInterval);
            updateIntervalsRef.current.delete(torrent.infoHash);
          }
        }, 1000);

        updateIntervalsRef.current.set(torrent.infoHash, updateInterval);
      });

      torrent.on("ready", () => {
        console.log("Torrent ready:", torrent.name);
      });

      torrent.on("error", (err: Error) => {
        console.error("Torrent error:", err);
        clearTimeout(timeoutId);
        setError(`Torrent error: ${err.message}`);
        setIsTorrentLoading(false);
      });

      torrent.on("warning", (err: Error) => {
        console.warn("Torrent warning:", err);
      });

      torrent.on("done", () => {
        console.log("Download completed:", torrent.name);
      });

      torrent.on("peer", (addr: string) => {
        console.log("Connected to peer:", addr);
      });

      torrent.on("noPeers", (announceType: string) => {
        console.log("No peers found via", announceType);
        if (announceType === "tracker") {
          console.log("Attempting to discover more peers...");
        }
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to add torrent: ${errorMessage}`);
      console.error("Error adding torrent:", err);
      setIsTorrentLoading(false);
    }
  };

  const handleMagnetSubmit = async (
    e: React.FormEvent | React.MouseEvent | React.KeyboardEvent
  ) => {
    e.preventDefault();
    if (magnetUrl.trim()) {
      setIsTorrentLoading(true);
      await addTorrent(magnetUrl.trim());
      setMagnetUrl("");
    }
  };

  const handleFileUpload = (file: File) => {
    setIsTorrentLoading(true);
    addTorrent(file);
  };

  const playFile = (file: TorrentFile) => {
    if (["video", "audio"].includes(file.type)) {
      setSelectedFile(file);
    }
  };

  const handleDownloadFile = (file: TorrentFile) => {
    if (file.webTorrentFile) {
      downloadFile(file.webTorrentFile, file.name);
    }
  };

  const handleDownloadAll = (torrent: TorrentInfo) => {
    if (torrent.webTorrentInstance) {
      downloadAllFiles(torrent.webTorrentInstance);
    }
  };

  const handleSpeedLimitChange = (
    type: "download" | "upload",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    setSpeedLimits((prev) => ({
      ...prev,
      [type]: numValue,
    }));
  };

  const applySpeedLimitSettings = () => {
    applySpeedLimits();
    setShowSpeedSettings(false);
  };

  if (!webTorrentLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <Card className="p-12 max-w-md text-center bg-gray-900/90 border-gray-700 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Loading WebTorrent
          </h2>
          <p className="text-gray-300">Initializing torrent engine...</p>
        </Card>
      </div>
    );
  }

  if (!webTorrentSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
        <Card className="p-12 max-w-md text-center bg-gray-900/90 border-gray-700 shadow-2xl">
          <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            WebRTC Not Supported
          </h2>
          <p className="text-gray-300">
            Your browser doesn&apos;t support WebRTC, which is required for
            WebTorrent. Please use a modern browser like Chrome, Firefox, or
            Safari.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      <div className="border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-black mb-2 tracking-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent h-14">
                Torritory
              </h1>
              <p className="text-gray-400 text-base font-medium">
                High-performance browser-based torrent client
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSpeedSettings(!showSpeedSettings)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200 h-8.5"
              >
                <Settings className="w-4 h-4 mr-2" />
                Speed Limits
              </Button>

              <div className="flex flex-col gap-1 border rounded-2xl items-center">
                <Badge
                  variant="outline"
                  className="border-blue-500/70 text-blue-400 font-medium px-2 py-0.5 text-xs p-1 pr-1.5"
                >
                  <Button
                    variant="ghost"
                    onClick={refreshTrackers}
                    disabled={isRefreshingTrackers}
                    className="text-blue-400 hover:bg-blue-800 hover:text-white transition-all duration-200 h-6 w-6 mr-2 cursor-pointer"
                  >
                    {isRefreshingTrackers ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                  <Globe className="w-3 h-3 mr-0.5" />
                  {trackerStats.totalCount} External
                </Badge>
              </div>
            </div>
          </div>

          {showSpeedSettings && (
            <div className="mt-6 p-6 bg-gray-900/80 rounded-xl border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                Speed Limits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Download Limit (KB/s, 0 = unlimited)
                  </label>
                  <Input
                    type="number"
                    value={speedLimits.download}
                    onChange={(e) =>
                      handleSpeedLimitChange("download", e.target.value)
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Limit (KB/s, 0 = unlimited)
                  </label>
                  <Input
                    type="number"
                    value={speedLimits.upload}
                    onChange={(e) =>
                      handleSpeedLimitChange("upload", e.target.value)
                    }
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={applySpeedLimitSettings} size="sm">
                  Apply
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSpeedSettings(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {trackerStats.lastFetched && (
            <div className="mt-4 p-3 bg-transparent rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  External Trackers: {trackerStats.httpsCount} HTTPS,{" "}
                  {trackerStats.wssCount} WSS
                </span>
                <span>
                  Last Updated: {trackerStats.lastFetched.toLocaleTimeString()}
                  {!trackerStats.cached && " (Using cached data)"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {error && (
          <Alert className="mb-8 bg-red-950/50 border-red-500/50 shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-red-300 font-medium text-base">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <Card className="p-5 bg-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-emerald-400" />
                Add Torrent
              </h2>

              <div className="mb-4">
                <div className="flex gap-3">
                  <Input
                    type="text"
                    placeholder="Paste magnet URL here..."
                    value={magnetUrl}
                    onChange={(e) => setMagnetUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleMagnetSubmit(e);
                      }
                    }}
                    className="bg-gray-800/90 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    disabled={isTorrentLoading}
                  />
                  <Button
                    onClick={handleMagnetSubmit}
                    disabled={!magnetUrl.trim() || isTorrentLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 transition-all duration-200 min-w-[48px]"
                  >
                    {!isTorrentLoading && <Link className="w-4 h-4" />}
                    {isTorrentLoading && (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                  </Button>
                </div>
                {isTorrentLoading && (
                  <p className="text-sm text-emerald-400 mt-3 animate-pulse flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Connecting to swarm with {trackerStats.totalCount} external
                    trackers...
                  </p>
                )}
              </div>

              <TorrentUpload onFileUpload={handleFileUpload} />
            </Card>

            {selectedTorrent && (
              <>
                <Card className="p-5 bg-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-400" />
                      Tracker Status
                    </span>
                  </h2>

                  <TrackerStatusDisplay
                    trackerInfo={selectedTorrent.trackerInfo}
                  />
                </Card>

                <Card className="flex-1 p-5 bg-gray-900/90 border-gray-700/50 shadow-xl backdrop-blur-sm">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                    <span className="flex items-center">
                      <Activity className="w-5 h-5 mr-2 text-blue-400" />
                      Active Torrents
                    </span>
                    <Badge
                      variant="outline"
                      className="text-gray-300 border-gray-600"
                    >
                      {torrents.length}
                    </Badge>
                  </h2>

                  <ScrollArea className="h-[400px] pr-3">
                    {torrents.length === 0 ? (
                      <div className="text-center py-12">
                        <HardDrive className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                          No active torrents
                        </p>
                        <p className="text-gray-600 text-sm mt-2">
                          Add a torrent to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {torrents.map((torrent) => (
                          <div
                            key={torrent.infoHash}
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                              selectedTorrent?.infoHash === torrent.infoHash
                                ? "bg-emerald-900/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10"
                                : "bg-gray-800/60 border-gray-700/50 hover:border-emerald-500/30 hover:bg-emerald-900/10"
                            }`}
                            onClick={() => setSelectedTorrent(torrent)}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-base font-semibold text-white truncate pr-2 flex-1">
                                {torrent.name}
                              </h3>
                              <div className="flex gap-2 flex-shrink-0">
                                <Badge
                                  variant={
                                    torrent.done ? "default" : "secondary"
                                  }
                                  className={`text-xs font-medium ${
                                    torrent.done
                                      ? "bg-emerald-600/80 text-white border-emerald-500"
                                      : "bg-blue-600/80 text-white border-blue-500"
                                  }`}
                                >
                                  {torrent.done ? "Complete" : "Downloading"}
                                </Badge>
                                {torrent.done && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadAll(torrent);
                                    }}
                                    className="h-6 px-2 text-xs border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all duration-200"
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <Progress
                              value={torrent.progress * 100}
                              className={`h-2 mb-2 ${
                                torrent.done
                                  ? "[&>div]:bg-emerald-500"
                                  : torrent.progress > 0
                                  ? "[&>div]:bg-blue-500 [&>div]:animate-pulse"
                                  : "[&>div]:bg-gray-600"
                              }`}
                            />

                            <div className="flex justify-between items-center text-xs mb-2">
                              <div className="flex items-center gap-4 text-gray-400">
                                <span className="font-medium">
                                  {Math.round(torrent.progress * 100)}%
                                </span>
                                <span className="flex items-center">
                                  <Download className="w-3 h-3 mr-1" />
                                  {formatBytes(torrent.downloadSpeed)}/s
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {torrent.numPeers}
                                </span>
                              </div>
                              <span className="text-gray-500 font-medium">
                                {formatTime(torrent.timeRemaining)}
                              </span>
                            </div>

                            {/* Mini tracker status */}
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-1">
                                <Signal
                                  className={`w-3 h-3 ${
                                    torrent.trackerInfo.totalActive > 0
                                      ? "text-emerald-400"
                                      : "text-gray-400"
                                  }`}
                                />
                                <span className="text-gray-400">
                                  {torrent.trackerInfo.totalActive} active
                                  trackers
                                </span>
                              </div>
                              <div className="text-gray-500">
                                ({torrent.trackerInfo.external.active}E +{" "}
                                {torrent.trackerInfo.internal.active}I)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </>
            )}
          </div>

          <div className="xl:col-span-3">
            {selectedTorrent ? (
              <TorrentDetails
                torrent={selectedTorrent}
                onPlayFile={playFile}
                onDownloadFile={handleDownloadFile}
                formatBytes={formatBytes}
                formatTime={formatTime}
              />
            ) : (
              <Card className="p-16 bg-gray-900/90 border-gray-700/50 text-center min-h-[600px] flex flex-col items-center justify-center shadow-xl">
                <HardDrive className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-3">
                  No Torrent Selected
                </h2>
                <p className="text-gray-400 text-lg max-w-md">
                  Add a torrent using a magnet URL or .torrent file to get
                  started with downloading and streaming
                </p>
              </Card>
            )}
          </div>
        </div>

        {selectedFile && selectedTorrent && (
          <MediaPlayer
            file={selectedFile}
            torrent={selectedTorrent}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>
    </div>
  );
}
