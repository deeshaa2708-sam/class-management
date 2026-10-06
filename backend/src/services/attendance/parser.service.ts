/**
 * Attendance sheet parser.
 *
 * Expected Excel layout (row 1 = headers):
 *   Roll Number | Student Name | Present (TRUE/FALSE or 1/0 or P/A)
 *
 * Returns an array of { rollNumber, studentName, present } objects.
 */

import * as XLSX from "xlsx";
import fs from "fs";

export interface AttendanceRow {
  rollNumber: string;
  studentName: string;
  present: boolean;
}

export function parseAttendanceSheet(filePath: string): AttendanceRow[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows.map((row, i) => {
    // Normalise column names (case-insensitive, ignore spaces/underscores)
    const normalise = (k: string) => k.toLowerCase().replace(/[\s_]/g, "");
    const get = (patterns: string[]): string => {
      for (const [k, v] of Object.entries(row)) {
        if (patterns.includes(normalise(k))) return String(v ?? "").trim();
      }
      return "";
    };

    const rollNumber = get(["rollnumber", "roll", "rollno", "id"]);
    const studentName = get(["studentname", "name", "student"]);
    const presentRaw = get(["present", "attendance", "status"]);

    if (!rollNumber && !studentName) {
      throw new Error(`Row ${i + 2}: missing roll number and student name`);
    }

    const present = ["true", "1", "p", "present", "yes"].includes(
      presentRaw.toLowerCase()
    );

    return { rollNumber, studentName, present };
  });
}
