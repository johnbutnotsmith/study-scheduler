import { useState } from "react";

export function WeeklyPlanForm({ onGenerate, loading }: any) {
  const [weeklySubjects, setWeeklySubjects] = useState<any[]>([]);

  // Default availability + settings (minimal version)
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
  });

  const [settings] = useState({
    daily_study_limit_hours: 4,
    max_session_length_minutes: 50,
    break_length_minutes: 10,
    cognitive_load_sensitivity: 3,
    auto_rebalance: true,
  });

  function addSubject() {
    setWeeklySubjects([
      ...weeklySubjects,
      {
        id: "",
        name: "",
        hours_per_week: 2,
        difficulty: 3,
        familiarity: 3,
        priority: "medium",
        topics: [],
      },
    ]);
  }

  function updateSubject(index: number, field: string, value: any) {
    const updated = [...weeklySubjects];
    updated[index][field] = value;
    setWeeklySubjects(updated);
  }

  function addTopic(subjectIndex: number) {
    const updated = [...weeklySubjects];
    updated[subjectIndex].topics.push({
      id: "",
      name: "",
      difficulty: 3,
      familiarity: 3,
      priority: "medium",
      confidence: 3,
    });
    setWeeklySubjects(updated);
  }

  function updateTopic(subjectIndex: number, topicIndex: number, field: string, value: any) {
    const updated = [...weeklySubjects];
    updated[subjectIndex].topics[topicIndex][field] = value;
    setWeeklySubjects(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    if (weeklySubjects.length === 0) {
      alert("Please add at least one subject before generating a plan.");
      return;
    }
    e.preventDefault();

    const payload = {
      weekly_subjects: weeklySubjects,
      availability,
      settings,
    };

    onGenerate(payload);
  }

  function handleReset() {
    setWeeklySubjects([]);
  }

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
            <h3 className="font-semibold text-lg">Subject #{i + 1}</h3>

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

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label>Difficulty</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={subject.difficulty}
                  onChange={(e) =>
                    updateSubject(i, "difficulty", Number(e.target.value))
                  }
                />
              </div>

              <div>
                <label>Familiarity</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={subject.familiarity}
                  onChange={(e) =>
                    updateSubject(i, "familiarity", Number(e.target.value))
                  }
                />
              </div>

              <div>
                <label>Priority</label>
                <select
                  className="border p-2 rounded w-full"
                  value={subject.priority}
                  onChange={(e) =>
                    updateSubject(i, "priority", e.target.value)
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <h4 className="font-medium">Topics (optional)</h4>

              {subject.topics.map((topic: any, tIndex: number) => (
                <div key={tIndex} className="border p-3 rounded bg-white space-y-2">
                  <input
                    className="w-full border p-2 rounded"
                    placeholder="Topic name"
                    value={topic.name}
                    onChange={(e) =>
                      updateTopic(i, tIndex, "name", e.target.value)
                    }
                  />

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label>Difficulty</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={topic.difficulty}
                        onChange={(e) =>
                          updateTopic(i, tIndex, "difficulty", Number(e.target.value))
                        }
                      />
                    </div>

                    <div>
                      <label>Familiarity</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={topic.familiarity}
                        onChange={(e) =>
                          updateTopic(i, tIndex, "familiarity", Number(e.target.value))
                        }
                      />
                    </div>

                    <div>
                      <label>Priority</label>
                      <select
                        className="border p-2 rounded w-full"
                        value={topic.priority}
                        onChange={(e) =>
                          updateTopic(i, tIndex, "priority", e.target.value)
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label>Confidence</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={topic.confidence}
                        onChange={(e) =>
                          updateTopic(i, tIndex, "confidence", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addTopic(i)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                + Add Topic
              </button>
            </div>
          </div>
        ))}

        <div className="flex items-center space-x-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded border"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}