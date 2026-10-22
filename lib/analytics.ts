/**
 * Analytics utility: parsing User-Agent untuk deteksi device, OS, dan bot.
 * Dijalankan di server (Route Handler) – tidak ada dependensi browser.
 */

export type ScanSource = "qr" | "nfc" | "unknown";
export type DeviceType = "mobile" | "tablet" | "desktop" | "other";
export type OsType = "ios" | "android" | "other";

// ─── Bot detection ────────────────────────────────────────────────────────────

const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /facebookexternalhit/i,
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i, /baiduspider/i,
  /yandexbot/i, /sogou/i, /exabot/i, /ia_archiver/i, /prerender/i,
  /headlesschrome/i, /phantomjs/i, /puppeteer/i,
];

export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

// ─── Device & OS parsing ──────────────────────────────────────────────────────

export function parseDeviceType(userAgent: string | null): DeviceType {
  if (!userAgent) return "other";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP)))/.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/.test(ua)) return "mobile";
  if (/windows|macintosh|linux|x11/.test(ua)) return "desktop";
  return "other";
}

export function parseOs(userAgent: string | null): OsType {
  if (!userAgent) return "other";
  const ua = userAgent.toLowerCase();
  if (/iphone|ipad|ipod|ios/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

// ─── Source parsing ───────────────────────────────────────────────────────────

export function parseScanSource(param: string | null): ScanSource {
  if (param === "qr") return "qr";
  if (param === "nfc") return "nfc";
  return "unknown";
}

// ─── Scan event payload ───────────────────────────────────────────────────────

export interface ScanEventPayload {
  link_id: string;
  source: ScanSource;
  device_type: DeviceType;
  os: OsType;
  country: string | null;
  is_bot: boolean;
}

export function buildScanPayload(
  linkId: string,
  request: Request
): ScanEventPayload {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent");
  const country =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null;

  return {
    link_id: linkId,
    source: parseScanSource(url.searchParams.get("s")),
    device_type: parseDeviceType(ua),
    os: parseOs(ua),
    country,
    is_bot: isBot(ua),
  };
}
