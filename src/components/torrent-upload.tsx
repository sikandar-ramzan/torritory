"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Plus, File } from "lucide-react";
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
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 group ${
          isDragOver
            ? "border-purple-500 bg-purple-500/10 shadow-glow transform scale-105"
            : "border-white/20 hover:border-purple-500/50 hover:bg-purple-500/5"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Content */}
        <div className="relative z-10">
          <div
            className={`w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragOver
                ? "bg-gradient-to-r from-purple-500 to-purple-600 shadow-glow animate-pulse"
                : "bg-gradient-to-r from-gray-600 to-gray-700 group-hover:from-purple-500 group-hover:to-purple-600"
            }`}
          >
            <Upload
              className={`w-8 h-8 transition-all duration-300 ${
                isDragOver
                  ? "text-white animate-bounce"
                  : "text-gray-300 group-hover:text-white"
              }`}
            />
          </div>

          <div className="mb-6">
            <h3
              className={`text-xl font-bold mb-2 transition-colors duration-300 ${
                isDragOver ? "text-purple-300" : "text-white"
              }`}
            >
              Drop Torrent File Here
            </h3>
            <p
              className={`text-sm transition-colors duration-300 ${
                isDragOver ? "text-purple-200" : "text-gray-400"
              }`}
            >
              Upload your .torrent file to start downloading
            </p>
          </div>

          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1" />
            <span className="text-gray-500 text-sm font-medium px-3">or</span>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent flex-1" />
          </div>

          <label htmlFor="torrent-file" className="block">
            <Button
              variant="outline"
              size="lg"
              className="glass-card border-purple-500/20 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 hover:border-purple-500/40 transition-all duration-300 h-12 px-6 cursor-pointer"
              asChild
            >
              <span className="flex items-center">
                <Plus className="w-5 h-5 mr-2" />
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

          <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <File className="w-3 h-3" />
            <span>Supports .torrent files only</span>
          </div>
        </div>

        {/* Glow Effect */}
        {isDragOver && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 blur-xl animate-pulse" />
        )}
      </div>
    </div>
  );
}
