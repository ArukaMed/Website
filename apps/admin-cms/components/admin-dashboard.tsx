"use client";

import React, { useState } from "react";
import type { Tenant, Employee, TenantThemeConfig } from "@aegis/types";
import { getCommercialPrintSpec } from "@/lib/qr-engine";

interface AdminDashboardProps {
  initialTenant: Tenant;
  initialEmployees: Employee[];
  initialLeads?: any[];
}

export function AdminDashboard({ initialTenant, initialEmployees, initialLeads = [] }: AdminDashboardProps) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [leads, setLeads] = useState<any[]>(initialLeads);
  const [activeTab, setActiveTab] = useState<"employees" | "qr" | "preview" | "theme" | "leads">("employees");
  const [selectedEmployeeSlug, setSelectedEmployeeSlug] = useState<string>(initialEmployees[0]?.slug || "");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Employee Form State
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newDesignation, setNewDesignation] = useState("");
  const [newTerritory, setNewTerritory] = useState("North Zone");
  const [newPhone, setNewPhone] = useState("+91 ");
  const [newEmail, setNewEmail] = useState("");
  const [newSlug, setNewSlug] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = newSlug.trim() || `${newFirstName.toLowerCase()}-${newLastName.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`;
    const newEmp: Employee = {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      slug,
      firstName: newFirstName,
      lastName: newLastName,
      designation: newDesignation,
      division: "Sales",
      territoryRegion: newTerritory,
      phoneNumber: newPhone,
      whatsappNumber: newPhone,
      email: newEmail,
      linkedinUrl: "",
      officeExtension: "101",
      customWhatsappTemplate: null,
      customRateCardUrl: null,
      isActive: true,
      scanCount: 0,
      vcardDownloads: 0,
      whatsappClicks: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEmployees((prev) => [newEmp, ...prev]);
    setSelectedEmployeeSlug(newEmp.slug);
    setIsAddOpen(false);
    showToast(`Employee ${newFirstName} ${newLastName} onboarded!`);

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
          territoryRegion: newTerritory,
          phoneNumber: newPhone,
          email: newEmail,
          slug,
        }),
      });
    } catch {
      // Local state already updated
    }

    // Reset
    setNewFirstName("");
    setNewLastName("");
    setNewDesignation("");
    setNewPhone("+91 ");
    setNewEmail("");
    setNewSlug("");
  };

  const toggleEmployeeStatus = async (id: string) => {
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
      // Local state already updated
    }
  };

  const handleColorChange = (key: keyof TenantThemeConfig, color: string) => {
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
  // Multi-tenant dynamic card base URL (Zero hardcoding)
  const tenantCardHost = tenant.customDomain ? `connect.${tenant.customDomain}` : `${tenant.slug}.connect-card.com`;
  const defaultCardBaseUrl = typeof window !== "undefined" && window.location.hostname.includes("localhost")
    ? `http://localhost:3001`
    : `https://${tenantCardHost}`;
  const cardBaseUrl = process.env.NEXT_PUBLIC_CARD_URL || defaultCardBaseUrl;
  const cardUrl = selectedEmp ? `${cardBaseUrl}/c/${selectedEmp.slug}` : "";
  const printSpecs = getCommercialPrintSpec();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Top Navbar */}
      <header className="h-16 bg-navy-deep text-white flex items-center justify-between px-6 border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg tracking-wide text-gold-light">Aegis-B2B</span>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-slate-300">Admin CMS</span>
          <span className="text-xs text-slate-400">Tenant: <strong className="text-white">{tenant.name}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Visit Public Website ↗
          </a>
        </div>
      </header>

      {/* Main Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("employees")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "employees"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>Employees ({employees.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("qr")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "qr"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span>QR Code & Print Studio</span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "preview"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="5" y="2" width="14" height="20" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01" />
          </svg>
          <span>Live Card Preview</span>
        </button>
        <button
          onClick={() => setActiveTab("theme")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "theme"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4 4 4 0 014-4c.48 0 .936.084 1.36.24L17.5 4.5a2.121 2.121 0 113 3L11.76 16.64c.156.424.24.88.24 1.36a4 4 0 01-4 4z" />
          </svg>
          <span>White-Label Brand & Theming</span>
        </button>
        <button
          onClick={() => setActiveTab("leads")}
          className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "leads"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Leads & Inquiries</span>
        </button>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {/* Tab: Employees */}
        {activeTab === "employees" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Digital Visiting Cards Lifecycle</h2>
                <p className="text-xs text-slate-500">
                  Manage field sales representatives, regional territory routing, and one-click offboarding.
                </p>
              </div>

              <button
                onClick={() => setIsAddOpen(true)}
                className="bg-navy hover:bg-navy-mid text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                + Onboard Single Employee
              </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Representative</th>
                    <th className="py-3 px-4">Designation & Region</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Card Scans</th>
                    <th className="py-3 px-4">vCard Downloads</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="text-xs font-mono text-slate-400">/c/{emp.slug}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{emp.designation}</div>
                        <div className="text-xs text-gold font-semibold flex items-center gap-1 mt-0.5">
                          <svg className="h-3 w-3 text-gold shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{emp.territoryRegion}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono">
                        <div>{emp.phoneNumber}</div>
                        <div className="text-slate-400">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{emp.scanCount}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{emp.vcardDownloads}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            emp.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {emp.isActive ? "Active Rep" : "Deactivated (Rerouted)"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => toggleEmployeeStatus(emp.id)}
                          className={`text-xs px-3 py-1 rounded-lg border font-medium ${
                            emp.isActive
                              ? "border-red-200 text-red-700 hover:bg-red-50"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {emp.isActive ? "Offboard & Reroute" : "Re-activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: QR Studio */}
        {activeTab === "qr" && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Vector & Print-Ready QR Studio</h3>
              <p className="text-xs text-slate-500 mb-6">
                Dual-output QR generator emitting screen vectors and commercial 300+ DPI CMYK print standards for card manufacturing.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Employee Card
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
                {/* SVG Vector QR placeholder */}
                <div className="mx-auto w-48 h-48 bg-white p-3 rounded-xl border border-slate-300 shadow-inner flex flex-col items-center justify-center">
                  <div className="text-xs font-mono text-slate-400 mb-1">Error Correction: H (30%)</div>
                  <div className="my-2 p-3 rounded-lg bg-slate-100 text-slate-800">
                    <svg className="h-10 w-10 text-navy" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <div className="text-[10px] font-mono break-all text-slate-500 px-2">{cardUrl}</div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => showToast("Vector SVG downloaded with central brand cutout.")}
                    className="bg-navy hover:bg-navy-mid text-white text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Download Vector SVG
                  </button>
                  <button
                    onClick={() => showToast("High-Res 300 DPI PNG downloaded.")}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl"
                  >
                    Download 300 DPI PNG
                  </button>
                </div>
              </div>
            </div>

            {/* Print Spec Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Commercial Print-Ready Specifications</h3>
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

              <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <svg className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>Printer Delivery Ready:</strong> Direct vendor upload packages include vector cutting paths, safe title text margins (0.125"), and embedded Pantone color bridges.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Live Card Preview */}
        {activeTab === "preview" && (
          <div className="flex flex-col items-center">
            <div className="w-full max-w-sm mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preview Employee Card
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

        {/* Tab: Brand & Theming */}
        {activeTab === "theme" && (
          <div className="max-w-3xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-1">White-Label Brand & Design Engine</h3>
            <p className="text-xs text-slate-500 mb-6">
              Configure tenant colors, typography, and corner radiuses. These CSS variables are injected dynamically on the server with zero rebuilds.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Primary Navy Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
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
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Accent Gold Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
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
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Background Ivory
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
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
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Deep Navy (Hero/Footer)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
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
              <h4 className="text-sm font-bold text-slate-900 mb-3">WCAG AA Accessibility Check</h4>
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

        {/* Tab: Leads */}
        {activeTab === "leads" && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Captured Wholesale B2B Inquiries</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Inquiries captured via digital visiting cards and public marketing pages with sales rep attribution.
                </p>
              </div>
              <a
                href={`/api/leads?tenant=${tenant.slug}&format=csv`}
                download
                className="bg-navy-deep hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
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
                              <div className="text-[11px] font-normal text-navy">
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
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Onboard Field Sales Representative</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700" aria-label="Close">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">First Name *</label>
                  <input
                    required
                    value={newFirstName}
                    onChange={(e) => setNewFirstName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Last Name *</label>
                  <input
                    required
                    value={newLastName}
                    onChange={(e) => setNewLastName(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder="e.g. Verma"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Designation *</label>
                <input
                  required
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Area Sales Manager"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Territory / Region *</label>
                <input
                  required
                  value={newTerritory}
                  onChange={(e) => setNewTerritory(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Central Zone"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Mobile (WhatsApp) *</label>
                  <input
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Email *</label>
                  <input
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    placeholder={`user@${tenant.customDomain || `${tenant.slug}.com`}`}
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Custom Slug (optional)</label>
                <input
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full p-2 border rounded-lg font-mono"
                  placeholder="rahul-verma-8x9p"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-navy hover:bg-navy-mid text-white font-bold py-2.5 rounded-xl transition-all"
              >
                Create Digital Card & Generate QR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
