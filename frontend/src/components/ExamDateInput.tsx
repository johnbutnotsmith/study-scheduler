// src/components/ExamDateInput.tsx


interface ExamDateInputProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  helperText?: string;
}

function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ExamDateInput({
  value,
  onChange,
  label = "Exam date",
  helperText = "We’ll plan backwards from this date.",
}: ExamDateInputProps) {
  const [error, setError] = useState<string | null>(null);

  function handleChange(next: string) {
    onChange(next);

    if (!next) {
      setError("Please choose an exam date.");
      return;
    }

    const today = todayISO();
    if (next < today) {
      setError("Exam date cannot be in the past.");
    } else {
      setError(null);
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-800">{label}</label>
      <input
        type="date"
        className={[
          "w-full rounded-md border px-2 py-1.5 text-sm shadow-sm",
          error
            ? "border-red-300 text-red-900 focus:outline-none focus:ring-2 focus:ring-red-400/60"
            : "border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/60",
        ].join(" ")}
        min={todayISO()}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />
      <p className="text-[11px] text-slate-500">{helperText}</p>
      {error && (
        <p className="text-[11px] text-red-600 font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
}
