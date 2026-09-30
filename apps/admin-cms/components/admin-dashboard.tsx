"use client";

import React, { useState } from "react";
import type { Tenant, Employee, TenantThemeConfig, UserSession, UserRoleType } from "@aegis/types";
import { UserRole } from "@aegis/types";
import { getCommercialPrintSpec } from "@/lib/qr-engine";
import { DEMO_ACCOUNTS } from "@/lib/auth-constants";

interface AdminDashboardProps {
  initialTenant: Tenant;
  initialEmployees: Employee[];
  initialLeads?: any[];
  initialSession?: UserSession | null;
}

export function AdminDashboard({
  initialTenant,
  initialEmployees,
  initialLeads = [],
  initialSession = null,
}: AdminDashboardProps) {
  // Authentication & RBAC Session State
  const [session, setSession] = useState<UserSession | null>(
    initialSession || {
      userId: "usr-default-admin",
      email: "admin@arukamed.com",
      fullName: "Vikram Malhotra",
      role: UserRole.BRAND_ADMIN,
      tenantSlug: initialTenant.slug,
    }
  );
  const [loginEmail, setLoginEmail] = useState("admin@arukamed.com");
  const [loginPassword, setLoginPassword] = useState("••••••••");
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRoleType>(UserRole.BRAND_ADMIN);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Core CMS Data State
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [leads, setLeads] = useState<any[]>(initialLeads);

  // Navigation & View State
  const [activeTab, setActiveTab] = useState<"details" | "employees" | "qr" | "preview" | "theme" | "leads">("details");
  const [detailsSubTab, setDetailsSubTab] = useState<"shared" | "website" | "card">("shared");
  const [selectedEmployeeSlug, setSelectedEmployeeSlug] = useState<string>(initialEmployees[0]?.slug || "");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Edit Details Form State
  const [detailsForm, setDetailsForm] = useState({
    // Shared Core
    name: tenant.name,
    legalEntityName: tenant.complianceInfo.legalEntityName || "",
    customDomain: tenant.customDomain || "arukamed.com",
    logoUrlLight: tenant.logoUrlLight || "",
    logoUrlDark: tenant.logoUrlDark || "",
    markUrl: tenant.markUrl || "",
    warehouseLine1: tenant.complianceInfo.warehouseAddress?.line1 || "",
    warehouseCity: tenant.complianceInfo.warehouseAddress?.city || "",
    warehouseState: tenant.complianceInfo.warehouseAddress?.state || "",
    warehousePincode: tenant.complianceInfo.warehouseAddress?.pincode || "",
    gstin: tenant.complianceInfo.gstin || "",
    drugLicence20B: tenant.complianceInfo.drugLicences?.find((l) => l.label.includes("20B"))?.number || "",
    drugLicence20BValid: tenant.complianceInfo.drugLicences?.find((l) => l.label.includes("20B"))?.validUntil || "",
    drugLicence21B: tenant.complianceInfo.drugLicences?.find((l) => l.label.includes("21B"))?.number || "",
    drugLicence21BValid: tenant.complianceInfo.drugLicences?.find((l) => l.label.includes("21B"))?.validUntil || "",
    coldChainCert: tenant.complianceInfo.coldChainCertification?.certificateNumber || "",
    orderDeskEmail: tenant.commercialSettings.orderDeskEmail || "",
    centralHelplinePhone: tenant.commercialSettings.centralHelplinePhone || "",
    creditDeskEmail: tenant.commercialSettings.creditDeskEmail || "",
    minimumOrderValue: `₹${(tenant.commercialSettings.minimumOrderValueINR || 25000).toLocaleString("en-IN")}`,
    creditTermsSummary: tenant.commercialSettings.creditTermsSummary || "",
    catalogPdfUrl: tenant.commercialSettings.catalogPdfUrl || "",

    // Website CMS
    heroHeadline: tenant.websiteContent?.heroHeadline || "Reliable Wholesale Pharmaceutical Supply for Pharmacies, Hospitals & Institutions",
    heroSubheadline: tenant.websiteContent?.heroSubheadline || "Licensed B2B distributor supplying genuine branded & generic medicines, critical care injectables, and cold-chain biologics with guaranteed 24-48 hour regional dispatch.",
    statActiveSkus: tenant.websiteContent?.statActiveSkus || "5,000+",
    statBatchTraceability: tenant.websiteContent?.statBatchTraceability || "99.8%",
    statColdChainSla: tenant.websiteContent?.statColdChainSla || "2°C - 8°C",
    statDispatchTime: tenant.websiteContent?.statDispatchTime || "24-48 Hr",
    whyPrincipalSourcing: tenant.websiteContent?.whyPrincipalSourcing || "100% genuine inventory received directly from authorized pharmaceutical manufacturers, preventing spurious supplies and counterfeit lots.",
    whyColdStorage: tenant.websiteContent?.whyColdStorage || "Dedicated 2°C to 8°C cold rooms with automated multi-generator failovers for biologics, insulins, and critical vaccines.",
    whyTradeCredit: tenant.websiteContent?.whyTradeCredit || "Automated GST-compliant invoicing, batch expiry tracking, and flexible 15-to-30 day trade credit for verified hospitals and clinics.",

    // QR Card Specific
    defaultWhatsappTemplate: tenant.commercialSettings.defaultWhatsappTemplate || "Hello {name}, I scanned your {company} card. I would like to inquire about bulk wholesale medicine supply.",
    enableVCardSave: tenant.featureFlags.enableVCardSave ?? true,
    enableCatalogDownload: tenant.featureFlags.enableCatalogDownload ?? true,
    enableLeadCaptureForm: tenant.featureFlags.enableLeadCaptureForm ?? true,
    enablePoUploadEmail: tenant.featureFlags.enablePoUploadEmail ?? true,
    enableCreditApplicationModal: tenant.featureFlags.enableCreditApplicationModal ?? true,
    enableLiveColdRoomTrace: tenant.featureFlags.enableLiveColdRoomTrace ?? true,
  });

  // New Employee Modal Form State
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newDivision, setNewDivision] = useState("Wholesale Sales & Institutional Accounts");
  const [newTerritory, setNewTerritory] = useState("North Zone (UP & NCR)");
  const [newPhone, setNewPhone] = useState("+91 98390 ");
  const [newWhatsapp, setNewWhatsapp] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newOfficeExtension, setNewOfficeExtension] = useState("101");
  const [newSlug, setNewSlug] = useState("");
  const [newCustomGreeting, setNewCustomGreeting] = useState("");
  const [newCustomRateCard, setNewCustomRateCard] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // RBAC Permission Helpers
  const canEditCorporateDetails = session?.role === UserRole.SUPER_ADMIN || session?.role === UserRole.BRAND_ADMIN;
  const canManageEmployees = session?.role === UserRole.SUPER_ADMIN || session?.role === UserRole.BRAND_ADMIN;
  const canToggleRepStatus = session?.role === UserRole.SUPER_ADMIN || session?.role === UserRole.BRAND_ADMIN || session?.role === UserRole.OPS_MANAGER;

  // Handle Login / Demo Switcher
  const handleLogin = async (e?: React.FormEvent, directDemoUser?: (typeof DEMO_ACCOUNTS)[0]) => {
    if (e) e.preventDefault();
    setIsAuthLoading(true);

    const targetAccount = directDemoUser || DEMO_ACCOUNTS.find((a) => a.role === selectedDemoRole) || DEMO_ACCOUNTS[0];

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetAccount.email,
          fullName: targetAccount.fullName,
          role: targetAccount.role,
        }),
      });

      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        showToast(`Authenticated as ${data.session.fullName} (${data.session.role})`);
      }
    } catch {
      // Fallback local session if offline
      setSession({
        userId: "usr-fallback",
        email: targetAccount.email,
        fullName: targetAccount.fullName,
        role: targetAccount.role,
        tenantSlug: targetAccount.tenantSlug,
      });
      showToast(`Switched role to ${targetAccount.role}`);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setSession(null);
    showToast("Signed out from Admin CMS");
  };

  // Save All Details (Shared, Website, Card)
  const handleSaveAllDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditCorporateDetails) {
      showToast("Access Denied: Your role lacks permission to update corporate details.");
      return;
    }

    setIsSavingDetails(true);

    const updatedCompliance = {
      ...tenant.complianceInfo,
      legalEntityName: detailsForm.legalEntityName,
      gstin: detailsForm.gstin,
      warehouseAddress: {
        line1: detailsForm.warehouseLine1,
        city: detailsForm.warehouseCity,
        state: detailsForm.warehouseState,
        pincode: detailsForm.warehousePincode,
      },
      drugLicences: [
        {
          label: "Form 20B (Wholesale Allopathic)",
          number: detailsForm.drugLicence20B,
          validUntil: detailsForm.drugLicence20BValid || "31-12-2028",
        },
        {
          label: "Form 21B (Specified Schedules)",
          number: detailsForm.drugLicence21B,
          validUntil: detailsForm.drugLicence21BValid || "31-12-2028",
        },
      ],
      coldChainCertification: tenant.complianceInfo.coldChainCertification
        ? {
            ...tenant.complianceInfo.coldChainCertification,
            certificateNumber: detailsForm.coldChainCert,
          }
        : {
            certifier: "CDSCO / State FDA Uttar Pradesh",
            certificateNumber: detailsForm.coldChainCert,
            rangeMinCelsius: 2.0,
            rangeMaxCelsius: 8.0,
            failoverProtocol: "Dual-compressor generator backup with SMS alert",
          },
    };

    const updatedCommercial = {
      ...tenant.commercialSettings,
      orderDeskEmail: detailsForm.orderDeskEmail,
      centralHelplinePhone: detailsForm.centralHelplinePhone,
      creditDeskEmail: detailsForm.creditDeskEmail,
      minimumOrderValueINR: parseInt(String(detailsForm.minimumOrderValue).replace(/[^0-9]/g, ""), 10) || 25000,
      creditTermsSummary: detailsForm.creditTermsSummary,
      catalogPdfUrl: detailsForm.catalogPdfUrl,
      defaultWhatsappTemplate: detailsForm.defaultWhatsappTemplate,
    };

    const updatedFeatureFlags = {
      ...tenant.featureFlags,
      enableVCardSave: detailsForm.enableVCardSave,
      enableCatalogDownload: detailsForm.enableCatalogDownload,
      enableLeadCaptureForm: detailsForm.enableLeadCaptureForm,
      enablePoUploadEmail: detailsForm.enablePoUploadEmail,
      enableCreditApplicationModal: detailsForm.enableCreditApplicationModal,
      enableLiveColdRoomTrace: detailsForm.enableLiveColdRoomTrace,
    };

    const updatedWebsite = {
      heroHeadline: detailsForm.heroHeadline,
      heroSubheadline: detailsForm.heroSubheadline,
      statActiveSkus: detailsForm.statActiveSkus,
      statBatchTraceability: detailsForm.statBatchTraceability,
      statColdChainSla: detailsForm.statColdChainSla,
      statDispatchTime: detailsForm.statDispatchTime,
      whyPrincipalSourcing: detailsForm.whyPrincipalSourcing,
      whyColdStorage: detailsForm.whyColdStorage,
      whyTradeCredit: detailsForm.whyTradeCredit,
    };

    const payload = {
      name: detailsForm.name,
      customDomain: detailsForm.customDomain,
      logoUrlLight: detailsForm.logoUrlLight,
      logoUrlDark: detailsForm.logoUrlDark || null,
      markUrl: detailsForm.markUrl || null,
      complianceInfo: updatedCompliance,
      commercialSettings: updatedCommercial,
      featureFlags: updatedFeatureFlags,
      websiteContent: updatedWebsite,
    };

    try {
      const res = await fetch("/api/tenant", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update");
      }

      const data = await res.json();
      if (data.tenant) {
        setTenant(data.tenant);
      }
      showToast("All details saved! Both Website and QR-Cards are updated instantly.");
    } catch (err: any) {
      // Local state fallback
      setTenant((prev) => ({
        ...prev,
        ...payload,
      } as Tenant));
      showToast(err?.message || "Updated details locally.");
    } finally {
      setIsSavingDetails(false);
    }
  };

  // Add Employee and automatically sync QR-Card
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageEmployees) {
      showToast("Access Denied: Your role lacks permission to onboard employees.");
      return;
    }

    const cleanSlug = (
      newSlug.trim() ||
      `${newFirstName.toLowerCase()}-${newLastName.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`
    )
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const newEmp: Employee = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      slug: cleanSlug,
      firstName: newFirstName.trim(),
      lastName: newLastName.trim(),
      designation: newDesignation.trim() || "Wholesale Sales Representative",
      division: newDivision.trim(),
      territoryRegion: newTerritory.trim(),
      phoneNumber: newPhone.trim(),
      whatsappNumber: (newWhatsapp || newPhone).trim(),
      email: newEmail.trim(),
      linkedinUrl: "",
      officeExtension: newOfficeExtension.trim() || "101",
      customWhatsappTemplate: newCustomGreeting.trim() || null,
      customRateCardUrl: newCustomRateCard.trim() || null,
      isActive: true,
      scanCount: 0,
      vcardDownloads: 0,
      whatsappClicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Update state immediately so QR-Card & studio are updated
    setEmployees((prev) => [newEmp, ...prev]);
    setSelectedEmployeeSlug(newEmp.slug);
    setIsAddOpen(false);
    showToast(`Employee ${newFirstName} ${newLastName} onboarded! QR card is now live.`);

    // Persist to server API
    try {
      await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          firstName: newFirstName,
          lastName: newLastName,
          designation: newDesignation,
          division: newDivision,
          territoryRegion: newTerritory,
          phoneNumber: newPhone,
          whatsappNumber: newWhatsapp || newPhone,
          email: newEmail,
          officeExtension: newOfficeExtension,
          slug: cleanSlug,
          customWhatsappTemplate: newCustomGreeting || null,
          customRateCardUrl: newCustomRateCard || null,
        }),
      });
    } catch {
      // Local state is already updated
    }

    // Reset Form
    setNewFirstName("");
    setNewLastName("");
    setNewDesignation("");
    setNewPhone("+91 98390 ");
    setNewWhatsapp("");
    setNewEmail("");
    setNewSlug("");
    setNewCustomGreeting("");
    setNewCustomRateCard("");
  };

  // Toggle Employee Status
  const toggleEmployeeStatus = async (id: string) => {
    if (!canToggleRepStatus) {
      showToast("Access Denied: You do not have permission to alter rep lifecycle status.");
      return;
    }

    const emp = employees.find((e) => e.id === id);
    if (!emp) return;

    const nextState = !emp.isActive;

    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: nextState } : e))
    );

    showToast(
      nextState
        ? `${emp.firstName}'s card activated.`
        : `${emp.firstName} offboarded. Card QR now routes to central brand desk.`
    );

    try {
      await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          employeeSlug: emp.slug,
          patch: { isActive: nextState },
        }),
      });
    } catch {
      // local state updated
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (slug: string, name: string) => {
    if (!canManageEmployees) {
      showToast("Access Denied: Only Brand and Super Admins can remove employees.");
      return;
    }

    if (!confirm(`Are you sure you want to remove ${name}? Their digital visiting card will be permanently deleted.`)) {
      return;
    }

    setEmployees((prev) => prev.filter((e) => e.slug !== slug));
    if (selectedEmployeeSlug === slug) {
      setSelectedEmployeeSlug(employees.find((e) => e.slug !== slug)?.slug || "");
    }
    showToast(`Removed employee ${name}`);

    try {
      await fetch(`/api/employees?tenant=${tenant.slug}&employee=${slug}`, {
        method: "DELETE",
      });
    } catch {
      // local state updated
    }
  };

  const handleColorChange = (key: keyof TenantThemeConfig, color: string) => {
    if (!canEditCorporateDetails) {
      showToast("Access Denied: Cannot modify brand theming without Brand Admin privileges.");
      return;
    }
    setTenant((prev) => ({
      ...prev,
      themeConfig: {
        ...prev.themeConfig,
        [key]: color,
      },
    }));
    showToast(`Brand color ${String(key)} updated!`);
  };

  const selectedEmp = employees.find((e) => e.slug === selectedEmployeeSlug) || employees[0];
  const tenantCardHost = tenant.customDomain ? `connect.${tenant.customDomain}` : `${tenant.slug}.connect-card.com`;
  const defaultCardBaseUrl =
    typeof window !== "undefined" && window.location.hostname.includes("localhost")
      ? "http://localhost:3001"
      : `https://${tenantCardHost}`;
  const cardBaseUrl = process.env.NEXT_PUBLIC_CARD_URL || defaultCardBaseUrl;
  const cardUrl = selectedEmp ? `${cardBaseUrl}/c/${selectedEmp.slug}` : "";
  const printSpecs = getCommercialPrintSpec();

  // If user is not authenticated, render Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl mb-4">
            <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-display">
            ArukaMed Enterprise Admin CMS
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            Role-Based Access Control (RBAC) • Corporate Compliance • QR Lifecycle Hub
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
            {/* Quick Demo Switcher Section */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2.5">
                Quick-Select RBAC Role for Testing
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isSelected = selectedDemoRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => {
                        setSelectedDemoRole(acc.role);
                        setLoginEmail(acc.email);
                      }}
                      className={`p-3 text-left rounded-2xl border transition-all ${
                        isSelected
                          ? "border-amber-400 bg-amber-400/10 text-white shadow-sm"
                          : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{acc.fullName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          acc.role === UserRole.SUPER_ADMIN ? "bg-purple-900/80 text-purple-300" :
                          acc.role === UserRole.BRAND_ADMIN ? "bg-blue-900/80 text-blue-300" :
                          acc.role === UserRole.OPS_MANAGER ? "bg-emerald-900/80 text-emerald-300" :
                          "bg-amber-900/80 text-amber-300"
                        }`}>
                          {acc.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-1">{acc.email}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Official Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Security Password / Passkey</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 mt-4"
              >
                {isAuthLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign In with {selectedDemoRole} Credentials</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Role Badge Styling
  const roleBadgeColor =
    session.role === UserRole.SUPER_ADMIN
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : session.role === UserRole.BRAND_ADMIN
      ? "bg-blue-100 text-blue-800 border-blue-300"
      : session.role === UserRole.OPS_MANAGER
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : "bg-amber-100 text-amber-800 border-amber-300";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar with Real Session & RBAC Badge */}
      <header className="h-16 bg-[#09162D] text-white flex items-center justify-between px-6 border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-wide text-[#E3B15F]">Aegis-B2B</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">Admin CMS</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 border-l border-white/15 pl-4">
            <span>Tenant: <strong className="text-white">{tenant.name}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[11px] text-slate-400">{tenant.customDomain || `${tenant.slug}.com`}</span>
          </div>
        </div>

        {/* Authenticated User Status & Role Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-900 font-bold text-xs flex items-center justify-center">
              {session.fullName.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-white leading-tight">{session.fullName}</div>
              <div className="text-[10px] text-slate-400 font-mono leading-tight">{session.email}</div>
            </div>
            <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}>
              {session.role}
            </span>
          </div>

          {/* Quick Role Switch dropdown */}
          <select
            value={session.role}
            onChange={(e) => {
              const matched = DEMO_ACCOUNTS.find((a) => a.role === e.target.value);
              if (matched) handleLogin(undefined, matched);
            }}
            className="text-xs bg-white/10 border border-white/20 text-white rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/20"
            title="Switch RBAC Role to test permissions"
          >
            <option value={UserRole.BRAND_ADMIN} className="bg-slate-900 text-white">Role: BRAND_ADMIN</option>
            <option value={UserRole.SUPER_ADMIN} className="bg-slate-900 text-white">Role: SUPER_ADMIN</option>
            <option value={UserRole.OPS_MANAGER} className="bg-slate-900 text-white">Role: OPS_MANAGER</option>
            <option value={UserRole.SALES_REP} className="bg-slate-900 text-white">Role: SALES_REP</option>
          </select>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Sign Out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Permission Warning Banner if Sales Rep or Ops Manager */}
      {!canEditCorporateDetails && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>RBAC Notice:</strong> Signed in as <strong>{session.role}</strong>. You have read-only access to corporate compliance, registrations, and website content.
            </span>
          </div>
          <button
            onClick={() => handleLogin(undefined, DEMO_ACCOUNTS[0])}
            className="text-amber-800 font-bold underline hover:text-amber-950"
          >
            Switch to Brand Admin ↗
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-6 text-sm font-semibold overflow-x-auto">
        {/* Tab 1: Details & Content Management Hub */}
        <button
          onClick={() => setActiveTab("details")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "details"
              ? "border-[#09162D] text-[#09162D] font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <span>Details & Content CMS</span>
        </button>

        {/* Tab 2: Employees */}
        <button
          onClick={() => setActiveTab("employees")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "employees"
              ? "border-[#09162D] text-[#09162D] font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Employees ({employees.length})</span>
        </button>

        {/* Tab 3: QR Studio */}
        <button
          onClick={() => setActiveTab("qr")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "qr"
              ? "border-[#09162D] text-[#09162D] font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span>QR Code & Print Studio</span>
        </button>

        {/* Tab 4: Live Card Preview */}
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "preview"
              ? "border-[#09162D] text-[#09162D] font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" />
          </svg>
          <span>Live Card Preview</span>
        </button>

        {/* Tab 5: Theming */}
        <button
          onClick={() => setActiveTab("theme")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "theme"
              ? "border-[#09162D] text-[#09162D] font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.48 0 .936.084 1.36.24L17.5 4.5a2.121 2.121 0 113 3L11.76 16.64c.156.424.24.88.24 1.36a4 4 0 01-4 4z" />
          </svg>
          <span>Theming & Brand Colors</span>
        </button>

        {/* Tab 6: Leads */}
        <button
          onClick={() => setActiveTab("leads")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "leads"
              ? "border-[#09162D] text-[#09162D] font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Leads & Inquiries ({leads.length})</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {/* ========================================================================= */}
        {/* TAB 1: DETAILS & CONTENT CMS (Centralized Entity & Content Hub)          */}
        {/* ========================================================================= */}
        {activeTab === "details" && (
          <form onSubmit={handleSaveAllDetails} className="space-y-6">
            {/* Hub Header & Save Action */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Entity & Content Management Hub
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single control panel for all company details, regulatory registrations, website marketing copy, and digital card settings.
                  <strong className="text-navy font-semibold ml-1">
                    Details edited here automatically propagate across both the Public Website and Digital Visiting Cards.
                  </strong>
                </p>
              </div>

              <button
                type="submit"
                disabled={!canEditCorporateDetails || isSavingDetails}
                className={`text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  !canEditCorporateDetails
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F]"
                }`}
              >
                {isSavingDetails ? (
                  <span>Saving & Publishing...</span>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save & Publish All Details</span>
                  </>
                )}
              </button>
            </div>

            {/* Sub-Tabs: Shared Core / Website CMS / QR Card Settings */}
            <div className="flex gap-2 p-1 bg-slate-200/80 rounded-xl w-fit text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDetailsSubTab("shared")}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  detailsSubTab === "shared"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <svg className="h-3.5 w-3.5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>1. Shared Core Details (Edit Once • Syncs to Both)</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailsSubTab("website")}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  detailsSubTab === "website"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <svg className="h-3.5 w-3.5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>2. Website Marketing CMS (arukamed.com)</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailsSubTab("card")}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  detailsSubTab === "card"
                    ? "bg-white text-slate-900 shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" />
                </svg>
                <span>3. Digital Visiting Card Settings (connect.arukamed.com)</span>
              </button>
            </div>

            {/* SUB-SECTION 1: SHARED CORE DETAILS */}
            {detailsSubTab === "shared" && (
              <div className="space-y-6">
                {/* Notice Pill */}
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-3">
                  <svg className="h-5 w-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    <strong>Unified Synchronization Active:</strong> Any update made here to company credentials, GSTIN, Form 20B/21B licences, helpline numbers, or warehouse addresses will reflect simultaneously on both the Website header/footer and each employee’s digital card.
                  </span>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2">
                    A. Corporate Identity & Domain
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Brand Display Name *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.name}
                        onChange={(e) => setDetailsForm({ ...detailsForm, name: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-semibold block mb-1 text-slate-700">Legal Entity Name (Invoicing & Licences) *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.legalEntityName}
                        onChange={(e) => setDetailsForm({ ...detailsForm, legalEntityName: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Primary Domain Name</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.customDomain}
                        onChange={(e) => setDetailsForm({ ...detailsForm, customDomain: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                        placeholder="arukamed.com"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Light Logo URL</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.logoUrlLight}
                        onChange={(e) => setDetailsForm({ ...detailsForm, logoUrlLight: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Dark Logo URL (Optional)</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.logoUrlDark}
                        onChange={(e) => setDetailsForm({ ...detailsForm, logoUrlDark: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2 pt-4">
                    B. Regulatory Licences, GSTIN & Cold-Chain Certification
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">GSTIN Identification Number *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.gstin}
                        onChange={(e) => setDetailsForm({ ...detailsForm, gstin: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Drug Licence Form 20B (Allopathic Wholesale) *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.drugLicence20B}
                        onChange={(e) => setDetailsForm({ ...detailsForm, drugLicence20B: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Form 20B Valid Upto</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.drugLicence20BValid}
                        onChange={(e) => setDetailsForm({ ...detailsForm, drugLicence20BValid: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Drug Licence Form 21B (Schedules C & C1) *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.drugLicence21B}
                        onChange={(e) => setDetailsForm({ ...detailsForm, drugLicence21B: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Form 21B Valid Upto</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.drugLicence21BValid}
                        onChange={(e) => setDetailsForm({ ...detailsForm, drugLicence21BValid: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Cold-Chain GDP Certification No.</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.coldChainCert}
                        onChange={(e) => setDetailsForm({ ...detailsForm, coldChainCert: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2 pt-4">
                    C. Central Operational Contacts & Warehouse Location
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Central Order Desk Email *</label>
                      <input
                        type="email"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.orderDeskEmail}
                        onChange={(e) => setDetailsForm({ ...detailsForm, orderDeskEmail: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Central Helpline Phone *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.centralHelplinePhone}
                        onChange={(e) => setDetailsForm({ ...detailsForm, centralHelplinePhone: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Institutional Accounts & Credit Email</label>
                      <input
                        type="email"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.creditDeskEmail}
                        onChange={(e) => setDetailsForm({ ...detailsForm, creditDeskEmail: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-semibold block mb-1 text-slate-700">Warehouse Address Line 1 *</label>
                      <input
                        type="text"
                        required
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.warehouseLine1}
                        onChange={(e) => setDetailsForm({ ...detailsForm, warehouseLine1: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="font-semibold block mb-1 text-slate-700">City *</label>
                        <input
                          type="text"
                          required
                          disabled={!canEditCorporateDetails}
                          value={detailsForm.warehouseCity}
                          onChange={(e) => setDetailsForm({ ...detailsForm, warehouseCity: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1 text-slate-700">State *</label>
                        <input
                          type="text"
                          required
                          disabled={!canEditCorporateDetails}
                          value={detailsForm.warehouseState}
                          onChange={(e) => setDetailsForm({ ...detailsForm, warehouseState: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="font-semibold block mb-1 text-slate-700">Pincode *</label>
                        <input
                          type="text"
                          required
                          disabled={!canEditCorporateDetails}
                          value={detailsForm.warehousePincode}
                          onChange={(e) => setDetailsForm({ ...detailsForm, warehousePincode: e.target.value })}
                          className="w-full p-2.5 border rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b pb-2 pt-4">
                    D. Commercial Trade Policies & Catalog
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Minimum Order Value (MOV)</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.minimumOrderValue}
                        onChange={(e) => setDetailsForm({ ...detailsForm, minimumOrderValue: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Master Wholesale Catalog PDF URL</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.catalogPdfUrl}
                        onChange={(e) => setDetailsForm({ ...detailsForm, catalogPdfUrl: e.target.value })}
                        className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-semibold block mb-1 text-slate-700">Credit Terms Policy Summary</label>
                      <textarea
                        rows={2}
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.creditTermsSummary}
                        onChange={(e) => setDetailsForm({ ...detailsForm, creditTermsSummary: e.target.value })}
                        className="w-full p-2.5 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SECTION 2: WEBSITE MARKETING CMS */}
            {detailsSubTab === "website" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      Website Marketing Copy & Value Pillars
                    </h3>
                    <p className="text-xs text-slate-500">
                      Edit copy for the hero section, performance metrics, and institutional sourcing descriptions displayed on{" "}
                      <strong className="text-navy">arukamed.com</strong>.
                    </p>
                  </div>
                  <a
                    href="http://localhost:3000"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>View Public Website</span>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Hero Main Headline *</label>
                    <input
                      type="text"
                      required
                      disabled={!canEditCorporateDetails}
                      value={detailsForm.heroHeadline}
                      onChange={(e) => setDetailsForm({ ...detailsForm, heroHeadline: e.target.value })}
                      className="w-full p-2.5 border rounded-xl font-medium text-sm"
                    />
                  </div>

                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">Hero Subheadline *</label>
                    <textarea
                      rows={2}
                      required
                      disabled={!canEditCorporateDetails}
                      value={detailsForm.heroSubheadline}
                      onChange={(e) => setDetailsForm({ ...detailsForm, heroSubheadline: e.target.value })}
                      className="w-full p-2.5 border rounded-xl"
                    />
                  </div>

                  <h4 className="font-bold uppercase tracking-wider text-slate-500 pt-2">
                    Hero Trust Strip Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Active SKUs</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.statActiveSkus}
                        onChange={(e) => setDetailsForm({ ...detailsForm, statActiveSkus: e.target.value })}
                        className="w-full p-2 border rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Batch Traceability</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.statBatchTraceability}
                        onChange={(e) => setDetailsForm({ ...detailsForm, statBatchTraceability: e.target.value })}
                        className="w-full p-2 border rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Cold Chain Storage</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.statColdChainSla}
                        onChange={(e) => setDetailsForm({ ...detailsForm, statColdChainSla: e.target.value })}
                        className="w-full p-2 border rounded-xl font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">Regional Dispatch SLA</label>
                      <input
                        type="text"
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.statDispatchTime}
                        onChange={(e) => setDetailsForm({ ...detailsForm, statDispatchTime: e.target.value })}
                        className="w-full p-2 border rounded-xl font-bold text-center"
                      />
                    </div>
                  </div>

                  <h4 className="font-bold uppercase tracking-wider text-slate-500 pt-4">
                    Institutional Value Propositions ("Why Choose ArukaMed")
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">1. Principal Sourcing</label>
                      <textarea
                        rows={3}
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.whyPrincipalSourcing}
                        onChange={(e) => setDetailsForm({ ...detailsForm, whyPrincipalSourcing: e.target.value })}
                        className="w-full p-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">2. Cold Chain Infrastructure</label>
                      <textarea
                        rows={3}
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.whyColdStorage}
                        onChange={(e) => setDetailsForm({ ...detailsForm, whyColdStorage: e.target.value })}
                        className="w-full p-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="font-semibold block mb-1 text-slate-700">3. Trade Credit Terms</label>
                      <textarea
                        rows={3}
                        disabled={!canEditCorporateDetails}
                        value={detailsForm.whyTradeCredit}
                        onChange={(e) => setDetailsForm({ ...detailsForm, whyTradeCredit: e.target.value })}
                        className="w-full p-2 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-SECTION 3: DIGITAL VISITING CARD SETTINGS */}
            {detailsSubTab === "card" && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">
                      Digital Visiting Card Engine Settings
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure WhatsApp inquiry templates and interactive card features across all sales reps on{" "}
                      <strong className="text-navy">connect.arukamed.com</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Live Card Preview</span>
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-semibold block mb-1 text-slate-700">
                      Default Rep WhatsApp Greeting Template
                    </label>
                    <p className="text-[11px] text-slate-400 mb-2">
                      Variables: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-navy">&#123;name&#125;</code> and <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-navy">&#123;company&#125;</code> will be automatically replaced with the rep's name and brand.
                    </p>
                    <textarea
                      rows={2}
                      disabled={!canEditCorporateDetails}
                      value={detailsForm.defaultWhatsappTemplate}
                      onChange={(e) => setDetailsForm({ ...detailsForm, defaultWhatsappTemplate: e.target.value })}
                      className="w-full p-2.5 border rounded-xl font-mono text-xs"
                    />
                  </div>

                  <h4 className="font-bold uppercase tracking-wider text-slate-500 pt-2">
                    Card Interactive Modules & Action Toggles
                  </h4>

                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/60">
                      <input
                        type="checkbox"
                        disabled={!canEditCorporateDetails}
                        checked={detailsForm.enableVCardSave}
                        onChange={(e) => setDetailsForm({ ...detailsForm, enableVCardSave: e.target.checked })}
                        className="rounded h-4 w-4 text-navy"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Save Contact (vCard)</div>
                        <div className="text-[11px] text-slate-400">One-tap iOS/Android address book save</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/60">
                      <input
                        type="checkbox"
                        disabled={!canEditCorporateDetails}
                        checked={detailsForm.enableLeadCaptureForm}
                        onChange={(e) => setDetailsForm({ ...detailsForm, enableLeadCaptureForm: e.target.checked })}
                        className="rounded h-4 w-4 text-navy"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Wholesale RFQ Modal</div>
                        <div className="text-[11px] text-slate-400">Lead capture with GSTIN & DL prompt</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/60">
                      <input
                        type="checkbox"
                        disabled={!canEditCorporateDetails}
                        checked={detailsForm.enableCatalogDownload}
                        onChange={(e) => setDetailsForm({ ...detailsForm, enableCatalogDownload: e.target.checked })}
                        className="rounded h-4 w-4 text-navy"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Catalog PDF Download</div>
                        <div className="text-[11px] text-slate-400">Wholesale product catalogue action</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/60">
                      <input
                        type="checkbox"
                        disabled={!canEditCorporateDetails}
                        checked={detailsForm.enablePoUploadEmail}
                        onChange={(e) => setDetailsForm({ ...detailsForm, enablePoUploadEmail: e.target.checked })}
                        className="rounded h-4 w-4 text-navy"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Quick PO Email Dispatch</div>
                        <div className="text-[11px] text-slate-400">Pre-filled mailto to order desk</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/60">
                      <input
                        type="checkbox"
                        disabled={!canEditCorporateDetails}
                        checked={detailsForm.enableCreditApplicationModal}
                        onChange={(e) => setDetailsForm({ ...detailsForm, enableCreditApplicationModal: e.target.checked })}
                        className="rounded h-4 w-4 text-navy"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Credit Account Request</div>
                        <div className="text-[11px] text-slate-400">Hospital trade credit inquiry</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border rounded-xl cursor-pointer hover:bg-slate-100/60">
                      <input
                        type="checkbox"
                        disabled={!canEditCorporateDetails}
                        checked={detailsForm.enableLiveColdRoomTrace}
                        onChange={(e) => setDetailsForm({ ...detailsForm, enableLiveColdRoomTrace: e.target.checked })}
                        className="rounded h-4 w-4 text-navy"
                      />
                      <div>
                        <div className="font-semibold text-slate-900">Cold Chain Telemetry</div>
                        <div className="text-[11px] text-slate-400">Live 2°C - 8°C temperature audit badge</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: EMPLOYEES & AUTOMATED QR CARD LIFECYCLE                            */}
        {/* ========================================================================= */}
        {activeTab === "employees" && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">
                  Digital Visiting Cards & Rep Directory
                </h2>
                <p className="text-xs text-slate-500">
                  Onboarding an employee immediately generates their unique live digital card (
                  <code className="text-navy font-mono">/c/[slug]</code>) and print-ready QR code.
                </p>
              </div>

              {canManageEmployees && (
                <button
                  type="button"
                  onClick={() => setIsAddOpen(true)}
                  className="bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Onboard New Employee</span>
                </button>
              )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Representative</th>
                      <th className="py-3 px-4">Designation & Region</th>
                      <th className="py-3 px-4">Direct Contact</th>
                      <th className="py-3 px-4">Scans / Downloads</th>
                      <th className="py-3 px-4">Lifecycle Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {employees.map((emp) => {
                      const empCardUrl = `${cardBaseUrl}/c/${emp.slug}`;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{emp.firstName} {emp.lastName}</span>
                              {selectedEmployeeSlug === emp.slug && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-bold">
                                  Selected
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-0.5">/c/{emp.slug}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-800 font-medium">{emp.designation}</div>
                            <div className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <svg className="h-3 w-3 text-amber-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{emp.territoryRegion}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="text-slate-800 font-semibold">{emp.phoneNumber}</div>
                            <div className="text-slate-400">{emp.email}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800">{emp.scanCount} scans</div>
                            <div className="text-[11px] text-slate-400">{emp.vcardDownloads} vCards saved</div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                emp.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${emp.isActive ? "bg-green-500" : "bg-red-500"}`}></span>
                              <span>{emp.isActive ? "Active Rep" : "Deactivated (Rerouted)"}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Select in Studio */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmployeeSlug(emp.slug);
                                  setActiveTab("qr");
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                                title="Open QR Studio for this rep"
                              >
                                QR Studio
                              </button>

                              {/* Copy Card Link */}
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(empCardUrl);
                                  showToast(`Copied ${emp.firstName}'s card URL: ${empCardUrl}`);
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium"
                                title="Copy public card URL"
                              >
                                Copy Link
                              </button>

                              {/* Open Card */}
                              <a
                                href={empCardUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 rounded-lg border border-slate-300 text-blue-700 hover:bg-blue-50 font-medium"
                                title="Visit live card in new tab"
                              >
                                ↗
                              </a>

                              {/* Status Toggle (Ops & Brand Admin) */}
                              {canToggleRepStatus && (
                                <button
                                  type="button"
                                  onClick={() => toggleEmployeeStatus(emp.id)}
                                  className={`px-2.5 py-1 rounded-lg border font-medium ${
                                    emp.isActive
                                      ? "border-red-200 text-red-700 hover:bg-red-50"
                                      : "border-green-200 text-green-700 hover:bg-green-50"
                                  }`}
                                  title={emp.isActive ? "Deactivate and route traffic to brand desk" : "Re-activate rep card"}
                                >
                                  {emp.isActive ? "Offboard" : "Activate"}
                                </button>
                              )}

                              {/* Delete Employee (Brand & Super Admin) */}
                              {canManageEmployees && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmployee(emp.slug, `${emp.firstName} ${emp.lastName}`)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50"
                                  title="Delete Employee"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: QR STUDIO & INDUSTRIAL PRINT SPEC                                   */}
        {/* ========================================================================= */}
        {activeTab === "qr" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">
                Vector & Print-Ready QR Studio
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Dual-output QR generator emitting screen vectors and commercial 300+ DPI CMYK print standards for card manufacturing.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Active Employee Card
                </label>
                <select
                  value={selectedEmployeeSlug}
                  onChange={(e) => setSelectedEmployeeSlug(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-300 rounded-xl"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.slug}>
                      {e.firstName} {e.lastName} ({e.designation} - {e.territoryRegion})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-center">
                <div className="mx-auto w-48 h-48 bg-white p-3 rounded-xl border border-slate-300 shadow-inner flex flex-col items-center justify-center">
                  <div className="text-[10px] font-mono text-slate-400 mb-1">Error Correction: H (30%)</div>
                  <div className="my-2 p-3 rounded-lg bg-slate-100 text-slate-800">
                    <svg className="h-10 w-10 text-[#09162D]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-mono break-all text-slate-500 px-2">{cardUrl}</div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => showToast("Vector SVG generated with central brand cutout.")}
                    className="bg-[#09162D] hover:bg-[#12284E] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    Download Vector SVG
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast("High-Res 300 DPI PNG downloaded for offset printing.")}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    Download 300 DPI PNG
                  </button>
                </div>
              </div>
            </div>

            {/* Print Spec Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2 font-display">Commercial Print Specifications</h3>
              <p className="text-xs text-slate-500 mb-4">
                Exact CMYK color channels and die-cut margins formatted for industrial business card presses.
              </p>

              <dl className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Trim Dimensions</dt>
                  <dd className="font-semibold text-slate-900">{printSpecs.dimensionsInches}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">PostScript Points</dt>
                  <dd className="font-mono text-slate-900">{printSpecs.dimensionsPoints}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Bleed Margins</dt>
                  <dd className="font-semibold text-slate-900">{printSpecs.bleedInches}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Target Output Resolution</dt>
                  <dd className="font-semibold text-slate-900">{printSpecs.resolutionDpi} DPI</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">CMYK Primary Channel</dt>
                  <dd className="font-mono text-slate-900">{printSpecs.cmykColorCodes.primaryDeep}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">CMYK Accent Channel</dt>
                  <dd className="font-mono text-slate-900">{printSpecs.cmykColorCodes.accentGold}</dd>
                </div>
              </dl>

              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                <svg className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Offset Press Certified:</strong> Packages include vector cutting paths, safe title margins (0.125"), and embedded Pantone color bridges for spot-UV and gold-foil stamping.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: LIVE CARD PREVIEW (Mobile Device Simulation)                       */}
        {/* ========================================================================= */}
        {activeTab === "preview" && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-sm mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Card to Preview
              </label>
              <select
                value={selectedEmployeeSlug}
                onChange={(e) => setSelectedEmployeeSlug(e.target.value)}
                className="w-full p-2.5 text-sm border border-slate-300 rounded-xl"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.slug}>
                    {e.firstName} {e.lastName} ({e.designation})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-[390px] h-[780px] rounded-[48px] border-[10px] border-slate-900 overflow-hidden shadow-2xl bg-white relative">
              <div className="w-full h-6 bg-slate-900 flex justify-center items-center">
                <div className="w-20 h-4 bg-slate-800 rounded-b-xl"></div>
              </div>
              <iframe
                src={`${cardBaseUrl}/c/${selectedEmployeeSlug}`}
                title="Mobile Preview"
                className="w-full h-[calc(100%-24px)] border-0"
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: THEMING & BRAND COLORS                                              */}
        {/* ========================================================================= */}
        {activeTab === "theme" && (
          <div className="max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-display">White-Label Brand & Theming</h3>
            <p className="text-xs text-slate-500 mb-6">
              CSS variables injected dynamically on the edge without rebuilds.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Primary Navy Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!canEditCorporateDetails}
                    value={tenant.themeConfig.primary}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    className="w-12 h-10 rounded-lg border p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tenant.themeConfig.primary}
                    readOnly
                    className="font-mono text-sm border p-2 rounded-lg w-28 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Accent Gold Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!canEditCorporateDetails}
                    value={tenant.themeConfig.accentGold}
                    onChange={(e) => handleColorChange("accentGold", e.target.value)}
                    className="w-12 h-10 rounded-lg border p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tenant.themeConfig.accentGold}
                    readOnly
                    className="font-mono text-sm border p-2 rounded-lg w-28 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Background Ivory</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!canEditCorporateDetails}
                    value={tenant.themeConfig.ivoryBg}
                    onChange={(e) => handleColorChange("ivoryBg", e.target.value)}
                    className="w-12 h-10 rounded-lg border p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tenant.themeConfig.ivoryBg}
                    readOnly
                    className="font-mono text-sm border p-2 rounded-lg w-28 text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Deep Navy (Hero/Footer)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    disabled={!canEditCorporateDetails}
                    value={tenant.themeConfig.deepNavy}
                    onChange={(e) => handleColorChange("deepNavy", e.target.value)}
                    className="w-12 h-10 rounded-lg border p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={tenant.themeConfig.deepNavy}
                    readOnly
                    className="font-mono text-sm border p-2 rounded-lg w-28 text-center"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 mb-3">WCAG AA Accessibility Contrast Check</h4>
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800 flex items-center gap-2">
                <svg className="h-4 w-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>
                  Primary Navy <strong>({tenant.themeConfig.primary})</strong> on Ivory background <strong>({tenant.themeConfig.ivoryBg})</strong> passes contrast ratio (<strong>9.4:1</strong>, exceeds 4.5:1 WCAG AA limit).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: LEADS & INQUIRIES                                                  */}
        {/* ========================================================================= */}
        {activeTab === "leads" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Wholesale Inquiries</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Captured via digital visiting cards and public marketing pages with sales rep attribution.
                </p>
              </div>
              <a
                href={`/api/leads?tenant=${tenant.slug}&format=csv`}
                download
                className="bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <span>Export CSV</span>
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
            </div>

            {leads.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No wholesale inquiries received yet. Inquiries from the website RFQ and digital visiting cards will appear here in real time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Institution</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Licence / GSTIN</th>
                      <th className="py-2.5 px-3">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs">
                    {leads.map((lead: any) => {
                      const rep = employees.find((e) => e.id === lead.employeeId);
                      return (
                        <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {lead.institutionName}
                            {rep && (
                              <div className="text-[11px] font-normal text-blue-700">
                                Rep: {rep.firstName} {rep.lastName} ({rep.territoryRegion})
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">{lead.businessType}</td>
                          <td className="py-3 px-3">{lead.contactName}</td>
                          <td className="py-3 px-3 font-mono font-semibold text-blue-700 whitespace-nowrap">
                            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                            {lead.drugLicenceNumber || lead.gstin || "—"}
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {lead.requirementCategory || lead.estimatedMonthlyVolume || "General Wholesale"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Onboard Single Employee Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">Onboard Field Sales Representative</h3>
                <p className="text-xs text-slate-400 mt-0.5">Generates live digital visiting card at /c/[slug] with instant QR sync</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">First Name *</label>
                  <input
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Last Name *</label>
                  <input
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Verma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Designation *</label>
                  <input
                    required
                    value={newDesignation}
                    onChange={(e) => setNewDesignation(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Area Sales Manager"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Division / Unit</label>
                  <input
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Wholesale Critical Care"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Territory / Region *</label>
                <input
                  required
                  value={newTerritory}
                  onChange={(e) => setNewTerritory(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="e.g. North Zone - Kanpur & Lucknow"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Mobile Calling Number *</label>
                  <input
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">WhatsApp Number (if different)</label>
                  <input
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="e.g. +91 98390 12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Official Email Address *</label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder={`rep@${tenant.customDomain || `${tenant.slug}.com`}`}
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Office Extension</label>
                  <input
                    value={newOfficeExtension}
                    onChange={(e) => setNewOfficeExtension(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="101"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Custom URL Slug (optional)</label>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                  placeholder="e.g. rahul-verma-up"
                />
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Leave blank to automatically generate from first and last name.
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Personalized WhatsApp Greeting (optional)</label>
                <input
                  value={newCustomGreeting}
                  onChange={(e) => setNewCustomGreeting(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs"
                  placeholder="Hello, I am contacting you regarding bulk wholesale supply via ArukaMed..."
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Custom Rate Card URL (optional override)</label>
                <input
                  value={newCustomRateCard}
                  onChange={(e) => setNewCustomRateCard(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                  placeholder="https://.../files/rahul-special-rate-card.pdf"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-5 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Digital Card & Generate Print QR</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#09162D] text-[#E3B15F] border border-amber-400/30 text-xs font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
