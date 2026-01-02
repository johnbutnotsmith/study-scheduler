// src/components/ExamPlanForm.tsx

import { useState } from "react";
import AvailabilityInput, {
  type AvailabilityValue,
} from "./AvailabilityInput";
import ExamDateInput from "./ExamDateInput";
import SubjectList, {
  type SubjectInput,
  type TopicInput,
} from "./SubjectList";
import AddSubjectButton from "./AddSubjectButton";
import type { ExamPlanRequest } from "../api/types";

interface ExamPlanFormProps {
  onGenerate: (payload: ExamPlanRequest) => void;
  loading: boolean;
}

export function ExamPlanForm({ onGenerate, loading }: ExamPlanFormProps) {
  // -------------------------
  // STATE
  // -------------------------

  const [subjects, setSubjects] = useState<SubjectInput[]>([]);
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
    start_date: "",
    end_date: "",
    rest_dates: [], // REQUIRED for TS compatibility
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

    // PREPEND behavior
    setSubjects((prev) => [newSubject, ...prev]);
  }

  function updateSubject(index: number, updated: SubjectInput) {
    setSubjects((prev) =>
      prev.map((s, i) => (i === index ? updated : s))
    );
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

    if (!availability.start_date || !availability.end_date) {
      alert("Please set your study start and exam end dates.");
      return;
    }

    const payload: ExamPlanRequest = {
      subjects: subjects.map((s) => ({
        name: s.name,
        exam_date: availability.end_date!, // guaranteed by validation
        difficulty: s.difficulty,
        confidence: s.confidence,
        topics: s.topics,
      })),
      availability: {
        ...availability,
        rest_dates: availability.rest_dates ?? [], // ensure defined
      },
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
        mode="exam"
        value={availability}
        onChange={(next) =>
          setAvailability({ ...next, rest_dates: next.rest_dates ?? [] })
        }
      />

      {/* Exam date */}
      <ExamDateInput
        value={availability.end_date ?? ""}
        onChange={(date) =>
          setAvailability((prev) => ({
            ...prev,
            end_date: date,
            rest_dates: prev.rest_dates ?? [],
          }))
        }
      />

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

      {/* Add subject button */}
      <div className="pt-2">
        <AddSubjectButton
          onClick={addSubject}
          disabled={loading}
          label="Add subject"
        />
      </div>

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
