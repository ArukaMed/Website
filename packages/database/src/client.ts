import * as schema from "./schema";
import { arukaMedTenantSeed, amitSharmaEmployeeSeed } from "./seed";
import type { TenantRecord, EmployeeRecord, LeadInquiryRecord } from "./schema";

/**
 * Data Access Layer for multi-tenant queries.
 * In a deployed Postgres environment (Neon/Supabase), this wraps Drizzle queries.
 * Provides resilient, memory-cached edge resolution for local development and build verification.
 */
class MemoryDataStore {
  private tenantsMap = new Map<string, TenantRecord>();
  private employeesMap = new Map<string, EmployeeRecord>();
  private leadsMap = new Map<string, LeadInquiryRecord[]>();

  constructor() {
    this.reset();
  }

  reset() {
    this.tenantsMap.clear();
    this.employeesMap.clear();
    this.leadsMap.clear();

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

    // Initial mock leads for reference tenant
    const initialLeads: LeadInquiryRecord[] = [
      {
        id: "lead-001",
        tenantId: t.id,
        employeeId: e.id,
        institutionName: "Apollo Medics Multispeciality Hospital",
        businessType: "Hospital",
        contactName: "Dr. K. Saxena",
        phone: "+91 98390 11223",
        email: "purchase@apollomedics.org",
        drugLicenceNumber: "UP-LKO-20B-998822",
        gstin: "09AABCA1234F1Z8",
        requirementCategory: "Critical Care & Biologics",
        estimatedMonthlyVolume: "₹15,00,000 / month",
        sourceUrl: "https://connect.arukamed.com/c/amit-sharma-4k7q",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        ipAddress: "103.21.124.5",
        createdAt: new Date(Date.now() - 3600000 * 3), // 3 hours ago
      },
      {
        id: "lead-002",
        tenantId: t.id,
        employeeId: e.id,
        institutionName: "Gupta Chemist & Surgical Store",
        businessType: "Retail Pharmacy",
        contactName: "Rajesh Gupta",
        phone: "+91 94150 99881",
        email: "guptachemist.knp@gmail.com",
        drugLicenceNumber: "UP-KNP-21B-445566",
        gstin: "09AACCC5544Z1Z9",
        requirementCategory: "Cardiology & Anti-Diabetics",
        estimatedMonthlyVolume: "₹5,00,000 / month",
        sourceUrl: "https://arukamed.com/#inquiry",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ipAddress: "14.139.224.2",
        createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
      },
    ];

    this.leadsMap.set(t.slug, initialLeads);
  }

  async getTenantBySlug(slug: string): Promise<TenantRecord | null> {
    return this.tenantsMap.get(slug) || null;
  }

  async getTenantByDomain(domain: string): Promise<TenantRecord | null> {
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "");
    for (const t of this.tenantsMap.values()) {
      if (t.customDomain?.toLowerCase() === cleanDomain) return t;
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
    this.employeesMap.set(`${tenantSlug}:${employeeSlug}`, updated);
    return updated;
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

    const currentLeads = this.leadsMap.get(tenantSlug) || [];
    this.leadsMap.set(tenantSlug, [newLead, ...currentLeads]);
    return newLead;
  }

  async getAllLeads(tenantSlug: string): Promise<LeadInquiryRecord[]> {
    return this.leadsMap.get(tenantSlug) || [];
  }
}

export const dataStore = new MemoryDataStore();
export { schema };
