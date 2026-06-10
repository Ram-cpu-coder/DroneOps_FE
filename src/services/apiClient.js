const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

const SESSION_KEY = "droneops_session";

const getSession = () => {
  const rawSession = localStorage.getItem(SESSION_KEY);
  if (!rawSession) return null;

  try {
    return JSON.parse(rawSession);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

const getAccessToken = () => {
  return getSession()?.accessToken ?? "";
};

const shouldNotifyActivityChange = (method = "GET", path = "") => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) return false;

  const ignoredPaths = [
    "/auth/login",
    "/auth/google",
    "/auth/signup",
    "/auth/refresh-token",
    "/auth/forgot-password",
    "/auth/reset-password"
  ];

  return !ignoredPaths.some((ignoredPath) => path.startsWith(ignoredPath));
};

const notifyActivityChanged = (path, method) => {
  if (typeof window === "undefined" || !shouldNotifyActivityChange(method, path)) return;

  window.dispatchEvent(new CustomEvent("droneops:activity-changed", {
    detail: { path, method }
  }));
};

const refreshAccessToken = async () => {
  const session = getSession();
  if (!session?.refreshToken) return null;

  const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: session.refreshToken })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new Event("droneops:session-expired"));
    return null;
  }

  const nextSession = {
    ...session,
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
    user: payload.data.user ?? session.user
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  return nextSession.accessToken;
};

const request = async (path, options = {}, retry = true) => {
  const headers = new Headers(options.headers);
  const token = getAccessToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  const method = options.method ?? "GET";

  if (response.status === 204) {
    notifyActivityChanged(path, method);
    return null;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorText = `${payload.message ?? ""} ${payload.code ?? ""} ${payload.stack ?? ""}`.toLowerCase();
    const isExpiredJwt = errorText.includes("jwt expired") || errorText.includes("tokenexpirederror") || payload.code === "JWT_EXPIRED";
    if (retry && isExpiredJwt) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        return request(path, options, false);
      }
    }

    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  notifyActivityChanged(path, method);
  return payload.data ?? payload;
};

export const apiClient = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  delete: (path) => request(path, { method: "DELETE" }),
  upload: (path, formData) => request(path, { method: "POST", body: formData })
};

export { API_BASE_URL, SESSION_KEY };
