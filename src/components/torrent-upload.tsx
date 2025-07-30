"use client";

import type React from "react";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

interface TorrentUploadProps {
  onFileUpload: (file: File) => void;
}

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
      e.target.value = ""; // Reset input
    },
    [onFileUpload]
  );

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-400 mb-2">
          Drag & drop a .torrent file here
        </p>
        <p className="text-xs text-gray-500 mb-4">or</p>

        <label htmlFor="torrent-file">
          <Button
            variant="outline"
            className="cursor-pointer bg-transparent"
            asChild
          >
            <span className="text-amber-100">
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
