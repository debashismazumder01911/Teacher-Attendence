/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Printer, Calendar, Award, Clock, Percent, FileSpreadsheet, UserCheck, Copy, ExternalLink, Check, AlertCircle, X } from "lucide-react";
import { Teacher, AttendanceRecord } from "../types";

interface MonthlyReportProps {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  customWorkingDays?: Record<string, string[]>;
}

export default function MonthlyReport({ teachers, attendance, customWorkingDays = {} }: MonthlyReportProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [startDay, setStartDay] = useState(1);
  const [endDay, setEndDay] = useState(new Date(currentYear, currentMonth, 0).getDate());

  const toBengaliNumber = (num: number | string): string => {
    const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .split("")
      .map((digit) => (digit >= "0" && digit <= "9" ? banglaDigits[parseInt(digit, 10)] : digit))
      .join("");
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

  const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Reset/Adjust days when month or year changes
  useEffect(() => {
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    setStartDay(1);
    setEndDay(lastDay);
  }, [selectedMonth, selectedYear]);

  // Helper to get default working days (Sunday to Thursday) in the selected month
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

  const d = new Date();
  const curY = d.getFullYear();
  const curM = d.getMonth() + 1;
  const todayStr = `${curY}-${String(curM).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const monthKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  const monthWorkingDays = customWorkingDays[monthKey] || getDefaultWorkingDays(selectedYear, selectedMonth);

  // Active working dates up to today
  const activeWorkingDates = monthWorkingDays.filter((date) => {
    // If selected month/year is in the past, show all working days
    const isPast = selectedYear < curY || (selectedYear === curY && selectedMonth < curM);
    if (isPast) return true;
    
    // If selected month/year is the current month, show up to today
    const isCurrent = selectedYear === curY && selectedMonth === curM;
    if (isCurrent) return date <= todayStr;
    
    // If selected month/year is in the future, show no working days yet
    return false;
  });

  // Filter active working dates to only within selected day range
  const activeWorkingDatesInRange = activeWorkingDates.filter((date) => {
    const dayNum = Number(date.split("-")[2]);
    return dayNum >= startDay && dayNum <= endDay;
  });

  const totalWorkingDays = activeWorkingDatesInRange.length || 1; // Fallback to 1 to prevent division by zero

  // Filter attendance records for the selected month, year, and day range
  const monthlyRecords = attendance.filter((r) => {
    try {
      const parts = r.date.split("-").map(Number);
      const y = parts[0];
      const m = parts[1];
      const d = parts[2];
      return y === selectedYear && m === selectedMonth && d >= startDay && d <= endDay;
    } catch (e) {
      // Fallback manual string parse in case of Safari ISO quirks
      const recDate = new Date(r.date);
      const y = recDate.getFullYear();
      const m = recDate.getMonth() + 1;
      const d = recDate.getDate();
      return y === selectedYear && m === selectedMonth && d >= startDay && d <= endDay;
    }
  });

  // Compile statistics for each teacher
  const reportData = teachers.map((teacher) => {
    const teacherRecords = monthlyRecords.filter((r) => r.teacherId === teacher.id);
    const presentDays = teacherRecords.filter((r) => r.arrivalTime !== null && activeWorkingDatesInRange.includes(r.date)).length;
    const absentDays = Math.max(0, totalWorkingDays - presentDays);
    const attendancePercentage = Math.round((presentDays / totalWorkingDays) * 100);

    // Calculate total and average working hours
    const totalHours = teacherRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const avgHours = presentDays > 0 ? parseFloat((totalHours / presentDays).toFixed(2)) : 0;

    return {
      id: teacher.id,
      name: teacher.name,
      blockName: teacher.blockName,
      mobileNumber: teacher.mobileNumber,
      presentDays,
      absentDays,
      attendancePercentage,
      totalHours: parseFloat(totalHours.toFixed(2)),
      avgHours,
    };
  });

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  const handlePrint = () => {
    if (isIframe) {
      setShowPrintModal(true);
    } else {
      try {
        window.focus();
        window.print();
      } catch (error) {
        console.error("Print failed:", error);
        setShowPrintModal(true);
      }
    }
  };

  const handleDownloadExcel = () => {
    try {
      const headers = [
        "ক্রমিক",
        "শিক্ষকের নাম",
        "পদবী",
        "উপস্থিতি (দিন)",
        "ছুটি (দিন)",
        "উপস্থিতির হার (%)",
        "মোট কর্মঘণ্টা",
        "গড় কর্মঘণ্টা/দিন"
      ];

      const csvRows = [headers.join(",")];

      reportData.forEach((row, idx) => {
        const cleanName = `"${row.name.replace(/"/g, '""')}"`;
        const cleanBlock = `"${row.blockName.replace(/"/g, '""')}"`;
        const presentText = `"${row.presentDays} দিন"`;
        const absentText = `"${row.absentDays} দিন"`;
        const percentageText = `"${row.attendancePercentage}%"`;
        const totalHoursText = `"${formatHoursAndMinutes(row.totalHours)}"`;
        const avgHoursText = `"${formatHoursAndMinutes(row.avgHours)}"`;

        const line = [
          idx + 1,
          cleanName,
          cleanBlock,
          presentText,
          absentText,
          percentageText,
          totalHoursText,
          avgHoursText
        ].join(",");
        csvRows.push(line);
      });

      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const filename = `মাসিক_প্রতিবেদন_${activeMonthName}_${selectedYear}.csv`;
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 3000);
    } catch (err) {
      console.error("Excel download failed:", err);
    }
  };

  const formatHoursAndMinutes = (hours: number | null): string => {
    if (hours === null || isNaN(hours)) return "---";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    const toBengali = (num: number): string => {
      const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
      return num
        .toString()
        .split("")
        .map((digit) => (digit >= "0" && digit <= "9" ? banglaDigits[parseInt(digit, 10)] : digit))
        .join("");
    };

    if (h === 0 && m === 0) {
      return "০ মিনিট";
    }
    
    let result = "";
    if (h > 0) {
      result += `${toBengali(h)} ঘণ্টা`;
    }
    if (m > 0) {
      result += `${h > 0 ? " " : ""}${toBengali(m)} মিনিট`;
    }
    return result;
  };

  const formatBengaliDateTime = (date: Date): string => {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    return `${dd}/${mm}/${yyyy} ${timeStr}`;
  };

  const activeMonthName = monthNames.find((m) => m.num === selectedMonth)?.name || "";

  // Aggregate stats for dashboard headers
  const totalWelfareHours = reportData.reduce((sum, t) => sum + t.totalHours, 0);
  const avgWelfareAttendance = Math.round(reportData.reduce((sum, t) => sum + t.attendancePercentage, 0) / (reportData.length || 1));

  return (
    <div id="monthly-report-root" className="space-y-6">
      {/* Filters and Actions */}
      <div id="report-control-panel" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 no-print">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 shrink-0">প্রতিবেদন নির্বাচন করুন:</span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Month selector */}
            <div className="relative w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="pl-9 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-xs bg-white font-medium appearance-none w-full sm:w-auto cursor-pointer"
              >
                {monthNames.map((m) => (
                  <option key={m.num} value={m.num}>
                    {m.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500"></div>
            </div>

            {/* Year selector */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="pl-3 pr-8 py-2 border border-slate-200 rounded-xl focus:outline-hidden text-xs bg-white font-mono font-medium appearance-none w-full sm:w-auto cursor-pointer"
              >
                {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <option key={y} value={y}>
                    {toBengaliNumber(y)}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none w-0 h-0 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-slate-500"></div>
            </div>
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="w-full sm:w-auto px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600 font-bold">ডাউনলোড হয়েছে!</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <span>এক্সেল এ ডাউনলোড করুন</span>
              </>
            )}
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs cursor-pointer active:scale-98 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>রিপোর্ট প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Aggregate Stats (Web Only) */}
      <div id="report-summary-widgets" className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div className="bg-gradient-to-br from-emerald-550 to-emerald-600 p-5 rounded-2xl text-white shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-semibold text-emerald-100 uppercase tracking-wider">মাসিক গড় উপস্থিতি</p>
              <h3 className="text-3xl font-bold font-mono mt-1">{avgWelfareAttendance}%</h3>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Percent className="w-5 h-5 text-emerald-50" />
            </div>
          </div>
          <p className="text-3xs text-emerald-100 mt-2">মোট {totalWorkingDays}টি কার্যদিবসের ভিত্তিতে</p>
        </div>

        <div className="bg-gradient-to-br from-indigo-550 to-indigo-600 p-5 rounded-2xl text-white shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-semibold text-indigo-100 uppercase tracking-wider">মোট সমিতির কর্মঘণ্টা</p>
              <h3 className="text-3xl font-bold font-mono mt-1">{formatHoursAndMinutes(totalWelfareHours)}</h3>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Clock className="w-5 h-5 text-indigo-50" />
            </div>
          </div>
          <p className="text-3xs text-indigo-100 mt-2">সকল শিক্ষকের সামগ্রিক অর্জিত ঘণ্টা</p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 to-slate-850 p-5 rounded-2xl text-white shadow-xs">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xs font-semibold text-slate-200 uppercase tracking-wider">বিশ্লেষিত কার্যদিবস</p>
              <h3 className="text-3xl font-bold font-mono mt-1">{totalWorkingDays} দিন</h3>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileSpreadsheet className="w-5 h-5 text-slate-100" />
            </div>
          </div>
          <p className="text-3xs text-slate-300 mt-2">
            {activeMonthName} {toBengaliNumber(selectedYear)}-এর মোট হাজিরা ডেটা
          </p>
        </div>
      </div>

      {/* Report Sheet Block */}
      <div id="monthly-report-sheet" className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 print-card">
        {/* Printable Header (Visible on print, neat on web) */}
        <div className="text-center space-y-2 mb-6 border-b border-slate-200 pb-5">
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 font-sans">রংপুর কলেজ</h1>
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Rangpur College</p>
          <div className="h-0.5 w-16 bg-indigo-500 mx-auto my-1"></div>
          <h2 className="text-md md:text-lg font-bold text-slate-700 mt-2">
            মাসিক হাজিরা এবং কর্মঘণ্টা প্রতিবেদন ({activeMonthName} - {toBengaliNumber(selectedYear)})
          </h2>
          <div className="flex flex-wrap justify-center gap-x-6 text-slate-400 text-3xs font-medium pt-1 font-mono">
            <span>প্রতিবেদন তৈরির সময়: {formatBengaliDateTime(new Date())}</span>
            <span>মোট কার্যদিবস: {totalWorkingDays} দিন</span>
            <span>নিবন্ধিত শিক্ষক: {teachers.length} জন</span>
          </div>
        </div>

        {/* Report Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                <th className="px-4 py-3 text-center w-12 border-b">ক্রমিক</th>
                <th className="px-4 py-3 border-b">শিক্ষকের নাম</th>
                <th className="px-4 py-3 border-b">পদবী</th>
                <th className="px-4 py-3 border-b text-center">উপস্থিতি (দিন)</th>
                <th className="px-4 py-3 border-b text-center">ছুটি (দিন)</th>
                <th className="px-4 py-3 border-b text-center">উপস্থিতির হার (%)</th>
                <th className="px-4 py-3 border-b text-right">মোট কর্মঘণ্টা</th>
                <th className="px-4 py-3 border-b text-right">গড় কর্মঘণ্টা/দিন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
              {reportData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-slate-55/30 transition-colors">
                  {/* Sl No */}
                  <td className="px-4 py-3.5 text-center text-slate-400 font-mono font-medium">
                    {idx + 1}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3.5 font-bold text-slate-800">
                    {row.name}
                    <p className="text-3xs text-slate-400 font-mono font-normal mt-0.5">{row.mobileNumber}</p>
                  </td>

                  {/* Block */}
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    {row.blockName}
                  </td>

                  {/* Present Days */}
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-emerald-600">
                    {row.presentDays} দিন
                  </td>

                  {/* Absent Days */}
                  <td className={`px-4 py-3.5 text-center font-mono font-semibold ${row.absentDays > 0 ? "text-rose-600" : "text-slate-400"}`}>
                    {row.absentDays} দিন
                  </td>

                  {/* Percentage */}
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className={`font-mono font-bold ${row.attendancePercentage >= 80 ? "text-emerald-600" : row.attendancePercentage >= 50 ? "text-indigo-600" : "text-rose-600"}`}>
                        {row.attendancePercentage}%
                      </span>
                    </div>
                  </td>

                  {/* Total Hours */}
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-indigo-600">
                    {formatHoursAndMinutes(row.totalHours)}
                  </td>

                  {/* Avg Hours */}
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-500">
                    {formatHoursAndMinutes(row.avgHours)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signature Section (Only Visible on Print) */}
        <div className="hidden print-only mt-24 grid grid-cols-2 gap-12 text-center text-xs font-semibold text-slate-700">
          <div>
            <div className="border-t border-slate-300 w-44 mx-auto pt-2"></div>
            <p className="text-slate-550 font-medium">হাজিরা ইনচার্জ স্বাক্ষর</p>
            <p className="text-3xs text-slate-400 font-normal font-mono mt-0.5">তারিখ: ............................</p>
          </div>
          <div>
            <div className="border-t border-slate-300 w-44 mx-auto pt-2"></div>
            <p className="text-slate-550 font-medium">সভাপতি / সাধারণ সম্পাদক স্বাক্ষর</p>
            <p className="text-3xs text-slate-400 font-normal font-mono mt-0.5">রংপুর কলেজ</p>
          </div>
        </div>
      </div>

      {/* Print Help Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-3 mb-4">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">প্রিন্ট ও ব্যাকআপ নির্দেশিকা (রংপুর কলেজ)</h3>
                <p className="text-3xs text-slate-400 mt-0.5">আইফ্রেম সিকিউরিটি ও ব্রাউজার সীমাবদ্ধতার সমাধান</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-3xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>ব্রাউজারের নিরাপত্তা নিয়মের কারণে সরাসরি এডিটরের (iframe) ভেতর থেকে প্রিন্ট ডায়ালগ চালু হতে বাধা পেতে পারে।</span>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-700">ধাপ ১: নতুন ট্যাবে ওপেন করুন (সুপারিশকৃত)</p>
                <div className="pl-4 border-l-2 border-indigo-500 py-0.5 text-3xs text-slate-500 space-y-1">
                  <p>১. স্ক্রিনের একেবারে উপরে ডানদিকের কোণায় তাকান।</p>
                  <p>২. সেখানে **'Open in new tab'** লেখা সম্বলিত তীরের মতো আইকনটিতে ক্লিক করুন।</p>
                  <p>৩. নতুন ট্যাবে ওপেন হওয়ার পর 'রিপোর্ট' ট্যাবে গিয়ে **'রিপোর্ট প্রিন্ট করুন'** বাটনটি চাপুন।</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-700">ধাপ ২: এক্সেল (Excel) ফাইল ডাউনলোড করুন</p>
                <p className="text-3xs text-slate-500 pl-4">আপনি সরাসরি এক্সেল (.csv) ফাইল ডাউনলোড করে ব্যাকআপ সংরক্ষণ করতে পারেন।</p>
                <button
                  onClick={handleDownloadExcel}
                  className={`w-full py-2 px-4 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all border ${
                    copiedSuccess 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">এক্সেল ফাইল ডাউনলোড সফল হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                      <span>এক্সেল ফাইল ডাউনলোড করুন</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => {
                    try {
                      window.focus();
                      window.print();
                    } catch (e) {
                      console.error("Direct print failed inside modal too", e);
                    }
                  }}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold text-center text-3xs transition-colors"
                >
                  সরাসরি প্রিন্ট চেষ্টা করুন
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-center text-3xs transition-colors"
                >
                  বুঝেছি, বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
