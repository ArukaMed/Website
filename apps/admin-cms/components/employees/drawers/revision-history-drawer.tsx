"use client";

import React from "react";
import type { Employee } from "@aegis/types";

interface RevisionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
}

export function RevisionHistoryDrawer({
  isOpen,
  onClose,
  employee,
}: RevisionHistoryDrawerProps) {
  if (!isOpen) return null;

  const history = employee.revisionHistory || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-navy rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-base">Revision & Audit Footprint</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable ledger of records modified for {employee.firstName} {employee.lastName} ({employee.employeeCode})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {history.map((entry, index) => (
            <div
              key={entry.id || index}
              className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {entry.category} • {entry.field}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    entry.status === "Approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : entry.status === "Rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {entry.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">Previous Value</span>
                  <span className="text-slate-600 line-through truncate block">{entry.oldValue || "None"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-sans block">New Value</span>
                  <span className="text-emerald-700 font-bold truncate block">{entry.newValue}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <span className="font-semibold text-slate-800">{entry.editorName}</span>
                  <span className="text-slate-400">({entry.editorRole})</span>
                </div>
                <span>{entry.timestamp}</span>
              </div>
            </div>
          ))}

          {history.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <div>No revision logs found for this employee yet.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
          <p className="text-[11px] text-slate-400">
            Audit logs are timestamped in IST and preserved for corporate compliance & statutory reporting.
          </p>
        </div>
      </div>
    </div>
  );
}
