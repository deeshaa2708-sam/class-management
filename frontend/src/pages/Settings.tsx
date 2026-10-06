import { useEffect, useState } from "react";
import { instituteAPI } from "@/api/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/common/Button";
import { useDispatch } from "react-redux";
import { addToast } from "@/store/uiSlice";

export function SettingsPage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [template, setTemplate] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.instituteId) {
      instituteAPI.get(user.instituteId).then((res) => {
        const data = res.data as { name: string; whatsappTemplate: string };
        setName(data.name);
        setTemplate(data.whatsappTemplate);
      });
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.instituteId) return;
    setSaving(true);
    try {
      await instituteAPI.update(user.instituteId, { name, whatsappTemplate: template });
      dispatch(addToast({ type: "success", message: "Settings saved" }));
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to save" }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Institute Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            WhatsApp Absence Notification Template
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Available placeholders:{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{"  }student_name{"}"}</code>,{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{"  }subject{"}"}</code>,{" "}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{"  }date{"}"}</code>
          </p>
          <textarea
            rows={4}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
          />
          {/* Live preview */}
          <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-xs text-green-800 dark:text-green-300">
            <span className="font-semibold">Preview: </span>
            {template
              .replace("{student_name}", "Riya Sharma")
              .replace("{subject}", "Mathematics")
              .replace("{date}", "06 Oct 2026")}
          </div>
        </div>

        <Button type="submit" loading={saving}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
