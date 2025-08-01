/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Upload,
  Users,
  Clock,
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  File,
  Activity,
  HardDrive,
  Globe,
  Copy,
  CheckCircle2,
  Pause,
  Play,
  StopCircle,
  Trash2,
  Zap,
  Shield,
  ShieldOff,
} from "lucide-react";
import { useState } from "react";
import { TorrentDetailsProps, TorrentFile } from "@/types";

export default function TorrentDetails({
  torrent,
  onDownloadFile,
  onPauseTorrent,
  onResumeTorrent,
  onDeleteTorrent,
  onBoostTorrent,
  formatBytes,
  formatTime,
}: TorrentDetailsProps) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedMagnet, setCopiedMagnet] = useState(false);

  const getFileIcon = (type: TorrentFile["type"]) => {
    switch (type) {
      case "video":
        return <FileVideo className="w-4 h-4" />;
      case "audio":
        return <FileAudio className="w-4 h-4" />;
      case "image":
        return <FileImage className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getFileTypeColor = (type: TorrentFile["type"]) => {
    switch (type) {
      case "video":
        return "text-red-400";
      case "audio":
        return "text-green-400";
      case "image":
        return "text-blue-400";
      case "document":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  const getFileTypeBadgeColor = (type: TorrentFile["type"]) => {
    switch (type) {
      case "video":
        return "bg-red-500/20 text-red-300 border-red-500/50";
      case "audio":
        return "bg-green-500/20 text-green-300 border-green-500/50";
      case "image":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50";
      case "document":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50";
    }
  };

  const copyToClipboard = async (text: string, type: "hash" | "magnet") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "hash") {
        setCopiedHash(true);
        setTimeout(() => setCopiedHash(false), 2000);
      } else {
        setCopiedMagnet(true);
        setTimeout(() => setCopiedMagnet(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const downloadAllFiles = () => {
    torrent.files.forEach((file) => {
      if (file.webTorrentFile && file.progress > 0) {
        onDownloadFile(file);
      }
    });
  };

  const filesByType = torrent.files.reduce((acc, file) => {
    if (!acc[file.type]) acc[file.type] = [];
    acc[file.type].push(file);
    return acc;
  }, {} as Record<string, TorrentFile[]>);

  const typeOrder = ["video", "audio", "image", "document", "other"];
  const sortedFileTypes = typeOrder.filter(
    (type) => filesByType[type]?.length > 0
  );

  return (
    <Card
      className={`bg-gray-900/90 border-gray-700/50 shadow-2xl backdrop-blur-sm overflow-hidden ${
        torrent.boostMode ? "ring-1 ring-orange-500/30" : ""
      }`}
    >
      <div
        className={`p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 ${
          torrent.boostMode ? "border-orange-500/20" : ""
        }`}
      >
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white leading-tight">
                {torrent.name}
              </h2>
              {torrent.boostMode && (
                <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                  <Zap className="w-3 h-3 mr-1" />
                  BOOST MODE
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant={
                  torrent.done
                    ? "default"
                    : torrent.paused
                    ? "secondary"
                    : "default"
                }
                className={`font-semibold ${
                  torrent.done
                    ? "bg-emerald-600/80 text-white border-emerald-500"
                    : torrent.paused
                    ? "bg-yellow-600/80 text-white border-yellow-500"
                    : "bg-blue-600/80 text-white border-blue-500"
                }`}
              >
                <Activity className="w-3 h-3 mr-1" />
                {torrent.done
                  ? "Complete"
                  : torrent.paused
                  ? "Paused"
                  : "Downloading"}
              </Badge>
              <Badge
                variant="outline"
                className="text-gray-300 border-gray-600"
              >
                <HardDrive className="w-3 h-3 mr-1" />
                {formatBytes(torrent.length)}
              </Badge>
              <Badge
                variant="outline"
                className="text-gray-300 border-gray-600"
              >
                <File className="w-3 h-3 mr-1" />
                {torrent.files.length} files
              </Badge>
              {torrent.boostMode ? (
                <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/50">
                  <ShieldOff className="w-3 h-3 mr-1" />
                  Unsafe Trackers Active
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/50">
                  <Shield className="w-3 h-3 mr-1" />
                  Safe Trackers Only
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {!torrent.done && (
              <>
                {!torrent.paused ? (
                  <Button
                    onClick={onPauseTorrent}
                    variant="outline"
                    className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500 hover:text-white transition-all duration-200"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={onResumeTorrent}
                    className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
              </>
            )}
            {torrent.done && (
              <Button
                onClick={downloadAllFiles}
                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            )}

            <Button
              onClick={onDeleteTorrent}
              variant="outline"
              className="border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center text-sm text-gray-300 mb-3">
            <span className="font-semibold">
              Progress: {Math.round((torrent.progress || 0) * 100)}%
            </span>
            <span className="font-medium">
              {formatBytes(torrent.downloaded || 0)} /{" "}
              {formatBytes(torrent.length || 0)}
            </span>
          </div>
          <Progress
            value={(torrent.progress || 0) * 100}
            className={`h-3 ${
              torrent.done
                ? "[&>div]:bg-emerald-500"
                : torrent.paused
                ? "[&>div]:bg-yellow-500"
                : torrent.progress > 0
                ? torrent.boostMode
                  ? "[&>div]:bg-orange-500 [&>div]:animate-pulse"
                  : "[&>div]:bg-blue-500 [&>div]:animate-pulse"
                : "[&>div]:bg-gray-600"
            }`}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Download className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                {formatBytes(torrent.downloadSpeed || 0)}/s
              </div>
              <div className="text-gray-400 text-sm font-medium">Download</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Upload className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                {formatBytes(torrent.uploadSpeed || 0)}/s
              </div>
              <div className="text-gray-400 text-sm font-medium">Upload</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                {torrent.numPeers || 0}
              </div>
              <div className="text-gray-400 text-sm font-medium">Peers</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <div className="text-white font-bold text-lg">
                {formatTime(torrent.timeRemaining || 0)}
              </div>
              <div className="text-gray-400 text-sm font-medium">
                {torrent.paused ? "Paused" : "Remaining"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="files" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger
              value="files"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold"
            >
              <File className="w-4 h-4 mr-2" />
              Files ({torrent.files?.length || 0})
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-semibold"
            >
              <Globe className="w-4 h-4 mr-2" />
              Torrent Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="mt-6">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-6">
                {sortedFileTypes.map((fileType) => (
                  <div key={fileType} className="space-y-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={getFileTypeColor(
                          fileType as TorrentFile["type"]
                        )}
                      >
                        {getFileIcon(fileType as TorrentFile["type"])}
                      </div>
                      <h3 className="text-lg font-semibold text-white capitalize">
                        {fileType} Files
                      </h3>
                      <Badge
                        variant="outline"
                        className={getFileTypeBadgeColor(
                          fileType as TorrentFile["type"]
                        )}
                      >
                        {filesByType[fileType].length}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {filesByType[fileType].map((file, index) => (
                        <div
                          key={`${fileType}-${index}`}
                          className="group flex items-center justify-between p-4 rounded-xl bg-gray-800/40 hover:bg-gray-800/60 transition-all duration-200 border border-gray-700/30 hover:border-gray-600/50"
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              className={`${getFileTypeColor(
                                file.type
                              )} opacity-80 group-hover:opacity-100 transition-opacity`}
                            >
                              {getFileIcon(file.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate text-base">
                                {file.name}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span className="font-medium">
                                  {formatBytes(file.length || 0)}
                                </span>
                                <span
                                  className={`font-semibold ${
                                    file.progress > 0.8
                                      ? "text-emerald-400"
                                      : file.progress > 0.3
                                      ? torrent.boostMode
                                        ? "text-orange-400"
                                        : "text-blue-400"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {Math.round((file.progress || 0) * 100)}%
                                </span>
                              </div>
                              <Progress
                                value={(file.progress || 0) * 100}
                                className={`h-1.5 mt-2 ${
                                  file.progress > 0.8
                                    ? "[&>div]:bg-emerald-500"
                                    : file.progress > 0.3
                                    ? torrent.boostMode
                                      ? "[&>div]:bg-orange-500"
                                      : "[&>div]:bg-blue-500"
                                    : file.progress > 0
                                    ? "[&>div]:bg-yellow-500"
                                    : "[&>div]:bg-gray-600"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onDownloadFile(file)}
                              disabled={(file.progress || 0) < 1}
                              className={`transition-all duration-200 ${
                                (file.progress || 0) >= 1
                                  ? "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                  : "border-gray-600 text-gray-500 cursor-not-allowed"
                              }`}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              {(file.progress || 0) >= 1
                                ? "Save"
                                : "Downloading"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className="mt-6">
            <div className="space-y-6">
              {torrent.boostMode && (
                <div className="p-4 rounded-xl bg-orange-950/30 border border-orange-500/50">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldOff className="w-5 h-5 text-orange-400" />
                    <span className="text-orange-300 font-semibold">
                      Boost Mode Active
                    </span>
                  </div>
                  <p className="text-orange-200 text-sm">
                    This torrent is using both safe (HTTPS/WSS) and unsafe
                    (HTTP/WS) trackers for enhanced peer discovery. Your IP
                    address may be exposed to unencrypted tracker servers.
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Info Hash
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(torrent.infoHash, "hash")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedHash ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="text-white font-mono text-sm bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 break-all">
                  {torrent.infoHash}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                    Magnet URI
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(torrent.magnetURI, "magnet")}
                    className="text-gray-400 hover:text-white"
                  >
                    {copiedMagnet ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="text-white font-mono text-sm bg-gray-900/50 p-3 rounded-lg border border-gray-700/50 break-all max-h-32 overflow-y-auto">
                  {torrent.magnetURI}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                    Total Size
                  </label>
                  <div className="text-white font-bold text-xl">
                    {formatBytes(torrent.length || 0)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                    File Count
                  </label>
                  <div className="text-white font-bold text-xl">
                    {torrent.files?.length || 0}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                    Downloaded
                  </label>
                  <div className="text-emerald-400 font-bold text-xl">
                    {formatBytes(torrent.downloaded || 0)}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block mb-2">
                    Uploaded
                  </label>
                  <div className="text-blue-400 font-bold text-xl">
                    {formatBytes(torrent.uploaded || 0)}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-800/40 border border-gray-700/50">
                <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block mb-3">
                  Tracker Status
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-white font-semibold mb-1">
                      External Trackers
                    </div>
                    <div className="text-sm text-gray-400">
                      {torrent.trackerInfo.external.active} active /{" "}
                      {torrent.trackerInfo.external.total} total
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">
                      Internal Trackers
                    </div>
                    <div className="text-sm text-gray-400">
                      {torrent.trackerInfo.internal.active} active /{" "}
                      {torrent.trackerInfo.internal.total} total
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">
                      Total Active Trackers
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold text-lg">
                        {torrent.trackerInfo.totalActive}
                      </span>
                      {torrent.boostMode && (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                          <Zap className="w-2 h-2 mr-1" />
                          BOOST
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
