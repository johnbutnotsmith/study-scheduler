// src/components/PlanPageLayout.tsx

import React from "react";

interface PlanPageLayoutProps {
  title: string;
  subtitle?: string;
  /** Optional small label above the title, e.g. "Planner" or "Study Scheduler" */
  eyebrow?: string;
  /** Optional right‑side header actions (e.g. future: "Export", "Help") */
  headerActions?: React.ReactNode;
  /** Main content: form fields, subject lists, buttons, etc. */
  children: React.ReactNode;
}

export default function PlanPageLayout({
  title,
  subtitle,
  eyebrow,
  headerActions,
  children,
}: PlanPageLayoutProps) {
  console.log("PlanPageLayout rendered");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top page heading area */}
        <header className="mb-6">
          {eyebrow && (
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 mb-1">
              {eyebrow}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>

            {headerActions && (
              <div className="mt-2 sm:mt-0 flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* Main card */}
        <main className="bg-white/95 backdrop-blur-sm shadow-[0_18px_45px_rgba(15,23,42,0.06)] border border-slate-100 rounded-2xl px-4 sm:px-6 py-5 sm:py-6 space-y-6">
          {/* Optional subtle divider under the header area inside the card if needed later */}
          {children}
        </main>

        {/* Optional bottom meta section (future: tips, legal, etc.) */}
        {/* <footer className="mt-4 text-xs text-slate-400 text-right">
          Need help planning? You’ll add onboarding/help links here later.
        </footer> */}
      </div>
    </div>
  );
}
