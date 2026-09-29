"use client";

import React, { useState } from "react";

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

  const updateStatus = (id: string, nextStatus: OrderItem["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-[#0E2444] text-white flex items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg text-[#E3B15F]">Aegis-B2B</span>
          <span className="text-xs bg-white/10 px-2.5 py-0.5 rounded text-slate-300">
            Wholesale Operations & Dispatch Portal
          </span>
        </div>
        <div className="text-xs text-slate-300">
          Operator Desk: <strong className="text-white">Central Warehouse A</strong>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Pending Verification</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">1 Order</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Cold Chain Packing</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">1 Order</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 uppercase font-semibold block">Ready for Dispatch</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">1 Order</span>
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
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        ❄️ 2°C - 8°C Active
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
