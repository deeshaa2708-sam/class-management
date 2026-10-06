import { useState, useRef } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/common/Button";
import { attendanceAPI } from "@/api/client";
import { useDispatch } from "react-redux";
import { addToast } from "@/store/uiSlice";
import type { ClassBatch, Subject } from "@/types";

interface Props {
  classes: ClassBatch[];
  subjects: Subject[];
}

export function AttendanceUpload({ classes, subjects }: Props) {
  const dispatch = useDispatch();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !classId || !subjectId) return;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("classId", classId);
    fd.append("subjectId", subjectId);
    fd.append("date", date);

    setLoading(true);
    try {
      const res = await attendanceAPI.upload(fd);
      const { recorded, notifications } = res.data as {
        recorded: number;
        absentees: number;
        notifications: { sent: number; failed: number };
      };
      dispatch(
        addToast({
          type: "success",
          message: `Recorded ${recorded} students. WhatsApp: ${notifications.sent} sent, ${notifications.failed} failed.`,
        })
      );
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Upload failed";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* File drop zone */}
      <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 cursor-pointer hover:border-brand-400 transition-colors">
        <FileSpreadsheet className="w-10 h-10 text-gray-400" />
        <span className="text-sm text-gray-500">
          {file ? file.name : "Click to select Excel / CSV attendance sheet"}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Class</label>
          <select
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Subject</label>
          <select
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
          >
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Date</label>
          <input
            type="date"
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" loading={loading} disabled={!file}>
        <Upload className="w-4 h-4" />
        Upload & Send Notifications
      </Button>
    </form>
  );
}
