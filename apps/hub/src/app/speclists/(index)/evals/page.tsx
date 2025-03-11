import { format } from "date-fns";
import React from "react";

import { StyledLink } from "@/components/ui/StyledLink";
import { getAllEvals } from "@/evals/data/evals";
import { evaluationRoute, speclistRoute } from "@/lib/routes";

export const metadata = {
  title: "Evaluations - Squiggle Hub",
};

export default async function EvalsPage() {
  const evals = await getAllEvals();

  return (
    <div>
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
              {evals.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <StyledLink href={evaluationRoute({ id: evaluation.id })}>
                      {evaluation.id}
                    </StyledLink>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {format(
                      new Date(evaluation.createdAt),
                      "MMM d, yyyy h:mm a"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {evaluation.evaluator}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <StyledLink
                      href={speclistRoute({ id: evaluation.specList.id })}
                    >
                      {evaluation.specList.name}
                    </StyledLink>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {evaluation._count.evalResults}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    (none)
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
