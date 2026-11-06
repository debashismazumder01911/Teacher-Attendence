/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  BookOpen, 
  CalendarCheck, 
  TrendingUp, 
  FileSpreadsheet, 
  Clock, 
  HelpCircle,
  Menu,
  X,
  UserCheck,
  Calendar
} from "lucide-react";

import { Teacher, AttendanceRecord } from "./types";
import { INITIAL_TEACHERS, generateInitialAttendance, calculateHours } from "./initialData";

// Firebase imports
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  query,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "./lib/firebase";

// Components
import DashboardStats from "./components/DashboardStats";
import AttendanceBooth from "./components/AttendanceBooth";
import AttendanceSheet from "./components/AttendanceSheet";
import TeacherManagement from "./components/TeacherManagement";
import MonthlyReport from "./components/MonthlyReport";
import LeaveManagement from "./components/LeaveManagement";

export default function App() {
  // ----------------------------------------------------
  // Persistent State Setup
  // ----------------------------------------------------
  // ----------------------------------------------------
  // Persistent State Setup (Syncing with Firebase Firestore)
  // ----------------------------------------------------
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [customWorkingDays, setCustomWorkingDays] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Set default selected date dynamically to today's date
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"BOOTH" | "SHEET" | "TEACHERS" | "REPORT" | "LEAVES">("BOOTH");
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 1. One-time seeding check & automatic migration from LocalStorage
  useEffect(() => {
    const checkAndSeed = async () => {
      try {
        // 1a. One-time cleanup of old attendance records before 2026-07-19
        const cleanupRef = doc(db, "settings", "cleanup_pre_july19");
        const cleanupSnap = await getDoc(cleanupRef);
        if (!cleanupSnap.exists() || !cleanupSnap.data()?.completed) {
          console.log("Cleaning up attendance records prior to 2026-07-19...");
          const q = query(collection(db, "attendance"), where("date", "<", "2026-07-19"));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const batch = writeBatch(db);
            snap.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`Deleted ${snap.size} attendance records prior to 2026-07-19.`);
          }
          await setDoc(cleanupRef, { completed: true });
        }

        const settingsRef = doc(db, "settings", "initial_seeding");
        const settingsSnap = await getDoc(settingsRef);
        
        let shouldSeed = !settingsSnap.exists() || !settingsSnap.data()?.seeded;

        // Check if there is local storage data to migrate
        const savedTeachersStr = localStorage.getItem("tams_teachers");
        const savedAttendanceStr = localStorage.getItem("tams_attendance");
        const alreadyMigrated = localStorage.getItem("tams_migrated_to_firebase") === "true";

        if (savedTeachersStr && !alreadyMigrated) {
          console.log("Found local storage teachers, migrating to Firestore...");
          try {
            const savedTeachers = JSON.parse(savedTeachersStr) as Teacher[];
            if (savedTeachers.length > 0) {
              const allWrites: { ref: any, data: any }[] = [];
              
              savedTeachers.forEach((teacher) => {
                allWrites.push({
                  ref: doc(db, "teachers", teacher.id),
                  data: teacher
                });
              });
              
              if (savedAttendanceStr) {
                const savedAttendance = JSON.parse(savedAttendanceStr) as AttendanceRecord[];
                savedAttendance.forEach((rec) => {
                  allWrites.push({
                    ref: doc(db, "attendance", rec.id),
                    data: rec
                  });
                });
              }
              
              const savedWorkingDaysStr = localStorage.getItem("tams_working_days");
              if (savedWorkingDaysStr) {
                const savedWorkingDays = JSON.parse(savedWorkingDaysStr) as Record<string, string[]>;
                Object.entries(savedWorkingDays).forEach(([monthKey, days]) => {
                  allWrites.push({
                    ref: doc(db, "customWorkingDays", monthKey),
                    data: { days }
                  });
                });
              }
              
              // Commit in chunks of 200 to stay well under the 500-write batch limit
              const chunkSize = 200;
              for (let i = 0; i < allWrites.length; i += chunkSize) {
                const chunk = allWrites.slice(i, i + chunkSize);
                const batch = writeBatch(db);
                chunk.forEach((item) => {
                  batch.set(item.ref, item.data);
                });
                await batch.commit();
              }
              
              localStorage.setItem("tams_migrated_to_firebase", "true");
              console.log(`Successfully migrated ${savedTeachers.length} teachers and records to Firestore!`);
              // Since we successfully migrated, we don't need to seed standard defaults
              shouldSeed = false;
              
              // Ensure settings is set as seeded
              const batch = writeBatch(db);
              batch.set(settingsRef, { seeded: true });
              await batch.commit();
            }
          } catch (e) {
            console.error("Error migrating local storage data to Firestore:", e);
          }
        }

        if (shouldSeed) {
          console.log("Seeding database for the first time...");
          const batch = writeBatch(db);

          // Seed teachers
          INITIAL_TEACHERS.forEach((teacher) => {
            const tRef = doc(db, "teachers", teacher.id);
            batch.set(tRef, teacher);
          });

          // Seed attendance
          const initialLogs = generateInitialAttendance();
          initialLogs.forEach((rec) => {
            const rRef = doc(db, "attendance", rec.id);
            batch.set(rRef, rec);
          });

          // Set seeded = true
          batch.set(settingsRef, { seeded: true });

          await batch.commit();
          console.log("Database seeded successfully!");
        }
      } catch (err) {
        console.error("Error checking or seeding database:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAndSeed();
  }, []);

  // 2. Real-time subscriptions to Firestore
  useEffect(() => {
    // Subscribe to teachers
    const unsubscribeTeachers = onSnapshot(collection(db, "teachers"), (snapshot) => {
      const teacherList: Teacher[] = [];
      snapshot.forEach((doc) => {
        teacherList.push(doc.data() as Teacher);
      });
      setTeachers(teacherList);
    });

    // Subscribe to attendance
    const unsubscribeAttendance = onSnapshot(collection(db, "attendance"), (snapshot) => {
      const attendanceList: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        attendanceList.push(doc.data() as AttendanceRecord);
      });
      setAttendance(attendanceList);
    });

    // Subscribe to customWorkingDays
    const unsubscribeWorkingDays = onSnapshot(collection(db, "customWorkingDays"), (snapshot) => {
      const workingDays: Record<string, string[]> = {};
      snapshot.forEach((doc) => {
        workingDays[doc.id] = doc.data().days || [];
      });
      setCustomWorkingDays(workingDays);
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeAttendance();
      unsubscribeWorkingDays();
    };
  }, []);

  // 3. Teacher Action Handlers
  const handleAddTeacher = async (newTeacherData: Omit<Teacher, "id">) => {
    try {
      const newId = `tch-${Date.now()}`;
      const newTeacher: Teacher = {
        id: newId,
        ...newTeacherData
      };
      await setDoc(doc(db, "teachers", newId), newTeacher);
    } catch (err) {
      console.error("Error adding teacher:", err);
    }
  };

  const handleUpdateTeacher = async (updatedTeacher: Teacher) => {
    try {
      // 1. Update teacher document
      await setDoc(doc(db, "teachers", updatedTeacher.id), updatedTeacher);
      
      // 2. Update cached names/blocks in attendance records matching this teacherId
      const q = query(collection(db, "attendance"), where("teacherId", "==", updatedTeacher.id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.update(d.ref, {
          teacherName: updatedTeacher.name,
          blockName: updatedTeacher.blockName
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error updating teacher:", err);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      // 1. Delete teacher
      await deleteDoc(doc(db, "teachers", id));
      
      // 2. Clear associated attendance records
      const q = query(collection(db, "attendance"), where("teacherId", "==", id));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => {
        batch.delete(d.ref);
      });
      await batch.commit();
    } catch (err) {
      console.error("Error deleting teacher:", err);
    }
  };

  const handleClearAllTeachers = async () => {
    try {
      const teachersSnap = await getDocs(collection(db, "teachers"));
      const attendanceSnap = await getDocs(collection(db, "attendance"));
      const batch = writeBatch(db);
      teachersSnap.forEach((d) => batch.delete(d.ref));
      attendanceSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (err) {
      console.error("Error clearing all teachers:", err);
    }
  };

  // 4. Attendance Action Handlers
  const handleRecordArrival = async (teacherId: string, lateReason?: string) => {
    try {
      const teacher = teachers.find((t) => t.id === teacherId);
      if (!teacher) return;

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const arrivalTimeISO = `${selectedDate}T${timeStr}`;

      const newId = `rec-${Date.now()}`;
      const newRecord: AttendanceRecord = {
        id: newId,
        teacherId,
        teacherName: teacher.name,
        blockName: teacher.blockName,
        date: selectedDate,
        arrivalTime: arrivalTimeISO,
        departureTime: null,
        totalHours: null,
        lateReason: lateReason || undefined
      };

      const cleanRecord = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, "attendance", newId), cleanRecord);
    } catch (err) {
      console.error("Error recording arrival:", err);
    }
  };

  const handleRecordDeparture = async (teacherId: string, earlyDepartureReason?: string) => {
    try {
      const record = attendance.find((r) => r.teacherId === teacherId && r.date === selectedDate);
      if (!record) return;

      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const departureTimeISO = `${selectedDate}T${timeStr}`;

      const totalHours = calculateHours(record.arrivalTime, departureTimeISO);

      const updatedRecord: AttendanceRecord = {
        ...record,
        departureTime: departureTimeISO,
        totalHours,
        earlyDepartureReason: earlyDepartureReason || undefined
      };

      const cleanRecord = JSON.parse(JSON.stringify(updatedRecord));
      await setDoc(doc(db, "attendance", record.id), cleanRecord);
    } catch (err) {
      console.error("Error recording departure:", err);
    }
  };

  const handleBulkRecordAttendance = async (arrivalHHMM?: string, departureHHMM?: string, targetDate?: string) => {
    try {
      const recordDate = targetDate || selectedDate;
      const batch = writeBatch(db);

      for (const teacher of teachers) {
        const existingRecord = attendance.find(
          (r) => r.teacherId === teacher.id && r.date === recordDate
        );

        const recordId = existingRecord ? existingRecord.id : `rec-${teacher.id}-${recordDate}`;

        let arrivalTimeISO = existingRecord?.arrivalTime || null;
        let departureTimeISO = existingRecord?.departureTime || null;

        if (arrivalHHMM && arrivalHHMM.trim() !== "") {
          arrivalTimeISO = `${recordDate}T${arrivalHHMM}:00`;
        }

        if (departureHHMM && departureHHMM.trim() !== "") {
          departureTimeISO = `${recordDate}T${departureHHMM}:00`;
        }

        let totalHours: number | null = existingRecord?.totalHours || null;
        if (arrivalTimeISO && departureTimeISO) {
          totalHours = calculateHours(arrivalTimeISO, departureTimeISO);
        }

        const updatedRecord: AttendanceRecord = {
          id: recordId,
          teacherId: teacher.id,
          teacherName: teacher.name,
          blockName: teacher.blockName,
          date: recordDate,
          arrivalTime: arrivalTimeISO,
          departureTime: departureTimeISO,
          totalHours: totalHours,
          lateReason: existingRecord?.lateReason,
          earlyDepartureReason: existingRecord?.earlyDepartureReason
        };

        const cleanRecord = JSON.parse(JSON.stringify(updatedRecord));
        batch.set(doc(db, "attendance", recordId), cleanRecord);
      }

      await batch.commit();
    } catch (err) {
      console.error("Error setting bulk attendance:", err);
    }
  };

  const handleAddAttendanceManual = async (manualRecord: Omit<AttendanceRecord, "id" | "totalHours">) => {
    try {
      const totalHours = calculateHours(manualRecord.arrivalTime, manualRecord.departureTime);
      const newId = `rec-${Date.now()}`;
      const newRecord: AttendanceRecord = {
        id: newId,
        ...manualRecord,
        totalHours
      };

      const cleanRecord = JSON.parse(JSON.stringify(newRecord));
      await setDoc(doc(db, "attendance", newId), cleanRecord);
    } catch (err) {
      console.error("Error adding attendance manually:", err);
    }
  };

  const handleDeleteAttendance = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, "attendance", recordId));
    } catch (err) {
      console.error("Error deleting attendance:", err);
    }
  };

  const handleUpdateAttendance = async (updatedRecord: AttendanceRecord) => {
    try {
      const cleanRecord = JSON.parse(JSON.stringify(updatedRecord));
      await setDoc(doc(db, "attendance", updatedRecord.id), cleanRecord);
    } catch (err) {
      console.error("Error updating attendance:", err);
    }
  };

  const saveWorkingDaysState = async (updatedWorkingDays: Record<string, string[]>) => {
    try {
      for (const [monthKey, days] of Object.entries(updatedWorkingDays)) {
        await setDoc(doc(db, "customWorkingDays", monthKey), { days });
      }
    } catch (err) {
      console.error("Error updating custom working days:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full text-center space-y-6">
          <div className="relative flex justify-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 animate-pulse">
              <CalendarCheck className="w-8 h-8" />
            </div>
            <div className="absolute top-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-2xl animate-spin"></div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">রংপুর কলেজ</h3>
            <p className="text-2xs text-slate-400 font-semibold mt-1 tracking-wider uppercase">ডিজিটাল শিক্ষক হাজিরা সিস্টেম</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">ক্লাউড ডাটাবেসের সাথে সংযুক্ত হচ্ছে...</p>
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full w-1/2 rounded-full animate-[loading_1.5s_infinite_ease-in-out]"></div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div id="tams-app-viewport" className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* HEADER / NAVIGATION BAR (Web Only) */}
      <header id="app-header" className="bg-white border-b border-slate-100 sticky top-0 z-30 no-print shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-bold text-slate-800 tracking-tight">রংপুর কলেজ</span>
                <span className="text-4xs font-bold text-white px-1.5 py-0.5 bg-emerald-500 rounded-full uppercase">Digital</span>
              </div>
              <p className="text-3xs text-slate-400 font-semibold tracking-wider">Teacher Attendance System</p>
            </div>
          </div>

          {/* Desktop Navigation Link Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => {
                setSelectedDate(getTodayDateString());
                setActiveTab("BOOTH");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "BOOTH" 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>আজকের হাজিরা</span>
            </button>

            <button
              onClick={() => {
                setSelectedDate(getTodayDateString());
                setActiveTab("SHEET");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "SHEET" 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>হাজিরা খাতা</span>
            </button>

            <button
              onClick={() => setActiveTab("TEACHERS")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "TEACHERS" 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>শিক্ষক তালিকা</span>
            </button>

            <button
              onClick={() => setActiveTab("REPORT")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "REPORT" 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>রিপোর্ট</span>
            </button>

            <button
              onClick={() => setActiveTab("LEAVES")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                activeTab === "LEAVES" 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>ছুটি ও অনুপস্থিতি</span>
            </button>
          </nav>

          {/* Mobile Hamburguer Menu trigger */}
          <div className="md:hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 focus:outline-hidden"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed right-0 top-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className="font-bold text-slate-800">মেনুবার</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <button
              onClick={() => { setSelectedDate(getTodayDateString()); setActiveTab("BOOTH"); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 ${
                activeTab === "BOOTH" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>আজকের হাজিরা</span>
            </button>

            <button
              onClick={() => { setSelectedDate(getTodayDateString()); setActiveTab("SHEET"); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 ${
                activeTab === "SHEET" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>হাজিরা খাতা</span>
            </button>

            <button
              onClick={() => { setActiveTab("TEACHERS"); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 ${
                activeTab === "TEACHERS" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>শিক্ষক তালিকা</span>
            </button>

            <button
              onClick={() => { setActiveTab("REPORT"); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 ${
                activeTab === "REPORT" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>রিপোর্ট</span>
            </button>

            <button
              onClick={() => { setActiveTab("LEAVES"); setSidebarOpen(false); }}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center space-x-2.5 ${
                activeTab === "LEAVES" ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>ছুটি ও অনুপস্থিতি</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main id="app-main" className={`flex-1 mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${activeTab === "TEACHERS" ? "max-w-[1500px]" : "max-w-7xl"}`}>
        
        {/* Dynamic Interactive Stats Header (Hidden on print) */}
        <DashboardStats 
          teachers={teachers} 
          attendance={attendance} 
          selectedDate={selectedDate} 
        />

        {/* Tab Panel Render with Staggered Slide-In Animations */}
        <div id="tab-viewport-wrapper">
          {activeTab === "BOOTH" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AttendanceBooth
                teachers={teachers}
                attendance={attendance}
                selectedDate={selectedDate}
                onRecordArrival={handleRecordArrival}
                onRecordDeparture={handleRecordDeparture}
                onBulkRecordAttendance={handleBulkRecordAttendance}
              />
            </motion.div>
          )}

          {activeTab === "SHEET" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AttendanceSheet
                teachers={teachers}
                attendance={attendance}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onAddAttendanceManual={handleAddAttendanceManual}
                onDeleteAttendance={handleDeleteAttendance}
                onUpdateAttendance={handleUpdateAttendance}
              />
            </motion.div>
          )}

          {activeTab === "TEACHERS" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <TeacherManagement
                teachers={teachers}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onClearAllTeachers={handleClearAllTeachers}
              />
            </motion.div>
          )}

          {activeTab === "REPORT" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <MonthlyReport
                teachers={teachers}
                attendance={attendance}
                customWorkingDays={customWorkingDays}
              />
            </motion.div>
          )}

          {activeTab === "LEAVES" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <LeaveManagement
                teachers={teachers}
                attendance={attendance}
                customWorkingDays={customWorkingDays}
                onUpdateWorkingDays={saveWorkingDaysState}
              />
            </motion.div>
          )}

        </div>
      </main>

      {/* FOOTER (Web Only) */}
      <footer id="app-footer" className="bg-white border-t border-slate-150 py-5 mt-12 text-center text-3xs font-medium text-slate-400 no-print">
        <p>© {new Date().getFullYear()} রংপুর কলেজ। সর্বস্বত্ব সংরক্ষিত।</p>
        <p className="mt-1 font-mono text-4xs uppercase tracking-wider text-slate-350">Digital Attendance & Report Core v1.2</p>
      </footer>
    </div>
  );
}
