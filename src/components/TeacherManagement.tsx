/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { UserPlus, Search, Trash2, Calendar, Phone, MapPin, User, AlertCircle, Edit2, Check, X, Lock, MessageCircle, Send, ExternalLink } from "lucide-react";
import { Teacher } from "../types";
import { COLLEGE_DESIGNATIONS } from "../initialData";

interface TeacherManagementProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, "id">) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onClearAllTeachers: () => void;
}

export default function TeacherManagement({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onClearAllTeachers,
}: TeacherManagementProps) {
  // Bengali translation and remaining days helper
  const toBengaliNumber = (num: number | string): string => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .split("")
      .map((digit) => (digit >= "0" && digit <= "9" ? banglaDigits[parseInt(digit, 10)] : digit))
      .join("");
  };

  const formatBengaliDMY = (dateStr: string | undefined): string => {
    if (!dateStr) return "নির্ধারিত নয়";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];
        return `${d}-${m}-${y}`;
      }
      const dObj = new Date(dateStr);
      if (isNaN(dObj.getTime())) return "নির্ধারিত নয়";
      const day = String(dObj.getDate()).padStart(2, "0");
      const month = String(dObj.getMonth() + 1).padStart(2, "0");
      const year = dObj.getFullYear();
      return `${day}-${month}-${year}`;
    } catch (e) {
      return "নির্ধারিত নয়";
    }
  };

  const ensureISODate = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // If it is DD-MM-YYYY or DD/MM/YYYY
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // DD-MM-YYYY or DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    
    // fallback to parse with Date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return "";
  };

  const calculateRemainingWorkingDays = (retirementDateStr: string | undefined): number => {
    if (!retirementDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const retirementDate = new Date(retirementDateStr);
    retirementDate.setHours(0, 0, 0, 0);

    if (retirementDate <= today) {
      return 0;
    }

    let count = 0;
    const current = new Date(today);
    while (current <= retirementDate) {
      const dayOfWeek = current.getDay(); // 0: Sunday, 1: Monday, ..., 5: Friday, 6: Saturday
      if (dayOfWeek !== 5 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  };

  // Add state
  const [name, setName] = useState("");
  const [blockName, setBlockName] = useState(COLLEGE_DESIGNATIONS[0]);
  const [customBlock, setCustomBlock] = useState("");
  const [isCustomBlock, setIsCustomBlock] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
  const [retirementDate, setRetirementDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBlockName, setEditBlockName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editJoiningDate, setEditJoiningDate] = useState("");
  const [editRetirementDate, setEditRetirementDate] = useState("");
  const [editError, setEditError] = useState("");

  // Calculate retirement date from date of birth (adds exactly 60 years)
  const calculateRetirementDateFromBirth = (birthDateStr: string): string => {
    if (!birthDateStr) return "";
    const d = new Date(birthDateStr);
    if (isNaN(d.getTime())) return "";
    d.setFullYear(d.getFullYear() + 60);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleBirthDateChange = (val: string) => {
    setDateOfBirth(val);
    const calculated = calculateRetirementDateFromBirth(val);
    setRetirementDate(calculated);
  };

  const handleEditBirthDateChange = (val: string) => {
    setEditDateOfBirth(val);
    const calculated = calculateRetirementDateFromBirth(val);
    setEditRetirementDate(calculated);
  };

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Restricted Area Modal state
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [restrictedUser, setRestrictedUser] = useState("");
  const [restrictedPass, setRestrictedPass] = useState("");
  const [restrictedError, setRestrictedError] = useState("");

  // Custom Delete Teacher state
  const [deleteTargetTeacher, setDeleteTargetTeacher] = useState<Teacher | null>(null);

  // WhatsApp Common Message Assistant States
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState(
    "শ্রদ্ধেয় {নাম} স্যার/ম্যাডাম, রংপুর কলেজ ডিজিটাল শিক্ষক হাজিরা সিস্টেমে আপনাকে স্বাগতম। আপনার পদবী: {পদবী}। দয়া করে প্রতিদিন সময়মত আপনার ডিজিটাল হাজিরা এন্ট্রি সম্পন্ন করবেন। ধন্যবাদ।"
  );
  const [sentTeachers, setSentTeachers] = useState<Record<string, boolean>>({});
  const [whatsappSearchQuery, setWhatsappSearchQuery] = useState("");

  const handleRestrictedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRestrictedError("");

    if (restrictedUser === "Debashis" && restrictedPass === "244157") {
      onClearAllTeachers();
      setShowRestrictedModal(false);
      setRestrictedUser("");
      setRestrictedPass("");
      setSuccess("সকল শিক্ষকের তালিকা সফলভাবে মুছে ফেলা হয়েছে।");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setRestrictedError("ভুল ব্যবহারকারীর নাম বা পাসওয়ার্ড! অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
  };

  const handleBlockSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setIsCustomBlock(true);
    } else {
      setIsCustomBlock(false);
      setBlockName(val);
    }
  };

  const validateMobile = (num: string): boolean => {
    // Basic Bangladesh mobile check: 11 digits starting with 01
    const cleanNum = num.trim();
    return /^01[3-9]\d{8}$/.test(cleanNum);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("অনুগ্রহ করে শিক্ষকের নাম লিখুন।");
      return;
    }

    const finalBlock = isCustomBlock ? customBlock.trim() : blockName;
    if (!finalBlock) {
      setError("অনুগ্রহ করে পদবী নির্বাচন করুন বা লিখুন।");
      return;
    }

    if (!validateMobile(mobileNumber)) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 01711223344)।");
      return;
    }

    if (!dateOfBirth) {
      setError("অনুগ্রহ করে জন্ম তারিখ নির্বাচন করুন।");
      return;
    }

    if (!joiningDate) {
      setError("অনুগ্রহ করে যোগদানের তারিখ নির্বাচন করুন।");
      return;
    }

    if (!retirementDate) {
      setError("অনুগ্রহ করে অবসর গ্রহণের তারিখ নির্বাচন করুন।");
      return;
    }

    onAddTeacher({
      name: name.trim(),
      blockName: finalBlock,
      mobileNumber: mobileNumber.trim(),
      joiningDate: ensureISODate(joiningDate),
      retirementDate: ensureISODate(retirementDate),
      dateOfBirth: ensureISODate(dateOfBirth),
    });

    // Reset Form
    setName("");
    setMobileNumber("");
    setDateOfBirth("");
    setCustomBlock("");
    setIsCustomBlock(false);
    setBlockName(COLLEGE_DESIGNATIONS[0]);
    setRetirementDate("");
    setSuccess("শিক্ষক সফলভাবে নিবন্ধিত হয়েছেন!");
    
    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  // Editing handlers
  const startEditing = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setEditName(teacher.name);
    setEditBlockName(teacher.blockName);
    setEditMobile(teacher.mobileNumber);
    setEditDateOfBirth(ensureISODate(teacher.dateOfBirth));
    setEditJoiningDate(ensureISODate(teacher.joiningDate));
    setEditRetirementDate(ensureISODate(teacher.retirementDate));
    setEditError("");
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) {
      setEditError("নাম খালি রাখা যাবে না");
      return;
    }
    if (!editBlockName.trim()) {
      setEditError("পদবী খালি রাখা যাবে না");
      return;
    }
    if (!validateMobile(editMobile)) {
      setEditError("১১ ডিজিটের সঠিক মোবাইল নম্বর দিন");
      return;
    }
    if (!editDateOfBirth) {
      setEditError("জন্ম তারিখ নির্বাচন করুন");
      return;
    }
    if (!editJoiningDate) {
      setEditError("তারিখ নির্বাচন করুন");
      return;
    }
    if (!editRetirementDate) {
      setEditError("অবসর গ্রহণের তারিখ নির্বাচন করুন");
      return;
    }

    onUpdateTeacher({
      id,
      name: editName.trim(),
      blockName: editBlockName.trim(),
      mobileNumber: editMobile.trim(),
      joiningDate: ensureISODate(editJoiningDate),
      retirementDate: ensureISODate(editRetirementDate),
      dateOfBirth: ensureISODate(editDateOfBirth),
    });

    setEditingId(null);
  };

  const filteredTeachers = teachers.filter((teacher) => {
    const query = searchQuery.toLowerCase();
    return (
      teacher.name.toLowerCase().includes(query) ||
      teacher.blockName.toLowerCase().includes(query) ||
      teacher.mobileNumber.includes(query)
    );
  });

  return (
    <div id="teacher-management-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Column 1: Add Teacher Form */}
      <div id="add-teacher-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
        <div className="flex items-center space-x-2.5 mb-6">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <UserPlus className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">নতুন শিক্ষক নিবন্ধন করুন</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-xl flex items-start space-x-2 text-sm border border-rose-100">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl flex items-center space-x-2 text-sm border border-emerald-100">
              <Check className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Teacher Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" /> শিক্ষকের নাম <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="যেমন: ড. রফিকুল ইসলাম"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Block Name */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" /> পদবী <span className="text-rose-500">*</span>
            </label>
            <select
              value={isCustomBlock ? "CUSTOM" : blockName}
              onChange={handleBlockSelectionChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-sm transition-all bg-white mb-2"
            >
              {COLLEGE_DESIGNATIONS.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
              <option value="CUSTOM">-- অন্যান্য (নতুন পদবী লিখুন) --</option>
            </select>

            {isCustomBlock && (
              <input
                type="text"
                value={customBlock}
                onChange={(e) => setCustomBlock(e.target.value)}
                placeholder="নতুন পদবী লিখুন"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all mt-1"
              />
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" /> মোবাইল নম্বর <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="যেমন: 01711223344"
              maxLength={11}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all font-mono"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> জন্ম তারিখ <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => handleBirthDateChange(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
            <p className="text-[10px] text-indigo-600 font-medium mt-1">
              * জন্ম তারিখ প্রবেশ করালে ৬০ বছর যোগ হয়ে অবসর গ্রহণের তারিখ স্বয়ংক্রিয়ভাবে হিসাব হবে।
            </p>
          </div>

          {/* Joining Date */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> যোগদানের তারিখ <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Retirement Date */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" /> অবসর গ্রহণের তারিখ <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={retirementDate}
              onChange={(e) => setRetirementDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Remaining Working Days */}
          <div>
            <label className="block text-sm font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600" /> অবশিষ্ট কর্মদিবস (প্রাক্কলিত)
            </label>
            <input
              type="text"
              readOnly
              value={
                retirementDate
                  ? `${toBengaliNumber(calculateRemainingWorkingDays(retirementDate))} দিন (শুক্রবার ও শনিবার ব্যতিত)`
                  : "০ দিন (অবসর গ্রহণের তারিখ নির্বাচন করুন)"
              }
              className="w-full px-4 py-3 border border-indigo-100 rounded-xl bg-indigo-50/40 text-indigo-700 text-base font-bold focus:outline-hidden cursor-not-allowed shadow-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>নিবন্ধন করুন</span>
          </button>
        </form>
      </div>

      {/* Column 2 & 3: Teacher List */}
      <div id="teacher-list-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs lg:col-span-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">নিবন্ধিত শিক্ষক তালিকা</h2>
            <p className="text-xs text-slate-400 mt-1">মোট নিবন্ধিত শিক্ষক: {teachers.length} জন</p>
          </div>

          {/* Search Bar & Clear All */}
          <div className="flex flex-wrap items-center gap-2.5 max-w-md w-full sm:justify-end justify-start">
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, পদবী বা মোবাইল দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
              />
            </div>

            {teachers.length > 0 && (
              <>
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setWhatsappSearchQuery("");
                      setShowWhatsAppModal(true);
                    }}
                    className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border border-emerald-500 shadow-3xs hover:shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp মেসেজ</span>
                  </button>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setRestrictedUser("");
                      setRestrictedPass("");
                      setRestrictedError("");
                      setShowRestrictedModal(true);
                    }}
                    className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-rose-100 shadow-3xs hover:shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সকল তালিকা মুছুন</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-semibold">
                <th className="px-4 py-3.5 text-center w-12">নং</th>
                <th className="px-4 py-3.5">শিক্ষকের নাম</th>
                <th className="px-4 py-3.5">পদবী</th>
                <th className="px-4 py-3.5">মোবাইল নম্বর</th>
                <th className="px-4 py-3.5 text-[11px] font-bold">জন্ম তারিখ</th>
                <th className="px-4 py-3.5 text-[11px] font-bold">যোগদানের তারিখ</th>
                <th className="px-4 py-3.5 text-[11px] font-bold">অবসর গ্রহণের তারিখ</th>
                <th className="px-4 py-3.5 text-center min-w-[150px]">অবশিষ্ট কর্মদিবস</th>
                <th className="px-4 py-3.5 text-center w-24">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400 font-medium">
                    কোনো শিক্ষক পাওয়া যায়নি!
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, idx) => {
                  const isEditing = editingId === teacher.id;
                  
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Sl No */}
                      <td className="px-4 py-3 text-center text-slate-400 font-mono font-medium">
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="px-2 py-1 border border-slate-200 rounded-md w-full focus:outline-indigo-500"
                            />
                            {editError && <p className="text-3xs text-rose-500 font-medium">{editError}</p>}
                          </div>
                        ) : (
                          teacher.name
                        )}
                      </td>

                      {/* Block */}
                      <td className="px-4 py-3 text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editBlockName}
                            onChange={(e) => setEditBlockName(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-md w-full focus:outline-indigo-500"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-medium bg-slate-100 text-slate-700">
                            {teacher.blockName}
                          </span>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="px-4 py-3 font-mono text-slate-600">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editMobile}
                            maxLength={11}
                            onChange={(e) => setEditMobile(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-md w-full focus:outline-indigo-500 font-mono"
                          />
                        ) : (
                          teacher.mobileNumber
                        )}
                      </td>

                      {/* Birth Date */}
                      <td className="px-4 py-3 text-slate-500">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editDateOfBirth}
                            onChange={(e) => handleEditBirthDateChange(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-md w-full focus:outline-indigo-500 text-xs"
                          />
                        ) : teacher.dateOfBirth ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 shadow-3xs font-mono whitespace-nowrap">
                            {formatBengaliDMY(teacher.dateOfBirth)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic whitespace-nowrap">নির্ধারিত নয়</span>
                        )}
                      </td>

                      {/* Joining Date */}
                      <td className="px-4 py-3 text-slate-500">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editJoiningDate}
                            onChange={(e) => setEditJoiningDate(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-md w-full focus:outline-indigo-500 text-xs"
                          />
                        ) : teacher.joiningDate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-3xs font-mono whitespace-nowrap">
                            {formatBengaliDMY(teacher.joiningDate)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic whitespace-nowrap">নির্ধারিত নয়</span>
                        )}
                      </td>

                      {/* Retirement Date */}
                      <td className="px-4 py-3 text-slate-500">
                        {isEditing ? (
                          <input
                            type="date"
                            value={editRetirementDate}
                            onChange={(e) => setEditRetirementDate(e.target.value)}
                            className="px-2 py-1 border border-slate-200 rounded-md w-full focus:outline-indigo-500 text-xs"
                          />
                        ) : teacher.retirementDate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-3xs font-mono whitespace-nowrap">
                            {formatBengaliDMY(teacher.retirementDate)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic whitespace-nowrap">নির্ধারিত নয়</span>
                        )}
                      </td>

                      {/* Remaining Working Days */}
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-2xs font-semibold bg-slate-100 text-slate-500">
                            {editRetirementDate 
                              ? `${toBengaliNumber(calculateRemainingWorkingDays(editRetirementDate))} দিন` 
                              : "অবসর গ্রহণের তারিখ লিখুন"}
                          </span>
                        ) : teacher.retirementDate ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-3xs scale-105 transition-all">
                            {toBengaliNumber(calculateRemainingWorkingDays(teacher.retirementDate))} দিন
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-400">
                            ০ দিন
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(teacher.id)}
                                title="সংরক্ষণ"
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                title="বাতিল"
                                className="p-1 text-slate-400 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEditing(teacher)}
                                title="সম্পাদনা"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTargetTeacher(teacher)}
                                title="মুছে ফেলুন"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restricted Area (সুরক্ষিত এলাকা) Modal */}
      {showRestrictedModal && (
        <div id="restricted-area-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="restricted-area-modal" className="bg-white w-full max-w-sm rounded-2xl border border-rose-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-rose-100 bg-rose-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <h4 className="text-sm font-bold text-rose-800">
                  সুরক্ষিত এলাকা (Restricted Area)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowRestrictedModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleRestrictedSubmit} className="p-5 space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  এই অ্যাকশনটি অত্যন্ত সংবেদনশীল। সকল শিক্ষকের তালিকা ও তাদের বিবরণ চিরতরে মুছে যাবে। দয়া করে সঠিক প্রমাণপত্র দিয়ে নিশ্চিত করুন।
                </p>
              </div>

              {restrictedError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-3xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{restrictedError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-3xs font-bold text-slate-500 uppercase tracking-wider">
                  ব্যবহারকারীর নাম (User Name)
                </label>
                <input
                  type="text"
                  value={restrictedUser}
                  onChange={(e) => setRestrictedUser(e.target.value)}
                  placeholder="Debashis"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-rose-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-3xs font-bold text-slate-500 uppercase tracking-wider">
                  পাসওয়ার্ড (Password)
                </label>
                <input
                  type="password"
                  value={restrictedPass}
                  onChange={(e) => setRestrictedPass(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-rose-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowRestrictedModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-rose-200 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Teacher Confirmation Modal */}
      {deleteTargetTeacher && (
        <div id="delete-teacher-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="delete-teacher-modal" className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800">
                ⚠️ শিক্ষক মুছে ফেলার নিশ্চিতকরণ
              </h4>
              <button
                type="button"
                onClick={() => setDeleteTargetTeacher(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-800">{deleteTargetTeacher.name}</span>-কে তালিকা থেকে মুছে ফেলতে চান? এর সাথে তার সকল পূর্ববর্তী হাজিরা রেকর্ডও মুছে যাবে।
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setDeleteTargetTeacher(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteTeacher(deleteTargetTeacher.id);
                    setDeleteTargetTeacher(null);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-rose-200 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছে ফেলুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Assistant Modal */}
      {showWhatsAppModal && (
        <div id="whatsapp-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="whatsapp-modal" className="bg-white w-full max-w-3xl h-[90vh] md:h-[80vh] rounded-2xl border border-slate-100 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/40 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2 text-emerald-700">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h4 className="text-sm md:text-base font-bold font-sans">💬 হোয়াটসঅ্যাপ মেসেজ সহকারী (WhatsApp Message Assistant)</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Top info and instruction */}
              <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-xl p-4 text-xs text-slate-600 leading-relaxed space-y-1.5">
                <p className="font-semibold text-emerald-800">রংপুর কলেজ শিক্ষক কর্মকর্তা-কর্মচারীদের জন্য বার্তা পাঠানোর গাইড:</p>
                <p>এখানে একটি কমন বার্তার টেমপ্লেট তৈরি করুন। ডায়নামিক পরিবর্তনশীল তথ্য যেমন <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-800 font-bold font-mono">{"{নাম}"}</code> এবং <code className="bg-emerald-100/80 px-1 py-0.5 rounded text-emerald-800 font-bold font-mono">{"{পদবী}"}</code> ব্যবহার করতে পারেন, যা প্রতিটি শিক্ষকের ক্ষেত্রে তার নিজস্ব নাম ও পদবী দ্বারা স্বয়ংক্রিয়ভাবে প্রতিস্থাপিত হবে।</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Message Composer */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">মেসেজ টেমপ্লেট কম্পোজার:</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setWhatsAppMessage(prev => prev + " {নাম}")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-3xs font-bold transition-all cursor-pointer border border-slate-200"
                        title="কার্সার পজিশনে {নাম} যোগ করুন"
                      >
                        + {"{নাম}"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setWhatsAppMessage(prev => prev + " {পদবী}")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-3xs font-bold transition-all cursor-pointer border border-slate-200"
                        title="কার্সার পজিশনে {পদবী} যোগ করুন"
                      >
                        + {"{পদবী}"}
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={6}
                    value={whatsAppMessage}
                    onChange={(e) => setWhatsAppMessage(e.target.value)}
                    placeholder="মেসেজ টেমপ্লেট লিখুন..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all bg-white leading-relaxed resize-none shadow-3xs"
                  />
                  
                  <div className="text-3xs text-slate-400 font-medium flex justify-between">
                    <span>অক্ষর সংখ্যা: {toBengaliNumber(whatsAppMessage.length)}</span>
                    <span className="text-emerald-600 font-semibold">* মেসেজটি হোয়াটস অ্যাপ ব্রাউজার/অ্যাপের মাধ্যমে পাঠানো হবে</span>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <span>লাইভ মেসেজ প্রিভিউ:</span>
                    <span className="text-3xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.5 rounded font-bold font-sans">স্যাম্পল শিক্ষক</span>
                  </label>
                  
                  <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 relative overflow-hidden h-[155px] flex flex-col justify-between shadow-3xs">
                    {/* Floating WhatsApp chat bubble style */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-5 -mt-5"></div>
                    
                    <div className="space-y-2 relative z-10">
                      <div className="flex items-center space-x-1.5 text-3xs text-slate-400 font-bold tracking-wider uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span>রংপুর কলেজ ডিজিটাল মেসেজ</span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed italic line-clamp-4">
                        {whatsAppMessage
                          ? whatsAppMessage
                              .replace(/{নাম}/g, teachers[0]?.name || "জনাব রহমান")
                              .replace(/{পদবী}/g, teachers[0]?.blockName || "সহকারী অধ্যাপক")
                          : "মেসেজ লিখলে এখানে প্রিভিউ দেখা যাবে..."}
                      </p>
                    </div>
                    
                    <div className="text-3xs text-slate-400 font-semibold flex items-center justify-between pt-2 border-t border-emerald-100/40 mt-2 relative z-10">
                      <span>প্রেরক: রংপুর কলেজ অ্যাডমিন</span>
                      <span>{new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teachers List and Sender Panel */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-slate-800">শিক্ষক কর্মচারী তালিকা ও প্রগতি ট্র্যাকার</h5>
                    <p className="text-3xs text-slate-400 font-medium">
                      মেসেজ প্রেরণ সফল করতে প্রত্যেক শিক্ষকের নামের পাশের হোয়াটসঅ্যাপ বাটনে ক্লিক করুন।
                    </p>
                  </div>

                  {/* Search inside Whatsapp panel */}
                  <div className="flex items-center gap-2">
                    <div className="relative max-w-xs w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={whatsappSearchQuery}
                        onChange={(e) => setWhatsappSearchQuery(e.target.value)}
                        placeholder="নাম বা মোবাইল দিয়ে ফিল্টার করুন..."
                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-3xs focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all bg-white font-medium"
                      />
                    </div>

                    {/* Stats Counter */}
                    <div className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-3xs font-bold rounded-xl whitespace-nowrap">
                      পাঠানো প্রগতি: {toBengaliNumber(Object.keys(sentTeachers).length)} / {toBengaliNumber(teachers.length)} জন
                    </div>
                  </div>
                </div>

                {/* Scrollable Teacher List for WhatsApp */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 max-h-[250px] bg-slate-50/30">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-3xs font-bold">
                        <th className="px-4 py-2.5 text-center w-12">নং</th>
                        <th className="px-4 py-2.5">শিক্ষকের নাম ও পদবী</th>
                        <th className="px-4 py-2.5">মোবাইল নম্বর</th>
                        <th className="px-4 py-2.5 text-center w-36">হোয়াটসঅ্যাপ এন্ট্রি</th>
                        <th className="px-4 py-2.5 text-center w-28">অবস্থা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers
                        .filter(t => 
                          t.name.toLowerCase().includes(whatsappSearchQuery.toLowerCase()) || 
                          t.blockName.toLowerCase().includes(whatsappSearchQuery.toLowerCase()) ||
                          t.mobileNumber.includes(whatsappSearchQuery)
                        )
                        .map((teacher, index) => {
                          const compiledText = whatsAppMessage
                            .replace(/{নাম}/g, teacher.name)
                            .replace(/{পদবী}/g, teacher.blockName);
                          
                          // Clean Phone
                          let cleanPhone = teacher.mobileNumber.replace(/\D/g, "");
                          if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
                            cleanPhone = "88" + cleanPhone;
                          }
                          const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(compiledText)}`;
                          const isSent = !!sentTeachers[teacher.id];

                          return (
                            <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all text-xs font-medium text-slate-700">
                              <td className="px-4 py-2.5 text-center font-mono text-3xs text-slate-400">
                                {toBengaliNumber(index + 1)}
                              </td>
                              <td className="px-4 py-2.5">
                                <div className="font-bold text-slate-800 text-2xs">{teacher.name}</div>
                                <div className="text-3xs text-slate-400 font-semibold mt-0.5">{teacher.blockName}</div>
                              </td>
                              <td className="px-4 py-2.5 font-mono text-3xs text-slate-600">
                                {teacher.mobileNumber}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => setSentTeachers(prev => ({ ...prev, [teacher.id]: true }))}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-100 hover:border-emerald-600 text-emerald-700 text-3xs font-bold rounded-lg transition-all shadow-3xs cursor-pointer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>হোয়াটসঅ্যাপ পাঠান</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {isSent ? (
                                  <span className="inline-flex items-center gap-1 text-3xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                    <Check className="w-3 h-3" />
                                    <span>পাঠানো হয়েছে</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-3xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-100">
                                    <span>অপেক্ষমান</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSentTeachers({})}
                className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl text-3xs font-bold transition-all cursor-pointer"
                title="সেশনের পাঠানো প্রগতি মুছে ফেলুন"
              >
                প্রগতি রিসেট করুন
              </button>
              
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-slate-200"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
