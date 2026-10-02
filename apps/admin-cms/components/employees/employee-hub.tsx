"use client";

import React, { useState, useMemo } from "react";
import type { Employee, UserSession } from "@aegis/types";
import type { ProfileTab, EditCardType } from "./types";
import { OverviewTab } from "./cards/overview-tab";
import { PersonalCards } from "./cards/personal-cards";
import { JobOrgCards } from "./cards/job-org-cards";
import { PayStatutoryCards } from "./cards/pay-statutory-cards";
import { DocumentsCard } from "./cards/documents-card";
import { AssetsCard } from "./cards/assets-card";
import { CardEditModal } from "./modals/card-edit-modal";
import { SteppedEnrollmentWizard } from "./modals/stepped-enrollment-wizard";
import { RevisionHistoryDrawer } from "./drawers/revision-history-drawer";
import { PhotoUploadModal } from "./modals/photo-upload-modal";

interface EmployeeHubProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  selectedEmployeeSlug: string;
  setSelectedEmployeeSlug: (slug: string) => void;
  cardBaseUrl: string;
  tenantSlug: string;
  session: UserSession | null;
  canManageEmployees: boolean;
  canToggleRepStatus: boolean;
  onOpenQRStudio: (slug: string) => void;
  showToast: (msg: string) => void;
}

