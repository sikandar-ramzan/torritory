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
  Pause,
  Play,
  Trash2,
  Shield,
  ShieldOff,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import TorrentUpload from "@/components/torrent-upload";
import TorrentDetails from "@/components/torrent-details";
import BoostModeWarning from "@/components/boost-mode-warning";
import TrackerService from "@/utils/trackerServcie";
import {
  TorrentFile,
  TorrentInfo,
  TrackerInfo,
  SpeedLimits,
  TrackerStats,
  BoostModeState,
  MagnetValidationResult,
} from "@/types";

declare global {
  interface Window {
    WebTorrent: any;
  }
}

// Tracker Status Component
const TrackerStatusDisplay = ({
  trackerInfo,
  boostMode,
}: {
  trackerInfo: TrackerInfo;
  boostMode: boolean;
}) => {
  const totalTrackers = trackerInfo.external.total + trackerInfo.internal.total;
  const activePercentage =
    totalTrackers > 0 ? (trackerInfo.totalActive / totalTrackers) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-900/50 border ${
        boostMode ? "border-orange-500/50" : "border-gray-600/50"
      }`}
    >
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
        {boostMode && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-500 rounded-full">
            <Zap className="w-2 h-2 text-white" />
          </div>
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
          {boostMode && (
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs">
              <Zap className="w-2 h-2 mr-1" />
              BOOST
            </Badge>
          )}
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
  const [magnetUrl, setMagnetUrl] = useState("");
  const [magnetValidation, setMagnetValidation] =
    useState<MagnetValidationResult>({
      isValid: true,
    });
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
    httpCount: 0,
    wsCount: 0,
    totalCount: 0,
    safeCount: 0,
    unsafeCount: 0,
  });
  const [isRefreshingTrackers, setIsRefreshingTrackers] = useState(false);
  const [boostMode, setBoostMode] = useState<BoostModeState>({
    enabled: false,
    warningAccepted: false,
    showWarning: false,
  });

  const clientRef = useRef<any>(null);
  const updateIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const trackerService = useRef<TrackerService>(TrackerService.getInstance());

  // Store original speed limits before applying pause throttling
  const originalSpeedLimitsRef = useRef<
    Map<string, { download: number; upload: number }>
  >(new Map());

  // Constants for pause throttling (very low speeds to simulate pause)
  const PAUSE_THROTTLE_DOWNLOAD = 1; // 1 KB/s - extremely slow but not zero
  const PAUSE_THROTTLE_UPLOAD = 1; // 1 KB/s

  // Validate magnet URL in real-time
  useEffect(() => {
    if (magnetUrl.trim()) {
      const isValid = trackerService.current.validateMagnetUrl(magnetUrl);
      setMagnetValidation({
        isValid,
        error: isValid
          ? undefined
          : "Invalid magnet URL format. Must start with 'magnet:?xt=urn:btih:' followed by info hash.",
      });
    } else {
      setMagnetValidation({ isValid: true });
    }
  }, [magnetUrl]);

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

  // Apply individual torrent throttling for pause/resume functionality
  const applyTorrentThrottling = (
    torrent: any,
    downloadKB: number,
    uploadKB: number
  ) => {
    try {
      const downloadBytes = downloadKB > 0 ? downloadKB * 1000 : -1;
      const uploadBytes = uploadKB > 0 ? uploadKB * 1000 : -1;

      // WebTorrent doesn't have per-torrent throttling, so we'll use the global client throttling
      // This is a limitation, but it's the best we can do with the current WebTorrent API
      if (clientRef.current.throttleDownload) {
        clientRef.current.throttleDownload(downloadBytes);
      }
      if (clientRef.current.throttleUpload) {
        clientRef.current.throttleUpload(uploadBytes);
      }

      console.log(
        `Applied throttling to torrent ${torrent.name}: ${downloadKB}KB/s down, ${uploadKB}KB/s up`
      );
    } catch (error) {
      console.error("Failed to apply torrent throttling:", error);
    }
  };

  const handleBoostModeToggle = async () => {
    if (!boostMode.enabled && !boostMode.warningAccepted) {
      // Show warning dialog for first time
      setBoostMode((prev) => ({ ...prev, showWarning: true }));
    } else if (boostMode.enabled) {
      // Disable boost mode
      setBoostMode({
        enabled: false,
        warningAccepted: false,
        showWarning: false,
      });
      console.log("Boost mode disabled");
    } else {
      // Enable boost mode (warning already accepted)
      await enableBoostMode();
    }
  };

  const enableBoostMode = async () => {
    try {
      setBoostMode((prev) => ({ ...prev, enabled: true, showWarning: false }));

      // Fetch updated tracker stats including unsafe ones
      const allTrackers =
        await trackerService.current.getAllTrackersIncludingUnsafe();
      const newStats = {
        ...trackerStats,
        httpCount: allTrackers.http?.length || 0,
        wsCount: allTrackers.ws?.length || 0,
        unsafeCount:
          (allTrackers.http?.length || 0) + (allTrackers.ws?.length || 0),
        totalCount:
          trackerStats.safeCount +
          (allTrackers.http?.length || 0) +
          (allTrackers.ws?.length || 0),
      };
      setTrackerStats(newStats);

      console.log(
        "Boost mode enabled with",
        newStats.unsafeCount,
        "additional unsafe trackers"
      );
    } catch (error) {
      console.error("Failed to enable boost mode:", error);
      setError("Failed to enable boost mode. Using safe trackers only.");
    }
  };

  const handleBoostWarningAccept = async () => {
    setBoostMode((prev) => ({ ...prev, warningAccepted: true }));
    await enableBoostMode();
  };

  const handleBoostWarningCancel = () => {
    setBoostMode((prev) => ({ ...prev, showWarning: false }));
  };

  const boostExistingTorrent = async (torrent: TorrentInfo) => {
    if (!torrent.webTorrentInstance) {
      console.warn("Cannot boost torrent: WebTorrent instance not available");
      return;
    }

    try {
      const addedCount = await trackerService.current.addTrackersToTorrent(
        torrent.webTorrentInstance,
        boostMode.enabled
      );

      if (addedCount > 0) {
        // Update torrent info to reflect boost mode
        setTorrents((prev) =>
          prev.map((t) =>
            t.infoHash === torrent.infoHash
              ? { ...t, boostMode: boostMode.enabled }
              : t
          )
        );

        if (selectedTorrent?.infoHash === torrent.infoHash) {
          setSelectedTorrent((prev) =>
            prev ? { ...prev, boostMode: boostMode.enabled } : prev
          );
        }

        console.log(
          `Boosted torrent "${torrent.name}" with ${addedCount} additional trackers`
        );
      } else {
        console.log(
          `No additional trackers added to torrent "${torrent.name}"`
        );
      }
    } catch (error) {
      console.error("Failed to boost existing torrent:", error);
    }
  };

  const refreshTrackers = async () => {
    setIsRefreshingTrackers(true);
    try {
      console.log("Refreshing trackers...");
      await trackerService.current.refreshTrackers();

      let newStats = trackerService.current.getStats();

      // If boost mode is enabled, also fetch unsafe tracker counts
      if (boostMode.enabled) {
        const allTrackers =
          await trackerService.current.getAllTrackersIncludingUnsafe();
        newStats = {
          ...newStats,
          httpCount: allTrackers.http?.length || 0,
          wsCount: allTrackers.ws?.length || 0,
          unsafeCount:
            (allTrackers.http?.length || 0) + (allTrackers.ws?.length || 0),
          totalCount:
            newStats.safeCount +
            (allTrackers.http?.length || 0) +
            (allTrackers.ws?.length || 0),
        };
      }

      setTrackerStats(newStats);
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
    if (!torrent || torrent.done || torrent.paused) return 0;

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

  const pauseTorrent = (torrent: TorrentInfo) => {
    if (torrent.webTorrentInstance && !torrent.paused) {
      const infoHash = torrent.infoHash;

      // Store current speed limits before applying pause throttling
      const currentDownload = speedLimits.download || 0;
      const currentUpload = speedLimits.upload || 0;
      originalSpeedLimitsRef.current.set(infoHash, {
        download: currentDownload,
        upload: currentUpload,
      });

      // Apply extreme throttling to simulate pause
      applyTorrentThrottling(
        torrent.webTorrentInstance,
        PAUSE_THROTTLE_DOWNLOAD,
        PAUSE_THROTTLE_UPLOAD
      );

      // Update torrent state to paused immediately
      setTorrents((prev) =>
        prev.map((t) => (t.infoHash === infoHash ? { ...t, paused: true } : t))
      );

      setSelectedTorrent((prev) =>
        prev?.infoHash === infoHash ? { ...prev, paused: true } : prev
      );

      console.log(
        `Torrent paused (throttled to ${PAUSE_THROTTLE_DOWNLOAD}KB/s):`,
        torrent.name
      );
    }
  };

  const resumeTorrent = (torrent: TorrentInfo) => {
    if (torrent.webTorrentInstance && torrent.paused) {
      const infoHash = torrent.infoHash;

      // Restore original speed limits or use global limits
      const originalLimits = originalSpeedLimitsRef.current.get(infoHash);
      const downloadLimit =
        originalLimits?.download || speedLimits.download || 0;
      const uploadLimit = originalLimits?.upload || speedLimits.upload || 0;

      // Apply restored speed limits (0 means unlimited)
      applyTorrentThrottling(
        torrent.webTorrentInstance,
        downloadLimit,
        uploadLimit
      );

      // Clean up stored original limits
      originalSpeedLimitsRef.current.delete(infoHash);

      // Update torrent state to resumed immediately
      setTorrents((prev) =>
        prev.map((t) => (t.infoHash === infoHash ? { ...t, paused: false } : t))
      );

      setSelectedTorrent((prev) =>
        prev?.infoHash === infoHash ? { ...prev, paused: false } : prev
      );

      console.log(
        `Torrent resumed (restored to ${downloadLimit || "unlimited"}KB/s):`,
        torrent.name
      );
    }
  };

  const deleteTorrent = (torrent: TorrentInfo) => {
    if (torrent.webTorrentInstance) {
      // Clean up original speed limits tracking
      originalSpeedLimitsRef.current.delete(torrent.infoHash);

      // Remove torrent from WebTorrent client
      clientRef.current.remove(torrent.webTorrentInstance);

      // Clear update interval
      const interval = updateIntervalsRef.current.get(torrent.infoHash);
      if (interval) {
        clearInterval(interval);
        updateIntervalsRef.current.delete(torrent.infoHash);
      }

      // Remove from state
      setTorrents((prev) =>
        prev.filter((t) => t.infoHash !== torrent.infoHash)
      );

      // Clear selection if this torrent was selected
      if (selectedTorrent?.infoHash === torrent.infoHash) {
        setSelectedTorrent(null);
      }

      // Remove from completed set
      setCompletedTorrents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(torrent.infoHash);
        return newSet;
      });

      // Restore global speed limits if no other torrents are paused
      const remainingTorrents = torrents.filter(
        (t) => t.infoHash !== torrent.infoHash
      );
      const hasActivePausedTorrents = remainingTorrents.some((t) => t.paused);

      if (!hasActivePausedTorrents) {
        applySpeedLimits(); // Restore global limits
      }

      console.log("Torrent deleted:", torrent.name);
    }
  };

  const updateTorrentState = (
    infoHash: string,
    updates: Partial<TorrentInfo>
  ) => {
    setTorrents((prev) =>
      prev.map((t) => (t.infoHash === infoHash ? { ...t, ...updates } : t))
    );

    setSelectedTorrent((prevSelected) => {
      if (prevSelected?.infoHash === infoHash) {
        return { ...prevSelected, ...updates };
      }
      return prevSelected;
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

      // Get external trackers (safe or all based on boost mode)
      try {
        additionalTrackers = await trackerService.current.getAllTrackersFlat(
          boostMode.enabled
        );
        console.log(
          `Fetched ${
            additionalTrackers.length
          } external trackers for enhanced peer discovery ${
            boostMode.enabled ? "(including unsafe)" : "(safe only)"
          }`
        );
      } catch (error) {
        console.warn(
          "Failed to fetch external trackers, proceeding with original source:",
          error
        );
      }

      // For magnet URLs, append trackers to the URL itself
      if (typeof torrentId === "string") {
        source = await trackerService.current.appendTrackersToMagnet(
          torrentId,
          boostMode.enabled
        );
        console.log(
          `Enhanced magnet URL with external trackers ${
            boostMode.enabled ? "(including unsafe)" : "(safe only)"
          }`
        );
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
        } additional trackers ${boostMode.enabled ? "(boost mode)" : ""}`
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
          boostMode: boostMode.enabled,
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

          setTorrents((prev) => {
            const currentTorrent = prev.find(
              (t) => t.infoHash === torrent.infoHash
            );
            if (!currentTorrent) return prev;

            const updatedInfo: TorrentInfo = {
              ...currentTorrent,
              progress: torrent.progress || 0,
              downloadSpeed: torrent.done ? 0 : currentSpeed,
              uploadSpeed: torrent.uploadSpeed || 0,
              downloaded: torrent.downloaded || 0,
              uploaded: torrent.uploaded || 0,
              numPeers: torrent.numPeers || 0,
              timeRemaining: currentTorrent.paused
                ? Number.POSITIVE_INFINITY
                : timeRemaining,
              ready: torrent.ready || false,
              done: torrent.done || false,
              // Keep the current paused state from our state management
              paused: currentTorrent.paused,
              trackerInfo: updatedTrackerInfo,
              files: torrent.files.map((file: any, index: number) => ({
                ...currentTorrent.files[index],
                progress: file.progress || 0,
                downloaded: file.downloaded || 0,
                webTorrentFile: file,
              })),
              webTorrentInstance: torrent,
            };

            return prev.map((t) =>
              t.infoHash === torrent.infoHash ? updatedInfo : t
            );
          });

          setSelectedTorrent((prevSelected) => {
            if (prevSelected?.infoHash === torrent.infoHash) {
              return {
                ...prevSelected,
                progress: torrent.progress || 0,
                downloadSpeed: torrent.done ? 0 : currentSpeed,
                uploadSpeed: torrent.uploadSpeed || 0,
                downloaded: torrent.downloaded || 0,
                uploaded: torrent.uploaded || 0,
                numPeers: torrent.numPeers || 0,
                timeRemaining: prevSelected?.paused
                  ? Number.POSITIVE_INFINITY
                  : timeRemaining,
                ready: torrent.ready || false,
                done: torrent.done || false,
                trackerInfo: updatedTrackerInfo,
                files: torrent.files.map((file: any, index: number) => ({
                  ...(prevSelected?.files[index] || {}),
                  progress: file.progress || 0,
                  downloaded: file.downloaded || 0,
                  webTorrentFile: file,
                })),
              } as TorrentInfo;
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

    if (!magnetValidation.isValid) {
      setError(magnetValidation.error || "Invalid magnet URL");
      return;
    }

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

  const handleDownloadFile = (file: TorrentFile) => {
    if (file.webTorrentFile) {
      downloadFile(file.webTorrentFile, file.name);
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
    // Update speed limits and apply to all non-paused torrents
    applySpeedLimits();

    // Re-apply pause throttling to any currently paused torrents
    torrents.forEach((torrent) => {
      if (torrent.paused && torrent.webTorrentInstance) {
        applyTorrentThrottling(
          torrent.webTorrentInstance,
          PAUSE_THROTTLE_DOWNLOAD,
          PAUSE_THROTTLE_UPLOAD
        );
      }
    });

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
            peer-to-peer connections in WebTorrent. Please use a modern browser
            like Chrome, Firefox, or Safari.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black">
      <BoostModeWarning
        isOpen={boostMode.showWarning}
        onAccept={handleBoostWarningAccept}
        onCancel={handleBoostWarningCancel}
        trackerCounts={{
          safeCount: trackerStats.safeCount,
          unsafeCount: trackerStats.unsafeCount,
          totalCount: trackerStats.safeCount + trackerStats.unsafeCount,
        }}
      />

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

              <Button
                variant={boostMode.enabled ? "default" : "outline"}
                size="sm"
                onClick={handleBoostModeToggle}
                className={`transition-all duration-200 h-8.5 ${
                  boostMode.enabled
                    ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-500"
                    : "border-orange-500/70 text-orange-400 hover:bg-orange-500 hover:text-white"
                }`}
              >
                {boostMode.enabled ? (
                  <ShieldOff className="w-4 h-4 mr-2" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                {boostMode.enabled ? "Disable Boost" : "Boost Mode"}
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
                  {boostMode.enabled
                    ? trackerStats.totalCount
                    : trackerStats.safeCount}
                  {boostMode.enabled ? " Total" : " Safe"}
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
              <div className="mt-3 p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  <strong>Note:</strong> Pause functionality uses throttling (
                  {PAUSE_THROTTLE_DOWNLOAD}KB/s) instead of true pausing due to
                  WebTorrent limitations. This maintains peer connections while
                  virtually stopping downloads.
                </p>
              </div>
            </div>
          )}

          {boostMode.enabled && (
            <Alert className="mt-4 bg-orange-950/30 border-orange-500/50">
              <ShieldOff className="h-4 w-4 text-orange-400" />
              <AlertDescription className="text-orange-200">
                <strong>Boost Mode Active:</strong> Using{" "}
                {trackerStats.unsafeCount} additional unsafe trackers (HTTP/WS)
                alongside {trackerStats.safeCount} safe trackers. Your IP may be
                exposed to unencrypted tracker servers.
              </AlertDescription>
            </Alert>
          )}

          {trackerStats.lastFetched && (
            <div className="mt-4 p-3 bg-transparent rounded-lg border border-gray-700/50">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>
                  Trackers: {trackerStats.httpsCount} HTTPS,{" "}
                  {trackerStats.wssCount} WSS
                  {boostMode.enabled && (
                    <>
                      , {trackerStats.httpCount} HTTP, {trackerStats.wsCount} WS
                    </>
                  )}
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
                {boostMode.enabled && (
                  <Badge className="ml-2 bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs">
                    <Zap className="w-2 h-2 mr-1" />
                    BOOST
                  </Badge>
                )}
              </h2>

              <div className="mb-4">
                <div className="flex gap-3">
                  <div className="flex-1">
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
                      className={`bg-gray-800/90 border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 ${
                        !magnetValidation.isValid && magnetUrl.trim()
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : ""
                      }`}
                      disabled={isTorrentLoading}
                    />
                    {!magnetValidation.isValid && magnetUrl.trim() && (
                      <p className="text-red-400 text-xs mt-1 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {magnetValidation.error}
                      </p>
                    )}
                    {magnetValidation.isValid && magnetUrl.trim() && (
                      <p className="text-emerald-400 text-xs mt-1 flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Valid magnet URL
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={handleMagnetSubmit}
                    disabled={
                      !magnetUrl.trim() ||
                      !magnetValidation.isValid ||
                      isTorrentLoading
                    }
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
                    Connecting to swarm with{" "}
                    {boostMode.enabled
                      ? trackerStats.totalCount
                      : trackerStats.safeCount}
                    {boostMode.enabled ? " total" : " safe"} trackers...
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
                    boostMode={selectedTorrent.boostMode || false}
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
                                    torrent.done
                                      ? "default"
                                      : torrent.paused
                                      ? "secondary"
                                      : "default"
                                  }
                                  className={`text-xs font-medium ${
                                    torrent.done
                                      ? "bg-emerald-600/80 text-white border-emerald-500"
                                      : torrent.paused
                                      ? "bg-yellow-600/80 text-white border-yellow-500"
                                      : "bg-blue-600/80 text-white border-blue-500"
                                  }`}
                                >
                                  {torrent.done
                                    ? "Complete"
                                    : torrent.paused
                                    ? "Paused"
                                    : "Downloading"}
                                </Badge>
                                {torrent.boostMode && (
                                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs">
                                    <Zap className="w-2 h-2 mr-1" />
                                    BOOST
                                  </Badge>
                                )}
                                <div className="flex gap-1">
                                  {!torrent.done && !torrent.paused && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        pauseTorrent(torrent);
                                      }}
                                      className="h-6 px-2 text-xs border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all duration-200"
                                    >
                                      <Pause className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {!torrent.done && torrent.paused && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        resumeTorrent(torrent);
                                      }}
                                      className="h-6 px-2 text-xs border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-all duration-200"
                                    >
                                      <Play className="w-3 h-3" />
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteTorrent(torrent);
                                    }}
                                    className="h-6 px-2 text-xs border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <Progress
                              value={torrent.progress * 100}
                              className={`h-2 mb-2 ${
                                torrent.done
                                  ? "[&>div]:bg-emerald-500"
                                  : torrent.paused
                                  ? "[&>div]:bg-yellow-500"
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
                                  {torrent.paused
                                    ? `~${formatBytes(
                                        PAUSE_THROTTLE_DOWNLOAD * 1000
                                      )}/s`
                                    : `${formatBytes(torrent.downloadSpeed)}/s`}
                                </span>
                                <span className="flex items-center">
                                  <Users className="w-3 h-3 mr-1" />
                                  {torrent.numPeers}
                                </span>
                              </div>
                              <span className="text-gray-500 font-medium">
                                {torrent.paused
                                  ? "Paused"
                                  : formatTime(torrent.timeRemaining)}
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
                              {torrent.boostMode && (
                                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-xs">
                                  <Zap className="w-2 h-2 mr-1" />
                                  BOOST
                                </Badge>
                              )}
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
                onDownloadFile={handleDownloadFile}
                onPauseTorrent={() => pauseTorrent(selectedTorrent)}
                onResumeTorrent={() => resumeTorrent(selectedTorrent)}
                onDeleteTorrent={() => deleteTorrent(selectedTorrent)}
                onBoostTorrent={
                  selectedTorrent.boostMode
                    ? undefined
                    : () => boostExistingTorrent(selectedTorrent)
                }
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
                  started with downloading
                </p>
                {boostMode.enabled && (
                  <p className="text-orange-400 text-sm max-w-md mt-2">
                    Boost mode is active - new torrents will use unsafe trackers
                    for better peer discovery
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
