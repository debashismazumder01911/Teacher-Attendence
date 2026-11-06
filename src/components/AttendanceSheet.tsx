/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, Calendar, MapPin, Trash2, Edit2, Plus, AlertCircle, CheckCircle, HelpCircle, Lock, Unlock, KeyRound } from "lucide-react";
import { Teacher, AttendanceRecord } from "../types";
import { COLLEGE_DESIGNATIONS, calculateHours } from "../initialData";

interface AttendanceSheetProps {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  onAddAttendanceManual: (record: Omit<AttendanceRecord, "id" | "totalHours">) => void;
  onDeleteAttendance: (id: string) => void;
  onUpdateAttendance: (record: AttendanceRecord) => void;
}

export default function AttendanceSheet({
  teachers,
  attendance,
  selectedDate,
  setSelectedDate,
  onAddAttendanceManual,
  onDeleteAttendance,
  onUpdateAttendance,
}: AttendanceSheetProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("ALL");
  const [viewMode, setViewMode] = useState<"DATE" | "ALL_TIME">("DATE");

  // Edit attendance state
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editArrival, setEditArrival] = useState("");
  const [editDeparture, setEditDeparture] = useState("");
  const [editLateReason, setEditLateReason] = useState("");
  const [editEarlyDepartureReason, setEditEarlyDepartureReason] = useState("");
  const [editDate, setEditDate] = useState("");

  // Quick Add attendance state
  const [quickAddTeacherId, setQuickAddTeacherId] = useState<string | null>(null);
  const [quickAddDate, setQuickAddDate] = useState("");
  const [quickAddArrival, setQuickAddArrival] = useState("09:00");
  const [quickAddDeparture, setQuickAddDeparture] = useState("17:00");
  const [quickAddLateReason, setQuickAddLateReason] = useState("");
  const [quickAddEarlyDepartureReason, setQuickAddEarlyDepartureReason] = useState("");

  // Custom Delete Attendance state
  const [deleteTargetAttendanceId, setDeleteTargetAttendanceId] = useState<string | null>(null);

  const handleStartEdit = (row: any) => {
    const record = attendance.find((r) => r.id === row.recordId);
    if (!record) return;

    setEditingRecord(record);
    
    const getHHMM = (isoStr: string | null | undefined): string => {
      if (!isoStr) return "";
      try {
        const parts = isoStr.split("T");
        if (parts.length === 2) {
          return parts[1].slice(0, 5);
        }
      } catch (e) {}
      return "";
    };

    setEditArrival(getHHMM(record.arrivalTime));
    setEditDeparture(getHHMM(record.departureTime));
    setEditLateReason(record.lateReason || "");
    setEditEarlyDepartureReason(record.earlyDepartureReason || "");
    setEditDate(record.date);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const arrivalTimeISO = editArrival ? `${editDate}T${editArrival}:00` : null;
    const departureTimeISO = editDeparture ? `${editDate}T${editDeparture}:00` : null;
    
    if (arrivalTimeISO && departureTimeISO) {
      const arrD = new Date(arrivalTimeISO);
      const depD = new Date(departureTimeISO);
      if (depD <= arrD) {
        alert("নির্গমনের সময় অবশ্যই আগমনের সময়ের পরে হতে হবে।");
        return;
      }
    }

    const totalHours = calculateHours(arrivalTimeISO, departureTimeISO);

    const updatedRecord: AttendanceRecord = {
      ...editingRecord,
      date: editDate,
      arrivalTime: arrivalTimeISO,
      departureTime: departureTimeISO,
      totalHours,
      lateReason: editLateReason.trim() || undefined,
      earlyDepartureReason: editEarlyDepartureReason.trim() || undefined,
    };

    onUpdateAttendance(updatedRecord);
    setEditingRecord(null);
  };

  const handleQuickAdd = (teacherId: string, dateStr: string) => {
    setQuickAddTeacherId(teacherId);
    setQuickAddDate(dateStr);
    setQuickAddArrival("09:00");
    setQuickAddDeparture("17:00");
    setQuickAddLateReason("");
    setQuickAddEarlyDepartureReason("");
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddTeacherId) return;

    const arrivalTimeISO = quickAddArrival ? `${quickAddDate}T${quickAddArrival}:00` : null;
    const departureTimeISO = quickAddDeparture ? `${quickAddDate}T${quickAddDeparture}:00` : null;

    if (arrivalTimeISO && departureTimeISO) {
      const arrD = new Date(arrivalTimeISO);
      const depD = new Date(departureTimeISO);
      if (depD <= arrD) {
        alert("নির্গমনের সময় অবশ্যই আগমনের সময়ের পরে হতে হবে।");
        return;
      }
    }

    const teacher = teachers.find((t) => t.id === quickAddTeacherId);
    if (!teacher) return;

    onAddAttendanceManual({
      teacherId: quickAddTeacherId,
      teacherName: teacher.name,
      blockName: teacher.blockName,
      date: quickAddDate,
      arrivalTime: arrivalTimeISO,
      departureTime: departureTimeISO,
      lateReason: quickAddLateReason.trim() || undefined,
      earlyDepartureReason: quickAddEarlyDepartureReason.trim() || undefined,
    });

    setQuickAddTeacherId(null);
  };

  const toBengaliNumber = (num: number | string): string => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .split("")
      .map((digit) => (digit >= "0" && digit <= "9" ? banglaDigits[parseInt(digit, 10)] : digit))
      .join("");
  };

  const formatHoursAndMinutes = (hours: number | null): string => {
    if (hours === null || isNaN(hours)) return "---";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    if (h === 0 && m === 0) {
      return "০ মিনিট";
    }
    
    let result = "";
    if (h > 0) {
      result += `${toBengaliNumber(h)} ঘণ্টা`;
    }
    if (m > 0) {
      result += `${h > 0 ? " " : ""}${toBengaliNumber(m)} মিনিট`;
    }
    return result;
  };

  const formatBengaliDMY = (dateStr: string | undefined): string => {
    if (!dateStr) return "নির্ধারিত নয়";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const y = parts[0];
        const m = parts[1];
        const d = parts[2];
        return `${d}/${m}/${y}`;
      }
      const dObj = new Date(dateStr);
      if (isNaN(dObj.getTime())) return "নির্ধারিত নয়";
      const day = String(dObj.getDate()).padStart(2, "0");
      const month = String(dObj.getMonth() + 1).padStart(2, "0");
      const year = dObj.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (e) {
      return "নির্ধারিত নয়";
    }
  };

  // Admin Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem("tams_sheet_auth") === "true";
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const guardAdminAction = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setPendingAction(() => action);
      setShowLoginModal(true);
      setLoginUsername("");
      setLoginPassword("");
      setLoginError("");
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (loginUsername === "Debashis" && loginPassword === "244157") {
      setIsAuthenticated(true);
      sessionStorage.setItem("tams_sheet_auth", "true");
      setShowLoginModal(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      setLoginError("ভুল ইউজারনেম অথবা পাসওয়ার্ড! দয়া করে আবার চেষ্টা করুন।");
    }
  };

  // Manual Add Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [manualTeacherId, setManualTeacherId] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualArrival, setManualArrival] = useState("09:00");
  const [manualDeparture, setManualDeparture] = useState("17:00");
  const [isAbsentManual, setIsAbsentManual] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!manualTeacherId) {
      setFormError("অনুগ্রহ করে একজন শিক্ষক নির্বাচন করুন।");
      return;
    }

    if (!manualDate) {
      setFormError("অনুগ্রহ করে তারিখ নির্বাচন করুন।");
      return;
    }

    // Check if record already exists for this teacher and date
    const exists = attendance.some(
      (r) => r.teacherId === manualTeacherId && r.date === manualDate
    );
    if (exists) {
      setFormError("এই তারিখের জন্য এই শিক্ষকের হাজিরা রেকর্ড ইতিমধ্যে রয়েছে।");
      return;
    }

    let arrivalISO: string | null = null;
    let departureISO: string | null = null;

    if (!isAbsentManual) {
      if (!manualArrival) {
        setFormError("অনুগ্রহ করে আগমনের সময় দিন।");
        return;
      }
      arrivalISO = `${manualDate}T${manualArrival}:00`;
      
      if (manualDeparture) {
        departureISO = `${manualDate}T${manualDeparture}:00`;
        // Check order
        const arrDate = new Date(arrivalISO);
        const depDate = new Date(departureISO);
        if (depDate <= arrDate) {
          setFormError("নির্গমনের সময় অবশ্যই আগমনের সময়ের পরে হতে হবে।");
          return;
        }
      }
    }

    const teacher = teachers.find((t) => t.id === manualTeacherId)!;

    onAddAttendanceManual({
      teacherId: manualTeacherId,
      teacherName: teacher.name,
      blockName: teacher.blockName,
      date: manualDate,
      arrivalTime: arrivalISO,
      departureTime: departureISO,
    });

    setFormSuccess("হাজিরা রেকর্ড সফলভাবে যোগ করা হয়েছে!");
    setManualTeacherId("");
    setShowAddForm(false);
    
    setTimeout(() => {
      setFormSuccess("");
    }, 3000);
  };

  // Compile the attendance records to display
  // We want to list all teachers and their attendance status for the selected/active date
  const getAttendanceRows = () => {
    // Filter active attendance based on viewMode (DATE vs ALL_TIME)
    const activeRecords = viewMode === "DATE" 
      ? attendance.filter((r) => r.date === selectedDate)
      : attendance;

    // We can show all teachers for the selected date, indicating "Present" or "Absent"
    if (viewMode === "DATE") {
      return teachers.map((teacher) => {
        const record = activeRecords.find((r) => r.teacherId === teacher.id);
        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          blockName: teacher.blockName,
          mobileNumber: teacher.mobileNumber,
          date: selectedDate,
          recordId: record?.id || null,
          arrivalTime: record?.arrivalTime || null,
          departureTime: record?.departureTime || null,
          totalHours: record?.totalHours || null,
          lateReason: record?.lateReason || null,
          earlyDepartureReason: record?.earlyDepartureReason || null,
          status: record ? (record.arrivalTime ? (record.departureTime ? "DEPARTED" : "ARRIVED") : "ABSENT") : "ABSENT"
        };
      });
    } else {
      // In ALL_TIME mode, just show actual saved attendance records
      return activeRecords.map((record) => {
        const teacher = teachers.find(t => t.id === record.teacherId);
        return {
          teacherId: record.teacherId,
          teacherName: record.teacherName,
          blockName: record.blockName,
          mobileNumber: teacher?.mobileNumber || "N/A",
          date: record.date,
          recordId: record.id,
          arrivalTime: record.arrivalTime,
          departureTime: record.departureTime,
          totalHours: record.totalHours,
          lateReason: record.lateReason || null,
          earlyDepartureReason: record.earlyDepartureReason || null,
          status: record.arrivalTime ? (record.departureTime ? "DEPARTED" : "ARRIVED") : "ABSENT"
        };
      });
    }
  };

  // Filter the compiled rows by search and block dropdown
  const filteredRows = getAttendanceRows().filter((row) => {
    const nameMatches = row.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
    const blockMatches = selectedBlock === "ALL" || row.blockName === selectedBlock;
    return nameMatches && blockMatches;
  });

  return (
    <div id="attendance-sheet-root" className="space-y-6">
      {/* Filters and Search Bar */}
      <div id="attendance-filters" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode("DATE")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "DATE" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              নির্দিষ্ট দিনের হাজিরা
            </button>
            <button
              onClick={() => setViewMode("ALL_TIME")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "ALL_TIME" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              সকল হাজিরা হিস্ট্রি
            </button>
          </div>

          {/* Date Picker (visible in DATE view mode) */}
          {viewMode === "DATE" && (
            <div className="flex items-center space-x-2 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-transparent focus:outline-hidden"
              />
            </div>
          )}

          {/* Admin Logout Button */}
          {isAuthenticated && (
            <button
              onClick={() => {
                setIsAuthenticated(false);
                sessionStorage.removeItem("tams_sheet_auth");
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
              title="অ্যাডমিন মোড থেকে লগ আউট করুন"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>লগ আউট</span>
            </button>
          )}
        </div>

        {/* Search & Block Filter */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Block Selection dropdown */}
          <div className="relative w-full sm:w-44">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={selectedBlock}
              onChange={(e) => setSelectedBlock(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-xs bg-white"
            >
              <option value="ALL">সকল পদবী</option>
              {COLLEGE_DESIGNATIONS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Name search */}
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষকের নাম দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3.5 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-xs"
            />
          </div>

          {/* Add Manual Attendance Button */}
          <button
            onClick={() => guardAdminAction(() => setShowAddForm(!showAddForm))}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ম্যানুয়াল হাজিরা</span>
          </button>
        </div>
      </div>

      {/* Manual Attendance Form Overlay */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" /> অ্যাডমিন ম্যানুয়াল হাজিরা এন্ট্রি
            </h4>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
          </div>

          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Teacher Dropdown */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 mb-1">শিক্ষক নির্বাচন করুন</label>
              <select
                value={manualTeacherId}
                onChange={(e) => setManualTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-indigo-500"
              >
                <option value="">-- নির্বাচন করুন --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.blockName})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-2xs font-bold text-slate-500 mb-1">তারিখ</label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
              />
            </div>

            {/* Attendance Toggle */}
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="isAbsentManual"
                checked={isAbsentManual}
                onChange={(e) => setIsAbsentManual(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded-sm focus:ring-indigo-500"
              />
              <label htmlFor="isAbsentManual" className="text-xs font-semibold text-slate-600 cursor-pointer select-none">
                অনুপস্থিত (Absent) মার্ক করুন
              </label>
            </div>

            {/* Hours selection */}
            {!isAbsentManual && (
              <div className="md:col-span-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 mb-0.5">আগমন</label>
                  <input
                    type="time"
                    value={manualArrival}
                    onChange={(e) => setManualArrival(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-400 mb-0.5">নির্গমন</label>
                  <input
                    type="time"
                    value={manualDeparture}
                    onChange={(e) => setManualDeparture(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="md:col-span-4 flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>

          {formError && (
            <p className="text-2xs text-rose-600 font-semibold mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {formError}
            </p>
          )}
        </div>
      )}

      {/* Main Table View */}
      <div id="attendance-sheet-table" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h4 className="text-sm font-semibold text-slate-800">
              {viewMode === "DATE" 
                ? `${formatBengaliDMY(selectedDate)} তারিখের উপস্থিতি তালিকা`
                : "হাজিরা হিস্ট্রি তালিকা (সর্বমোট)"}
            </h4>
            <p className="text-3xs text-slate-400 mt-0.5">উপস্থিত শিক্ষকদের জন্য সবুজ এবং অনুপস্থিত শিক্ষকদের জন্য লাল রঙে চিহ্নিত রয়েছে</p>
          </div>
          <span className="px-2.5 py-1 text-2xs font-bold bg-indigo-50 text-indigo-700 rounded-full font-mono">
            রেকর্ড সংখ্যা: {filteredRows.length} টি
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-semibold">
                <th className="px-5 py-3.5 text-center w-12">নং</th>
                <th className="px-5 py-3.5">শিক্ষকের নাম</th>
                <th className="px-5 py-3.5">পদবী</th>
                {viewMode === "ALL_TIME" && <th className="px-5 py-3.5">তারিখ</th>}
                <th className="px-5 py-3.5">আগমনের সময়</th>
                <th className="px-5 py-3.5">নির্গমনের সময়</th>
                <th className="px-5 py-3.5">মোট কর্মঘণ্টা</th>
                <th className="px-5 py-3.5 text-center w-36">হাজিরা স্ট্যাটাস</th>
                <th className="px-5 py-3.5 text-center w-16">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={viewMode === "ALL_TIME" ? 9 : 8} className="px-5 py-8 text-center text-slate-400 font-medium">
                    এই ফিল্টারিংয়ে কোনো হাজিরা রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const hasArrived = row.status === "ARRIVED" || row.status === "DEPARTED";
                  const isDeparted = row.status === "DEPARTED";

                  let statusText = "অনুপস্থিত";
                  let statusBadgeColor = "bg-rose-50 text-rose-700 border-rose-100";
                  
                  if (row.status === "ARRIVED") {
                    statusText = "উপস্থিত";
                    statusBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  } else if (row.status === "DEPARTED") {
                    statusText = "নির্গমন সম্পন্ন";
                    statusBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  }

                  // Format times
                  const formatTimeStr = (isoStr: string | null) => {
                    if (!isoStr) return "---";
                    try {
                      return new Date(isoStr).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: true,
                      });
                    } catch (e) {
                      return isoStr;
                    }
                  };

                  return (
                    <tr key={`${row.teacherId}-${row.date}`} className="hover:bg-slate-50/30 transition-colors">
                      {/* No. */}
                      <td className="px-5 py-3 text-center text-slate-400 font-mono font-medium">
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {row.teacherName}
                        <p className="text-3xs text-slate-400 font-mono font-normal mt-0.5">{row.mobileNumber}</p>
                        {row.lateReason && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2 py-0.5 mt-1.5 shadow-3xs font-sans">
                            ⚠️ দেরির কারণ: {row.lateReason}
                          </span>
                        )}
                        {row.earlyDepartureReason && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-0.5 mt-1.5 shadow-3xs font-sans">
                            ⚠️ নির্গমনের কারণ: {row.earlyDepartureReason}
                          </span>
                        )}
                      </td>

                      {/* Block */}
                      <td className="px-5 py-3 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-medium bg-slate-100 text-slate-700">
                          {row.blockName}
                        </span>
                      </td>

                      {/* Date (for ALL_TIME view mode) */}
                      {viewMode === "ALL_TIME" && (
                        <td className="px-5 py-3 font-medium text-slate-600">
                          {formatBengaliDMY(row.date)}
                        </td>
                      )}

                      {/* Arrival */}
                      <td className={`px-5 py-3 font-mono font-semibold ${hasArrived ? "text-emerald-700" : "text-slate-300"}`}>
                        {formatTimeStr(row.arrivalTime)}
                      </td>

                      {/* Departure */}
                      <td className={`px-5 py-3 font-mono font-semibold ${isDeparted ? "text-slate-700" : "text-slate-300"}`}>
                        {formatTimeStr(row.departureTime)}
                      </td>

                      {/* Total hours */}
                      <td className="px-5 py-3 font-mono">
                        {row.totalHours !== null ? (
                          <span className="inline-flex items-center font-bold text-indigo-600">
                            {formatHoursAndMinutes(row.totalHours)}
                          </span>
                        ) : (
                          <span className="text-slate-300">---</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3 text-center">
                        <div className={`inline-flex items-center px-2.5 py-1 text-3xs font-bold rounded-lg border gap-1 mx-auto ${statusBadgeColor}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${hasArrived ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                          <span>{statusText}</span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-3 text-center">
                        {row.recordId ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => guardAdminAction(() => handleStartEdit(row))}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                              title="হাজিরা তথ্য পরিবর্তন করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => guardAdminAction(() => setDeleteTargetAttendanceId(row.recordId!))}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="হাজিরা রেকর্ড মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => guardAdminAction(() => handleQuickAdd(row.teacherId, row.date))}
                            className="inline-flex items-center gap-1 px-2 py-1 text-3xs font-semibold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 rounded-md transition-all cursor-pointer"
                            title="দ্রুত হাজিরা এন্ট্রি করুন"
                          >
                            <Plus className="w-3 h-3" />
                            <span>হাজিরা দিন</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800">
                ✏️ হাজিরা রেকর্ড সংশোধন (Edit Record)
              </h4>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  শিক্ষকের নাম
                </label>
                <input
                  type="text"
                  value={editingRecord.teacherName}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    পদবী
                  </label>
                  <input
                    type="text"
                    value={editingRecord.blockName}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    আগমনের সময়
                  </label>
                  <input
                    type="time"
                    value={editArrival}
                    onChange={(e) => setEditArrival(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    নির্গমনের সময়
                  </label>
                  <input
                    type="time"
                    value={editDeparture}
                    onChange={(e) => setEditDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  দেরিতে আসার কারণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={editLateReason}
                  onChange={(e) => setEditLateReason(e.target.value)}
                  placeholder="দেরি হলে এখানে তার কারণ লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  তাড়াতাড়ি প্রস্থানের কারণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={editEarlyDepartureReason}
                  onChange={(e) => setEditEarlyDepartureReason(e.target.value)}
                  placeholder="তাড়াতাড়ি চলে গেলে তার কারণ লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-200"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Attendance Modal */}
      {quickAddTeacherId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800">
                ➕ দ্রুত হাজিরা এন্ট্রি (Quick Add Record)
              </h4>
              <button
                type="button"
                onClick={() => setQuickAddTeacherId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  শিক্ষকের নাম
                </label>
                <input
                  type="text"
                  value={teachers.find((t) => t.id === quickAddTeacherId)?.name || ""}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    তারিখ
                  </label>
                  <input
                    type="date"
                    value={quickAddDate}
                    onChange={(e) => setQuickAddDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    পদবী
                  </label>
                  <input
                    type="text"
                    value={teachers.find((t) => t.id === quickAddTeacherId)?.blockName || ""}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    আগমনের সময়
                  </label>
                  <input
                    type="time"
                    value={quickAddArrival}
                    onChange={(e) => setQuickAddArrival(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    নির্গমনের সময়
                  </label>
                  <input
                    type="time"
                    value={quickAddDeparture}
                    onChange={(e) => setQuickAddDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  দেরিতে আসার কারণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={quickAddLateReason}
                  onChange={(e) => setQuickAddLateReason(e.target.value)}
                  placeholder="দেরি হলে এখানে তার কারণ লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-3xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  তাড়াতাড়ি প্রস্থানের কারণ (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  value={quickAddEarlyDepartureReason}
                  onChange={(e) => setQuickAddEarlyDepartureReason(e.target.value)}
                  placeholder="তাড়াতাড়ি চলে গেলে তার কারণ লিখুন..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setQuickAddTeacherId(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-200"
                >
                  হাজিরা যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Attendance Confirmation Modal */}
      {deleteTargetAttendanceId && (
        <div id="delete-attendance-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="delete-attendance-modal" className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800">
                ⚠️ হাজিরা রেকর্ড মুছে ফেলার নিশ্চিতকরণ
              </h4>
              <button
                type="button"
                onClick={() => setDeleteTargetAttendanceId(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনি কি নিশ্চিতভাবে এই হাজিরা রেকর্ডটি মুছে ফেলতে চান? এই অ্যাকশনটি পূর্বাবস্থায় ফিরিয়ে নেওয়া সম্ভব নয়।
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setDeleteTargetAttendanceId(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteAttendance(deleteTargetAttendanceId);
                    setDeleteTargetAttendanceId(null);
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

      {/* Admin Verification (Login) Modal */}
      {showLoginModal && (
        <div id="admin-login-modal-overlay" className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div id="admin-login-modal" className="bg-white w-full max-w-sm rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>🔐 অ্যাডমিন যাচাইকরণ</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setPendingAction(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleLoginSubmit} className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                ম্যানুয়াল হাজিরা এবং হাজিরা অপশন ব্যবহার করতে দয়া করে ইউজারনেম এবং পাসওয়ার্ড প্রদান করুন।
              </p>

              {loginError && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[11px] font-medium flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  ইউজার নেম (User Name)
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Debashis"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500 transition-all bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  পাসওয়ার্ড (Password)
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-indigo-500 transition-all bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-indigo-200 flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>লগইন করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
