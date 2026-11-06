/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Search, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Tag,
  Info
} from "lucide-react";
import { Teacher, AttendanceRecord } from "../types";

interface LeaveManagementProps {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  customWorkingDays?: Record<string, string[]>;
  onUpdateWorkingDays?: (updated: Record<string, string[]>) => void;
}

export default function LeaveManagement({
  teachers,
  attendance,
  customWorkingDays = {},
  onUpdateWorkingDays,
}: LeaveManagementProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(null);
  
  // Custom leave types persistent state
  const [customLeaveTypes, setCustomLeaveTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("tams_custom_leaves");
    if (saved) {
      try {
        setCustomLeaveTypes(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading custom leaves", e);
      }
    }
  }, []);

  const saveCustomLeave = (teacherId: string, dateStr: string, type: string) => {
    const updated = {
      ...customLeaveTypes,
      [`${teacherId}_${dateStr}`]: type
    };
    setCustomLeaveTypes(updated);
    localStorage.setItem("tams_custom_leaves", JSON.stringify(updated));
  };

  const monthNames = [
    { num: 1, name: "জানুয়ারি" },
    { num: 2, name: "ফেব্রুয়ারি" },
    { num: 3, name: "মার্চ" },
    { num: 4, name: "এপ্রিল" },
    { num: 5, name: "মে" },
    { num: 6, name: "জুন" },
    { num: 7, name: "জুলাই" },
    { num: 8, name: "আগস্ট" },
    { num: 9, name: "সেপ্টেম্বর" },
    { num: 10, name: "অক্টোবর" },
    { num: 11, name: "নভেম্বর" },
    { num: 12, name: "ডিসেম্বর" },
  ];

  const banglaDays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

  const toBengaliNumber = (num: number | string): string => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .split("")
      .map((digit) => (digit >= "0" && digit <= "9" ? banglaDigits[parseInt(digit, 10)] : digit))
      .join("");
  };

  const formatBengaliDateString = (dateStr: string): string => {
    const d = new Date(dateStr);
    const dayName = banglaDays[d.getDay()];
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy} (${dayName})`;
  };

  // Helper to get all calendar days of the selected month (1st to last)
  const getAllDaysInMonth = (year: number, month: number): string[] => {
    const dates: string[] = [];
    const lastDay = new Date(year, month, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const yyyy = year;
      const mm = String(month).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    return dates;
  };

  // Helper to get all default working days (Sunday to Thursday) in the selected month
  const getDefaultWorkingDays = (year: number, month: number): string[] => {
    const dates: string[] = [];
    const lastDay = new Date(year, month, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const curDate = new Date(year, month - 1, d);
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 5 && dayOfWeek !== 6) { // Friday = 5, Saturday = 6
        const yyyy = year;
        const mm = String(month).padStart(2, "0");
        const dd = String(d).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
    }
    return dates;
  };

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  const monthWorkingDays = customWorkingDays[monthKey] || getDefaultWorkingDays(selectedYear, selectedMonth);

  // Active working dates to calculate stats on (up to today/June 25, 2026)
  const todayStr = "2026-06-25";
  const workingDates = monthWorkingDays.filter((date) => date <= todayStr);

  const allDaysInMonth = getAllDaysInMonth(selectedYear, selectedMonth);

  const handleToggleDate = (dateStr: string) => {
    if (!onUpdateWorkingDays) return;
    const currentList = customWorkingDays[monthKey] || getDefaultWorkingDays(selectedYear, selectedMonth);
    let updatedList: string[];
    if (currentList.includes(dateStr)) {
      updatedList = currentList.filter((d) => d !== dateStr);
    } else {
      updatedList = [...currentList, dateStr].sort();
    }
    onUpdateWorkingDays({
      ...customWorkingDays,
      [monthKey]: updatedList,
    });
  };

  const setWeekdaysOnlyPreset = () => {
    if (!onUpdateWorkingDays) return;
    const updatedList = getDefaultWorkingDays(selectedYear, selectedMonth);
    onUpdateWorkingDays({
      ...customWorkingDays,
      [monthKey]: updatedList,
    });
  };

  const selectAllDaysPreset = () => {
    if (!onUpdateWorkingDays) return;
    const updatedList = getAllDaysInMonth(selectedYear, selectedMonth);
    onUpdateWorkingDays({
      ...customWorkingDays,
      [monthKey]: updatedList,
    });
  };

  const clearAllDaysPreset = () => {
    if (!onUpdateWorkingDays) return;
    onUpdateWorkingDays({
      ...customWorkingDays,
      [monthKey]: [],
    });
  };

  // Compute stats for each teacher
  const filteredTeachers = teachers.filter((t) => {
    const term = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      t.blockName.toLowerCase().includes(term) ||
      t.mobileNumber.includes(term)
    );
  });

  const activeMonthName = monthNames.find((m) => m.num === selectedMonth)?.name || "";

  return (
    <div id="leave-tracker-root" className="space-y-6">
      
      {/* Warnings & Headers */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            শিক্ষক ও কর্মচারী ছুটির খাতা (অনুপস্থিতি হিসাব)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            হাজিরা কিওস্ক বা খাতায় আগমন রেকর্ড না থাকলে সেই দিনগুলো স্বয়ংক্রিয়ভাবে ছুটি বা অনুপস্থিতি হিসেবে গণ্য করা হয়।
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <div className="relative w-full md:w-auto">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full md:w-auto pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-xs bg-white font-semibold text-slate-700"
            >
              {monthNames.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name} {toBengaliNumber(selectedYear)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* working days selector card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              {activeMonthName} মাসের কর্মদিবস সমূহ নির্বাচন করুন
            </h3>
            <p className="text-3xs text-slate-400 mt-1">
              নিচের দিনগুলো থেকে কাজের দিন (कर्मদিবস) নির্বাচন করুন। উক্ত দিন গুলোর উপর ভিত্তি করে শিক্ষকদের উপস্থিত, অনুপস্থিত বা ছুটি গন্য হবে।
            </p>
          </div>
          
          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
            <button
              type="button"
              onClick={setWeekdaysOnlyPreset}
              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-3xs font-semibold transition-colors cursor-pointer"
            >
              রবি-বৃহ (ডিফল্ট)
            </button>
            <button
              type="button"
              onClick={selectAllDaysPreset}
              className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-3xs font-semibold transition-colors cursor-pointer"
            >
              সব সিলেক্ট
            </button>
            <button
              type="button"
              onClick={clearAllDaysPreset}
              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-3xs font-semibold transition-colors cursor-pointer"
            >
              সব বাতিল
            </button>
          </div>
        </div>

        {/* Date Toggles Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {allDaysInMonth.map((dateStr) => {
            const isWorking = monthWorkingDays.includes(dateStr);
            const dateObj = new Date(dateStr);
            const dayNum = dateObj.getDate();
            const dayOfWeek = dateObj.getDay();
            const dayName = banglaDays[dayOfWeek].substring(0, 5); // রবি, সোম, মঙ্গল etc.
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday/Saturday
            
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleToggleDate(dateStr)}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden h-14 ${
                  isWorking
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-3xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className={`text-sm font-bold font-mono ${isWorking ? "text-white" : "text-slate-800"}`}>
                  {toBengaliNumber(dayNum)}
                </span>
                <span className={`text-[9px] font-medium mt-0.5 ${
                  isWorking 
                    ? "text-indigo-200 font-normal" 
                    : isWeekend 
                      ? "text-rose-500 font-extrabold" 
                      : "text-slate-400"
                }`}>
                  {dayName}
                </span>
                
                {/* Active check indicator */}
                {isWorking && (
                  <span className="absolute top-1 right-1 bg-white/20 rounded-full p-0.5">
                    <CheckCircle className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Help Summary */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-bold text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-150 gap-2 font-sans">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            নির্বাচিত মোট কর্মদিবস: <span className="text-indigo-600 text-xs font-bold font-mono">{toBengaliNumber(monthWorkingDays.length)} দিন</span>
          </span>
          <span>
            আজ পর্যন্ত অতিক্রান্ত কর্মদিবস: <span className="text-amber-600 text-xs font-bold font-mono">{toBengaliNumber(workingDates.length)} দিন</span>
          </span>
        </div>
      </div>

      {/* Info Notice about Kiosk Check-In Rules */}
      <div className="bg-rose-50/80 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 shadow-3xs">
        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-bold text-rose-800">বিশেষ নোটিশ ও সতর্কীকরণ</h4>
          <p className="text-xs text-rose-700 mt-1 font-medium leading-relaxed">
            দ্রুত হাজিরা কিওস্ক (Fast Check-in) অংশে আগমন এবং নির্গমন বাটন ব্যবহার না করা হলে অথবা হাজিরা খাতায় হাজিরা না থাকলে, শিক্ষকের বা কর্মচারীর সেই দিনটি <strong className="text-rose-900 font-extrabold">ছুটি (অনুপস্থিতি)</strong> হিসেবে গণ্য করা হবে।
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="নাম বা পদবী দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs transition-all"
          />
        </div>
        <div className="text-3xs text-slate-400 font-semibold uppercase tracking-wider">
          মোট শিক্ষক/কর্মচারী: {toBengaliNumber(filteredTeachers.length)} জন
        </div>
      </div>

      {/* Main List Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTeachers.map((teacher) => {
          // Find dates on which this teacher was present
          const presentDates = attendance
            .filter((r) => r.teacherId === teacher.id && r.date.startsWith(`2026-${String(selectedMonth).padStart(2, "0")}`))
            .map((r) => r.date);

          // Absent working days
          const absentWorkingDays = workingDates.filter((date) => !presentDates.includes(date));
          const totalAbsent = absentWorkingDays.length;
          const totalPresent = workingDates.length - totalAbsent;
          const isExpanded = expandedTeacherId === teacher.id;

          return (
            <div 
              key={teacher.id} 
              className={`bg-white rounded-2xl border transition-all duration-250 ${
                isExpanded 
                  ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" 
                  : "border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-xs"
              }`}
            >
              {/* Header card area */}
              <div 
                onClick={() => setExpandedTeacherId(isExpanded ? null : teacher.id)}
                className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 font-bold shrink-0">
                    <User className="w-6 h-6 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{teacher.name}</h3>
                    <p className="text-2xs text-indigo-600 font-bold mt-0.5">{teacher.blockName}</p>
                    <p className="text-3xs text-slate-400 font-medium mt-0.5 font-mono">{teacher.mobileNumber}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Stats Counter */}
                  <div className="flex items-center space-x-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                    <span className="text-3xs text-emerald-600 font-semibold">উপস্থিতি:</span>
                    <span className="text-xs font-bold text-emerald-700 font-mono">{toBengaliNumber(totalPresent)} দিন</span>
                  </div>

                  <div className="flex items-center space-x-1 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 animate-pulse">
                    <span className="text-3xs text-rose-600 font-semibold">ছুটি / অনুপস্থিতি:</span>
                    <span className="text-xs font-bold text-rose-700 font-mono">{toBengaliNumber(totalAbsent)} দিন</span>
                  </div>

                  {/* Expand arrow */}
                  <button className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors hidden md:block">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Area: Detailed Leave list for this teacher */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/40 p-5 rounded-b-2xl">
                  <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-slate-400" /> 
                    {activeMonthName} মাসের ছুটির বিস্তারিত বিবরণী ({toBengaliNumber(totalAbsent)} দিন)
                  </h4>

                  {totalAbsent === 0 ? (
                    <div className="bg-emerald-50/50 text-emerald-700 border border-emerald-100 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      অভিনন্দন! এই শিক্ষক/কর্মচারীর এই মাসে কোনো ছুটি বা অনুপস্থিতি নেই।
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {absentWorkingDays.map((dateStr) => {
                        const leaveKey = `${teacher.id}_${dateStr}`;
                        const currentLeaveType = customLeaveTypes[leaveKey] || "নৈমিত্তিক ছুটি (স্বয়ংক্রিয়)";

                        return (
                          <div 
                            key={dateStr}
                            className="bg-white border border-slate-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-3xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                              <span className="text-xs font-semibold text-slate-700">
                                {formatBengaliDateString(dateStr)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-3xs font-medium text-slate-400 flex items-center gap-1">
                                <Tag className="w-3 h-3 text-slate-400" /> ছুটির ধরন:
                              </span>
                              
                              <select
                                value={currentLeaveType}
                                onChange={(e) => saveCustomLeave(teacher.id, dateStr, e.target.value)}
                                className="px-2.5 py-1 border border-slate-200 rounded-lg text-3xs font-semibold text-slate-700 bg-slate-50 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="নৈমিত্তিক ছুটি (স্বয়ংক্রিয়)">নৈমিত্তিক ছুটি (স্বয়ংক্রিয়)</option>
                                <option value="অর্জিত ছুটি (Earned Leave)">অর্জিত ছুটি (Earned Leave)</option>
                                <option value="অসুস্থতাজনিত ছুটি (Sick Leave)">অসুস্থতাজনিত ছুটি (Sick Leave)</option>
                                <option value="বিনা বেতনে ছুটি (LWP)">বিনা বেতনে ছুটি (LWP)</option>
                                <option value="অনুমোদিত ছুটি (Approved Leave)">অনুমোদিত ছুটি (Approved Leave)</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 bg-slate-100/50 rounded-xl p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-4xs text-slate-400 font-semibold leading-relaxed">
                      দ্রুত হাজিরা কিওস্ক ব্যবহার না করার কারণে ছুটির তালিকায় কোনো ভুল থাকলে হাজিরা খাতা (Attendance Sheet) থেকে উক্ত তারিখের হাজিরা ম্যানুয়ালি যোগ বা সংশোধন করতে পারেন।
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTeachers.length === 0 && (
          <div className="bg-white py-12 rounded-2xl border border-slate-100 shadow-2xs text-center text-slate-400 font-medium">
            কোনো শিক্ষক বা কর্মচারী পাওয়া যায়নি!
          </div>
        )}
      </div>

    </div>
  );
}
