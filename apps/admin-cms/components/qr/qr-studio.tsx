"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Employee, Tenant } from "@aegis/types";
import {
  renderQrToCanvas,
  generateSvgQr,
  QR_PRESETS,
  QrStylePreset,
  QrModuleShape,
  QrEyeShape,
  getCommercialPrintSpec,
} from "@/lib/qr-engine";

interface QrStudioProps {
  employees: Employee[];
  tenant: Tenant;
  selectedEmployeeSlug: string;
  onSelectEmployeeSlug: (slug: string) => void;
  cardBaseUrl: string;
  showToast: (msg: string) => void;
}

type QrTargetType = "visiting-card" | "company-portal" | "whatsapp" | "custom" | "vcard-offline";

export function QrStudio({
  employees,
  tenant,
  selectedEmployeeSlug,
  onSelectEmployeeSlug,
  cardBaseUrl,
  showToast,
}: QrStudioProps) {
  // Target Selection State
  const [targetType, setTargetType] = useState<QrTargetType>("visiting-card");
  const [customUrl, setCustomUrl] = useState("https://arukamed.com");
  const [customWhatsappMsg, setCustomWhatsappMsg] = useState(
    "Hello, I am interested in wholesale pharmaceutical procurement with ArukaMed."
  );

  // Active employee
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.slug === selectedEmployeeSlug) || employees[0] || null;
  }, [employees, selectedEmployeeSlug]);

  // QR Styling State
  const [activePreset, setActivePreset] = useState<QrStylePreset>("aruka-gold");
  const [darkColor, setDarkColor] = useState(QR_PRESETS["aruka-gold"].darkColor);
  const [lightColor, setLightColor] = useState(QR_PRESETS["aruka-gold"].lightColor);
  const [eyeOuterColor, setEyeOuterColor] = useState(QR_PRESETS["aruka-gold"].eyeOuterColor);
  const [eyeInnerColor, setEyeInnerColor] = useState(QR_PRESETS["aruka-gold"].eyeInnerColor);
  const [moduleShape, setModuleShape] = useState<QrModuleShape>(QR_PRESETS["aruka-gold"].moduleShape);
  const [eyeShape, setEyeShape] = useState<QrEyeShape>(QR_PRESETS["aruka-gold"].eyeShape);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoSource, setLogoSource] = useState<"aruka" | "avatar">("aruka");
  const [margin, setMargin] = useState(2);
  const [previewTab, setPreviewTab] = useState<"qr-only" | "card-mockup" | "print-spec">("qr-only");

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  // Commercial print specs
  const printSpecs = useMemo(() => getCommercialPrintSpec(), []);

  // Compute final QR content payload based on target
  const qrPayload = useMemo(() => {
    if (!currentEmployee) return cardBaseUrl;

    switch (targetType) {
      case "visiting-card":
        return `${cardBaseUrl}/${currentEmployee.slug}`;
      case "company-portal":
        return cardBaseUrl;
      case "whatsapp": {
        const cleanPhone = (currentEmployee.whatsappNumber || currentEmployee.phoneNumber || "").replace(/[^0-9]/g, "");
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customWhatsappMsg)}`;
      }
      case "custom":
        return customUrl.trim() || cardBaseUrl;
      case "vcard-offline": {
        // Direct vCard 3.0 format for offline scanning
        const fullName = `${currentEmployee.firstName} ${currentEmployee.lastName}`.trim();
        return [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${currentEmployee.lastName};${currentEmployee.firstName};;;`,
          `FN:${fullName}`,
          `ORG:${tenant.name}`,
          `TITLE:${currentEmployee.designation}`,
          `TEL;TYPE=WORK,VOICE:${currentEmployee.phoneNumber || ""}`,
          `TEL;TYPE=CELL,VOICE:${currentEmployee.whatsappNumber || currentEmployee.phoneNumber || ""}`,
          `EMAIL;TYPE=PREF,INTERNET:${currentEmployee.email || ""}`,
          `URL:${cardBaseUrl}/${currentEmployee.slug}`,
          "END:VCARD",
        ].join("\n");
      }
      default:
        return `${cardBaseUrl}/${currentEmployee.slug}`;
    }
  }, [targetType, currentEmployee, cardBaseUrl, customWhatsappMsg, customUrl, tenant.name]);

  // Apply Preset
  const handleApplyPreset = (presetKey: QrStylePreset) => {
    setActivePreset(presetKey);
    const p = QR_PRESETS[presetKey];
    setDarkColor(p.darkColor);
    setLightColor(p.lightColor);
    setEyeOuterColor(p.eyeOuterColor);
    setEyeInnerColor(p.eyeInnerColor);
    setModuleShape(p.moduleShape);
    setEyeShape(p.eyeShape);
  };

  // Preload logo image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const src =
      logoSource === "avatar" && currentEmployee?.avatarUrl
        ? currentEmployee.avatarUrl
        : "/assets/logos/askew_line_logo.png";

    img.onload = () => {
      logoImageRef.current = img;
      redrawCanvas();
    };
    img.onerror = () => {
      logoImageRef.current = null;
      redrawCanvas();
    };
    img.src = src;
  }, [logoSource, currentEmployee?.avatarUrl]);

  // Render canvas
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    renderQrToCanvas(
      canvasRef.current,
      {
        url: qrPayload,
        size: 1024,
        margin,
        errorCorrectionLevel: "H",
        darkColor,
        lightColor,
        eyeOuterColor,
        eyeInnerColor,
        moduleShape,
        eyeShape,
        logo: {
          enabled: includeLogo,
          sizeRatio: 0.22,
          backgroundColor: lightColor === "#09162D" ? "#09162D" : "#FFFFFF",
          borderRadius: 24,
        },
      },
      includeLogo ? logoImageRef.current : null
    );
  }, [
    qrPayload,
    margin,
    darkColor,
    lightColor,
    eyeOuterColor,
    eyeInnerColor,
    moduleShape,
    eyeShape,
    includeLogo,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Download High-Res PNG (300 DPI - 2400x2400)
  const handleDownloadPng = async () => {
    try {
      const exportCanvas = document.createElement("canvas");
      renderQrToCanvas(
        exportCanvas,
        {
          url: qrPayload,
          size: 2400, // 300+ DPI commercial resolution
          margin,
          errorCorrectionLevel: "H",
          darkColor,
          lightColor,
          eyeOuterColor,
          eyeInnerColor,
          moduleShape,
          eyeShape,
          logo: {
            enabled: includeLogo,
            sizeRatio: 0.22,
            backgroundColor: lightColor === "#09162D" ? "#09162D" : "#FFFFFF",
            borderRadius: 50,
          },
        },
        includeLogo ? logoImageRef.current : null
      );

      exportCanvas.toBlob((blob) => {
        if (!blob) throw new Error("Could not export PNG");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const slug = currentEmployee ? currentEmployee.slug : "arukamed";
        a.download = `arukamed-qr-${slug}-300dpi.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("High-Resolution 300 DPI PNG downloaded successfully!");
      }, "image/png");
    } catch {
      showToast("Failed to generate PNG download. Please try again.");
    }
  };

  // Download Vector SVG
  const handleDownloadSvg = async () => {
    try {
      const svg = await generateSvgQr({
        url: qrPayload,
        margin,
        errorCorrectionLevel: "H",
        darkColor,
        lightColor,
        eyeOuterColor,
        eyeInnerColor,
        moduleShape,
        eyeShape,
        logo: {
          enabled: includeLogo,
          sizeRatio: 0.22,
        },
      });

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = currentEmployee ? currentEmployee.slug : "arukamed";
      a.download = `arukamed-qr-${slug}-vector.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Vector SVG downloaded for Adobe Illustrator & Figma!");
    } catch {
      showToast("Failed to generate SVG download.");
    }
  };

  // Copy PNG to Clipboard
  const handleCopyPng = async () => {
    try {
      if (!canvasRef.current) return;
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        showToast("QR code copied to clipboard as high-res PNG!");
      });
    } catch {
      showToast("Clipboard copy failed. Use Download PNG instead.");
    }
  };

  // Print Physical Card Trigger
  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-[#09162D] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-[#C8963E]/30">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#E3B15F]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#E3B15F]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Production Vector & Commercial QR Studio</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              Enterprise QR Generator & Card Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Generate scannable visiting card QRs with Reed-Solomon Level-H 30% error correction, custom Pantone brand palettes, central logo cutouts, and industrial 300+ DPI CMYK print standards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-4 py-2.5 bg-[#C8963E] hover:bg-[#b5832f] text-[#09162D] font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download 300 DPI PNG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>Vector SVG</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Controls & Configurations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Target Destination */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">1</span>
                <span>QR Target & Destination</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Level-H (30% Recovery)</span>
            </div>

            {/* Target Type Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "visiting-card", label: "Visiting Card", desc: "Employee clean slug" },
                { id: "company-portal", label: "Company Hub", desc: "connect.arukamed.com" },
                { id: "whatsapp", label: "WhatsApp Direct", desc: "Instant rep inquiry" },
                { id: "vcard-offline", label: "Direct vCard", desc: "Offline address book" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetType(t.id as QrTargetType)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    targetType === t.id
                      ? "border-[#09162D] bg-[#09162D] text-white shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                  }`}
                >
                  <div className="font-bold text-xs">{t.label}</div>
                  <div className={`text-[10px] truncate ${targetType === t.id ? "text-slate-300" : "text-slate-400"}`}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Target Details Dropdown / Inputs */}
            {targetType === "visiting-card" && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Employee Card:
                </label>
                <select
                  value={selectedEmployeeSlug}
                  onChange={(e) => onSelectEmployeeSlug(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#09162D]"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.slug}>
                      {e.firstName} {e.lastName} — {e.designation} ({e.territoryRegion || e.division || "HQ"})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 font-mono">
                  Destination: <span className="text-[#09162D] font-bold">{cardBaseUrl}/{selectedEmployeeSlug}</span>
                </p>
              </div>
            )}

            {targetType === "whatsapp" && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">
                  Pre-filled WhatsApp Message:
                </label>
                <textarea
                  rows={2}
                  value={customWhatsappMsg}
                  onChange={(e) => setCustomWhatsappMsg(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50"
                  placeholder="Enter pre-filled WhatsApp greeting..."
                />
              </div>
            )}

            {targetType === "vcard-offline" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Zero-Connectivity Offline vCard</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  The representative&apos;s contact details (name, phone, email, title, URL) are encoded directly inside the QR code data matrix. Doctors and clients scanning this code can save the contact to iOS / Android without needing mobile data or WiFi.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Brand Styling Presets */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">2</span>
              <span>Aruka Brand Styling & Color Presets</span>
            </h3>

            {/* Presets Grid */}
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(QR_PRESETS) as QrStylePreset[]).map((key) => {
                const preset = QR_PRESETS[key];
                const isActive = activePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleApplyPreset(key)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isActive
                        ? "border-[#C8963E] ring-2 ring-[#C8963E]/30 bg-[#FAF8F5]"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                      {/* Swatch preview pills */}
                      <div className="flex items-center gap-1">
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: preset.darkColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: preset.eyeOuterColor }} />
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: preset.lightColor }} />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{preset.description}</p>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Fine-Tuning */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-800 block">Custom Color Adjustments:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Modules (Dots)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={darkColor}
                      onChange={(e) => {
                        setDarkColor(e.target.value);
                        setActivePreset("aruka-gold");
                      }}
                      className="w-8 h-8 rounded-lg border cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-600 uppercase">{darkColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Corner Eye Ring</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={eyeOuterColor}
                      onChange={(e) => {
                        setEyeOuterColor(e.target.value);
                        setActivePreset("aruka-gold");
                      }}
                      className="w-8 h-8 rounded-lg border cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-600 uppercase">{eyeOuterColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Corner Eye Pip</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={eyeInnerColor}
                      onChange={(e) => {
                        setEyeInnerColor(e.target.value);
                        setActivePreset("aruka-gold");
                      }}
                      className="w-8 h-8 rounded-lg border cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-600 uppercase">{eyeInnerColor}</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-600 block mb-1">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => {
                        setLightColor(e.target.value);
                        setActivePreset("aruka-gold");
                      }}
                      className="w-8 h-8 rounded-lg border cursor-pointer"
                    />
                    <span className="font-mono text-[10px] text-slate-600 uppercase">{lightColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Geometry & Logo Embeds */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">3</span>
              <span>Shape Geometry & Brand Logo Cutout</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Module Shape */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Data Module Shape:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["rounded", "square", "dots"] as QrModuleShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setModuleShape(shape)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        moduleShape === shape
                          ? "bg-[#09162D] text-white border-[#09162D]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Eye Shape */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Corner Eye Shape:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["rounded", "square", "circle"] as QrEyeShape[]).map((shape) => (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setEyeShape(shape)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        eyeShape === shape
                          ? "bg-[#09162D] text-white border-[#09162D]"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Central Logo Toggle */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  id="includeLogo"
                  type="checkbox"
                  checked={includeLogo}
                  onChange={(e) => setIncludeLogo(e.target.checked)}
                  className="w-4 h-4 rounded text-[#09162D] accent-[#09162D] cursor-pointer"
                />
                <label htmlFor="includeLogo" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Embed Center Brand Emblem / Avatar
                </label>
              </div>

              {includeLogo && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLogoSource("aruka")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      logoSource === "aruka"
                        ? "bg-[#09162D] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Aruka Logo
                  </button>

                  {currentEmployee?.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoSource("avatar")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        logoSource === "avatar"
                          ? "bg-[#09162D] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Rep Photo
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Scannable Canvas & Export Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preview Mode Selector */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
            <button
              type="button"
              onClick={() => setPreviewTab("qr-only")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                previewTab === "qr-only"
                  ? "bg-[#09162D] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Scannable QR
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("card-mockup")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                previewTab === "card-mockup"
                  ? "bg-[#09162D] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Visiting Card Mockup
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("print-spec")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                previewTab === "print-spec"
                  ? "bg-[#09162D] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              300 DPI Print Spec
            </button>
          </div>

          {/* TAB 1: SCANNABLE QR CANVAS */}
          {previewTab === "qr-only" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Scannable QR Matrix
                </span>
                <span className="text-[10px] font-mono text-[#C8963E] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Ready to Scan
                </span>
              </div>

              {/* The Live Interactive Canvas */}
              <div className="mx-auto w-64 h-64 sm:w-72 sm:h-72 p-3 bg-white rounded-3xl border-2 border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden group">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-mono break-all text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  {qrPayload}
                </p>
                <p className="text-[11px] text-slate-400">
                  Point any phone camera or barcode scanner at the code above to test.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="px-3.5 py-2.5 bg-[#09162D] hover:bg-[#122442] text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-[#C8963E]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Vector SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPng}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl col-span-2 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy Image to Clipboard</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: VISITING CARD MOCKUP */}
          {previewTab === "card-mockup" && (
            <div className="space-y-4">
              {/* Front of Card */}
              <div className="bg-[#FAF8F5] rounded-3xl p-5 border border-slate-200 shadow-md relative overflow-hidden aspect-[3.5/2.0] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm tracking-wider uppercase text-[#09162D] font-display">
                      {tenant.name}
                    </div>
                    <div className="text-[9px] text-[#C8963E] font-medium tracking-wide">
                      Pharmaceutical Wholesale & Distribution
                    </div>
                  </div>
                  <div className="w-6 h-6">
                    <img src="/assets/logos/askew_line_logo.png" alt="" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4 mt-2">
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm text-[#09162D]">
                      {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : "Representative"}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      {currentEmployee?.designation || "Executive"}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">
                      {currentEmployee?.phoneNumber || "+91 9742626628"} • {currentEmployee?.email || "info@arukamed.com"}
                    </div>
                  </div>

                  {/* QR placement on business card */}
                  <div className="w-16 h-16 p-1 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Back of Card */}
              <div className="bg-[#09162D] rounded-3xl p-5 border border-[#C8963E]/40 shadow-md relative overflow-hidden aspect-[3.5/2.0] flex flex-col items-center justify-center text-center text-white">
                <div className="w-12 h-12 mb-2">
                  <img src="/assets/logos/askew_line_logo.png" alt="" className="w-full h-full object-contain drop-shadow" />
                </div>
                <div className="font-bold text-base font-display text-[#E3B15F] tracking-wide">
                  {tenant.name}
                </div>
                <div className="text-[9px] text-slate-300 max-w-xs mt-1">
                  Verified Institutional Medicine Supplier • B2B Pharmacy Network
                </div>
                <div className="text-[8px] font-mono text-[#C8963E] mt-2">
                  connect.arukamed.com
                </div>
              </div>

              <button
                type="button"
                onClick={handlePrintCard}
                className="w-full py-2.5 bg-[#09162D] hover:bg-[#122442] text-white text-xs font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print Physical Card / Save PDF</span>
              </button>
            </div>
          )}

          {/* TAB 3: INDUSTRIAL 300 DPI SPEC */}
          {previewTab === "print-spec" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm font-display">
                Industrial Offset Print Standards
              </h4>
              <p className="text-xs text-slate-500">
                Exact CMYK color channels and die-cut margins formatted for commercial business card presses.
              </p>

              <dl className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Trim Dimensions</dt>
                  <dd className="font-semibold text-slate-900">{printSpecs.dimensionsInches}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">PostScript Points</dt>
                  <dd className="font-mono text-slate-900">{printSpecs.dimensionsPoints}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Bleed Margins</dt>
                  <dd className="font-semibold text-slate-900">{printSpecs.bleedInches}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Target Resolution</dt>
                  <dd className="font-semibold text-emerald-700">{printSpecs.resolutionDpi} DPI</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Primary Deep Navy</dt>
                  <dd className="font-mono text-slate-900">{printSpecs.cmykColorCodes.primaryDeep}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Accent Gold</dt>
                  <dd className="font-mono text-slate-900">{printSpecs.cmykColorCodes.accentGold}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
