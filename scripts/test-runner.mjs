import test from "node:test";
import assert from "node:assert/strict";

// GSTIN Regex according to Indian Tax Compliance (Rule 10 of CGST Rules)
const GSTINRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PhoneRegex = /^\+?[0-9\s-()]{8,20}$/;

function sanitizeHtmlText(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeUrl(urlStr, allowedProtocols = ["https:", "http:", "mailto:", "tel:"]) {
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

function verifyHoneypot(val) {
  return !(typeof val === "string" && val.trim().length > 0);
}

function escapeVCardValue(val) {
  return String(val || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

test("Healthcare Security: Indian GSTIN Compliance Validation", () => {
  const validGstin = "09ABCDE1234F1Z5";
  assert.equal(GSTINRegex.test(validGstin), true, "Valid GSTIN should pass");

  const invalidGstin1 = "09ABCDE1234F1A5"; // A instead of Z
  assert.equal(GSTINRegex.test(invalidGstin1), false, "Invalid GSTIN without Z should fail");

  const invalidGstin2 = "<script>alert(1)</script>";
  assert.equal(GSTINRegex.test(invalidGstin2), false, "XSS injection in GSTIN should fail");
});

test("Healthcare Security: XSS & HTML Sanitization", () => {
  const dirty = '<script>alert("hacked")</script>';
  const clean = sanitizeHtmlText(dirty);
  assert.equal(clean.includes("<script>"), false);
  assert.equal(clean, "&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;");
});

test("Healthcare Security: Safe URL Protocol Guard", () => {
  assert.equal(isSafeUrl("javascript:alert(1)"), false, "javascript: protocol must be blocked");
  assert.equal(isSafeUrl("data:text/html,<script>"), false, "data: URI must be blocked");
  assert.equal(isSafeUrl("file:///etc/passwd"), false, "file: protocol must be blocked");
  assert.equal(isSafeUrl("https://arukamed.com/catalog.pdf"), true, "https: must be allowed");
  assert.equal(isSafeUrl("mailto:orders@arukamed.com"), true, "mailto: must be allowed");
  assert.equal(isSafeUrl("tel:+919876543210"), true, "tel: must be allowed");
  assert.equal(isSafeUrl("/c/amit-sharma-4k7q"), true, "Relative paths must be allowed");
});

test("Anti-Spam Security: Honeypot Detection", () => {
  assert.equal(verifyHoneypot(""), true, "Empty honeypot should pass");
  assert.equal(verifyHoneypot(undefined), true, "Undefined honeypot should pass");
  assert.equal(verifyHoneypot("bot-spam-content"), false, "Filled honeypot must be rejected");
});

test("Pharma Mobile Card: vCard RFC 6350 Escape Logic", () => {
  const rawOrg = "Aruka Med, Pharmaceuticals; Wholesale";
  const escaped = escapeVCardValue(rawOrg);
  assert.equal(escaped, "Aruka Med\\, Pharmaceuticals\\; Wholesale");
});

test("RBAC Security: Tenant Isolation Enforcement", () => {
  const superAdmin = { role: "SUPER_ADMIN", tenantId: "tenant-1" };
  const brandAdminA = { role: "BRAND_ADMIN", tenantId: "tenant-1" };
  const brandAdminB = { role: "BRAND_ADMIN", tenantId: "tenant-2" };

  function canAccess(user, targetTenantId) {
    if (user.role === "SUPER_ADMIN") return true;
    return user.tenantId === targetTenantId;
  }

  assert.equal(canAccess(superAdmin, "tenant-2"), true, "Super admin can access any tenant");
  assert.equal(canAccess(brandAdminA, "tenant-1"), true, "Brand admin can access own tenant");
  assert.equal(canAccess(brandAdminA, "tenant-2"), false, "Brand admin cannot access other tenant");
});

test("Phone Number Validation", () => {
  assert.equal(PhoneRegex.test("+919876543210"), true);
  assert.equal(PhoneRegex.test("+91 98765 43210"), true);
  assert.equal(PhoneRegex.test("invalid-phone"), false);
  assert.equal(PhoneRegex.test("123"), false);
});
