# Aegis-B2B Multi-Tenant White-Label Web Ecosystem
**Reference Tenant:** Aruka Med Pharmaceuticals (B2B Wholesale)

A production-grade, multi-tenant digital business card and B2B wholesale web platform built with Turborepo, Next.js 15, Drizzle ORM, Tailwind CSS, and strict healthcare compliance validation.

---

## Architecture Overview

### Applications (`apps/`)
- [apps/marketing](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/apps/marketing): Public B2B wholesale pharmaceutical website (`http://localhost:3000`). Features live 24h cold room temperature trace SVG graph, 6 therapeutic segments with formulation modals, regulatory compliance ledger (Form 20B/21B, GSTIN), and inquiry lead form.
- [apps/qr-card](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/apps/qr-card): Ultra-lean mobile edge digital visiting card app (`http://localhost:3001/c/amit-sharma-4k7q`). Loads under 400ms on 4G, zero client-side JS overhead for core layout, RFC 6350 streaming vCard generation (`/api/vcard/arukamed/amit-sharma-4k7q`), WhatsApp inquiry links, and trade credit modal.
- [apps/admin-cms](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/apps/admin-cms): Multi-tenant administration portal (`http://localhost:3002`). Manage brand themes with live WCAG AA contrast check, employee onboarding, live mobile card preview emulator, and QR Code Studio emitting vector SVGs and commercial 300+ DPI CMYK print specifications.
- [apps/ops-portal](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/apps/ops-portal): Wholesale operations and dispatch tracking portal (`http://localhost:3003`). Purchase order verification, cold-chain packing protocol, and airway consignment tracking.

### Shared Packages (`packages/`)
- [packages/types](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/packages/types): Zod validation schemas for Tenants, Employees, Leads, Theme Config, and Compliance.
- [packages/database](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/packages/database): Drizzle ORM schemas, migration scripts, resilient memory-fallback data store, and Aruka Med seed data.
- [packages/auth](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/packages/auth): Role-based access control (RBAC), tenant boundary enforcement, honeypot spam protection, and XSS sanitization.
- [packages/ui](file:///Users/abhishikt_mac/Skills/Coding/Growth-ho%20clients/ArukaMed/packages/ui): Design tokens, SVG icon library, server-side CSS variable injector (`ThemeInjector`), and UI components.

---

## Healthcare Compliance & Security Safeguards

1. **GSTIN & Drug Licence Validation:** Enforces strict Indian CGST Rule 10 GSTIN format and Wholesale Drug Licence Form 20B / Form 21B validation.
2. **Anti-Spam Honeypot Security:** Public inquiry and credit application forms utilize hidden honeypot fields (`website_hp`) to transparently neutralize automated bot spam without CAPTCHA friction.
3. **Safe Protocol Guard:** Blocks `javascript:`, `data:`, and `file:` protocols across all user-supplied links to prevent XSS and SSRF attacks.
4. **RFC 6350 vCard Encoding:** Escapes commas, semicolons, and newlines with 75-character line folding for native, crash-proof contact import into iOS, Android, and Outlook.
5. **Strict Tenant Isolation:** Cross-tenant access is validated at the application boundary via RBAC checks (`SUPER_ADMIN`, `BRAND_ADMIN`, `OPS_MANAGER`, `SALES_REP`).

---

## Quick Start & Verification

### 1. Run Automated Security & Compliance Test Suite
```bash
node scripts/test-runner.mjs
```
Runs 7 test suites validating GSTIN regex, XSS sanitization, honeypot trap, vCard escaping, phone validation, and tenant isolation.

### 2. Typecheck All Workspaces
```bash
pnpm run typecheck
```

### 3. Production Build
```bash
pnpm run build
```

### 4. Development Servers
```bash
pnpm run dev
```
- Marketing Site: `http://localhost:3000`
- Mobile Visiting Card: `http://localhost:3001` (or `http://localhost:3001/c/amit-sharma-4k7q`)
- Admin CMS: `http://localhost:3002`
- Operations Portal: `http://localhost:3003`
