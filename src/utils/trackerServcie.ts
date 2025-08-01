import { TrackerUrls, TrackerCache } from "@/types";

class TrackerService {
  private static instance: TrackerService;
  private cache: TrackerCache | null = null;
  private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
  private readonly HTTPS_ENDPOINT =
    "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_https.txt";
  private readonly WS_ENDPOINT =
    "https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ws.txt";
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
  };

  private constructor() {}

  public static getInstance(): TrackerService {
    if (!TrackerService.instance) {
      TrackerService.instance = new TrackerService();
    }
    return TrackerService.instance;
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
   * Filter WSS trackers from WS tracker list
   */
  private filterWssTrackers(trackers: string[]): string[] {
    return trackers.filter((tracker) => tracker.startsWith("wss://"));
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
   * Fetch trackers from both endpoints
   */
  private async fetchTrackers(): Promise<TrackerUrls> {
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
      wssTrackers = this.filterWssTrackers(allWsTrackers).filter(
        this.isValidTracker
      );
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
    };
  }

  /**
   * Check if cache is valid
   */
  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.lastFetched < this.cache.ttl;
  }

  /**
   * Get trackers (from cache or fetch new ones)
   */
  public async getTrackers(): Promise<TrackerUrls> {
    if (this.isCacheValid() && this.cache) {
      console.log("Using cached trackers");
      return this.cache.trackers;
    }

    try {
      console.log("Fetching fresh trackers...");
      const trackers = await this.fetchTrackers();

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
      console.error("Failed to fetch trackers, using fallbacks:", error);

      // Return fallback trackers if fetch fails
      const fallbackTrackers = this.FALLBACK_TRACKERS;

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
   * Get all trackers as a flat array (for WebTorrent)
   */
  public async getAllTrackers(): Promise<string[]> {
    const trackers = await this.getTrackers();
    return [...trackers.wss, ...trackers.https];
  }

  /**
   * Append trackers to a magnet URL
   */
  public async appendTrackersToMagnet(magnetUrl: string): Promise<string> {
    try {
      const trackers = await this.getAllTrackers();

      if (trackers.length === 0) {
        console.warn("No trackers available to append");
        return magnetUrl;
      }

      // Create tracker parameters
      const trackerParams = trackers
        .map((tracker) => `tr=${encodeURIComponent(tracker)}`)
        .join("&");

      // Append trackers to magnet URL
      const separator = magnetUrl.includes("&") ? "&" : "&";
      const enhancedMagnet = `${magnetUrl}${separator}${trackerParams}`;

      console.log(`Appended ${trackers.length} trackers to magnet URL`);
      return enhancedMagnet;
    } catch (error) {
      console.error("Failed to append trackers to magnet URL:", error);
      return magnetUrl; // Return original URL if enhancement fails
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
    totalCount: number;
  } {
    if (!this.cache) {
      return {
        cached: false,
        lastFetched: null,
        httpsCount: 0,
        wssCount: 0,
        totalCount: 0,
      };
    }

    return {
      cached: this.isCacheValid(),
      lastFetched: new Date(this.cache.lastFetched),
      httpsCount: this.cache.trackers.https.length,
      wssCount: this.cache.trackers.wss.length,
      totalCount:
        this.cache.trackers.https.length + this.cache.trackers.wss.length,
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
