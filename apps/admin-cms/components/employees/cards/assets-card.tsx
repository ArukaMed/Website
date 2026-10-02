"use client";

import React, { useState } from "react";
import type { Employee, AssetRecord } from "@aegis/types";

interface AssetsCardProps {
  employee: Employee;
  onUpdateAssets: (assets: AssetRecord[]) => void;
}

export function AssetsCard({ employee, onUpdateAssets }: AssetsCardProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assetName, setAssetName] = useState("");
  const [category, setCategory] = useState<any>("Laptop");
  const [serialNumber, setSerialNumber] = useState("");

  const assets = employee.assignedAssets || [];

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !serialNumber.trim()) return;

    const newAsset: AssetRecord = {
      id: crypto.randomUUID(),
      assetName: assetName.trim(),
      category,
      serialNumber: serialNumber.trim(),
      assignedDate: new Date().toISOString().split("T")[0],
      status: "Assigned & Active",
    };

    onUpdateAssets([newAsset, ...assets]);
    setIsAssignOpen(false);
    setAssetName("");
    setSerialNumber("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Company Hardware & Physical Assets</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned computing devices, access control badges, and workplace equipment tracked with serial numbers
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAssignOpen(true)}
            className="px-4 py-2 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Assign New Equipment</span>
          </button>
        </div>

        {/* Table of Assets */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset Name & Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Serial Number / Tag</th>
                <th className="py-3 px-4">Date Assigned</th>
                <th className="py-3 px-4">Asset Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <span>{asset.assetName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {asset.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-800">
                    {asset.serialNumber}
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{asset.assignedDate}</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        asset.status === "Assigned & Active"
                          ? "bg-emerald-100 text-emerald-800"
                          : asset.status === "In Maintenance"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          asset.status === "Assigned & Active"
                            ? "bg-emerald-500"
                            : asset.status === "In Maintenance"
                            ? "bg-amber-500"
                            : "bg-slate-500"
                        }`}
                      />
                      <span>{asset.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        const updated = assets.map((a) =>
                          a.id === asset.id
                            ? {
                                ...a,
                                status: (a.status === "Assigned & Active" ? "Returned" : "Assigned & Active") as any,
                              }
                            : a
                        );
                        onUpdateAssets(updated);
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                    >
                      {asset.status === "Assigned & Active" ? "Mark Returned" : "Re-activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {assets.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No hardware assets recorded for this employee. Click Assign New Equipment to track assigned hardware.
            </div>
          )}
        </div>
      </div>

      {/* Assign Asset Modal */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Assign Corporate Equipment</h4>
                <p className="text-[11px] text-slate-400">Log hardware item against employee inventory</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Equipment / Model Name *</label>
                <input
                  required
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  placeholder="e.g. MacBook Pro 14 M3 or ThinkPad T14"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Asset Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  <option value="Laptop">Laptop / Primary Workstation</option>
                  <option value="Monitor">External Monitor / Display</option>
                  <option value="Security Badge">RFID Smart Access Badge / Keycard</option>
                  <option value="Mobile Device">Corporate Mobile Device / Handheld</option>
                  <option value="Access Key">Hardware Security Key (YubiKey)</option>
                  <option value="Other">Other Equipment</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Serial Number / Hardware Tag *</label>
                <input
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. C02G901KMD6T"
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold rounded-xl transition-all shadow-sm"
                >
                  Confirm & Assign Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
