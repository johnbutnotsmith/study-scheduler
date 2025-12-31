import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { WeeklyPlanForm } from "@/components/WeeklyPlanForm";
import { generateWeeklyPlan } from "@/api/client";
import WeeklyTimeline from "@/components/WeeklyTimeline";
import LoadingOverlay from "@/components/LoadingOverlay";
import type { WeeklyPlanRequest, WeeklyPlanResponse } from "@/api/types";

export default function WeeklyPlanPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<WeeklyPlanResponse["plan"] | null>(null);

  async function handleGenerate(payload: WeeklyPlanRequest) {
    setError(null);
    setLoading(true);
    setPlan(null);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const result = await generateWeeklyPlan(payload);

        if (!result.ok) {
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

      <div className="max-w-3xl mx-auto space-y-6">

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
      </div>
    </AppLayout>
  );
}