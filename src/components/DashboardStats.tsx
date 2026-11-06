/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Users, LogIn, LogOut, Clock, UserX } from "lucide-react";
import { Teacher, AttendanceRecord } from "../types";

interface DashboardStatsProps {
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  selectedDate: string; // YYYY-MM-DD
}

export default function DashboardStats({ teachers, attendance, selectedDate }: DashboardStatsProps) {
  // Filter attendance for the selected date
  const todayRecords = attendance.filter((r) => r.date === selectedDate);
  
  const totalTeachers = teachers.length;
  const arrivedToday = todayRecords.filter((r) => r.arrivalTime !== null).length;
  const completedToday = todayRecords.filter((r) => r.arrivalTime !== null && r.departureTime !== null).length;
  const activeNow = todayRecords.filter((r) => r.arrivalTime !== null && r.departureTime === null).length;
  const absentToday = totalTeachers - arrivedToday;
  
  const attendanceRate = totalTeachers > 0 ? Math.round((arrivedToday / totalTeachers) * 100) : 0;

  return (
    <div id="dashboard-stats-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 no-print">
      {/* Card 1: Total Teachers */}
      <div id="stat-total-teachers" className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">মোট শিক্ষক</p>
          <h3 className="text-2xl font-bold text-slate-800 font-mono mt-0.5">{totalTeachers} জন</h3>
          <p className="text-2xs text-slate-400 mt-1">নিবন্ধিত সদস্য</p>
        </div>
      </div>

      {/* Card 2: Arrived Today */}
      <div id="stat-arrived-today" className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
          <LogIn className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">আজকে উপস্থিত</p>
          <h3 className="text-2xl font-bold text-emerald-600 font-mono mt-0.5">{arrivedToday} জন</h3>
          <p className="text-2xs text-emerald-600 font-medium mt-1">হার: {attendanceRate}%</p>
        </div>
      </div>

      {/* Card 3: Currently Active */}
      <div id="stat-active-now" className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">বর্তমানে কর্মরত</p>
          <h3 className="text-2xl font-bold text-sky-600 font-mono mt-0.5">{activeNow} জন</h3>
          <p className="text-2xs text-slate-400 mt-1">নির্গমন বাকি আছে</p>
        </div>
      </div>

      {/* Card 4: Departure Completed */}
      <div id="stat-completed-today" className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
          <LogOut className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">নির্গমন সম্পন্ন</p>
          <h3 className="text-2xl font-bold text-slate-700 font-mono mt-0.5">{completedToday} জন</h3>
          <p className="text-2xs text-slate-400 mt-1">আজকের ডিউটি শেষ</p>
        </div>
      </div>

      {/* Card 5: Absent Today */}
      <div id="stat-absent-today" className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 flex items-center space-x-4 hover:shadow-md transition-shadow duration-200">
        <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
          <UserX className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">অনুপস্থিত (আজকে)</p>
          <h3 className="text-2xl font-bold text-rose-600 font-mono mt-0.5">{absentToday} জন</h3>
          <p className="text-2xs text-slate-400 mt-1">এখনো আসেননি</p>
        </div>
      </div>
    </div>
  );
}
