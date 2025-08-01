"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { TorrentUploadProps } from "@/types";

export default function TorrentUpload({ onFileUpload }: TorrentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const torrentFile = files.find((file) => file.name.endsWith(".torrent"));

      if (torrentFile) {
        onFileUpload(torrentFile);
      }
    },
    [onFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith(".torrent")) {
        onFileUpload(file);
      }
      e.target.value = "";
    },
    [onFileUpload]
  );

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
          isDragOver
            ? "border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20"
            : "border-gray-600 hover:border-gray-500 hover:bg-gray-800/30"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload
          className={`w-6 h-6 mx-auto mb-2 transition-colors ${
            isDragOver ? "text-emerald-400" : "text-gray-400"
          }`}
        />
        <p
          className={`text-sm mb-2 transition-colors ${
            isDragOver ? "text-emerald-300" : "text-gray-300"
          }`}
        >
          Drop .torrent file here
        </p>
        <p className="text-xs text-gray-500 mb-3">or</p>

        <label htmlFor="torrent-file">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white hover:border-gray-500 transition-all duration-200"
            asChild
          >
            <span>
              <FileText className="w-4 h-4 mr-2" />
              Browse Files
            </span>
          </Button>
        </label>

        <input
          id="torrent-file"
          type="file"
          accept=".torrent"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
