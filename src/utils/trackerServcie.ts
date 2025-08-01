/* eslint-disable @typescript-eslint/no-explicit-any */
import { TrackerUrls, TrackerCache } from "@/types";

class TrackerService {
  private static instance: TrackerService;
  private cache: TrackerCache | null = null;
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  private readonly HTTPS_ENDPOINT =
    "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_https.txt";
  private readonly WS_ENDPOINT =
    "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt";
  private readonly HTTP_ENDPOINT =
    "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_http.txt";
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  // Fallback trackers in case API fails
  private readonly FALLBACK_TRACKERS: TrackerUrls = {
    https: [
      "https://tracker.opentrackr.org:443/announce",
      "https://open.tracker.cl:443/announce",
      "https://tracker.tamersunion.org:443/announce",
      "https://opentracker.i2p.rocks:443/announce",
      "https://tracker.gbitt.info:443/announce",
      "https://1337.abcvg.info:443/announce",
      "https://explodie.org:6969/announce",
      "https://tracker.torrent.eu.org:443/announce",
      "https://tracker.moeking.me:443/announce",
      "https://tracker.srv00.com:443/announce",
    ],
    wss: [
      "wss://tracker.openwebtorrent.com",
      "wss://tracker.btorrent.xyz",
      "wss://tracker.fastcast.nz",
      "wss://tracker.webtorrent.dev",
      "wss://tracker.files.fm:7073/announce",
    ],
    http: [
      "http://tracker.opentrackr.org:1337/announce",
      "http://open.tracker.cl:1337/announce",
      "http://tracker.openbittorrent.com:80/announce",
      "http://tracker.gbitt.info:80/announce",
      "http://explodie.org:6969/announce",
    ],
    ws: [
      "ws://tracker.openwebtorrent.com",
      "ws://tracker.btorrent.xyz",
      "ws://tracker.fastcast.nz",
    ],
  };

  private constructor() {}

  public static getInstance(): TrackerService {
    if (!TrackerService.instance) {
      TrackerService.instance = new TrackerService();
    }
    return TrackerService.instance;
  }

  /**
   * Validate magnet URL format
   */
  public validateMagnetUrl(magnetUrl: string): boolean {
    const MAGNET_URL_REGEX = /^magnet:\?xt=urn:btih:[a-fA-F0-9]{32,40}.*$/;
    return MAGNET_URL_REGEX.test(magnetUrl.trim());
  }

