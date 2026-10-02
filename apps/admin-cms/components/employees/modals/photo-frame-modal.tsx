"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface PhotoFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  employeeName: string;
  onConfirm: (blob: Blob, previewUrl: string) => Promise<void>;
}

const VIEWPORT_SIZE = 320; // 320px viewport for framing
const OUTPUT_SIZE = 800; // 800x800 high-res output for crisp retina rendering

export function PhotoFrameModal({
  isOpen,
  onClose,
  imageSrc,
  employeeName,
  onConfirm,
}: PhotoFrameModalProps) {
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageError, setImageError] = useState<string | null>(null);

  // Framing transform state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [frameShape, setFrameShape] = useState<"circle" | "squircle">("circle");
  const [showGuides, setShowGuides] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);

  // Reset transforms whenever a new image is loaded
  const resetFraming = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }, []);

  // Load image object
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setIsLoadingImage(true);
    setImageError(null);
    resetFraming();

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      setImageElement(img);
      setIsLoadingImage(false);
    };

    img.onerror = () => {
      // Try fallback through local image proxy if direct crossOrigin fails
      if (!imageSrc.startsWith("data:") && !imageSrc.startsWith("blob:") && !imageSrc.includes("/api/image-proxy")) {
        const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(imageSrc)}`;
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "anonymous";
        fallbackImg.onload = () => {
          setImageElement(fallbackImg);
          setIsLoadingImage(false);
        };
        fallbackImg.onerror = () => {
          setImageError("Could not load image for framing. Please select the file again from your device.");
          setIsLoadingImage(false);
        };
        fallbackImg.src = proxyUrl;
      } else {
        setImageError("Could not load image for framing. Please select the file again from your device.");
        setIsLoadingImage(false);
      }
    };

    img.src = imageSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isOpen, imageSrc, resetFraming]);

  if (!isOpen) return null;

  // Base scale calculation so image covers the viewport
  let naturalW = imageElement ? imageElement.naturalWidth : 1;
  let naturalH = imageElement ? imageElement.naturalHeight : 1;
  const isSideways = rotation === 90 || rotation === 270;
  const activeW = isSideways ? naturalH : naturalW;
  const activeH = isSideways ? naturalW : naturalH;

  const baseScale = Math.max(VIEWPORT_SIZE / activeW, VIEWPORT_SIZE / activeH);
  const totalScale = baseScale * zoom;

  // Pointer drag events for panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLoadingImage || imageError) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(1, +(prev * factor).toFixed(2)), 4));
  };

  // Rotate 90 degrees
  const handleRotate = (deg: number) => {
    setRotation((prev) => (prev + deg + 360) % 360);
  };

  // Generate cropped Blob and confirm
  const handleApply = async () => {
    if (!imageElement) return;
    setIsApplying(true);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D canvas context");

      // Fill with clean white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const ratio = OUTPUT_SIZE / VIEWPORT_SIZE;

      ctx.save();
      // Center of canvas
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
      // Pan scaled by ratio
      ctx.translate(pan.x * ratio, pan.y * ratio);
      // Rotation
      ctx.rotate((rotation * Math.PI) / 180);
      // Scaling
      const canvasScale = baseScale * zoom * ratio;
      ctx.scale(canvasScale, canvasScale);

      // Draw image centered
      ctx.drawImage(
        imageElement,
        -imageElement.naturalWidth / 2,
        -imageElement.naturalHeight / 2,
        imageElement.naturalWidth,
        imageElement.naturalHeight
      );
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
      });

      if (!blob) throw new Error("Failed to export image from canvas");

      const previewUrl = URL.createObjectURL(blob);
      await onConfirm(blob, previewUrl);
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to crop and save photograph frame.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-[#09162D] px-6 py-4 text-white flex items-center justify-between border-b border-[#C8963E]/30 relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-[#E3B15F]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg font-display text-white">
                Frame & Position Photograph
              </h2>
              <p className="text-xs text-slate-300">
                Drag to align face, zoom to fit • <span className="text-[#E3B15F] font-medium">{employeeName}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isApplying}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {imageError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
              <p className="text-sm font-semibold text-rose-700">{imageError}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Close & Re-select Photo
              </button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-6 justify-center">
              {/* Interactive Framing Viewport */}
              <div className="flex flex-col items-center">
                <div
                  ref={viewportRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onWheel={handleWheel}
                  style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
                  className="relative rounded-3xl overflow-hidden bg-slate-900 shadow-xl cursor-grab active:cursor-grabbing select-none touch-none border-2 border-slate-700"
                >
                  {/* The Image undergoing 2D transform */}
                  {imageElement && (
                    <div
                      className="absolute will-change-transform pointer-events-none"
                      style={{
                        top: "50%",
                        left: "50%",
                        width: `${imageElement.naturalWidth}px`,
                        height: `${imageElement.naturalHeight}px`,
                        transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg) scale(${totalScale})`,
                        transformOrigin: "center center",
                      }}
                    >
                      <img
                        src={imageElement.src}
                        alt=""
                        className="w-full h-full object-contain pointer-events-none"
                        draggable={false}
                      />
                    </div>
                  )}

                  {/* Framing Mask / Cutout */}
                  <div className="absolute inset-0 pointer-events-none">
                    {frameShape === "circle" ? (
                      <div className="w-full h-full relative">
                        {/* Circular Cutout using Box-Shadow */}
                        <div
                          className="absolute inset-0 rounded-full border-2 border-[#C8963E] shadow-[0_0_0_9999px_rgba(9,22,45,0.78)]"
                          style={{
                            boxShadow: "0 0 0 9999px rgba(9, 22, 45, 0.78)",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        {/* Squircle Cutout */}
                        <div
                          className="absolute inset-4 rounded-3xl border-2 border-[#C8963E]"
                          style={{
                            boxShadow: "0 0 0 9999px rgba(9, 22, 45, 0.78)",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Alignment Guides / Crosshairs */}
                  {showGuides && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Horizontal 1/3 and 2/3 lines */}
                      <div className="absolute top-1/3 left-0 right-0 border-t border-white/25 border-dashed" />
                      <div className="absolute top-2/3 left-0 right-0 border-t border-white/25 border-dashed" />
                      {/* Vertical 1/3 and 2/3 lines */}
                      <div className="absolute left-1/3 top-0 bottom-0 border-l border-white/25 border-dashed" />
                      <div className="absolute left-2/3 top-0 bottom-0 border-l border-white/25 border-dashed" />
                      {/* Center Crosshair */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                        <div className="absolute top-1/2 left-0 right-0 border-t border-[#E3B15F]/80" />
                        <div className="absolute left-1/2 top-0 bottom-0 border-l border-[#E3B15F]/80" />
                      </div>
                    </div>
                  )}

                  {/* Loading Spinner */}
                  {isLoadingImage && (
                    <div className="absolute inset-0 bg-[#09162D]/90 flex flex-col items-center justify-center gap-2 text-white">
                      <div className="w-8 h-8 border-3 border-[#C8963E] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-slate-300">Loading photograph...</span>
                    </div>
                  )}

                  {/* Instruction badge */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] text-white/90 pointer-events-none flex items-center gap-1 font-medium shadow-sm">
                    <svg className="w-3 h-3 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    <span>Click & drag to position face</span>
                  </div>
                </div>

                {/* Viewport Frame Shape & Guide Toggle */}
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFrameShape("circle")}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        frameShape === "circle"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Round Frame (Visiting Card)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameShape("squircle")}
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        frameShape === "squircle"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Card Frame (Admin Hub)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowGuides(!showGuides)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                      showGuides
                        ? "bg-amber-50 border-amber-300 text-amber-800 font-medium"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                    title="Toggle alignment grid"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Grid</span>
                  </button>
                </div>
              </div>

              {/* Side Live Card Simulation & Adjustment Controls */}
              <div className="flex-1 w-full max-w-sm space-y-4">
                {/* Live Card Simulation Box */}
                <div className="bg-[#FAF8F5] border border-amber-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#09162D] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Visiting Card Preview
                    </span>
                    <span className="text-[10px] text-amber-900/70 font-mono">1:1 Frame Sync</span>
                  </div>

                  <div className="flex items-center gap-3.5 bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                    {/* Simulated Visiting Card Avatar */}
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#0C2244] ring-2 ring-[#C8963E] ring-offset-2 ring-offset-[#FAF8F5] shrink-0">
                      {imageElement && (
                        <div
                          className="absolute pointer-events-none"
                          style={{
                            top: "50%",
                            left: "50%",
                            width: `${imageElement.naturalWidth}px`,
                            height: `${imageElement.naturalHeight}px`,
                            transform: `translate(calc(-50% + ${(pan.x * 64) / VIEWPORT_SIZE}px), calc(-50% + ${(pan.y * 64) / VIEWPORT_SIZE}px)) rotate(${rotation}deg) scale(${(totalScale * 64) / VIEWPORT_SIZE})`,
                            transformOrigin: "center center",
                          }}
                        >
                          <img
                            src={imageElement.src}
                            alt=""
                            className="w-full h-full object-contain"
                            draggable={false}
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-[#0C2244] truncate">{employeeName}</p>
                      <p className="text-[11px] text-slate-500 truncate">Visiting Card Header</p>
                      <p className="text-[10px] font-semibold text-[#C8963E]">connect.arukamed.com</p>
                    </div>
                  </div>
                </div>

                {/* Framing Sliders & Buttons */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                  {/* Zoom Slider */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                        </svg>
                        Zoom Level
                      </span>
                      <span className="font-mono text-[#09162D]">{zoom.toFixed(2)}x</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="1"
                        max="3.5"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-[#09162D] cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.1).toFixed(2)))}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 font-bold text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Presets & Rotation Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => handleRotate(90)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Rotate 90°</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetFraming}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
                      </svg>
                      <span>Reset Position</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isApplying}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying || isLoadingImage || !!imageError}
            className="px-6 py-2.5 rounded-xl bg-[#09162D] hover:bg-[#122442] text-white text-xs font-bold shadow-md shadow-slate-900/10 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Applying Frame...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Set in Frame & Apply</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
