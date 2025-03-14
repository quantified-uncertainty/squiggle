import React from "react";

import { Link } from "@/components/ui/Link";

export default function EvalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="mb-4 text-2xl font-bold">Evaluation Not Found</h2>
      <p className="mb-6 text-gray-600">
        {`The evaluation you're looking for doesn't exist or has been removed.`}
      </p>
      <Link
        href="/speclists/evals"
        className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
      >
        Back to Evaluations
      </Link>
    </div>
  );
}
