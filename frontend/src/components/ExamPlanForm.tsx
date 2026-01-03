// src/components/ExamPlanForm.tsx

import { useState } from "react";
import AvailabilityInput, { type AvailabilityValue } from "./AvailabilityInput";
import ExamDateInput from "./ExamDateInput";
import SubjectList, { type SubjectInput } from "./SubjectList";

import type {
  ExamPlanRequest,
  ExamSubject,
  ExamAvailability,
  Weekday,
} from "../types/domain";

interface ExamPlanFormProps {
  onGenerate: (payload: ExamPlanRequest) => void;
  loading: boolean;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dayBefore(date: string): string {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function ExamPlanForm({ onGenerate, loading }: ExamPlanFormProps) {
  // -------------------------
  // STATE
  // -------------------------

  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
  const [examDate, setExamDate] = useState<string>("");

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

    if (!examDate) {
      alert("Please choose an exam date.");
      return;
    }

    const start = availability.start_date || todayISO();
    const lastStudyDay = dayBefore(examDate);

    const normalizedAvailability: ExamAvailability = {
      minutes_per_weekday:
        availability.minutes_per_weekday as Record<Weekday, number>,
      start_date: start,
      end_date: lastStudyDay,
      rest_dates: availability.rest_dates ?? [],
    };

    const payload: ExamPlanRequest = {
      subjects: subjects.map(
        (s): ExamSubject => ({
          id: s.id, // optional; backend will generate if missing
          name: s.name,
          exam_date: examDate,
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

      {/* Exam date */}
      <ExamDateInput value={examDate} onChange={setExamDate} />

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
          {loading ? "Generating…" : "Generate exam plan"}
        </button>
      </div>
    </form>
  );
}
