/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
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
  const [buffered, setBuffered] = useState<TimeRanges | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

  const mediaRef = file.type === "video" ? videoRef : audioRef;

  useEffect(() => {
    if (!file.webTorrentFile) {
      setError("WebTorrent file not available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const mediaContainer = mediaContainerRef.current;
    if (mediaContainer && file.webTorrentFile) {
      mediaContainer.innerHTML = "";

      try {
        file.webTorrentFile.appendTo(
          mediaContainer,
          {
            autoplay: false,
            controls: false,
            muted: false,
            preload: "metadata",
            crossOrigin: "anonymous",
          },
          (err: Error, elem: HTMLVideoElement | HTMLAudioElement) => {
            if (err) {
              setError(`Failed to load media: ${err.message}`);
              setIsLoading(false);
              return;
            }

            setIsLoading(false);

            const handleLoadedMetadata = () => {
              setDuration(elem.duration);
              console.log("Media metadata loaded:", elem.duration);
            };

            const handleTimeUpdate = () => {
              setCurrentTime(elem.currentTime);
              if (elem.buffered) {
                setBuffered(elem.buffered);
              }
            };

            const handleError = (e: Event) => {
              console.error("Media error:", e);
              setError(
                "Failed to play media file. Try waiting for more content to download."
              );
            };

            const handleEnded = () => {
              setIsPlaying(false);
            };

            const handlePlay = () => {
              setIsPlaying(true);
            };

            const handlePause = () => {
              setIsPlaying(false);
            };

            const handleLoadStart = () => {
              console.log("Media loading started");
            };

            const handleCanPlay = () => {
              console.log("Media can start playing");
            };

            const handleWaiting = () => {
              console.log("Media waiting for data");
            };

            elem.addEventListener("loadedmetadata", handleLoadedMetadata);
            elem.addEventListener("timeupdate", handleTimeUpdate);
            elem.addEventListener("error", handleError);
            elem.addEventListener("ended", handleEnded);
            elem.addEventListener("play", handlePlay);
            elem.addEventListener("pause", handlePause);
            elem.addEventListener("loadstart", handleLoadStart);
            elem.addEventListener("canplay", handleCanPlay);
            elem.addEventListener("waiting", handleWaiting);

            elem.style.width = "100%";
            elem.style.height = file.type === "video" ? "auto" : "200px";
            elem.style.backgroundColor = "#000";
            elem.style.outline = "none";

            if (file.type === "video") {
              videoRef.current = elem as HTMLVideoElement;
            } else {
              audioRef.current = elem as HTMLAudioElement;
            }

            return () => {
              elem.removeEventListener("loadedmetadata", handleLoadedMetadata);
              elem.removeEventListener("timeupdate", handleTimeUpdate);
              elem.removeEventListener("error", handleError);
              elem.removeEventListener("ended", handleEnded);
              elem.removeEventListener("play", handlePlay);
              elem.removeEventListener("pause", handlePause);
              elem.removeEventListener("loadstart", handleLoadStart);
              elem.removeEventListener("canplay", handleCanPlay);
              elem.removeEventListener("waiting", handleWaiting);
            };
          }
        );
      } catch (err) {
        setError(
          `Failed to stream file: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
        setIsLoading(false);
      }
    }
  }, [file]);

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
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      const playPromise = media.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Play failed:", error);
          setError(
            "Playback failed. The file may not be ready for streaming yet."
          );
        });
      }
    }
  };

  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;

    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    const media = mediaRef.current;
    if (!media) return;

    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (newTime: number) => {
    const media = mediaRef.current;
    if (!media) return;

    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    if (!seconds || !isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const skip = (seconds: number) => {
    const media = mediaRef.current;
    if (!media) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    handleSeek(newTime);
  };

  const getBufferedPercentage = () => {
    if (!buffered || !duration) return 0;

    let bufferedAmount = 0;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= currentTime && currentTime <= buffered.end(i)) {
        bufferedAmount = buffered.end(i);
        break;
      }
    }

    return (bufferedAmount / duration) * 100;
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
          <div
            ref={mediaContainerRef}
            className="w-full h-full flex items-center justify-center"
          >
            {file.type === "audio" && !isLoading && !error && (
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-600">
                  <Volume2 className="w-12 h-12 text-white" />
                </div>
                <p className="text-white font-bold text-xl mb-2">
                  {file.name.split(".")[0]}
                </p>
                <p className="text-gray-400">Audio File</p>
              </div>
            )}
          </div>

          {(isLoading || error) && (
            <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
              {isLoading ? (
                <div className="text-white text-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
                  <p className="text-xl font-semibold mb-2">
                    Loading media stream...
                  </p>
                  <div className="text-gray-300 space-y-1">
                    <p>Downloaded: {Math.round(file.progress * 100)}%</p>
                    <p className="text-sm">
                      Waiting for sufficient data to start playback...
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
                    {file.progress < 0.1
                      ? "Wait for more content to download before streaming"
                      : "Try refreshing the stream or check if the file format is supported"}
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
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
                style={{ width: `${getBufferedPercentage()}%` }}
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
                disabled={isLoading}
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
