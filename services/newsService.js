// services/newsService.js

const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; SolFortNewsBot/1.0)"
  }
});

const CACHE_TTL_MS = 60 * 1000;
const newsCache = new Map();

const SYMBOL_KEYWORDS = {
  BTC: ["BTC", "Bitcoin", "비트코인"],
  ETH: ["ETH", "Ethereum", "Ether", "이더리움"],
  SOL: ["SOL", "Solana", "솔라나"],
  XRP: ["XRP", "Ripple", "리플"],
  RWA: ["RWA", "real world asset", "real-world asset", "실물자산", "토큰화"]
};

function normalizeSymbol(input) {
  if (!input) return "";
  return String(input).trim().toUpperCase();
}

function getKeywordsForSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);
  return SYMBOL_KEYWORDS[normalized] || [normalized];
}

function buildGoogleNewsRssUrl(keywords, locale = "en") {
  const joined = keywords.map((k) => `"${k}"`).join(" OR ");
  const query = encodeURIComponent(joined);

  if (locale === "ko") {
    return `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
  }

  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeArticle(item, matchedSymbol) {
  const sourceTitle =
    item?.source?.title ||
    item?.creator ||
    item?.author ||
    "Unknown Source";

  const title = item?.title || "";
  const link = item?.link || "";
  const publishedAt = safeDate(item?.isoDate || item?.pubDate);

  return {
    id: `${matchedSymbol}-${Buffer.from(`${title}|${link}`).toString("base64").slice(0, 24)}`,
    title,
    url: link,
    source: sourceTitle,
    publishedAt,
    matchedSymbol,
    summary: item?.contentSnippet || item?.content || ""
  };
}

function dedupeArticles(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const key = `${(item.title || "").trim().toLowerCase()}|${(item.url || "").trim()}`;
    if (!item.title || !item.url) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function sortByNewest(items) {
  return [...items].sort((a, b) => {
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function fetchGoogleNewsBySymbol(symbol) {
  const matchedSymbol = normalizeSymbol(symbol);
  const keywords = getKeywordsForSymbol(matchedSymbol);

  const urls = [
    buildGoogleNewsRssUrl(keywords, "en"),
    buildGoogleNewsRssUrl(keywords, "ko")
  ];

  const feedResults = await Promise.allSettled(
    urls.map((url) => parser.parseURL(url))
  );

  const articles = [];

  for (const result of feedResults) {
    if (result.status !== "fulfilled") continue;

    const feed = result.value;
    const feedItems = Array.isArray(feed?.items) ? feed.items : [];

    for (const item of feedItems) {
      const normalized = normalizeArticle(item, matchedSymbol);

      // 종목 키워드가 제목/요약에 실제로 있는지 한 번 더 체크
      const haystack = `${normalized.title} ${normalized.summary}`.toLowerCase();
      const hasKeyword = keywords.some((keyword) =>
        haystack.includes(String(keyword).toLowerCase())
      );

      if (hasKeyword) {
        articles.push(normalized);
      }
    }
  }

  return sortByNewest(dedupeArticles(articles));
}

async function getNewsBySymbol(symbol, limit = 20) {
  const matchedSymbol = normalizeSymbol(symbol);
  if (!matchedSymbol) {
    throw new Error("symbol is required");
  }

  const cacheKey = matchedSymbol;
  const cached = newsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data.slice(0, limit);
  }

  const fresh = await fetchGoogleNewsBySymbol(matchedSymbol);

  newsCache.set(cacheKey, {
    timestamp: Date.now(),
    data: fresh
  });

  return fresh.slice(0, limit);
}

module.exports = {
  getNewsBySymbol
};
