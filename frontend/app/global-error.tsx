"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (could send to external service here)
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-[#0a0a0f] text-white font-mono min-h-screen flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-[#ff6b6b] mb-4">
            SYSTEM ERROR
          </h1>
          <p className="text-gray-400 mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[#00ffff] text-black font-bold hover:bg-[#00cccc] transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      </body>
    </html>
  );
}