export function EmployeeHub({
  employees,
  setEmployees,
  selectedEmployeeSlug,
  setSelectedEmployeeSlug,
  cardBaseUrl,
  tenantSlug,
  session,
  canManageEmployees,
  canToggleRepStatus,
  onOpenQRStudio,
  showToast,
}: EmployeeHubProps) {
  // Navigation View: "directory" (table list) vs "profile" (hybrid card-tab detail)
  const [viewMode, setViewMode] = useState<"directory" | "profile">("directory");
  const [activeProfileTab, setActiveProfileTab] = useState<ProfileTab>("overview");

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals & Drawers
  const [isEnrollWizardOpen, setIsEnrollWizardOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [activeEditCard, setActiveEditCard] = useState<EditCardType>(null);

  // Selected Employee Record
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.slug === selectedEmployeeSlug) || employees[0] || null;
  }, [employees, selectedEmployeeSlug]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        (emp.employeeCode && emp.employeeCode.toLowerCase().includes(q)) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.phoneNumber.includes(q) ||
        emp.territoryRegion.toLowerCase().includes(q);

      const matchDept =
        deptFilter === "ALL" ||
        (emp.department || emp.division || "").toLowerCase().includes(deptFilter.toLowerCase());

      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && emp.isActive) ||
        (statusFilter === "INACTIVE" && !emp.isActive) ||
        (statusFilter === "REVIEW" && emp.statutoryStatus === "Pending HR Review");

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchQuery, deptFilter, statusFilter]);

  // Workforce Metrics
  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.isActive).length;
  const pendingReviewCount = employees.filter(
    (e) => e.statutoryStatus === "Pending HR Review" || e.bankAccount?.verificationStatus === "Pending HR Review"
  ).length;
  const totalScans = employees.reduce((acc, e) => acc + (e.scanCount || 0), 0);

  // Toggle Employee Active Status
  const handleToggleStatus = async (empId: string) => {
    if (!canToggleRepStatus) {
      showToast("Access Denied: You do not have permission to alter rep lifecycle status.");
      return;
    }

    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    const nextState = !emp.isActive;

    setEmployees((prev) =>
      prev.map((e) => (e.id === empId ? { ...e, isActive: nextState } : e))
    );

    showToast(
      nextState
        ? `${emp.firstName}'s card and operations profile activated.`
        : `${emp.firstName} offboarded. Public card now reroutes to corporate central desk.`
    );

    try {
      await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          employeeSlug: emp.slug,
          patch: { isActive: nextState },
          auditEntry: {
            category: "Lifecycle",
            field: "Employment Active Status",
            oldValue: emp.isActive ? "Active" : "Deactivated",
            newValue: nextState ? "Active" : "Deactivated",
            status: "Approved",
          },
        }),
      });
    } catch {
      // Local state is already updated
    }
  };

  // Update Photograph (Cloudinary)
  const handleSaveAvatar = async (employeeSlug: string, newAvatarUrl: string | null) => {
    setEmployees((prev) =>
      prev.map((e) => (e.slug === employeeSlug ? { ...e, avatarUrl: newAvatarUrl } : e))
    );

    try {
      await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          employeeSlug,
          patch: { avatarUrl: newAvatarUrl },
          auditEntry: {
            category: "Identity",
            field: "Profile Photograph (Cloudinary)",
            oldValue: currentEmployee?.avatarUrl ? "Photograph Attached" : "None",
            newValue: newAvatarUrl ? "Cloudinary CDN Attached" : "Removed",
            status: "Approved",
          },
        }),
      });
    } catch {
      // Local state is already updated
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (slug: string, name: string) => {
    if (!canManageEmployees) {
      showToast("Access Denied: Only Brand and Super Admins can remove employees.");
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete ${name}? This action cannot be reversed.`)) {
      return;
    }

    setEmployees((prev) => prev.filter((e) => e.slug !== slug));
    if (selectedEmployeeSlug === slug) {
      const remaining = employees.filter((e) => e.slug !== slug);
      setSelectedEmployeeSlug(remaining[0]?.slug || "");
      if (viewMode === "profile" && remaining.length === 0) {
        setViewMode("directory");
      }
    }
    showToast(`Removed employee ${name}`);

    try {
      await fetch(`/api/employees?tenant=${tenantSlug}&employee=${slug}`, {
        method: "DELETE",
      });
    } catch {
      // Local state is already updated
    }
  };

  // Copy Link Helper
  const handleCopyPublicLink = (slug: string, name: string) => {
    const url = `${cardBaseUrl}/${slug}`;
    navigator.clipboard.writeText(url);
    showToast(`Copied ${name}'s digital card link: ${url}`);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* TOP WORKFORCE METRIC SUMMARY CARDS                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Enrolled */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Total Workforce
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Enrolled operations personnel</div>
          </div>
          <div className="p-3 bg-blue-50 text-navy rounded-2xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Active Representatives */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Active Reps
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{activeCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {totalCount > 0 ? `${Math.round((activeCount / totalCount) * 100)}% active coverage` : "No employees"}
            </div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Metric 3: Pending HR Verification */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Pending HR Review
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{pendingReviewCount}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Bank / address revisions</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Metric 4: Total QR Card Scans */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Public QR Scans
            </span>
            <div className="text-2xl font-bold text-navy mt-1">{totalScans}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Visiting card engagements</div>
          </div>
          <div className="p-3 bg-[#E3B15F]/20 text-[#09162D] rounded-2xl">
            <svg className="w-5 h-5 text-amber-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: WORKFORCE DIRECTORY TABLE VIEW                                    */}
      {/* ========================================================================= */}
      {viewMode === "directory" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 max-w-md">
                <svg
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, code, designation, email, zone..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white transition-colors"
                />
              </div>

              {/* Department Filter */}
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Departments</option>
                <option value="Sales">Wholesale Sales & Accounts</option>
                <option value="Operations">Wholesale Operations</option>
                <option value="Compliance">Quality & Regulatory</option>
                <option value="Logistics">Supply Chain & Cold Chain</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Reps Only</option>
                <option value="REVIEW">Pending HR Review</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              {canManageEmployees && (
                <button
                  type="button"
                  onClick={() => setIsEnrollWizardOpen(true)}
                  className="bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Enroll New Employee</span>
                </button>
              )}
            </div>
          </div>

          {/* Directory View: Desktop Table (md+) and Mobile Cards (< md) */}
          {/* 1. Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs table-fixed">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-slate-600 w-[28%]">Employee</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 w-[26%]">Role & Dept</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 w-[18%]">Location</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 w-[18%]">Contact</th>
                  <th className="py-3 px-4 font-semibold text-slate-600 text-right w-[10%]">QR Scans</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  const initials = `${emp.firstName[0] || ""}${emp.lastName[0] || ""}`.toUpperCase();
                  const isInactive = !emp.isActive || emp.employmentStatus === "Deactivated";
                  const isSelected = selectedEmployeeSlug === emp.slug;

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        setSelectedEmployeeSlug(emp.slug);
                        setViewMode("profile");
                      }}
                      className={`group cursor-pointer transition-colors ${
                        isInactive
                          ? "bg-rose-50/70 hover:bg-rose-100/70 border-l-4 border-l-rose-500 text-rose-950"
                          : isSelected
                            ? "bg-blue-50/40 hover:bg-blue-50/70 border-l-4 border-l-[#1B3F73]"
                            : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                      }`}
                      title={`Click to view profile of ${emp.firstName} ${emp.lastName}`}
                    >
                      {/* Column 1: Identity */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#09162D] text-[#E3B15F] flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0 mt-0.5">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 group-hover:text-[#1B3F73] transition-colors flex flex-wrap items-center gap-1.5 break-words">
                              <span>{emp.firstName} {emp.lastName}</span>
                              {emp.pronouns && (
                                <span className="text-[10px] text-slate-400 font-normal shrink-0">({emp.pronouns})</span>
                              )}
                              {isInactive && (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                              <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                {emp.employeeCode || "EMP-10492"}
                              </span>
                              <span className="font-mono text-slate-400 break-all">/{emp.slug}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Role & Dept (Wrapped) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-slate-800 break-words leading-snug">{emp.designation}</div>
                        <div className="text-[11px] text-slate-500 mt-1 break-words leading-relaxed">
                          {emp.department || emp.division || "Wholesale Sales"}
                        </div>
                      </td>

                      {/* Column 3: Location (Wrapped) */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-medium text-slate-800 break-words leading-snug">{emp.workLocation || "Kanpur Central Hub"}</div>
                        <div className="text-[10px] text-slate-500 mt-1 break-words leading-relaxed">{emp.territoryRegion}</div>
                      </td>

                      {/* Column 4: Contact (Wrapped) */}
                      <td className="py-3.5 px-4 align-top font-mono text-[11px]">
                        <div className="text-slate-800 font-semibold break-words">{emp.phoneNumber}</div>
                        <div className="text-slate-500 break-all text-[11px] mt-0.5">{emp.email}</div>
                      </td>

                      {/* Column 5: QR Scans & Navigate Indicator */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="text-right whitespace-nowrap">
                            <div className="font-bold text-slate-900">{emp.scanCount || 0} scans</div>
                            <div className="text-[10px] text-slate-400">{emp.vcardDownloads || 0} vCards</div>
                          </div>
                          <svg
                            className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredEmployees.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No employees matched the query or filter criteria.
              </div>
            )}
          </div>

          {/* 2. Mobile Responsive Card List (< md) */}
          <div className="md:hidden space-y-3">
            {filteredEmployees.map((emp) => {
              const initials = `${emp.firstName[0] || ""}${emp.lastName[0] || ""}`.toUpperCase();
              const isInactive = !emp.isActive || emp.employmentStatus === "Deactivated";
              const isSelected = selectedEmployeeSlug === emp.slug;

              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setSelectedEmployeeSlug(emp.slug);
                    setViewMode("profile");
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm active:scale-[0.99] ${
                    isInactive
                      ? "bg-rose-50/70 border-rose-200 border-l-4 border-l-rose-500 text-rose-950"
                      : isSelected
                        ? "bg-blue-50/40 border-[#1B3F73]/30 border-l-4 border-l-[#1B3F73]"
                        : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60"
                  }`}
                  title={`Click to view profile of ${emp.firstName} ${emp.lastName}`}
                >
                  {/* Top: Avatar, Name, Handle, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-[#09162D] text-[#E3B15F] flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden shrink-0">
                        {emp.avatarUrl ? (
                          <img src={emp.avatarUrl} alt={emp.firstName} className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 flex flex-wrap items-center gap-1.5 break-words">
                          <span>{emp.firstName} {emp.lastName}</span>
                          {emp.pronouns && (
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">({emp.pronouns})</span>
                          )}
                          {isInactive && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200 shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px]">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold shrink-0">
                            {emp.employeeCode || "EMP-10492"}
                          </span>
                          <span className="font-mono text-slate-400 break-all">/{emp.slug}</span>
                        </div>
                      </div>
                    </div>

                    {/* Scans pill and chevron */}
                    <div className="flex items-center gap-1 text-right shrink-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold whitespace-nowrap">
                        {emp.scanCount || 0} scans
                      </span>
                      <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Middle: Role & Dept + Location */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Role & Dept</span>
                      <div className="font-semibold text-slate-800 break-words leading-snug mt-0.5">{emp.designation}</div>
                      <div className="text-[11px] text-slate-500 break-words mt-0.5 leading-snug">
                        {emp.department || emp.division || "Wholesale Sales"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block">Location</span>
                      <div className="font-medium text-slate-800 break-words leading-snug mt-0.5">{emp.workLocation || "Kanpur Central Hub"}</div>
                      <div className="text-[10px] text-slate-500 break-words mt-0.5">{emp.territoryRegion}</div>
                    </div>
                  </div>

                  {/* Bottom: Contact */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>{emp.phoneNumber}</span>
                    </div>
                    <div className="text-slate-500 break-all text-[10px]">
                      {emp.email}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEmployees.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 text-center py-12 text-slate-400">
                No employees matched the query or filter criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: HYBRID CARD-TAB EMPLOYEE PROFILE VIEW                             */}
      {/* ========================================================================= */}
      {viewMode === "profile" && currentEmployee && (
        <div className="space-y-6">
          {/* Top Return Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMode("directory")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-blue-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Workforce Directory</span>
            </button>

            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Switch Employee:</span>
              <select
                value={currentEmployee.slug}
                onChange={(e) => setSelectedEmployeeSlug(e.target.value)}
                className="py-1.5 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-sm"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.slug}>
                    {e.firstName} {e.lastName} ({e.employeeCode || "EMP"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PERSISTENT ANCHOR HEADER                                                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-7 relative">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Identity Snapshot */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                {/* Interactive Avatar with initials fallback and hover camera icon */}
                <div
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="relative group cursor-pointer"
                  title="Click to update employee photograph"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#09162D] text-[#E3B15F] flex items-center justify-center font-bold text-xl sm:text-2xl shadow-md overflow-hidden shrink-0 border-2 border-slate-200 group-hover:border-[#C8963E] transition-all">
                    {currentEmployee.avatarUrl ? (
                      <img src={currentEmployee.avatarUrl} alt={currentEmployee.firstName} className="w-full h-full object-cover" />
                    ) : (
                      <span>
                        {currentEmployee.firstName[0]}
                        {currentEmployee.lastName[0]}
                      </span>
                    )}
                  </div>
                  {/* Hover Camera Overlay */}
                  <div className="absolute inset-0 bg-[#09162D]/75 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <svg className="w-5 h-5 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[9px] font-bold mt-0.5 text-slate-200">Change</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                      {currentEmployee.firstName} {currentEmployee.lastName}
                    </h1>
                    {currentEmployee.pronouns && (
                      <span className="text-xs text-slate-500 font-medium">({currentEmployee.pronouns})</span>
                    )}
                    <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                      {currentEmployee.employeeCode || "EMP-10492"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        currentEmployee.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${currentEmployee.isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <span>{currentEmployee.isActive ? "Active Full-time" : "Deactivated"}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <div className="font-semibold text-slate-900">{currentEmployee.designation}</div>
                    <span>•</span>
                    <div>{currentEmployee.department || currentEmployee.division || "Wholesale Sales"}</div>
                    <span>•</span>
                    <div>Reports to: <span className="font-semibold text-slate-800">{currentEmployee.directManager?.name || "Alex Smith"}</span></div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <div>Location: <span className="font-medium text-slate-700">{currentEmployee.workLocation || "Bengaluru, India"}</span></div>
                    <span>•</span>
                    <div>Joined: <span className="font-medium text-slate-700 font-mono">{currentEmployee.joiningDate || "12 Mar 2023"}</span></div>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{currentEmployee.avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenQRStudio(currentEmployee.slug)}
                  className="px-4 py-2 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span>QR Studio</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHistoryDrawerOpen(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Revision History</span>
                </button>

                {canToggleRepStatus && (
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(currentEmployee.id)}
                    className={`px-3.5 py-2 font-semibold text-xs rounded-xl border transition-colors ${
                      currentEmployee.isActive
                        ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {currentEmployee.isActive ? "Offboard" : "Activate"}
                  </button>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* HYBRID TABS NAVIGATION BAR                                                */}
            {/* ========================================================================= */}
            <div className="flex items-center gap-1 mt-6 pt-5 border-t border-slate-100 overflow-x-auto">
              {[
                { id: "overview", label: "Overview", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
                { id: "personal", label: "Personal", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
                { id: "job-org", label: "Job & Org", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                { id: "pay-statutory", label: "Pay & Statutory", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                { id: "documents", label: "Documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
                { id: "assets", label: "Assets", icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveProfileTab(tab.id as ProfileTab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    activeProfileTab === tab.id
                      ? "bg-[#09162D] text-[#E3B15F] shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                  </svg>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB CONTENT PANELS                                                        */}
          {/* ========================================================================= */}
          {activeProfileTab === "overview" && (
            <OverviewTab
              employee={currentEmployee}
              cardBaseUrl={cardBaseUrl}
              onOpenQRStudio={() => onOpenQRStudio(currentEmployee.slug)}
              onOpenEdit={(type) => setActiveEditCard(type)}
              onOpenHistory={() => setIsHistoryDrawerOpen(true)}
              onCopyLink={() => handleCopyPublicLink(currentEmployee.slug, currentEmployee.firstName)}
            />
          )}

          {activeProfileTab === "personal" && (
            <PersonalCards
              employee={currentEmployee}
              onOpenEdit={(type) => setActiveEditCard(type)}
            />
          )}

          {activeProfileTab === "job-org" && (
            <JobOrgCards
              employee={currentEmployee}
              cardBaseUrl={cardBaseUrl}
              onOpenEdit={(type) => setActiveEditCard(type)}
              onOpenQRStudio={() => onOpenQRStudio(currentEmployee.slug)}
              onCopyLink={() => handleCopyPublicLink(currentEmployee.slug, currentEmployee.firstName)}
            />
          )}

          {activeProfileTab === "pay-statutory" && (
            <PayStatutoryCards
              employee={currentEmployee}
              onOpenEdit={(type) => setActiveEditCard(type)}
            />
          )}

          {activeProfileTab === "documents" && (
            <DocumentsCard
              employee={currentEmployee}
              onUpdateDocuments={(docs) => {
                const updated = { ...currentEmployee, documents: docs };
                setEmployees((prev) =>
                  prev.map((e) => (e.slug === currentEmployee.slug ? updated : e))
                );
                fetch("/api/employees", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tenantSlug,
                    employeeSlug: currentEmployee.slug,
                    patch: { documents: docs },
                  }),
                }).catch(() => {});
                showToast("Documents updated.");
              }}
            />
          )}

          {activeProfileTab === "assets" && (
            <AssetsCard
              employee={currentEmployee}
              onUpdateAssets={(assets) => {
                const updated = { ...currentEmployee, assignedAssets: assets };
                setEmployees((prev) =>
                  prev.map((e) => (e.slug === currentEmployee.slug ? updated : e))
                );
                fetch("/api/employees", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    tenantSlug,
                    employeeSlug: currentEmployee.slug,
                    patch: { assignedAssets: assets },
                  }),
                }).catch(() => {});
                showToast("Assigned hardware assets updated.");
              }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & SLIDE-OVER DRAWERS                                               */}
      {/* ========================================================================= */}

      {/* 7-Step Stepped Enrollment Wizard */}
      <SteppedEnrollmentWizard
        isOpen={isEnrollWizardOpen}
        onClose={() => setIsEnrollWizardOpen(false)}
        tenantSlug={tenantSlug}
        session={session}
        onSuccess={(newEmp) => {
          setEmployees((prev) => [newEmp, ...prev]);
          setSelectedEmployeeSlug(newEmp.slug);
          setViewMode("profile");
        }}
        showToast={showToast}
      />

      {/* Contextual Card Edit Modal */}
      {currentEmployee && activeEditCard && (
        <CardEditModal
          cardType={activeEditCard}
          employee={currentEmployee}
          tenantSlug={tenantSlug}
          session={session}
          onClose={() => setActiveEditCard(null)}
          onSave={(updated) => {
            setEmployees((prev) =>
              prev.map((e) => (e.slug === updated.slug ? updated : e))
            );
          }}
          showToast={showToast}
        />
      )}

      {/* Revision History & Audit Trail Slide-over Drawer */}
      {currentEmployee && (
        <RevisionHistoryDrawer
          isOpen={isHistoryDrawerOpen}
          onClose={() => setIsHistoryDrawerOpen(false)}
          employee={currentEmployee}
        />
      )}

      {/* Cloudinary Photograph Uploader Modal */}
      {currentEmployee && (
        <PhotoUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          employee={currentEmployee}
          onSaveAvatar={handleSaveAvatar}
          showToast={showToast}
        />
      )}
    </div>
  );
}
