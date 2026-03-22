const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "data", "orderly_config.json");
const orderlyConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

function getConfig() {
  return orderlyConfig;
}

function normalizeWalletAddress(address = "") {
  return String(address).trim().toLowerCase();
}

async function registerAccount({
  walletAddress,
  brokerId,
  chainId
}) {
  const config = getConfig();

  const payload = {
    brokerId: brokerId || config.brokerId,
    chainId: chainId || config.defaultChainId,
    userAddress: normalizeWalletAddress(walletAddress)
  };

  const res = await fetch(`${config.restBaseUrl}/v1/register_account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    timeout: config.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to register Orderly account");
  }

  return json;
}

async function getAccountInfo({
  accountId,
  orderlyKey,
  signature,
  timestamp
}) {
  const config = getConfig();

  const res = await fetch(`${config.restBaseUrl}/v1/client/info`, {
    method: "GET",
    headers: {
      "orderly-account-id": accountId,
      "orderly-key": orderlyKey,
      "orderly-signature": signature,
      "orderly-timestamp": String(timestamp)
    },
    timeout: config.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to fetch account info");
  }

  return json;
}

module.exports = {
  getConfig,
  normalizeWalletAddress,
  registerAccount,
  getAccountInfo
};
