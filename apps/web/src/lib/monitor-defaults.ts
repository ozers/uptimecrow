/**
 * DALGA 2 — URL'den monitör varsayılanlarını türetme.
 *
 * Amaç: monitör formunda zorunlu alanı tek'e (URL) indirmek. Ad ve kontrol
 * tipi URL'den tahmin edilir; kullanıcı isterse düzeltir. Bu dosya saf
 * fonksiyonlardan oluşur — test edilebilir, UI bağımlılığı yok.
 */

/** İkinci seviye TLD'ler: burada "co.uk" gibi parçalar isim olmamalı. */
const MULTI_PART_TLDS = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "com.tr", "org.tr", "net.tr",
  "com.au", "com.br", "co.jp", "co.nz", "co.za", "com.mx",
]);

/** Ad olarak anlamsız olan alt alan adları. */
const IGNORED_SUBDOMAINS = new Set(["www", "app", "api", "web", "cdn", "static"]);

function titleCase(input: string): string {
  return input
    .split(/[-_.]/)
    .filter(Boolean)
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * `https://api.example.com/health` → "API Example · health"
 * `example.com`                    → "Example"
 * `db.internal:5432`               → "DB Internal"
 *
 * Kural: anlamlı alt alan adı varsa isme dahil edilir (api, www gibi
 * jenerikler atılır), kök alan adı başlığa çevrilir, yol parçası varsa
 * kısa bir nitelendirici olarak eklenir.
 */
export function deriveMonitorName(rawUrl: string): string {
  const url = rawUrl.trim();
  if (!url) return "";

  let host = url;
  let path = "";
  try {
    const parsed = new URL(url.includes("://") ? url : `https://${url}`);
    host = parsed.hostname;
    path = parsed.pathname.replace(/^\/+|\/+$/g, "");
  } catch {
    host = url.replace(/^[a-z]+:\/\//i, "").split(/[/:?#]/)[0] ?? url;
  }

  const parts = host.split(".").filter(Boolean);
  if (parts.length === 0) return titleCase(url);

  // TLD'yi (gerekirse iki parçalı) ayır
  let tldParts = 1;
  if (parts.length >= 3 && MULTI_PART_TLDS.has(parts.slice(-2).join("."))) tldParts = 2;
  const nameParts = parts.slice(0, Math.max(1, parts.length - tldParts));

  const root = nameParts[nameParts.length - 1] ?? parts[0];
  const sub = nameParts.length > 1 ? nameParts[nameParts.length - 2] : undefined;

  let name = titleCase(root);
  if (sub && !IGNORED_SUBDOMAINS.has(sub.toLowerCase())) {
    name = `${titleCase(sub)} ${name}`;
  } else if (sub && sub.toLowerCase() === "api") {
    name = `API ${name}`;
  }

  const firstSegment = path.split("/")[0];
  if (firstSegment && firstSegment.length <= 14 && !/^\d+$/.test(firstSegment)) {
    name = `${name} · ${firstSegment}`;
  }

  return name.slice(0, 60);
}

export type MonitorKind = "http" | "tcp" | "keyword";

/**
 * Şema/port'a bakarak kontrol tipini tahmin eder.
 * · `tcp://` veya `host:port` (http(s) portu değil) → tcp
 * · diğer her şey → http
 * Keyword tipi asla otomatik seçilmez: kullanıcı bir anahtar kelime yazana
 * kadar "http" doğrudur.
 */
export function deriveMonitorType(rawUrl: string): MonitorKind {
  const url = rawUrl.trim().toLowerCase();
  if (!url) return "http";
  if (url.startsWith("tcp://")) return "tcp";
  if (/^[a-z]+:\/\//.test(url)) return "http";

  const portMatch = url.match(/^[^/]+:(\d{2,5})(\/|$)/);
  if (portMatch) {
    const port = Number(portMatch[1]);
    if (port !== 80 && port !== 443 && port !== 8080 && port !== 8443) return "tcp";
  }
  return "http";
}

/** Aralık etiketini insan diline çevirir: 60 → "1 dk", 300 → "5 dk". */
export function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds} sn`;
  const minutes = seconds / 60;
  return Number.isInteger(minutes) ? `${minutes} dk` : `${seconds} sn`;
}

/** Türetilmiş üçlü — form rozetlerinde gösterilir. */
export function deriveMonitorDefaults(rawUrl: string, intervalSeconds: number) {
  return {
    name: deriveMonitorName(rawUrl),
    type: deriveMonitorType(rawUrl),
    intervalLabel: formatInterval(intervalSeconds),
  };
}
