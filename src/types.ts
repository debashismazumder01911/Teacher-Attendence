/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Teacher {
  id: string;
  name: string;
  blockName: string;
  mobileNumber: string;
  joiningDate: string;
  retirementDate?: string;
  dateOfBirth?: string;
}

export interface AttendanceRecord {
  id: string;
  teacherId: string;
  teacherName: string;
  blockName: string;
  date: string; // YYYY-MM-DD
  arrivalTime: string | null; // ISO string or HH:MM:SS format
  departureTime: string | null; // ISO string or HH:MM:SS format
  totalHours: number | null; // working hours calculated as (departureTime - arrivalTime) in decimal hours
  lateReason?: string; // Reason for late arrival (after 10:30 AM)
  earlyDepartureReason?: string; // Reason for early departure (before 01:00 PM)
}
