/**
 * DALGA 3 — hazır incident güncelleme metinleri.
 *
 * Kesinti anında en pahalı iş yazı yazmaktır: kullanıcı hem sorunu çözmeye
 * hem müşteriye ne diyeceğini düşünmeye çalışır. Üç şablon 30 saniyelik işi
 * 3 saniyeye indirir.
 *
 * Ton kuralları (Patterns bölümündeki kopya sözlüğüyle aynı):
 *  · Suçlama yok, mazeret yok. Ne biliyoruz, ne yapıyoruz, ne zaman tekrar
 *    yazacağız.
 *  · Teknik iç detay yok ("Redis bağlantı havuzu tükendi" → "bir altyapı
 *    sorunu").
 *  · Söz verilen zaman aralığı her zaman geçmez — "within 30 minutes" yerine
 *    "as soon as we know more".
 *  · Servis adı otomatik doldurulur; kullanıcı yalnızca gerekiyorsa düzeltir.
 */
export type IncidentUpdateStatus = "investigating" | "identified" | "monitoring" | "resolved";

export interface UpdateTemplate {
  id: string;
  /** Butonda görünen kısa etiket. */
  label: string;
  /** Şablonun ima ettiği durum — seçilince Status alanı da güncellenir. */
  status: IncidentUpdateStatus;
  /** `{service}` yer tutucusu servis adıyla değiştirilir. */
  body: string;
}

export const UPDATE_TEMPLATES: UpdateTemplate[] = [
  {
    id: "investigating",
    label: "Investigating",
    status: "investigating",
    body:
      "We're aware of an issue affecting {service} and are investigating. " +
      "We'll post an update as soon as we know more.",
  },
  {
    id: "identified",
    label: "Cause found",
    status: "identified",
    body:
      "We've identified the cause of the issue affecting {service} and are working on a fix. " +
      "We'll update this page when the fix is deployed.",
  },
  {
    id: "monitoring",
    label: "Fix deployed",
    status: "monitoring",
    body:
      "A fix has been deployed and {service} is responding normally again. " +
      "We're monitoring closely before we mark this as resolved.",
  },
  {
    id: "resolved",
    label: "Resolved",
    status: "resolved",
    body:
      "{service} has been operating normally for the last few minutes and this incident is now resolved. " +
      "Thanks for your patience.",
  },
];

/** `{service}` yer tutucusunu doldurur. Servis adı yoksa nötr ifade kullanır. */
export function fillTemplate(template: UpdateTemplate, serviceName?: string | null): string {
  return template.body.replace(/\{service\}/g, serviceName?.trim() || "this service");
}

/**
 * Otomatik çözüm teklifi kuralı — W2 akışındaki en yüksek etkili öneri.
 *
 * Servis şu kadar süredir kesintisiz UP ise incident'ı kapatmayı teklif et.
 * Karar hâlâ insanın: UI "Auto-resolve in 45m" sayacı gösterir ve kullanıcı
 * iptal edebilir. Bu fonksiyon yalnızca teklifin görünüp görünmeyeceğini ve
 * kalan süreyi hesaplar.
 */
export const AUTO_RESOLVE_AFTER_UP_MS = 15 * 60 * 1000; // 15 dk stabil UP
export const AUTO_RESOLVE_GRACE_MS = 45 * 60 * 1000; // sayaç süresi

export function autoResolveState(params: {
  /** Monitörün UP'a döndüğü an (ISO) — hâlâ down ise null. */
  recoveredAt: string | null | undefined;
  /** Şu an (test edilebilirlik için enjekte edilebilir). */
  now?: number;
}): { suggest: boolean; msRemaining: number } {
  const { recoveredAt, now = Date.now() } = params;
  if (!recoveredAt) return { suggest: false, msRemaining: 0 };
  const upFor = now - new Date(recoveredAt).getTime();
  if (upFor < AUTO_RESOLVE_AFTER_UP_MS) return { suggest: false, msRemaining: 0 };
  const remaining = AUTO_RESOLVE_AFTER_UP_MS + AUTO_RESOLVE_GRACE_MS - upFor;
  return { suggest: remaining > 0, msRemaining: Math.max(0, remaining) };
}

/** 2_700_000 → "45m", 90_000 → "1m 30s" */
export function formatCountdown(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 10) return `${m}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
