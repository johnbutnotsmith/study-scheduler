import { useState } from "react";

export function ExamPlanForm({ onGenerate, loading }: any) {
  const [exams, setExams] = useState<any[]>([]);
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

  function addExam() {
    setExams([
      ...exams,
      {
        id: "",
        subject: "",
        exam_date: "",
        hours_available: 2,
        difficulty: 3,
        familiarity: 3,
        priority: "medium",
        topics: [],
      },
    ]);
  }

  function updateExam(index: number, field: string, value: any) {
    const updated = [...exams];
    updated[index][field] = value;
    setExams(updated);
  }

  function addTopic(examIndex: number) {
    const updated = [...exams];
    updated[examIndex].topics.push({
      id: "",
      name: "",
      difficulty: 3,
      familiarity: 3,
      priority: "medium",
      confidence: 3,
    });
    setExams(updated);
  }

  function updateTopic(examIndex: number, topicIndex: number, field: string, value: any) {
    const updated = [...exams];
    updated[examIndex].topics[topicIndex][field] = value;
    setExams(updated);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      exams,
      availability,
      settings,
    };

    onGenerate(payload);
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow space-y-6">
      <h2 className="text-2xl font-semibold">Exam Plan (V2)</h2>

      <button
        type="button"
        onClick={addExam}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        + Add Exam
      </button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {exams.map((exam, i) => (
          <div key={i} className="border p-4 rounded bg-gray-50 space-y-4">
            <h3 className="font-semibold text-lg">Exam #{i + 1}</h3>

            <input
              className="w-full border p-2 rounded"
              placeholder="Subject"
              value={exam.subject}
              onChange={(e) => updateExam(i, "subject", e.target.value)}
              required
            />

            <input
              type="date"
              className="w-full border p-2 rounded"
              value={exam.exam_date}
              onChange={(e) => updateExam(i, "exam_date", e.target.value)}
              required
            />

            <input
              type="number"
              className="w-full border p-2 rounded"
              value={exam.hours_available}
              onChange={(e) => updateExam(i, "hours_available", Number(e.target.value))}
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label>Difficulty</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={exam.difficulty}
                  onChange={(e) => updateExam(i, "difficulty", Number(e.target.value))}
                />
              </div>

              <div>
                <label>Familiarity</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={exam.familiarity}
                  onChange={(e) => updateExam(i, "familiarity", Number(e.target.value))}
                />
              </div>

              <div>
                <label>Priority</label>
                <select
                  className="border p-2 rounded w-full"
                  value={exam.priority}
                  onChange={(e) => updateExam(i, "priority", e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <h4 className="font-medium">Topics</h4>

              {exam.topics.map((topic: any, tIndex: number) => (
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

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
      </form>
    </div>
  );
}
