import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store";
import { logout, fetchMe } from "@/store/authSlice";
import { useEffect } from "react";

export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, loading, error } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMe());
    }
  }, [token, user, dispatch]);

  return {
    user,
    token,
    loading,
    error,
    isAdmin: user?.role === "INSTITUTE_ADMIN" || user?.role === "SUPER_ADMIN",
    isTeacher: user?.role === "TEACHER",
    isStudent: user?.role === "STUDENT",
    logout: () => dispatch(logout()),
  };
}
