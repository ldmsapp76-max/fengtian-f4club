// 奉天F4Club — Authentication Utilities

const SALT = 'f4club-2026-fengtian';
const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days in seconds

export interface SessionUser {
  id: number;
  nickname: string;
  role: string;
  avatar_emoji: string;
}

export interface SessionData {
  userId: number;
  user?: SessionUser;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function createSession(
  kv: KVNamespace,
  user: SessionUser
): Promise<string> {
  const token = generateSessionToken();
  await kv.put(`session:${token}`, JSON.stringify({ userId: user.id, user }), {
    expirationTtl: SESSION_TTL,
  });
  return token;
}

export async function refreshSessionUser(
  kv: KVNamespace,
  token: string,
  user: SessionUser
): Promise<void> {
  await kv.put(`session:${token}`, JSON.stringify({ userId: user.id, user }), {
    expirationTtl: SESSION_TTL,
  });
}

export async function getSession(
  kv: KVNamespace,
  token: string
): Promise<SessionData | null> {
  const data = await kv.get(`session:${token}`);
  if (!data) return null;
  return JSON.parse(data);
}

export async function deleteSession(
  kv: KVNamespace,
  token: string
): Promise<void> {
  await kv.delete(`session:${token}`);
}

export function getSessionToken(request: Request): string | null {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/f4session=([^;]+)/);
  return match ? match[1] : null;
}

export function setSessionCookie(token: string): string {
  return `f4session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}

export function clearSessionCookie(): string {
  return 'f4session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}
