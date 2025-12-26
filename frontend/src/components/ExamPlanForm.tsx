import { useState } from "react";

export function ExamPlanForm({ onGenerate, loading }: any) {
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState(2);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      topics: [subject],
      exam_date: examDate,
      hours_available: hours,
    };

    onGenerate(payload);
  }

  function handleReset() {
    setSubject("");
    setExamDate("");
    setHours(2);
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow space-y-6">
      <h2 className="text-2xl font-semibold">Exam Plan</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Subject</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="e.g. math"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Exam Date</label>
          <input
            type="date"
            className="w-full border p-2 rounded"
            value={examDate}
            onChange={e => setExamDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Hours Available</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={hours}
            onChange={e => setHours(Number(e.target.value))}
            required
          />
        </div>

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