/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Teacher, AttendanceRecord } from "./types";

export const COLLEGE_DESIGNATIONS = [
  "অধ্যক্ষ",
  "উপাধ্যক্ষ",
  "সহকারী অধ্যাপক",
  "প্রভাষক",
  "প্রদর্শনকারী",
  "লাইব্রেরিয়ান",
  "ক্রিড়া শিক্ষক",
  "হিসাব রক্ষক",
  "অফিস সহকারী",
  "অফিস সহকারি কাম কম্পিউটার অপারেটর",
  "অফিস সহায়ক",
  "ল্যাব টেকনিশিান",
  "ল্যাব অপারেটর",
  "আয়া",
  "মালি",
  "ঝাড়ুদার",
  "নাইট গার্ড",
  "দপ্তরী"
];

export const INITIAL_TEACHERS: Teacher[] = [
  {
    id: "tch-1",
    name: "ড. রফিকুল ইসলাম",
    blockName: "সহকারী অধ্যাপক",
    mobileNumber: "01711223344",
    joiningDate: "2020-01-15",
    retirementDate: "2035-05-12",
    dateOfBirth: "1975-05-12"
  },
  {
    id: "tch-2",
    name: "শামীমা আক্তার",
    blockName: "প্রভাষক",
    mobileNumber: "01812233445",
    joiningDate: "2021-03-10",
    retirementDate: "2046-08-22",
    dateOfBirth: "1986-08-22"
  },
  {
    id: "tch-3",
    name: "মো: সাইফুল ইসলাম",
    blockName: "সহকারী অধ্যাপক",
    mobileNumber: "01913344556",
    joiningDate: "2019-11-01",
    retirementDate: "2032-12-05",
    dateOfBirth: "1972-12-05"
  },
  {
    id: "tch-4",
    name: "ফারহানা ইয়াসমিন",
    blockName: "প্রভাষক",
    mobileNumber: "01514455667",
    joiningDate: "2022-05-20",
    retirementDate: "2050-01-15",
    dateOfBirth: "1990-01-15"
  },
  {
    id: "tch-5",
    name: "আব্দুল আলিম",
    blockName: "প্রদর্শনকারী",
    mobileNumber: "01615566778",
    joiningDate: "2023-02-14",
    retirementDate: "2042-10-10",
    dateOfBirth: "1982-10-10"
  }
];

// Helper to calculate total hours between arrival (e.g. "09:00:00") and departure (e.g. "17:00:00")
export function calculateHours(arrivalStr: string | null, departureStr: string | null): number | null {
  if (!arrivalStr || !departureStr) return null;
  
  try {
    const arrTime = new Date(arrivalStr);
    const depTime = new Date(departureStr);
    
    if (isNaN(arrTime.getTime()) || isNaN(depTime.getTime())) {
      // If they are just time strings like "09:15:00"
      const [arrH, arrM, arrS] = arrivalStr.split(":").map(Number);
      const [depH, depM, depS] = departureStr.split(":").map(Number);
      
      const arrSec = arrH * 3600 + arrM * 60 + (arrS || 0);
      const depSec = depH * 3600 + depM * 60 + (depS || 0);
      
      if (depSec <= arrSec) return 0;
      return parseFloat(((depSec - arrSec) / 3600).toFixed(2));
    }
    
    const diffMs = depTime.getTime() - arrTime.getTime();
    if (diffMs <= 0) return 0;
    
    return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  } catch (e) {
    return null;
  }
}

// Generate some sample attendance records for June 2026 up to today (June 25, 2026)
export function generateInitialAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const year = 2026;
  const month = 6; // June
  
  // Let's seed data for dates: June 15, 16, 17, 18, 21, 22, 23, 24
  // We'll skip weekends (Fridays & Saturdays)
  const activeDates = [
    "2026-06-15",
    "2026-06-16",
    "2026-06-17",
    "2026-06-18",
    "2026-06-21",
    "2026-06-22",
    "2026-06-23",
    "2026-06-24",
    "2026-06-25" // Today
  ];

  let recordCounter = 1;

  activeDates.forEach((dateStr) => {
    INITIAL_TEACHERS.forEach((teacher, idx) => {
      // Occasional absence to show red status
      // Teacher 3 is absent on June 17, Teacher 1 is absent on June 22
      const isAbsent = (teacher.id === "tch-3" && dateStr === "2026-06-17") || 
                       (teacher.id === "tch-1" && dateStr === "2026-06-22") ||
                       (teacher.id === "tch-5" && dateStr === "2026-06-15");

      if (isAbsent) {
        // We can choose to either not have a record, or have a record with null values.
        // For our database, absence means no record, OR we can show "অনুপস্থিত" in the grid.
        // Let's not write arrival/departure for absent.
        return;
      }

      // Varying arrival and departure times
      // Arrival: 08:30:00 to 09:15:00
      // Departure: 16:30:00 to 17:15:00
      const arrivalMin = 30 + (idx * 5) + (parseInt(dateStr.slice(-1)) % 3) * 4; // 30, 35, 40 etc.
      const arrHour = arrivalMin >= 60 ? 9 : 8;
      const arrMin = arrivalMin % 60;
      
      const departureMin = 15 + (idx * 7) + (parseInt(dateStr.slice(-1)) % 4) * 5;
      const depHour = departureMin >= 60 ? 17 : 16;
      const depMin = departureMin % 60;

      const arrivalISO = `${dateStr}T0${arrHour}:${arrMin.toString().padStart(2, "0")}:12`;
      
      // For today (June 25, 2026), let's make it so some teachers haven't departed yet!
      // This makes the active booth simulation super realistic.
      // Teacher 1, 2, 3 have arrived and departed today.
      // Teacher 4 has arrived but not departed.
      // Teacher 5 hasn't arrived yet.
      const isToday = dateStr === "2026-06-25";
      
      let departureISO: string | null = `${dateStr}T${depHour}:${depMin.toString().padStart(2, "0")}:45`;
      
      if (isToday) {
        if (teacher.id === "tch-4") {
          departureISO = null; // Still in school!
        } else if (teacher.id === "tch-5") {
          // Hasn't checked in yet today
          return;
        }
      }

      records.push({
        id: `rec-${recordCounter++}`,
        teacherId: teacher.id,
        teacherName: teacher.name,
        blockName: teacher.blockName,
        date: dateStr,
        arrivalTime: arrivalISO,
        departureTime: departureISO,
        totalHours: calculateHours(arrivalISO, departureISO)
      });
    });
  });

  return records;
}
