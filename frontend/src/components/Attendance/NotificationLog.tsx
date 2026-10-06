import { useEffect, useState } from "react";
import { attendanceAPI } from "@/api/client";
import type { NotificationLog } from "@/types";
import { clsx } from "clsx";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export function NotificationLogTable() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  useEffect(() => {
    attendanceAPI
      .logs({ page, limit: 20, ...(status ? { status } : {}) })
      .then((res) => {
        const data = res.data as { logs: NotificationLog[]; total: number };
        setLogs(data.logs);
        setTotal(data.total);
      });
  }, [page, status]);

  const statusIcon = (s: string) => {
    if (s === "SENT") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (s === "FAILED") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["", "SENT", "FAILED", "PENDING"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={clsx(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              status === s
                ? "bg-brand-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            )}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
            <tr>
              {["Student", "Parent Phone", "Subject", "Date", "Status", "Sent At"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                <td className="px-4 py-3">{log.studentName}</td>
                <td className="px-4 py-3 text-gray-500">{log.parentPhone}</td>
                <td className="px-4 py-3">{log.subject}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(log.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {statusIcon(log.status)}
                    <span className={clsx(
                      log.status === "SENT" ? "text-green-600" :
                      log.status === "FAILED" ? "text-red-600" : "text-yellow-600"
                    )}>
                      {log.status}
                    </span>
                  </div>
                  {log.errorMsg && (
                    <p className="text-xs text-red-400 mt-0.5">{log.errorMsg}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {log.sentAt ? new Date(log.sentAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{total} total records</span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-2 py-1 rounded border disabled:opacity-40"
          >
            Prev
          </button>
          <span>Page {page}</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 rounded border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
