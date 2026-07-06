import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = "aerovaultt_auth_token";

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Initialize the API client's token getter
setAuthTokenGetter(() => {
  return getToken();
});
