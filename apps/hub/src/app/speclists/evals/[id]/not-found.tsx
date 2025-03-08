import React from "react";
import { Link } from "@/components/ui/Link";

export default function EvalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-bold mb-4">Evaluation Not Found</h2>
      <p className="text-gray-600 mb-6">
        The evaluation you're looking for doesn't exist or has been removed.
      </p>
      <Link
        href="/speclists/evals"
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
      >
        Back to Evaluations
      </Link>
    </div>
  );
}