import { useEffect, useState } from "react";
import { instituteAPI } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { Users, GraduationCap, LayoutGrid, Bell } from "lucide-react";

interface DashboardData {
  teachers: number;
  students: number;
  classes: number;
  pendingRequests: number;
  workload: { teacherId: string; _count: { id: number } }[];
}

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (user?.instituteId) {
      instituteAPI
        .dashboard(user.instituteId)
        .then((res) => setData(res.data as DashboardData));
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.name}
        </p>
      </div>

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Teachers" value={data.teachers} icon={Users} color="bg-brand-600" />
          <StatCard label="Students" value={data.students} icon={GraduationCap} color="bg-emerald-600" />
          <StatCard label="Classes" value={data.classes} icon={LayoutGrid} color="bg-violet-600" />
          <StatCard label="Pending Requests" value={data.pendingRequests} icon={Bell} color="bg-amber-500" />
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Generate Timetable", href: "/timetable" },
            { label: "Upload Attendance", href: "/attendance" },
            { label: "Add Teacher", href: "/teachers" },
            { label: "Add Student", href: "/students" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="px-4 py-2 text-sm bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg hover:bg-brand-100 transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
