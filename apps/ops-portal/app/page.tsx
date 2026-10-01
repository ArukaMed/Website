"use client";

import React, { useState, useEffect } from "react";
import type { UserSession } from "@aegis/types";

interface OrderItem {
  id: string;
  poNumber: string;
  institution: string;
  gstin: string;
  drugLicence: string;
  status: "SUBMITTED" | "PO_VERIFIED" | "COLD_CHAIN_PACKED" | "DISPATCHED";
  amountINR: number;
  contact: string;
  coldChainRequired: boolean;
  trackingNo?: string;
}

export default function OpsPortalPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: "ord-101",
      poNumber: "PO/2026/0921",
      institution: "Apollo Multispeciality Hospital, Kanpur",
      gstin: "09AABCA1234F1Z8",
      drugLicence: "UP-KNP-20B-998822",
      status: "COLD_CHAIN_PACKED",
      amountINR: 425000,
      contact: "Dr. K. Saxena (+91 98390 11223)",
      coldChainRequired: true,
      trackingNo: "EXP-ARUKA-9921",
    },
    {
      id: "ord-102",
      poNumber: "PO/2026/0924",
      institution: "Apex Medicare & Nursing Home",
      gstin: "09AABCA9876F1Z1",
      drugLicence: "UP-KNP-20B-112233",
      status: "PO_VERIFIED",
      amountINR: 185000,
      contact: "Mr. Rajeev Sinha (+91 94150 44332)",
      coldChainRequired: false,
    },
    {
      id: "ord-103",
      poNumber: "PO/2026/0928",
      institution: "City Care Pharmacy & Surgical",
      gstin: "09AACCC5544Z1Z9",
      drugLicence: "UP-KNP-21B-445566",
      status: "SUBMITTED",
      amountINR: 92000,
      contact: "Alok Kumar (+91 91234 56789)",
      coldChainRequired: true,
    },
  ]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setSession(data.session);
          }
        }
      } catch {
        // Unauthenticated
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.message || "Failed to sign in. Verify your authorized credentials.");
        return;
      }

      setSession(data.session);
      setLoginPassword("");
    } catch {
      setLoginError("Network connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setSession(null);
  };

  const updateStatus = (id: string, nextStatus: OrderItem["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    );
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#071426] flex items-center justify-center text-white">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 rounded-full border-2 border-[#E3B15F] border-t-transparent animate-spin"></div>
          <span className="text-sm font-medium text-slate-300">Verifying secure operations session...</span>
        </div>
      </div>
    );
  }

  // Secure Login Screen for Ops Portal
  if (!session) {
    return (
      <div className="min-h-screen bg-[#071426] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md bg-[#0D2040] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E3B15F]/15 border border-[#E3B15F]/30 text-[#E3B15F] text-[11px] font-bold tracking-wider uppercase mb-3">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Encrypted Operations Portal</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Aruka Med Logistics</h1>
            <p className="text-xs text-slate-400 mt-1">Authorized wholesale dispatch & cold chain control desk</p>
          </div>

          {loginError && (
            <div className="mb-6 rounded-xl bg-red-500/15 border border-red-500/30 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
              <svg className="h-4 w-4 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operator Work Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="name@arukamed.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#09162D] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3B15F] transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">Security Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#E3B15F] hover:text-[#d09f4e] font-medium transition-colors"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your security password"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#09162D] border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#E3B15F] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !loginEmail || !loginPassword}
              className="w-full h-11 mt-2 rounded-xl bg-[#E3B15F] hover:bg-[#d09f4e] text-[#071426] font-bold text-sm transition-all shadow-lg shadow-[#E3B15F]/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-[#071426] border-t-transparent animate-spin"></div>
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Authorize & Access Ops Desk</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Strict statutory access control in compliance with CDSCO Form 20B/21B wholesale drug distribution rules.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-[#0E2444] text-white flex items-center justify-between px-6 border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-[#E3B15F]">Aruka Med</span>
          <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded text-slate-300">
            Wholesale Operations & Dispatch Portal
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-300 hidden sm:block">
            Desk: <strong className="text-white">Central Warehouse A</strong>
          </div>
          <div className="flex items-center gap-2 pl-4 border-l border-white/10">
            <div className="text-right">
              <div className="text-xs font-bold text-white">{session.fullName}</div>
              <div className="text-[10px] text-[#E3B15F] font-mono uppercase">{session.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="Sign Out"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Pending Verification</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {orders.filter((o) => o.status === "SUBMITTED").length} Order
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Cold Chain Packing</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">
              {orders.filter((o) => o.status === "COLD_CHAIN_PACKED").length} Order
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Ready for Dispatch</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">
              {orders.filter((o) => o.status === "PO_VERIFIED").length} Order
            </span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">24h Dispatch SLA</span>
            <span className="text-2xl font-bold text-green-600 mt-1 block">100% On-Time</span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-sm text-slate-900">
              Wholesale Purchase Orders (PO) Queue
            </h2>
            <span className="text-xs text-slate-500">Live statutory compliance check</span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b">
              <tr>
                <th className="py-3 px-4">PO & Date</th>
                <th className="py-3 px-4">Institution & Compliance</th>
                <th className="py-3 px-4">Order Value</th>
                <th className="py-3 px-4">Storage Protocol</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Dispatch Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{ord.poNumber}</div>
                    <div className="text-slate-400 font-mono">{ord.contact}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{ord.institution}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      GSTIN: {ord.gstin} | DL: {ord.drugLicence}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    ₹{ord.amountINR.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-4">
                    {ord.coldChainRequired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        <svg className="h-3.5 w-3.5 text-blue-700 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2" />
                        </svg>
                        <span>2°C - 8°C Active</span>
                      </span>
                    ) : (
                      <span className="text-slate-500">Standard Ambient</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        ord.status === "COLD_CHAIN_PACKED"
                          ? "bg-amber-100 text-amber-800"
                          : ord.status === "PO_VERIFIED"
                          ? "bg-blue-100 text-blue-800"
                          : ord.status === "DISPATCHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {ord.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {ord.status === "SUBMITTED" && (
                      <button
                        onClick={() => updateStatus(ord.id, "PO_VERIFIED")}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                      >
                        Verify Form 20B
                      </button>
                    )}
                    {ord.status === "PO_VERIFIED" && (
                      <button
                        onClick={() => updateStatus(ord.id, "COLD_CHAIN_PACKED")}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
                      >
                        Seal Cold Shipper
                      </button>
                    )}
                    {ord.status === "COLD_CHAIN_PACKED" && (
                      <button
                        onClick={() => updateStatus(ord.id, "DISPATCHED")}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                      >
                        Generate Airway Bill
                      </button>
                    )}
                    {ord.status === "DISPATCHED" && (
                      <span className="text-slate-400 font-mono">
                        Consignment #{ord.trackingNo || "DISPATCHED"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

