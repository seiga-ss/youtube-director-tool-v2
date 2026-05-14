import axios from "axios";
import { getToken } from "@/contexts/AuthContext";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login") &&
      typeof window !== "undefined"
    ) {
      localStorage.removeItem("yt_director_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const loginUser = (email: string, password: string) =>
  api.post("/api/auth/login", { email, password }).then((r) => r.data);

export const getMe = () =>
  api.get("/api/auth/me").then((r) => r.data);

export const setupSuperAdmin = (email: string, password: string, name: string) =>
  api.post("/api/auth/setup", { email, password, name }).then((r) => r.data);

// ─── Admin ───────────────────────────────────────────────────
export const listUsers = () =>
  api.get("/api/admin/users").then((r) => r.data);

export const createUser = (data: {
  email: string;
  password: string;
  name: string;
  role?: string;
  company_id?: string;
}) => api.post("/api/admin/users", data).then((r) => r.data);

export const updateUser = (id: string, data: { name?: string; role?: string; is_active?: boolean; company_id?: string }) =>
  api.put(`/api/admin/users/${id}`, data).then((r) => r.data);

export const deleteUser = (id: string) =>
  api.delete(`/api/admin/users/${id}`).then((r) => r.data);

export const listCompanies = () =>
  api.get("/api/admin/companies").then((r) => r.data);

export const createCompany = (name: string) =>
  api.post("/api/admin/companies", { name }).then((r) => r.data);

export const deleteCompany = (id: string) =>
  api.delete(`/api/admin/companies/${id}`).then((r) => r.data);

// ─── Research ───────────────────────────────────────────────
export const startResearch = (data: {
  keyword: string;
  date_range: string;
  video_type: string;
  max_results: number;
}) => api.post("/api/research", data).then((r) => r.data);

export const listResearchSessions = () =>
  api.get("/api/research").then((r) => r.data);

export const getResearchSession = (id: number) =>
  api.get(`/api/research/${id}`).then((r) => r.data);

export const deleteResearchSession = (id: number) =>
  api.delete(`/api/research/${id}`).then((r) => r.data);

// ─── Planning ───────────────────────────────────────────────
export const generatePlanning = (data: {
  session_id: number;
  past_analysis?: string;
}) => api.post("/api/planning", data).then((r) => r.data);

export const analyzeChannel = (sessionId: number) =>
  api.post("/api/planning/channel-analysis", { session_id: sessionId }).then(r => r.data);

// ─── Script ─────────────────────────────────────────────────
export const generateScript = (data: {
  concept: string;
  titles: string[];
  research_summary?: string;
  target_minutes?: number;
  project_id?: number;
}) => api.post("/api/script", data).then((r) => r.data);

export const getScript = (id: number) =>
  api.get(`/api/script/${id}`).then((r) => r.data);

export const refineScript = (id: number, feedback: string) =>
  api.put(`/api/script/${id}/refine`, { feedback }).then((r) => r.data);

export const listScripts = (projectId?: number) =>
  api
    .get("/api/script", { params: projectId ? { project_id: projectId } : {} })
    .then((r) => r.data);

// ─── Thumbnail ──────────────────────────────────────────────
export const generateThumbnail = (data: {
  concept: string;
  titles: string[];
  reference_thumbnails?: string[];
  project_id?: number;
  generate_images?: boolean;
}) => api.post("/api/thumbnail", data).then((r) => r.data);

export const listThumbnails = (projectId?: number) =>
  api
    .get("/api/thumbnail", {
      params: projectId ? { project_id: projectId } : {},
    })
    .then((r) => r.data);

// ─── Direction / Projects ───────────────────────────────────
export const createProject = (data: {
  title: string;
  concept?: string;
  research_session_id?: number;
}) => api.post("/api/projects", data).then((r) => r.data);

export const listProjects = () =>
  api.get("/api/projects").then((r) => r.data);

export const getProject = (id: number) =>
  api.get(`/api/projects/${id}`).then((r) => r.data);

export const updateProject = (
  id: number,
  data: { title?: string; concept?: string; status?: string; video_url?: string }
) => api.put(`/api/projects/${id}`, data).then((r) => r.data);

export const deleteProject = (id: number) =>
  api.delete(`/api/projects/${id}`).then((r) => r.data);

export const createTask = (
  projectId: number,
  data: {
    title: string;
    description?: string;
    assignee?: string;
    due_date?: string;
  }
) => api.post(`/api/projects/${projectId}/tasks`, data).then((r) => r.data);

export const updateTask = (
  projectId: number,
  taskId: number,
  data: {
    title?: string;
    description?: string;
    assignee?: string;
    status?: string;
    due_date?: string;
  }
) =>
  api
    .put(`/api/projects/${projectId}/tasks/${taskId}`, data)
    .then((r) => r.data);

export const deleteTask = (projectId: number, taskId: number) =>
  api.delete(`/api/projects/${projectId}/tasks/${taskId}`).then((r) => r.data);

export const addComment = (
  projectId: number,
  data: { content: string }
) =>
  api.post(`/api/projects/${projectId}/comments`, data).then((r) => r.data);

// ─── Script Notion ──────────────────────────────────────────
export const saveScriptToNotion = (scriptId: number, notionPageId?: string) =>
  api.post(`/api/script/${scriptId}/notion`, { notion_page_id: notionPageId }).then(r => r.data);
