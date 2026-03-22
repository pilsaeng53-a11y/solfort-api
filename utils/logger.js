function logInfo(scope, message, meta = {}) {
  console.log(`[INFO] [${scope}] ${message}`, meta);
}

function logWarn(scope, message, meta = {}) {
  console.warn(`[WARN] [${scope}] ${message}`, meta);
}

function logError(scope, message, meta = {}) {
  console.error(`[ERROR] [${scope}] ${message}`, meta);
}

module.exports = {
  logInfo,
  logWarn,
  logError
};
