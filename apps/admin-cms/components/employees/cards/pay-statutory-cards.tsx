"use client";

import React, { useState } from "react";
import type { Employee } from "@aegis/types";

interface PayStatutoryCardsProps {
  employee: Employee;
  onOpenEdit: (type: any) => void;
}

export function PayStatutoryCards({ employee, onOpenEdit }: PayStatutoryCardsProps) {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [showFullAadhaar, setShowFullAadhaar] = useState(false);

  const rawAccount = employee.bankAccount?.accountNumber || "50100293847192";
  const maskedAccount =
    rawAccount.length > 4 ? `•••• •••• ${rawAccount.slice(-4)}` : rawAccount;

  const rawAadhaar = employee.aadhaarNumber || "XXXX-XXXX-8921";
  const maskedAadhaar =
    rawAadhaar.length > 4 ? `•••• •••• ${rawAadhaar.slice(-4)}` : rawAadhaar;

  const salary = employee.salaryStructure || {
    baseAnnualINR: 1800000,
    monthlyGrossINR: 150000,
    variableAnnualINR: 300000,
    currency: "INR",
  };

  return (
    <div className="space-y-6">
      {/* Payroll Freeze Window Notice */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-blue-900 shadow-sm">
        <div className="p-2 bg-blue-100 rounded-xl shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 text-xs">
          <div className="font-bold text-blue-900 text-sm">Monthly Payroll Cut-off & Security Window</div>
          <p className="text-blue-800/90 mt-0.5">
            Salary disbursements are processed based on verified banking and statutory records. Updates made between the 22nd and the last day of the month take effect starting the 1st of next month to prevent payroll disruption.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Statutory & Tax Identifiers */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Statutory & Tax Identification</h3>
                <p className="text-[11px] text-slate-400">Government compliance IDs, PF UAN and tax regime</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {employee.statutoryStatus || "Verified"}
              </span>
              <button
                type="button"
                onClick={() => onOpenEdit("statutory")}
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
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Income Tax PAN</span>
              <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                {employee.panNumber || "ABCDE1234F"}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">✓ Verified with NSDL</span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">National ID (Aadhaar)</span>
                <button
                  type="button"
                  onClick={() => setShowFullAadhaar(!showFullAadhaar)}
                  className="text-[10px] text-blue-600 hover:underline"
                >
                  {showFullAadhaar ? "Mask" : "Reveal"}
                </button>
              </div>
              <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">
                {showFullAadhaar ? rawAadhaar : maskedAadhaar}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Masked PII</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Provident Fund (UAN)</span>
              <span className="font-mono text-slate-800 font-semibold">{employee.providentFundUan || "100982341902"}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">ESIC Number</span>
              <span className="font-mono text-slate-700">{employee.esicNumber || "Exempt / Above Threshold"}</span>
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Elected Income Tax Regime</span>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">{employee.taxRegime || "New Tax Regime (115BAC)"}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Concessional tax slab rates with standard deduction</p>
                </div>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  FY 2026-27 Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Banking & Salary Disbursement */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Banking & Salary Disbursement</h3>
                <p className="text-[11px] text-slate-400">Direct deposit destination for automated payroll</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                {employee.bankAccount?.verificationStatus || "Penny-Drop Verified"}
              </span>
              <button
                type="button"
                onClick={() => onOpenEdit("banking")}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-navy border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Edit</span>
              </button>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">Bank Name</span>
                  <span className="font-bold text-slate-900 text-sm">{employee.bankAccount?.bankName || "HDFC Bank Ltd"}</span>
                </div>
                <span className="text-[10px] font-semibold bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded">
                  {employee.bankAccount?.accountType || "Salary Account"}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[9px] uppercase font-semibold">Account Holder Name</span>
                <span className="font-semibold text-slate-800">
                  {employee.bankAccount?.accountHolderName || `${employee.firstName} ${employee.lastName}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 block text-[9px] uppercase font-semibold">Account Number</span>
                    <button
                      type="button"
                      onClick={() => setShowFullAccount(!showFullAccount)}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      {showFullAccount ? "Mask" : "Reveal"}
                    </button>
                  </div>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {showFullAccount ? rawAccount : maskedAccount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-semibold">IFSC / Routing Code</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {employee.bankAccount?.routingCode || "HDFC0001234"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <span className="flex items-center gap-1">
                <span>📎 Cancelled Cheque / Statement:</span>
                <span className="font-semibold text-navy underline cursor-pointer">View Attachment</span>
              </span>
              <span className="text-emerald-700 font-semibold">✓ Name Matched (100%)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Compensation Summary */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Compensation & CTC Overview</h3>
                <p className="text-[11px] text-slate-400">Strictly confidential salary & performance variable</p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/60">
              🔒 HR/Finance Only
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center my-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Annual Base CTC</div>
              <div className="text-base font-bold text-slate-900 mt-1">
                ₹{(salary.baseAnnualINR || 1800000).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Monthly Gross</div>
              <div className="text-base font-bold text-navy mt-1">
                ₹{(salary.monthlyGrossINR || 150000).toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase">Annual Variable</div>
              <div className="text-base font-bold text-emerald-700 mt-1">
                ₹{(salary.variableAnnualINR || 300000).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 mt-4 border-t border-slate-100 pt-3">
            <div className="flex justify-between">
              <span>Provident Fund (Employer Share):</span>
              <span className="font-semibold text-slate-800">12% of Basic + DA</span>
            </div>
            <div className="flex justify-between">
              <span>Group Medical Cover (GMC):</span>
              <span className="font-semibold text-slate-800">₹5,00,000 Corporate Cover</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Cycle:</span>
              <span className="font-semibold text-slate-800">Last Working Day of Each Month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Dependents & Nominee Beneficiaries */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dependents & Insurance Nominees</h3>
                <p className="text-[11px] text-slate-400">GMC health coverage and statutory terminal benefits</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {(employee.dependents || []).map((dep, dIdx) => (
              <div key={dep.id || dIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">
                    {dep.name}{" "}
                    <span className="font-normal text-slate-500">({dep.relationship})</span>
                  </div>
                  <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                    {dep.nomineeAllocationPercent}% Nominee Share
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex items-center justify-between">
                  <span>Coverage: {dep.benefitType}</span>
                  {dep.dateOfBirth && <span>DOB: {dep.dateOfBirth}</span>}
                </div>
              </div>
            ))}

            {(!employee.dependents || employee.dependents.length === 0) && (
              <div className="text-slate-400 text-center py-6">
                No insurance nominees or dependents configured.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
