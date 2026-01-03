import type { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import WeeklyPlanPage from "@/pages/WeeklyPlanPage";
import ExamPlanPage from "@/pages/ExamPlanPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/weekly" element={<WeeklyPlanPage />} />
        <Route path="/exam" element={<ExamPlanPage />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
