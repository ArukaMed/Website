"use client";

import React from "react";
import type { Employee } from "@aegis/types";

interface PersonalCardsProps {
  employee: Employee;
  onOpenEdit: (type: any) => void;
}

export function PersonalCards({ employee, onOpenEdit }: PersonalCardsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Contact Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-navy rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Contact Information</h3>
                <p className="text-[11px] text-slate-400">Direct calling & electronic dispatch endpoints</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("contact")}
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
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Personal Mobile</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.personalPhone || "—"}</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">🟢 Self-Service Editable</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Official Work Mobile</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.phoneNumber}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Configured on Visiting Card</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Personal Email</span>
              <span className="font-mono text-slate-800 font-semibold truncate block">{employee.personalEmail || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Official Work Email</span>
              <span className="font-mono text-slate-800 font-semibold truncate block">{employee.email}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Alternate Phone</span>
              <span className="font-mono text-slate-700">{employee.alternatePhone || "—"}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Internal Extension</span>
              <span className="font-mono text-slate-700 font-semibold">{employee.officeExtension || "101"}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Emergency Contacts</h3>
                <p className="text-[11px] text-slate-400">Minimum 2 verified contacts for occupational safety</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("emergency")}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {(employee.emergencyContacts || []).map((c, idx) => (
              <div key={c.id || idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>{c.name}</span>
                    <span className="text-[11px] font-normal text-slate-500">({c.relationship})</span>
                  </div>
                  {c.isPrimary && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                      Primary Contact
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] mt-2 font-mono text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-sans">Primary Phone</span>
                    {c.primaryPhone}
                  </div>
                  {c.secondaryPhone && (
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase font-sans">Secondary Phone</span>
                      {c.secondaryPhone}
                    </div>
                  )}
                </div>
                {c.address && (
                  <div className="mt-2 text-[11px] text-slate-600 border-t border-slate-200/60 pt-1.5">
                    <span className="text-slate-400 font-sans text-[9px] uppercase block">Address</span>
                    {c.address}
                  </div>
                )}
              </div>
            ))}

            {(!employee.emergencyContacts || employee.emergencyContacts.length === 0) && (
              <div className="text-slate-400 text-center py-6">
                No emergency contacts added yet. Click Edit to add contacts.
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Residential Address */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Residential Addresses</h3>
                <p className="text-[11px] text-slate-400">Current residence & permanent domicile verification</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                🟡 Needs HR Review
              </span>
              <button
                type="button"
                onClick={() => onOpenEdit("address")}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {/* Current Address */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs">Current / Present Address</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  ✓ Verified via Utility Proof
                </span>
              </div>
              <div className="text-slate-700 font-medium">
                {employee.currentAddress?.line1}
                {employee.currentAddress?.line2 ? `, ${employee.currentAddress.line2}` : ""}
              </div>
              <div className="text-slate-500 mt-0.5">
                {employee.currentAddress?.city}, {employee.currentAddress?.state} - {employee.currentAddress?.pincode},{" "}
                {employee.currentAddress?.country || "India"}
              </div>
              {employee.currentAddress?.proofDocumentName && (
                <div className="mt-2 text-[10px] text-navy font-semibold flex items-center gap-1">
                  <span>📎 Attached Proof:</span>
                  <span className="underline">{employee.currentAddress.proofDocumentName}</span>
                </div>
              )}
            </div>

            {/* Permanent Address */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-900 text-xs">Permanent / Legal Domicile</span>
                {employee.permanentAddress?.sameAsCurrent && (
                  <span className="text-[10px] text-slate-500 font-mono">(Same as current)</span>
                )}
              </div>
              <div className="text-slate-700 font-medium">
                {employee.permanentAddress?.line1 || employee.currentAddress?.line1}
              </div>
              <div className="text-slate-500 mt-0.5">
                {employee.permanentAddress?.city || employee.currentAddress?.city},{" "}
                {employee.permanentAddress?.state || employee.currentAddress?.state} -{" "}
                {employee.permanentAddress?.pincode || employee.currentAddress?.pincode}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Primary Identity & Bio */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Identity & Bio</h3>
                <p className="text-[11px] text-slate-400">Demographic details, language proficiencies & profile summary</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenEdit("identity")}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Date of Birth</span>
                <span className="text-slate-800 font-semibold">{employee.dateOfBirth || "1991-08-24"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Gender</span>
                <span className="text-slate-800 font-semibold">{employee.gender || "Male"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Marital Status</span>
                <span className="text-slate-800 font-semibold">{employee.maritalStatus || "Married"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nationality</span>
                <span className="text-slate-800 font-semibold">{employee.nationality || "Indian"}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Professional Bio</span>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                {employee.bio || "No summary added."}
              </p>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Key Core Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {(employee.skills || []).map((skill, sIdx) => (
                  <span key={sIdx} className="bg-slate-100 text-slate-800 font-semibold text-[11px] px-2.5 py-1 rounded-lg">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Languages Spoken</span>
              <div className="flex gap-2 text-slate-700">
                {(employee.languages || ["English", "Hindi"]).map((lang, lIdx) => (
                  <span key={lIdx} className="text-xs font-medium">
                    • {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
