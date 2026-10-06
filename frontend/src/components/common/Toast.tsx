import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "@/store/uiSlice";
import type { RootState } from "@/store";
import { clsx } from "clsx";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

function Toast({ id, type, message }: { id: string; type: string; message: string }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const t = setTimeout(() => dispatch(removeToast(id)), 4000);
    return () => clearTimeout(t);
  }, [id, dispatch]);

  const icons = { success: CheckCircle, error: AlertCircle, info: Info };
  const Icon = icons[type as keyof typeof icons] ?? Info;

  const colors = {
    success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300",
    error:   "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300",
    info:    "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  };

  return (
    <div className={clsx("flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm", colors[type as keyof typeof colors])}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button onClick={() => dispatch(removeToast(id))}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useSelector((s: RootState) => s.ui.toasts);
  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {toasts.map((t) => (
        <Toast key={t.id} {...t} />
      ))}
    </div>
  );
}
