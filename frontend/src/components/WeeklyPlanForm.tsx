import { useState } from "react";

export function WeeklyPlanForm({ onGenerate, loading }: any) {
  const [subjects, setSubjects] = useState("");
  const [hours, setHours] = useState(2);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      subjects: subjects.split(",").map(s => s.trim()).filter(Boolean),
      hours_per_day: hours,
    };

    onGenerate(payload);
  }

  function handleReset() {
    setSubjects("");
    setHours(2);
  }

  return (
    <div className="p-6 border rounded-lg bg-white shadow space-y-6">
      <h2 className="text-2xl font-semibold">Weekly Plan</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Subjects</label>
          <input
            className="w-full border p-2 rounded"
            placeholder="e.g. math, biology, chemistry"
            value={subjects}
            onChange={e => setSubjects(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Hours per day</label>
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