  /**
   * Fetch trackers with timeout and error handling
   */
  private async fetchWithTimeout(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.REQUEST_TIMEOUT
    );

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "text/plain",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      return text;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout for ${url}`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse tracker list from text response
   */
  private parseTrackerList(text: string): string[] {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("://"))
      .filter((tracker, index, arr) => arr.indexOf(tracker) === index); // Remove duplicates
  }

  /**
   * Filter trackers by protocol
   */
  private filterTrackersByProtocol(
    trackers: string[],
    protocols: string[]
  ): string[] {
    return trackers.filter((tracker) =>
      protocols.some((protocol) => tracker.startsWith(protocol + "://"))
    );
  }

  /**
   * Validate tracker URL format
   */
  private isValidTracker(tracker: string): boolean {
    try {
      const url = new URL(tracker);
      return ["http:", "https:", "ws:", "wss:"].includes(url.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Remove duplicate trackers across different arrays
   */
  private removeDuplicateTrackers(trackerUrls: TrackerUrls): TrackerUrls {
    const allTrackers = new Set<string>();

    const filterUnique = (trackers: string[]): string[] => {
      return trackers.filter((tracker) => {
        if (allTrackers.has(tracker)) {
          return false;
        }
        allTrackers.add(tracker);
        return true;
      });
    };

    return {
      https: filterUnique(trackerUrls.https),
      wss: filterUnique(trackerUrls.wss),
      http: filterUnique(trackerUrls.http || []),
      ws: filterUnique(trackerUrls.ws || []),
    };
  }

  /**
   * Fetch safe trackers only (HTTPS + WSS)
   */
  private async fetchSafeTrackers(): Promise<TrackerUrls> {
    const results = await Promise.allSettled([
      this.fetchWithTimeout(this.HTTPS_ENDPOINT),
      this.fetchWithTimeout(this.WS_ENDPOINT),
    ]);

    const httpsResult = results[0];
    const wsResult = results[1];

    let httpsTrackers: string[] = [];
    let wssTrackers: string[] = [];

    // Process HTTPS trackers
    if (httpsResult.status === "fulfilled") {
      httpsTrackers = this.parseTrackerList(httpsResult.value)
        .filter((tracker) => tracker.startsWith("https://"))
        .filter(this.isValidTracker);
      console.log(`Fetched ${httpsTrackers.length} HTTPS trackers`);
    } else {
      console.warn("Failed to fetch HTTPS trackers:", httpsResult.reason);
    }

    // Process WSS trackers
    if (wsResult.status === "fulfilled") {
      const allWsTrackers = this.parseTrackerList(wsResult.value);
      wssTrackers = this.filterTrackersByProtocol(allWsTrackers, [
        "wss",
      ]).filter(this.isValidTracker);
      console.log(
        `Fetched ${wssTrackers.length} WSS trackers from ${allWsTrackers.length} WS trackers`
      );
    } else {
      console.warn("Failed to fetch WS trackers:", wsResult.reason);
    }

    // Use fallbacks if no trackers were fetched
    if (httpsTrackers.length === 0) {
      console.log("Using fallback HTTPS trackers");
      httpsTrackers = this.FALLBACK_TRACKERS.https;
    }

    if (wssTrackers.length === 0) {
      console.log("Using fallback WSS trackers");
      wssTrackers = this.FALLBACK_TRACKERS.wss;
    }

    return {
      https: httpsTrackers,
      wss: wssTrackers,
      http: [],
      ws: [],
    };
  }

  /**
   * Fetch all trackers including unsafe ones (HTTP + WS)
   */
  private async fetchAllTrackers(): Promise<TrackerUrls> {
    const results = await Promise.allSettled([
      this.fetchWithTimeout(this.HTTPS_ENDPOINT),
      this.fetchWithTimeout(this.WS_ENDPOINT),
      this.fetchWithTimeout(this.HTTP_ENDPOINT),
    ]);

    const httpsResult = results[0];
    const wsResult = results[1];
    const httpResult = results[2];

    let httpsTrackers: string[] = [];
    let wssTrackers: string[] = [];
    let httpTrackers: string[] = [];
    let wsTrackers: string[] = [];

    // Process HTTPS trackers
    if (httpsResult.status === "fulfilled") {
      httpsTrackers = this.parseTrackerList(httpsResult.value)
        .filter((tracker) => tracker.startsWith("https://"))
        .filter(this.isValidTracker);
      console.log(`Fetched ${httpsTrackers.length} HTTPS trackers`);
    } else {
      console.warn("Failed to fetch HTTPS trackers:", httpsResult.reason);
      httpsTrackers = this.FALLBACK_TRACKERS.https;
    }

    // Process WebSocket trackers (both WSS and WS)
    if (wsResult.status === "fulfilled") {
      const allWsTrackers = this.parseTrackerList(wsResult.value);
      wssTrackers = this.filterTrackersByProtocol(allWsTrackers, [
        "wss",
      ]).filter(this.isValidTracker);
      wsTrackers = this.filterTrackersByProtocol(allWsTrackers, ["ws"])
        .filter((tracker) => !tracker.startsWith("wss://")) // Exclude WSS from WS
        .filter(this.isValidTracker);

      console.log(
        `Fetched ${wssTrackers.length} WSS and ${wsTrackers.length} WS trackers from ${allWsTrackers.length} total WS trackers`
      );
    } else {
      console.warn("Failed to fetch WS trackers:", wsResult.reason);
      wssTrackers = this.FALLBACK_TRACKERS.wss;
      wsTrackers = this.FALLBACK_TRACKERS.ws || [];
    }

    // Process HTTP trackers
    if (httpResult.status === "fulfilled") {
      httpTrackers = this.parseTrackerList(httpResult.value)
        .filter((tracker) => tracker.startsWith("http://"))
        .filter(this.isValidTracker);
      console.log(`Fetched ${httpTrackers.length} HTTP trackers`);
    } else {
      console.warn("Failed to fetch HTTP trackers:", httpResult.reason);
      httpTrackers = this.FALLBACK_TRACKERS.http || [];
    }

    const trackerUrls = {
      https: httpsTrackers,
      wss: wssTrackers,
      http: httpTrackers,
      ws: wsTrackers,
    };

    // Remove duplicates across all tracker types
    return this.removeDuplicateTrackers(trackerUrls);
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.lastFetched < this.cache.ttl;
  }

  /**
   * Get safe trackers only (from cache or fetch new ones)
   */
  public async getTrackers(): Promise<TrackerUrls> {
    if (this.isCacheValid() && this.cache) {
      console.log("Using cached safe trackers");
      return this.cache.trackers;
    }

    try {
      console.log("Fetching fresh safe trackers...");
      const trackers = await this.fetchSafeTrackers();

      // Update cache
      this.cache = {
        trackers,
        lastFetched: Date.now(),
        ttl: this.CACHE_TTL,
      };

      console.log(
        `Successfully cached ${trackers.https.length} HTTPS and ${trackers.wss.length} WSS trackers`
      );
      return trackers;
    } catch (error) {
      console.error("Failed to fetch safe trackers, using fallbacks:", error);
      const fallbackTrackers = {
        https: this.FALLBACK_TRACKERS.https,
        wss: this.FALLBACK_TRACKERS.wss,
        http: [],
        ws: [],
      };

      // Cache fallback with shorter TTL
      this.cache = {
        trackers: fallbackTrackers,
        lastFetched: Date.now(),
        ttl: 30 * 60 * 1000, // 30 minutes for fallback
      };

      return fallbackTrackers;
    }
  }

  /**
   * Get all trackers including unsafe ones (always fetches fresh data)
   */
  public async getAllTrackersIncludingUnsafe(): Promise<TrackerUrls> {
    try {
      console.log("Fetching all trackers including unsafe ones...");
      const trackers = await this.fetchAllTrackers();

      console.log(
        `Successfully fetched ${trackers.https.length} HTTPS, ${
          trackers.wss.length
        } WSS, ${trackers.http?.length || 0} HTTP, and ${
          trackers.ws?.length || 0
        } WS trackers`
      );

      return trackers;
    } catch (error) {
      console.error("Failed to fetch all trackers, using fallbacks:", error);
      return this.removeDuplicateTrackers({
        https: this.FALLBACK_TRACKERS.https,
        wss: this.FALLBACK_TRACKERS.wss,
        http: this.FALLBACK_TRACKERS.http || [],
        ws: this.FALLBACK_TRACKERS.ws || [],
      });
    }
  }

  /**
   * Get safe trackers as a flat array (for WebTorrent)
   */
  public async getSafeTrackers(): Promise<string[]> {
    const trackers = await this.getTrackers();
    return [...trackers.wss, ...trackers.https];
  }

  /**
   * Get all trackers as a flat array including unsafe ones
   */
  public async getAllTrackersFlat(
    includeUnsafe: boolean = false
  ): Promise<string[]> {
    if (includeUnsafe) {
      const trackers = await this.getAllTrackersIncludingUnsafe();
      return [
        ...trackers.wss,
        ...trackers.https,
        ...(trackers.ws || []),
        ...(trackers.http || []),
      ];
    } else {
      return this.getSafeTrackers();
    }
  }

  /**
   * Append trackers to a magnet URL
   */
  public async appendTrackersToMagnet(
    magnetUrl: string,
    includeUnsafe: boolean = false
  ): Promise<string> {
    try {
      // Validate magnet URL first
      if (!this.validateMagnetUrl(magnetUrl)) {
        throw new Error("Invalid magnet URL format");
      }

      const trackers = await this.getAllTrackersFlat(includeUnsafe);

      if (trackers.length === 0) {
        console.warn("No trackers available to append");
        return magnetUrl;
      }

      // Extract existing trackers from magnet URL to avoid duplicates
      const existingTrackers = new Set<string>();
      const magnetParams = new URLSearchParams(magnetUrl.split("?")[1] || "");

      for (const [key, value] of magnetParams.entries()) {
        if (key === "tr") {
          existingTrackers.add(decodeURIComponent(value));
        }
      }

      // Filter out duplicate trackers
      const newTrackers = trackers.filter(
        (tracker) => !existingTrackers.has(tracker)
      );

      if (newTrackers.length === 0) {
        console.log(
          "No new trackers to add - all trackers already present in magnet URL"
        );
        return magnetUrl;
      }

      // Create tracker parameters
      const trackerParams = newTrackers
        .map((tracker) => `tr=${encodeURIComponent(tracker)}`)
        .join("&");

      // Append trackers to magnet URL
      const separator = magnetUrl.includes("&") ? "&" : "&";
      const enhancedMagnet = `${magnetUrl}${separator}${trackerParams}`;

      console.log(
        `Appended ${newTrackers.length} new trackers to magnet URL (${
          includeUnsafe ? "including unsafe" : "safe only"
        })`
      );
      return enhancedMagnet;
    } catch (error) {
      console.error("Failed to append trackers to magnet URL:", error);
      return magnetUrl; // Return original URL if enhancement fails
    }
  }

  /**
   * Add trackers to existing torrent (dynamic injection)
   * Note: WebTorrent has limited support for this, effectiveness may vary
   */
  public async addTrackersToTorrent(
    torrent: any,
    includeUnsafe: boolean = false
  ): Promise<number> {
    try {
      const allTrackers = await this.getAllTrackersFlat(includeUnsafe);

      if (!torrent || !torrent.announce) {
        console.warn("Invalid torrent object or no announce property");
        return 0;
      }

      const existingTrackers = new Set(torrent.announce);
      const newTrackers = allTrackers.filter(
        (tracker) => !existingTrackers.has(tracker)
      );

      if (newTrackers.length === 0) {
        console.log("No new trackers to add to existing torrent");
        return 0;
      }

      // Add new trackers to the torrent's announce list
      torrent.announce.push(...newTrackers);

      // Force tracker discovery (if supported by WebTorrent version)
      if (typeof torrent.discovery === "object" && torrent.discovery.tracker) {
        try {
          // Restart tracker discovery with new trackers
          torrent.discovery.tracker.stop();
          torrent.discovery.tracker.start();
        } catch (error) {
          console.warn("Could not restart tracker discovery:", error);
        }
      }

      console.log(
        `Dynamically added ${newTrackers.length} trackers to torrent: ${
          torrent.name
        } (${includeUnsafe ? "including unsafe" : "safe only"})`
      );

      return newTrackers.length;
    } catch (error) {
      console.error("Failed to add trackers to existing torrent:", error);
      return 0;
    }
  }

  /**
   * Get tracker statistics
   */
  public getStats(): {
    cached: boolean;
    lastFetched: Date | null;
    httpsCount: number;
    wssCount: number;
    httpCount: number;
    wsCount: number;
    totalCount: number;
    safeCount: number;
    unsafeCount: number;
  } {
    if (!this.cache) {
      return {
        cached: false,
        lastFetched: null,
        httpsCount: 0,
        wssCount: 0,
        httpCount: 0,
        wsCount: 0,
        totalCount: 0,
        safeCount: 0,
        unsafeCount: 0,
      };
    }

    const httpsCount = this.cache.trackers.https.length;
    const wssCount = this.cache.trackers.wss.length;
    const httpCount = this.cache.trackers.http?.length || 0;
    const wsCount = this.cache.trackers.ws?.length || 0;
    const safeCount = httpsCount + wssCount;
    const unsafeCount = httpCount + wsCount;

    return {
      cached: this.isCacheValid(),
      lastFetched: new Date(this.cache.lastFetched),
      httpsCount,
      wssCount,
      httpCount,
      wsCount,
      totalCount: safeCount + unsafeCount,
      safeCount,
      unsafeCount,
    };
  }

  /**
   * Force refresh trackers
   */
  public async refreshTrackers(): Promise<TrackerUrls> {
    this.cache = null; // Clear cache to force refresh
    return this.getTrackers();
  }
}

export default TrackerService;
