'use client'
/* eslint-disable no-console */
/**
 * Frontend API client wrapper.
 *
 * - Keeps access token in memory only (module-level variable).
 * - Silently refreshes 2 minutes before expiry.
 * - On 401: attempts one refresh + one retry, then redirects to /login.
 */

// This variable exists ONLY in the browser's JS engine
// Each browser has its own copy — completely isolated
let accessToken: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let refreshing: Promise<boolean> | null = null;
let initPromise: Promise<void> | null = null;

let resolveAuthReady: (() => void) | null = null;
let authReady: Promise<void> = new Promise((resolve) => {
  resolveAuthReady = resolve;
});

// On the public login page, initAuth() is not invoked (it's in AdminLayout).
// Resolve the gate so apiFetch() doesn't hang forever; requests will 401 and UI can show it.
if (typeof window !== "undefined" && window.location.pathname === "/login") {
  queueMicrotask(() => {
    resolveAuthReady?.();
    resolveAuthReady = null;
  });
}

function resetAuthReady() {
  authReady = new Promise((resolve) => {
    resolveAuthReady = resolve;
  });
}

function debug(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function scheduleSilentRefresh(token: string) {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : null;
  if (!exp) return;

  const now = Math.floor(Date.now() / 1000);
  const fireInSeconds = Math.max(1, exp - now - 120); // 2 minutes before expiry

  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    void refreshAccessToken();
  }, fireInSeconds * 1000);
}

function redirectToLogin() {
  accessToken = null;
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
  if (typeof window !== "undefined") window.location.href = "/login";
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    debug("[AUTH] accessToken set:", token.substring(0, 20));
    scheduleSilentRefresh(token);
  } else {
    debug("[AUTH] accessToken cleared");
  }
}

export async function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (!res.ok) {
        redirectToLogin();
        return false;
      }
      const data = await res.json();
      const token = data?.accessToken as string | undefined;
      if (!token) {
        redirectToLogin();
        return false;
      }
      setAccessToken(token);
      return true;
    } catch {
      redirectToLogin();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export async function initAuth(): Promise<void> {
  // If already initialized with a token, skip.
  if (accessToken !== null) return;

  // If currently initializing, wait for the existing call.
  if (initPromise !== null) return initPromise;

  initPromise = (async () => {
    try {
      console.log("[AUTH] initAuth() started");
      console.log("[AUTH] Calling /api/auth/refresh...");
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const token = data?.accessToken as string | undefined;
        if (token) setAccessToken(token);
        console.log("[AUTH] Refresh SUCCESS, token stored");
        console.log("[AUTH] Token preview:", data.accessToken?.slice(0, 25));
        return;
      }

      console.log("[AUTH] Refresh FAILED, status:", res.status);
      console.log("[AUTH] Redirecting to login...");
      setAccessToken(null);
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } catch (err) {
      console.error("[AUTH] initAuth failed:", err);
      setAccessToken(null);
    } finally {
      resolveAuthReady?.();
      resolveAuthReady = null;
    }
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function login(email: string, password: string) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Login failed");
  }

  const token = data?.accessToken as string | undefined;
  if (!token) throw new Error("Missing accessToken");

  setAccessToken(token);
  resolveAuthReady?.();
  resolveAuthReady = null;
  debug("[AUTH] initAuth completed");
  return data;
}

export async function logout() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  setAccessToken(null);
  resetAuthReady();
  if (typeof window !== "undefined") window.location.href = "/login";
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  debug("[AUTH] apiFetch waiting for authReady...");
  await authReady;
  debug("[AUTH] apiFetch proceeding with token:", !!accessToken);
  console.log("[AUTH] apiFetch called, has token:", !!accessToken);

  const headers = new Headers(init.headers || {});
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(input, { ...init, headers });
  if (res.status !== 401) return res;

  // Attempt one silent refresh then retry once.
  const ok = await refreshAccessToken();
  if (!ok) return res;

  const retryHeaders = new Headers(init.headers || {});
  if (accessToken) retryHeaders.set("Authorization", `Bearer ${accessToken}`);
  return fetch(input, { ...init, headers: retryHeaders });
}

