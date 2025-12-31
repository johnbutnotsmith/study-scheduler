import React, { useMemo, useState } from "react";
import type {
  ExamSubject,
  Topic,
  ExamAvailability,
  ExamPlanRequest,
} from "../api/types";

type ExamPlanFormProps = {
  onGenerate: (payload: ExamPlanRequest) => void;
  loading: boolean;
};

const DEFAULT_MINUTES_PER_WEEKDAY: ExamAvailability["minutes_per_weekday"] = {
  Monday: 120,
  Tuesday: 120,
  Wednesday: 120,
  Thursday: 120,
  Friday: 120,
  Saturday: 180,
  Sunday: 180,
};

export function ExamPlanForm({ onGenerate, loading }: ExamPlanFormProps) {
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);

  // -------------------------
  // AVAILABILITY (derived)
  // -------------------------
  const availability: ExamAvailability | null = useMemo(() => {
    if (subjects.length === 0) return null;

    const examDates = subjects
      .map((s) => s.exam_date)
      .filter(Boolean)
      .sort();

    const today = new Date().toISOString().slice(0, 10);
    const endDate = examDates.length > 0 ? examDates[examDates.length - 1] : today;

    return {
      start_date: today,
      end_date: endDate,
      minutes_per_weekday: DEFAULT_MINUTES_PER_WEEKDAY,
      rest_dates: [],
    };
  }, [subjects]);

  // -------------------------
  // HELPERS
  // -------------------------

  function addSubject() {
    setSubjects((prev) => [
      ...prev,
      {
        name: "",
        exam_date: "",
        difficulty: 3,
        confidence: 3,
        topics: [
          {
            name: "",
            priority: 3,
            familiarity: 3,
          } as Topic,
        ],
      },
    ]);
  }

  function removeSubject(index: number) {
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSubjectField<K extends keyof ExamSubject>(
    index: number,
    field: K,
    value: ExamSubject[K]
  ) {
    setSubjects((prev) =>
      prev.map((subj, i) => (i === index ? { ...subj, [field]: value } : subj))
    );
  }

  function addTopic(subjectIndex: number) {
    setSubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? {
              ...subj,
              topics: [
                ...subj.topics,
                { name: "", priority: 3, familiarity: 3 } as Topic,
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

  function updateTopicField<K extends keyof Topic>(
    subjectIndex: number,
    topicIndex: number,
    field: K,
    value: Topic[K]
  ) {
    setSubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? {
              ...subj,
              topics: subj.topics.map((t, j) =>
                j === topicIndex ? { ...t, [field]: value } : t
              ),
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

    if (!availability) {
      alert("Please set at least one exam date.");
      return;
    }

    const payload: ExamPlanRequest = {
      subjects,
      availability,
    };

    onGenerate(payload);
  }

  // -------------------------
  // RENDER
  // -------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {subjects.map((subject, subjectIndex) => (
        <div key={subjectIndex} className="border rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Subject {subjectIndex + 1}</h3>
            <button
              type="button"
              onClick={() => removeSubject(subjectIndex)}
              className="text-sm text-red-600"
            >
              Delete subject
            </button>
          </div>

          {/* Name */}
          <input
            type="text"
            value={subject.name}
            onChange={(e) =>
              updateSubjectField(subjectIndex, "name", e.target.value)
            }
            className="w-full border rounded px-2 py-1"
            placeholder="Subject name"
          />

          {/* Exam date */}
          <label className="text-sm font-medium block">Exam date</label>
          <input
            type="date"
            value={subject.exam_date}
            onChange={(e) =>
              updateSubjectField(subjectIndex, "exam_date", e.target.value)
            }
            className="w-full border rounded px-2 py-1"
          />

          {/* Difficulty */}
          <label className="text-sm font-medium block">
            Difficulty ({subject.difficulty})
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={subject.difficulty}
            onChange={(e) =>
              updateSubjectField(
                subjectIndex,
                "difficulty",
                Number(e.target.value)
              )
            }
            className="w-full"
          />

          {/* Confidence */}
          <label className="text-sm font-medium block">
            Confidence ({subject.confidence})
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={subject.confidence}
            onChange={(e) =>
              updateSubjectField(
                subjectIndex,
                "confidence",
                Number(e.target.value)
              )
            }
            className="w-full"
          />

          {/* Topics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Topics</span>
              <button
                type="button"
                onClick={() => addTopic(subjectIndex)}
                className="text-xs text-blue-600"
              >
                + Add topic
              </button>
            </div>

            {subject.topics.map((topic, topicIndex) => (
              <div key={topicIndex} className="border rounded p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={topic.name}
                    onChange={(e) =>
                      updateTopicField(
                        subjectIndex,
                        topicIndex,
                        "name",
                        e.target.value
                      )
                    }
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Topic name"
                  />
                  <button
                    type="button"
                    onClick={() => removeTopic(subjectIndex, topicIndex)}
                    className="text-xs text-red-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Topic priority */}
                  <div>
                    <label className="text-xs font-medium">
                      Priority ({topic.priority})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={topic.priority}
                      onChange={(e) =>
                        updateTopicField(
                          subjectIndex,
                          topicIndex,
                          "priority",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Topic familiarity */}
                  <div>
                    <label className="text-xs font-medium">
                      Familiarity ({topic.familiarity})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={topic.familiarity}
                      onChange={(e) =>
                        updateTopicField(
                          subjectIndex,
                          topicIndex,
                          "familiarity",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSubject}
        className="px-3 py-1 border rounded text-sm"
      >
        + Add subject
      </button>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          {loading ? "Generating..." : "Generate exam plan"}
        </button>
      </div>
    </form>
  );
}