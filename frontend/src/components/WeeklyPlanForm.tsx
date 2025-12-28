import { useState } from "react";
import type {
  WeeklySubjectSpec,
  TopicSpec,
  WeeklyAvailabilitySpec,
  WeeklySettings,
  WeeklyPlanRequestV2,
} from "../api/types";

const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

const DEFAULT_MINUTES_PER_WEEKDAY: WeeklyAvailabilitySpec["minutes_per_weekday"] = {
  Monday: 120,
  Tuesday: 120,
  Wednesday: 120,
  Thursday: 120,
  Friday: 120,
  Saturday: 180,
  Sunday: 180,
};

const DEFAULT_WEEKLY_SETTINGS: WeeklySettings = {
  min_light_session: 20,
  max_subjects_per_day: 3,
  max_subjects_per_block: 2,
  deep_work_min: 60,
  deep_work_max: 90,
  medium_min: 40,
  medium_max: 60,
  light_min: 20,
  light_max: 40,
  min_sessions_per_subject_per_week: 1,
  max_sessions_per_subject_per_week: 7,
  difficulty_weight: 1.0,
  unfamiliarity_weight: 1.0,
  max_daily_minutes: 300,
};

export function WeeklyPlanForm({
  onGenerate,
  loading,
}: {
  onGenerate: (payload: WeeklyPlanRequestV2) => void;
  loading: boolean;
}) {
  const [weeklySubjects, setWeeklySubjects] = useState<WeeklySubjectSpec[]>([]);

  const [availability] = useState<WeeklyAvailabilitySpec>({
    start_date: new Date().toISOString().slice(0, 10),
    minutes_per_weekday: DEFAULT_MINUTES_PER_WEEKDAY,
    rest_days: [],
  });

  const [settings] = useState<WeeklySettings>(DEFAULT_WEEKLY_SETTINGS);

  // -------------------------
  // SUBJECT MANAGEMENT
  // -------------------------

  function addSubject() {
    setWeeklySubjects((prev) => [
      ...prev,
      {
        name: "",
        hours_per_week: 2,
        difficulty: 3,
        familiarity: 3,
        priority: "medium",
        topics: [
          {
            name: "",
            difficulty: 3,
            familiarity: 3,
            priority: "medium",
            confidence: 3,
          },
        ],
      },
    ]);
  }

  function removeSubject(index: number) {
    setWeeklySubjects((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSubject<K extends keyof WeeklySubjectSpec>(
    index: number,
    field: K,
    value: WeeklySubjectSpec[K]
  ) {
    setWeeklySubjects((prev) =>
      prev.map((subj, i) => (i === index ? { ...subj, [field]: value } : subj))
    );
  }

  // -------------------------
  // TOPIC MANAGEMENT
  // -------------------------

  function addTopic(subjectIndex: number) {
    setWeeklySubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? {
              ...subj,
              topics: [
                ...subj.topics,
                {
                  name: "",
                  difficulty: 3,
                  familiarity: 3,
                  priority: "medium",
                  confidence: 3,
                } as TopicSpec,
              ],
            }
          : subj
      )
    );
  }

  function removeTopic(subjectIndex: number, topicIndex: number) {
    setWeeklySubjects((prev) =>
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

  function updateTopicField<K extends keyof TopicSpec>(
    subjectIndex: number,
    topicIndex: number,
    field: K,
    value: TopicSpec[K]
  ) {
    setWeeklySubjects((prev) =>
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
  // SUBMIT HANDLING
  // -------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (weeklySubjects.length === 0) {
      alert("Please add at least one subject before generating a plan.");
      return;
    }

    const payload: WeeklyPlanRequestV2 = {
      weekly_subjects: weeklySubjects,
      availability,
      settings,
    };

    onGenerate(payload);
  }

  // -------------------------
  // RENDER
  // -------------------------

  return (
    <div className="p-6 border rounded-lg bg-white shadow space-y-6">
      <h2 className="text-2xl font-semibold">Weekly Plan (V2)</h2>

      <button
        type="button"
        onClick={addSubject}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        + Add Subject
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {weeklySubjects.map((subject, i) => (
          <div key={i} className="border p-4 rounded bg-gray-50 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Subject #{i + 1}</h3>
              <button
                type="button"
                onClick={() => removeSubject(i)}
                className="text-sm text-red-600"
              >
                Delete subject
              </button>
            </div>

            {/* Name */}
            <input
              className="w-full border p-2 rounded"
              placeholder="Subject name"
              value={subject.name}
              onChange={(e) => updateSubject(i, "name", e.target.value)}
              required
            />

            {/* Hours per week */}
            <input
              type="number"
              className="w-full border p-2 rounded"
              value={subject.hours_per_week}
              onChange={(e) =>
                updateSubject(i, "hours_per_week", Number(e.target.value))
              }
              required
            />

            {/* Difficulty */}
            <div>
              <label className="font-medium text-sm">
                Difficulty ({subject.difficulty})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={subject.difficulty}
                onChange={(e) =>
                  updateSubject(i, "difficulty", Number(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Familiarity */}
            <div>
              <label className="font-medium text-sm">
                Familiarity ({subject.familiarity})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={subject.familiarity}
                onChange={(e) =>
                  updateSubject(i, "familiarity", Number(e.target.value))
                }
                className="w-full"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="font-medium text-sm">Priority</label>
              <select
                value={subject.priority}
                onChange={(e) =>
                  updateSubject(i, "priority", e.target.value as any)
                }
                className="w-full border rounded px-2 py-1"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt[0].toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">Topics</span>
                <button
                  type="button"
                  onClick={() => addTopic(i)}
                  className="text-xs text-blue-600"
                >
                  + Add topic
                </button>
              </div>

              {subject.topics.map((topic, tIndex) => (
                <div key={tIndex} className="border rounded p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className="flex-1 border p-2 rounded"
                      placeholder="Topic name"
                      value={topic.name}
                      onChange={(e) =>
                        updateTopicField(i, tIndex, "name", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeTopic(i, tIndex)}
                      className="text-xs text-red-600"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {/* Topic difficulty */}
                    <div>
                      <label className="text-xs font-medium">
                        Difficulty ({topic.difficulty})
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={topic.difficulty}
                        onChange={(e) =>
                          updateTopicField(
                            i,
                            tIndex,
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
                        Familiarity ({topic.familiarity})
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={topic.familiarity}
                        onChange={(e) =>
                          updateTopicField(
                            i,
                            tIndex,
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
                        Confidence ({topic.confidence})
                      </label>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        value={topic.confidence}
                        onChange={(e) =>
                          updateTopicField(
                            i,
                            tIndex,
                            "confidence",
                            Number(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Topic priority */}
                    <div>
                      <label className="text-xs font-medium">Priority</label>
                      <select
                        value={topic.priority}
                        onChange={(e) =>
                          updateTopicField(
                            i,
                            tIndex,
                            "priority",
                            e.target.value as any
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
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Weekly Plan"}
        </button>
      </form>
    </div>
  );
}