import { useEffect, useState } from "react";
import { studentAPI } from "@/api/client";
import type { Student } from "@/types";
import { GraduationCap, MessageCircle } from "lucide-react";

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    studentAPI.list().then((res) => setStudents(res.data as Student[]));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Students</h1>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
            <tr>
              {["Name", "Email", "Class", "Roll No.", "Parent WhatsApp", "Shift"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {students.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                    </div>
                    {s.user.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.user.email}</td>
                <td className="px-4 py-3">{s.class.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.rollNumber ?? "—"}</td>
                <td className="px-4 py-3">
                  {s.parentWhatsapp ? (
                    <div className="flex items-center gap-1.5 text-green-600">
                      <MessageCircle className="w-4 h-4" />
                      {s.parentWhatsapp}
                    </div>
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.class.shift === "MORNING" ? "bg-amber-50 text-amber-700" :
                    s.class.shift === "AFTERNOON" ? "bg-blue-50 text-blue-700" :
                    "bg-violet-50 text-violet-700"
                  }`}>
                    {s.class.shift}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && (
          <div className="text-center py-12 text-gray-400">No students found</div>
        )}
      </div>
    </div>
  );
}
