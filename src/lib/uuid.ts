const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Generates an RFC4122 v4 compliant UUID.
 * Works across all environments (secure contexts, http, older webview/browsers).
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Checks if a string is already a valid UUID.
 */
export function isValidUUID(str?: string | null): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Ensures any string is converted to a valid PostgreSQL-compatible UUID.
 * - If already a valid UUID, returns it in lowercase.
 * - If non-UUID string (e.g. "Корт 1", "TS-101", "m_12345"), deterministically hashes it to a fixed UUID v4.
 * - If null/empty, generates a new random UUID.
 */
export function toUUID(str?: string | null): string {
  if (!str || !str.trim()) return generateUUID();
  const trimmed = str.trim();
  if (UUID_REGEX.test(trimmed)) return trimmed.toLowerCase();

  // Deterministic UUID from arbitrary string
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
    hash |= 0;
  }
  let hex = '';
  for (let i = 0; i < 16; i++) {
    const byte = Math.abs(Math.sin(hash + i) * 256) | 0;
    hex += byte.toString(16).padStart(2, '0');
  }
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    '4' + hex.slice(13, 16),
    ((parseInt(hex.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32)
  ].join('-').toLowerCase();
}
