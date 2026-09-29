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

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`);
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
      businessName: formData.get("business") as string,
      businessType: formData.get("type") as string,
      contactName: formData.get("contact") as string,
      phone: formData.get("phone") as string,
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
        setTimeout(() => setIsCreditOpen(false), 2000);
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

  const whatsappMsg = (employee.customWhatsappTemplate || tenant.commercialSettings.defaultWhatsappTemplate)
    .replace("{name}", fullName)
    .replace("{company}", tenant.name);

  const cleanPhone = employee.whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`;

  const catalogUrl = employee.customRateCardUrl || tenant.commercialSettings.catalogPdfUrl;

  const poSubject = `Purchase order via ${fullName} (${employee.territoryRegion})`;
  const poBody = `Hello ${tenant.name} order desk,\n\nPlease process the attached purchase order.\n\nBusiness name:\nGSTIN:\nDrug licence no.:\n\nRepresentative: ${fullName}\n`;
  const poMailto = `mailto:${tenant.commercialSettings.orderDeskEmail}?subject=${encodeURIComponent(poSubject)}&body=${encodeURIComponent(poBody)}`;

  return (
    <main
      id="card"
      className="relative mx-auto min-h-screen w-full max-w-[430px] overflow-hidden bg-ivory shadow-[0_0_60px_rgba(12,34,68,0.18)]"
    >
      {/* Theme Toggle Button */}
      <button
        type="button"
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
        aria-label="Toggle dark mode"
      >
        <span>{themeMode === "light" ? "🌙 Dark" : "☀️ Light"}</span>
      </button>

      {/* Header: Brand Banner with Logo */}
      <header className="hdr-glow relative overflow-hidden px-6 pb-[68px] pt-8 text-white">
        {/* Brand Wordmark */}
        <div className="relative z-10 flex items-center">
          <img
            src={themeMode === "dark" && tenant.logoUrlDark ? tenant.logoUrlDark : tenant.logoUrlLight}
            alt={tenant.name}
            className="h-[34px] w-auto object-contain"
          />
        </div>
      </header>

      {/* Profile Section */}
      <section className="relative -mt-[58px] px-6" aria-labelledby="person-name">
        <div
          id="avatar"
          className="grid h-[112px] w-[112px] place-items-center overflow-hidden rounded-full bg-navy-mid text-[34px] font-light text-white ring-2 ring-gold ring-offset-4 ring-offset-ivory"
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
          <span>📍 {employee.territoryRegion}</span>
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
            className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-primary text-[16px] font-bold text-on-primary shadow-[0_6px_16px_-6px_rgba(12,34,68,0.55)] transition-all hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-xl">👤+</span>
            <span>Save Contact</span>
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
            <span className="text-2xl text-wa">💬</span>
            <span>WhatsApp</span>
          </a>
          <a id="btn-call" href={`tel:${employee.phoneNumber}`} className="qbtn">
            <span className="text-2xl">📞</span>
            <span>Direct Call</span>
          </a>
          <a id="btn-mail" href={`mailto:${employee.email}`} className="qbtn">
            <span className="text-2xl">✉️</span>
            <span>Email</span>
          </a>
        </div>
      </section>

      {/* Pharma Compliance & Storage Badges */}
      <section className="mt-6 px-6" aria-label="Compliance and supply standards">
        <ul className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          <li className="flex flex-col items-center px-2 py-4 text-center">
            <span className="text-2xl">🛡️</span>
            <span className="mt-2 text-[12.5px] font-bold leading-tight text-heading">Form 20B & 21B</span>
            <span className="mt-1 text-[11px] leading-tight text-muted">Licensed Wholesale</span>
          </li>
          <li className="flex flex-col items-center px-2 py-4 text-center">
            <span className="text-2xl">❄️</span>
            <span className="mt-2 text-[12.5px] font-bold leading-tight text-heading">2°C to 8°C</span>
            <span className="mt-1 text-[11px] leading-tight text-muted">Active Cold Chain</span>
          </li>
          <li className="flex flex-col items-center px-2 py-4 text-center">
            <span className="text-2xl">🚚</span>
            <span className="mt-2 text-[12.5px] font-bold leading-tight text-heading">24 - 48 Hrs</span>
            <span className="mt-1 text-[11px] leading-tight text-muted">Rapid Dispatch</span>
          </li>
        </ul>
      </section>

      {/* B2B Services Menu */}
      <section className="mt-8 px-6" aria-labelledby="h-services">
        <h2 id="h-services" className="mb-3 text-[16px] font-bold text-heading">
          Institutional Supply Services
        </h2>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {tenant.featureFlags.enableCatalogDownload && catalogUrl && (
            <li>
              <a
                href={catalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="row"
              >
                <span className="tile">📄</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink">
                    Wholesale Catalog & Rate Card
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    PDF format • {tenant.commercialSettings.catalogSizeLabel}
                  </span>
                </span>
                <span className="text-muted">➔</span>
              </a>
            </li>
          )}

          {tenant.featureFlags.enablePoUploadEmail && (
            <li>
              <a href={poMailto} className="row">
                <span className="tile">📤</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink">
                    Submit Purchase Order (PO)
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    Direct routing to {tenant.commercialSettings.orderDeskEmail}
                  </span>
                </span>
                <span className="text-muted">➔</span>
              </a>
            </li>
          )}

          {tenant.featureFlags.enableCreditApplicationModal && (
            <li>
              <button
                type="button"
                onClick={() => setIsCreditOpen(true)}
                className="row"
              >
                <span className="tile">💳</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink">
                    Apply for Trade Credit Account
                  </span>
                  <span className="mt-0.5 block text-[12px] text-muted">
                    Subject to Drug Licence & GSTIN verification
                  </span>
                </span>
                <span className="text-muted">➔</span>
              </button>
            </li>
          )}
        </ul>
      </section>

      {/* Therapeutic Range Chips */}
      <section className="mt-8 px-6" aria-labelledby="h-range">
        <h2 id="h-range" className="mb-3 text-[16px] font-bold text-heading">
          Therapeutic Portfolios
        </h2>
        <ul className="flex flex-wrap gap-2">
          {["Critical Care", "Cardiology", "Anti-Diabetic", "Biologics & Oncology", "Antibiotics", "Derma & Neutra", "Hospital Surgicals"].map(
            (tag) => (
              <li key={tag} className="chip">
                {tag}
              </li>
            )
          )}
        </ul>
      </section>

      {/* Corporate Compliance & Licences */}
      <section className="mt-8 px-6" aria-labelledby="h-corp">
        <h2 id="h-corp" className="mb-3 text-[16px] font-bold text-heading">
          Compliance & Warehouse Details
        </h2>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="p-4">
            <p className="text-[13px] font-semibold text-muted">Central Warehouse Location</p>
            <address className="mt-1 text-[14px] not-italic leading-relaxed text-ink">
              {tenant.complianceInfo.warehouseAddress.line1}
              <br />
              {tenant.complianceInfo.warehouseAddress.city}, {tenant.complianceInfo.warehouseAddress.state} -{" "}
              {tenant.complianceInfo.warehouseAddress.pincode}
            </address>
          </div>

          <div className="p-4">
            <p className="text-[13px] font-semibold text-muted">Licences & Registrations</p>
            <ul className="mt-2 space-y-2">
              <li className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs text-muted block">GSTIN</span>
                  <span className="font-mono font-semibold">{tenant.complianceInfo.gstin}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(tenant.complianceInfo.gstin, "GSTIN")}
                  className="ghost text-xs py-1 px-2.5"
                >
                  Copy
                </button>
              </li>
              {tenant.complianceInfo.drugLicences.map((lic, idx) => (
                <li key={idx} className="flex items-center justify-between text-sm border-t border-line/50 pt-2">
                  <div>
                    <span className="text-xs text-muted block">{lic.label}</span>
                    <span className="font-mono font-semibold">{lic.number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(lic.number, lic.label)}
                    className="ghost text-xs py-1 px-2.5"
                  >
                    Copy
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4">
            <p className="text-[13px] font-semibold text-muted">Payment & Credit Terms</p>
            <p className="mt-1 text-[13px] text-ink">{tenant.commercialSettings.creditTermsSummary}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 border-t border-line px-6 py-8 text-center text-xs text-muted">
        <p className="font-semibold text-heading">{tenant.complianceInfo.legalEntityName}</p>
        <p className="mt-1">Authorized B2B Institutional Drug Distributor</p>
        <p className="mt-2 text-[11px] text-muted">
          Digital Card ID: <span className="font-mono">{employee.slug}</span>
        </p>
      </footer>

      {/* Credit Request Modal Dialog */}
      {isCreditOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-[430px] rounded-t-3xl sm:rounded-3xl bg-surface p-6 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-heading">Trade Credit Application</h3>
              <button
                type="button"
                onClick={() => setIsCreditOpen(false)}
                className="text-muted hover:text-ink text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-muted mb-4">
              Apply for 15/30 day wholesale credit terms. Form 20B/21B licence verification is mandatory.
            </p>

            <form onSubmit={handleCreditSubmit} className="space-y-3.5">
              {/* Honeypot field for anti-spam security */}
              <input type="text" name="website_hp" className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label className="lbl">Hospital / Pharmacy Name *</label>
                <input
                  required
                  name="business"
                  type="text"
                  placeholder="e.g. Apex Multispeciality Hospital"
                  className="field"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="lbl">Business Type *</label>
                  <select required name="type" className="field">
                    <option value="">Select</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Pharmacy">Retail Chemist</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Nursing Home">Nursing Home</option>
                  </select>
                </div>
                <div>
                  <label className="lbl">Contact Person *</label>
                  <input required name="contact" type="text" placeholder="Dr. / Mr." className="field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="lbl">Phone (WhatsApp) *</label>
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="field"
                  />
                </div>
                <div>
                  <label className="lbl">Drug Licence No.</label>
                  <input name="licence" type="text" placeholder="Form 20B/21B" className="field" />
                </div>
              </div>

              <div>
                <label className="lbl">Estimated Monthly Procurement</label>
                <input name="note" type="text" placeholder="e.g. ₹5,00,000 - ₹10,00,000" className="field" />
              </div>

              {creditStatus && (
                <div
                  className={`text-xs p-2.5 rounded-lg ${
                    creditStatus.isError ? "bg-red-50 text-err" : "bg-green-50 text-ok"
                  }`}
                >
                  {creditStatus.message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-primary hover:bg-primary-hover text-on-primary font-bold rounded-xl transition-colors disabled:opacity-50 mt-2"
              >
                {isSubmitting ? "Submitting Application..." : "Submit Credit Request"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-navy-deep px-5 py-2.5 text-xs font-semibold text-white shadow-xl ring-1 ring-gold animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </main>
  );
}
