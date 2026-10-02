"use client";

import React, { useState } from "react";
import type { Employee, UserSession } from "@aegis/types";
import type { EditCardType } from "../types";
import { AvatarUploader } from "../ui/avatar-uploader";

interface CardEditModalProps {
  cardType: EditCardType;
  employee: Employee;
  tenantSlug: string;
  session: UserSession | null;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
  showToast: (msg: string) => void;
}

export function CardEditModal({
  cardType,
  employee,
  tenantSlug,
  session,
  onClose,
  onSave,
  showToast,
}: CardEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);

  // Identity Form State
  const [firstName, setFirstName] = useState(employee.firstName || "");
  const [lastName, setLastName] = useState(employee.lastName || "");
  const [preferredName, setPreferredName] = useState(employee.preferredName || "");
  const [pronouns, setPronouns] = useState(employee.pronouns || "He/Him");
  const [dateOfBirth, setDateOfBirth] = useState(employee.dateOfBirth || "1991-08-24");
  const [gender, setGender] = useState(employee.gender || "Male");
  const [maritalStatus, setMaritalStatus] = useState(employee.maritalStatus || "Married");
  const [nationality, setNationality] = useState(employee.nationality || "Indian");
  const [bio, setBio] = useState(employee.bio || "");
  const [skillsText, setSkillsText] = useState((employee.skills || []).join(", "));
  const [avatarUrl, setAvatarUrl] = useState(employee.avatarUrl || null);

  // Contact Form State
  const [phoneNumber, setPhoneNumber] = useState(employee.phoneNumber || "");
  const [whatsappNumber, setWhatsappNumber] = useState(employee.whatsappNumber || "");
  const [email, setEmail] = useState(employee.email || "");
  const [personalEmail, setPersonalEmail] = useState(employee.personalEmail || "");
  const [personalPhone, setPersonalPhone] = useState(employee.personalPhone || "");
  const [alternatePhone, setAlternatePhone] = useState(employee.alternatePhone || "");
  const [officeExtension, setOfficeExtension] = useState(employee.officeExtension || "101");

  // Emergency Form State
  const initialEmc1 = employee.emergencyContacts?.[0] || {
    id: "emc-1",
    name: "Sarah Prakash",
    relationship: "Spouse",
    primaryPhone: "+91 98765 43210",
    secondaryPhone: "+91 98765 43211",
    address: "#14, 4th Cross, Indiranagar, Bengaluru",
    isPrimary: true,
  };
  const initialEmc2 = employee.emergencyContacts?.[1] || {
    id: "emc-2",
    name: "David Prakash",
    relationship: "Brother",
    primaryPhone: "+91 91234 56789",
    secondaryPhone: "",
    address: "Civil Lines, Kanpur, UP",
    isPrimary: false,
  };
  const [emc1Name, setEmc1Name] = useState(initialEmc1.name);
  const [emc1Rel, setEmc1Rel] = useState(initialEmc1.relationship);
  const [emc1Phone, setEmc1Phone] = useState(initialEmc1.primaryPhone);
  const [emc1Address, setEmc1Address] = useState(initialEmc1.address || "");

  const [emc2Name, setEmc2Name] = useState(initialEmc2.name);
  const [emc2Rel, setEmc2Rel] = useState(initialEmc2.relationship);
  const [emc2Phone, setEmc2Phone] = useState(initialEmc2.primaryPhone);
  const [emc2Address, setEmc2Address] = useState(initialEmc2.address || "");

  // Address Form State
  const [currLine1, setCurrLine1] = useState(employee.currentAddress?.line1 || "");
  const [currLine2, setCurrLine2] = useState(employee.currentAddress?.line2 || "");
  const [currCity, setCurrCity] = useState(employee.currentAddress?.city || "");
  const [currState, setCurrState] = useState(employee.currentAddress?.state || "");
  const [currPincode, setCurrPincode] = useState(employee.currentAddress?.pincode || "");
  const [permSame, setPermSame] = useState(employee.permanentAddress?.sameAsCurrent ?? true);
  const [permLine1, setPermLine1] = useState(employee.permanentAddress?.line1 || "");
  const [permCity, setPermCity] = useState(employee.permanentAddress?.city || "");
  const [permState, setPermState] = useState(employee.permanentAddress?.state || "");
  const [permPincode, setPermPincode] = useState(employee.permanentAddress?.pincode || "");

  // Job Form State
  const [designation, setDesignation] = useState(employee.designation || "");
  const [department, setDepartment] = useState(employee.department || "");
  const [division, setDivision] = useState(employee.division || "");
  const [territoryRegion, setTerritoryRegion] = useState(employee.territoryRegion || "");
  const [managerName, setManagerName] = useState(employee.directManager?.name || "");
  const [workLocation, setWorkLocation] = useState(employee.workLocation || "");
  const [shiftSchedule, setShiftSchedule] = useState(employee.shiftSchedule || "");
  const [timezone, setTimezone] = useState(employee.timezone || "Asia/Kolkata");
  const [employmentType, setEmploymentType] = useState<any>(employee.employmentType || "Full-time (Perm)");
  const [noticePeriodDays, setNoticePeriodDays] = useState(employee.noticePeriodDays || 60);

  // Statutory Form State
  const [panNumber, setPanNumber] = useState(employee.panNumber || "");
  const [aadhaarNumber, setAadhaarNumber] = useState(employee.aadhaarNumber || "");
  const [providentFundUan, setProvidentFundUan] = useState(employee.providentFundUan || "");
  const [taxRegime, setTaxRegime] = useState<any>(employee.taxRegime || "New Tax Regime (115BAC)");

  // Banking Form State
  const [bankName, setBankName] = useState(employee.bankAccount?.bankName || "");
  const [accountHolderName, setAccountHolderName] = useState(
    employee.bankAccount?.accountHolderName || `${employee.firstName} ${employee.lastName}`
  );
  const [accountNumber, setAccountNumber] = useState(employee.bankAccount?.accountNumber || "");
  const [routingCode, setRoutingCode] = useState(employee.bankAccount?.routingCode || "");
  const [accountType, setAccountType] = useState<any>(employee.bankAccount?.accountType || "Salary");

  // QR Settings State
  const [customGreeting, setCustomGreeting] = useState(employee.customWhatsappTemplate || "");
  const [customRateCard, setCustomRateCard] = useState(employee.customRateCardUrl || "");
  const [isCardActive, setIsCardActive] = useState(employee.isActive);

  if (!cardType) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    let patch: Partial<Employee> = {};
    let auditEntry: any = null;

    if (cardType === "identity") {
      const skills = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
      patch = {
        firstName,
        lastName,
        preferredName,
        pronouns,
        dateOfBirth,
        gender,
        maritalStatus,
        nationality,
        bio,
        skills,
        avatarUrl,
      };
      auditEntry = {
        category: "Identity",
        field: "Profile Demographics",
        oldValue: `${employee.firstName} ${employee.lastName}`,
        newValue: `${firstName} ${lastName}`,
        status: "Approved",
      };
    } else if (cardType === "contact") {
      patch = {
        phoneNumber,
        whatsappNumber: whatsappNumber || phoneNumber,
        email,
        personalEmail,
        personalPhone,
        alternatePhone,
        officeExtension,
      };
      auditEntry = {
        category: "Contact",
        field: "Communication Endpoints",
        oldValue: employee.phoneNumber,
        newValue: phoneNumber,
        status: "Approved",
      };
    } else if (cardType === "emergency") {
      const emergencyContacts = [
        {
          id: "emc-1",
          name: emc1Name,
          relationship: emc1Rel,
          primaryPhone: emc1Phone,
          address: emc1Address,
          isPrimary: true,
        },
        {
          id: "emc-2",
          name: emc2Name,
          relationship: emc2Rel,
          primaryPhone: emc2Phone,
          address: emc2Address,
          isPrimary: false,
        },
      ];
      patch = { emergencyContacts };
      auditEntry = {
        category: "Emergency",
        field: "Emergency Contacts",
        oldValue: employee.emergencyContacts?.[0]?.name || "None",
        newValue: emc1Name,
        status: "Approved",
      };
    } else if (cardType === "address") {
      const currentAddress = {
        line1: currLine1,
        line2: currLine2,
        city: currCity,
        state: currState,
        pincode: currPincode,
        country: "India",
        verified: true,
      };
      const permanentAddress = {
        sameAsCurrent: permSame,
        line1: permSame ? currLine1 : permLine1,
        city: permSame ? currCity : permCity,
        state: permSame ? currState : permState,
        pincode: permSame ? currPincode : permPincode,
        country: "India",
        verified: true,
      };
      patch = { currentAddress, permanentAddress };
      auditEntry = {
        category: "Address",
        field: "Residential Address",
        oldValue: employee.currentAddress?.city || "None",
        newValue: currCity,
        requiresApproval: true,
        status: "Pending HR Review",
      };
    } else if (cardType === "job") {
      patch = {
        designation,
        department,
        division,
        territoryRegion,
        directManager: {
          name: managerName,
          designation: employee.directManager?.designation || "Director",
          email: employee.directManager?.email,
          employeeCode: employee.directManager?.employeeCode,
        },
        workLocation,
        shiftSchedule,
        timezone,
        employmentType,
        noticePeriodDays: Number(noticePeriodDays),
      };
      auditEntry = {
        category: "Job & Org",
        field: "Position & Schedule",
        oldValue: employee.designation,
        newValue: designation,
        status: "Approved",
      };
    } else if (cardType === "statutory") {
      patch = {
        panNumber,
        aadhaarNumber,
        providentFundUan,
        taxRegime,
        statutoryStatus: "Pending HR Review",
      };
      auditEntry = {
        category: "Statutory",
        field: "Tax Regime & Identification",
        oldValue: employee.taxRegime || "Previous Regime",
        newValue: taxRegime,
        requiresApproval: true,
        status: "Pending HR Review",
      };
    } else if (cardType === "banking") {
      patch = {
        bankAccount: {
          bankName,
          accountHolderName,
          accountNumber,
          routingCode,
          accountType,
          verificationStatus: "Pending HR Review",
        },
      };
      auditEntry = {
        category: "Banking",
        field: "Disbursement Bank Account",
        oldValue: `•••• ${employee.bankAccount?.accountNumber?.slice(-4) || "0000"}`,
        newValue: `•••• ${accountNumber.slice(-4)}`,
        requiresApproval: true,
        status: "Pending HR Review",
      };
    } else if (cardType === "qr-settings") {
      patch = {
        customWhatsappTemplate: customGreeting || null,
        customRateCardUrl: customRateCard || null,
        isActive: isCardActive,
      };
      auditEntry = {
        category: "QR Card",
        field: "Public Visiting Card Config",
        oldValue: employee.isActive ? "Active" : "Disabled",
        newValue: isCardActive ? "Active" : "Disabled",
        status: "Approved",
      };
    }

    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          employeeSlug: employee.slug,
          patch,
          auditEntry,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to update record");
      }

      const updated = {
        ...employee,
        ...patch,
        revisionHistory: auditEntry
          ? [
              {
                id: crypto.randomUUID(),
                timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
                editorName: session?.fullName || "Admin",
                editorRole: session?.role || "HR Admin",
                ...auditEntry,
              },
              ...(employee.revisionHistory || []),
            ]
          : employee.revisionHistory,
      };

      onSave(updated as Employee);
      showToast(
        auditEntry?.requiresApproval
          ? "Update submitted! Flagged for HR review and takes effect next payroll cycle."
          : "Changes successfully saved."
      );
      onClose();
    } catch (err: any) {
      alert(err?.message || "Failed to save updates.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base capitalize">
              Edit {cardType === "qr-settings" ? "Public Card Settings" : `${cardType} Details`}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Updating record for {employee.firstName} {employee.lastName} ({employee.employeeCode})
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* IDENTITY FORM */}
          {cardType === "identity" && (
            <>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <span className="font-semibold block mb-2 text-slate-800">Profile Photograph (Cloudinary CDN)</span>
                <AvatarUploader
                  currentAvatarUrl={avatarUrl}
                  employeeName={`${firstName} ${lastName}`.trim() || employee.firstName}
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
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Legal Last Name *</label>
                  <input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
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
                    placeholder="e.g. Jane"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Personal Pronouns</label>
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
                  <label className="font-semibold block mb-1">Date of Birth</label>
                  <input
                    type="date"
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
                <label className="font-semibold block mb-1">Professional Bio / Summary</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Summary of experience..."
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Core Skills (comma separated)</label>
                <input
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Wholesale Supply, Cold Chain, B2B Tenders"
                />
              </div>
            </>
          )}

          {/* CONTACT FORM */}
          {cardType === "contact" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Personal Mobile Phone</label>
                  <input
                    value={personalPhone}
                    onChange={(e) => setPersonalPhone(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Work Calling Number *</label>
                  <input
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Personal Email Address</label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="jane.doe@gmail.com"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Official Work Email *</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">WhatsApp Number (if different)</label>
                  <input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Office Extension</label>
                  <input
                    value={officeExtension}
                    onChange={(e) => setOfficeExtension(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* EMERGENCY CONTACTS FORM */}
          {cardType === "emergency" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-900 block text-xs">Primary Emergency Contact *</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    value={emc1Name}
                    onChange={(e) => setEmc1Name(e.target.value)}
                    placeholder="Full Name (e.g. Spouse / Parent)"
                    className="p-2 border rounded-lg bg-white"
                  />
                  <input
                    required
                    value={emc1Rel}
                    onChange={(e) => setEmc1Rel(e.target.value)}
                    placeholder="Relationship (e.g. Spouse)"
                    className="p-2 border rounded-lg bg-white"
                  />
                </div>
                <input
                  required
                  value={emc1Phone}
                  onChange={(e) => setEmc1Phone(e.target.value)}
                  placeholder="Primary Phone (+91 ...)"
                  className="w-full p-2 border rounded-lg font-mono bg-white"
                />
                <input
                  value={emc1Address}
                  onChange={(e) => setEmc1Address(e.target.value)}
                  placeholder="Residential Address"
                  className="w-full p-2 border rounded-lg bg-white text-[11px]"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <span className="font-bold text-slate-900 block text-xs">Secondary Emergency Contact *</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    required
                    value={emc2Name}
                    onChange={(e) => setEmc2Name(e.target.value)}
                    placeholder="Full Name (e.g. Sibling)"
                    className="p-2 border rounded-lg bg-white"
                  />
                  <input
                    required
                    value={emc2Rel}
                    onChange={(e) => setEmc2Rel(e.target.value)}
                    placeholder="Relationship (e.g. Sibling)"
                    className="p-2 border rounded-lg bg-white"
                  />
                </div>
                <input
                  required
                  value={emc2Phone}
                  onChange={(e) => setEmc2Phone(e.target.value)}
                  placeholder="Primary Phone (+91 ...)"
                  className="w-full p-2 border rounded-lg font-mono bg-white"
                />
                <input
                  value={emc2Address}
                  onChange={(e) => setEmc2Address(e.target.value)}
                  placeholder="Residential Address"
                  className="w-full p-2 border rounded-lg bg-white text-[11px]"
                />
              </div>
            </div>
          )}

          {/* ADDRESS FORM */}
          {cardType === "address" && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                🟡 <strong>Approval Notice:</strong> Updating residential address requires HR Ops validation for state professional tax & dispatch compliance.
              </div>

              <div className="space-y-2.5">
                <span className="font-bold text-slate-900 block text-xs">Current / Present Address *</span>
                <input
                  required
                  value={currLine1}
                  onChange={(e) => setCurrLine1(e.target.value)}
                  placeholder="Street Address / House # / Apartment"
                  className="w-full p-2.5 border rounded-xl"
                />
                <input
                  value={currLine2}
                  onChange={(e) => setCurrLine2(e.target.value)}
                  placeholder="Landmark / Sector (optional)"
                  className="w-full p-2.5 border rounded-xl"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    value={currCity}
                    onChange={(e) => setCurrCity(e.target.value)}
                    placeholder="City"
                    className="p-2.5 border rounded-xl"
                  />
                  <input
                    required
                    value={currState}
                    onChange={(e) => setCurrState(e.target.value)}
                    placeholder="State"
                    className="p-2.5 border rounded-xl"
                  />
                  <input
                    required
                    value={currPincode}
                    onChange={(e) => setCurrPincode(e.target.value)}
                    placeholder="PIN Code"
                    className="p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={permSame}
                    onChange={(e) => setPermSame(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">Permanent address is same as current</span>
                </label>

                {!permSame && (
                  <div className="space-y-2.5 pl-6 border-l-2 border-slate-200">
                    <input
                      required
                      value={permLine1}
                      onChange={(e) => setPermLine1(e.target.value)}
                      placeholder="Permanent Street Address"
                      className="w-full p-2.5 border rounded-xl"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        required
                        value={permCity}
                        onChange={(e) => setPermCity(e.target.value)}
                        placeholder="City"
                        className="p-2.5 border rounded-xl"
                      />
                      <input
                        required
                        value={permState}
                        onChange={(e) => setPermState(e.target.value)}
                        placeholder="State"
                        className="p-2.5 border rounded-xl"
                      />
                      <input
                        required
                        value={permPincode}
                        onChange={(e) => setPermPincode(e.target.value)}
                        placeholder="PIN Code"
                        className="p-2.5 border rounded-xl font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STATUTORY & TAX FORM */}
          {cardType === "statutory" && (
            <div className="space-y-3.5">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                🟡 <strong>Statutory Compliance:</strong> Changes to Income Tax PAN and Aadhaar are audited against statutory registers.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Income Tax PAN *</label>
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
                  <label className="font-semibold block mb-1">National ID (Aadhaar) *</label>
                  <input
                    required
                    value={aadhaarNumber}
                    onChange={(e) => setAadhaarNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                    placeholder="12-digit number"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Provident Fund (UAN)</label>
                <input
                  value={providentFundUan}
                  onChange={(e) => setProvidentFundUan(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono"
                  placeholder="12-digit UAN"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Income Tax Regime Selection</label>
                <select
                  value={taxRegime}
                  onChange={(e) => setTaxRegime(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white font-medium"
                >
                  <option value="New Tax Regime (115BAC)">New Tax Regime (Section 115BAC) - Default Concessional</option>
                  <option value="Old Tax Regime">Old Tax Regime (With Chapter VI-A Deductions)</option>
                </select>
              </div>
            </div>
          )}

          {/* BANKING FORM */}
          {cardType === "banking" && (
            <div className="space-y-3.5">
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 text-[11px] text-blue-900">
                🛡️ <strong>Step-Up Security Notice:</strong> Bank account revisions require verification via penny-drop validation and take effect next payroll cycle.
              </div>

              <div>
                <label className="font-semibold block mb-1">Bank Name *</label>
                <input
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="e.g. HDFC Bank, ICICI Bank, State Bank of India"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Account Holder Legal Name *</label>
                <input
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Account Number *</label>
                  <input
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">IFSC Code *</label>
                  <input
                    required
                    value={routingCode}
                    onChange={(e) => setRoutingCode(e.target.value.toUpperCase())}
                    className="w-full p-2.5 border rounded-xl font-mono uppercase"
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

          {/* JOB & ORG FORM */}
          {cardType === "job" && (
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Designation *</label>
                  <input
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Department</label>
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Division / Unit</label>
                  <input
                    value={division}
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Territory / Zone *</label>
                  <input
                    required
                    value={territoryRegion}
                    onChange={(e) => setTerritoryRegion(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Direct Manager Name</label>
                  <input
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Work Location / Hub</label>
                  <input
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Shift Schedule</label>
                  <input
                    value={shiftSchedule}
                    onChange={(e) => setShiftSchedule(e.target.value)}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Notice Period (Days)</label>
                  <input
                    type="number"
                    value={noticePeriodDays}
                    onChange={(e) => setNoticePeriodDays(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QR SETTINGS FORM */}
          {cardType === "qr-settings" && (
            <div className="space-y-3.5">
              <div>
                <label className="font-semibold block mb-1">Custom WhatsApp Greeting Template</label>
                <textarea
                  rows={2}
                  value={customGreeting}
                  onChange={(e) => setCustomGreeting(e.target.value)}
                  className="w-full p-2.5 border rounded-xl"
                  placeholder="Hello {name}, I scanned your Aruka Med visiting card..."
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Custom Rate Card PDF URL</label>
                <input
                  value={customRateCard}
                  onChange={(e) => setCustomRateCard(e.target.value)}
                  className="w-full p-2.5 border rounded-xl font-mono text-[11px]"
                  placeholder="https://.../files/custom-rate-card.pdf"
                />
              </div>

              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCardActive}
                    onChange={(e) => setIsCardActive(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                  <span className="font-semibold text-slate-800">
                    Visiting Card Active ({isCardActive ? "Live via QR" : "Disabled / Rerouted"})
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-xl text-slate-600 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-[#09162D] hover:bg-[#12284E] text-[#E3B15F] font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? "Saving Updates..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
