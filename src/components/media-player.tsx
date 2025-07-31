/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  SkipBack,
  SkipForward,
  RotateCcw,
  Activity,
} from "lucide-react";

interface TorrentFile {
  name: string;
  length: number;
  path: string;
  progress: number;
  downloaded: number;
  type: "video" | "audio" | "image" | "document" | "other";
  webTorrentFile?: any;
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
}

interface MediaPlayerProps {
  file: TorrentFile;
  torrent: TorrentInfo;
  onClose: () => void;
}

export default function MediaPlayer({
  file,
  torrent,
  onClose,
}: MediaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);

  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);
  const streamCheckIntervalRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!file.webTorrentFile) {
      setError("WebTorrent file not available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const checkStreamReady = () => file.progress >= 0.01;

    const initializeStream = () => {
      try {
        file.webTorrentFile.getBlobURL((err: Error | null, url: string) => {
          if (err) {
            console.error("Error getting blob URL:", err);
            setError(`Failed to create stream: ${err.message}`);
            setIsLoading(false);
            return;
          }

          console.log("Got blob URL for streaming:", url);
          setMediaUrl(url);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Error initializing stream:", err);
        setError(
          `Failed to initialize stream: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setIsLoading(false);
      }
    };

    if (checkStreamReady()) {
      initializeStream();
    } else {
      console.log("Waiting for more data to download before streaming...");

      streamCheckIntervalRef.current = setInterval(() => {
        if (checkStreamReady()) {
          clearInterval(streamCheckIntervalRef.current!);
          initializeStream();
        }
      }, 1000);

      setTimeout(() => {
        if (streamCheckIntervalRef.current) {
          clearInterval(streamCheckIntervalRef.current);
          if (file.progress < 0.01) {
            setError(
              "Not enough data downloaded to start streaming. Please wait for more content to download."
            );
            setIsLoading(false);
          }
        }
      }, 30000);
    }

    return () => {
      if (streamCheckIntervalRef.current) {
        clearInterval(streamCheckIntervalRef.current);
      }
      if (mediaUrl) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [file, mediaUrl]);

  useEffect(() => {
    if (file.type === "video") {
      const resetControlsTimeout = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }, 3000);
      };

      const handleMouseMove = () => resetControlsTimeout();
      const handleMouseLeave = () => {
        if (isPlaying) {
          setShowControls(false);
        }
      };

      const container = containerRef.current;
      if (container) {
        container.addEventListener("mousemove", handleMouseMove);
        container.addEventListener("mouseleave", handleMouseLeave);
      }

      return () => {
        if (container) {
          container.removeEventListener("mousemove", handleMouseMove);
          container.removeEventListener("mouseleave", handleMouseLeave);
        }
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }
  }, [isPlaying, file.type]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (newTime: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(newTime, "seconds");
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen toggle failed:", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  const retryStream = () => {
    setError(null);
    setIsLoading(true);
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
      setMediaUrl(null);
    }
  };

  const handlePlayerReady = () => {
    console.log("ReactPlayer ready");
    setIsLoading(false);
  };

  const handlePlayerError = (error: any) => {
    console.error("ReactPlayer error:", error);
    setError(`Playback error: ${error?.message || "Unknown error"}`);
    setIsLoading(false);
  };

  const handleProgress = (state: {
    played: number;
    playedSeconds: number;
    loaded: number;
    loadedSeconds: number;
  }) => {
    setCurrentTime(state.playedSeconds);
    setBuffered(state.loaded * 100);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="w-full h-full max-w-7xl bg-gray-900 overflow-hidden flex flex-col">
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900/90 backdrop-blur-sm transition-opacity duration-300 ${
            file.type === "video" && !showControls ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {file.name}
            </h3>
            <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
              <span>{torrent.name}</span>
              <span className="flex items-center">
                <Activity className="w-3 h-3 mr-1" />
                {Math.round(file.progress * 100)}% downloaded
              </span>
              <span className="flex items-center">
                Download: {((torrent.downloadSpeed || 0) / 1000).toFixed(1)}{" "}
                KB/s
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="relative bg-black flex-1 flex items-center justify-center">
          {mediaUrl && !error && !isLoading && (
            <ReactPlayer
              ref={playerRef}
              url={mediaUrl}
              playing={isPlaying}
              volume={isMuted ? 0 : volume}
              width="100%"
              height={file.type === "video" ? "100%" : "200px"}
              controls={false}
              onReady={handlePlayerReady}
              onError={handlePlayerError}
              onProgress={handleProgress as any}
              onDuration={handleDuration}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
            />
          )}

          {file.type === "audio" && mediaUrl && !isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600">
                  <Volume2 className="w-12 h-12 text-white" />
                </div>
                <p className="text-white font-bold text-xl mb-2">
                  {file.name.split(".")[0]}
                </p>
                <p className="text-gray-400">Audio File</p>
              </div>
            </div>
          )}

          {(isLoading || error) && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              {isLoading ? (
                <div className="text-white text-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                  <p className="text-xl font-semibold mb-2">
                    Preparing media stream...
                  </p>
                  <div className="text-gray-300 space-y-1">
                    <p>Downloaded: {Math.round(file.progress * 100)}%</p>
                    <p className="text-sm">
                      {file.progress < 0.01
                        ? "Waiting for sufficient data to start streaming..."
                        : "Creating media stream..."}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Progress
                      value={file.progress * 100}
                      className="h-2 w-64 mx-auto [&>div]:bg-emerald-500"
                    />
                  </div>
                </div>
              ) : error ? (
                <div className="text-center p-8 max-w-md">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-red-300 text-lg font-semibold mb-2">
                    {error}
                  </p>
                  <p className="text-gray-400 text-sm mb-4">
                    {file.progress < 0.01
                      ? "Wait for more content to download before streaming"
                      : "Try refreshing the stream or check if the file format is supported"}
                  </p>
                  <Button
                    onClick={retryStream}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div
          className={`p-4 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 transition-opacity duration-300 ${
            file.type === "video" && !showControls
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
        >
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
              <span className="font-medium">{formatTime(currentTime)}</span>
              <span className="font-medium">{formatTime(duration)}</span>
            </div>

            <div
              className="relative h-2 bg-gray-700 rounded-full overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(duration * percent);
              }}
            >
              <div
                className="absolute inset-y-0 left-0 bg-gray-600 rounded-full transition-all duration-200"
                style={{ width: `${buffered}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-100"
                style={{
                  width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(-10)}
                disabled={isLoading}
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={togglePlay}
                disabled={isLoading || !mediaUrl}
                className="bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-emerald-400" />
                ) : (
                  <Play className="w-6 h-6 text-emerald-400" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => skip(10)}
                disabled={isLoading}
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-gray-300" />
                )}
              </Button>

              <div className="w-24">
                <div
                  className="h-1 bg-gray-600 rounded-full cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    handleVolumeChange(percent);
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-100"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
              </div>

              {file.type === "video" && (
                <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                  <Maximize className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
