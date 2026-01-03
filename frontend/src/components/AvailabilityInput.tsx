// src/components/AvailabilityInput.tsx

import type { Weekday } from "../types/domain";

// UI-state shape (not the canonical domain type)
export interface AvailabilityValue {
  minutes_per_weekday: Record<Weekday, number>;
  start_date?: string;
  rest_dates?: string[];
}

interface AvailabilityInputProps {
  value: AvailabilityValue;
  onChange: (next: AvailabilityValue) => void;
}

const WEEKDAYS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function AvailabilityInput({
  value,
  onChange,
}: AvailabilityInputProps) {
  function updateMinutes(day: Weekday, minutes: number) {
    onChange({
      ...value,
      minutes_per_weekday: {
        ...value.minutes_per_weekday,
        [day]: isNaN(minutes) ? 0 : Math.max(0, minutes),
      },
    });
  }

  function updateStartDate(date: string) {
    onChange({
      ...value,
      start_date: date || undefined,
    });
  }

  const totalMinutes = WEEKDAYS.reduce(
    (acc, d) => acc + (value.minutes_per_weekday[d] || 0),
    0
  );
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Weekly availability
          </h3>
          <p className="text-xs text-slate-500">
            Tell us how much focused time you realistically have each day.
          </p>
        </div>
        <div className="text-xs font-medium text-slate-600">
          Total:{" "}
          <span className="font-semibold text-slate-900">
            {totalHours} h / week
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3">
        {WEEKDAYS.map((day) => (
          <label
            key={day}
            className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs shadow-sm"
          >
            <span className="mb-1 font-semibold text-slate-800">{day}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                step={15}
                className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                value={value.minutes_per_weekday[day] ?? 0}
                onChange={(e) => updateMinutes(day, Number(e.target.value))}
              />
              <span className="text-[11px] text-slate-500">min</span>
            </div>
          </label>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-800">
          Start date
        </label>
        <input
          type="date"
          className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          value={value.start_date ?? ""}
          onChange={(e) => updateStartDate(e.target.value)}
        />
      </div>
    </section>
  );
}
