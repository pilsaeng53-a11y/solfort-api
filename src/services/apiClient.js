// src/services/apiClient.js

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://solfort-api.onrender.com";

async function safeJson(res) {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await safeJson(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `GET ${path} failed`);
  }

  return json;
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = await safeJson(res);

  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `POST ${path} failed`);
  }

  return json;
}

export function getWsBaseUrl() {
  if (API_BASE_URL.startsWith("https://")) {
    return API_BASE_URL.replace("https://", "wss://");
  }

  if (API_BASE_URL.startsWith("http://")) {
    return API_BASE_URL.replace("http://", "ws://");
  }

  return API_BASE_URL;
}
