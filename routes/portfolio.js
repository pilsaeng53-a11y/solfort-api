const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "data", "orderly_config.json");
const orderlyConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

function getRestBaseUrl() {
  return orderlyConfig.restBaseUrl;
}

async function createOrder() {
  return {
    ok: true,
    message: "createOrder placeholder",
    restBaseUrl: getRestBaseUrl()
  };
}

async function cancelOrder() {
  return {
    ok: true,
    message: "cancelOrder placeholder",
    restBaseUrl: getRestBaseUrl()
  };
}

async function getPositions() {
  return {
    ok: true,
    message: "getPositions placeholder",
    restBaseUrl: getRestBaseUrl(),
    data: []
  };
}

async function getOpenOrders() {
  return {
    ok: true,
    message: "getOpenOrders placeholder",
    restBaseUrl: getRestBaseUrl(),
    data: []
  };
}

async function getBalances() {
  return {
    ok: true,
    message: "getBalances placeholder",
    restBaseUrl: getRestBaseUrl(),
    data: []
  };
}

module.exports = {
  createOrder,
  cancelOrder,
  getPositions,
  getOpenOrders,
  getBalances
};
