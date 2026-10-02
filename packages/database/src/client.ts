import fs from "fs";
import path from "path";
import type * as schema from "./schema/index";
import { arukaMedTenantSeed, abhishiktEmployeeSeed, amitSharmaEmployeeSeed } from "./seed";
import type { TenantRecord, EmployeeRecord, LeadInquiryRecord } from "./schema/index";
import { sanitizePublicEmployee, type PublicEmployeeProfile } from "@aegis/types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cswxwjsntjmigyjqzkun.supabase.co";

function getServiceKey(): string {
  // If the active secret key is provided (starts with sb_secret_), use it first
  if (process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY.startsWith("sb_secret_")) {
    return process.env.SUPABASE_SECRET_KEY;
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_secret_")) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  // If SUPABASE_SECRET_KEY is non-empty, use it
  if (process.env.SUPABASE_SECRET_KEY) {
    return process.env.SUPABASE_SECRET_KEY;
  }
  // Check candidate keys; if they are legacy JWTs (starting with "eyJ"), Supabase has disabled them
  const candidate = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (candidate && !candidate.startsWith("eyJ")) {
    return candidate;
  }
  return "";
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
  const parseJson = (val: any, fallback: any) => {
    if (val === undefined || val === null) return fallback;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return fallback;
      }
    }
    return val;
  };

  const firstName = row.first_name ?? row.firstName ?? "Employee";
  const lastName = row.last_name ?? row.lastName ?? "Member";
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    id: row.id,
    tenantId: row.tenant_id ?? row.tenantId,
    slug: row.slug,

    // 1. Primary Identity
    employeeCode: row.employee_code ?? row.employeeCode ?? "EMP-10492",
    firstName,
    lastName,
    preferredName: row.preferred_name ?? row.preferredName ?? firstName.split(" ")[0],
    pronouns: row.pronouns ?? "He/Him",
    dateOfBirth: row.date_of_birth ?? row.dateOfBirth ?? "1991-08-24",
    gender: row.gender ?? "Male",
    maritalStatus: row.marital_status ?? row.maritalStatus ?? "Married",
    nationality: row.nationality ?? "Indian",
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    bio:
      row.bio ??
      "Senior pharmaceutical operations & distribution lead specializing in cold-chain logistics, regional hospital supply chains, and B2B vendor management.",
    skills: parseJson(row.skills, [
      "Wholesale Pharma Distribution",
      "Cold Chain Logistics (2°C - 8°C)",
      "Institutional Hospital Supply",
      "Regulatory Compliance (Form 20B/21B)",
      "Vendor Management",
    ]),
    languages: parseJson(row.languages, ["English", "Hindi", "Kannada"]),

    // 2. Contact & Address
    phoneNumber: row.phone_number ?? row.phoneNumber ?? "+91 9742626628",
    whatsappNumber: row.whatsapp_number ?? row.whatsappNumber ?? "+91 9742626628",
    email: row.email ?? "employee@arukamed.com",
    personalEmail:
      row.personal_email ??
      row.personalEmail ??
      (row.email ? row.email.replace("@arukamed.com", "@gmail.com") : "personal@gmail.com"),
    personalPhone: row.personal_phone ?? row.personalPhone ?? (row.phone_number ?? row.phoneNumber ?? "+91 9742626628"),
    alternatePhone: row.alternate_phone ?? row.alternatePhone ?? "+91 98450 11223",
    officeExtension: row.office_extension ?? row.officeExtension ?? "101",
    currentAddress: parseJson(row.current_address ?? row.currentAddress, {
      line1: "#14, 4th Cross, Indiranagar",
      line2: "Near Metro Pillar 84",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      country: "India",
      proofDocumentName: "Aadhaar_Address_Proof.pdf",
      verified: true,
    }),
    permanentAddress: parseJson(row.permanent_address ?? row.permanentAddress, {
      sameAsCurrent: true,
      line1: "#14, 4th Cross, Indiranagar",
      line2: "Near Metro Pillar 84",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      country: "India",
      proofDocumentName: "Passport_Copy.pdf",
      verified: true,
    }),

    // 3. Emergency Contacts
    emergencyContacts: parseJson(row.emergency_contacts ?? row.emergencyContacts, [
      {
        id: "emc-1",
        name: "Sarah Prakash",
        relationship: "Spouse",
        primaryPhone: "+91 98765 43210",
        secondaryPhone: "+91 98765 43211",
        address: "#14, 4th Cross, Indiranagar, Bengaluru",
        isPrimary: true,
      },
      {
        id: "emc-2",
        name: "David Prakash",
        relationship: "Brother",
        primaryPhone: "+91 91234 56789",
        address: "Civil Lines, Kanpur, UP",
        isPrimary: false,
      },
    ]),

    // 4. Job & Org
    designation: row.designation ?? "General Manager",
    department: row.department ?? row.division ?? "Wholesale Sales & Institutional Accounts",
    division: row.division ?? "Wholesale Sales & Institutional Accounts",
    territoryRegion: row.territory_region ?? row.territoryRegion ?? "North Zone (UP & NCR)",
    directManager: parseJson(row.direct_manager ?? row.directManager, {
      id: "mgr-1",
      name: "Alex Smith",
      designation: "Chief Operating Officer",
      email: "alex.smith@arukamed.com",
      employeeCode: "EMP-10001",
    }),
    employmentType: row.employment_type ?? row.employmentType ?? "Full-time (Perm)",
    employmentStatus:
      row.employment_status ??
      row.employmentStatus ??
      (Boolean(row.is_active ?? row.isActive ?? true) ? "Active" : "Deactivated"),
    joiningDate: row.joining_date ?? row.joiningDate ?? "2023-03-12",
    confirmationDate: row.confirmation_date ?? row.confirmationDate ?? "2023-09-12",
    workLocation: row.work_location ?? row.workLocation ?? "Bengaluru Hub, India",
    shiftSchedule: row.shift_schedule ?? row.shiftSchedule ?? "Standard Shift (09:30 AM - 06:30 PM IST)",
    timezone: row.timezone ?? "Asia/Kolkata",
    workFromHomePolicy: row.work_from_home_policy ?? row.workFromHomePolicy ?? "Hybrid (2 Days WFH / Week)",
    noticePeriodDays: Number(row.notice_period_days ?? row.noticePeriodDays ?? 60),
    bandGrade: row.band_grade ?? row.bandGrade ?? "L4 - Senior Operations Lead",
    costCenter: row.cost_center ?? row.costCenter ?? "CC-OPS-SOUTH",

    // 5. Statutory & Tax
    panNumber: row.pan_number ?? row.panNumber ?? "ABCDE1234F",
    aadhaarNumber: row.aadhaar_number ?? row.aadhaarNumber ?? "XXXX-XXXX-8921",
    providentFundUan: row.provident_fund_uan ?? row.providentFundUan ?? "100982341902",
    esicNumber: row.esic_number ?? row.esicNumber ?? null,
    taxRegime: row.tax_regime ?? row.taxRegime ?? "New Tax Regime (115BAC)",
    statutoryStatus: row.statutory_status ?? row.statutoryStatus ?? "Verified",

    // 6. Financial & Banking
    bankAccount: parseJson(row.bank_account ?? row.bankAccount, {
      bankName: "HDFC Bank Ltd",
      accountHolderName: fullName,
      accountNumber: "50100293847192",
      routingCode: "HDFC0001234",
      accountType: "Salary",
      verificationStatus: "Penny-Drop Verified",
      cancelledChequeUrl: "/assets/docs/cancelled_cheque.pdf",
    }),
    salaryStructure: parseJson(row.salary_structure ?? row.salaryStructure, {
      baseAnnualINR: 1800000,
      monthlyGrossINR: 150000,
      variableAnnualINR: 300000,
      currency: "INR",
    }),
    payrollFreezeNotice: row.payroll_freeze_notice ?? row.payrollFreezeNotice ?? null,

    // 7. Education & Prior Employment
    education: parseJson(row.education, [
      {
        id: "edu-1",
        institution: "Manipal Academy of Higher Education",
        degree: "Bachelor of Pharmacy (B.Pharm)",
        fieldOfStudy: "Pharmaceutical Sciences",
        graduationYear: "2015",
      },
    ]),
    priorEmployment: parseJson(row.prior_employment ?? row.priorEmployment, [
      {
        id: "exp-1",
        company: "Apollo Health & Logistics",
        designation: "Regional Supply Chain Associate",
        startDate: "2018-04",
        endDate: "2023-02",
      },
    ]),

    // 8. Dependents & Beneficiaries
    dependents: parseJson(row.dependents, [
      {
        id: "dep-1",
        name: "Sarah Prakash",
        relationship: "Spouse",
        dateOfBirth: "1993-11-10",
        nomineeAllocationPercent: 60,
        benefitType: "Gratuity & Group Medical Cover",
      },
      {
        id: "dep-2",
        name: "Noah Prakash",
        relationship: "Child",
        dateOfBirth: "2021-04-18",
        nomineeAllocationPercent: 40,
        benefitType: "Group Medical Cover",
      },
    ]),

    // 9. Hardware & IT Assets
    assignedAssets: parseJson(row.assigned_assets ?? row.assignedAssets, [
      {
        id: "ast-1",
        assetName: "MacBook Pro 14\" M3",
        category: "Laptop",
        serialNumber: "C02G901KMD6T",
        assignedDate: "2023-03-15",
        status: "Assigned & Active",
      },
      {
        id: "ast-2",
        assetName: "Dell UltraSharp 27\" 4K USB-C",
        category: "Monitor",
        serialNumber: "CN-09K821-74261",
        assignedDate: "2023-03-15",
        status: "Assigned & Active",
      },
      {
        id: "ast-3",
        assetName: "Aruka Central Hub RFID Smart Badge",
        category: "Security Badge",
        serialNumber: "ARUKA-RFID-8812",
        assignedDate: "2023-03-12",
        status: "Assigned & Active",
      },
    ]),

    // 10. Documents Repository
    documents: parseJson(row.documents, [
      {
        id: "doc-1",
        title: "Government PAN Card",
        category: "Statutory Tax",
        fileName: "PAN_ABCDE1234F.pdf",
        fileUrl: "/docs/pan.pdf",
        fileSize: "1.2 MB",
        uploadedAt: "2023-03-12",
        status: "Verified",
      },
      {
        id: "doc-2",
        title: "Aadhaar Card (Masked)",
        category: "Identity Proof",
        fileName: "Aadhaar_Verified.pdf",
        fileUrl: "/docs/aadhaar.pdf",
        fileSize: "1.8 MB",
        uploadedAt: "2023-03-12",
        status: "Verified",
      },
      {
        id: "doc-3",
        title: "Bank Cancelled Cheque",
        category: "Banking Document",
        fileName: "HDFC_Cheque.pdf",
        fileUrl: "/docs/cheque.pdf",
        fileSize: "920 KB",
        uploadedAt: "2023-03-12",
        status: "Verified",
      },
      {
        id: "doc-4",
        title: "Degree Certificate (B.Pharm)",
        category: "Education Certificate",
        fileName: "BPharm_Certificate.pdf",
        fileUrl: "/docs/degree.pdf",
        fileSize: "2.4 MB",
        uploadedAt: "2023-03-12",
        status: "Verified",
      },
    ]),

    // 11. Revision History & Audit Trail
    revisionHistory: parseJson(row.revision_history ?? row.revisionHistory, [
      {
        id: "rev-1",
        timestamp: "2026-09-15 14:30 IST",
        editorName: `${firstName} (Self)`,
        editorRole: "Employee",
        category: "Statutory",
        field: "Tax Regime",
        oldValue: "Old Tax Regime",
        newValue: "New Tax Regime (115BAC)",
        requiresApproval: false,
        status: "Approved",
      },
      {
        id: "rev-2",
        timestamp: "2026-08-01 10:15 IST",
        editorName: "HR Operations",
        editorRole: "HR Admin",
        category: "Job & Org",
        field: "Band / Grade",
        oldValue: "L3 - Specialist",
        newValue: "L4 - Senior Operations Lead",
        requiresApproval: false,
        status: "Approved",
      },
    ]),

    // Public Visiting Card Overrides
    linkedinUrl: row.linkedin_url ?? row.linkedinUrl ?? null,
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
    employee_code: emp.employeeCode,
    first_name: emp.firstName,
    last_name: emp.lastName,
    preferred_name: emp.preferredName,
    pronouns: emp.pronouns,
    date_of_birth: emp.dateOfBirth,
    gender: emp.gender,
    marital_status: emp.maritalStatus,
    nationality: emp.nationality,
    avatar_url: emp.avatarUrl,
    bio: emp.bio,
    skills: emp.skills,
    languages: emp.languages,
    designation: emp.designation,
    department: emp.department,
    division: emp.division,
    territory_region: emp.territoryRegion,
    phone_number: emp.phoneNumber,
    whatsapp_number: emp.whatsappNumber,
    email: emp.email,
    personal_email: emp.personalEmail,
    personal_phone: emp.personalPhone,
    alternate_phone: emp.alternatePhone,
    office_extension: emp.officeExtension,
    current_address: emp.currentAddress,
    permanent_address: emp.permanentAddress,
    emergency_contacts: emp.emergencyContacts,
    direct_manager: emp.directManager,
    employment_type: emp.employmentType,
    employment_status: emp.employmentStatus,
    joining_date: emp.joiningDate,
    confirmation_date: emp.confirmationDate,
    work_location: emp.workLocation,
    shift_schedule: emp.shiftSchedule,
    timezone: emp.timezone,
    work_from_home_policy: emp.workFromHomePolicy,
    notice_period_days: emp.noticePeriodDays,
    band_grade: emp.bandGrade,
    cost_center: emp.costCenter,
    pan_number: emp.panNumber,
    aadhaar_number: emp.aadhaarNumber,
    provident_fund_uan: emp.providentFundUan,
    esic_number: emp.esicNumber,
    tax_regime: emp.taxRegime,
    statutory_status: emp.statutoryStatus,
    bank_account: emp.bankAccount,
    salary_structure: emp.salaryStructure,
    payroll_freeze_notice: emp.payrollFreezeNotice,
    education: emp.education,
    prior_employment: emp.priorEmployment,
    dependents: emp.dependents,
    assigned_assets: emp.assignedAssets,
    documents: emp.documents,
    revision_history: emp.revisionHistory,
    linkedin_url: emp.linkedinUrl,
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

    // Pre-seed core employees in memory so serverless cold starts never 404
    const seededAbhishikt = mapDbRowToEmployee(abhishiktEmployeeSeed as any);
    if (!this.cache.employees["arukamed:abhishikt"]) {
      this.cache.employees["arukamed:abhishikt"] = seededAbhishikt;
      this.cache.employees["abhishikt"] = seededAbhishikt;
    }
    const seededAmit = mapDbRowToEmployee(amitSharmaEmployeeSeed as any);
    if (!this.cache.employees["arukamed:amit-sharma-4k7q"]) {
      this.cache.employees["arukamed:amit-sharma-4k7q"] = seededAmit;
      this.cache.employees["amit-sharma-4k7q"] = seededAmit;
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

  async getPublicEmployeeProfile(tenantSlug: string, employeeSlug: string): Promise<PublicEmployeeProfile | null> {
    const emp = await this.getEmployeeBySlug(tenantSlug, employeeSlug);
    if (!emp) return null;
    return sanitizePublicEmployee(emp as any);
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

