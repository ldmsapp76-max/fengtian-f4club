// 奉天F4Club — Authentication Utilities

// 旧方案固定盐（SHA-256 时代），仅用于兼容老哈希的登录验证，新密码不再使用
const LEGACY_SALT = 'f4club-2026-fengtian';

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

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

export interface VerifyResult {
  valid: boolean;
  /** 密码正确，但是老哈希格式，建议登录成功后升级为新哈希 */
  needsUpgrade: boolean;
}

// ---- base64 / constant-time helpers ----

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---- Password hashing (PBKDF2-HMAC-SHA-256, Workers 原生支持) ----

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt.buffer as ArrayBuffer,
      iterations,
    },
    keyMaterial,
    KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

/**
 * 生成新密码哈希，格式：pbkdf2$<迭代次数>$<salt base64>$<key base64>
 * 盐每次随机生成，互不相同。
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(key)}`;
}

async function legacyHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(LEGACY_SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 校验密码。兼容老哈希（SHA-256 + 固定盐）：验证通过时 needsUpgrade 为 true，
 * 调用方应在登录成功后用 hashPassword 重新生成并入库，完成平滑迁移。
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<VerifyResult> {
  if (storedHash.startsWith('pbkdf2$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 4) return { valid: false, needsUpgrade: false };
    const iterations = parseInt(parts[1], 10);
    if (!Number.isFinite(iterations) || iterations <= 0) {
      return { valid: false, needsUpgrade: false };
    }
    let salt: Uint8Array;
    let expected: Uint8Array;
    try {
      salt = base64ToBytes(parts[2]);
      expected = base64ToBytes(parts[3]);
    } catch {
      return { valid: false, needsUpgrade: false };
    }
    const actual = await deriveKey(password, salt, iterations);
    return { valid: timingSafeEqual(actual, expected), needsUpgrade: false };
  }

  // 旧格式兼容
  const computed = await legacyHash(password);
  const a = new TextEncoder().encode(computed);
  const b = new TextEncoder().encode(storedHash);
  const valid = timingSafeEqual(a, b);
  return { valid, needsUpgrade: valid };
}

// ---- Sessions ----

export function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createSession(
  kv: KVNamespace,
  user: SessionUser,
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
  user: SessionUser,
): Promise<void> {
  await kv.put(`session:${token}`, JSON.stringify({ userId: user.id, user }), {
    expirationTtl: SESSION_TTL,
  });
}

export async function getSession(
  kv: KVNamespace,
  token: string,
): Promise<SessionData | null> {
  const data = await kv.get(`session:${token}`);
  if (!data) return null;
  return JSON.parse(data);
}

export async function deleteSession(
  kv: KVNamespace,
  token: string,
): Promise<void> {
  await kv.delete(`session:${token}`);
}

export function getSessionToken(request: Request): string | null {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/f4session=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * @param isSecure 仅在 HTTPS 下加 Secure 标记（本地 http 调试时不加，否则 cookie 写不进去）
 */
export function setSessionCookie(token: string, isSecure = false): string {
  const secure = isSecure ? '; Secure' : '';
  return `f4session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}${secure}`;
}

export function clearSessionCookie(isSecure = false): string {
  const secure = isSecure ? '; Secure' : '';
  return `f4session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
