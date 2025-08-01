"use client";

import {
  AlertTriangle,
  Shield,
  ShieldOff,
  Zap,
  X,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-6">
      <div className="glass-card max-w-4xl w-full border border-orange-500/20 shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-orange-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-glow-warning">
                <AlertTriangle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Enable Boost Mode
                </h2>
                <p className="text-orange-300 text-lg font-medium">
                  Enhanced Performance with Security Trade-offs
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="glass-card border-gray-500/20 text-gray-400 hover:text-white hover:bg-gray-700/50 p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-8">
          {/* Warning Alert */}
          <Alert className="mb-8 glass-card border-orange-500/30 bg-orange-500/5">
            <ShieldOff className="h-6 w-6 text-orange-400" />
            <AlertDescription className="text-orange-200 text-lg leading-relaxed">
              <strong>Security Warning:</strong> Boost Mode enables unsafe HTTP
              and WS trackers alongside secure HTTPS and WSS trackers. This may
              expose your IP address and activity to unencrypted tracker
              servers.
            </AlertDescription>
          </Alert>

          {/* Tracker Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Safe Trackers */}
            <div className="glass-card p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-glow-success">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-300">
                  Safe Trackers
                </h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-emerald-400 mb-2">
                  {trackerCounts.safeCount}
                </div>
                <div className="text-emerald-200 text-sm font-medium mb-3">
                  HTTPS & WSS (Encrypted)
                </div>
                <div className="space-y-2 text-xs text-emerald-200/80">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    <span>Encrypted connections</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    <span>Privacy protected</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-2" />
                    <span>Secure by default</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Plus Icon */}
            <div className="flex items-center justify-center">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full shadow-glow">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Unsafe Trackers */}
            <div className="glass-card p-6 rounded-2xl border border-orange-500/20 bg-orange-500/5">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-glow-warning">
                  <ShieldOff className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-orange-300">
                  Unsafe Trackers
                </h3>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black text-orange-400 mb-2">
                  {trackerCounts.unsafeCount}
                </div>
                <div className="text-orange-200 text-sm font-medium mb-3">
                  HTTP & WS (Unencrypted)
                </div>
                <div className="space-y-2 text-xs text-orange-200/80">
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-2" />
                    <span>Unencrypted traffic</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-2" />
                    <span>IP exposure risk</span>
                  </div>
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-2" />
                    <span>Potential monitoring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits & Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Benefits */}
            <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl shadow-glow-secondary">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-cyan-300">
                  Boost Mode Benefits
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cyan-200 font-medium">
                      Enhanced Peer Discovery
                    </p>
                    <p className="text-cyan-200/70 text-sm">
                      Access to {trackerCounts.unsafeCount} additional tracker
                      servers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cyan-200 font-medium">
                      Faster Downloads
                    </p>
                    <p className="text-cyan-200/70 text-sm">
                      Potentially higher download speeds and better connectivity
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cyan-200 font-medium">
                      Rare Content Access
                    </p>
                    <p className="text-cyan-200/70 text-sm">
                      Better connectivity for hard-to-find torrents
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-cyan-200 font-medium">
                      Maximum Coverage
                    </p>
                    <p className="text-cyan-200/70 text-sm">
                      Total of {trackerCounts.totalCount} trackers vs{" "}
                      {trackerCounts.safeCount} safe-only
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Risks */}
            <div className="glass-card p-6 rounded-2xl border border-red-500/20 bg-red-500/5">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl shadow-glow-danger">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-red-300">
                  Security Risks
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-200 font-medium">
                      Unencrypted Communication
                    </p>
                    <p className="text-red-200/70 text-sm">
                      Data transmitted to HTTP/WS trackers is not encrypted
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-200 font-medium">
                      IP Address Exposure
                    </p>
                    <p className="text-red-200/70 text-sm">
                      Your IP may be visible to potentially malicious trackers
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-200 font-medium">
                      Activity Monitoring
                    </p>
                    <p className="text-red-200/70 text-sm">
                      Possible tracking of your torrent download activity
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-red-200 font-medium">
                      Man-in-the-Middle Attacks
                    </p>
                    <p className="text-red-200/70 text-sm">
                      Vulnerability to traffic interception and manipulation
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-gray-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm">
                Only enable if you understand and accept the risks
              </span>
            </div>

            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="glass-card border-gray-500/20 text-gray-300 hover:bg-gray-700/50 hover:text-white h-12 px-6 text-base"
              >
                Keep Safe Mode
              </Button>
              <Button
                onClick={onAccept}
                className="btn-warning h-12 px-8 text-base font-semibold"
              >
                <Zap className="w-5 h-5 mr-2" />
                Enable Boost Mode
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
