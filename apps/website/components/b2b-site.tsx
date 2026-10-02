"use client";

import React, { useState, useEffect } from "react";
import type { Tenant } from "@aegis/types";

interface B2BSiteProps {
  tenant: Tenant;
}

function SegmentIcon({ name, className = "h-6 w-6" }: { name: string; className?: string }) {
  switch (name) {
    case "syringe":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 5l-2-2m-3 3l2 2m-2-2l-7 7m0 0l-2-2 2-2 2 2m0 0l-4 4H3v-2l4-4m5-5l2 2m3-3l2 2" />
        </svg>
      );
    case "heart":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "dna":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 4c0 4-4 6-4 10s4 6 4 10M10 4c0 4 4 6 4 10s-4 6-4 10M6 8h12M7 16h10M8 12h8" />
        </svg>
      );
    case "flask":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 7h-6L8 4z" />
        </svg>
      );
    case "leaf":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0110 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0112 2zm0 0v20m0-10c3 0 5-2 5-5m-5 5c-3 0-5 2-5 5" />
        </svg>
      );
    case "bandage":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-4 4m2-7l6 6a2.828 2.828 0 11-4 4l-6-6a2.828 2.828 0 114-4z" />
        </svg>
      );
    default:
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export function B2BSite({ tenant }: B2BSiteProps) {
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Custom interactive form states
  const [institutionType, setInstitutionType] = useState<string>("Hospital / Nursing Home");
  const [requirementCategory, setRequirementCategory] = useState<string>("All / General Wholesale Catalog");
  const [contactHonorific, setContactHonorific] = useState<string>("Dr.");
  const [showComplianceFields, setShowComplianceFields] = useState<boolean>(false);
  const [submittedPhone, setSubmittedPhone] = useState<string>("");

  // Automatically detect and synchronize with system color scheme (default to light)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const applyTheme = (isDark: boolean) => {
          const mode = isDark ? "dark" : "light";
          document.documentElement.setAttribute("data-theme", mode);
        };
        applyTheme(mediaQuery.matches);
        const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
      } else {
        document.documentElement.setAttribute("data-theme", "light");
      }
    } catch {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const segments = [
    {
      title: "Critical Care & Anesthesia",
      icon: "syringe",
      coldChain: false,
      description: "Emergency and intensive care injectables, anaesthetics and IV therapy for operating rooms and ICUs.",
      formulations: ["Injectable anaesthetics", "Muscle relaxants", "Vasopressors & inotropes", "IV fluids & electrolytes", "Emergency resuscitation drugs"],
    },
    {
      title: "Cardiology & Anti-Diabetics",
      icon: "heart",
      coldChain: true,
      description: "Long-term therapy for cardiovascular health and diabetes management, including insulin cold chain storage.",
      formulations: ["Antihypertensives (ARBs, Beta blockers)", "Statins & lipid-lowering agents", "Antiplatelets & anticoagulants", "Oral anti-diabetic formulations", "Biologic insulins (2-8°C)"],
    },
    {
      title: "Oncology & Specialty Biologics",
      icon: "dna",
      coldChain: true,
      description: "Specialty injectables, targeted biologics, and monoclonal antibodies managed under continuous cold-chain audit.",
      formulations: ["Monoclonal antibodies", "Chemotherapy injectables", "Oncology supportive care", "Biologic vaccines", "Hormonal therapy agents"],
    },
    {
      title: "Antibiotics & Anti-Infectives",
      icon: "flask",
      coldChain: false,
      description: "Broad-spectrum and targeted anti-infectives in oral solid and sterile injectable dosage forms.",
      formulations: ["Cephalosporins (oral & IV)", "Penicillin combinations", "Macrolides & fluoroquinolones", "Systemic antifungals", "Antivirals and antimalarials"],
    },
    {
      title: "Derma & Nutraceuticals",
      icon: "leaf",
      coldChain: false,
      description: "Dermatological therapeutics and clinical nutritional formulations for pharmacy shelves.",
      formulations: ["Topical corticosteroids & emollients", "Antifungal creams & lotions", "Therapeutic vitamins & minerals", "Clinical protein supplements", "Dermo-cosmeceuticals"],
    },
    {
      title: "Hospital Surgicals & Disposables",
      icon: "bandage",
      coldChain: false,
      description: "Medical consumables and sterile surgical supplies for wards, emergency triage, and operating theatres.",
      formulations: ["Sterile syringes & infusion sets", "Sutures & sterile wound dressings", "Nitrile gloves & surgical masks", "Catheters & suction drains", "Diagnostic reagent strips"],
    },
  ];

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const form = e.currentTarget;
    const formData = new FormData(form);

    const business = ((formData.get("name") as string) || "").trim();
    const type = institutionType || ((formData.get("type") as string) || "").trim();
    const person = ((formData.get("person") as string) || "").trim();
    const phone = ((formData.get("phone") as string) || "").trim();
    const email = ((formData.get("email") as string) || "").trim();
    const licence = ((formData.get("licence") as string) || "").trim();
    const gstin = ((formData.get("gstin") as string) || "").trim();
    const segment = requirementCategory || ((formData.get("segment") as string) || "").trim();
    const volume = ((formData.get("volume") as string) || "").trim();
    const hp = ((formData.get("website") as string) || "").trim();

    const errs: Record<string, string> = {};
    if (business.length < 2) errs.name = "Enter your business or institution name.";
    if (!type) errs.type = "Select an institution type.";
    if (person.length < 2) errs.person = "Contact person name required.";
    if (!/^\+?[0-9\s-()]{10,15}$/.test(phone)) errs.phone = "Enter a valid mobile or WhatsApp number.";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address.";

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          institutionName: business,
          businessType: type,
          contactName: `${contactHonorific} ${person}`.trim(),
          phone,
          email: email || undefined,
          drugLicenceNumber: licence || undefined,
          gstin: gstin || undefined,
          requirementCategory: segment,
          estimatedMonthlyVolume: volume || undefined,
          website_hp: hp,
        }),
      });

      if (res.ok) {
        setSubmittedPhone(phone);
        setLeadSuccess(true);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.message || "Submission failed. Please try again.");
      }
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans antialiased">
      {/* 1. Verified Compliance Moving Ticker - Continuous Marquee, Never Stacks on Mobile */}
      <div className="bg-[var(--deep)] text-[#DCE6F5] text-xs py-2.5 overflow-hidden border-b border-white/10 select-none relative">
        <div className="animate-ticker-marquee flex items-center gap-8 whitespace-nowrap">
          {/* Loop Set 1 */}
          <div className="flex items-center gap-8 shrink-0">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <strong className="text-white font-semibold">CDSCO Form 20B & 21B Licensed</strong>
              <span className="text-[#8FAAD3]">| Wholesale Drug Distribution</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0 0l-4-4m4 4l4-4M3 12h18m-18 0l4-4m-4 4l4 4"/></svg>
              <span>Active 2°C – 8°C Monitored Cold Chain Storage</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>100% Genuine Direct-from-Manufacturer Formulations</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span>Guaranteed 24–48 Hr Regional Dispatch</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span>GST Compliant Invoicing with Batch & Expiry Traceability</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
          </div>

          {/* Loop Set 2 (Identical duplicate for seamless continuous infinite scroll) */}
          <div className="flex items-center gap-8 shrink-0" aria-hidden="true">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <strong className="text-white font-semibold">CDSCO Form 20B & 21B Licensed</strong>
              <span className="text-[#8FAAD3]">| Wholesale Drug Distribution</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0 0l-4-4m4 4l4-4M3 12h18m-18 0l4-4m-4 4l4 4"/></svg>
              <span>Active 2°C – 8°C Monitored Cold Chain Storage</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span>100% Genuine Direct-from-Manufacturer Formulations</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span>Guaranteed 24–48 Hr Regional Dispatch</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 text-[#E3B15F] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              <span>GST Compliant Invoicing with Batch & Expiry Traceability</span>
            </span>
            <span className="text-[#E3B15F] font-bold">✦</span>
          </div>
        </div>
      </div>

      {/* 2. Primary Navigation Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--line)] shadow-sm">
        <div className="wrap flex items-center justify-between h-[76px] sm:h-[84px] gap-4 sm:gap-6">
          <a href="#top" className="flex items-center gap-3 shrink-0">
            {/* Light Theme Logo */}
            <img
              src={tenant.logoUrlLight || "/assets/logos/Wordmark_lightBG.png"}
              alt={tenant.name}
              className="h-12 sm:h-14 md:h-16 w-auto max-w-[210px] sm:max-w-[270px] md:max-w-[320px] object-contain aspect-[3280/828] [data-theme=dark]_&:hidden dark:hidden"
            />
            {/* Dark Theme Logo */}
            <img
              src={tenant.logoUrlDark || "/assets/logos/Wordmark_darkBG.png"}
              alt={tenant.name}
              className="h-12 sm:h-14 md:h-16 w-auto max-w-[210px] sm:max-w-[270px] md:max-w-[320px] object-contain aspect-[3280/828] hidden [data-theme=dark]_&:block dark:block"
            />
            <span className="hidden xl:block text-xs font-semibold text-[var(--muted)] border-l border-[var(--line)] pl-3 leading-tight">
              Wholesale
              <br />
              Pharmaceuticals
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold tracking-tight">
            <a href="#segments" className="hover:text-[var(--primary)] transition-colors">
              Products
            </a>
            <a href="#why" className="hover:text-[var(--primary)] transition-colors">
              Why Us
            </a>
            <a href="#coldchain" className="hover:text-[var(--primary)] transition-colors">
              Cold Chain
            </a>
            <a href="#about" className="hover:text-[var(--primary)] transition-colors">
              Compliance
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <button
              onClick={() => showToast("Partner portal coming soon. Use the wholesale pricing form below.")}
              className="btn btn-ghost btn-sm"
            >
              Partner Login
            </button>
            <a href="#inquiry" className="btn btn-primary btn-sm">
              Wholesale Pricing
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl border border-[var(--line)] hover:bg-[var(--surface)] transition-colors"
            aria-label="Toggle navigation"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[var(--line)] p-5 bg-[var(--bg)] shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
              <img
                src={tenant.logoUrlLight || "/assets/logos/Wordmark_lightBG.png"}
                alt={tenant.name}
                className="h-10 sm:h-11 w-auto max-w-[200px] object-contain aspect-[3280/828] [data-theme=dark]_&:hidden dark:hidden"
              />
              <img
                src={tenant.logoUrlDark || "/assets/logos/Wordmark_darkBG.png"}
                alt={tenant.name}
                className="h-10 sm:h-11 w-auto max-w-[200px] object-contain aspect-[3280/828] hidden [data-theme=dark]_&:block dark:block"
              />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--text)]"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2.5 font-medium text-base">
              <a href="#segments" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[var(--primary)] transition-colors">
                Products
              </a>
              <a href="#why" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[var(--primary)] transition-colors">
                Why Us
              </a>
              <a href="#coldchain" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[var(--primary)] transition-colors">
                Cold Chain
              </a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="py-1.5 hover:text-[var(--primary)] transition-colors">
                Compliance
              </a>
            </div>
            <div className="pt-2 border-t border-[var(--line)] flex flex-col gap-2.5">
              <a href="#inquiry" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary w-full">
                Wholesale Pricing
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 3. Hero Section with 24-Hour Cold Room Trace Graph */}
      <section className="relative bg-[var(--deep)] text-white overflow-hidden py-16 lg:py-24" id="top">
        <div className="wrap grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold font-display leading-tight tracking-tight">
              {tenant.websiteContent?.heroHeadline || "Reliable Wholesale Pharmaceutical Supply for Pharmacies, Hospitals & Institutions"}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#C9D6EA] leading-relaxed max-w-xl">
              {tenant.websiteContent?.heroSubheadline || "Licensed B2B distributor supplying genuine branded & generic medicines, critical care injectables, and cold-chain biologics with guaranteed 24-48 hour regional dispatch."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={tenant.commercialSettings.catalogPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download Wholesale Catalog (PDF)</span>
              </a>
              <a href="#inquiry" className="btn btn-line">
                Open Credit / Trade Account
              </a>
            </div>
          </div>

          {/* Cold Chain Trace SVG Card */}
          <div className="bg-[#09162D]/80 border border-white/20 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-semibold tracking-wide">Cold Room A • Live 24h Logger</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E3B15F]/20 text-[#E3B15F]">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                In Safe Range (2°C - 8°C)
              </span>
            </div>

            {/* SVG Trace Curve */}
            <div className="py-4">
              <svg viewBox="0 0 500 180" className="w-full h-auto overflow-visible" role="img" aria-label="Temperature Log">
                <rect x="0" y="30" width="500" height="90" fill="rgba(227,177,95,0.12)" />
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(227,177,95,0.4)" strokeDasharray="4 4" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(227,177,95,0.4)" strokeDasharray="4 4" />
                <text x="10" y="25" fill="#E3B15F" fontSize="11" fontWeight="600">8°C Max Limit</text>
                <text x="10" y="135" fill="#E3B15F" fontSize="11" fontWeight="600">2°C Min Limit</text>

                {/* Simulated 24-hr undulating temperature path */}
                <path
                  d="M 0,80 Q 50,60 100,75 T 200,65 T 300,85 T 400,70 T 500,75"
                  fill="none"
                  stroke="#E3B15F"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <circle cx="500" cy="75" r="5" fill="#7BE0A4" />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/10 text-center">
              <div>
                <span className="text-xl font-bold font-display text-white">4.8°C</span>
                <span className="text-xs text-[#9FB3D1] block">Current Temp</span>
              </div>
              <div>
                <span className="text-xl font-bold font-display text-white">3.1°C</span>
                <span className="text-xs text-[#9FB3D1] block">24h Low</span>
              </div>
              <div>
                <span className="text-xl font-bold font-display text-white">6.2°C</span>
                <span className="text-xs text-[#9FB3D1] block">24h High</span>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-[#8DA3C4] text-center">
              Data synchronized via automated IoT cold-chain loggers. Audit reports available with each invoice.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="wrap mt-14 pt-8 border-t border-white/15">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <div className="text-3xl font-bold font-display text-[#E3B15F]">
                {tenant.websiteContent?.statActiveSkus || "5,000+"}
              </div>
              <div className="text-sm font-semibold mt-1">Active SKUs</div>
              <div className="text-xs text-[#A9BAD5]">Branded & generic formulations</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-[#E3B15F]">
                {tenant.websiteContent?.statBatchTraceability || "99.8%"}
              </div>
              <div className="text-sm font-semibold mt-1">Batch Traceability</div>
              <div className="text-xs text-[#A9BAD5]">Genuine direct principal sourcing</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-[#E3B15F]">
                {tenant.websiteContent?.statColdChainSla || "2°C - 8°C"}
              </div>
              <div className="text-sm font-semibold mt-1">Cold Chain SLA</div>
              <div className="text-xs text-[#A9BAD5]">Dual-generator failover storage</div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-[#E3B15F]">
                {tenant.websiteContent?.statDispatchTime || "24-48 Hr"}
              </div>
              <div className="text-sm font-semibold mt-1">Regional Dispatch</div>
              <div className="text-xs text-[#A9BAD5]">Priority hospital & clinic delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Therapeutic Segments */}
      <section className="py-20" id="segments">
        <div className="wrap">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold font-display text-[var(--heading)]">
              Therapeutic Segments We Distribute
            </h2>
            <p className="mt-3 text-[var(--muted)] text-base">
              Comprehensive wholesale inventories across critical hospital specialties and daily retail formulations. Click any segment to view formulations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {segments.map((seg, i) => (
              <div
                key={seg.title}
                className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--accent)] transition-all shadow-sm"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
                    <SegmentIcon name={seg.icon} />
                  </div>
                  <h3 className="text-xl font-bold font-display text-[var(--heading)]">
                    {seg.title}
                  </h3>
                  {seg.coldChain && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      Cold Chain Lines Included
                    </span>
                  )}
                  <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
                    {seg.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSegment(i)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline"
                >
                  <span>View Formulations List</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose Aruka Med */}
      <section className="py-20 bg-[var(--surface)]" id="why">
        <div className="wrap">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-bold font-display text-[var(--heading)]">
              Built for Institutional Procurement
            </h2>
            <p className="mt-3 text-[var(--muted)] text-base">
              Tailored warehousing, genuine manufacturer chains, and structured billing designed for hospital purchase heads and pharmacists.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="border-t-4 border-[var(--accent)] pt-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--heading)]">
                Direct Principal Sourcing
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {tenant.websiteContent?.whyPrincipalSourcing || "100% genuine inventory received directly from authorized pharmaceutical manufacturers, preventing spurious supplies and counterfeit lots."}
              </p>
            </div>

            <div className="border-t-4 border-[var(--accent)] pt-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M4.2 7l15.6 10M4.2 17 19.8 7M9.5 4l2.5 2 2.5-2M9.5 20l2.5-2 2.5 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--heading)]">
                Validated Cold Storage
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {tenant.websiteContent?.whyColdStorage || "Dedicated 2°C to 8°C cold rooms with automated multi-generator failovers for biologics, insulins, and critical vaccines."}
              </p>
            </div>

            <div className="border-t-4 border-[var(--accent)] pt-6">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center mb-4">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--heading)]">
                Institutional Trade Credit
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                {tenant.websiteContent?.whyTradeCredit || "Automated GST-compliant invoicing, batch expiry tracking, and flexible 15-to-30 day trade credit for verified hospitals and clinics."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Cold Chain Protocol */}
      <section className="py-20" id="coldchain">
        <div className="wrap grid lg:grid-cols-[0.8fr_1.2fr] gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold font-display text-[var(--heading)]">
              Cold Chain Maintained Strictly at 2°C to 8°C
            </h2>
            <p className="mt-4 text-[var(--muted)] text-base leading-relaxed">
              Biologics, insulins, and sensitive injectables are thermally audited from dock receiving to delivery at your hospital or pharmacy counter.
            </p>
          </div>

          <ol className="space-y-6">
            <li className="flex gap-4">
              <span className="flex-none h-10 w-10 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <h4 className="text-lg font-bold text-[var(--heading)]">Refrigerated Receiving</h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Shipper temperature tags and batch integrity are verified at our air-conditioned receiving dock.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-none h-10 w-10 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <h4 className="text-lg font-bold text-[var(--heading)]">Continuous Cold Room Storage</h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Stored in dedicated 2°C to 8°C zones with automatic dual-compressor backup and SMS telemetry alerts.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-none h-10 w-10 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] font-bold flex items-center justify-center">
                3
              </span>
              <div>
                <h4 className="text-lg font-bold text-[var(--heading)]">Thermal Shipper Packing</h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Packed in validated conditioned gel-pack insulated shippers calibrated for transit weather conditions.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex-none h-10 w-10 rounded-full border-2 border-[var(--accent)] text-[var(--accent)] font-bold flex items-center justify-center">
                4
              </span>
              <div>
                <h4 className="text-lg font-bold text-[var(--heading)]">Priority 24-48h Delivery</h4>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Dispatched via temperature-monitored routes with GST invoice, batch CoA, and temperature slips included.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* 7. Regulatory Compliance Ledger */}
      <section className="py-20 bg-[var(--surface)]" id="about">
        <div className="wrap grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div>
            <h2 className="text-3xl font-bold font-display text-[var(--heading)]">
              About {tenant.name}
            </h2>
            <p className="mt-4 text-[var(--muted)] text-base leading-relaxed">
              {tenant.complianceInfo?.legalEntityName || tenant.name} is a licensed B2B wholesale pharmaceutical distributor supplying genuine, batch-tracked medicines to hospitals, nursing homes, clinics, and retail pharmacies.
            </p>
            <p className="mt-3 text-[var(--muted)] text-base leading-relaxed">
              We operate strictly under wholesale statutory regulations, enforcing mandatory Form 20B/21B and GSTIN verification on all trade accounts.
            </p>

            <ul className="mt-6 space-y-3">
              <li className="flex items-center gap-3 text-sm font-semibold">
                <svg className="h-4 w-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Supply exclusively to licensed healthcare institutions and pharmacies</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-semibold">
                <svg className="h-4 w-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Full batch, manufacturing, and expiry traceability on every invoice</span>
              </li>
              <li className="flex items-center gap-3 text-sm font-semibold">
                <svg className="h-4 w-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                <span>Direct manufacturer principal representation</span>
              </li>
            </ul>
          </div>

          {/* Compliance Ledger Card */}
          <div className="bg-[var(--card)] border border-[var(--line)] rounded-2xl p-6 shadow-md">
            <h3 className="text-lg font-bold font-display text-[var(--heading)] pb-4 border-b border-[var(--line)]">
              Statutory Licences & Registrations
            </h3>
            <dl className="divide-y divide-[var(--line)] text-sm mt-2">
              <div className="py-3 flex justify-between">
                <dt className="text-[var(--muted)]">Wholesale Drug Licence (Form 20B)</dt>
                <dd className="font-mono font-semibold">{tenant.complianceInfo.drugLicences[0]?.number}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[var(--muted)]">Wholesale Drug Licence (Form 21B)</dt>
                <dd className="font-mono font-semibold">{tenant.complianceInfo.drugLicences[1]?.number}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[var(--muted)]">GSTIN Registration</dt>
                <dd className="font-mono font-semibold">{tenant.complianceInfo.gstin}</dd>
              </div>
              <div className="py-3 flex justify-between">
                <dt className="text-[var(--muted)]">Cold Chain GDP Audit</dt>
                <dd className="font-mono font-semibold">{tenant.complianceInfo.coldChainCertification?.certificateNumber}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 8. Inquiry & Price List Form */}
      <section className="py-20" id="inquiry">
        <div className="wrap">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] border border-[var(--line)] rounded-3xl overflow-hidden bg-[var(--card)] shadow-xl">
            <div className="bg-[var(--deep)] text-[#DCE6F5] p-8 sm:p-12 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-semibold text-emerald-400 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Central Trade Desk Active</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-tight">
                  Request Wholesale Rate Card
                </h2>
                <p className="mt-4 text-[#B9C8E0] text-sm leading-relaxed">
                  Direct B2B institutional pricing, MOQ volume slabs, and credit terms for verified healthcare providers.
                </p>

                <div className="mt-8 space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#E3B15F]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <strong className="text-white">Strictly Licensed B2B Supply</strong>
                      <p className="text-xs text-[#9BB3D5] mt-0.5">Form 20B/21B and GSTIN verified transactions only.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#E3B15F]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div>
                      <strong className="text-white">2-Hour Rapid Dispatch Schedule</strong>
                      <p className="text-xs text-[#9BB3D5] mt-0.5">Price list and batch inventory sent directly to your WhatsApp or Email.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-[#E3B15F]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="h-3.5 w-3.5 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    </div>
                    <div>
                      <strong className="text-white">Batch Certificate of Analysis (CoA)</strong>
                      <p className="text-xs text-[#9BB3D5] mt-0.5">Included with every cold chain and pharmaceutical dispatch.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-white/10 text-xs text-[#8EA7CA] space-y-1.5">
                <div>Central Helpline: <a href="tel:+915120000000" className="text-[#E3B15F] font-semibold hover:underline">+91 512-0000000</a></div>
                <div>Order Desk: <a href={`mailto:${tenant.commercialSettings.orderDeskEmail}`} className="text-[#E3B15F] font-semibold hover:underline">{tenant.commercialSettings.orderDeskEmail}</a></div>
              </div>
            </div>

            <div className="p-6 sm:p-10 lg:p-12">
              {leadSuccess ? (
                <div className="text-center py-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-5 border border-emerald-500/20">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold font-display text-[var(--heading)]">
                    Inquiry Queued for Verification
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)] max-w-md mx-auto leading-relaxed">
                    Thank you! Our institutional trade desk has received your request. The current wholesale price list & batch inventory will be dispatched to {submittedPhone || "your contact number"} shortly.
                  </p>

                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <a
                      href="https://wa.me/915120000000?text=Hello%20ArukaMed%2C%20I%20have%20submitted%20a%20wholesale%20rate%20card%20request%20for%20my%20institution."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm w-full sm:w-auto"
                    >
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.288.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.102-.115.434-.506.549-.68.116-.173.232-.144.39-.086.159.058 1.011.477 1.184.564.173.087.289.13.332.203.043.072.043.419-.101.824z"/></svg>
                      Chat on WhatsApp for Urgent Dispatch
                    </a>
                    <button
                      onClick={() => setLeadSuccess(false)}
                      className="btn btn-ghost btn-sm w-full sm:w-auto"
                    >
                      Submit Another Inquiry
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  {/* Honeypot security field */}
                  <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

                  {/* 1. Custom Interactive Institution Type Selector */}
                  <div>
                    <label className="lbl flex items-center justify-between">
                      <span>1. Select Healthcare Institution Type *</span>
                      <span className="text-xs text-[var(--muted)] font-normal">Sets discount tier</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-1.5">
                      {[
                        { id: "Hospital / Nursing Home", label: "Hospital", sub: "ICU & Inpatient", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
                        { id: "Chemist / Pharmacy", label: "Retail Pharmacy", sub: "Trade Margins", icon: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 7h-6L8 4z" },
                        { id: "Clinic / Doctor Practice", label: "Clinic / OPD", sub: "Direct Dispensing", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
                        { id: "Stockist / Distributor", label: "Wholesale Trader", sub: "Bulk Carton Slabs", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
                      ].map((item) => {
                        const active = institutionType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setInstitutionType(item.id)}
                            className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                              active
                                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--heading)] ring-2 ring-[var(--primary)]/30 shadow-sm"
                                : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--primary)]/50 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <svg className={`h-5 w-5 ${active ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                              </svg>
                              {active && (
                                <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0" />
                              )}
                            </div>
                            <div>
                              <div className={`text-xs font-bold leading-tight ${active ? "text-[var(--heading)]" : "text-[var(--text)]"}`}>
                                {item.label}
                              </div>
                              <div className="text-[10px] text-[var(--muted)] mt-0.5 leading-tight">
                                {item.sub}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {formErrors.type && <p className="text-xs text-red-600 mt-1">{formErrors.type}</p>}
                  </div>

                  {/* 2. Custom Interactive Requirement Category Pills */}
                  <div>
                    <label className="lbl flex items-center justify-between">
                      <span>2. Target Formulation Category</span>
                      <span className="text-xs text-[var(--muted)] font-normal">Optional filter</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {[
                        "All / General Wholesale Catalog",
                        "Critical Care & Anesthesia",
                        "Cardiology & Diabetes",
                        "Oncology & Biologics",
                        "Antibiotics & Anti-Infectives",
                        "Hospital Surgicals",
                      ].map((cat) => {
                        const isSelected = requirementCategory === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setRequirementCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                              isSelected
                                ? "bg-[var(--deep)] text-white border-[var(--deep)] shadow-sm"
                                : "bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:border-[var(--primary)]/40 hover:text-[var(--text)]"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Institution & Contact Details */}
                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="lbl">Hospital / Chemist / Institution Legal Name *</label>
                      <div className="relative">
                        <input
                          required
                          name="name"
                          type="text"
                          placeholder="e.g. Apollo Pharmacy / City Heart Hospital"
                          className="field pl-10"
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                        </div>
                      </div>
                      {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="lbl">Contact Person *</label>
                        <div className="flex gap-2">
                          <select
                            value={contactHonorific}
                            onChange={(e) => setContactHonorific(e.target.value)}
                            className="w-20 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2 py-3 text-xs font-semibold text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
                          >
                            <option value="Dr.">Dr.</option>
                            <option value="Mr.">Mr.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Pharm.">Pharm.</option>
                          </select>
                          <input
                            required
                            name="person"
                            type="text"
                            placeholder="Full name"
                            className="field flex-1"
                          />
                        </div>
                        {formErrors.person && <p className="text-xs text-red-600 mt-1">{formErrors.person}</p>}
                      </div>

                      <div>
                        <label className="lbl flex items-center justify-between">
                          <span>Mobile / WhatsApp Number *</span>
                          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            WhatsApp Rate Sheet
                          </span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--muted)] border-r border-[var(--line)] pr-2 pointer-events-none">
                            +91
                          </div>
                          <input
                            required
                            name="phone"
                            type="tel"
                            placeholder="98765 43210"
                            className="field pl-14 font-mono text-sm"
                          />
                        </div>
                        {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="lbl flex items-center justify-between">
                        <span>Official Procurement Email (Optional)</span>
                        <span className="text-xs text-[var(--muted)] font-normal">For formal PO & PDF rate card</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        placeholder="purchase@hospital.com / billing@pharmacy.in"
                        className="field text-sm"
                      />
                      {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
                    </div>
                  </div>

                  {/* 4. Interactive Accordion for Licences / Verification Boost */}
                  <div className="border border-[var(--line)] rounded-2xl p-4 bg-[var(--surface)] transition-all">
                    <button
                      type="button"
                      onClick={() => setShowComplianceFields(!showComplianceFields)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-[var(--heading)] group"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-[#E3B15F]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        <span>Add Drug Licence (Form 20B/21B) or GSTIN for Instant Account Approval (Optional)</span>
                      </span>
                      <span className="text-[var(--primary)] group-hover:translate-x-0.5 transition-transform text-xs font-semibold">
                        {showComplianceFields ? "Hide" : "+ Add Details"}
                      </span>
                    </button>

                    {showComplianceFields && (
                      <div className="mt-4 pt-4 border-t border-[var(--line)] space-y-3 animate-in fade-in duration-200">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="lbl text-xs">Wholesale Drug Licence No.</label>
                            <input
                              name="licence"
                              type="text"
                              placeholder="e.g. UP-KNP-20B-123456"
                              className="field text-xs uppercase font-mono"
                            />
                          </div>
                          <div>
                            <label className="lbl text-xs">GSTIN (15-Digit)</label>
                            <input
                              name="gstin"
                              type="text"
                              placeholder="09ABCDE1234F1Z5"
                              className="field text-xs uppercase font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="lbl text-xs">Expected Monthly Purchase Volume</label>
                          <select
                            name="volume"
                            className="field text-xs"
                          >
                            <option value="">Select expected monthly procurement volume</option>
                            <option value="Under ₹2 Lakhs">Under ₹2 Lakhs / month</option>
                            <option value="₹2 - ₹10 Lakhs">₹2 Lakhs - ₹10 Lakhs / month (Institutional Tier 1)</option>
                            <option value="₹10 - ₹50 Lakhs">₹10 Lakhs - ₹50 Lakhs / month (Hospital Tier 2)</option>
                            <option value="Above ₹50 Lakhs">Above ₹50 Lakhs / month (Direct Principal Slabs)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-13 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base disabled:opacity-70 mt-4 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Dispatching to Trade Desk...</span>
                      </>
                    ) : (
                      <>
                        <span>Request Wholesale Price List & Account Setup</span>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--muted)] text-center pt-1">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                      CDSCO Statutory Compliance
                    </span>
                    <span>•</span>
                    <span>No Retail / Individual Patient Sales</span>
                    <span>•</span>
                    <span>Encrypted Trade Portal</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-[var(--deep)] text-[#C4D2E8] pt-16 pb-12 text-sm">
        <div className="wrap grid md:grid-cols-3 gap-12">
          <div>
            <img
              src={tenant.logoUrlDark || "/assets/logos/Wordmark_darkBG.png"}
              alt={tenant.name}
              className="h-14 sm:h-16 md:h-18 w-auto max-w-[260px] sm:max-w-[320px] object-contain aspect-[3280/828] mb-5 drop-shadow-sm"
            />
            <p className="text-xs leading-relaxed text-[#B3C3DC] max-w-sm">
              {tenant.complianceInfo.legalEntityName} is a licensed wholesale pharmaceutical distributor supplying genuine batch-tracked formulations across northern India.
            </p>
            <div className="mt-4 text-xs font-mono text-[#DCE6F5]">
              GSTIN: {tenant.complianceInfo.gstin}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#segments" className="hover:text-white">Therapeutic Segments</a></li>
              <li><a href="#coldchain" className="hover:text-white">Cold Chain Standards</a></li>
              <li><a href="#about" className="hover:text-white">Licences (Form 20B & 21B)</a></li>
              <li><a href="#inquiry" className="hover:text-white">Request Wholesale Catalog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Central Dispatch & Warehouse</h4>
            <address className="not-italic text-xs text-[#B3C3DC] leading-relaxed">
              {tenant.complianceInfo.warehouseAddress.line1}
              <br />
              {tenant.complianceInfo.warehouseAddress.city}, {tenant.complianceInfo.warehouseAddress.state} - {tenant.complianceInfo.warehouseAddress.pincode}
              <br />
              Order Desk: <a href={`mailto:${tenant.commercialSettings.orderDeskEmail}`} className="text-[#E3B15F]">{tenant.commercialSettings.orderDeskEmail}</a>
              <br />
              Helpline: {tenant.commercialSettings.centralHelplinePhone}
            </address>
          </div>
        </div>

        <div className="wrap mt-12 pt-6 border-t border-white/10 text-xs text-center text-[#8B9DBB]">
          &copy; {new Date().getFullYear()} {tenant.complianceInfo.legalEntityName}. Wholesale supply only to licensed healthcare entities.
        </div>
      </footer>

      {/* Formulation Modal */}
      {selectedSegment !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--surface)] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                  <SegmentIcon name={segments[selectedSegment].icon} />
                </div>
                <h3 className="text-xl font-bold font-display text-[var(--heading)]">
                  {segments[selectedSegment].title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSegment(null)}
                className="text-lg font-bold text-[var(--muted)] hover:text-[var(--text)] p-1"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="mt-4 text-sm text-[var(--muted)]">
              {segments[selectedSegment].description}
            </p>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--heading)] mb-2">
                Available Formulation Categories
              </h4>
              <ul className="space-y-1.5 text-sm">
                {segments[selectedSegment].formulations.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-[var(--accent)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex justify-end">
              <a
                href="#inquiry"
                onClick={() => setSelectedSegment(null)}
                className="btn btn-primary btn-sm"
              >
                Request Price List for this Segment
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-[var(--deep)] px-6 py-3 text-xs font-semibold text-white shadow-2xl ring-1 ring-[var(--accent)]">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
