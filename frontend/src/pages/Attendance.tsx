import { useEffect, useState } from "react";
import { AttendanceUpload } from "@/components/Attendance/AttendanceUpload";
import { NotificationLogTable } from "@/components/Attendance/NotificationLog";
import { instituteAPI } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import type { ClassBatch, Subject } from "@/types";

export function AttendancePage() {
  const { isAdmin, isTeacher } = useAuth();
  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tab, setTab] = useState<"upload" | "logs">("upload");

  useEffect(() => {
    Promise.all([
      instituteAPI.listClasses(),
      instituteAPI.listSubjects(),
    ]).then(([c, s]) => {
      setClasses(c.data as ClassBatch[]);
      setSubjects(s.data as Subject[]);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Attendance</h1>

      {(isAdmin || isTeacher) && (
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
          {(["upload", "logs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? "border-brand-600 text-brand-700 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "upload" ? "Upload Sheet" : "Notification Log"}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        {tab === "upload" ? (
          <>
            <h2 className="font-semibold mb-4">Upload Attendance Sheet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload an Excel or CSV file. The system will parse it, record attendance, and
              automatically send WhatsApp notifications to absent students' parents.
            </p>
            <AttendanceUpload classes={classes} subjects={subjects} />
          </>
        ) : (
          <>
            <h2 className="font-semibold mb-4">WhatsApp Notification Delivery Log</h2>
            <NotificationLogTable />
          </>
        )}
      </div>
    </div>
  );
}
