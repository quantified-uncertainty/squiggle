import { format } from "date-fns";
import React from "react";

import { getAllEvals } from "@quri/evals";

import { Link } from "@/components/ui/Link";

export const metadata = {
  title: "Evaluations - Squiggle Hub",
};

export default async function EvalsPage() {
  const evals = await getAllEvals();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Evaluations</h2>
        <Link
          href="/speclists"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Spec Lists
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-md">
        {evals.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No evaluations found. Run evaluations using the CLI tool.
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Evaluator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Spec List
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Results Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {evals.map((eval_) => (
                <tr key={eval_.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {eval_.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {format(new Date(eval_.createdAt), "MMM d, yyyy h:mm a")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {eval_.evaluator}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <Link
                      href={`/speclists/${eval_.specList.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {eval_.specList.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {eval_._count.evalResults}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <Link
                      href={`/speclists/evals/${eval_.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
