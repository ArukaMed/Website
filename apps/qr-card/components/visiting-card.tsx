"use client";

import React, { useState } from "react";
import type { Tenant, Employee } from "@aegis/types";

interface VisitingCardProps {
  tenant: Tenant;
  employee: Employee;
  vcardUrl: string;
}

export function VisitingCard({ tenant, employee, vcardUrl }: VisitingCardProps) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [creditStatus, setCreditStatus] = useState<{ message: string; isError?: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle theme
  const toggleTheme = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
    document.documentElement.setAttribute("data-theme", next);
  };

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
      employeeSlug: employee.slug,
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
        setCreditStatus({ message: "Request received! Our trade desk will contact you shortly." });
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

  const fullName = `${employee.firstName} ${employee.lastName}`.trim();
  const initials = `${employee.firstName[0] || ""}${employee.lastName[0] || ""}`.toUpperCase();

  const whatsappMsg = (employee.customWhatsappTemplate || tenant.commercialSettings.defaultWhatsappTemplate || "Hello {name}, I scanned your {company} card. I would like to inquire about bulk wholesale medicine supply.")
    .replace("{name}", fullName)
    .replace("{company}", tenant.name);

  const cleanPhone = (employee.whatsappNumber || employee.phoneNumber || "").replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  const primaryDomain = tenant.customDomain || (tenant.slug === "arukamed" ? "arukamed.com" : `${tenant.slug}.com`);

  const catalogUrl = employee.customRateCardUrl || tenant.commercialSettings.catalogPdfUrl || `https://${primaryDomain}/files/wholesale-catalog.pdf`;

  const poSubject = `Purchase order via ${fullName}`;
  const poBody = `Hello ${tenant.name} order desk,\n\nPlease process the attached purchase order.\n\nBusiness name:\nGSTIN:\nDrug licence no.:\n\nRepresentative: ${fullName}\n`;
  const poMailto = `mailto:${tenant.commercialSettings.orderDeskEmail}?subject=${encodeURIComponent(poSubject)}&body=${encodeURIComponent(poBody)}`;

  const escalationPhone = tenant.commercialSettings.centralHelplinePhone || "+915120000000";
  const escalationEmail = tenant.commercialSettings.orderDeskEmail || "desk@arukamed.com";

  const mapsQuery = encodeURIComponent(
    `${tenant.complianceInfo.warehouseAddress.line1}, ${tenant.complianceInfo.warehouseAddress.city}, ${tenant.complianceInfo.warehouseAddress.state} ${tenant.complianceInfo.warehouseAddress.pincode}`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const productSegments = [
    "Critical care",
    "Cardiology",
    "Anti-diabetic",
    "Antibiotics",
    "Derma",
    "Nutraceuticals",
    "Surgical disposables",
  ];

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
          <symbol id="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
          </symbol>
        </defs>
      </svg>

      <main
        id="card"
        className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-ivory shadow-[0_0_60px_rgba(12,34,68,0.18)]"
      >
        {/* Header: Brand Banner with Logo and Line-Icon Theme Toggle */}
        <header className="hdr-glow relative overflow-hidden px-6 pb-[68px] pt-8 text-white">
          <div className="relative z-10 flex items-center justify-between">
            <img
              src={themeMode === "dark" && tenant.logoUrlDark ? tenant.logoUrlDark : tenant.logoUrlLight}
              alt={tenant.name}
              className="h-[34px] w-auto object-contain"
            />
            {/* Theme Toggle Button using Line Icons */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 text-white backdrop-blur-sm transition-colors border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label={themeMode === "light" ? "Switch to dark theme" : "Switch to light theme"}
            >
              <svg className="h-4 w-4 shrink-0" aria-hidden="true">
                <use href={themeMode === "light" ? "#i-moon" : "#i-sun"} />
              </svg>
              <span>{themeMode === "light" ? "Dark" : "Light"}</span>
            </button>
          </div>
        </header>

        {/* Profile Section */}
        <section className="relative -mt-[58px] px-6" aria-labelledby="person-name">
          <div
            id="avatar"
            className="grid h-[112px] w-[112px] place-items-center overflow-hidden rounded-full bg-navy-mid text-[34px] font-light text-white ring-2 ring-gold ring-offset-4 ring-offset-ivory"
            role="img"
            aria-label={`Profile photo of ${fullName}`}
          >
            {employee.avatarUrl ? (
              <img src={employee.avatarUrl} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <span className="select-none font-bold text-2xl tracking-wider text-white">{initials}</span>
            )}
          </div>

          <h1 id="person-name" className="mt-4 text-[27px] font-extrabold leading-[1.15] text-heading">
            {fullName}
          </h1>
          <p className="mt-1.5 text-[15px] leading-snug text-ink">{employee.designation}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-semibold text-gold-deep">
            <svg className="h-4 w-4 shrink-0 text-gold-deep" aria-hidden="true">
              <use href="#i-pin" />
            </svg>
            <span>{employee.territoryRegion}</span>
          </p>
          <p className="mt-2 text-[13.5px] font-medium text-muted">{tenant.name}</p>
        </section>

        {/* Primary Actions: Save Contact & Fast Reach */}
        <section className="mt-6 px-6" aria-label="Contact actions">
          {tenant.featureFlags.enableVCardSave && (
            <a
              id="save-contact"
              href={vcardUrl}
              download={`${employee.slug}.vcf`}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-[16px] font-bold text-on-primary shadow-[0_6px_16px_-6px_rgba(12,34,68,0.55)] transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              <svg className="h-[22px] w-[22px] text-btn-icon" aria-hidden="true">
                <use href="#i-user-plus" />
              </svg>
              <span>Save contact</span>
            </a>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <a
              id="btn-wa"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="qbtn"
            >
              <svg className="h-6 w-6 text-wa" aria-hidden="true">
                <use href="#i-whatsapp" />
              </svg>
              <span>WhatsApp inquiry</span>
            </a>
            <a id="btn-call" href={`tel:${employee.phoneNumber}`} className="qbtn">
              <svg className="h-6 w-6 text-heading" aria-hidden="true">
                <use href="#i-phone" />
              </svg>
              <span>Direct call</span>
            </a>
            <a id="btn-mail" href={`mailto:${employee.email}`} className="qbtn">
              <svg className="h-6 w-6 text-heading" aria-hidden="true">
                <use href="#i-mail" />
              </svg>
              <span>Email</span>
            </a>
          </div>
        </section>

        {/* Pharma Compliance & Storage Badges */}
        <section className="mt-6 px-6" aria-label="Compliance and supply standards">
          <ul id="badges" className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            <li className="flex flex-col items-center px-2 py-4 text-center">
              <svg className="h-6 w-6 text-gold-deep" aria-hidden="true">
                <use href="#i-shield" />
              </svg>
              <span className="mt-2 text-[12.5px] font-bold leading-tight text-heading">Form 20B and 21B</span>
              <span className="mt-1 text-[11px] leading-tight text-muted">Drug licence compliant</span>
            </li>
            <li className="flex flex-col items-center px-2 py-4 text-center">
              <svg className="h-6 w-6 text-gold-deep" aria-hidden="true">
                <use href="#i-snow" />
              </svg>
              <span className="mt-2 text-[12.5px] font-bold leading-tight text-heading">2°C to 8°C</span>
              <span className="mt-1 text-[11px] leading-tight text-muted">Cold chain storage</span>
            </li>
            <li className="flex flex-col items-center px-2 py-4 text-center">
              <svg className="h-6 w-6 text-gold-deep" aria-hidden="true">
                <use href="#i-truck" />
              </svg>
              <span className="mt-2 text-[12.5px] font-bold leading-tight text-heading">Same day</span>
              <span className="mt-1 text-[11px] leading-tight text-muted">or 24-hour dispatch</span>
            </li>
          </ul>
        </section>

        {/* Work with us Services Menu */}
        <section className="mt-8 px-6" aria-labelledby="h-services">
          <h2 id="h-services" className="mb-3 text-[16px] font-bold text-heading">
            Work with us
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {tenant.featureFlags.enableCatalogDownload && catalogUrl && (
              <li id="row-catalog">
                <a
                  href={catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="row"
                >
                  <span className="tile">
                    <svg className="h-5 w-5" aria-hidden="true">
                      <use href="#i-file" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold text-ink">
                      Wholesale catalog and rate card
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      PDF, {tenant.commercialSettings.catalogSizeLabel || "2.4 MB"}, updated 1 Oct 2026
                    </span>
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
                    <use href="#i-chev" />
                  </svg>
                </a>
              </li>
            )}

            {tenant.featureFlags.enablePoUploadEmail && (
              <li id="row-po">
                <a href={poMailto} className="row">
                  <span className="tile">
                    <svg className="h-5 w-5" aria-hidden="true">
                      <use href="#i-send" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold text-ink">
                      Send a purchase order
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      Goes straight to the central order desk
                    </span>
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
                    <use href="#i-chev" />
                  </svg>
                </a>
              </li>
            )}

            {tenant.featureFlags.enableCreditApplicationModal && (
              <li id="row-credit">
                <button
                  type="button"
                  onClick={() => setIsCreditOpen(true)}
                  className="row"
                  aria-haspopup="dialog"
                >
                  <span className="tile">
                    <svg className="h-5 w-5" aria-hidden="true">
                      <use href="#i-wallet" />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold text-ink">
                      Request a credit account or dealership
                    </span>
                    <span className="mt-0.5 block text-[12px] text-muted">
                      Share a few business details to get started
                    </span>
                  </span>
                  <svg className="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
                    <use href="#i-chev" />
                  </svg>
                </button>
              </li>
            )}
          </ul>
        </section>

        {/* Product Range Chips */}
        <section className="mt-8 px-6" aria-labelledby="h-range">
          <h2 id="h-range" className="mb-3 text-[16px] font-bold text-heading">
            Product range
          </h2>
          <ul id="segments" className="flex flex-wrap gap-2">
            {productSegments.map((tag) => (
              <li key={tag} className="chip">
                {tag}
              </li>
            ))}
          </ul>
        </section>

        {/* Company Details */}
        <section className="mt-8 px-6" aria-labelledby="h-corp">
          <h2 id="h-corp" className="mb-3 text-[16px] font-bold text-heading">
            Company details
          </h2>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {/* Warehouse and registered office */}
            <div className="p-4">
              <p className="text-[13px] font-semibold text-muted">Warehouse and registered office</p>
              <address className="mt-1.5 text-[14.5px] not-italic leading-relaxed text-ink">
                {tenant.complianceInfo.warehouseAddress.line1}
                <br />
                {tenant.complianceInfo.warehouseAddress.city}, {tenant.complianceInfo.warehouseAddress.state} {tenant.complianceInfo.warehouseAddress.pincode}
                <br />
                India
              </address>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ghost mt-3"
              >
                <svg className="h-[18px] w-[18px]" aria-hidden="true">
                  <use href="#i-pin" />
                </svg>
                <span>Open in Google Maps</span>
              </a>
            </div>

            {/* Tax and licence numbers */}
            <div className="p-4">
              <p className="text-[13px] font-semibold text-muted">Tax and licence numbers</p>
              <ul className="mt-2 divide-y divide-line">
                <li className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <span className="text-[11px] text-muted block uppercase tracking-wide">GSTIN</span>
                    <span className="font-mono font-semibold text-[13.5px] text-ink">{tenant.complianceInfo.gstin}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(tenant.complianceInfo.gstin, "GSTIN", "gstin")}
                    className="ghost text-xs py-1 px-2.5 min-h-[34px]"
                  >
                    <svg className="h-3.5 w-3.5 mr-1" aria-hidden="true">
                      <use href={copiedKey === "gstin" ? "#i-check" : "#i-copy"} />
                    </svg>
                    <span>{copiedKey === "gstin" ? "Copied" : "Copy"}</span>
                  </button>
                </li>
                {tenant.complianceInfo.drugLicences.map((lic, idx) => {
                  const key = `lic-${idx}`;
                  return (
                    <li key={idx} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <span className="text-[11px] text-muted block">{lic.label}</span>
                        <span className="font-mono font-semibold text-[13.5px] text-ink">{lic.number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(lic.number, lic.label, key)}
                        className="ghost text-xs py-1 px-2.5 min-h-[34px]"
                      >
                        <svg className="h-3.5 w-3.5 mr-1" aria-hidden="true">
                          <use href={copiedKey === key ? "#i-check" : "#i-copy"} />
                        </svg>
                        <span>{copiedKey === key ? "Copied" : "Copy"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Central order and escalation desk */}
            <div className="p-4">
              <div className="flex items-start gap-3">
                <span className="tile">
                  <svg className="h-5 w-5" aria-hidden="true">
                    <use href="#i-headset" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[14.5px] font-semibold text-ink">
                    Central order and escalation desk
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">
                    Reach the central desk for orders, billing or escalations when your representative is unavailable.
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <a href={`tel:${escalationPhone}`} className="ghost">
                  <svg className="h-[18px] w-[18px]" aria-hidden="true">
                    <use href="#i-phone" />
                  </svg>
                  <span>Call desk</span>
                </a>
                <a href={`mailto:${escalationEmail}`} className="ghost">
                  <svg className="h-[18px] w-[18px]" aria-hidden="true">
                    <use href="#i-mail" />
                  </svg>
                  <span>Email desk</span>
                </a>
              </div>
            </div>

            {/* Payment and credit terms */}
            <div className="p-4">
              <p className="text-[13px] font-semibold text-muted">Payment and credit terms</p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink">
                {tenant.commercialSettings.creditTermsSummary || "Credit terms on approval. Prepaid and 15-day credit options available for verified accounts."}
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-line px-6 pt-6 pb-10 text-center">
          <span className="mark-tile mx-auto inline-grid place-items-center">
            <img
              src={themeMode === "dark" && tenant.logoUrlDark ? tenant.logoUrlDark : tenant.logoUrlLight}
              alt=""
              aria-hidden="true"
              className="h-9 w-auto object-contain max-w-[140px]"
            />
          </span>
          <p className="mt-3 text-[13px] font-semibold text-heading">
            {tenant.complianceInfo.legalEntityName || "Aruka Med Pharmaceuticals Private Limited"}
          </p>
          <p className="mt-1 text-[12px] text-muted">
            <a
              href={`https://${primaryDomain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-4 hover:text-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              www.{primaryDomain}
            </a>
          </p>
        </footer>

        {/* Credit Account or Dealership Request Dialog */}
        {isCreditOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
            <div className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-surface p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-start justify-between gap-4 pb-2 pt-1">
                <div>
                  <h2 className="text-[19px] font-bold text-heading">Credit account or dealership</h2>
                  <p className="mt-1 text-[13.5px] leading-snug text-muted">
                    Tell us about your business. {employee.firstName} will follow up with you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreditOpen(false)}
                  className="-mr-2 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink hover:bg-navy-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" aria-hidden="true">
                    <use href="#i-x" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleCreditSubmit} className="space-y-4 pt-3">
                {/* Anti-spam honeypot */}
                <input type="text" name="website_hp" className="hidden" tabIndex={-1} autoComplete="off" />

                <div>
                  <label className="lbl">Business name *</label>
                  <input
                    required
                    name="business"
                    type="text"
                    placeholder="e.g. Apex Multispeciality Hospital"
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">Business type *</label>
                  <select required name="type" className="field">
                    <option value="">Select one</option>
                    <option value="Retail pharmacy">Retail pharmacy</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Nursing home or clinic">Nursing home or clinic</option>
                    <option value="Distributor or sub-stockist">Distributor or sub-stockist</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="lbl">Your name *</label>
                  <input
                    required
                    name="contact"
                    type="text"
                    placeholder="Dr. / Mr."
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">Mobile number *</label>
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">
                    Drug licence number <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <input
                    name="licence"
                    type="text"
                    placeholder="Form 20B/21B"
                    className="field"
                  />
                </div>

                <div>
                  <label className="lbl">
                    Expected monthly requirement <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="e.g. ₹5,00,000 - ₹10,00,000"
                    className="field"
                  />
                </div>

                {creditStatus && (
                  <div
                    className={`text-xs p-3 rounded-xl ${
                      creditStatus.isError ? "bg-red-50 text-err border border-red-200" : "bg-green-50 text-ok border border-green-200"
                    }`}
                  >
                    {creditStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-primary text-[16px] font-bold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ivory disabled:opacity-50"
                >
                  <svg className="h-5 w-5 text-btn-icon" aria-hidden="true">
                    <use href="#i-send" />
                  </svg>
                  <span>{isSubmitting ? "Sending request..." : "Send request"}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-navy-deep px-5 py-2.5 text-xs font-semibold text-white shadow-xl ring-1 ring-gold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <svg className="h-4 w-4 text-gold shrink-0" aria-hidden="true">
              <use href="#i-check" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}
      </main>
    </>
  );
}
