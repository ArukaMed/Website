import fs from "fs";
import path from "path";
import type * as schema from "./schema/index";
import { arukaMedTenantSeed } from "./seed";
import type { TenantRecord, EmployeeRecord, LeadInquiryRecord } from "./schema/index";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cswxwjsntjmigyjqzkun.supabase.co";

function getServiceKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  );
}

function getHeaders(prefer?: string): Record<string, string> {
  const key = getServiceKey();
  const h: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (key) {
    h["apikey"] = key;
    h["Authorization"] = `Bearer ${key}`;
  }
  if (prefer) {
    h["Prefer"] = prefer;
  }
  return h;
}

function getCacheFilePath(): string {
  let dir = process.cwd();
  while (dir.includes("apps") || dir.includes(".next")) {
    dir = path.dirname(dir);
  }
  return path.join(dir, ".data-store-cache.json");
}

interface CacheStore {
  tenants: Record<string, TenantRecord>;
  employees: Record<string, EmployeeRecord>;
  leads: Record<string, LeadInquiryRecord[]>;
}

function loadCache(): CacheStore {
  const cacheFile = getCacheFilePath();
  try {
    if (fs.existsSync(cacheFile)) {
      const raw = fs.readFileSync(cacheFile, "utf-8");
      const parsed = JSON.parse(raw);
      const employeesMap: Record<string, EmployeeRecord> = {};
      if (parsed.employees) {
        if (Array.isArray(parsed.employees)) {
          for (const e of parsed.employees) {
            employeesMap[`${e.tenantId || "arukamed"}:${e.slug}`] = e;
            employeesMap[e.slug] = e;
          }
        } else {
          Object.assign(employeesMap, parsed.employees);
        }
      }
      return {
        tenants: parsed.tenants || {},
        employees: employeesMap,
        leads: parsed.leads || {},
      };
    }
  } catch {
    // Ignore read errors
  }
  return { tenants: {}, employees: {}, leads: {} };
}

function saveCache(cache: CacheStore): void {
  try {
    const cacheFile = getCacheFilePath();
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // Ignore write errors in serverless edge environments
  }
}

function mapDbRowToEmployee(row: any): EmployeeRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id ?? row.tenantId,
    slug: row.slug,
    firstName: row.first_name ?? row.firstName,
    lastName: row.last_name ?? row.lastName,
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    designation: row.designation,
    division: row.division ?? null,
    territoryRegion: row.territory_region ?? row.territoryRegion,
    phoneNumber: row.phone_number ?? row.phoneNumber,
    whatsappNumber: row.whatsapp_number ?? row.whatsappNumber,
    email: row.email,
    linkedinUrl: row.linkedin_url ?? row.linkedinUrl ?? null,
    officeExtension: row.office_extension ?? row.officeExtension ?? null,
    customWhatsappTemplate: row.custom_whatsapp_template ?? row.customWhatsappTemplate ?? null,
    customRateCardUrl: row.custom_rate_card_url ?? row.customRateCardUrl ?? null,
    isActive: Boolean(row.is_active ?? row.isActive ?? true),
    scanCount: Number(row.scan_count ?? row.scanCount ?? 0),
    vcardDownloads: Number(row.vcard_downloads ?? row.vcardDownloads ?? 0),
    whatsappClicks: Number(row.whatsapp_clicks ?? row.whatsappClicks ?? 0),
    createdAt: row.created_at ? new Date(row.created_at) : (row.createdAt ? new Date(row.createdAt) : new Date()),
    updatedAt: row.updated_at ? new Date(row.updated_at) : (row.updatedAt ? new Date(row.updatedAt) : new Date()),
  };
}

function mapEmployeeToDbRow(emp: EmployeeRecord) {
  return {
    id: emp.id,
    tenant_id: emp.tenantId,
    slug: emp.slug,
    first_name: emp.firstName,
    last_name: emp.lastName,
    avatar_url: emp.avatarUrl,
    designation: emp.designation,
    division: emp.division,
    territory_region: emp.territoryRegion,
    phone_number: emp.phoneNumber,
    whatsapp_number: emp.whatsappNumber,
    email: emp.email,
    linkedin_url: emp.linkedinUrl,
    office_extension: emp.officeExtension,
    custom_whatsapp_template: emp.customWhatsappTemplate,
    custom_rate_card_url: emp.customRateCardUrl,
    is_active: emp.isActive,
    scan_count: emp.scanCount,
    vcard_downloads: emp.vcardDownloads,
    whatsapp_clicks: emp.whatsappClicks,
    created_at: emp.createdAt instanceof Date ? emp.createdAt.toISOString() : new Date().toISOString(),
    updated_at: emp.updatedAt instanceof Date ? emp.updatedAt.toISOString() : new Date().toISOString(),
  };
}

