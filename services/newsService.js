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

const BULLISH_KEYWORDS = [
  "surge",
  "rally",
  "jump",
  "gain",
  "soar",
  "approval",
  "approved",
  "inflow",
  "breakout",
  "adoption",
  "partnership",
  "launch",
  "bullish",
  "상승",
  "급등",
  "호재",
  "승인",
  "유입",
  "돌파",
  "채택",
  "출시"
];

const BEARISH_KEYWORDS = [
  "drop",
  "fall",
  "crash",
  "plunge",
  "hack",
  "lawsuit",
  "outflow",
  "exploit",
  "delay",
  "ban",
  "bearish",
  "하락",
  "급락",
  "악재",
  "해킹",
  "소송",
  "유출",
  "금지",
  "지연"
];

function normalizeSymbol(input) {
  if (!input) return "";
  return String(input).trim().toUpperCase();
}

function getKeywordsForSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);
  return SYMBOL_KEYWORDS[normalized] || [normalized];
}

function buildGoogleNewsRssUrl(keywords, region = "all") {
  const joined = keywords.map((k) => `"${k}"`).join(" OR ");
  const query = encodeURIComponent(joined);

  if (region === "ko") {
    return `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`;
  }

  if (region === "global") {
    return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
  }

  return [
    `https://news.google.com/rss/search?q=${query}&hl=ko&gl=KR&ceid=KR:ko`,
    `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`
  ];
}

function safeDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function detectRegionFromSource(article) {
  const source = String(article?.source || "").toLowerCase();
  const title = String(article?.title || "").toLowerCase();

  const koreanHints = [
    "조선",
    "중앙",
    "동아",
    "연합",
    "머니투데이",
    "매일경제",
    "한국경제",
    "뉴스1",
    "뉴시스",
    "파이낸셜뉴스",
    "전자신문",
    "서울경제",
    "헤럴드",
    "아시아경제",
    "coinness",
    "코인니스",
    "블록미디어",
    "디센터"
  ];

  const hasKorean = koreanHints.some(
    (hint) => source.includes(hint.toLowerCase()) || title.includes(hint.toLowerCase())
  );

  return hasKorean ? "ko" : "global";
}

function detectSentiment(text) {
  const haystack = String(text || "").toLowerCase();

  const bullishScore = BULLISH_KEYWORDS.reduce(
    (acc, keyword) => acc + (haystack.includes(String(keyword).toLowerCase()) ? 1 : 0),
    0
  );

  const bearishScore = BEARISH_KEYWORDS.reduce(
    (acc, keyword) => acc + (haystack.includes(String(keyword).toLowerCase()) ? 1 : 0),
    0
  );

  if (bullishScore > bearishScore) return "bullish";
  if (bearishScore > bullishScore) return "bearish";
  return "neutral";
}

function normalizeArticle(item, matchedSymbol) {
  const sourceTitle =
    item?.source?.title ||
    item?.creator ||
    item?.author ||
    "Unknown Source";

  const title = item?.title || "";
  const link = item?.link || "";
  const summary = item?.contentSnippet || item?.content || "";
  const publishedAt = safeDate(item?.isoDate || item?.pubDate);

  const normalized = {
    id: `${matchedSymbol}-${Buffer.from(`${title}|${link}`).toString("base64").slice(0, 24)}`,
    title,
    url: link,
    source: sourceTitle,
    publishedAt,
    matchedSymbol,
    summary
  };

  return {
    ...normalized,
    region: detectRegionFromSource(normalized),
    sentiment: detectSentiment(`${title} ${summary}`)
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

function scoreArticle(article, keywords) {
  const haystack = `${article.title} ${article.summary}`.toLowerCase();

  let score = 0;

  for (const keyword of keywords) {
    if (haystack.includes(String(keyword).toLowerCase())) {
      score += 2;
    }
  }

  if (article.sentiment === "bullish" || article.sentiment === "bearish") {
    score += 1;
  }

  if (article.publishedAt) {
    const ageMs = Date.now() - new Date(article.publishedAt).getTime();
    if (ageMs < 6 * 60 * 60 * 1000) score += 2;
    else if (ageMs < 24 * 60 * 60 * 1000) score += 1;
  }

  return score;
}

function sortByRelevance(items, keywords) {
  return [...items].sort((a, b) => {
    const aScore = scoreArticle(a, keywords);
    const bScore = scoreArticle(b, keywords);

    if (bScore !== aScore) return bScore - aScore;

    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });
}

async function fetchGoogleNewsBySymbol(symbol, region = "all") {
  const matchedSymbol = normalizeSymbol(symbol);
  const keywords = getKeywordsForSymbol(matchedSymbol);

  const built = buildGoogleNewsRssUrl(keywords, region);
  const urls = Array.isArray(built) ? built : [built];

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
      const haystack = `${normalized.title} ${normalized.summary}`.toLowerCase();

      const hasKeyword = keywords.some((keyword) =>
        haystack.includes(String(keyword).toLowerCase())
      );

      if (!hasKeyword) continue;
      if (region !== "all" && normalized.region !== region) continue;

      articles.push(normalized);
    }
  }

  return dedupeArticles(articles);
}

async function getNewsBySymbol(symbol, options = {}) {
  const matchedSymbol = normalizeSymbol(symbol);
  const limit = Math.min(Number(options.limit) || 20, 50);
  const region = options.region || "all";
  const sort = options.sort === "relevance" ? "relevance" : "latest";

  if (!matchedSymbol) {
    throw new Error("symbol is required");
  }

  const cacheKey = `${matchedSymbol}:${region}`;
  const cached = newsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const items =
      sort === "relevance"
        ? sortByRelevance(cached.data, getKeywordsForSymbol(matchedSymbol))
        : sortByNewest(cached.data);

    return {
      symbol: matchedSymbol,
      region,
      limit,
      cache: {
        hit: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
        ttlMs: CACHE_TTL_MS
      },
      data: items.slice(0, limit)
    };
  }

  const fresh = await fetchGoogleNewsBySymbol(matchedSymbol, region);
  const payload = {
    timestamp: Date.now(),
    data: fresh
  };

  newsCache.set(cacheKey, payload);

  const items =
    sort === "relevance"
      ? sortByRelevance(fresh, getKeywordsForSymbol(matchedSymbol))
      : sortByNewest(fresh);

  return {
    symbol: matchedSymbol,
    region,
    limit,
    cache: {
      hit: false,
      cachedAt: new Date(payload.timestamp).toISOString(),
      ttlMs: CACHE_TTL_MS
    },
    data: items.slice(0, limit)
  };
}

module.exports = {
  getNewsBySymbol
};
