"use client";

import React, { useState, useEffect, useMemo } from "react";
import QRCode from "qrcode";
import type { Tenant } from "@aegis/types";

interface CompanyCardProps {
  tenant: Tenant;
  vcardUrl: string;
}

export function CompanyCard({ tenant, vcardUrl }: CompanyCardProps) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [creditStatus, setCreditStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [vcardQrDataUrl, setVcardQrDataUrl] = useState<string | null>(null);
  const [devicePlatform, setDevicePlatform] = useState<"ios" | "android" | "other">("other");

  // Automatically detect and synchronize with system color scheme (default to light)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = (isDark: boolean) => {
          const mode = isDark ? "dark" : "light";
          setThemeMode(mode);
          document.documentElement.setAttribute("data-theme", mode);
        };
        applyTheme(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      } else {
        setThemeMode("light");
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch {
      setThemeMode("light");
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  // Detect mobile OS platform for tailored contact saving guide
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
        setDevicePlatform("ios");
      } else if (/Android/.test(ua)) {
        setDevicePlatform("android");
      } else {
        setDevicePlatform("other");
      }
    }
  }, []);

  // Auto-clear active/focused highlight on touch screens as soon as finger is lifted
  useEffect(() => {
    const handleTouchEnd = () => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    };
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopy = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      showToast(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      showToast(`Copy failed. Select: ${text}`);
    }
  };

  const handleCreditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreditStatus(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      tenantSlug: tenant.slug,
      employeeSlug: "corporate",
      businessName: (formData.get("business") as string) || "",
      businessType: (formData.get("type") as string) || "",
      contactName: (formData.get("contact") as string) || "",
      phone: (formData.get("phone") as string) || "",
      licence: (formData.get("licence") as string) || "",
      note: (formData.get("note") as string) || "",
      website_hp: (formData.get("website_hp") as string) || "",
    };

    try {
      const res = await fetch("/api/credit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setCreditStatus({ message: "Application received! Our institutional finance desk will contact you." });
        form.reset();
        setTimeout(() => {
          setIsCreditOpen(false);
          setCreditStatus(null);
        }, 2200);
      } else {
        const err = await res.json().catch(() => ({ message: "Submission failed." }));
        setCreditStatus({ message: err.message || "Failed to submit request.", isError: true });
      }
    } catch {
      setCreditStatus({ message: "Network error. Please check your connection.", isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const legalName = tenant.complianceInfo.legalEntityName || tenant.name;
  const centralPhone = tenant.commercialSettings.centralHelplinePhone || "+915120000000";
  const orderEmail = tenant.commercialSettings.orderDeskEmail || "orders@arukamed.com";
  const creditEmail = tenant.commercialSettings.creditDeskEmail || "credit@arukamed.com";
  const primaryDomain = tenant.customDomain || (tenant.slug === "arukamed" ? "arukamed.com" : `${tenant.slug}.com`);
  const websiteUrl = `https://${primaryDomain}`;

  const cleanPhone = centralPhone.replace(/[^0-9]/g, "");
  const defaultWhatsappMsg = `Hello Aruka Med, I am visiting connect.arukamed.com. I would like to inquire about wholesale medicine procurement and dealership verification.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultWhatsappMsg)}`;

  const catalogUrl = tenant.commercialSettings.catalogPdfUrl || `https://${primaryDomain}/files/wholesale-catalog.pdf`;

  const poSubject = `Corporate Purchase Order - Trade Account Inquiry`;
  const poBody = `Hello Aruka Med Order Desk,\n\nPlease find our medicine procurement requirement attached.\n\nPharmacy / Hospital Name:\nGSTIN:\nDrug Licence Form 20B/21B:\nDelivery City:\n\nThank you.\n`;
  const poMailto = `mailto:${orderEmail}?subject=${encodeURIComponent(poSubject)}&body=${encodeURIComponent(poBody)}`;

  const warehouseAddr = tenant.complianceInfo.warehouseAddress;
  const mapsQuery = encodeURIComponent(
    `${warehouseAddr.line1}, ${warehouseAddr.city}, ${warehouseAddr.state} ${warehouseAddr.pincode}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const productSegments = [
    "Critical Care",
    "Cardiology",
    "Anti-diabetic",
    "Antibiotics & Anti-infectives",
    "Oncology & Nephrology",
    "Cold Chain Biologics & Vaccines",
    "Nutraceuticals & Derma",
    "Surgical Disposables",
  ];

  const escapeVCard = (val: string) =>
    String(val || "")
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const vcfContent = useMemo(() => {
    const licenses = tenant.complianceInfo.drugLicences.map((l) => `${l.label}: ${l.number}`).join(" | ");
    const note = `Corporate Distribution Hub | GSTIN: ${tenant.complianceInfo.gstin} | ${licenses} | Cold Chain Certified (2°C - 8°C)`;

    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:;${escapeVCard(legalName)};;;`,
      `FN:${escapeVCard(legalName)}`,
      `ORG:${escapeVCard(legalName)}`,
      "TITLE:Licensed Wholesale Medicine Distributor & Cold Chain Pharma Logistics",
      `TEL;TYPE=WORK,VOICE:${centralPhone}`,
      `TEL;TYPE=WORK,VOICE,WHATSAPP:${centralPhone}`,
      `EMAIL;TYPE=WORK,INTERNET:${orderEmail}`,
      `ADR;TYPE=WORK:;;${escapeVCard(warehouseAddr.line1)};${escapeVCard(warehouseAddr.city)};${escapeVCard(
        warehouseAddr.state
      )};${escapeVCard(warehouseAddr.pincode)};${escapeVCard(warehouseAddr.country)}`,
      `URL:${websiteUrl}`,
      `NOTE:${escapeVCard(note)}`,
      `REV:${new Date().toISOString()}`,
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n") + "\r\n";
  }, [legalName, centralPhone, orderEmail, warehouseAddr, websiteUrl, tenant]);

  // Pre-generate QR Code of Corporate vCard for camera scan import
  useEffect(() => {
    if (!vcfContent) return;
    QRCode.toDataURL(vcfContent, {
      margin: 2,
      width: 260,
      errorCorrectionLevel: "M",
      color: {
        dark: "#0A1D3B",
        light: "#FFFFFF",
      },
    })
      .then(setVcardQrDataUrl)
      .catch((err) => console.error("QR Code generation error:", err));
  }, [vcfContent]);

  const cleanFilename = `${tenant.slug || "arukamed"}-corporate.vcf`;

  const vcardFile = useMemo(() => {
    if (!vcfContent) return null;
    try {
      return new File([vcfContent], cleanFilename, { type: "text/vcard" });
    } catch {
      return null;
    }
  }, [vcfContent, cleanFilename]);

  const vcardFileLegacy = useMemo(() => {
    if (!vcfContent) return null;
    try {
      return new File([vcfContent], cleanFilename, { type: "text/x-vcard" });
    } catch {
      return null;
    }
  }, [vcfContent, cleanFilename]);

  const handleSaveContact = async (e?: React.MouseEvent<HTMLAnchorElement>) => {
    if (e) e.preventDefault();

    if (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function"
    ) {
      let fileToShare = vcardFile;
      if (!fileToShare || !navigator.canShare({ files: [fileToShare] })) {
        fileToShare = vcardFileLegacy;
      }

      if (fileToShare && navigator.canShare({ files: [fileToShare] })) {
        try {
          await navigator.share({
            files: [fileToShare],
            title: legalName,
          });
          return;
        } catch (err: any) {
          if (err && err.name === "AbortError") {
            return;
          }
          console.warn("Share API failed, falling back:", err);
        }
      }
    }

    if (devicePlatform === "other") {
      setIsSaveModalOpen(true);
    }
    window.location.href = vcardUrl;
  };

  return (
    <>
      {/* Universal SVG Line Icon Sprite */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="0"
        height="0"
        className="absolute pointer-events-none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <symbol id="i-building" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
            <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
          </symbol>
          <symbol id="i-user-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M19 8v6M22 11h-6" />
          </symbol>
          <symbol id="i-whatsapp" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
            <path d="M9 9.2c0 3 2.8 5.8 5.8 5.8l1.2-1.6-2.1-1-.9.8a4.3 4.3 0 0 1-2-2l.8-.9-1-2.1z" />
          </symbol>
          <symbol id="i-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
          </symbol>
          <symbol id="i-mail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a2 2 0 0 1-2.06 0L2 7" />
          </symbol>
          <symbol id="i-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.5 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </symbol>
          <symbol id="i-snow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7" />
            <path d="m9.5 4 2.5 2 2.5-2M9.5 20l2.5-2 2.5 2" />
          </symbol>
          <symbol id="i-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
            <path d="M15 18H9" />
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.7a1 1 0 0 0-.2-.6l-3.5-4.4A1 1 0 0 0 17.5 8H14" />
            <circle cx="17" cy="18" r="2" />
            <circle cx="7" cy="18" r="2" />
          </symbol>
          <symbol id="i-file" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8" />
          </symbol>
          <symbol id="i-send" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4z" />
            <path d="M22 2 11 13" />
          </symbol>
          <symbol id="i-wallet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
            <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
          </symbol>
          <symbol id="i-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
            <circle cx="12" cy="10" r="3" />
          </symbol>
          <symbol id="i-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="8" width="14" height="14" rx="2" />
            <path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
          </symbol>
          <symbol id="i-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </symbol>
          <symbol id="i-headset" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
          </symbol>
          <symbol id="i-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </symbol>
          <symbol id="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </symbol>
          <symbol id="i-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </symbol>
          <symbol id="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </symbol>
          <symbol id="i-download" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m7 10 5 5 5-5" />
            <path d="M12 15V3" />
          </symbol>
          <symbol id="i-qrcode" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM17 17h4v4h-4zM14 20h3v1h-3zM20 14h1v3h-1z" />
          </symbol>
        </defs>
      </svg>

      <main
        id="company-card"
        className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-ivory shadow-[0_0_60px_rgba(12,34,68,0.18)]"
      >
        {/* Header: Brand Banner with Wordmark and askew line art watermark */}
        <header className="hdr-glow relative overflow-hidden px-6 pb-[74px] pt-7 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <img
              src="/assets/logos/Wordmark_darkBG.png"
              alt="Aruka Med"
              className="h-9 sm:h-10 w-auto object-contain select-none drop-shadow-sm"
            />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-navy-deep/80 px-2.5 py-1 text-[11px] font-semibold text-gold shadow-sm backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Official Connect</span>
            </span>
          </div>

          {/* Watermark line logo overflowing top right */}
          <div
            className="pointer-events-none absolute -top-8 -right-12 z-0 h-52 w-52 sm:-top-10 sm:-right-14 sm:h-64 sm:w-64 select-none opacity-90 mix-blend-screen"
            aria-hidden="true"
          >
            <img
              src="/assets/logos/askew_line_logo.png"
              alt=""
              className="h-full w-full object-contain"
            />
          </div>
        </header>

        {/* Corporate Emblem & Entity Identity Hero */}
        <section className="relative -mt-[58px] px-6" aria-labelledby="company-title">
          <div className="flex items-end justify-between">
            <div
              className="relative grid h-[106px] w-[106px] place-items-center overflow-hidden rounded-3xl bg-[#09162D] p-3 border-2 border-gold shadow-[0_12px_24px_-6px_rgba(12,34,68,0.35)] ring-4 ring-gold/20"
              role="img"
              aria-label="Aruka Med Emblem"
            >
              <img
                src={tenant.markUrl || "/assets/logos/logo.png"}
                alt="Aruka Med Logo"
                className="h-full w-full object-contain"
              />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500 p-1 text-white border-2 border-white shadow">
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-muted bg-surface px-2.5 py-1 rounded-lg border border-line shadow-xs">
                Corporate HQ & Hub
              </span>
            </div>
          </div>

          <h1 id="company-title" className="mt-4 text-[24px] font-extrabold leading-[1.2] text-heading">
            {legalName}
          </h1>
          <p className="mt-1 text-[14px] font-medium leading-snug text-ink">
            Licensed Wholesale Medicine Distributor & Cold Chain Pharma Logistics
          </p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-gold hover:underline"
          >
            <svg className="h-4 w-4 shrink-0 text-gold" aria-hidden="true">
              <use href="#i-pin" />
            </svg>
            <span>{warehouseAddr.city}, {warehouseAddr.state} (Central Facility)</span>
          </a>

          {/* Compliance & GDP Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-heading shadow-xs">
              <svg className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true">
                <use href="#i-shield" />
              </svg>
              <span>WHO-GDP & ISO Compliant</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold text-heading shadow-xs">
              <svg className="h-3.5 w-3.5 text-blue-500" aria-hidden="true">
                <use href="#i-snow" />
              </svg>
              <span>Active Cold Room (2°C – 8°C)</span>
            </span>
          </div>
        </section>

        {/* Primary Action: Save Company Contact (Corporate vCard) */}
        <section className="mt-6 px-6" aria-label="Corporate contact actions">
          <a
            id="save-contact"
            href={vcardUrl}
            onClick={handleSaveContact}
            className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-primary text-[16px] font-bold text-on-primary shadow-[0_6px_16px_-6px_rgba(12,34,68,0.55)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ivory active:scale-[0.98]"
          >
            <svg className="h-[22px] w-[22px] text-btn-icon" aria-hidden="true">
              <use href="#i-building" />
            </svg>
            <span>Save Company Contact</span>
          </a>

          {/* Fast Reach 4-Grid */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qbtn"
              aria-label="Chat with Trade Desk on WhatsApp"
            >
              <svg className="h-6 w-6 text-wa" aria-hidden="true">
                <use href="#i-whatsapp" />
              </svg>
              <span>WhatsApp</span>
            </a>

            <a
              href={`tel:${centralPhone}`}
              className="qbtn"
              aria-label={`Call Central Helpline ${centralPhone}`}
            >
              <svg className="h-6 w-6" aria-hidden="true">
                <use href="#i-phone" />
              </svg>
              <span>Call Hub</span>
            </a>

            <a
              href={`mailto:${orderEmail}`}
              className="qbtn"
              aria-label={`Email Order Desk ${orderEmail}`}
            >
              <svg className="h-6 w-6" aria-hidden="true">
                <use href="#i-mail" />
              </svg>
              <span>Email</span>
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qbtn"
              aria-label="Get directions to central warehouse"
            >
              <svg className="h-6 w-6 text-gold" aria-hidden="true">
                <use href="#i-pin" />
              </svg>
              <span>Directions</span>
            </a>
          </div>
        </section>

        {/* Cold Chain Quality Assurance Banner */}
        <section className="mt-6 px-6" aria-label="Cold chain quality assurance">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <svg className="h-5 w-5" aria-hidden="true">
                    <use href="#i-snow" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[13.5px] font-bold text-heading">Cold Chain Assured Supply</h3>
                  <p className="text-[11px] text-muted">Continuous 2°C – 8°C IoT Temperature Logging</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                ACTIVE
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line/60 pt-3 text-[11.5px]">
              <div>
                <span className="text-[10px] font-semibold uppercase text-muted block">Backup Power</span>
                <span className="font-semibold text-ink">Dual Generator Automated</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold uppercase text-muted block">Min Order Value</span>
                <span className="font-semibold text-ink">₹{tenant.commercialSettings.minimumOrderValueINR?.toLocaleString("en-IN") || "25,000"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trade Desk & Commercial Operations */}
        <section className="mt-6 px-6" aria-labelledby="trade-desk-hdr">
          <h2 id="trade-desk-hdr" className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-muted">
            Commercial & Trade Desk
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            {/* Action 1: Email PO */}
            <a href={poMailto} className="row group">
              <div className="tile text-primary">
                <svg className="h-5 w-5" aria-hidden="true">
                  <use href="#i-send" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-bold text-heading">Submit Purchase Order</span>
                <span className="block text-[12px] text-muted">Direct dispatch queue to order desk</span>
              </div>
              <svg className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <use href="#i-chev" />
              </svg>
            </a>

            {/* Action 2: Wholesale Catalog */}
            <a
              href={catalogUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="row group"
            >
              <div className="tile text-gold">
                <svg className="h-5 w-5" aria-hidden="true">
                  <use href="#i-file" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-bold text-heading">Wholesale Medicine Catalog</span>
                <span className="block text-[12px] text-muted">
                  PDF catalog • Updated {tenant.commercialSettings.catalogUpdatedDate || "Monthly"}
                </span>
              </div>
              <svg className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <use href="#i-download" />
              </svg>
            </a>

            {/* Action 3: B2B Credit Account */}
            <button
              type="button"
              onClick={() => setIsCreditOpen(true)}
              className="row group cursor-pointer"
            >
              <div className="tile text-emerald-700">
                <svg className="h-5 w-5" aria-hidden="true">
                  <use href="#i-wallet" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[14.5px] font-bold text-heading">Apply for Trade Credit</span>
                <span className="block text-[12px] text-muted">15-day & 30-day approved pharmacy terms</span>
              </div>
              <svg className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true">
                <use href="#i-chev" />
              </svg>
            </button>
          </div>
        </section>

        {/* Therapeutic Categories / Product Range */}
        <section className="mt-6 px-6" aria-labelledby="products-hdr">
          <h2 id="products-hdr" className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-muted">
            Therapeutic Supply Range
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {productSegments.map((segment) => (
              <span key={segment} className="chip text-[12px]">
                {segment}
              </span>
            ))}
          </div>
        </section>

        {/* Regulatory Compliance & Drug Licences Card */}
        <section className="mt-6 px-6" aria-labelledby="compliance-hdr">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 id="compliance-hdr" className="text-[12px] font-bold uppercase tracking-wider text-muted">
              Regulatory Licences & Verification
            </h2>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
              <svg className="h-3.5 w-3.5" aria-hidden="true">
                <use href="#i-check" />
              </svg>
              <span>FDCA Verified</span>
            </span>
          </div>

          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            {/* Entity Name */}
            <div className="p-3.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted block">
                Registered Legal Entity
              </span>
              <span className="font-bold text-[13.5px] text-heading block mt-0.5">
                {legalName}
              </span>
            </div>

            {/* GSTIN */}
            <div className="flex items-center justify-between p-3.5">
              <div>
                <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted block">
                  GST Identification Number (GSTIN)
                </span>
                <span className="font-mono text-[13px] font-bold text-ink block mt-0.5">
                  {tenant.complianceInfo.gstin}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(tenant.complianceInfo.gstin, "GSTIN", "gstin")}
                className="tile hover:bg-line active:scale-95"
                title="Copy GSTIN"
              >
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href={copiedKey === "gstin" ? "#i-check" : "#i-copy"} />
                </svg>
              </button>
            </div>

            {/* Licences */}
            {tenant.complianceInfo.drugLicences.map((lic, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5">
                <div>
                  <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted block">
                    {lic.label}
                  </span>
                  <span className="font-mono text-[13px] font-bold text-ink block mt-0.5">
                    {lic.number}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(lic.number, lic.label, `lic_${idx}`)}
                  className="tile hover:bg-line active:scale-95"
                  title="Copy Licence Number"
                >
                  <svg className="h-4 w-4" aria-hidden="true">
                    <use href={copiedKey === `lic_${idx}` ? "#i-check" : "#i-copy"} />
                  </svg>
                </button>
              </div>
            ))}

            {/* Registered Warehouse Address */}
            <div className="p-3.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted block">
                Central Licensed Warehouse
              </span>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink">
                {warehouseAddr.line1}, {warehouseAddr.city}, {warehouseAddr.state} {warehouseAddr.pincode}, {warehouseAddr.country}
              </p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:underline"
              >
                <svg className="h-3.5 w-3.5 text-gold" aria-hidden="true">
                  <use href="#i-pin" />
                </svg>
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </section>

        {/* Corporate Escalation Desks */}
        <section className="mt-6 px-6" aria-labelledby="desks-hdr">
          <h2 id="desks-hdr" className="mb-2.5 text-[12px] font-bold uppercase tracking-wider text-muted">
            Direct Department Contacts
          </h2>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Wholesale Order Desk</span>
                <span className="font-mono text-[12.5px] font-semibold text-ink block mt-0.5">{orderEmail}</span>
              </div>
              <a href={`mailto:${orderEmail}`} className="tile text-primary hover:bg-line">
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href="#i-mail" />
                </svg>
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Trade Credit & Accounts</span>
                <span className="font-mono text-[12.5px] font-semibold text-ink block mt-0.5">{creditEmail}</span>
              </div>
              <a href={`mailto:${creditEmail}`} className="tile text-primary hover:bg-line">
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href="#i-wallet" />
                </svg>
              </a>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">Central Helpline / Dispatch</span>
                <span className="font-mono text-[12.5px] font-semibold text-ink block mt-0.5">{centralPhone}</span>
              </div>
              <a href={`tel:${centralPhone}`} className="tile text-primary hover:bg-line">
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href="#i-phone" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Corporate Website Link */}
        <section className="mt-6 px-6">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[50px] w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-[14px] font-bold text-heading shadow-sm transition-colors hover:bg-navy-tint active:scale-[0.98]"
          >
            <svg className="h-4 w-4 text-gold" aria-hidden="true">
              <use href="#i-globe" />
            </svg>
            <span>Visit Official Website ({primaryDomain})</span>
          </a>
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-line/80 px-6 py-6 text-center text-[11px] text-muted">
          <p>© {new Date().getFullYear()} {legalName}. All rights reserved.</p>
          <p className="mt-1">ISO 9001:2015 & WHO-GDP Certified Wholesale Pharmaceutical Distributor</p>
        </footer>
      </main>

      {/* Save Contact Modal / Zero-Download QR Code Scanner */}
      {isSaveModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl border border-line">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h3 className="text-[16px] font-bold text-heading">Save Corporate Contact</h3>
              <button
                type="button"
                onClick={() => setIsSaveModalOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-line active:scale-95"
              >
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href="#i-x" />
                </svg>
              </button>
            </div>

            <div className="py-4 text-center">
              {vcardQrDataUrl ? (
                <div className="mx-auto grid h-52 w-52 place-items-center rounded-2xl bg-white p-3 shadow-inner border border-line">
                  <img src={vcardQrDataUrl} alt="Company vCard QR" className="h-full w-full object-contain" />
                </div>
              ) : (
                <div className="h-52 w-52 mx-auto grid place-items-center text-muted">Loading QR...</div>
              )}
              <p className="mt-3 text-[12.5px] font-medium text-ink">
                Scan with your smartphone camera to add <span className="font-bold">{legalName}</span> directly into contacts.
              </p>
            </div>

            <div className="mt-2 flex gap-2">
              <a
                href={vcardUrl}
                download={cleanFilename}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-on-primary hover:bg-primary-hover active:scale-95"
              >
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href="#i-download" />
                </svg>
                <span>Download .VCF File</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trade Credit Application Modal */}
      {isCreditOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl border border-line my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <h3 className="text-[16px] font-bold text-heading">B2B Trade Credit Application</h3>
                <p className="text-[11px] text-muted">Wholesale pharmacy credit verification</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreditOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-line active:scale-95"
              >
                <svg className="h-4 w-4" aria-hidden="true">
                  <use href="#i-x" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreditSubmit} className="mt-4 space-y-3">
              <div>
                <label className="lbl">Business Name *</label>
                <input
                  type="text"
                  name="business"
                  required
                  placeholder="e.g., Apollo Pharmacy / City Hospital"
                  className="field text-xs py-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="lbl">Business Type</label>
                  <select name="type" className="field text-xs py-2.5">
                    <option value="Retail Pharmacy">Retail Pharmacy</option>
                    <option value="Hospital / Nursing Home">Hospital / Clinic</option>
                    <option value="Sub-Distributor">Sub-Distributor</option>
                    <option value="Corporate / Institution">Institutional</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Contact Person *</label>
                  <input
                    type="text"
                    name="contact"
                    required
                    placeholder="Full name"
                    className="field text-xs py-2.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="lbl">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="10-digit mobile"
                    className="field text-xs py-2.5"
                  />
                </div>
                <div>
                  <label className="lbl">Drug Licence / GSTIN</label>
                  <input
                    type="text"
                    name="licence"
                    placeholder="DL No. or GST"
                    className="field text-xs py-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="lbl">Procurement Requirement / Note</label>
                <textarea
                  name="note"
                  rows={2}
                  placeholder="Monthly volume, specific molecules, delivery city..."
                  className="field text-xs py-2"
                />
              </div>

              {creditStatus && (
                <div
                  className={`rounded-xl p-2.5 text-xs font-semibold ${
                    creditStatus.isError ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {creditStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-on-primary hover:bg-primary-hover disabled:opacity-50 active:scale-98"
              >
                <span>{isSubmitting ? "Submitting Application..." : "Submit Credit Request"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-navy-deep/95 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-sm border border-gold/40 animate-fade-in flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