function mapDbRowToTenant(row: any): TenantRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    customDomain: row.custom_domain ?? row.customDomain ?? null,
    logoUrlLight: row.logo_url_light ?? row.logoUrlLight,
    logoUrlDark: row.logo_url_dark ?? row.logoUrlDark ?? null,
    markUrl: row.mark_url ?? row.markUrl ?? null,
    faviconUrl: row.favicon_url ?? row.faviconUrl ?? null,
    status: row.status ?? "ACTIVE",
    themeConfig: typeof row.theme_config === "string" ? JSON.parse(row.theme_config) : (row.theme_config ?? row.themeConfig),
    complianceInfo: typeof row.compliance_info === "string" ? JSON.parse(row.compliance_info) : (row.compliance_info ?? row.complianceInfo),
    commercialSettings: typeof row.commercial_settings === "string" ? JSON.parse(row.commercial_settings) : (row.commercial_settings ?? row.commercialSettings),
    featureFlags: typeof row.feature_flags === "string" ? JSON.parse(row.feature_flags) : (row.feature_flags ?? row.featureFlags),
    websiteContent: typeof row.website_content === "string" ? JSON.parse(row.website_content) : (row.website_content ?? row.websiteContent ?? null),
    createdAt: row.created_at ? new Date(row.created_at) : (row.createdAt ? new Date(row.createdAt) : new Date()),
    updatedAt: row.updated_at ? new Date(row.updated_at) : (row.updatedAt ? new Date(row.updatedAt) : new Date()),
  };
}

function mapDbRowToLead(row: any): LeadInquiryRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id ?? row.tenantId,
    employeeId: row.employee_id ?? row.employeeId ?? null,
    institutionName: row.institution_name ?? row.institutionName,
    businessType: row.business_type ?? row.businessType,
    contactName: row.contact_name ?? row.contactName,
    phone: row.phone,
    email: row.email ?? null,
    drugLicenceNumber: row.drug_licence_number ?? row.drugLicenceNumber ?? null,
    gstin: row.gstin ?? null,
    requirementCategory: row.requirement_category ?? row.requirementCategory ?? null,
    estimatedMonthlyVolume: row.estimated_monthly_volume ?? row.estimatedMonthlyVolume ?? null,
    sourceUrl: row.source_url ?? row.sourceUrl,
    userAgent: row.user_agent ?? row.userAgent ?? null,
    ipAddress: row.ip_address ?? row.ipAddress ?? null,
    createdAt: row.created_at ? new Date(row.created_at) : (row.createdAt ? new Date(row.createdAt) : new Date()),
  };
}

/**
 * Enterprise Resilient DataStore:
 * Native HTTP client for Supabase PostgREST database with dual-sync local file persistence.
 * Zero binary driver dependencies, preventing Next.js vendor-chunk webpack errors.
 */
class ResilientDataStore {
  private cache: CacheStore;

