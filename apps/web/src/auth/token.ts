// The JWT lives in localStorage so a reload keeps the user logged in.
// Storage can throw (private mode, blocked site data), so every access is guarded.
const KEY = 'cr.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(KEY, token);
    else localStorage.removeItem(KEY);
  } catch {
    // Not persisted; the session still works until reload.
  }
}
