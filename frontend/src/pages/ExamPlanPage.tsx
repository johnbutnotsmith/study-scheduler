import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ExamPlanForm } from "@/components/ExamPlanForm";
import { generateExamPlan } from "@/api/client";
import ExamTimeline from "@/components/ExamTimeline";

export default function ExamPlanPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  async function handleGenerate(payload: any) {
    setError(null);
    setLoading(true);
    setPlan(null);

    const result = await generateExamPlan(payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Failed to generate exam plan.");
      return;
    }

    setPlan(result.data.plan);
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Error Box */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded border border-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <ExamPlanForm onGenerate={handleGenerate} loading={loading} />

        {/* Loading */}
        {loading && (
          <div className="text-gray-600 text-center mt-4">
            Generating plan…
          </div>
        )}

        {/* Empty State */}
        {!loading && !plan && (
          <div className="text-center text-gray-600 py-10">
            <h3 className="text-lg font-semibold mb-2">No exam plan yet</h3>
            <p>Fill the form above to generate your exam study plan.</p>
          </div>
        )}

        {/* Timeline */}
        {plan && (
          <div className="mt-6">
            <ExamTimeline plan={plan} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}