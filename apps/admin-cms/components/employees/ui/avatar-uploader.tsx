"use client";

import React, { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { PhotoFrameModal } from "../modals/photo-frame-modal";

interface AvatarUploaderProps {
  currentAvatarUrl?: string | null;
  employeeName?: string;
  onUploadSuccess: (url: string) => void;
  onRemove?: () => void;
  compact?: boolean;
}

export function AvatarUploader({
  currentAvatarUrl,
  employeeName = "Employee",
  onUploadSuccess,
  onRemove,
  compact = false,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Framing modal state
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);
  const [imageToFrame, setImageToFrame] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when parent prop updates
  useEffect(() => {
    setPreviewUrl(currentAvatarUrl || null);
  }, [currentAvatarUrl]);

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validMimes.includes(file.type)) {
      setErrorMsg("Invalid image type. Please select a JPG, PNG, or WEBP file.");
      return;
    }

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("Image size exceeds 10MB limit. Please choose a smaller photo.");
      return;
    }

    // Create local object URL and open framing modal immediately
    const localUrl = URL.createObjectURL(file);
    setImageToFrame(localUrl);
    setIsFrameModalOpen(true);
  };

  const handleOpenCurrentFraming = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) {
      setImageToFrame(previewUrl);
      setIsFrameModalOpen(true);
    }
  };

  const handleFramedConfirm = async (blob: Blob, localPreviewUrl: string) => {
    setPreviewUrl(localPreviewUrl);
    setIsUploading(true);
    setUploadProgress(25);

    const progressTimer = setInterval(() => {
      setUploadProgress((prev) => (prev >= 85 ? prev : prev + 15));
    }, 200);

    try {
      const file = new File([blob], "framed-avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "arukamed/employees");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressTimer);
      setUploadProgress(100);

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload image to Cloudinary");
      }

      setPreviewUrl(data.url);
      setSuccessMsg("Photograph framed and saved successfully to Cloudinary CDN!");
      onUploadSuccess(data.url);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Network error while uploading framed photograph.");
      setPreviewUrl(currentAvatarUrl || null);
    } finally {
      clearInterval(progressTimer);
      setIsUploading(false);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
  };

  const initials = employeeName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      {/* Interactive Photo Framing & Cropping Modal */}
      {isFrameModalOpen && imageToFrame && (
        <PhotoFrameModal
          isOpen={isFrameModalOpen}
          onClose={() => setIsFrameModalOpen(false)}
          imageSrc={imageToFrame}
          employeeName={employeeName}
          onConfirm={handleFramedConfirm}
        />
      )}

      {compact ? (
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={onInputChange}
            className="hidden"
          />

          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-[#09162D] text-[#E3B15F] flex items-center justify-center font-bold text-lg shadow-md overflow-hidden shrink-0 border-2 border-slate-200 group-hover:border-[#C8963E] transition-colors">
              {previewUrl ? (
                <img src={previewUrl} alt={employeeName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials || "EM"}</span>
              )}
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-[#09162D]/80 rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#E3B15F] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#09162D] hover:bg-[#122442] text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{previewUrl ? "Change Photo" : "Upload Photo"}</span>
              </button>

              {previewUrl && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenCurrentFraming}
                    disabled={isUploading}
                    className="px-3 py-1.5 bg-[#C8963E]/15 hover:bg-[#C8963E]/25 text-[#735118] border border-[#C8963E]/40 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    title="Reposition face and adjust zoom in frame"
                  >
                    <svg className="w-3.5 h-3.5 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>Adjust Frame</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemove}
                    disabled={isUploading}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-medium transition-colors"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400">JPG, PNG, or WebP up to 10MB • Auto 1:1 framing</p>
            {errorMsg && <p className="text-[11px] text-rose-600 font-medium">{errorMsg}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={onInputChange}
            className="hidden"
          />

          {/* Drag & Drop Canvas */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-[#C8963E] bg-[#E3B15F]/10 scale-[1.01]"
                : "border-slate-300 hover:border-[#09162D] hover:bg-slate-50/80 bg-slate-50/40"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-3">
              {/* Avatar Preview */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#09162D] text-[#E3B15F] flex items-center justify-center font-bold text-3xl shadow-lg overflow-hidden border-4 border-white shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt={employeeName} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials || "EM"}</span>
                  )}
                </div>

                {/* Corner Badge */}
                <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#C8963E] text-white rounded-xl shadow-md border-2 border-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  <span className="text-[#09162D] underline font-bold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                  Select photo to crop, pan, and center face perfectly in frame
                </p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Supports JPG, PNG, WEBP up to 10MB • Cloudinary CDN
                </p>
              </div>
            </div>

            {/* Upload Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3 p-6 z-10">
                <div className="w-8 h-8 border-3 border-[#09162D] border-t-[#C8963E] rounded-full animate-spin" />
                <div className="w-full max-w-xs space-y-1 text-center">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Uploading framed photo to Cloudinary...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#09162D] to-[#C8963E] h-2 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          {previewUrl && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-600 font-medium">Photograph attached</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenCurrentFraming}
                  disabled={isUploading}
                  className="px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-amber-100/60 border border-[#C8963E]/40 text-[#735118] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>Adjust Frame / Position</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isUploading}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 px-2 py-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
