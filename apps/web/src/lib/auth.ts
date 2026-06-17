'use client';

// Los tokens viven en cookies httpOnly (no accesibles por JS → mitiga XSS).
// En localStorage solo guardamos datos no sensibles del usuario para la UI/guards.
const USER = 'nexus_user';

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  permissions: string[];
}

export function saveSession(user: SessionUser) {
  localStorage.setItem(USER, JSON.stringify(user));
}

export function getUser(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER);
  return raw ? (JSON.parse(raw) as SessionUser) : null;
}

export function can(permission: string): boolean {
  return getUser()?.permissions.includes(permission) ?? false;
}

export function clearSession() {
  localStorage.removeItem(USER);
}
