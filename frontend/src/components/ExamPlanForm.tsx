import React, { useMemo, useState } from "react";
import {
  ExamSpec,
  TopicSpec,
  AvailabilitySpec,
  AllocatorSettings,
  ExamPlanRequestV2,
} from "../api/types";

type ExamPlanFormProps = {
  onGenerate: (payload: ExamPlanRequestV2) => void;
  loading: boolean;
};

const DEFAULT_MINUTES_PER_WEEKDAY: AvailabilitySpec["minutes_per_weekday"] = {
  Monday: 120,
  Tuesday: 120,
  Wednesday: 120,
  Thursday: 120,
  Friday: 120,
  Saturday: 180,
  Sunday: 180,
};

const DEFAULT_ALLOCATOR_SETTINGS: AllocatorSettings = {
  max_daily_minutes: 300, // 5 hours
  difficulty_weight: 1.0,
  unfamiliarity_weight: 1.0,
  urgency_weight: 1.0,
};

const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

export function ExamPlanForm({ onGenerate, loading }: ExamPlanFormProps) {
  const [exams, setExams] = useState<ExamSpec[]>([]);

  // We keep availability + settings as simple, non-editable defaults for now.
  const [minutesPerWeekday] = useState(DEFAULT_MINUTES_PER_WEEKDAY);
  const [settings] = useState<AllocatorSettings>(DEFAULT_ALLOCATOR_SETTINGS);

  // -------------------------
  // AVAILABILITY DERIVATION
  // -------------------------

  const availability: AvailabilitySpec | null = useMemo(() => {
    if (exams.length === 0) {
      return null;
    }

    const examDates = exams
      .map((e) => e.exam_date)
      .filter(Boolean)
      .sort();

    if (examDates.length === 0) {
      // No dates yet: we can still send something, but allocator really wants an end_date.
      const today = new Date().toISOString().slice(0, 10);
      return {
        start_date: today,
        end_date: today,
        minutes_per_weekday: minutesPerWeekday,
        rest_dates: [],
      };
    }

    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = examDates[examDates.length - 1];

    return {
      start_date: startDate,
      end_date: endDate,
      minutes_per_weekday: minutesPerWeekday,
      rest_dates: [],
    };
  }, [exams, minutesPerWeekday]);

  // -------------------------
  // HELPERS
  // -------------------------

  function addExam() {
    setExams((prev) => [
      ...prev,
      {
        subject: "",
        exam_date: "",
        hours_available: 10,
        difficulty: 3,
        familiarity: 3,
        priority: "medium",
        topics: [{ name: "", difficulty: 3, familiarity: 3, priority: "medium", confidence: 3 }],
      },
    ]);
  }

  function removeExam(index: number) {
    setExams((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExamField<K extends keyof ExamSpec>(
    index: number,
    field: K,
    value: ExamSpec[K]
  ) {
    setExams((prev) =>
      prev.map((exam, i) => (i === index ? { ...exam, [field]: value } : exam))
    );
  }

  function addTopic(examIndex: number) {
    setExams((prev) =>
      prev.map((exam, i) =>
        i === examIndex
          ? {
              ...exam,
              topics: [
                ...exam.topics,
                {
                  name: "",
                  difficulty: 3,
                  familiarity: 3,
                  priority: "medium",
                  confidence: 3,
                } as TopicSpec,
              ],
            }
          : exam
      )
    );
  }

  function removeTopic(examIndex: number, topicIndex: number) {
    setExams((prev) =>
      prev.map((exam, i) =>
        i === examIndex
          ? {
              ...exam,
              topics: exam.topics.filter((_, j) => j !== topicIndex),
            }
          : exam
      )
    );
  }

  function updateTopicField<K extends keyof TopicSpec>(
    examIndex: number,
    topicIndex: number,
    field: K,
    value: TopicSpec[K]
  ) {
    setExams((prev) =>
      prev.map((exam, i) =>
        i === examIndex
          ? {
              ...exam,
              topics: exam.topics.map((t, j) =>
                j === topicIndex ? { ...t, [field]: value } : t
              ),
            }
          : exam
      )
    );
  }

  // -------------------------
  // SUBMIT
  // -------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (exams.length === 0) {
      alert("Please add at least one exam before generating a plan.");
      return;
    }

    if (!availability) {
      alert("Please set at least one exam date before generating a plan.");
      return;
    }

    const payload: ExamPlanRequestV2 = {
      exams,
      availability,
      settings,
    };

    onGenerate(payload);
  }

  // -------------------------
  // RENDER
  // -------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {exams.map((exam, examIndex) => (
        <div key={examIndex} className="border rounded p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Exam {examIndex + 1}</h3>
            <button
              type="button"
              onClick={() => removeExam(examIndex)}
              className="text-sm text-red-600"
            >
              Delete exam
            </button>
          </div>

          {/* Subject */}
          <input
            type="text"
            value={exam.subject}
            onChange={(e) => updateExamField(examIndex, "subject", e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="Subject"
          />

          {/* Exam date */}
          <label className="text-sm font-medium block">Exam date</label>
          <input
            type="date"
            value={exam.exam_date}
            onChange={(e) => updateExamField(examIndex, "exam_date", e.target.value)}
            className="w-full border rounded px-2 py-1"
          />

          {/* Hours available */}
          <label className="text-sm font-medium block">Total hours available for this exam</label>
          <input
            type="number"
            min={1}
            value={exam.hours_available}
            onChange={(e) =>
              updateExamField(examIndex, "hours_available", Number(e.target.value) || 0)
            }
            className="w-full border rounded px-2 py-1"
            placeholder="e.g. 20"
          />

          {/* Difficulty */}
          <label className="text-sm font-medium block">
            Difficulty ({exam.difficulty})
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={exam.difficulty}
            onChange={(e) =>
              updateExamField(examIndex, "difficulty", Number(e.target.value))
            }
            className="w-full"
          />

          {/* Familiarity */}
          <label className="text-sm font-medium block">
            Familiarity ({exam.familiarity})
          </label>
          <input
            type="range"
            min={1}
            max={5}
            value={exam.familiarity}
            onChange={(e) =>
              updateExamField(examIndex, "familiarity", Number(e.target.value))
            }
            className="w-full"
          />

          {/* Priority */}
          <label className="text-sm font-medium block">Priority</label>
          <select
            value={exam.priority}
            onChange={(e) => updateExamField(examIndex, "priority", e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt[0].toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>

          {/* Topics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Topics</span>
              <button
                type="button"
                onClick={() => addTopic(examIndex)}
                className="text-xs text-blue-600"
              >
                + Add topic
              </button>
            </div>

            {exam.topics.map((topic, topicIndex) => (
              <div key={topicIndex} className="border rounded p-2 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={topic.name}
                    onChange={(e) =>
                      updateTopicField(examIndex, topicIndex, "name", e.target.value)
                    }
                    className="flex-1 border rounded px-2 py-1"
                    placeholder="Topic name"
                  />
                  <button
                    type="button"
                    onClick={() => removeTopic(examIndex, topicIndex)}
                    className="text-xs text-red-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Topic difficulty */}
                  <div>
                    <label className="text-xs font-medium">
                      Topic difficulty ({topic.difficulty})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={topic.difficulty}
                      onChange={(e) =>
                        updateTopicField(
                          examIndex,
                          topicIndex,
                          "difficulty",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Topic familiarity */}
                  <div>
                    <label className="text-xs font-medium">
                      Topic familiarity ({topic.familiarity})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={topic.familiarity}
                      onChange={(e) =>
                        updateTopicField(
                          examIndex,
                          topicIndex,
                          "familiarity",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Topic confidence */}
                  <div>
                    <label className="text-xs font-medium">
                      Topic confidence ({topic.confidence})
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={topic.confidence}
                      onChange={(e) =>
                        updateTopicField(
                          examIndex,
                          topicIndex,
                          "confidence",
                          Number(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Topic priority */}
                  <div>
                    <label className="text-xs font-medium">Topic priority</label>
                    <select
                      value={topic.priority}
                      onChange={(e) =>
                        updateTopicField(
                          examIndex,
                          topicIndex,
                          "priority",
                          e.target.value
                        )
                      }
                      className="w-full border rounded px-2 py-1 text-xs"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt[0].toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addExam}
        className="px-3 py-1 border rounded text-sm"
      >
        + Add exam
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
