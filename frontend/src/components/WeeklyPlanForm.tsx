import { useState } from "react";

export function WeeklyPlanForm({ onGenerate, loading }: any) {
  const [weeklySubjects, setWeeklySubjects] = useState<any[]>([]);

  // Unified V2 availability (matches ExamPlanForm)
  const [availability] = useState({
    minutes_per_weekday: {
      Monday: 120,
      Tuesday: 120,
      Wednesday: 120,
      Thursday: 120,
      Friday: 120,
      Saturday: 180,
      Sunday: 180,
    },
    rest_days: [],
    start_date: "",
    end_date: "", // <-- REQUIRED for allocator consistency
  });

  const [settings] = useState({
    daily_study_limit_hours: 4,
    max_session_length_minutes: 50,
    break_length_minutes: 10,
    cognitive_load_sensitivity: 3,
    auto_rebalance: true,
  });

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
        confidence: 3,
        topics: [{ name: "" }],
      },
    ]);
  }

  function removeSubject(index: number) {
    setWeeklySubjects((prev) => prev.filter((_, i) => i !== index));
  }

  function updateSubject(index: number, field: string, value: any) {
    setWeeklySubjects((prev) =>
      prev.map((subj, i) =>
        i === index ? { ...subj, [field]: value } : subj
      )
    );
  }

  // -------------------------
  // TOPIC MANAGEMENT
  // -------------------------

  function addTopic(subjectIndex: number) {
    setWeeklySubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? { ...subj, topics: [...subj.topics, { name: "" }] }
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
              topics: subj.topics.filter((_: any, j: number) => j !== topicIndex),
            }
          : subj
      )
    );
  }

  function updateTopic(subjectIndex: number, topicIndex: number, value: string) {
    setWeeklySubjects((prev) =>
      prev.map((subj, i) =>
        i === subjectIndex
          ? {
              ...subj,
              topics: subj.topics.map((t, j) =>
                j === topicIndex ? { ...t, name: value } : t
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
    e.preventDefault(); // prevent navigation

    if (weeklySubjects.length === 0) {
      alert("Please add at least one subject before generating a plan.");
      return;
    }

    const payload = {
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

            <input
              className="w-full border p-2 rounded"
              placeholder="Subject name"
              value={subject.name}
              onChange={(e) => updateSubject(i, "name", e.target.value)}
              required
            />

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
              <label className="font-medium text-sm">Difficulty</label>
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
              <label className="font-medium text-sm">Confidence</label>
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

              {subject.topics.map((topic: any, tIndex: number) => (
                <div key={tIndex} className="flex items-center gap-2">
                  <input
                    className="flex-1 border p-2 rounded"
                    placeholder="Topic name"
                    value={topic.name}
                    onChange={(e) =>
                      updateTopic(i, tIndex, e.target.value)
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
              ))}
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>
    </div>
  );
}
