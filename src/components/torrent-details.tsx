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
  TrendingUp,
  Database,
  Network,
  Cpu,
  Share2,
  Info,
} from "lucide-react";
import { useState } from "react";
import { TorrentDetailsProps, TorrentFile } from "@/types";

// Enhanced Stats Component
const StatMetric = ({
  icon: Icon,
  label,
  value,
  gradient,
  pulse = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  gradient: string;
  pulse?: boolean;
}) => (
  <div className="glass-card p-6 rounded-2xl border border-white/10 group hover:scale-105 transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${gradient} shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {pulse && (
        <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-glow-success"></div>
      )}
    </div>
    <div className="space-y-2">
      <h3 className="text-2xl font-bold text-white">{value}</h3>
      <p className="text-gray-400 text-sm font-medium">{label}</p>
    </div>
  </div>
);

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
        return <FileVideo className="w-5 h-5" />;
      case "audio":
        return <FileAudio className="w-5 h-5" />;
      case "image":
        return <FileImage className="w-5 h-5" />;
      case "document":
        return <FileText className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getFileTypeGradient = (type: TorrentFile["type"]) => {
    switch (type) {
      case "video":
        return "from-red-500 to-red-600";
      case "audio":
        return "from-green-500 to-green-600";
      case "image":
        return "from-blue-500 to-blue-600";
      case "document":
        return "from-yellow-500 to-yellow-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getFileTypeBadgeClass = (type: TorrentFile["type"]) => {
    switch (type) {
      case "video":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0";
      case "audio":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white border-0";
      case "image":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0";
      case "document":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0";
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="glass-card p-8 rounded-2xl border border-white/10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-glow">
                <Database className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-white leading-tight mb-2 truncate">
                  {torrent.name}
                </h1>
                <div className="flex items-center space-x-3 flex-wrap">
                  <Badge
                    className={`font-semibold text-sm px-3 py-1 ${
                      torrent.done
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0"
                        : torrent.paused
                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0"
                        : "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0"
                    }`}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {torrent.done
                      ? "Complete"
                      : torrent.paused
                      ? "Paused"
                      : "Downloading"}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0 px-3 py-1">
                    <HardDrive className="w-4 h-4 mr-2" />
                    {formatBytes(torrent.length)}
                  </Badge>
                  <Badge className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-0 px-3 py-1">
                    <File className="w-4 h-4 mr-2" />
                    {torrent.files.length} files
                  </Badge>
                  {torrent.boostMode ? (
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 px-3 py-1">
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Boost Mode
                    </Badge>
                  ) : (
                    <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-0 px-3 py-1">
                      <Shield className="w-4 h-4 mr-2" />
                      Safe Mode
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 ml-6">
            {!torrent.done && (
              <>
                {!torrent.paused ? (
                  <Button
                    onClick={onPauseTorrent}
                    className="btn-warning h-11 px-4"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    onClick={onResumeTorrent}
                    className="btn-secondary h-11 px-4"
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
                className="btn-success h-11 px-4"
              >
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
            )}
            <Button onClick={onDeleteTorrent} className="btn-danger h-11 px-4">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-2xl font-bold text-white">
              {Math.round((torrent.progress || 0) * 100)}% Complete
            </span>
            <span className="text-lg font-semibold text-gray-300">
              {formatBytes(torrent.downloaded || 0)} /{" "}
              {formatBytes(torrent.length || 0)}
            </span>
          </div>
          <div className="progress-modern h-4">
            <div
              className={`progress-bar ${
                torrent.done
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : torrent.paused
                  ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                  : "bg-gradient-to-r from-blue-500 to-blue-600"
              }`}
              style={{ width: `${(torrent.progress || 0) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatMetric
            icon={Download}
            label="Download Speed"
            value={formatBytes(torrent.downloadSpeed || 0) + "/s"}
            gradient="bg-gradient-to-r from-emerald-500 to-emerald-600"
            pulse={torrent.downloadSpeed > 0}
          />
          <StatMetric
            icon={Upload}
            label="Upload Speed"
            value={formatBytes(torrent.uploadSpeed || 0) + "/s"}
            gradient="bg-gradient-to-r from-cyan-500 to-cyan-600"
            pulse={torrent.uploadSpeed > 0}
          />
          <StatMetric
            icon={Users}
            label="Connected Peers"
            value={(torrent.numPeers || 0).toString()}
            gradient="bg-gradient-to-r from-purple-500 to-purple-600"
            pulse={torrent.numPeers > 0}
          />
          <StatMetric
            icon={Clock}
            label={torrent.paused ? "Status" : "Time Remaining"}
            value={
              torrent.paused ? "Paused" : formatTime(torrent.timeRemaining || 0)
            }
            gradient="bg-gradient-to-r from-orange-500 to-orange-600"
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <Tabs defaultValue="files" className="w-full">
          <div className="border-b border-white/10 bg-black/20">
            <TabsList className="w-full bg-transparent border-0 h-16 p-2">
              <TabsTrigger
                value="files"
                className="flex-1 h-12 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                <File className="w-5 h-5 mr-2" />
                Files ({torrent.files?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="info"
                className="flex-1 h-12 text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-glow transition-all duration-300"
              >
                <Info className="w-5 h-5 mr-2" />
                Information
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="files" className="p-8">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {sortedFileTypes.map((fileType) => (
                  <div key={fileType} className="space-y-4">
                    <div className="flex items-center space-x-4 mb-6">
                      <div
                        className={`p-3 rounded-xl bg-gradient-to-r ${getFileTypeGradient(
                          fileType as TorrentFile["type"]
                        )} shadow-lg`}
                      >
                        {getFileIcon(fileType as TorrentFile["type"])}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white capitalize">
                          {fileType} Files
                        </h3>
                        <p className="text-gray-400">
                          {filesByType[fileType].length} files in this category
                        </p>
                      </div>
                      <Badge
                        className={getFileTypeBadgeClass(
                          fileType as TorrentFile["type"]
                        )}
                      >
                        {filesByType[fileType].length}
                      </Badge>
                    </div>

                    <div className="grid gap-3">
                      {filesByType[fileType].map((file, index) => (
                        <div
                          key={`${fileType}-${index}`}
                          className="group glass-card p-6 rounded-xl border border-white/10 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div
                                className={`p-2 rounded-lg bg-gradient-to-r ${getFileTypeGradient(
                                  file.type
                                )} opacity-80 group-hover:opacity-100 transition-opacity`}
                              >
                                {getFileIcon(file.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-semibold text-white truncate mb-2">
                                  {file.name}
                                </h4>
                                <div className="flex items-center space-x-6 text-sm mb-3">
                                  <span className="text-gray-300 font-medium">
                                    {formatBytes(file.length || 0)}
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      file.progress > 0.8
                                        ? "text-emerald-400"
                                        : file.progress > 0.3
                                        ? "text-cyan-400"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {Math.round((file.progress || 0) * 100)}%
                                    complete
                                  </span>
                                </div>
                                <div className="progress-modern h-2">
                                  <div
                                    className={`progress-bar ${
                                      file.progress > 0.8
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                                        : file.progress > 0.3
                                        ? "bg-gradient-to-r from-cyan-500 to-cyan-600"
                                        : file.progress > 0
                                        ? "bg-gradient-to-r from-yellow-500 to-yellow-600"
                                        : "bg-gradient-to-r from-gray-500 to-gray-600"
                                    }`}
                                    style={{
                                      width: `${(file.progress || 0) * 100}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="ml-6 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                onClick={() => onDownloadFile(file)}
                                disabled={(file.progress || 0) < 1}
                                className={`h-10 px-4 transition-all duration-300 ${
                                  (file.progress || 0) >= 1
                                    ? "btn-success"
                                    : "glass-card border-gray-500/20 text-gray-500 cursor-not-allowed"
                                }`}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                {(file.progress || 0) >= 1
                                  ? "Download"
                                  : "Downloading"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="info" className="p-8">
            <div className="space-y-8">
              {/* Boost Mode Warning */}
              {torrent.boostMode && (
                <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg">
                      <ShieldOff className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-orange-300">
                      Boost Mode Active
                    </h3>
                  </div>
                  <p className="text-orange-200 leading-relaxed">
                    This torrent is using both safe (HTTPS/WSS) and unsafe
                    (HTTP/WS) trackers for enhanced peer discovery. Your IP
                    address may be exposed to unencrypted tracker servers.
                  </p>
                </div>
              )}

              {/* Hash & Magnet */}
              <div className="grid gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Network className="w-5 h-5 mr-2 text-purple-400" />
                      Info Hash
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(torrent.infoHash, "hash")}
                      className="glass-card border-purple-500/20 text-purple-300 hover:bg-purple-500/10"
                    >
                      {copiedHash ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/10 bg-black/20">
                    <code className="text-white font-mono text-sm break-all">
                      {torrent.infoHash}
                    </code>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center">
                      <Share2 className="w-5 h-5 mr-2 text-cyan-400" />
                      Magnet URI
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        copyToClipboard(torrent.magnetURI, "magnet")
                      }
                      className="glass-card border-cyan-500/20 text-cyan-300 hover:bg-cyan-500/10"
                    >
                      {copiedMagnet ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="glass-card p-4 rounded-xl border border-white/10 bg-black/20 max-h-40 overflow-y-auto">
                    <code className="text-white font-mono text-sm break-all">
                      {torrent.magnetURI}
                    </code>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 rounded-2xl border border-white/10">
                  <h4 className="text-lg font-bold text-gray-300 mb-4 flex items-center">
                    <HardDrive className="w-5 h-5 mr-2" />
                    Storage Info
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Size</span>
                      <span className="text-white font-bold">
                        {formatBytes(torrent.length || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Downloaded</span>
                      <span className="text-emerald-400 font-bold">
                        {formatBytes(torrent.downloaded || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uploaded</span>
                      <span className="text-cyan-400 font-bold">
                        {formatBytes(torrent.uploaded || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">File Count</span>
                      <span className="text-white font-bold">
                        {torrent.files?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-white/10">
                  <h4 className="text-lg font-bold text-gray-300 mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Network Status
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">External Trackers</span>
                      <span className="text-white font-bold">
                        {torrent.trackerInfo.external.active} /{" "}
                        {torrent.trackerInfo.external.total}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Internal Trackers</span>
                      <span className="text-white font-bold">
                        {torrent.trackerInfo.internal.active} /{" "}
                        {torrent.trackerInfo.internal.total}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Active</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-emerald-400 font-bold">
                          {torrent.trackerInfo.totalActive}
                        </span>
                        {torrent.boostMode && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 text-xs">
                            <Zap className="w-2 h-2 mr-1" />
                            BOOST
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Last Updated</span>
                      <span className="text-gray-300 text-sm">
                        {torrent.trackerInfo.lastUpdated.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
