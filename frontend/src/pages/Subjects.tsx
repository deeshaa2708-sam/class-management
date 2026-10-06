import { useEffect, useState } from "react";
import { instituteAPI } from "@/api/client";
import type { Subject } from "@/types";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useDispatch } from "react-redux";
import { addToast } from "@/store/uiSlice";
import { Plus } from "lucide-react";

const COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444","#3b82f6",
  "#8b5cf6","#ec4899","#14b8a6","#f97316","#84cc16",
];

export function SubjectsPage() {
  const dispatch = useDispatch();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  function load() {
    instituteAPI.listSubjects().then((res) => setSubjects(res.data as Subject[]));
  }

  useEffect(load, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await instituteAPI.createSubject({ name, code, color });
      dispatch(addToast({ type: "success", message: "Subject created" }));
      setOpen(false); setName(""); setCode(""); setColor(COLORS[0]);
      load();
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to create subject" }));
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subjects</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> Add Subject
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {subjects.map((s) => (
          <div
            key={s.id}
            className="rounded-xl p-4 border"
            style={{ borderColor: s.color + "44", backgroundColor: s.color + "11" }}
          >
            <div
              className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: s.color }}
            >
              {s.code.slice(0, 2).toUpperCase()}
            </div>
            <div className="font-semibold" style={{ color: s.color }}>{s.name}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.code}</div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Subject" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code</label>
            <input value={code} onChange={(e) => setCode(e.target.value)} required
              className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900" placeholder="e.g. MATH101" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                />
              ))}
            </div>
          </div>
          <Button type="submit" loading={saving} className="w-full">Create Subject</Button>
        </form>
      </Modal>
    </div>
  );
}
