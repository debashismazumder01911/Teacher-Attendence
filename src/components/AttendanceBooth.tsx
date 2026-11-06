/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { LogIn, LogOut, CheckCircle, Clock, AlertTriangle, Sparkles, UserCheck, Calendar, Zap, X } from "lucide-react";
import { Teacher, AttendanceRecord } from "../types";

interface AttendanceBoothProps {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  selectedDate: string; // YYYY-MM-DD
  onRecordArrival: (teacherId: string, lateReason?: string) => void;
  onRecordDeparture: (teacherId: string, earlyDepartureReason?: string) => void;
  onBulkRecordAttendance?: (arrivalHHMM: string, departureHHMM: string, targetDate?: string) => Promise<void> | void;
}

export default function AttendanceBooth({
  teachers,
  attendance,
  selectedDate,
  onRecordArrival,
  onRecordDeparture,
  onBulkRecordAttendance,
}: AttendanceBoothProps) {
  // Local state for the kiosk select dropdown
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [kioskSearch, setKioskSearch] = useState("");
  const [kioskMessage, setKioskMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Late reason prompt state
  const [pendingLateArrival, setPendingLateArrival] = useState<{
    teacherId: string;
    teacherName: string;
  } | null>(null);
  const [lateReasonText, setLateReasonText] = useState("");

  // Early departure reason prompt state
  const [pendingEarlyDeparture, setPendingEarlyDeparture] = useState<{
    teacherId: string;
    teacherName: string;
  } | null>(null);
  const [earlyDepartureReasonText, setEarlyDepartureReasonText] = useState("");

  // Bulk attendance modal state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<"arrival" | "departure" | "both">("arrival");
  const [bulkDate, setBulkDate] = useState(selectedDate);
  const [bulkArrival, setBulkArrival] = useState("09:00");
  const [bulkDeparture, setBulkDeparture] = useState("13:30");
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false);

  useEffect(() => {
    setBulkDate(selectedDate);
  }, [selectedDate]);

  const handleConfirmBulkAttendance = async () => {
    if (!onBulkRecordAttendance) return;
    setIsBulkSubmitting(true);
    try {
      const arrivalToSave = (bulkMode === "arrival" || bulkMode === "both") ? bulkArrival : "";
      const departureToSave = (bulkMode === "departure" || bulkMode === "both") ? bulkDeparture : "";

      await onBulkRecordAttendance(arrivalToSave, departureToSave, bulkDate);
      setShowBulkModal(false);

      let msg = "";
      if (bulkMode === "arrival") {
        msg = `সকল ${toBengaliNumber(teachers.length)} জন কর্মচারীর তারিখ ${bulkDate}-এ আগমন সময় (${bulkArrival}) সফলভাবে সেট করা হয়েছে!`;
      } else if (bulkMode === "departure") {
        msg = `সকল ${toBengaliNumber(teachers.length)} জন কর্মচারীর তারিখ ${bulkDate}-এ নির্গমন সময় (${bulkDeparture}) সফলভাবে সেট করা হয়েছে!`;
      } else {
        msg = `সকল ${toBengaliNumber(teachers.length)} জন কর্মচারীর তারিখ ${bulkDate}-এ আগমন (${bulkArrival}) ও নির্গমন (${bulkDeparture}) সময় সফলভাবে সেট করা হয়েছে!`;
      }

      showKioskMessage(msg, "success");
    } catch (e) {
      showKioskMessage("সময় সেট করতে সমস্যা দেখা দিয়েছে। পুনরায় চেষ্টা করুন।", "error");
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Live Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time in English 12-hour format
  const formatBengaliTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
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

  const formatBengaliDate = (date: Date) => {
    const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
    const dayName = days[date.getDay()];
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dayName}, ${dd}/${mm}/${yyyy}`;
  };

  const formatDateToDMY = (dateStr: string | undefined): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Helper to find today's attendance record for a teacher
  const getTodayRecord = (teacherId: string): AttendanceRecord | undefined => {
    return attendance.find((r) => r.teacherId === teacherId && r.date === selectedDate);
  };

  // Trigger arrival verification check
  const triggerArrivalCheck = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // Check if current time is after 10:30 AM
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = hours > 10 || (hours === 10 && minutes > 30);

    if (isLate) {
      setPendingLateArrival({
        teacherId,
        teacherName: teacher.name,
      });
      setLateReasonText("");
    } else {
      // Normal arrival logging
      onRecordArrival(teacherId);
      showKioskMessage(`${teacher.name}-এর আগমন সফলভাবে রেকর্ড করা হয়েছে!`, "success");
      if (selectedTeacherId === teacherId) {
        setSelectedTeacherId("");
        setKioskSearch("");
      }
    }
  };

  // Late reason handlers
  const handleLateReasonSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingLateArrival) return;
    
    const { teacherId, teacherName } = pendingLateArrival;
    const trimmedReason = lateReasonText.trim();

    if (trimmedReason) {
      onRecordArrival(teacherId, trimmedReason);
      showKioskMessage(`${teacherName}-এর আগমন সফলভাবে দেরির কারণসহ রেকর্ড করা হয়েছে!`, "success");
    } else {
      onRecordArrival(teacherId);
      showKioskMessage(`${teacherName}-এর আগমন সফলভাবে রেকর্ড করা হয়েছে!`, "success");
    }
    
    // Clear states
    setPendingLateArrival(null);
    setLateReasonText("");
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId("");
      setKioskSearch("");
    }
  };

  const handleArrivalWithoutReason = () => {
    if (!pendingLateArrival) return;
    const { teacherId, teacherName } = pendingLateArrival;
    
    onRecordArrival(teacherId);
    showKioskMessage(`${teacherName}-এর আগমন সফলভাবে রেকর্ড করা হয়েছে!`, "success");
    
    // Clear states
    setPendingLateArrival(null);
    setLateReasonText("");
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId("");
      setKioskSearch("");
    }
  };

  const handleLateReasonCancel = () => {
    setPendingLateArrival(null);
    setLateReasonText("");
  };

  // Trigger departure verification check
  const triggerDepartureCheck = (teacherId: string) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;

    // Check if current time is before 01:00 PM (13:00)
    const now = new Date();
    const hours = now.getHours();
    const isEarly = hours < 13;

    if (isEarly) {
      setPendingEarlyDeparture({
        teacherId,
        teacherName: teacher.name,
      });
      setEarlyDepartureReasonText("");
    } else {
      // Normal departure logging
      onRecordDeparture(teacherId);
      showKioskMessage(`${teacher.name}-এর নির্গমন সফলভাবে রেকর্ড করা হয়েছে!`, "success");
      if (selectedTeacherId === teacherId) {
        setSelectedTeacherId("");
        setKioskSearch("");
      }
    }
  };

  // Early departure reason handlers
  const handleEarlyDepartureReasonSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pendingEarlyDeparture) return;
    
    const { teacherId, teacherName } = pendingEarlyDeparture;
    const trimmedReason = earlyDepartureReasonText.trim();

    if (trimmedReason) {
      onRecordDeparture(teacherId, trimmedReason);
      showKioskMessage(`${teacherName}-এর নির্গমন সফলভাবে নির্গমনের কারণসহ রেকর্ড করা হয়েছে!`, "success");
    } else {
      onRecordDeparture(teacherId);
      showKioskMessage(`${teacherName}-এর নির্গমন সফলভাবে রেকর্ড করা হয়েছে!`, "success");
    }
    
    // Clear states
    setPendingEarlyDeparture(null);
    setEarlyDepartureReasonText("");
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId("");
      setKioskSearch("");
    }
  };

  const handleEarlyDepartureWithoutReason = () => {
    if (!pendingEarlyDeparture) return;
    const { teacherId, teacherName } = pendingEarlyDeparture;
    
    onRecordDeparture(teacherId);
    showKioskMessage(`${teacherName}-এর নির্গমন সফলভাবে রেকর্ড করা হয়েছে!`, "success");
    
    // Clear states
    setPendingEarlyDeparture(null);
    setEarlyDepartureReasonText("");
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId("");
      setKioskSearch("");
    }
  };

  const handleEarlyDepartureReasonCancel = () => {
    setPendingEarlyDeparture(null);
    setEarlyDepartureReasonText("");
  };

  // Kiosk handlers
  const handleKioskArrival = () => {
    if (!selectedTeacherId) return;
    const record = getTodayRecord(selectedTeacherId);
    
    if (record && record.arrivalTime) {
      showKioskMessage("এই শিক্ষকের আগমন ইতিমধ্যে রেকর্ড করা হয়েছে!", "error");
      return;
    }

    triggerArrivalCheck(selectedTeacherId);
  };

  const handleKioskDeparture = () => {
    if (!selectedTeacherId) return;
    const record = getTodayRecord(selectedTeacherId);

    if (!record || !record.arrivalTime) {
      showKioskMessage("নির্গমন রেকর্ডের আগে শিক্ষককে অবশ্যই আগমন রেকর্ড করতে হবে!", "error");
      return;
    }

    if (record.departureTime) {
      showKioskMessage("এই শিক্ষকের নির্গমন ইতিমধ্যে রেকর্ড করা হয়েছে!", "error");
      return;
    }

    triggerDepartureCheck(selectedTeacherId);
  };

  const showKioskMessage = (text: string, type: "success" | "error" | "info") => {
    setKioskMessage({ text, type });
    setTimeout(() => {
      setKioskMessage(null);
    }, 4000);
  };

  // Filter teachers for kiosk search dropdown
  const filteredKioskTeachers = teachers.filter((t) =>
    t.name.toLowerCase().includes(kioskSearch.toLowerCase())
  );

  return (
    <div id="attendance-booth-root" className="space-y-6">
      {/* Kiosk / Banner Panel */}
      <div id="booth-banner" className="bg-gradient-to-r from-indigo-900 to-indigo-850 p-6 rounded-2xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <span className="px-3 py-1 bg-white/10 text-indigo-200 text-xs font-semibold rounded-full uppercase tracking-wider backdrop-blur-xs inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> ডিজিটাল হাজিরা বুথ (Live)
          </span>
          <h2 className="text-xl md:text-2xl font-bold font-sans">রংপুর কলেজের শিক্ষক কর্মচারী হাজিরা</h2>
          <p className="text-sm text-indigo-200/90 max-w-lg">
            নিচের তালিকা থেকে আপনার নাম খুঁজুন অথবা কিওস্ক ফরম ব্যবহার করে দ্রুত আপনার আগমন বা নির্গমন রেকর্ড করুন।
          </p>
        </div>

        {/* Live Clock Display */}
        <div id="live-clock" className="bg-slate-950/45 p-5 rounded-2xl border border-white/20 backdrop-blur-md min-w-[280px] text-center md:text-right flex flex-col justify-center shadow-inner">
          <p className="text-xs uppercase tracking-wider text-emerald-300 font-extrabold mb-1.5 flex items-center justify-center md:justify-end gap-1.5">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" /> বর্তমান সময়
          </p>
          <p className="text-3xl md:text-4xl font-extrabold font-mono text-emerald-400 tracking-wider filter drop-shadow-[0_2px_4px_rgba(52,211,153,0.3)]">
            {formatBengaliTime(currentTime)}
          </p>
          <p className="text-sm text-slate-100 font-bold mt-1.5 tracking-wide">
            {formatBengaliDate(currentTime)}
          </p>
        </div>
      </div>

      {/* Kiosk Fast Check-In Form */}
      <div id="kiosk-form-panel" className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div className="flex items-center space-x-2.5 mb-5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-slate-800">দ্রুত হাজিরা কিওস্ক (Fast Check-in)</h3>
            <p className="text-xs text-slate-400 mt-0.5">নাম নির্বাচন করে মাউস ক্লিকের মাধ্যমে তাৎক্ষণিক সময় রেকর্ড করুন</p>
            <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1.5 bg-rose-50/70 border border-rose-100 px-3 py-1.5 rounded-lg w-fit">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-600 animate-pulse shrink-0"></span>
              বিশেষ সতর্কীকরণ: দ্রুত হাজিরা কিওস্ক (Fast Check-in) অংশে আগমন এবং নির্গমন বাটন ব্যবহার না করা হলে শিক্ষকের ছুটি হিসেবে গণ্য করা হবে।
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Dropdown Selection */}
          <div className="md:col-span-6 relative">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">শিক্ষকের নাম নির্বাচন করুন</label>
            <div className="relative">
              <select
                id="kiosk-teacher-select"
                value={selectedTeacherId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedTeacherId(val);
                  const teacher = teachers.find((t) => t.id === val);
                  setKioskSearch(teacher ? teacher.name : "");
                }}
                className="w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white cursor-pointer appearance-none text-slate-700 font-medium"
              >
                <option value="" className="text-slate-400">-- শিক্ষক/কর্মচারী নির্বাচন করুন --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-700">
                    {t.name} ({t.blockName})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Selection indicator */}
          <div className="md:col-span-2">
            {selectedTeacherId && (
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-center text-xs font-semibold">
                ✓ শিক্ষক নির্বাচিত
              </div>
            )}
            {!selectedTeacherId && (
              <div className="p-2 bg-slate-50 text-slate-400 rounded-xl border border-slate-100 text-center text-xs font-medium">
                কোনো শিক্ষক নির্বাচন করুন
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="md:col-span-4 grid grid-cols-2 gap-3">
            <button
              onClick={handleKioskArrival}
              disabled={!selectedTeacherId}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-1.5 border shadow-xs cursor-pointer transition-all ${
                selectedTeacherId
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 active:scale-98"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>আগমন (Arrival)</span>
            </button>

            <button
              onClick={handleKioskDeparture}
              disabled={!selectedTeacherId}
              className={`py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center space-x-1.5 border shadow-xs cursor-pointer transition-all ${
                selectedTeacherId
                  ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-600 active:scale-98"
                  : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
              }`}
            >
              <LogOut className="w-4 h-4" />
              <span>নির্গমন (Departure)</span>
            </button>
          </div>
        </div>

        {kioskMessage && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              kioskMessage.type === "success"
                ? "bg-emerald-50 text-emerald-850 border-emerald-100"
                : kioskMessage.type === "error"
                ? "bg-rose-50 text-rose-850 border-rose-100"
                : "bg-indigo-50 text-indigo-850 border-indigo-100"
            }`}
          >
            {kioskMessage.type === "error" ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{kioskMessage.text}</span>
          </div>
        )}
      </div>

      {/* Complete Teacher Cards Grid for Manual Attendance Logging */}
      <div id="booth-cards-section">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b border-slate-50 pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
              <span>আজকের হাজিরা বোর্ড</span>
              <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
                {toBengaliNumber(teachers.length)} জন শিক্ষকের প্যানেল
              </span>
            </h3>

            {/* Quick Bulk Attendance Option right beside teacher panel tag */}
            {onBulkRecordAttendance && (
              <button
                type="button"
                onClick={() => setShowBulkModal(true)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-98"
                title="এক ক্লিকের মাধ্যমে সকল কর্মচারীর আগমন ও নির্গমন সময় সেট করুন"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>এক ক্লিকে সকল কর্মচারীর সময় সেট</span>
              </button>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-650 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 w-fit font-sans">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>আজকের তারিখ:</span>
            <span className="text-indigo-650 font-bold">{toBengaliNumber(formatDateToDMY(selectedDate))}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => {
            const todayRecord = getTodayRecord(teacher.id);
            const hasArrived = !!todayRecord?.arrivalTime;
            const hasDeparted = !!todayRecord?.departureTime;

            // Status details
            let statusText = "অনুপস্থিত / অপেক্ষমান";
            let statusColorClass = "bg-rose-50 text-rose-700 border-rose-100";
            
            if (hasArrived && !hasDeparted) {
              statusText = "উপস্থিত (কলেজে আছেন)";
              statusColorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
            } else if (hasArrived && hasDeparted) {
              statusText = "নির্গমন সম্পন্ন (ছুটি)";
              statusColorClass = "bg-slate-100 text-slate-600 border-slate-200";
            }

            return (
              <div
                key={teacher.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                {/* Teacher Details */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{teacher.name}</h4>
                      <p className="text-2xs text-slate-400 mt-0.5 font-mono">{teacher.mobileNumber}</p>
                    </div>
                    <span className="text-3xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                      {teacher.blockName}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {/* Status Badge */}
                    <div className={`px-2.5 py-1 text-3xs font-semibold rounded-lg border flex items-center gap-1 w-fit ${statusColorClass}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${hasArrived ? (hasDeparted ? "bg-slate-400" : "bg-emerald-500") : "bg-rose-500"}`}></div>
                      <span>{statusText}</span>
                    </div>

                    {/* Check-in info */}
                    <div className="text-3xs text-slate-500 font-mono space-y-0.5">
                      {hasArrived && (
                        <p className="flex items-center gap-1">
                          <span className="text-slate-400">আগমন:</span>
                          <span className="text-slate-700 font-semibold">
                            {new Date(todayRecord!.arrivalTime!).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </p>
                      )}
                      {hasDeparted && (
                        <p className="flex items-center gap-1">
                          <span className="text-slate-400">নির্গমন:</span>
                          <span className="text-slate-700 font-semibold">
                            {new Date(todayRecord!.departureTime!).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </p>
                      )}
                      {hasArrived && hasDeparted && (
                        <p className="flex items-center gap-1 font-semibold text-indigo-600">
                          <span className="text-slate-400 font-medium">কর্মঘণ্টা:</span>
                          <span>{formatHoursAndMinutes(todayRecord!.totalHours)}</span>
                        </p>
                      )}
                      {todayRecord?.lateReason && (
                        <div className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1 mt-2.5 flex items-start gap-1">
                          <span className="shrink-0">⚠️</span>
                          <span>দেরির কারণ: {todayRecord.lateReason}</span>
                        </div>
                      )}
                      {todayRecord?.earlyDepartureReason && (
                        <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1 mt-1.5 flex items-start gap-1">
                          <span className="shrink-0">⚠️</span>
                          <span>নির্গমনের কারণ: {todayRecord.earlyDepartureReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-50">
                  <button
                    onClick={() => triggerArrivalCheck(teacher.id)}
                    disabled={hasArrived}
                    className={`py-1.5 px-2 rounded-lg text-2xs font-semibold flex items-center justify-center space-x-1 border cursor-pointer transition-all ${
                      hasArrived
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-800"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>আগমন</span>
                  </button>

                  <button
                    onClick={() => triggerDepartureCheck(teacher.id)}
                    disabled={!hasArrived || hasDeparted}
                    className={`py-1.5 px-2 rounded-lg text-2xs font-semibold flex items-center justify-center space-x-1 border cursor-pointer transition-all ${
                      !hasArrived || hasDeparted
                        ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                        : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100 hover:text-rose-800"
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>নির্গমন</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Late Arrival Reason Modal */}
      {pendingLateArrival && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center gap-3 text-rose-800">
              <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-md font-bold font-sans">দেরিতে আগমনের হাজিরা রেকর্ড</h3>
                <p className="text-3xs text-rose-600 font-medium">10:30 AM এর পর আগমন চিহ্নিত করা হয়েছে</p>
              </div>
            </div>
            
            <form onSubmit={handleLateReasonSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  শিক্ষক/कर्मচারী: <strong className="text-slate-800 font-bold">{pendingLateArrival.teacherName}</strong>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  আজকের তারিখ: <strong className="text-slate-800 font-bold font-mono">{formatDateToDMY(selectedDate)}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>দেরিতে আসার যৌক্তিক কারণ লিখুন</span>
                  <span className="text-slate-400 font-normal text-3xs">(ঐচ্ছিক)</span>
                </label>
                <textarea
                  rows={3}
                  value={lateReasonText}
                  onChange={(e) => setLateReasonText(e.target.value)}
                  placeholder="যেমন: ট্রাফিক জ্যাম, শারীরিক অসুস্থতা, পারিবারিক সমস্যা ইত্যাদি..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs text-slate-800 placeholder-slate-400 font-medium leading-relaxed resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleLateReasonCancel}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-2xs font-semibold transition-all cursor-pointer"
                >
                  সম্পূর্ণ বাতিল
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleArrivalWithoutReason}
                    className="px-3 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-2xs font-semibold transition-all cursor-pointer"
                  >
                    কারণ ছাড়া আগমন
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-2xs font-semibold transition-all cursor-pointer shadow-md shadow-rose-200 active:scale-98"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Early Departure Reason Modal */}
      {pendingEarlyDeparture && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl max-w-md w-full overflow-hidden animate-scale-up">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100 flex items-center gap-3 text-amber-800">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-md font-bold font-sans">দ্রুত নির্গমনের হাজিরা রেকর্ড</h3>
                <p className="text-3xs text-amber-600 font-medium">01:00 PM এর আগে নির্গমন চিহ্নিত করা হয়েছে</p>
              </div>
            </div>
            
            <form onSubmit={handleEarlyDepartureReasonSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  শিক্ষক/কর্মচারী: <strong className="text-slate-800 font-bold">{pendingEarlyDeparture.teacherName}</strong>
                </p>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  আজকের তারিখ: <strong className="text-slate-800 font-bold font-mono">{formatDateToDMY(selectedDate)}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 flex items-center justify-between">
                  <span>নির্গমনের যৌক্তিক কারণ লিখুন</span>
                  <span className="text-slate-400 font-normal text-3xs">(ঐচ্ছিক)</span>
                </label>
                <textarea
                  rows={3}
                  value={earlyDepartureReasonText}
                  onChange={(e) => setEarlyDepartureReasonText(e.target.value)}
                  placeholder="যেমন: জরুরি অফিশিয়াল কাজ, শারীরিক অসুস্থতা, পূর্বানুমতি প্রাপ্ত ছুটি ইত্যাদি..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-xs text-slate-800 placeholder-slate-400 font-medium leading-relaxed resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleEarlyDepartureReasonCancel}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-2xs font-semibold transition-all cursor-pointer"
                >
                  সম্পূর্ণ বাতিল
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleEarlyDepartureWithoutReason}
                    className="px-3 py-2 border border-amber-200 hover:bg-amber-50 text-amber-600 rounded-xl text-2xs font-semibold transition-all cursor-pointer"
                  >
                    কারণ ছাড়া নির্গমন
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-2xs font-semibold transition-all cursor-pointer shadow-md shadow-amber-200 active:scale-98"
                  >
                    সংরক্ষণ করুন
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Attendance Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Zap className="w-5 h-5 fill-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">এক ক্লিকে সকল কর্মচারীর সময় সেট</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    একইসাথে সকল {toBengaliNumber(teachers.length)} জন শিক্ষকের আগমন ও নির্গমন সময় নির্ধারণ করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form inputs */}
            <div className="space-y-4 pt-1">
              {/* Date Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>উপস্থিতির তারিখ (Date):</span>
                </label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={(e) => setBulkDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Option Mode Selector */}
              <div>
                <label className="block text-3xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  কাজের ধরন নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBulkMode("arrival")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      bulkMode === "arrival"
                        ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🟢 কেবল আগমন
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode("departure")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      bulkMode === "departure"
                        ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🟠 কেবল নির্গমন
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode("both")}
                    className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      bulkMode === "both"
                        ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🔵 উভয় সময়
                  </button>
                </div>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className={bulkMode === "departure" ? "opacity-40 pointer-events-none" : ""}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>আগমন সময় (Arrival)</span>
                    {bulkMode === "departure" && <span className="text-3xs text-slate-400 font-normal">(নিষ্ক্রিয়)</span>}
                  </label>
                  <input
                    type="time"
                    disabled={bulkMode === "departure"}
                    value={bulkArrival}
                    onChange={(e) => setBulkArrival(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>

                <div className={bulkMode === "arrival" ? "opacity-40 pointer-events-none" : ""}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>নির্গমন সময় (Departure)</span>
                    {bulkMode === "arrival" && <span className="text-3xs text-slate-400 font-normal">(নিষ্ক্রিয়)</span>}
                  </label>
                  <input
                    type="time"
                    disabled={bulkMode === "arrival"}
                    value={bulkDeparture}
                    onChange={(e) => setBulkDeparture(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider">দ্রুত সময় পছন্দ:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const hrs = String(now.getHours()).padStart(2, "0");
                      const mins = String(now.getMinutes()).padStart(2, "0");
                      setBulkArrival(`${hrs}:${mins}`);
                      setBulkMode("arrival");
                    }}
                    className={`px-2.5 py-1.5 border rounded-lg text-3xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      bulkMode === "arrival"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs"
                        : "bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span>🟢 বর্তমান সময় আগমন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const hrs = String(now.getHours()).padStart(2, "0");
                      const mins = String(now.getMinutes()).padStart(2, "0");
                      setBulkDeparture(`${hrs}:${mins}`);
                      setBulkMode("departure");
                    }}
                    className={`px-2.5 py-1.5 border rounded-lg text-3xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      bulkMode === "departure"
                        ? "bg-amber-50 text-amber-700 border-amber-300 shadow-2xs"
                        : "bg-slate-50 hover:bg-amber-50 hover:text-amber-700 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span>🟠 বর্তমান সময় নির্গমন</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Note */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-3xs text-indigo-900 leading-relaxed">
                ℹ️ এই বোতামে ক্লিক করলে <strong>{bulkDate}</strong> তারিখে ব্যাকএন্ডের সকল <strong>{toBengaliNumber(teachers.length)} জন শিক্ষকের</strong>{" "}
                {bulkMode === "arrival" && <span>কেবলমাত্র <strong>আগমন সময় ({bulkArrival})</strong> সংরক্ষণ হবে।</span>}
                {bulkMode === "departure" && <span>কেবলমাত্র <strong>নির্গমন সময় ({bulkDeparture})</strong> সংরক্ষণ হবে।</span>}
                {bulkMode === "both" && <span><strong>আগমন ({bulkArrival}) ও নির্গমন ({bulkDeparture})</strong> উভয় সময় একযোগে সংরক্ষণ হবে।</span>}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={isBulkSubmitting}
                onClick={handleConfirmBulkAttendance}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>
                  {isBulkSubmitting
                    ? "সংরক্ষণ করা হচ্ছে..."
                    : bulkMode === "arrival"
                    ? `এক ক্লিকে আগমন সময় সেট করুন (${toBengaliNumber(teachers.length)} জন)`
                    : bulkMode === "departure"
                    ? `এক ক্লিকে নির্গমন সময় সেট করুন (${toBengaliNumber(teachers.length)} জন)`
                    : `এক ক্লিকে উভয় সময় সেট করুন (${toBengaliNumber(teachers.length)} জন)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
