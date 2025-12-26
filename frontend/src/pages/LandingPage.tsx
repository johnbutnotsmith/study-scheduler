import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <AppLayout>
      <div className="text-center space-y-8 py-16">

        <h1 className="text-4xl font-bold text-gray-900">
          Your Personal Study Planner
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Generate clean, structured study plans in seconds.  
          Weekly routines, exam preparation, and time‑based schedules — all automated.
        </p>

        <div className="flex justify-center space-x-6 mt-10">
          <Link
            to="/weekly"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700"
          >
            Weekly Plan
          </Link>

          <Link
            to="/exam"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-purple-700"
          >
            Exam Plan
          </Link>
        </div>

      </div>
    </AppLayout>
  );
}