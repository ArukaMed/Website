"use client";

import React, { useState } from "react";
import type { Employee, EmployeeDocument } from "@aegis/types";

interface DocumentsCardProps {
  employee: Employee;
  onUpdateDocuments: (docs: EmployeeDocument[]) => void;
}

export function DocumentsCard({ employee, onUpdateDocuments }: DocumentsCardProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<any>("Identity Proof");
  const [newFileName, setNewFileName] = useState("");

  const documents = employee.documents || [];

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: EmployeeDocument = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      category: newCategory,
      fileName: newFileName.trim() || `${newTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileUrl: `/docs/${newTitle.toLowerCase().replace(/\s+/g, "_")}.pdf`,
      fileSize: "1.4 MB",
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "Verified",
    };

    onUpdateDocuments([newDoc, ...documents]);
    setIsUploadOpen(false);
    setNewTitle("");
    setNewFileName("");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Employee Document Repository</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely stored KYC identity proofs, educational degrees, prior experience letters, and compliance agreements
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Upload Document</span>
          </button>
        </div>

        {/* Table of Documents */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">File Name & Size</th>
                <th className="py-3 px-4">Uploaded Date</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </span>
                      <span>{doc.title}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {doc.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-800">{doc.fileName}</div>
                    <div className="text-slate-400 text-[10px]">{doc.fileSize || "1.2 MB"}</div>
                  </td>

                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">{doc.uploadedAt}</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        doc.status === "Verified"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.status === "Rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === "Verified"
                            ? "bg-emerald-500"
                            : doc.status === "Rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                      />
                      <span>{doc.status || "Verified"}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => alert(`Opening document preview for: ${doc.title}`)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Initiating download for: ${doc.fileName}`)}
                        className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {documents.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              No employee documents uploaded yet. Click Upload Document to add verified records.
            </div>
          )}
        </div>
      </div>

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Upload Employee Document</h4>
                <p className="text-[11px] text-slate-400">Attach compliance verification records</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Document Title *</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Degree Certificate"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Document Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  <option value="Identity Proof">Identity Proof (Aadhaar / Passport / Voter ID)</option>
                  <option value="Address Proof">Address Proof (Utility Bill / Rent Agreement)</option>
                  <option value="Statutory Tax">Statutory Tax (PAN / Form 16 / PF Slip)</option>
                  <option value="Banking Document">Banking Document (Cancelled Cheque / Passbook)</option>
                  <option value="Education Certificate">Education Certificate (Degree / Marksheet)</option>
                  <option value="Prior Employment">Prior Employment (Relieving / Experience Letter)</option>
                  <option value="Employment Contract">Employment Contract / NDA</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">File Name</label>
                <input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="e.g. BPharm_Degree_Verified.pdf"
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/60">
                <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="font-semibold text-slate-700">Drag & drop scanned PDF or image</div>
                <div className="text-[10px] text-slate-400 mt-1">PDF, PNG, JPG up to 10MB</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold rounded-xl transition-all shadow-sm"
                >
                  Save & Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
