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

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  const mediaRef = file.type === "video" ? videoRef : audioRef;

  useEffect(() => {
    if (!file.webTorrentFile) {
      setError("WebTorrent file not available");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Use WebTorrent's appendTo method to stream the file
    const mediaContainer = mediaContainerRef.current;
    if (mediaContainer && file.webTorrentFile) {
      // Clear any existing content
      mediaContainer.innerHTML = "";

      try {
        // Use WebTorrent's built-in streaming
        file.webTorrentFile.appendTo(
          mediaContainer,
          {
            autoplay: false,
            controls: false, // We'll use custom controls
            muted: false,
          },
          (err: Error, elem: HTMLVideoElement | HTMLAudioElement) => {
            if (err) {
              setError(`Failed to load media: ${err.message}`);
              setIsLoading(false);
              return;
            }

            setIsLoading(false);

            // Set up event listeners for the media element
            const handleLoadedMetadata = () => {
              setDuration(elem.duration);
            };

            const handleTimeUpdate = () => {
              setCurrentTime(elem.currentTime);
            };

            const handleError = () => {
              setError("Failed to play media file");
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

            elem.addEventListener("loadedmetadata", handleLoadedMetadata);
            elem.addEventListener("timeupdate", handleTimeUpdate);
            elem.addEventListener("error", handleError);
            elem.addEventListener("ended", handleEnded);
            elem.addEventListener("play", handlePlay);
            elem.addEventListener("pause", handlePause);

            // Store reference to the media element
            if (file.type === "video") {
              videoRef.current = elem as HTMLVideoElement;
            } else {
              audioRef.current = elem as HTMLAudioElement;
            }

            // Clean up function
            return () => {
              elem.removeEventListener("loadedmetadata", handleLoadedMetadata);
              elem.removeEventListener("timeupdate", handleTimeUpdate);
              elem.removeEventListener("error", handleError);
              elem.removeEventListener("ended", handleEnded);
              elem.removeEventListener("play", handlePlay);
              elem.removeEventListener("pause", handlePause);
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

  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
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
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={containerRef}
        className="w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-white">{file.name}</h3>
            <p className="text-sm text-gray-400">
              {torrent.name} • {Math.round(file.progress * 100)}% downloaded
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Media Container */}
        <div className="relative bg-black min-h-[300px]">
          <div
            ref={mediaContainerRef}
            className={`w-full ${
              file.type === "video"
                ? "min-h-[400px]"
                : "min-h-[200px] flex items-center justify-center"
            }`}
            style={{
              display: file.type === "video" ? "block" : "flex",
              alignItems: file.type === "audio" ? "center" : "stretch",
              justifyContent: file.type === "audio" ? "center" : "stretch",
            }}
          >
            {file.type === "audio" && !isLoading && !error && (
              <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Volume2 className="w-8 h-8 text-white" />
                </div>
                <p className="text-white font-medium">{file.name}</p>
              </div>
            )}
          </div>

          {/* Loading/Error Overlay */}
          {(isLoading || error) && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              {isLoading ? (
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Loading media stream...</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Downloaded: {Math.round(file.progress * 100)}%
                  </p>
                </div>
              ) : error ? (
                <div className="text-red-400 text-center">
                  <p>{error}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Make sure the file has downloaded enough to start streaming
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-800">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <Progress
              value={duration ? (currentTime / duration) * 100 : 0}
              className="h-2 cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(duration * percent);
              }}
            />
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => skip(-10)}>
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <Button variant="ghost" size="sm" onClick={() => skip(10)}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <div className="w-20">
                <Progress
                  value={volume * 100}
                  className="h-1 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    handleVolumeChange(percent);
                  }}
                />
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
