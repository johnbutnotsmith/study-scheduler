// src/components/WeeklyPlanForm.tsx

import { useState } from "react";
import AvailabilityInput, { type AvailabilityValue } from "./AvailabilityInput";
import SubjectList, { type SubjectInput } from "./SubjectList";

import {
  WeeklyPlanRequest,
  WeeklySubject,
  WeeklyAvailability,
  Weekday,
} from "../types/domain";

interface WeeklyPlanFormProps {
  onGenerate: (payload: WeeklyPlanRequest) => void;
  loading: boolean;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function computeWeeklyEndDate(start: string): string {
  const d = new Date(start);
  d.setDate(d.getDate() + 6);
  return d.toISOString().slice(0, 10);
}

export function WeeklyPlanForm({ onGenerate, loading }: WeeklyPlanFormProps) {
  // -------------------------
  // STATE
  // -------------------------

  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<number>(10);

  const [availability, setAvailability] = useState<AvailabilityValue>({
    minutes_per_weekday: {
      Monday: 120,
      Tuesday: 120,
      Wednesday: 120,
      Thursday: 120,
      Friday: 120,
      Saturday: 180,
      Sunday: 180,
    },
    start_date: todayISO(),
    rest_dates: [],
  });

  // -------------------------
  // SUBJECT HELPERS
  // -------------------------

  function addSubject() {
    const newSubject: SubjectInput = {
      name: "",
      difficulty: 3,
      confidence: 3,
      topics: [
        {
          name: "",
          priority: 3,
          familiarity: 3,
        },
      ],
    };

    setSubjects((prev) => [newSubject, ...prev]); // PREPEND
  }

  function updateSubject(index: number, updated: SubjectInput) {
    setSubjects((prev) => prev.map((s, i) => (i === index ? updated : s)));
  }

  function removeSubject(index: number) {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  }

  // -------------------------
  // TOPIC HELPERS
  // -------------------------

  function addTopic(subjectIndex: number) {
    setSubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? {
              ...subj,
              topics: [
                {
                  name: "",
                  priority: 3,
                  familiarity: 3,
                },
                ...subj.topics, // PREPEND
              ],
            }
          : subj
      )
    );
  }

  function removeTopic(subjectIndex: number, topicIndex: number) {
    setSubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? {
              ...subj,
              topics: subj.topics.filter((_, j) => j !== topicIndex),
            }
          : subj
      )
    );
  }

  // -------------------------
  // SUBMIT
  // -------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (subjects.length === 0) {
      alert("Please add at least one subject.");
      return;
    }

    if (!weeklyHours || weeklyHours <= 0) {
      alert("Please enter a valid number of weekly hours.");
      return;
    }

    const start = availability.start_date || todayISO();
    const end = computeWeeklyEndDate(start);

    const normalizedAvailability: WeeklyAvailability = {
      minutes_per_weekday:
        availability.minutes_per_weekday as Record<Weekday, number>,
      start_date: start,
      end_date: end, // optional in type, but FE sends it
      rest_dates: availability.rest_dates ?? [],
    };

    const payload: WeeklyPlanRequest = {
      subjects: subjects.map(
        (s): WeeklySubject => ({
          id: s.id, // optional; backend generates if missing
          name: s.name,
          difficulty: s.difficulty,
          confidence: s.confidence,
          topics: s.topics.map((t) => ({
            id: t.id,
            name: t.name,
            priority: t.priority,
            familiarity: t.familiarity,
          })),
        })
      ),
      weekly_hours: weeklyHours,
      availability: normalizedAvailability,
    };

    onGenerate(payload);
  }

  // -------------------------
  // RENDER
  // -------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Availability */}
      <AvailabilityInput
        value={availability}
        onChange={(next) =>
          setAvailability({
            ...next,
            start_date: next.start_date || availability.start_date || todayISO(),
            rest_dates: next.rest_dates ?? [],
          })
        }
      />

      {/* Weekly hours */}
      <section className="space-y-2">
        <label className="text-sm font-semibold text-slate-900">
          Total weekly study hours
        </label>
        <input
          type="number"
          min={1}
          className="w-32 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(Number(e.target.value))}
        />
        <p className="text-xs text-slate-500">
          This is your target total study time per week.
        </p>
      </section>

      {/* Subjects */}
      <SubjectList
        subjects={subjects}
        loading={loading}
        onAddSubject={addSubject}
        onUpdateSubject={updateSubject}
        onRemoveSubject={removeSubject}
        onAddTopic={addTopic}
        onRemoveTopic={removeTopic}
      />

      {/* Submit */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-500 disabled:bg-blue-300 transition-all"
        >
          {loading ? "Generating…" : "Generate weekly plan"}
        </button>
      </div>
    </form>
  );
}
