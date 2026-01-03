import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  // Set page title dynamically without any dependencies
  useEffect(() => {
    if (pathname === "/weekly") {
      document.title = "Weekly Study Planner";
    } else if (pathname === "/exam") {
      document.title = "Exam Study Planner";
    } else {
      document.title = "Study Planner";
    }
  }, [pathname]);

  const linkBase = "font-medium transition-colors";
  const linkInactive = "text-gray-700 hover:text-blue-600";
  const linkActive = "text-blue-600 font-semibold";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Study Planner</h1>

          <nav className="space-x-4">
            <Link
              to="/weekly"
              className={`${linkBase} ${
                pathname === "/weekly" ? linkActive : linkInactive
              }`}
            >
              Weekly Plan
            </Link>

            <Link
              to="/exam"
              className={`${linkBase} ${
                pathname === "/exam" ? linkActive : linkInactive
              }`}
            >
              Exam Plan
            </Link>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
