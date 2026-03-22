const cache = new Map();

function setCache(key, value, ttlMs = 5000) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

function clearCache(key) {
  cache.delete(key);
}

module.exports = {
  setCache,
  getCache,
  clearCache
};
