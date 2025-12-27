import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { ExamPlanForm } from "@/components/ExamPlanForm";
import { generateExamPlan } from "@/api/client";
import ExamTimeline from "@/components/ExamTimeline";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function ExamPlanPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any | null>(null);

  async function handleGenerate(payload: any) {
    setError(null);
    setLoading(true);
    setPlan(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await generateExamPlan(payload);

        if (!result.ok) {
          throw new Error(result.error || "Failed to generate exam plan.");
        }

        setPlan(result.data.plan);
        setLoading(false);
        return;

      } catch (err) {
        attempts++;

        if (attempts < maxAttempts) {
          setError("Server is waking up… retrying");
          await new Promise((res) => setTimeout(res, 3000));
        } else {
          setError("Server unavailable. Please try again in 30 seconds.");
          setLoading(false);
        }
      }
    }
  }

  return (
    <AppLayout>
      <LoadingOverlay isVisible={loading} />

      <div className="max-w-3xl mx-auto space-y-6">

        {/* Error Box */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded border border-red-300">
            {error}
          </div>
        )}

        {/* Form */}
        <ExamPlanForm onGenerate={handleGenerate} loading={loading} />

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