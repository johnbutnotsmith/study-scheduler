import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PlanPageLayout from "@/components/PlanPageLayout";
import { ExamPlanForm } from "@/components/ExamPlanForm";
import { generateExamPlan } from "@/api/client";
import ExamTimeline from "@/components/ExamTimeline";
import LoadingOverlay from "@/components/LoadingOverlay";

import type { ExamPlanRequest, ExamPlanResponse } from "@/types/domain";

export default function ExamPlanPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ExamPlanResponse["plan"] | null>(null);

  async function handleGenerate(payload: ExamPlanRequest): Promise<void> {
    setError(null);
    setLoading(true);
    setPlan(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await generateExamPlan(payload);

        if (!result.ok || !result.data) {
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

      <PlanPageLayout
        eyebrow="Study Scheduler"
        title="Exam Study Plan"
        subtitle="Add your subjects, define your availability, and generate a structured day‑by‑day exam plan."
      >
        <div className="space-y-6">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded border border-red-300">
              {error}
            </div>
          )}

          <ExamPlanForm onGenerate={handleGenerate} loading={loading} />

          {!loading && !plan && (
            <div className="text-center text-gray-600 py-10">
              <h3 className="text-lg font-semibold mb-2">No exam plan yet</h3>
              <p>Fill the form above to generate your exam study plan.</p>
            </div>
          )}

          {plan && (
            <div className="mt-6">
              <ExamTimeline plan={plan} />
            </div>
          )}
        </div>
      </PlanPageLayout>
    </AppLayout>
  );
}
