import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

import { Layout } from "@/components/Layout/Layout";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { TimetablePage } from "@/pages/Timetable";
import { TeachersPage } from "@/pages/Teachers";
import { StudentsPage } from "@/pages/Students";
import { SubjectsPage } from "@/pages/Subjects";
import { AttendancePage } from "@/pages/Attendance";
import { MaterialsPage } from "@/pages/Materials";
import { SettingsPage } from "@/pages/Settings";
import { useSocket } from "@/hooks/useSocket";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useSelector((s: RootState) => s.auth.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppWithSocket() {
  const token = useSelector((s: RootState) => s.auth.token);
  useSocket(token); // real-time connection

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"  element={<Dashboard />} />
        <Route path="timetable"  element={<TimetablePage />} />
        <Route path="teachers"   element={<TeachersPage />} />
        <Route path="students"   element={<StudentsPage />} />
        <Route path="subjects"   element={<SubjectsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="materials"  element={<MaterialsPage />} />
        <Route path="settings"   element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppWithSocket />
    </BrowserRouter>
  );
}
