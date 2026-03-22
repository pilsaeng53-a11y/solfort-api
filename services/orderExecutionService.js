const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const { createOrderlyHeaders } = require("./orderlyAuthService");

const configPath = path.join(__dirname, "..", "data", "orderly_config.json");
const orderlyConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

function getRestBaseUrl() {
  return orderlyConfig.restBaseUrl;
}

async function createOrder({
  accountId,
  orderlyKey,
  orderlySecret,
  order
}) {
  const pathName = "/v1/order";
  const body = JSON.stringify(order);

  const headers = createOrderlyHeaders({
    accountId,
    orderlyKey,
    orderlySecret,
    method: "POST",
    path: pathName,
    body
  });

  const res = await fetch(`${getRestBaseUrl()}${pathName}`, {
    method: "POST",
    headers,
    body,
    timeout: orderlyConfig.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to create order");
  }

  return json;
}

async function cancelOrder({
  accountId,
  orderlyKey,
  orderlySecret,
  orderId
}) {
  const pathName = /v1/order?order_id=${encodeURIComponent(orderId)};

  const headers = createOrderlyHeaders({
    accountId,
    orderlyKey,
    orderlySecret,
    method: "DELETE",
    path: pathName,
    body: ""
  });

  const res = await fetch(`${getRestBaseUrl()}${pathName}`, {
    method: "DELETE",
    headers,
    timeout: orderlyConfig.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to cancel order");
  }

  return json;
}

async function getPositions({
  accountId,
  orderlyKey,
  orderlySecret
}) {
  const pathName = "/v1/positions";

  const headers = createOrderlyHeaders({
    accountId,
    orderlyKey,
    orderlySecret,
    method: "GET",
    path: pathName,
    body: ""
  });

  const res = await fetch(`${getRestBaseUrl()}${pathName}`, {
    method: "GET",
    headers,
    timeout: orderlyConfig.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to get positions");
  }

  return json;
}

async function getOpenOrders({
  accountId,
  orderlyKey,
  orderlySecret
}) {
  const pathName = "/v1/orders";

  const headers = createOrderlyHeaders({
    accountId,
    orderlyKey,
    orderlySecret,
    method: "GET",
    path: pathName,
    body: ""
  });

  const res = await fetch(`${getRestBaseUrl()}${pathName}`, {
    method: "GET",
    headers,
    timeout: orderlyConfig.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to get open orders");
  }

  return json;
}

async function getBalances({
  accountId,
  orderlyKey,
  orderlySecret
}) {
  const pathName = "/v1/client/holding";

  const headers = createOrderlyHeaders({
    accountId,
    orderlyKey,
    orderlySecret,
    method: "GET",
    path: pathName,
    body: ""
  });

  const res = await fetch(`${getRestBaseUrl()}${pathName}`, {
    method: "GET",
    headers,
    timeout: orderlyConfig.requestTimeoutMs
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.message || "Failed to get balances");
  }

  return json;
}

module.exports = {
  createOrder,
  cancelOrder,
  getPositions,
  getOpenOrders,
  getBalances
};
