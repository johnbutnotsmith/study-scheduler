const BASE_URL = "https://study-scheduler-mtqq.onrender.com";

async function request(path: string, payload: any) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // Try to parse JSON even on error
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        error: data?.detail || "Server error. Please try again.",
      };
    }

    return { ok: true, data };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || "Network error. Please try again.",
    };
  }
}

export async function generateWeeklyPlan(payload: any) {
  return request("/weekly/generate", payload);
}

export async function generateExamPlan(payload: any) {
  return request("/exam/generate", payload);
}
