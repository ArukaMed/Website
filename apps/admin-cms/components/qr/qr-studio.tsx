"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Employee, Tenant } from "@aegis/types";
import {
  renderQrToCanvas,
  generateSvgQr,
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
type QrMode = "simple" | "custom";

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
  const [customUrl, setCustomUrl] = useState("https://google.com");
  const [customWhatsappMsg, setCustomWhatsappMsg] = useState(
    "Hello, I am interested in wholesale pharmaceutical procurement with ArukaMed."
  );

  // Active employee
  const currentEmployee = useMemo(() => {
    return employees.find((e) => e.slug === selectedEmployeeSlug) || employees[0] || null;
  }, [employees, selectedEmployeeSlug]);

  // QR Mode: Simple vs Custom Styled
  const [qrMode, setQrMode] = useState<QrMode>("simple");

  // Direct QR Customization Tools
  const [transparentBg, setTransparentBg] = useState(true);
  const [darkColor, setDarkColor] = useState("#000000");
  const [lightColor, setLightColor] = useState("#FFFFFF");
  const [customEyeColors, setCustomEyeColors] = useState(false);
  const [eyeOuterColor, setEyeOuterColor] = useState("#C8963E");
  const [eyeInnerColor, setEyeInnerColor] = useState("#09162D");

  const [moduleShape, setModuleShape] = useState<QrModuleShape>("square");
  const [eyeShape, setEyeShape] = useState<QrEyeShape>("square");
  const [margin, setMargin] = useState(2);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<"L" | "M" | "Q" | "H">("M");

  // Center Logo
  const [includeLogo, setIncludeLogo] = useState(false);
  const [logoSource, setLogoSource] = useState<"aruka" | "avatar" | "custom">("aruka");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview Tabs
  const [previewTab, setPreviewTab] = useState<"qr-only" | "card-template" | "print-spec">("qr-only");

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardCanvasRef = useRef<HTMLCanvasElement>(null);
  const logoImageRef = useRef<HTMLImageElement | null>(null);

  // Commercial print specs
  const printSpecs = useMemo(() => getCommercialPrintSpec(), []);

  // Custom Logo Upload Handler
  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCustomLogoUrl(dataUrl);
        setLogoSource("custom");
        setIncludeLogo(true);
        showToast("Custom logo loaded for center of QR code!");
      };
      reader.readAsDataURL(file);
    }
  };

  // Compute final QR content payload based on target
  const qrPayload = useMemo(() => {
    if (targetType === "custom") {
      const trimmed = customUrl.trim();
      if (!trimmed) return "https://google.com";
      if (!/^[a-zA-Z]+:\/\//.test(trimmed) && !trimmed.startsWith("mailto:") && !trimmed.startsWith("tel:")) {
        return `https://${trimmed}`;
      }
      return trimmed;
    }

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
      case "vcard-offline": {
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

  // Mode Switch Handlers
  const handleSetSimpleMode = () => {
    setQrMode("simple");
    setDarkColor("#000000");
    setTransparentBg(true);
    setCustomEyeColors(false);
    setModuleShape("square");
    setEyeShape("square");
    setIncludeLogo(false);
    setMargin(2);
    setErrorCorrectionLevel("M");
    showToast("Simple Minimalist QR mode active (Transparent PNG, zero distortion).");
  };

  const handleSetCustomMode = () => {
    setQrMode("custom");
    setDarkColor("#09162D");
    setTransparentBg(true);
    setCustomEyeColors(true);
    setEyeOuterColor("#C8963E");
    setEyeInnerColor("#09162D");
    setModuleShape("rounded");
    setEyeShape("rounded");
    setIncludeLogo(true);
    setErrorCorrectionLevel("H");
    showToast("Custom Styled QR mode active. Edit colors, logo, and shapes below.");
  };

  // Preload logo image
  useEffect(() => {
    let src = "/assets/logos/logo.png";
    if (logoSource === "avatar" && currentEmployee?.avatarUrl) {
      src = currentEmployee.avatarUrl;
    } else if (logoSource === "custom" && customLogoUrl) {
      src = customLogoUrl;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImageRef.current = img;
      redrawCanvas();
    };
    img.onerror = () => {
      logoImageRef.current = null;
      redrawCanvas();
    };
    img.src = src;
  }, [logoSource, currentEmployee?.avatarUrl, customLogoUrl]);

  // Render canvas
  const redrawCanvas = useCallback(() => {
    const options = {
      url: qrPayload,
      size: 1024,
      margin,
      errorCorrectionLevel: qrMode === "simple" ? errorCorrectionLevel : includeLogo ? "H" : errorCorrectionLevel,
      darkColor,
      lightColor,
      transparentBg,
      eyeOuterColor: customEyeColors ? eyeOuterColor : darkColor,
      eyeInnerColor: customEyeColors ? eyeInnerColor : darkColor,
      moduleShape: qrMode === "simple" ? "square" : moduleShape,
      eyeShape: qrMode === "simple" ? "square" : eyeShape,
      logo: {
        enabled: qrMode !== "simple" && includeLogo,
        sizeRatio: 0.22,
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
      },
    };

    if (canvasRef.current) {
      renderQrToCanvas(canvasRef.current, options, includeLogo && qrMode !== "simple" ? logoImageRef.current : null);
    }

    if (cardCanvasRef.current) {
      renderQrToCanvas(cardCanvasRef.current, { ...options, size: 400 }, includeLogo && qrMode !== "simple" ? logoImageRef.current : null);
    }
  }, [
    qrPayload,
    qrMode,
    margin,
    errorCorrectionLevel,
    darkColor,
    lightColor,
    transparentBg,
    customEyeColors,
    eyeOuterColor,
    eyeInnerColor,
    moduleShape,
    eyeShape,
    includeLogo,
  ]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, previewTab]);

  const handleSelectTab = (tab: "qr-only" | "card-template" | "print-spec") => {
    setPreviewTab(tab);
    requestAnimationFrame(() => {
      redrawCanvas();
    });
  };

  // Download High-Res Transparent PNG (300 DPI - 2400x2400)
  const handleDownloadPng = async () => {
    try {
      const exportCanvas = document.createElement("canvas");
      renderQrToCanvas(
        exportCanvas,
        {
          url: qrPayload,
          size: 2400, // 300+ DPI commercial resolution
          margin,
          errorCorrectionLevel: qrMode === "simple" ? errorCorrectionLevel : includeLogo ? "H" : errorCorrectionLevel,
          darkColor,
          lightColor,
          transparentBg,
          eyeOuterColor: customEyeColors ? eyeOuterColor : darkColor,
          eyeInnerColor: customEyeColors ? eyeInnerColor : darkColor,
          moduleShape: qrMode === "simple" ? "square" : moduleShape,
          eyeShape: qrMode === "simple" ? "square" : eyeShape,
          logo: {
            enabled: qrMode !== "simple" && includeLogo,
            sizeRatio: 0.22,
            backgroundColor: "#FFFFFF",
            borderRadius: 50,
          },
        },
        includeLogo && qrMode !== "simple" ? logoImageRef.current : null
      );

      exportCanvas.toBlob((blob) => {
        if (!blob) throw new Error("Could not export PNG");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const slug = targetType === "custom" ? "custom-link" : currentEmployee ? currentEmployee.slug : "arukamed";
        const suffix = transparentBg ? "transparent" : "solid";
        a.download = `arukamed-qr-${slug}-${suffix}-300dpi.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`Downloaded 300 DPI PNG (${transparentBg ? "Transparent Background" : "Solid"})!`);
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
        errorCorrectionLevel: qrMode === "simple" ? errorCorrectionLevel : includeLogo ? "H" : errorCorrectionLevel,
        darkColor,
        lightColor,
        transparentBg,
        eyeOuterColor: customEyeColors ? eyeOuterColor : darkColor,
        eyeInnerColor: customEyeColors ? eyeInnerColor : darkColor,
        moduleShape: qrMode === "simple" ? "square" : moduleShape,
        logo: {
          enabled: qrMode !== "simple" && includeLogo,
          sizeRatio: 0.22,
        },
      });

      const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const slug = targetType === "custom" ? "custom-link" : currentEmployee ? currentEmployee.slug : "arukamed";
      a.download = `arukamed-qr-${slug}-${transparentBg ? "transparent" : "solid"}.svg`;
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
        showToast("QR code copied to clipboard as transparent PNG!");
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
    <div className="space-y-6">
      {/* Main Studio Grid */}
      <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* LEFT COLUMN: Clean Editing Tools (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECTION 1: QR MODE SWITCHER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">1</span>
                <span>Select QR Mode</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Zero Redundancy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Simple QR */}
              <button
                type="button"
                onClick={handleSetSimpleMode}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  qrMode === "simple"
                    ? "border-[#09162D] bg-[#09162D] text-white shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">▫️ Simple Minimalist QR</span>
                  {qrMode === "simple" && (
                    <span className="text-[9px] bg-[#E3B15F] text-[#09162D] font-bold px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${qrMode === "simple" ? "text-slate-300" : "text-slate-500"}`}>
                  Plain, clean, classic QR code. Square modules, square eyes, no logo. Maximum scannability on all devices and paper prints.
                </p>
              </button>

              {/* Option B: Custom Styled QR */}
              <button
                type="button"
                onClick={handleSetCustomMode}
                className={`p-4 rounded-2xl text-left border transition-all ${
                  qrMode === "custom"
                    ? "border-[#09162D] bg-[#09162D] text-white shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm">🎨 Custom Styled QR</span>
                  {qrMode === "custom" && (
                    <span className="text-[9px] bg-[#E3B15F] text-[#09162D] font-bold px-1.5 py-0.5 rounded">Active</span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${qrMode === "custom" ? "text-slate-300" : "text-slate-500"}`}>
                  Customized colors, rounded/dotted modules, distinct corner eye styling, and center brand emblem or avatar.
                </p>
              </button>
            </div>
          </div>

          {/* SECTION 2: TARGET DESTINATION */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">2</span>
                <span>Destination & Data Content</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {[
                { id: "custom", label: "Custom Link", icon: "🔗", desc: "Any URL or website" },
                { id: "visiting-card", label: "Visiting Card", icon: "📇", desc: "Digital rep card" },
                { id: "company-portal", label: "Company Hub", icon: "🏢", desc: "connect.arukamed.com" },
                { id: "whatsapp", label: "WhatsApp Direct", icon: "💬", desc: "Instant rep inquiry" },
                { id: "vcard-offline", label: "Direct vCard", icon: "👤", desc: "Offline address book" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTargetType(t.id as QrTargetType)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    targetType === t.id
                      ? "border-[#09162D] bg-[#FAF8F5] ring-2 ring-[#09162D]/20 text-slate-900 shadow-sm"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{t.icon}</span>
                    <span className="font-bold text-xs text-slate-900">{t.label}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{t.desc}</div>
                </button>
              ))}
            </div>

            {/* Custom URL Input Field */}
            {targetType === "custom" && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="customUrlInput" className="block text-xs font-bold text-slate-800">
                    Custom Destination Link / URL:
                  </label>
                  <span className="text-[10px] font-medium text-slate-400">Can be any external website</span>
                </div>
                <div className="relative">
                  <input
                    id="customUrlInput"
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com or any link"
                    className="w-full pl-3 pr-20 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl bg-slate-50/50 font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#09162D]"
                  />
                  {customUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomUrl("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-200/60"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 text-[10px] font-semibold">Examples:</span>
                  {[
                    "https://google.com",
                    "https://linkedin.com",
                    "https://instagram.com",
                    "https://youtube.com",
                    "https://arukamed.com",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomUrl(preset)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-mono text-[10px] border border-slate-200 transition-colors"
                    >
                      {preset.replace("https://", "")}
                    </button>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]">
                  <span className="text-slate-500 font-medium">Encoded in QR: </span>
                  <span className="font-mono text-[#09162D] font-bold break-all">
                    {qrPayload}
                  </span>
                </div>
              </div>
            )}

            {targetType === "visiting-card" && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Select Employee Card:</label>
                <select
                  value={selectedEmployeeSlug}
                  onChange={(e) => onSelectEmployeeSlug(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50 font-medium text-slate-800"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.slug}>
                      {e.firstName} {e.lastName} — {e.designation} ({e.territoryRegion || e.division || "HQ"})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 font-mono">
                  URL: <span className="text-[#09162D] font-bold">{cardBaseUrl}/{selectedEmployeeSlug}</span>
                </p>
              </div>
            )}

            {targetType === "whatsapp" && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700">Pre-filled WhatsApp Message:</label>
                <textarea
                  rows={2}
                  value={customWhatsappMsg}
                  onChange={(e) => setCustomWhatsappMsg(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50/50"
                />
              </div>
            )}
          </div>

          {/* SECTION 3: COLORS & TRANSPARENCY TOOL */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">3</span>
              <span>Colors & Transparency Tool</span>
            </h3>

            {/* Transparency Toggle */}
            <div className="p-4 bg-[#FAF8F5] border border-amber-200/70 rounded-2xl flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-slate-400 bg-gradient-to-tr from-slate-200 to-white" />
                  <span>Transparent Background (Alpha = 0)</span>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Recommended</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Exports PNG with zero background fill so designers can drop it onto visiting cards, dark backgrounds, or flyers.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#09162D]"></div>
              </label>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">QR Code Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={darkColor}
                    onChange={(e) => setDarkColor(e.target.value)}
                    className="w-20 p-2 font-mono text-xs border rounded-lg uppercase text-slate-700"
                  />
                </div>
              </div>

              {!transparentBg && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={lightColor}
                      onChange={(e) => setLightColor(e.target.value)}
                      className="w-20 p-2 font-mono text-xs border rounded-lg uppercase text-slate-700"
                    />
                  </div>
                </div>
              )}

              {qrMode === "custom" && (
                <div className="col-span-full pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Custom Corner Eye Colors:</label>
                    <button
                      type="button"
                      onClick={() => setCustomEyeColors(!customEyeColors)}
                      className="text-xs text-[#C8963E] font-bold hover:underline"
                    >
                      {customEyeColors ? "Reset to match QR" : "Enable Custom Eyes"}
                    </button>
                  </div>

                  {customEyeColors && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Outer Eye Ring</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={eyeOuterColor}
                            onChange={(e) => setEyeOuterColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border cursor-pointer"
                          />
                          <span className="font-mono text-xs text-slate-600 uppercase">{eyeOuterColor}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Inner Eye Pip</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={eyeInnerColor}
                            onChange={(e) => setEyeInnerColor(e.target.value)}
                            className="w-8 h-8 rounded-lg border cursor-pointer"
                          />
                          <span className="font-mono text-xs text-slate-600 uppercase">{eyeInnerColor}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: SHAPES & LOGO TOOL (Active in Custom Mode) */}
          {qrMode === "custom" && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#09162D] text-[#E3B15F] flex items-center justify-center text-xs font-bold">4</span>
                <span>Geometry & Center Brand Cutout</span>
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                {/* Module Shape */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Module Geometry:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["square", "rounded", "dots"] as QrModuleShape[]).map((shape) => (
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
                    {(["square", "rounded", "circle"] as QrEyeShape[]).map((shape) => (
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

              {/* Quiet Zone Margin & Error Correction */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Quiet Zone Margin (Modules):</label>
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2, 4].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMargin(m)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          margin === m
                            ? "bg-[#09162D] text-white border-[#09162D]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {m === 0 ? "0 (Tight)" : `${m}x`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Error Correction Level:</label>
                  <div className="flex items-center gap-1.5">
                    {(["L", "M", "Q", "H"] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setErrorCorrectionLevel(lvl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                          errorCorrectionLevel === lvl
                            ? "bg-[#09162D] text-white border-[#09162D]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Central Logo Embed */}
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
                  <div className="flex flex-wrap items-center gap-2">
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

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomLogoUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        logoSource === "custom"
                          ? "bg-[#09162D] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-dashed border-slate-300"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span>{customLogoUrl ? "Change Custom Logo" : "Upload Custom Logo"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Previews & Official Card Template (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preview Mode Selector */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
            <button
              type="button"
              onClick={() => handleSelectTab("qr-only")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                previewTab === "qr-only"
                  ? "bg-[#09162D] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Preview
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("card-template")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                previewTab === "card-template"
                  ? "bg-[#09162D] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Card Front
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("print-spec")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                previewTab === "print-spec"
                  ? "bg-[#09162D] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Print Specs
            </button>
          </div>

          {/* TAB 1: SCANNABLE QR CANVAS (Always mounted to prevent vanishing) */}
          <div className={previewTab === "qr-only" ? "space-y-5" : "hidden"}>
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm text-center space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{transparentBg ? "Transparent PNG Output" : "Solid Color Output"}</span>
                </span>
                <span className="text-[10px] font-mono text-[#C8963E] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Ready to Scan
                </span>
              </div>

              {/* The Interactive Canvas with Checkerboard for Transparency */}
              <div
                className="mx-auto w-56 h-56 sm:w-72 sm:h-72 p-4 rounded-3xl border-2 border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden group"
                style={{
                  background: transparentBg
                    ? "repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 50% / 16px 16px"
                    : lightColor,
                }}
              >
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-mono break-all text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  {qrPayload}
                </p>
                <p className="text-[11px] text-slate-400">
                  {transparentBg
                    ? "Background is transparent (checkerboard indicates transparency). Ready to drop into your designs."
                    : "Solid background color active."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="px-4 py-2.5 bg-[#C8963E] hover:bg-[#b5832f] text-[#09162D] font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download 300 DPI PNG {transparentBg ? "(Transparent)" : ""}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="px-4 py-2.5 bg-[#09162D] hover:bg-[#122442] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  <span>Vector SVG</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyPng}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl col-span-1 sm:col-span-2 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>Copy Image to Clipboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 2: OFFICIAL VISITING CARD TEMPLATE (Clean 3.5" x 2.0" Front Template) */}
          <div className={previewTab === "card-template" ? "space-y-4" : "hidden"}>
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Official Business Card Front</span>
                </span>
                <span className="text-[10px] font-mono text-[#C8963E] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  3.5" × 2.0" Official
                </span>
              </div>

              {/* Card Container formatted to 3.5" x 2.0" (252 x 144) aspect ratio */}
              <div className="w-full max-w-[420px] aspect-[252/144] relative rounded-2xl overflow-hidden shadow-xl border border-slate-300 mx-auto select-none bg-[#FAF9F6]">
                {/* Clean Official SVG Template Background */}
                <img
                  src="/assets/templates/visting_card_front.svg"
                  alt="ArukaMed Visiting Card Template"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                />

                {/* Overlaid Rep Contact Details (Left Column) */}
                <div className="absolute left-[6.5%] top-[34%] max-w-[54%] z-10 space-y-1">
                  <div>
                    <h4 className="font-extrabold text-[#09162D] uppercase leading-tight font-display tracking-tight text-[11px] sm:text-[13px] truncate">
                      {currentEmployee ? `${currentEmployee.firstName} ${currentEmployee.lastName}` : "Abhishikt Emmanuel Prakash"}
                    </h4>
                    <div className="text-[7.5px] sm:text-[9px] font-bold text-[#C8963E] uppercase tracking-wider mt-0.5 truncate">
                      {currentEmployee?.designation || "GENERAL MANAGER"}
                    </div>
                  </div>

                  <div className="space-y-0.5 pt-0.5 text-[7px] sm:text-[8px] text-[#09162D] font-medium leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full border border-[#09162D]/30 flex items-center justify-center text-[6px] shrink-0">
                        📞
                      </span>
                      <span className="truncate">{currentEmployee?.phoneNumber || "+91 9742626628"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full border border-[#09162D]/30 flex items-center justify-center text-[6px] shrink-0">
                        ✉️
                      </span>
                      <span className="truncate">{currentEmployee?.email || "hello@arukamed.com"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full border border-[#09162D]/30 flex items-center justify-center text-[6px] shrink-0">
                        📍
                      </span>
                      <span className="truncate">{currentEmployee?.workLocation || "Anand Nagar, Kanpur - 208019"}</span>
                    </div>
                  </div>
                </div>

                {/* Overlaid QR Code (Right Column, inside watermark loop area) */}
                <div className="absolute right-[6%] top-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 p-1 sm:p-1.5 bg-white/95 backdrop-blur-sm rounded-xl border border-[#C8963E]/50 shadow-sm flex items-center justify-center">
                    <canvas
                      ref={cardCanvasRef}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[6px] sm:text-[7px] font-bold text-[#09162D] uppercase tracking-wider mt-1 font-mono">
                    SCAN TO CONNECT
                  </span>
                </div>
              </div>

              {/* Template Action Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span className="text-[11px] text-center sm:text-left">Standard Business Card Size: 3.5" × 2.0" (88.9 × 50.8 mm)</span>
                <button
                  type="button"
                  onClick={handlePrintCard}
                  className="w-full sm:w-auto px-4 py-2 bg-[#09162D] hover:bg-[#122442] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  <span>Print Template / Save PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 3: INDUSTRIAL 300 DPI SPEC */}
          <div className={previewTab === "print-spec" ? "block" : "hidden"}>
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
          </div>
        </div>
      </div>
    </div>
  );
}
