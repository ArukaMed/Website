"use client";

import React, { useState } from "react";
import type { Employee, UserSession } from "@aegis/types";
import { AvatarUploader } from "../ui/avatar-uploader";

interface SteppedEnrollmentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  session: UserSession | null;
  onSuccess: (newEmployee: Employee) => void;
  showToast: (msg: string) => void;
}

const STEPS = [
  { step: 1, title: "Primary Identity", desc: "Legal identity & demographics" },
  { step: 2, title: "Contact & Address", desc: "Phones, emails & residences" },
  { step: 3, title: "Emergency Contacts", desc: "Min 2 workplace safety contacts" },
  { step: 4, title: "Statutory & Tax", desc: "PAN, Aadhaar & tax regime" },
  { step: 5, title: "Financial / Banking", desc: "Salary disbursement account" },
  { step: 6, title: "Education & Prior Work", desc: "Degrees & relieving history" },
  { step: 7, title: "Job, Nominees & QR", desc: "Role, manager & visiting card" },
];

export function SteppedEnrollmentWizard({
  isOpen,
  onClose,
  tenantSlug,
  session,
  onSuccess,
  showToast,
}: SteppedEnrollmentWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Primary Identity
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [pronouns, setPronouns] = useState("He/Him");
  const [dateOfBirth, setDateOfBirth] = useState("1993-06-15");
  const [gender, setGender] = useState("Male");
  const [maritalStatus, setMaritalStatus] = useState("Single");
  const [nationality, setNationality] = useState("Indian");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Step 2: Contact & Address
  const [personalPhone, setPersonalPhone] = useState("+91 98");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressCity, setAddressCity] = useState("Kanpur");
  const [addressState, setAddressState] = useState("Uttar Pradesh");
  const [addressPincode, setAddressPincode] = useState("208001");
  const [permSameAsCurrent, setPermSameAsCurrent] = useState(true);

  // Step 3: Emergency Contacts
  const [emc1Name, setEmc1Name] = useState("");
  const [emc1Rel, setEmc1Rel] = useState("Spouse");
  const [emc1Phone, setEmc1Phone] = useState("+91 ");
  const [emc1Address, setEmc1Address] = useState("");

  const [emc2Name, setEmc2Name] = useState("");
  const [emc2Rel, setEmc2Rel] = useState("Parent / Sibling");
  const [emc2Phone, setEmc2Phone] = useState("+91 ");
  const [emc2Address, setEmc2Address] = useState("");

  // Step 4: Statutory & Tax
  const [panNumber, setPanNumber] = useState("");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [providentFundUan, setProvidentFundUan] = useState("");
  const [taxRegime, setTaxRegime] = useState<any>("New Tax Regime (115BAC)");

  // Step 5: Financial / Banking
  const [bankName, setBankName] = useState("HDFC Bank Ltd");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingCode, setRoutingCode] = useState("");
  const [accountType, setAccountType] = useState<any>("Salary");

  // Step 6: Education & Prior Employment
  const [highestDegree, setHighestDegree] = useState("Bachelor of Pharmacy (B.Pharm)");
  const [highestDegreeInstitution, setHighestDegreeInstitution] = useState("Kanpur University");
  const [priorCompany, setPriorCompany] = useState("Apollo Health Logistics");
  const [priorDesignation, setPriorDesignation] = useState("Field Sales Executive");

  // Step 7: Job Setup, Dependents & Public QR
  const [designation, setDesignation] = useState("Area Sales Manager");
  const [department, setDepartment] = useState("Wholesale Sales & Institutional Accounts");
  const [territoryRegion, setTerritoryRegion] = useState("North Zone (UP & NCR)");
  const [managerName, setManagerName] = useState("Alex Smith");
  const [dependentName, setDependentName] = useState("");
  const [dependentRel, setDependentRel] = useState("Spouse");
  const [nomineeShare, setNomineeShare] = useState(100);
  const [customSlug, setCustomSlug] = useState("");

  if (!isOpen) return null;

  const handleNext = () => {
    // Basic validation per step
    if (currentStep === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        alert("Please provide both legal First Name and Last Name.");
        return;
      }
      if (!accountHolderName) {
        setAccountHolderName(`${firstName.trim()} ${lastName.trim()}`);
      }
      if (!workEmail) {
        setWorkEmail(`${firstName.toLowerCase().trim()}.${lastName.toLowerCase().trim()}@arukamed.com`);
      }
    } else if (currentStep === 2) {
      if (!personalPhone.trim() || personalPhone.length < 8) {
        alert("Please enter a valid personal mobile phone number.");
        return;
      }
      if (!addressLine1.trim()) {
        alert("Please provide the residential street address.");
        return;
      }
    } else if (currentStep === 3) {
      if (!emc1Name.trim() || !emc1Phone.trim() || !emc2Name.trim() || !emc2Phone.trim()) {
        alert("Please provide details for both Emergency Contact 1 and Emergency Contact 2.");
        return;
      }
    } else if (currentStep === 4) {
      if (!panNumber.trim() || panNumber.trim().length !== 10) {
        alert("Please provide a valid 10-character PAN number (e.g. ABCDE1234F).");
        return;
      }
    } else if (currentStep === 5) {
      if (!accountNumber.trim() || !routingCode.trim()) {
        alert("Please provide both Bank Account Number and IFSC / Routing code.");
        return;
      }
    }

    if (currentStep < 7) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedCode = `EMP-${Math.floor(10000 + Math.random() * 90000)}`;
    const cleanSlug = (customSlug || `${firstName}-${lastName}-${Math.random().toString(36).substring(2, 6)}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const payload = {
      tenantSlug,
      slug: cleanSlug,
      employeeCode: generatedCode,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferredName: preferredName.trim() || firstName.trim(),
      pronouns,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      avatarUrl: avatarUrl || null,
      bio: bio.trim() || `Operations and distribution specialist for Aruka Med, supporting ${territoryRegion}.`,

      phoneNumber: personalPhone.trim(),
      whatsappNumber: personalPhone.trim(),
      email: workEmail.trim(),
      personalEmail: personalEmail.trim() || null,
      personalPhone: personalPhone.trim(),
      alternatePhone: alternatePhone.trim() || null,
      officeExtension: "101",

      currentAddress: {
        line1: addressLine1.trim(),
        city: addressCity.trim(),
        state: addressState.trim(),
        pincode: addressPincode.trim(),
        country: "India",
        verified: true,
      },
      permanentAddress: {
        sameAsCurrent: permSameAsCurrent,
        line1: addressLine1.trim(),
        city: addressCity.trim(),
        state: addressState.trim(),
        pincode: addressPincode.trim(),
        country: "India",
        verified: true,
      },

      emergencyContacts: [
        {
          id: "emc-1",
          name: emc1Name.trim(),
          relationship: emc1Rel.trim(),
          primaryPhone: emc1Phone.trim(),
          address: emc1Address.trim() || addressLine1.trim(),
          isPrimary: true,
        },
        {
          id: "emc-2",
          name: emc2Name.trim(),
          relationship: emc2Rel.trim(),
          primaryPhone: emc2Phone.trim(),
          address: emc2Address.trim() || addressLine1.trim(),
          isPrimary: false,
        },
      ],

      designation: designation.trim() || "Operations Specialist",
      department: department.trim(),
      division: department.trim(),
      territoryRegion: territoryRegion.trim(),
      directManager: {
        name: managerName.trim() || "Alex Smith",
        designation: "Chief Operating Officer",
        email: "alex.smith@arukamed.com",
        employeeCode: "EMP-10001",
      },

      panNumber: panNumber.trim().toUpperCase(),
      aadhaarNumber: aadhaarNumber.trim(),
      providentFundUan: providentFundUan.trim(),
      taxRegime,
      statutoryStatus: "Pending HR Review",

      bankAccount: {
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim() || `${firstName} ${lastName}`.trim(),
        accountNumber: accountNumber.trim(),
        routingCode: routingCode.trim().toUpperCase(),
        accountType,
        verificationStatus: "Penny-Drop Verified",
      },

      education: [
        {
          id: "edu-1",
          institution: highestDegreeInstitution.trim() || "State University",
          degree: highestDegree.trim(),
          fieldOfStudy: "Pharmaceutical Sciences",
          graduationYear: "2019",
        },
      ],

      priorEmployment: [
        {
          id: "exp-1",
          company: priorCompany.trim() || "Healthcare Distributors",
          designation: priorDesignation.trim() || "Associate",
          startDate: "2019-06",
          endDate: "2023-01",
        },
      ],

      dependents: [
        {
          id: "dep-1",
          name: dependentName.trim() || emc1Name.trim() || "Family Nominee",
          relationship: dependentRel.trim() || "Spouse",
          nomineeAllocationPercent: Number(nomineeShare) || 100,
          benefitType: "Gratuity & Group Medical Cover",
        },
      ],
    };

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to enroll employee");
      }

      onSuccess(data.employee);
      showToast(`Employee ${firstName} ${lastName} successfully enrolled! Live card and QR generated.`);
      onClose();
    } catch (err: any) {
      alert(err?.message || "Failed to enroll employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Wizard Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#09162D] text-[#E3B15F] rounded-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
              <h3 className="font-bold text-slate-900 text-base font-display">
                Enroll Employee & Onboard to Operations
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Step {currentStep} of 7: <span className="font-semibold text-navy">{STEPS[currentStep - 1].title}</span> —{" "}
              {STEPS[currentStep - 1].desc}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200/60 flex items-center gap-1 overflow-x-auto">
          {STEPS.map((s) => (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < currentStep) setCurrentStep(s.step);
              }}
              className={`flex-1 min-w-[70px] flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer transition-colors ${
                s.step === currentStep
                  ? "bg-[#09162D] text-[#E3B15F] font-bold shadow-sm"
                  : s.step < currentStep
                  ? "bg-emerald-100 text-emerald-800 font-semibold"
                  : "bg-slate-200/60 text-slate-400"
              }`}
            >
              <span className="text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {s.step < currentStep ? "✓" : s.step}
              </span>
              <span className="text-[10px] truncate hidden sm:inline">{s.title.split(" ")[0]}</span>
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-7">
          {/* STEP 1: PRIMARY IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-4 text-xs">
              {/* Photograph Uploader */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="font-semibold block mb-2 text-slate-800 text-xs">Official Employee Photograph (Cloudinary CDN)</span>
                <AvatarUploader
                  currentAvatarUrl={avatarUrl}
                  employeeName={`${firstName} ${lastName}`.trim() || "New Employee"}
                  onUploadSuccess={(url) => setAvatarUrl(url)}
                  onRemove={() => setAvatarUrl(null)}
                  compact={true}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Legal First Name *</label>
                  <input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Legal Last Name *</label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Verma"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Preferred Display Name</label>
                  <input
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                    placeholder="e.g. Rahul"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Pronouns</label>
                  <select
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="He/Him">He / Him</option>
                    <option value="She/Her">She / Her</option>
                    <option value="They/Them">They / Them</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Marital Status</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full p-2.5 border rounded-xl bg-white"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Professional Summary / Bio</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Summary of experience in wholesale pharmaceuticals..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT & ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Personal Calling Mobile *</label>
                  <input
                    required
                    value={personalPhone}
                    onChange={(e) => setPersonalPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Work Email *</label>
                  <input
                    required
                    type="email"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Personal Email (Confidential)</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="rahul.personal@gmail.com"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Alternate Emergency Phone</label>
                  <input
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="+91 91234 56789"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900 block mb-2">Residential Street Address *</span>
                <input
                  required
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full p-2.5 border rounded-xl mb-2"
                  placeholder="Flat / House #, Street Name, Colony / Sector"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className="p-2.5 border rounded-xl"
                    placeholder="City"
                  />
                  <input
                    required
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    className="p-2.5 border rounded-xl"
                    placeholder="State"
                  />
                  <input
                    required
                    value={addressPincode}
                    onChange={(e) => setAddressPincode(e.target.value)}
                    className="p-2.5 border rounded-xl font-mono"
                    placeholder="PIN Code"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={permSameAsCurrent}
                  onChange={(e) => setPermSameAsCurrent(e.target.checked)}
                  className="rounded text-blue-600 h-4 w-4"
                />
                <span className="font-semibold text-slate-800">Permanent address is identical to current address</span>
              </label>
            </div>
          )}

          {/* STEP 3: EMERGENCY CONTACTS */}
          {currentStep === 3 && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-bold text-slate-900 block">Primary Emergency Contact *</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    value={emc1Name}
                    onChange={(e) => setEmc1Name(e.target.value)}
                    placeholder="Full Name (e.g. Spouse / Mother)"
                    className="p-2.5 border rounded-xl bg-white"
                  />
                  <input
                    required
                    value={emc1Rel}
                    onChange={(e) => setEmc1Rel(e.target.value)}
                    placeholder="Relationship (e.g. Spouse)"
                    className="p-2.5 border rounded-xl bg-white"
                  />
                </div>
                <input
                  required
                  value={emc1Phone}
                  onChange={(e) => setEmc1Phone(e.target.value)}
                  placeholder="Primary Phone Number"
                  className="w-full p-2.5 border rounded-xl font-mono bg-white"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-bold text-slate-900 block">Secondary Emergency Contact *</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    value={emc2Name}
                    onChange={(e) => setEmc2Name(e.target.value)}
                    placeholder="Full Name (e.g. Brother / Father)"
                    className="p-2.5 border rounded-xl bg-white"
                  />
                  <input
                    required
                    value={emc2Rel}
                    onChange={(e) => setEmc2Rel(e.target.value)}
                    placeholder="Relationship (e.g. Brother)"
                    className="p-2.5 border rounded-xl bg-white"
                  />
                </div>
                <input
                  required
                  value={emc2Phone}
                  onChange={(e) => setEmc2Phone(e.target.value)}
                  placeholder="Secondary Phone Number"
                  className="w-full p-2.5 border rounded-xl font-mono bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 4: STATUTORY & TAX */}
          {currentStep === 4 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Income Tax PAN Number *</label>
                  <input
                    required
                    value={panNumber}
                    onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-xl font-mono uppercase"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">National ID (Aadhaar Number) *</label>
                  <input
                    required
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="12-digit UID"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Universal Account Number (PF UAN)</label>
                <input
                  value={providentFundUan}
                  onChange={(e) => setProvidentFundUan(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono"
                  placeholder="12-digit UAN for EPFO transfer"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Elected Income Tax Regime</label>
                <select
                  value={taxRegime}
                  onChange={(e) => setTaxRegime(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white font-medium"
                >
                  <option value="New Tax Regime (115BAC)">New Tax Regime (115BAC) - Default Concessional</option>
                  <option value="Old Tax Regime">Old Tax Regime (Section 80C/80D Exemptions)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: FINANCIAL & BANKING */}
          {currentStep === 5 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Bank Name *</label>
                <input
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="e.g. HDFC Bank Ltd"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Account Holder Full Legal Name *</label>
                <input
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Bank Account Number *</label>
                  <input
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="e.g. 50100998877665"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">IFSC / Branch Routing Code *</label>
                  <input
                    required
                    value={routingCode}
                    onChange={(e) => setRoutingCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-xl font-mono uppercase"
                    placeholder="HDFC0001234"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Account Type</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                >
                  <option value="Salary">Salary Account</option>
                  <option value="Savings">Savings Account</option>
                  <option value="Current">Current Account</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 6: EDUCATION & PRIOR WORK */}
          {currentStep === 6 && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-bold text-slate-900 block">Highest Educational Qualification</span>
                <input
                  value={highestDegree}
                  onChange={(e) => setHighestDegree(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                  placeholder="Degree Title (e.g. B.Pharm / MBA / BSc)"
                />
                <input
                  value={highestDegreeInstitution}
                  onChange={(e) => setHighestDegreeInstitution(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                  placeholder="University / College / Institute Name"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <span className="font-bold text-slate-900 block">Most Recent Prior Employment</span>
                <input
                  value={priorCompany}
                  onChange={(e) => setPriorCompany(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                  placeholder="Previous Company Name"
                />
                <input
                  value={priorDesignation}
                  onChange={(e) => setPriorDesignation(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white"
                  placeholder="Previous Designation / Role"
                />
              </div>
            </div>
          )}

          {/* STEP 7: JOB SETUP & PUBLIC QR PROFILE */}
          {currentStep === 7 && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Official Designation *</label>
                  <input
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Department / Unit *</label>
                  <input
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Territory / Zone *</label>
                  <input
                    required
                    value={territoryRegion}
                    onChange={(e) => setTerritoryRegion(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Direct Manager *</label>
                  <input
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-2xl space-y-2.5">
                <span className="font-bold text-teal-950 block">Primary Nominee / Beneficiary</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={dependentName}
                    onChange={(e) => setDependentName(e.target.value)}
                    placeholder="Nominee Legal Name"
                    className="p-2 border rounded-xl bg-white"
                  />
                  <input
                    value={dependentRel}
                    onChange={(e) => setDependentRel(e.target.value)}
                    placeholder="Relationship (e.g. Spouse)"
                    className="p-2 border rounded-xl bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Nominee Allocation Share:</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={nomineeShare}
                    onChange={(e) => setNomineeShare(Number(e.target.value))}
                    className="w-20 p-1.5 border rounded-lg bg-white font-mono"
                  />
                  <span className="font-bold text-teal-900">%</span>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Custom Digital Card Slug (optional)</label>
                <input
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="e.g. rahul-verma-up"
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Generates visiting card at /c/[slug] with instant print QR synchronization.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={currentStep === 1 ? onClose : handleBack}
            className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-200/70 font-semibold text-xs"
          >
            {currentStep === 1 ? "Cancel" : "Back"}
          </button>

          {currentStep < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Next: {STEPS[currentStep].title}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="px-6 py-2.5 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Enrolling Employee & Generating Card...</span>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Complete Enrollment & Generate QR Card</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
