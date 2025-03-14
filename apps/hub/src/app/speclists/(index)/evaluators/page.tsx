import { format } from "date-fns";
import React from "react";

import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { getAllEvaluators } from "@/evals/data/evaluators";
import { evaluatorRoute } from "@/lib/routes";

export const metadata = {
  title: "Evaluators - Squiggle Hub",
};

export default async function EvaluatorsPage() {
  const evaluators = await getAllEvaluators();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <H2>Evaluators</H2>
      </div>

      <div className="rounded-lg bg-white shadow-md">
        {evaluators.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {`No evaluators found. Use the "Create Evaluator" button to add one.`}
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Evals Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {evaluators.map((evaluator) => (
                <tr key={evaluator.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <StyledLink href={evaluatorRoute({ id: evaluator.id })}>
                      {evaluator.id}
                    </StyledLink>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {evaluator.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {evaluator.type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {format(
                      new Date(evaluator.createdAt),
                      "MMM d, yyyy h:mm a"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {evaluator._count.Eval}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <StyledLink href={evaluatorRoute({ id: evaluator.id })}>
                      View
                    </StyledLink>
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
