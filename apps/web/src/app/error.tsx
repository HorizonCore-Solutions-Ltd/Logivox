'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App-level error caught by error.tsx boundary:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center bg-red-50/50 rounded-lg border border-red-100 m-8">
      <h2 className="text-2xl font-bold text-red-900 mb-4">Application Error Caught</h2>
      <p className="text-red-700 mb-6 max-w-lg">
        A background process or component crashed. Because we caught it here, it didn't unmount the entire app and wipe out your CSS!
      </p>
      <div className="bg-white p-4 rounded shadow-sm w-full max-w-2xl overflow-auto text-left mb-6">
        <code className="text-sm text-red-600 font-mono">{error.message}</code>
      </div>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Recover & Try Again
      </button>
    </div>
  );
}
