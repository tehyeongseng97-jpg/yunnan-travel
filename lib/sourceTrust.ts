/**
 * Source Trust Engine
 * ------------------------------------------------------------
 * 核心原则：可信度判断不交给 LLM 临场发挥，用规则硬编码。
 */

export type TrustLevel = "official" | "trusted_ota" | "media" | "blacklisted";

export interface TrustResult {
  level: TrustLevel;
  usableAsPriceSource: boolean;
  reason: string;
}

const OFFICIAL_DOMAINS = ["gov.cn", "12306.cn", "yn.gov.cn"];
const TRUSTED_OTA_DOMAINS = [
  "piao.qunar.com",
  "qunar.com",
  "ctrip.com",
  "meituan.com",
  "fliggy.com",
  "trip.com",
];
const MEDIA_DOMAINS = [
  "you.ctrip.com",
  "bendibao.com",
  "mafengwo.cn",
  "xiaohongshu.com",
  "sina.com.cn",
  "sina.cn",
];

const BLACKLIST_SIGNALS = [
  "加微信",
  "加v",
  "留电话",
  "联系客服报价",
  "私聊报价",
  "扫码咨询",
];

const STALE_MEDIA_MONTHS = 6;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function domainMatches(domain: string, list: string[]): boolean {
  return list.some((d) => domain === d || domain.endsWith("." + d));
}

export function evaluateSource(params: {
  url: string;
  pageText?: string;
  publishedAt?: string | null;
}): TrustResult {
  const { url, pageText = "", publishedAt } = params;
  const domain = extractDomain(url);

  const hasBlacklistSignal = BLACKLIST_SIGNALS.some((s) => pageText.includes(s));
  if (hasBlacklistSignal) {
    return {
      level: "blacklisted",
      usableAsPriceSource: false,
      reason: "页面包含诱导私聊/留联系方式报价特征，视为高风险来源，已过滤。",
    };
  }

  if (domainMatches(domain, OFFICIAL_DOMAINS)) {
    return { level: "official", usableAsPriceSource: true, reason: `${domain} 为官方域名` };
  }

  if (domainMatches(domain, TRUSTED_OTA_DOMAINS) && !url.includes("/travels/") && !url.includes("you.ctrip")) {
    return { level: "trusted_ota", usableAsPriceSource: true, reason: `${domain} 为可信 OTA 票务页面` };
  }

  if (domainMatches(domain, MEDIA_DOMAINS) || url.includes("you.ctrip")) {
    const isStale = publishedAt ? monthsSince(publishedAt) > STALE_MEDIA_MONTHS : true;
    return {
      level: "media",
      usableAsPriceSource: false,
      reason: isStale
        ? "资讯/攻略类页面，无法确认时效或已超过6个月，仅作背景参考，不作为价格来源"
        : "资讯/攻略类页面，仅作背景参考，不作为价格来源",
    };
  }

  return {
    level: "media",
    usableAsPriceSource: false,
    reason: `未收录域名 ${domain}，默认不作为价格来源，需人工核实`,
  };
}

function monthsSince(isoDate: string): number {
  const d = new Date(isoDate);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

export function trustRank(level: TrustLevel): number {
  return { official: 0, trusted_ota: 1, media: 2, blacklisted: 3 }[level];
}
