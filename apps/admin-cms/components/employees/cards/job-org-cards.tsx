"use client";

import React from "react";
import type { Employee } from "@aegis/types";

interface JobOrgCardsProps {
  employee: Employee;
  cardBaseUrl: string;
  onOpenEdit: (type: any) => void;
  onOpenQRStudio: () => void;
  onCopyLink: () => void;
}

export function JobOrgCards({
  employee,
  cardBaseUrl,
  onOpenEdit,
  onOpenQRStudio,
  onCopyLink,
}: JobOrgCardsProps) {
  const publicCardUrl = `${cardBaseUrl}/c/${employee.slug}`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Employment Structure */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-navy rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Employment Structure</h3>
                <p className="text-[11px] text-slate-400">Positioning, band/grade, and corporate cost unit</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/60">
                🔴 HR/Ops Locked
              </span>
              <button
                type="button"
                onClick={() => onOpenEdit("job")}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employee ID / Code</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{employee.employeeCode || "EMP-10492"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Official Job Title</span>
              <span className="font-bold text-slate-800">{employee.designation}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Department</span>
              <span className="text-slate-800 font-medium">{employee.department || "Wholesale Operations"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Division / Business Unit</span>
              <span className="text-slate-800 font-medium">{employee.division || "Wholesale Sales & Accounts"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Band / Job Level</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                {employee.bandGrade || "L4 - Senior Operations Lead"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cost Center Code</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] inline-block mt-0.5">
                {employee.costCenter || "CC-OPS-SOUTH"}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">ISO 27001 Access Control Role</span>
                <span className="text-[11px] text-slate-500">Least privilege governance scope & Maker-Checker rules</span>
              </div>
              <span className="font-mono font-bold text-navy bg-blue-50 border border-blue-200/70 px-2.5 py-1 rounded-lg text-xs">
                {employee.slug === "abhishikt" ? "FOUNDER (Full Executive & HR Control)" : "R-EMP (Standard Employee - Self Scope)"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Reporting Lines & Terms */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Reporting & Contract Terms</h3>
                <p className="text-[11px] text-slate-400">Supervisory hierarchy and contractual tenure</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("job")}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Direct Manager</span>
              <span className="font-bold text-slate-900">{employee.directManager?.name || "Alex Smith"}</span>
              <span className="text-[11px] text-slate-500 block">{employee.directManager?.designation || "COO"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Employment Type</span>
              <span className="font-semibold text-slate-800">{employee.employmentType}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date of Joining</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.joiningDate || "2023-03-12"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Confirmation Date</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.confirmationDate || "2023-09-12"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Notice Period</span>
              <span className="text-slate-800 font-semibold">{employee.noticePeriodDays || 60} Days</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Territory / Zone</span>
              <span className="text-amber-800 font-semibold">{employee.territoryRegion}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Work & Shift Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Work & Shift Schedule</h3>
                <p className="text-[11px] text-slate-400">Roster timings, hub location and remote work policy</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("job")}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Standard Shift</span>
              <span className="text-slate-800 font-bold text-sm">{employee.shiftSchedule || "Standard Shift (09:30 AM - 06:30 PM IST)"}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Base Timezone</span>
                <span className="text-slate-800 font-medium font-mono">{employee.timezone || "Asia/Kolkata"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Hub / Office</span>
                <span className="text-slate-800 font-medium">{employee.workLocation || "Bengaluru Regional Hub"}</span>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Remote & WFH Entitlement</span>
              <span className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 block">
                {employee.workFromHomePolicy || "Hybrid Policy: 2 Days remote work eligible per week upon manager approval."}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Public QR Visiting Card Settings */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#E3B15F]/20 text-amber-800 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Digital Card & Public Profile</h3>
                <p className="text-[11px] text-slate-400">Scoped public profile parameters for visiting cards</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("qr-settings")}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">URL Path & QR Slug</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-navy font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex-1 truncate">
                  /c/{employee.slug}
                </span>
                <button
                  type="button"
                  onClick={onCopyLink}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-colors shrink-0"
                >
                  Copy
                </button>
                <a
                  href={publicCardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-semibold text-xs transition-colors shrink-0"
                >
                  Visit ↗
                </a>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Personalized WhatsApp Greeting</span>
              <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs italic mt-0.5">
                {employee.customWhatsappTemplate || "Using company default wholesale template."}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Custom Rate Card PDF</span>
              <span className="text-slate-700 font-mono text-[11px] block mt-0.5 truncate">
                {employee.customRateCardUrl || "Using global ArukaMed catalog."}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 text-xs">High-Resolution Print Assets:</span>
              <button
                type="button"
                onClick={onOpenQRStudio}
                className="bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm"
              >
                Open QR Studio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
