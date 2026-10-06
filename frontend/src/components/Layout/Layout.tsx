import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ToastContainer } from "@/components/common/Toast";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useEffect } from "react";

export function Layout() {
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
      <ToastContainer />
    </div>
  );
}
