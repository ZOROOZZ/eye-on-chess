import api from "./api";

let csrfToken: string | null = null;

/**
 * Fetches a CSRF token from the admin endpoint and caches it in memory.
 *
 * @returns The CSRF token string.
 */
export async function fetchCsrfToken() {
  const { data } = await api.get("/api/admin/csrf");
  csrfToken = data.token;
  return csrfToken;
}

/**
 * Makes an authenticated admin API request with automatic CSRF token management.
 * Fetches a CSRF token before the first mutation request.
 *
 * @param method - HTTP method to use.
 * @param url - API endpoint URL.
 * @param body - Optional request body for mutation methods.
 * @returns The response data.
 */
export async function adminRequest(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  body?: unknown
) {
  // Ensure CSRF token for mutations
  if (method !== "get" && !csrfToken) {
    await fetchCsrfToken();
  }

  const headers: Record<string, string> = {};
  if (method !== "get" && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const { data } = await api.request({
    method,
    url,
    data: body,
    headers,
  });
  return data;
}
