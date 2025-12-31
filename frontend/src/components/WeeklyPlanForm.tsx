import { useState } from "react";
import type {
  WeeklySubject,
  Topic,
  WeeklyAvailability,
  WeeklyPlanRequest,
} from "../api/types";

const DEFAULT_MINUTES_PER_WEEKDAY: WeeklyAvailability["minutes_per_weekday"] = {
  Monday: 120,
  Tuesday: 120,
  Wednesday: 120,
  Thursday: 120,
  Friday: 120,
  Saturday: 180,
  Sunday: 180,
};

export function WeeklyPlanForm({
  onGenerate,
  loading,
}: {
  onGenerate: (payload: WeeklyPlanRequest) => void;
  loading: boolean;
}) {
  const [subjects, setSubjects] = useState<WeeklySubject[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<number>(5);

  const [availability] = useState<WeeklyAvailability>({
    start_date: new Date().toISOString().slice(0, 10),
    minutes_per_weekday: DEFAULT_MINUTES_PER_WEEKDAY,
    rest_dates: [],
  });

  // -------------------------
  // SUBJECT MANAGEMENT
  // -------------------------

  function addSubject() {
    setSubjects((prev) => [
      ...prev,
      {
        name: "",
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

  function updateSubject<K extends keyof WeeklySubject>(
    index: number,
    field: K,
    value: WeeklySubject[K]
  ) {
    setSubjects((prev) =>
      prev.map((subj, i) => (i === index ? { ...subj, [field]: value } : subj))
    );
  }

  // -------------------------
  // TOPIC MANAGEMENT
  // -------------------------

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
  // SUBMIT HANDLING
  // -------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (subjects.length === 0) {
      alert("Please add at least one subject.");
      return;
    }

    const payload: WeeklyPlanRequest = {
      subjects,
      weekly_hours: weeklyHours,
      availability,
    };

    onGenerate(payload);
  }

  // -------------------------
  // RENDER
  // -------------------------

  return (
    <div className="p-6 border rounded-lg bg-white shadow space-y-6">
      <h2 className="text-2xl font-semibold">Weekly Plan</h2>

      {/* Weekly hours */}
      <div>
        <label className="font-medium text-sm">
          Total weekly hours ({weeklyHours})
        </label>
        <input
          type="range"
          min={1}
          max={40}
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        type="button"
        onClick={addSubject}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        + Add Subject
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {subjects.map((subject, i) => (
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

            {/* Confidence */}
            <div>
              <label className="font-medium text-sm">
                Confidence ({subject.confidence})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={subject.confidence}
                onChange={(e) =>
                  updateSubject(i, "confidence", Number(e.target.value))
                }
                className="w-full"
              />
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
                            i,
                            tIndex,
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
                            i,
                            tIndex,
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
