import { useEffect, useState } from "react";
import { DropResult } from "@hello-pangea/dnd";
import { scheduleAPI, instituteAPI } from "@/api/client";
import { TimetableGrid } from "@/components/Timetable/TimetableGrid";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { useDispatch } from "react-redux";
import { addToast } from "@/store/uiSlice";
import type { ClassBatch, Timetable, Lecture, Day } from "@/types";
import { RefreshCw, Zap } from "lucide-react";

export function TimetablePage() {
  const { isAdmin } = useAuth();
  const dispatch = useDispatch();

  const [classes, setClasses] = useState<ClassBatch[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    instituteAPI.listClasses().then((res) => {
      const cls = res.data as ClassBatch[];
      setClasses(cls);
      if (cls.length > 0) setSelectedClassId(cls[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoading(true);
    scheduleAPI
      .get(selectedClassId)
      .then((res) => setTimetable(res.data as Timetable))
      .catch(() => setTimetable(null))
      .finally(() => setLoading(false));
  }, [selectedClassId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await scheduleAPI.generate(selectedClassId);
      setTimetable(res.data as Timetable);
      dispatch(addToast({ type: "success", message: "Timetable generated!" }));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Generation failed";
      dispatch(addToast({ type: "error", message: msg }));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDragEnd(result: DropResult) {
    if (!result.destination || !timetable) return;
    const { draggableId, destination } = result;
    const newDay = destination.droppableId as Day;

    const lecture = timetable.lectures.find((l) => l.id === draggableId);
    if (!lecture || lecture.day === newDay) return;

    try {
      await scheduleAPI.moveLecture(draggableId, {
        day: newDay,
        startTime: lecture.startTime,
        endTime: lecture.endTime,
      });
      // Optimistic update
      setTimetable((prev) =>
        prev
          ? {
              ...prev,
              lectures: prev.lectures.map((l) =>
                l.id === draggableId ? { ...l, day: newDay } : l
              ),
            }
          : prev
      );
      dispatch(addToast({ type: "success", message: "Lecture moved" }));
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { message?: string; conflict?: object } } })?.response?.data;
      dispatch(addToast({ type: "error", message: d?.message ?? "Conflict detected" }));
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Timetable</h1>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {isAdmin && (
            <Button onClick={handleGenerate} loading={generating}>
              <Zap className="w-4 h-4" />
              Auto-Generate
            </Button>
          )}

          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              scheduleAPI
                .get(selectedClassId)
                .then((res) => setTimetable(res.data as Timetable))
                .catch(() => setTimetable(null))
                .finally(() => setLoading(false));
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading timetable…</div>
      ) : timetable ? (
        <div className="overflow-x-auto">
          <TimetableGrid
            lectures={timetable.lectures}
            onDragEnd={handleDragEnd}
            editable={isAdmin}
          />
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 mb-4">No timetable for this week.</p>
          {isAdmin && (
            <Button onClick={handleGenerate} loading={generating}>
              <Zap className="w-4 h-4" />
              Generate Timetable
            </Button>
          )}
        </div>
      )}

      {isAdmin && (
        <p className="text-xs text-gray-400">
          Drag lectures between day columns to reschedule. Conflicts are detected automatically.
        </p>
      )}
    </div>
  );
}
