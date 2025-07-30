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
  Play,
  Users,
  Clock,
  FileVideo,
  FileAudio,
  FileImage,
  FileText,
  File,
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

interface TorrentDetailsProps {
  torrent: TorrentInfo;
  onPlayFile: (file: TorrentFile) => void;
  onDownloadFile: (file: TorrentFile) => void;
  formatBytes: (bytes: number) => string;
  formatTime: (seconds: number) => string;
}

export default function TorrentDetails({
  torrent,
  onPlayFile,
  onDownloadFile,
  formatBytes,
  formatTime,
}: TorrentDetailsProps) {
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

  return (
    <Card className="p-6 bg-gray-800/50 border-gray-700">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">{torrent.name}</h2>
          <div className="flex gap-2 items-center">
            <Badge variant={torrent.done ? "default" : "secondary"}>
              {torrent.done ? "Complete" : "Downloading"}
            </Badge>
            {torrent.done && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (torrent.webTorrentInstance) {
                    torrent.files.forEach((file) => {
                      if (file.webTorrentFile) {
                        onDownloadFile(file);
                      }
                    });
                  }
                }}
                className="text-green-400 border-green-400 hover:bg-green-400/10"
              >
                <Download className="w-4 h-4 mr-1" />
                Download All
              </Button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress: {Math.round((torrent.progress || 0) * 100)}%</span>
            <span>
              {formatBytes(torrent.downloaded || 0)} /{" "}
              {formatBytes(torrent.length || 0)}
            </span>
          </div>
          <Progress value={(torrent.progress || 0) * 100} className="h-2" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Download className="w-4 h-4 text-green-400" />
            <div>
              <div className="text-white font-medium">
                {formatBytes(torrent.downloadSpeed || 0)}/s
              </div>
              <div className="text-gray-400">Download</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4 text-blue-400" />
            <div>
              <div className="text-white font-medium">
                {formatBytes(torrent.uploadSpeed || 0)}/s
              </div>
              <div className="text-gray-400">Upload</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-purple-400" />
            <div>
              <div className="text-white font-medium">
                {torrent.numPeers || 0}
              </div>
              <div className="text-gray-400">Peers</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-white font-medium">
                {formatTime(torrent.timeRemaining || 0)}
              </div>
              <div className="text-gray-400">Remaining</div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-700/50">
          <TabsTrigger value="files">
            Files ({torrent.files?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-4">
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {(torrent.files || []).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={getFileTypeColor(file.type)}>
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium truncate">
                        {file.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatBytes(file.length || 0)} •{" "}
                        {Math.round((file.progress || 0) * 100)}%
                      </div>
                      <Progress
                        value={(file.progress || 0) * 100}
                        className="h-1 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 ml-2">
                    {["video", "audio"].includes(file.type) &&
                      (file.progress || 0) > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPlayFile(file)}
                          className="text-blue-400 border-blue-400 hover:bg-blue-400/10"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Play
                        </Button>
                      )}

                    {(file.progress || 0) > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadFile(file)}
                        className="text-green-400 border-green-400 hover:bg-green-400/10"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-400">
                Info Hash
              </label>
              <div className="text-white font-mono text-sm bg-gray-700/50 p-2 rounded mt-1">
                {torrent.infoHash}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400">
                Magnet URI
              </label>
              <div className="text-white font-mono text-sm bg-gray-700/50 p-2 rounded mt-1 break-all">
                {torrent.magnetURI}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-400">
                  Total Size
                </label>
                <div className="text-white font-medium">
                  {formatBytes(torrent.length || 0)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  Files
                </label>
                <div className="text-white font-medium">
                  {torrent.files?.length || 0}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  Downloaded
                </label>
                <div className="text-white font-medium">
                  {formatBytes(torrent.downloaded || 0)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">
                  Uploaded
                </label>
                <div className="text-white font-medium">
                  {formatBytes(torrent.uploaded || 0)}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
