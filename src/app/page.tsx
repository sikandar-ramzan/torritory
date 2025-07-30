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
  CheckCircle2,
  Loader,
} from "lucide-react";
import TorrentUpload from "@/components/torrent-upload";
import TorrentDetails from "@/components/torrent-details";
import MediaPlayer from "@/components/media-player";

// Declare WebTorrent as a global variable
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
  webTorrentFile?: any; // Reference to the actual WebTorrent file object
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
  webTorrentInstance?: any; // Reference to the actual WebTorrent torrent object
}

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
  const clientRef = useRef<any>(null);
  const [isTorrentLoading, setIsTorrentLoading] = useState<boolean>(false);
  const updateIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    // Load WebTorrent from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js";
    script.async = true;

    script.onload = () => {
      if (window.WebTorrent) {
        setWebTorrentLoaded(true);

        // Check WebRTC support
        if (window.WebTorrent.WEBRTC_SUPPORT) {
          setWebTorrentSupported(true);

          // Initialize WebTorrent client with options
          clientRef.current = new window.WebTorrent({
            maxConns: 55, // Maximum number of connections per torrent
            tracker: {
              announce: [
                "wss://tracker.btorrent.xyz",
                "wss://tracker.openwebtorrent.com",
                "wss://tracker.fastcast.nz",
              ],
            },
          });

          clientRef.current.on("error", (err: Error) => {
            console.error("WebTorrent client error:", err);
            setError(`WebTorrent error: ${err.message}`);
            setIsTorrentLoading(false);
          });
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
      // Clean up all update intervals
      updateIntervalsRef.current.forEach((interval) => clearInterval(interval));
      updateIntervalsRef.current.clear();

      if (clientRef.current) {
        clientRef.current.destroy();
      }
      // Clean up script
      const existingScript = document.querySelector(
        'script[src*="webtorrent"]'
      );
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const getFileType = (filename: string): TorrentFile["type"] => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["mp4", "webm", "mkv", "avi", "mov"].includes(ext || ""))
      return "video";
    if (["mp3", "wav", "flac", "ogg", "m4a"].includes(ext || ""))
      return "audio";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || ""))
      return "image";
    if (["pdf", "txt", "doc", "docx"].includes(ext || "")) return "document";
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
    if (!seconds || seconds === Number.POSITIVE_INFINITY) return "∞";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const addTorrent = async (torrentId: string | File) => {
    console.log("inside addTorrent");
    if (!clientRef.current) {
      setError("WebTorrent client not initialized");
      console.log("error: WebTorrent client not initialized");
      setIsTorrentLoading(false);
      return;
    }

    setError(null);

    // Add timeout to stop loading if torrent doesn't start
    const timeoutId = setTimeout(() => {
      setIsTorrentLoading(false);
      setError(
        "Torrent addition timed out. The torrent might be invalid or have no peers."
      );
    }, 30000); // 30 second timeout

    console.log("adding torrent...");

    try {
      const torrent = clientRef.current.add(torrentId, {
        announce: [
          "wss://tracker.btorrent.xyz",
          "wss://tracker.openwebtorrent.com",
          "wss://tracker.fastcast.nz",
          "wss://tracker.webtorrent.io",
        ],
      });

      console.log("Torrent object created:", torrent);

      // Handle torrent metadata
      torrent.on("metadata", () => {
        console.log("Torrent metadata received!");
        clearTimeout(timeoutId);

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
          progress: torrent.progress,
          downloadSpeed: torrent.downloadSpeed,
          uploadSpeed: torrent.uploadSpeed,
          downloaded: torrent.downloaded,
          uploaded: torrent.uploaded,
          numPeers: torrent.numPeers,
          timeRemaining: torrent.timeRemaining,
          ready: torrent.ready,
          done: torrent.done,
          paused: false,
          webTorrentInstance: torrent,
        };

        setTorrents((prev) => [...prev, torrentInfo]);
        setSelectedTorrent(torrentInfo);
        setIsTorrentLoading(false);

        console.log("Torrent info created:", torrentInfo);

        // Update torrent info every second
        const updateInterval = setInterval(() => {
          const updatedInfo: TorrentInfo = {
            ...torrentInfo,
            progress: torrent.progress,
            downloadSpeed: torrent.downloadSpeed,
            uploadSpeed: torrent.uploadSpeed,
            downloaded: torrent.downloaded,
            uploaded: torrent.uploaded,
            numPeers: torrent.numPeers,
            timeRemaining: torrent.timeRemaining,
            ready: torrent.ready,
            done: torrent.done,
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

          if (selectedTorrent?.infoHash === torrent.infoHash) {
            setSelectedTorrent(updatedInfo);
          }

          if (torrent.done) {
            clearInterval(updateInterval);
            updateIntervalsRef.current.delete(torrent.infoHash);
          }
        }, 1000);

        // Store interval reference for cleanup
        updateIntervalsRef.current.set(torrent.infoHash, updateInterval);
      });

      // Handle torrent ready event
      torrent.on("ready", () => {
        console.log("Torrent is ready!");
      });

      // Handle torrent error
      torrent.on("error", (err: Error) => {
        console.error("Torrent error:", err);
        clearTimeout(timeoutId);
        setError(`Torrent error: ${err.message}`);
        setIsTorrentLoading(false);
      });

      // Handle torrent warning
      torrent.on("warning", (err: Error) => {
        console.warn("Torrent warning:", err);
      });

      // Handle when torrent is done
      torrent.on("done", () => {
        console.log("Torrent download finished!");
      });

      // Log peer connections
      torrent.on("peer", (addr: string) => {
        console.log("Connected to peer:", addr);
      });

      // Handle noPeers event
      torrent.on("noPeers", (announceType: string) => {
        console.log("No peers found via", announceType);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      setError(
        `Failed to add torrent: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
      console.error("Error adding torrent:", err);
      setIsTorrentLoading(false);
    }
  };

  const handleMagnetSubmit = async (
    e: React.FormEvent | React.MouseEvent | React.KeyboardEvent
  ) => {
    console.log("inside handleMagnetSubmit");
    e.preventDefault();
    if (magnetUrl.trim()) {
      setIsTorrentLoading(true);
      console.log("calling addTorrent with:", magnetUrl.trim());
      await addTorrent(magnetUrl.trim());
      setMagnetUrl(""); // Clear the input after submission
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

  if (!webTorrentLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center bg-gray-800/50 border-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Loading WebTorrent
          </h2>
          <p className="text-gray-400">
            Please wait while we load the torrent engine...
          </p>
        </Card>
      </div>
    );
  }

  if (!webTorrentSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center bg-gray-800/50 border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">
            WebRTC Not Supported
          </h2>
          <p className="text-gray-400">
            Your browser doesn&apos;t support WebRTC, which is required for
            WebTorrent. Please use a modern browser like Chrome, Firefox, or
            Safari.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Torritory</h1>
              <p className="text-gray-400 text-xs">
                Stream torrents directly in your browser
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className="border-green-500/50 text-green-400"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                WebRTC Ready
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Add Torrent */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gray-800/50 border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Add Torrent
              </h2>

              {/* Magnet URL Input */}
              <div className="mb-6">
                <div className="flex gap-2">
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
                    className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                    disabled={isTorrentLoading}
                  />
                  <Button
                    onClick={handleMagnetSubmit}
                    disabled={!magnetUrl.trim() || isTorrentLoading}
                    className="cursor-pointer text-gray-400 hover:text-white"
                  >
                    {!isTorrentLoading && <Link className="w-4 h-4" />}
                    {isTorrentLoading && (
                      <Loader className="w-4 h-4 animate-spin" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Paste your torrent magnet link here
                </p>
                {isTorrentLoading && (
                  <p className="text-xs text-blue-400 mt-2 animate-pulse">
                    Connecting to peers and fetching metadata...
                  </p>
                )}
              </div>

              {/* File Upload */}
              <TorrentUpload onFileUpload={handleFileUpload} />
            </Card>

            {/* Torrent List */}
            <Card className="mt-6 p-6 bg-gray-800/50 border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">
                Active Torrents
              </h2>
              <ScrollArea className="h-64">
                {torrents.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No active torrents
                  </p>
                ) : (
                  <div className="space-y-2">
                    {torrents.map((torrent) => (
                      <div
                        key={torrent.infoHash}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTorrent?.infoHash === torrent.infoHash
                            ? "bg-blue-600/20 border border-blue-500/50"
                            : "bg-gray-700/30 hover:bg-gray-700/50"
                        }`}
                        onClick={() => setSelectedTorrent(torrent)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-sm font-medium text-white truncate">
                            {torrent.name}
                          </h3>
                          <Badge
                            variant={torrent.done ? "default" : "secondary"}
                          >
                            {torrent.done ? "Complete" : "Downloading"}
                          </Badge>
                        </div>
                        <Progress
                          value={torrent.progress * 100}
                          className="h-1"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>{Math.round(torrent.progress * 100)}%</span>
                          <span>{formatBytes(torrent.downloadSpeed)}/s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Right Panel - Torrent Details */}
          <div className="lg:col-span-2">
            {selectedTorrent ? (
              <TorrentDetails
                torrent={selectedTorrent}
                onPlayFile={playFile}
                formatBytes={formatBytes}
                formatTime={formatTime}
              />
            ) : (
              <Card className="p-12 bg-gray-800/50 border-gray-700 text-center">
                <HardDrive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  No Torrent Selected
                </h2>
                <p className="text-gray-400">
                  Add a torrent using a magnet URL or .torrent file to get
                  started
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Media Player Modal */}
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
