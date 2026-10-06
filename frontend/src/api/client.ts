import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to /login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Typed helpers ────────────────────────────────────────────────────────────

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: import("@/types").AuthUser }>("/auth/login", { email, password }),
  register: (data: object) =>
    api.post<{ token: string; user: import("@/types").AuthUser }>("/auth/register", data),
  me: () => api.get<import("@/types").AuthUser>("/auth/me"),
};

export const instituteAPI = {
  get: (id: string) => api.get(`/institutes/${id}`),
  update: (id: string, data: object) => api.patch(`/institutes/${id}`, data),
  dashboard: (id: string) => api.get(`/institutes/${id}/dashboard`),
  listSubjects: () => api.get("/institutes/subjects/list"),
  createSubject: (data: object) => api.post("/institutes/subjects", data),
  listClasses: () => api.get("/institutes/classes/list"),
  createClass: (data: object) => api.post("/institutes/classes", data),
  assignSubject: (classId: string, data: object) =>
    api.post(`/institutes/classes/${classId}/subjects`, data),
};

export const teacherAPI = {
  list: () => api.get("/teachers"),
  get: (id: string) => api.get(`/teachers/${id}`),
  setAvailability: (id: string, slots: object[]) =>
    api.patch(`/teachers/${id}/availability`, slots),
  workload: (id: string) => api.get(`/teachers/${id}/workload`),
};

export const studentAPI = {
  list: (classId?: string) =>
    api.get("/students", { params: classId ? { classId } : {} }),
  update: (id: string, data: object) => api.patch(`/students/${id}`, data),
  schedule: (id: string) => api.get(`/students/${id}/schedule`),
  addEvent: (id: string, data: object) => api.post(`/students/${id}/events`, data),
};

export const scheduleAPI = {
  generate: (classId: string) => api.post(`/schedules/generate/${classId}`),
  get: (classId: string, week?: string) =>
    api.get(`/schedules/${classId}`, { params: week ? { week } : {} }),
  moveLecture: (lectureId: string, data: object) =>
    api.patch(`/schedules/lectures/${lectureId}`, data),
  reportAbsence: (data: object) => api.post("/schedules/absence", data),
};

export const attendanceAPI = {
  upload: (formData: FormData) =>
    api.post("/attendance/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  studentSummary: (studentId: string) =>
    api.get(`/attendance/student/${studentId}`),
  logs: (params?: object) => api.get("/attendance/logs", { params }),
};

export const materialAPI = {
  list: (params?: object) => api.get("/materials", { params }),
  upload: (formData: FormData) =>
    api.post("/materials", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => api.delete(`/materials/${id}`),
};
