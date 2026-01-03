import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import ExamPlanPage from "@/pages/ExamPlanPage";
import WeeklyPlanPage from "@/pages/WeeklyPlanPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/exam" element={<ExamPlanPage />} />
        <Route path="/weekly" element={<WeeklyPlanPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
