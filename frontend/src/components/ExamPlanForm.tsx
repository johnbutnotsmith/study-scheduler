import React, { useState } from "react";

type Topic = {
  name: string;
};

type Exam = {
  subject: string;
  exam_date: string;
  difficulty: number;
  confidence: number;
  topics: Topic[];
};

export function ExamPlanForm({
  onGenerate,
  loading,
}: {
  onGenerate: (payload: any) => void;
  loading: boolean;
}) {
  const [exams, setExams] = useState<Exam[]>([]);

  // REQUIRED for allocator (fixes KeyError: 'end_date')
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
    end_date: "", // <-- REQUIRED
  });

  const [settings] = useState({
    daily_study_limit_hours: 4,
    max_session_length_minutes: 50,
    break_length_minutes: 10,
    cognitive_load_sensitivity: 3,
    auto_rebalance: true,
  });

  // -------------------------
  // EXAM MANAGEMENT
  // -------------------------

  function addExam() {
    setExams((prev) => [
      ...prev,
      {
        subject: "",
        exam_date: "",
        difficulty: 3,
        confidence: 3,
        topics: [{ name: "" }],
      },
    ]);
  }

  function removeExam(index: number) {
    setExams((prev) => prev.filter((_, i) => i !== index));
  }

  function updateExamField(
    index: number,
    field: keyof Exam,
    value: string | number
  ) {
    setExams((prev) =>
      prev.map((exam, i) =>
        i === index ? { ...exam, [field]: value } : exam
      )
    );
  }

  // -------------------------
  // TOPIC MANAGEMENT
  // -------------------------

  function addTopic(examIndex: number) {
    setExams((prev) =>
      prev.map((exam, i) =>
        i === examIndex
          ? { ...exam, topics: [...exam.topics, { name: "" }] }
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

  function updateTopicName(
    examIndex: number,
    topicIndex: number,
    value: string
  ) {
    setExams((prev) =>
      prev.map((exam, i) =>
        i === examIndex
          ? {
              ...exam,
              topics: exam.topics.map((t, j) =>
                j === topicIndex ? { ...t, name: value } : t
              ),
            }
          : exam
      )
    );
  }

  // -------------------------
  // SUBMIT HANDLING
  // -------------------------

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // prevent navigation

    if (exams.length === 0) {
      alert("Please add at least one exam before generating a plan.");
      return;
    }

    const payload = {
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
        <div key={examIndex} className="border rounded p-4 space-y-2">
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
            onChange={(e) =>
              updateExamField(examIndex, "subject", e.target.value)
            }
            className="w-full border rounded px-2 py-1"
            placeholder="Subject"
          />

          {/* Exam date */}
          <input
            type="date"
            value={exam.exam_date}
            onChange={(e) =>
              updateExamField(examIndex, "exam_date", e.target.value)
            }
            className="w-full border rounded px-2 py-1"
          />

          {/* Difficulty */}
          <label className="text-sm font-medium">Difficulty</label>
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

          {/* Confidence */}
          <label className="text-sm font-medium">Confidence</label>
          <input
            type="range"
            min={1}
            max={5}
            value={exam.confidence}
            onChange={(e) =>
              updateExamField(examIndex, "confidence", Number(e.target.value))
            }
            className="w-full"
          />

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
              <div key={topicIndex} className="flex items-center gap-2">
                <input
                  type="text"
                  value={topic.name}
                  onChange={(e) =>
                    updateTopicName(examIndex, topicIndex, e.target.value)
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
