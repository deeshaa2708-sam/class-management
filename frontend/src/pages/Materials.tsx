import { useEffect, useState, useRef } from "react";
import { materialAPI, instituteAPI } from "@/api/client";
import type { Material, Subject } from "@/types";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { addToast } from "@/store/uiSlice";
import { FileText, Trash2, Upload } from "lucide-react";

export function MaterialsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const dispatch = useDispatch();
  const fileRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filterSubject, setFilterSubject] = useState("");
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await materialAPI.list(filterSubject ? { subjectId: filterSubject } : {});
    setMaterials(res.data as Material[]);
  }

  useEffect(() => {
    instituteAPI.listSubjects().then((res) => setSubjects(res.data as Subject[]));
  }, []);

  useEffect(() => { load(); }, [filterSubject]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title || !subjectId) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("subjectId", subjectId);
    fd.append("classIds", JSON.stringify([]));
    setUploading(true);
    try {
      await materialAPI.upload(fd);
      dispatch(addToast({ type: "success", message: "Material uploaded" }));
      setTitle(""); setFile(null); setSubjectId("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch {
      dispatch(addToast({ type: "error", message: "Upload failed" }));
    } finally { setUploading(false); }
  }

  async function handleDelete(id: string) {
    await materialAPI.delete(id);
    dispatch(addToast({ type: "success", message: "Deleted" }));
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Study Materials</h1>

      {(isAdmin || isTeacher) && (
        <form onSubmit={handleUpload} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 col-span-2"
            required
          />
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900"
            required
          >
            <option value="">Subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex gap-2">
            <label className="flex-1 flex items-center gap-1.5 text-sm text-gray-500 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 cursor-pointer hover:border-brand-400">
              <Upload className="w-4 h-4" />
              {file ? file.name.slice(0, 15) + "…" : "File"}
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <Button type="submit" loading={uploading} disabled={!file}>Upload</Button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterSubject("")}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filterSubject ? "bg-brand-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}
        >
          All
        </button>
        {subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => setFilterSubject(s.id)}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filterSubject === s.id ? s.color : s.color + "22",
              color: s.color,
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((m) => (
          <div key={m.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex gap-3">
            <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: m.subject.color + "22" }}>
              <FileText className="w-5 h-5" style={{ color: m.subject.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{m.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">{m.subject.name}</div>
              <div className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleDateString()}</div>
              <div className="flex gap-2 mt-2">
                <a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">Download</a>
                {(isAdmin || isTeacher) && (
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {materials.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">No materials yet</div>
        )}
      </div>
    </div>
  );
}
