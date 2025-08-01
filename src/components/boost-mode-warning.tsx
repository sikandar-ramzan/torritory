"use client";

import { AlertTriangle, Shield, ShieldOff, Zap } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface BoostModeWarningProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  trackerCounts: {
    safeCount: number;
    unsafeCount: number;
    totalCount: number;
  };
}

export default function BoostModeWarning({
  isOpen,
  onAccept,
  onCancel,
  trackerCounts,
}: BoostModeWarningProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-gray-900/95 border-orange-500/50 shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-orange-500/20">
              <AlertTriangle className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Enable Boost Mode
              </h2>
              <p className="text-orange-300 font-medium">
                Potential Security Risk - Proceed with Caution
              </p>
            </div>
          </div>

          <Alert className="mb-6 bg-orange-950/50 border-orange-500/50">
            <ShieldOff className="h-5 w-5 text-orange-400" />
            <AlertDescription className="text-orange-200 text-base">
              <strong>Warning:</strong> Boost Mode enables unsafe HTTP and WS
              trackers alongside secure HTTPS and WSS trackers. This may expose
              your IP address and activity to unencrypted tracker servers.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-600/50">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-semibold">
                  Safe Trackers
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {trackerCounts.safeCount}
              </div>
              <div className="text-sm text-gray-400">
                HTTPS & WSS (Encrypted)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-800/50 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-2">
                <ShieldOff className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-semibold">
                  Unsafe Trackers
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {trackerCounts.unsafeCount}
              </div>
              <div className="text-sm text-gray-400">
                HTTP & WS (Unencrypted)
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-blue-300 font-semibold mb-2">
                  Boost Mode Benefits:
                </h3>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>
                    • Access to {trackerCounts.unsafeCount} additional tracker
                    servers
                  </li>
                  <li>
                    • Potentially faster peer discovery and download speeds
                  </li>
                  <li>• Better connectivity for hard-to-find torrents</li>
                  <li>
                    • Total of {trackerCounts.totalCount} trackers (vs{" "}
                    {trackerCounts.safeCount} safe-only)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/30">
            <h3 className="text-red-300 font-semibold mb-2">Security Risks:</h3>
            <ul className="text-sm text-red-200 space-y-1">
              <li>• Unencrypted communication with HTTP/WS trackers</li>
              <li>• Potential IP address exposure to malicious trackers</li>
              <li>• Possible tracking of your torrent activity</li>
              <li>• Man-in-the-middle attack vulnerability</li>
            </ul>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Only enable if you understand the risks</span>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onCancel}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={onAccept}
                className="bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500"
              >
                <Zap className="w-4 h-4 mr-2" />
                Enable Boost Mode
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
