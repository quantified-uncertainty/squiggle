import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { H2 } from "@/components/ui/Headers";
import { StyledLink } from "@/components/ui/StyledLink";
import { EvaluatorConfigDisplay } from "@/evals/components/EvaluatorConfigDisplay";
import { getEvaluatorById } from "@/evals/data/evaluators";
import { evaluatorsRoute } from "@/lib/routes";

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { id: string } }) {
  try {
    const evaluator = await getEvaluatorById(params.id);
    return {
      title: `${evaluator.name} Evaluator - Squiggle Hub`,
    };
  } catch (error) {
    return {
      title: `Evaluator: ${params.id} - Squiggle Hub`,
    };
  }
}

export default async function EvaluatorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const evaluator = await getEvaluatorById(id);

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <H2>{evaluator.name}</H2>
            <p className="text-sm text-gray-500">ID: {evaluator.id}</p>
          </div>
          <StyledLink href={evaluatorsRoute()}>← Back to Evaluators</StyledLink>
        </div>

        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Details</h3>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <p className="text-gray-900">{evaluator.type}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-gray-900">
                {format(new Date(evaluator.createdAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-gray-900">
                {format(new Date(evaluator.updatedAt), "MMM d, yyyy h:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Evaluations Count
              </p>
              <p className="text-gray-900">{evaluator._count.evals}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Configuration</h3>
          </div>

          {evaluator.config ? (
            <EvaluatorConfigDisplay config={evaluator.config} />
          ) : (
            <p className="text-red-500">Configuration parsing error</p>
          )}
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
