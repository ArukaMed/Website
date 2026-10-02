"use client";

import React from "react";
import type { Employee } from "@aegis/types";

interface OverviewTabProps {
  employee: Employee;
  cardBaseUrl: string;
  onOpenQRStudio: () => void;
  onOpenEdit: (type: any) => void;
  onOpenHistory: () => void;
  onCopyLink: () => void;
}

export function OverviewTab({
  employee,
  cardBaseUrl,
  onOpenQRStudio,
  onOpenEdit,
  onOpenHistory,
  onCopyLink,
}: OverviewTabProps) {
  const publicCardUrl = `${cardBaseUrl}/c/${employee.slug}`;

  // Check compliance completeness
  const isBankDone = Boolean(employee.bankAccount?.accountNumber && employee.bankAccount?.routingCode);
  const isPanDone = Boolean(employee.panNumber && employee.panNumber.length >= 10);
  const isAadhaarDone = Boolean(employee.aadhaarNumber && employee.aadhaarNumber.length >= 10);
  const isEmergencyDone = (employee.emergencyContacts?.length || 0) >= 2;
  const isAddressDone = Boolean(employee.currentAddress?.line1 && employee.currentAddress?.city);

  const complianceScore = [isBankDone, isPanDone, isAadhaarDone, isEmergencyDone, isAddressDone].filter(Boolean).length;
  const compliancePercent = Math.round((complianceScore / 5) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner Notice if Pending Review */}
      {employee.statutoryStatus === "Pending HR Review" && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-amber-900 shadow-sm">
          <div className="p-2 bg-amber-100 rounded-xl shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-amber-900 text-sm">HR & Compliance Verification In Progress</div>
            <p className="text-amber-800/90 mt-0.5">
              Some statutory or banking updates are currently pending internal HR review. Changes will officially reflect on the payroll ledger upon verification.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl font-semibold text-xs transition-colors shrink-0"
          >
            View Revision Audit
          </button>
        </div>
      )}

      {/* Grid of Key Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Key Identity & Quick Contact */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-navy rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Key Contact Snapshot</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("contact")}
              className="text-xs text-navy hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Official Phone</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.phoneNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Official Work Email</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Personal Mobile</span>
              <span className="font-mono text-slate-700">{employee.personalPhone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Residential City</span>
              <span className="text-slate-700 font-medium">
                {employee.currentAddress?.city ? `${employee.currentAddress.city}, ${employee.currentAddress.state}` : "Not configured"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Reporting & Organization */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Org & Shift Structure</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("job")}
              className="text-xs text-navy hover:text-blue-800 font-semibold"
            >
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Direct Manager</span>
              <span className="font-semibold text-slate-800">
                {employee.directManager?.name || "Alex Smith (COO)"}
              </span>
              {employee.directManager?.designation && (
                <span className="text-[11px] text-slate-500 block">{employee.directManager.designation}</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Shift Schedule</span>
              <span className="text-slate-800 font-medium">{employee.shiftSchedule || "Standard Shift (09:30 - 18:30 IST)"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Work Location / Hub</span>
              <span className="text-slate-800 font-medium">{employee.workLocation || "Central Logistics Hub"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Work Terms & Notice</span>
              <span className="text-slate-700">
                {employee.employmentType} • {employee.noticePeriodDays || 60} Days Notice
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Digital Visiting Card & Public QR Performance */}
        <div className="bg-gradient-to-br from-[#09162D] to-[#12284E] text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#E3B15F]/20 text-[#E3B15F] rounded-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </span>
                <h3 className="font-bold text-white text-sm">Public QR Card</h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  employee.isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}
              >
                {employee.isActive ? "Live Public Card" : "Card Disabled"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center my-3 bg-white/5 rounded-xl p-2.5 border border-white/10">
              <div>
                <div className="text-lg font-bold text-[#E3B15F]">{employee.scanCount}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">Total Scans</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{employee.vcardDownloads}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">vCards Saved</div>
              </div>
              <div>
                <div className="text-lg font-bold text-emerald-400">{employee.whatsappClicks}</div>
                <div className="text-[10px] text-slate-300 uppercase tracking-wider">WhatsApp</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-300 font-mono truncate bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 mb-3">
              {publicCardUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onCopyLink}
              className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-slate-200 transition-colors text-center"
            >
              Copy Link
            </button>
            <a
              href={publicCardUrl}
              target="_blank"
              rel="noreferrer"
              className="py-1.5 px-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
              title="Open public card"
            >
              ↗
            </a>
            <button
              type="button"
              onClick={onOpenQRStudio}
              className="flex-1 py-1.5 px-2 bg-[#E3B15F] hover:bg-[#c8963e] text-[#09162D] rounded-xl text-xs font-bold transition-colors text-center"
            >
              QR Studio
            </button>
          </div>
        </div>
      </div>

      {/* Second Row: Payroll & Compliance Readiness + IT Assets + Emergency Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Compliance Readiness Gauge */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 text-purple-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Payroll & Statutory Readiness</h3>
            </div>
            <span className="text-xs font-bold font-mono text-purple-700">{compliancePercent}%</span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                compliancePercent === 100 ? "bg-emerald-500" : compliancePercent >= 60 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${compliancePercent}%` }}
            />
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Bank Details & Verification</span>
              <span className={`font-semibold ${isBankDone ? "text-emerald-700" : "text-rose-600"}`}>
                {isBankDone ? "✓ Configured" : "✕ Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tax ID (PAN)</span>
              <span className={`font-semibold ${isPanDone ? "text-emerald-700" : "text-rose-600"}`}>
                {isPanDone ? "✓ PAN Verified" : "✕ Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">National ID (Aadhaar)</span>
              <span className={`font-semibold ${isAadhaarDone ? "text-emerald-700" : "text-rose-600"}`}>
                {isAadhaarDone ? "✓ Aadhaar Linked" : "✕ Missing"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Emergency Contacts</span>
              <span className={`font-semibold ${isEmergencyDone ? "text-emerald-700" : "text-amber-600"}`}>
                {isEmergencyDone ? "✓ 2 Contacts" : `${employee.emergencyContacts?.length || 0}/2 Provided`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Proof of Address</span>
              <span className={`font-semibold ${isAddressDone ? "text-emerald-700" : "text-rose-600"}`}>
                {isAddressDone ? "✓ Address On File" : "✕ Missing"}
              </span>
            </div>
          </div>
        </div>

        {/* IT Assets Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Assigned IT Assets</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{employee.assignedAssets?.length || 0} Assets</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {(employee.assignedAssets || []).slice(0, 3).map((asset) => (
              <div key={asset.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">{asset.assetName}</div>
                  <div className="text-[10px] font-mono text-slate-400">{asset.serialNumber}</div>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {asset.status}
                </span>
              </div>
            ))}
            {(!employee.assignedAssets || employee.assignedAssets.length === 0) && (
              <div className="text-slate-400 text-center py-4">No IT equipment currently assigned.</div>
            )}
          </div>
        </div>

        {/* Emergency Contacts Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Emergency Contacts</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("emergency")}
              className="text-xs text-navy hover:text-blue-800 font-semibold"
            >
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {(employee.emergencyContacts || []).map((c, i) => (
              <div key={c.id || i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800">
                    {c.name}{" "}
                    <span className="font-normal text-slate-500">({c.relationship})</span>
                  </div>
                  {c.isPrimary && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-700 mt-1">{c.primaryPhone}</div>
              </div>
            ))}
            {(!employee.emergencyContacts || employee.emergencyContacts.length === 0) && (
              <div className="text-slate-400 text-center py-4">No emergency contacts recorded yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
