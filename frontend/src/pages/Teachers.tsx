import { useEffect, useState } from "react";
import { teacherAPI } from "@/api/client";
import type { Teacher } from "@/types";
import { User, Clock } from "lucide-react";

const DAYS = ["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"] as const;

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    teacherAPI.list().then((res) => setTeachers(res.data as Teacher[]));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Teachers</h1>

      <div className="grid gap-4">
        {teachers.map((t) => (
          <div
            key={t.id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{t.user.name}</div>
                <div className="text-sm text-gray-500">{t.user.email}</div>
                {t.employeeId && (
                  <div className="text-xs text-gray-400 mt-0.5">ID: {t.employeeId}</div>
                )}

                {/* Subjects taught */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {t.teacherSubjects.map((ts) => (
                    <span
                      key={ts.subjectId + ts.classId}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: ts.subject.color + "22",
                        color: ts.subject.color,
                        border: `1px solid ${ts.subject.color}44`,
                      }}
                    >
                      {ts.subject.name}
                    </span>
                  ))}
                </div>

                {/* Availability */}
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1">
                    {t.availability.length === 0 && <span>No availability set</span>}
                    {t.availability.map((a, i) => (
                      <span key={i} className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                        {a.day.slice(0, 3)} {a.startTime}–{a.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {teachers.length === 0 && (
          <div className="text-center py-12 text-gray-400">No teachers found</div>
        )}
      </div>
    </div>
  );
}
