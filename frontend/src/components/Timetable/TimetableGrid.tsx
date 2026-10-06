import {
  DragDropContext, Droppable, Draggable, DropResult,
} from "@hello-pangea/dnd";
import { clsx } from "clsx";
import type { Lecture, Day } from "@/types";

const DAYS: Day[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const DAY_LABELS: Record<Day, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

interface Props {
  lectures: Lecture[];
  onDragEnd: (result: DropResult) => void;
  editable?: boolean;
}

export function TimetableGrid({ lectures, onDragEnd, editable = false }: Props) {
  // Group lectures by day
  const byDay: Record<Day, Lecture[]> = {} as Record<Day, Lecture[]>;
  DAYS.forEach((d) => (byDay[d] = []));
  lectures.forEach((l) => {
    if (!l.isCancelled) byDay[l.day]?.push(l);
  });
  DAYS.forEach((d) => byDay[d].sort((a, b) => a.startTime.localeCompare(b.startTime)));

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-6 gap-2 min-w-[700px]">
        {DAYS.map((day) => (
          <div key={day} className="flex flex-col gap-1">
            {/* Day header */}
            <div className="text-xs font-semibold text-center text-gray-500 dark:text-gray-400 py-1 bg-gray-100 dark:bg-gray-800 rounded">
              {DAY_LABELS[day]}
            </div>
            {/* Droppable column */}
            <Droppable droppableId={day} isDropDisabled={!editable}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={clsx(
                    "flex flex-col gap-1 min-h-[200px] rounded-lg p-1 transition-colors",
                    snapshot.isDraggingOver
                      ? "bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-400"
                      : "bg-gray-50 dark:bg-gray-900/50"
                  )}
                >
                  {byDay[day].map((lecture, index) => (
                    <Draggable
                      key={lecture.id}
                      draggableId={lecture.id}
                      index={index}
                      isDragDisabled={!editable}
                    >
                      {(drag, dragSnap) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                          className={clsx(
                            "rounded-md p-2 text-xs cursor-default select-none transition-shadow",
                            dragSnap.isDragging ? "shadow-lg ring-2 ring-white/50" : "shadow-sm"
                          )}
                          style={{
                            backgroundColor: lecture.subject.color + "33", // 20% opacity
                            borderLeft: `3px solid ${lecture.subject.color}`,
                            ...drag.draggableProps.style,
                          }}
                        >
                          <div className="font-semibold truncate" style={{ color: lecture.subject.color }}>
                            {lecture.subject.name}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {lecture.startTime}–{lecture.endTime}
                          </div>
                          <div className="text-gray-400 truncate">
                            {lecture.teacher.user.name}
                          </div>
                          {lecture.substituteId && (
                            <span className="text-orange-500 text-[10px]">SUB</span>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {byDay[day].length === 0 && (
                    <div className="text-center text-xs text-gray-300 dark:text-gray-700 py-4">
                      No lectures
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
