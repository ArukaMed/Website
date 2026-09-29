/**
 * Security utilities for healthcare compliance:
 * - XSS mitigation
 * - Safe URL enforcement (blocking javascript:, data:, file:)
 * - Honeypot verification
 */

export function sanitizeHtmlText(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function isSafeUrl(urlStr: unknown, allowedProtocols = ["https:", "http:", "mailto:", "tel:"]): boolean {
  if (!urlStr || typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim().toLowerCase();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return true;
  try {
    const parsed = new URL(trimmed, "http://localhost");
    return allowedProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeUrl(urlStr: unknown): string {
  if (isSafeUrl(urlStr)) {
    return String(urlStr).trim();
  }
  return "";
}

export function verifyHoneypot(honeypotValue: unknown): boolean {
  // If the honeypot field is filled by a bot, reject
  if (typeof honeypotValue === "string" && honeypotValue.trim().length > 0) {
    return false;
  }
  return true;
}
