import { useEffect, useState } from "react";

const rotatingMessages = [
  "Analyzing your inputs…",
  "Building your study structure…",
  "Optimizing your timeline…",
  "Finalizing your plan…"
];

export default function LoadingOverlay({ isVisible }: { isVisible: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mb-6"></div>

      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Generating your personalized study plan…
      </h2>

      <p className="text-gray-600 mb-1">This may take 20–30 seconds.</p>
      <p className="text-gray-500 text-sm mb-6">
        The server may take a moment to wake up.
      </p>

      <p className="text-gray-700 font-medium">
        {rotatingMessages[messageIndex]}
      </p>
    </div>
  );
}
