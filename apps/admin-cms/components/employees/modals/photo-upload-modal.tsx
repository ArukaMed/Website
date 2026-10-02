"use client";

import React, { useState } from "react";
import type { Employee } from "@aegis/types";
import { AvatarUploader } from "../ui/avatar-uploader";

interface PhotoUploadModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSaveAvatar: (employeeSlug: string, newAvatarUrl: string | null) => Promise<void>;
  showToast: (msg: string) => void;
}

export function PhotoUploadModal({
  employee,
  isOpen,
  onClose,
  onSaveAvatar,
  showToast,
}: PhotoUploadModalProps) {
  const [stagedAvatarUrl, setStagedAvatarUrl] = useState<string | null>(employee.avatarUrl || null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setStagedAvatarUrl(employee.avatarUrl || null);
    }
  }, [isOpen, employee.avatarUrl]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAvatar(employee.slug, stagedAvatarUrl);
      showToast(
        stagedAvatarUrl
          ? `Updated ${employee.firstName}'s photo across operations & visiting cards.`
          : `Removed photograph for ${employee.firstName}.`
      );
      onClose();
    } catch {
      showToast("Failed to save employee photograph. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Navy & Gold Styling */}
        <div className="bg-[#09162D] px-6 py-5 text-white flex items-center justify-between border-b border-[#C8963E]/30 relative overflow-hidden">
          {/* Subtle gold decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#E3B15F]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10 text-[#E3B15F]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-lg font-display text-white">Employee Photograph</h2>
              <p className="text-xs text-slate-300 font-sans">
                {employee.firstName} {employee.lastName} • <span className="font-mono text-[#E3B15F]">{employee.employeeCode || "EMP-10001"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Cloudinary Uploader */}
          <AvatarUploader
            currentAvatarUrl={stagedAvatarUrl}
            employeeName={`${employee.firstName} ${employee.lastName}`}
            onUploadSuccess={(url) => setStagedAvatarUrl(url)}
            onRemove={() => setStagedAvatarUrl(null)}
          />

          {/* Sync Guarantee Notice */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-start gap-3">
            <span className="p-1.5 bg-[#09162D]/5 text-navy rounded-lg shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </span>
            <div className="text-xs space-y-0.5 text-slate-600">
              <p className="font-semibold text-slate-800">Multi-Channel Instant Synchronization</p>
              <p className="text-[11px] leading-relaxed">
                Saving this photograph will automatically update the representative&apos;s digital visiting card at{" "}
                <span className="font-mono text-navy font-semibold">connect.arukamed.com/{employee.slug}</span> and all internal operations directories.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-[#09162D] hover:bg-[#122442] text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving to Profile...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Save & Apply Photograph</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
