const crypto = require("crypto");

/**
 * NOTE:
 * This is a placeholder signing helper.
 * Replace the signing details with the exact Orderly signing rules you adopt.
 */

function getTimestamp() {
  return Date.now();
}

function buildSignaturePayload({
  timestamp,
  method,
  path,
  body = ""
}) {
  return ${timestamp}${method.toUpperCase()}${path}${body};
}

function signWithSecret({
  secret,
  payload
}) {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}

function createOrderlyHeaders({
  accountId,
  orderlyKey,
  orderlySecret,
  method,
  path,
  body = ""
}) {
  const timestamp = getTimestamp();
  const payload = buildSignaturePayload({
    timestamp,
    method,
    path,
    body
  });

  const signature = signWithSecret({
    secret: orderlySecret,
    payload
  });

  return {
    "Content-Type": "application/json",
    "orderly-account-id": accountId,
    "orderly-key": orderlyKey,
    "orderly-signature": signature,
    "orderly-timestamp": String(timestamp)
  };
}

module.exports = {
  getTimestamp,
  buildSignaturePayload,
  signWithSecret,
  createOrderlyHeaders
};
