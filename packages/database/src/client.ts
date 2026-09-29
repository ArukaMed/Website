import * as schema from "./schema";
import { arukaMedTenantSeed, amitSharmaEmployeeSeed } from "./seed";
import type { TenantRecord, EmployeeRecord } from "./schema";

/**
 * Data Access Layer for multi-tenant queries.
 * In a deployed Postgres environment (Neon/Supabase), this wraps Drizzle queries.
 * Provides resilient, memory-cached edge resolution for local development and build verification.
 */
class MemoryDataStore {
  private tenantsMap = new Map<string, TenantRecord>();
  private employeesMap = new Map<string, EmployeeRecord>();

  constructor() {
    this.reset();
  }

  reset() {
    this.tenantsMap.clear();
    this.employeesMap.clear();

    const t = {
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

    const e = {
      ...amitSharmaEmployeeSeed,
      id: amitSharmaEmployeeSeed.id!,
      avatarUrl: amitSharmaEmployeeSeed.avatarUrl ?? null,
      division: amitSharmaEmployeeSeed.division ?? null,
      linkedinUrl: amitSharmaEmployeeSeed.linkedinUrl ?? null,
      officeExtension: amitSharmaEmployeeSeed.officeExtension ?? null,
      customWhatsappTemplate: amitSharmaEmployeeSeed.customWhatsappTemplate ?? null,
      customRateCardUrl: amitSharmaEmployeeSeed.customRateCardUrl ?? null,
      isActive: amitSharmaEmployeeSeed.isActive ?? true,
      scanCount: amitSharmaEmployeeSeed.scanCount ?? 0,
      vcardDownloads: amitSharmaEmployeeSeed.vcardDownloads ?? 0,
      whatsappClicks: amitSharmaEmployeeSeed.whatsappClicks ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmployeeRecord;

    this.tenantsMap.set(t.slug, t);
    this.employeesMap.set(`${t.slug}:${e.slug}`, e);
  }

  async getTenantBySlug(slug: string): Promise<TenantRecord | null> {
    return this.tenantsMap.get(slug) || null;
  }

  async getTenantByDomain(domain: string): Promise<TenantRecord | null> {
    for (const t of this.tenantsMap.values()) {
      if (t.customDomain?.toLowerCase() === domain.toLowerCase()) return t;
    }
    return null;
  }

  async getEmployeeBySlug(tenantSlug: string, employeeSlug: string): Promise<EmployeeRecord | null> {
    return this.employeesMap.get(`${tenantSlug}:${employeeSlug}`) || null;
  }

  async getAllEmployees(tenantSlug: string): Promise<EmployeeRecord[]> {
    const list: EmployeeRecord[] = [];
    const prefix = `${tenantSlug}:`;
    for (const [k, v] of this.employeesMap.entries()) {
      if (k.startsWith(prefix)) list.push(v);
    }
    return list;
  }

  async saveTenant(tenant: TenantRecord): Promise<void> {
    this.tenantsMap.set(tenant.slug, tenant);
  }

  async saveEmployee(tenantSlug: string, employee: EmployeeRecord): Promise<void> {
    this.employeesMap.set(`${tenantSlug}:${employee.slug}`, employee);
  }

  async incrementStat(
    tenantSlug: string,
    employeeSlug: string,
    type: "scan" | "vcard" | "whatsapp"
  ): Promise<void> {
    const e = await this.getEmployeeBySlug(tenantSlug, employeeSlug);
    if (!e) return;
    if (type === "scan") e.scanCount += 1;
    if (type === "vcard") e.vcardDownloads += 1;
    if (type === "whatsapp") e.whatsappClicks += 1;
  }
}

export const dataStore = new MemoryDataStore();
export { schema };
