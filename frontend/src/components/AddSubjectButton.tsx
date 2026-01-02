// src/components/AddSubjectButton.tsx

import React from "react";

interface AddSubjectButtonProps {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function AddSubjectButton({
  label = "Add subject",
  onClick,
  disabled,
}: AddSubjectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-2.5",
        "text-sm font-semibold shadow-sm transition-all",
        "bg-emerald-600 text-white hover:bg-emerald-500",
        "disabled:bg-emerald-300 disabled:cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <span className="inline-flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 border border-emerald-300/40">
          <span className="text-xs leading-none">+</span>
        </span>
        <span>{label}</span>
      </span>
    </button>
  );
}