  constructor() {
    this.cache = loadCache();
    if (!this.cache.tenants["arukamed"]) {
      this.cache.tenants["arukamed"] = {
        ...arukaMedTenantSeed,
        id: arukaMedTenantSeed.id!,
        customDomain: arukaMedTenantSeed.customDomain ?? null,
        logoUrlDark: arukaMedTenantSeed.logoUrlDark ?? null,
        markUrl: arukaMedTenantSeed.markUrl ?? null,
        faviconUrl: arukaMedTenantSeed.faviconUrl ?? null,
        status: arukaMedTenantSeed.status ?? "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as TenantRecord;
    }
  }

  private refreshCacheFromDisk(): void {
    const disk = loadCache();
    this.cache = {
      tenants: { ...this.cache.tenants, ...disk.tenants },
      employees: { ...this.cache.employees, ...disk.employees },
      leads: { ...this.cache.leads, ...disk.leads },
    };
  }

  reset(): void {
    this.cache = { tenants: {}, employees: {}, leads: {} };
    saveCache(this.cache);
  }

  async getTenantBySlug(slug: string): Promise<TenantRecord | null> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=*`, {
        headers: getHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const tenant = mapDbRowToTenant(rows[0]);
          this.cache.tenants[slug] = tenant;
          saveCache(this.cache);
          return tenant;
        }
      }
    } catch {
      // Fall through to cache
    }

    this.refreshCacheFromDisk();
    return this.cache.tenants[slug] || null;
  }

  async getTenantByDomain(domain: string): Promise<TenantRecord | null> {
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/tenants?custom_domain=ilike.${encodeURIComponent(cleanDomain)}&select=*`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const tenant = mapDbRowToTenant(rows[0]);
          this.cache.tenants[tenant.slug] = tenant;
          saveCache(this.cache);
          return tenant;
        }
      }
    } catch {
      // Fall through to cache
    }

    this.refreshCacheFromDisk();
    for (const t of Object.values(this.cache.tenants)) {
      if (t.customDomain?.toLowerCase() === cleanDomain) return t;
    }
    return null;
  }

  async getEmployeeBySlug(tenantSlug: string, employeeSlug: string): Promise<EmployeeRecord | null> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/employees?slug=eq.${encodeURIComponent(employeeSlug)}&select=*`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const emp = mapDbRowToEmployee(rows[0]);
          this.cache.employees[`${tenantSlug}:${employeeSlug}`] = emp;
          this.cache.employees[employeeSlug] = emp;
          saveCache(this.cache);
          return emp;
        }
      }
    } catch {
      // Fall through to cache
    }

    this.refreshCacheFromDisk();
    return (
      this.cache.employees[`${tenantSlug}:${employeeSlug}`] ||
      this.cache.employees[employeeSlug] ||
      Object.values(this.cache.employees).find((e) => e.slug === employeeSlug) ||
      null
    );
  }

  async getAllEmployees(tenantSlug: string): Promise<EmployeeRecord[]> {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/employees?select=*&order=created_at.asc`, {
        headers: getHeaders(),
        cache: "no-store",
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const list = rows.map(mapDbRowToEmployee);
          for (const emp of list) {
            this.cache.employees[`${tenantSlug}:${emp.slug}`] = emp;
            this.cache.employees[emp.slug] = emp;
          }
          saveCache(this.cache);
          return list;
        }
      }
    } catch {
      // Fall through to cache
    }

    this.refreshCacheFromDisk();
    const list: EmployeeRecord[] = [];
    for (const emp of Object.values(this.cache.employees)) {
      if (!list.some((existing) => existing.id === emp.id)) {
        list.push(emp);
      }
    }
    return list;
  }

  async saveTenant(tenant: TenantRecord): Promise<void> {
    this.cache.tenants[tenant.slug] = tenant;
    saveCache(this.cache);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(tenant.slug)}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          name: tenant.name,
          custom_domain: tenant.customDomain,
          logo_url_light: tenant.logoUrlLight,
          logo_url_dark: tenant.logoUrlDark,
          mark_url: tenant.markUrl,
          favicon_url: tenant.faviconUrl,
          theme_config: tenant.themeConfig,
          compliance_info: tenant.complianceInfo,
          commercial_settings: tenant.commercialSettings,
          feature_flags: tenant.featureFlags,
          website_content: tenant.websiteContent,
          updated_at: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error("[DataStore] Failed to update tenant in Supabase:", err);
    }
  }

  async updateTenant(tenantSlug: string, patch: Partial<TenantRecord>): Promise<TenantRecord | null> {
    const existing = await this.getTenantBySlug(tenantSlug);
    if (!existing) return null;
    const updated: TenantRecord = {
      ...existing,
      ...patch,
      updatedAt: new Date(),
    };
    await this.saveTenant(updated);
    return updated;
  }

  async saveEmployee(tenantSlug: string, employee: EmployeeRecord): Promise<void> {
    this.cache.employees[`${tenantSlug}:${employee.slug}`] = employee;
    this.cache.employees[employee.slug] = employee;
    saveCache(this.cache);

    try {
      const tenant = await this.getTenantBySlug(tenantSlug);
      const tenantId = tenant ? tenant.id : employee.tenantId;
      const dbRow = mapEmployeeToDbRow({ ...employee, tenantId });

      await fetch(`${SUPABASE_URL}/rest/v1/employees`, {
        method: "POST",
        headers: getHeaders("resolution=merge-duplicates"),
        body: JSON.stringify(dbRow),
      });
    } catch (err) {
      console.error("[DataStore] Failed to save employee in Supabase:", err);
    }
  }

  async updateEmployee(
    tenantSlug: string,
    employeeSlug: string,
    patch: Partial<EmployeeRecord>
  ): Promise<EmployeeRecord | null> {
    const emp = await this.getEmployeeBySlug(tenantSlug, employeeSlug);
    if (!emp) return null;
    const updated: EmployeeRecord = {
      ...emp,
      ...patch,
      updatedAt: new Date(),
    };
    await this.saveEmployee(tenantSlug, updated);
    return updated;
  }

  async deleteEmployee(tenantSlug: string, employeeSlug: string): Promise<boolean> {
    delete this.cache.employees[`${tenantSlug}:${employeeSlug}`];
    delete this.cache.employees[employeeSlug];
    for (const key of Object.keys(this.cache.employees)) {
      if (this.cache.employees[key]?.slug === employeeSlug) {
        delete this.cache.employees[key];
      }
    }
    saveCache(this.cache);

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/employees?slug=eq.${encodeURIComponent(employeeSlug)}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return true;
    } catch (err) {
      console.error("[DataStore] Failed to delete employee from Supabase:", err);
      return true;
    }
  }

  async incrementStat(
    tenantSlug: string,
    employeeSlug: string,
    type: "scan" | "vcard" | "whatsapp"
  ): Promise<void> {
    const e = await this.getEmployeeBySlug(tenantSlug, employeeSlug);
    if (e) {
      if (type === "scan") e.scanCount += 1;
      if (type === "vcard") e.vcardDownloads += 1;
      if (type === "whatsapp") e.whatsappClicks += 1;
      this.cache.employees[`${tenantSlug}:${employeeSlug}`] = e;
      saveCache(this.cache);

      try {
        const patchKey =
          type === "scan"
            ? "scan_count"
            : type === "vcard"
            ? "vcard_downloads"
            : "whatsapp_clicks";
        const patchVal =
          type === "scan" ? e.scanCount : type === "vcard" ? e.vcardDownloads : e.whatsappClicks;

        await fetch(`${SUPABASE_URL}/rest/v1/employees?slug=eq.${encodeURIComponent(employeeSlug)}`, {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify({ [patchKey]: patchVal }),
        });
      } catch {
        // Non-blocking stats
      }
    }
  }

  async createLead(tenantSlug: string, lead: Partial<LeadInquiryRecord>): Promise<LeadInquiryRecord> {
    const tenant = await this.getTenantBySlug(tenantSlug);
    const newLead: LeadInquiryRecord = {
      id: lead.id || `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant ? tenant.id : lead.tenantId || "default-tenant",
      employeeId: lead.employeeId || null,
      institutionName: lead.institutionName || "Unknown Institution",
      businessType: lead.businessType || "Pharmacy",
      contactName: lead.contactName || "Contact Person",
      phone: lead.phone || "",
      email: lead.email || null,
      drugLicenceNumber: lead.drugLicenceNumber || null,
      gstin: lead.gstin || null,
      requirementCategory: lead.requirementCategory || "Wholesale Pharmaceuticals",
      estimatedMonthlyVolume: lead.estimatedMonthlyVolume || null,
      sourceUrl: lead.sourceUrl || "https://connect.arukamed.com",
      userAgent: lead.userAgent || null,
      ipAddress: lead.ipAddress || null,
      createdAt: new Date(),
    };

    const currentLeads = this.cache.leads[tenantSlug] || [];
    this.cache.leads[tenantSlug] = [newLead, ...currentLeads];
    saveCache(this.cache);

    try {
      const dbRow = {
        id: newLead.id,
        tenant_id: newLead.tenantId,
        employee_id: newLead.employeeId,
        institution_name: newLead.institutionName,
        business_type: newLead.businessType,
        contact_name: newLead.contactName,
        phone: newLead.phone,
        email: newLead.email,
        drug_licence_number: newLead.drugLicenceNumber,
        gstin: newLead.gstin,
        requirement_category: newLead.requirementCategory,
        estimated_monthly_volume: newLead.estimatedMonthlyVolume,
        source_url: newLead.sourceUrl,
        user_agent: newLead.userAgent,
        ip_address: newLead.ipAddress,
        created_at: newLead.createdAt.toISOString(),
      };

      await fetch(`${SUPABASE_URL}/rest/v1/lead_inquiries`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(dbRow),
      });
    } catch (err) {
      console.error("[DataStore] Failed to save lead to Supabase:", err);
    }

    return newLead;
  }

  async getAllLeads(tenantSlug: string): Promise<LeadInquiryRecord[]> {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/lead_inquiries?select=*&order=created_at.desc`,
        { headers: getHeaders(), cache: "no-store" }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const list = rows.map(mapDbRowToLead);
          this.cache.leads[tenantSlug] = list;
          saveCache(this.cache);
          return list;
        }
      }
    } catch {
      // Fall through to cache
    }

    this.refreshCacheFromDisk();
    return this.cache.leads[tenantSlug] || [];
  }
}

export const dataStore = new ResilientDataStore();
export type { schema };

