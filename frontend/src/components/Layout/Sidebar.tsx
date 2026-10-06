import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CalendarDays, Users, GraduationCap,
  BookOpen, ClipboardList, Upload, Settings, LogOut, Moon, Sun,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { toggleDarkMode } from "@/store/uiSlice";
import type { RootState } from "@/store";
import { clsx } from "clsx";

const adminLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/timetable",  icon: CalendarDays,    label: "Timetable" },
  { to: "/teachers",   icon: Users,            label: "Teachers" },
  { to: "/students",   icon: GraduationCap,    label: "Students" },
  { to: "/subjects",   icon: BookOpen,         label: "Subjects" },
  { to: "/attendance", icon: ClipboardList,    label: "Attendance" },
  { to: "/materials",  icon: Upload,           label: "Materials" },
  { to: "/settings",   icon: Settings,         label: "Settings" },
];

const teacherLinks = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Dashboard" },
  { to: "/timetable",  icon: CalendarDays,    label: "Timetable" },
  { to: "/attendance", icon: ClipboardList,   label: "Attendance" },
  { to: "/materials",  icon: Upload,          label: "Materials" },
];

const studentLinks = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "My Day" },
  { to: "/timetable",  icon: CalendarDays,    label: "Schedule" },
  { to: "/attendance", icon: ClipboardList,   label: "Attendance" },
  { to: "/materials",  icon: Upload,          label: "Materials" },
];

export function Sidebar() {
  const { user, isAdmin, isTeacher, logout } = useAuth();
  const dispatch = useDispatch();
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);

  const links = isAdmin ? adminLinks : isTeacher ? teacherLinks : studentLinks;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 px-3 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <CalendarDays className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-brand-700 dark:text-brand-200">Scheduler</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="mt-4 space-y-1 border-t border-gray-200 dark:border-gray-800 pt-4">
        <button
          onClick={() => dispatch(toggleDarkMode())}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
        <div className="px-3 py-2 text-xs text-gray-400 truncate">{user?.name}</div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
