import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import PlanPageLayout from "@/components/PlanPageLayout";
import type { WeeklyPlanForm } from "@/components/WeeklyPlanForm";
import type { generateWeeklyPlan } from "@/api/client";
import WeeklyTimeline from "@/components/WeeklyTimeline";
import LoadingOverlay from "@/components/LoadingOverlay";

import type { WeeklyPlanRequest, WeeklyPlanResponse } from "@/types/domain";

export default function WeeklyPlanPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlanResponse["plan"] | null>(null);

  async function handleGenerate(payload: WeeklyPlanRequest): Promise<void> {
    setError(null);
    setLoading(true);
    setPlan(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await generateWeeklyPlan(payload);

        if (!result.ok || !result.data) {
          throw new Error(result.error || "Failed to generate weekly plan.");
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
        title="Weekly Study Plan"
        subtitle="Define your weekly availability, add subjects, and generate a realistic weekly study plan."
      >
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded border border-red-300">
            {error}
          </div>
        )}

        <WeeklyPlanForm onGenerate={handleGenerate} loading={loading} />

        {!loading && !plan && (
          <div className="text-center text-gray-600 py-10">
            <h3 className="text-lg font-semibold mb-2">No weekly plan yet</h3>
            <p>Fill the form above to generate your study plan.</p>
          </div>
        )}

        {plan && (
          <div className="mt-6">
            <WeeklyTimeline plan={plan} />
          </div>
        )}
      </PlanPageLayout>
    </AppLayout>
  );
}
