import React from "react";

interface SubjectEntry {
  id: string;
  name: string;
  minutes: number;
  topic: { name: string; id: string | null };
}

interface Block {
  type: string;
  minutes: number;
  start: string;
  end: string;
  subjects: SubjectEntry[];
}

interface DayPlan {
  date: string;
  weekday: string;
  total_minutes: number;
  blocks: Block[];
}

interface WeeklyPlan {
  week_start: string;
  days: DayPlan[];
}

// Color palette for subjects
const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-blue-100 border-blue-500",
  biology: "bg-green-100 border-green-500",
  chemistry: "bg-yellow-100 border-yellow-500",
  physics: "bg-purple-100 border-purple-500",
  history: "bg-red-100 border-red-500",
  english: "bg-pink-100 border-pink-500",
};

// Fallback for unknown subjects
function getColorClass(subjectName: string) {
  return SUBJECT_COLORS[subjectName.toLowerCase()] || "bg-gray-100 border-gray-400";
}

export default function WeeklyTimeline({ plan }: { plan: WeeklyPlan }) {
  if (!plan || !plan.days) return null;

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 space-y-8 px-2 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900">
        Weekly Study Plan (starting {plan.week_start})
      </h2>

      {plan.days.map((day) => (
        <div
          key={day.date}
          className="border rounded-lg p-4 shadow-sm bg-white space-y-4"
        >
          <h3 className="text-xl font-semibold text-gray-800">
            {day.weekday} — {day.date}
          </h3>

          {day.blocks.length === 0 && (
            <p className="text-gray-500 italic">Rest day</p>
          )}

          <div className="space-y-4">
            {day.blocks.map((block, idx) => (
              <div
                key={idx}
                className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded"
              >
                {/* Time + metadata */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="font-semibold text-gray-700">
                    {block.start} → {block.end}
                  </span>

                  <span className="text-sm text-gray-500">
                    {block.minutes} min • {block.type}
                  </span>
                </div>

                {/* Subjects */}
                <ul className="mt-3 space-y-2">
                  {block.subjects.map((subj, sidx) => (
                    <li
                      key={sidx}
                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center border-l-4 p-2 rounded ${getColorClass(
                        subj.name
                      )}`}
                    >
                      <span className="font-medium">
                        {subj.name} — {subj.topic?.name}
                      </span>

                      <span className="text-gray-700 font-semibold sm:mt-0 mt-1">
                        {subj.minutes} min
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}