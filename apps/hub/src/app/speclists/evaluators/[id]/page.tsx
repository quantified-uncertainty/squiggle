import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { LlmConfigDisplay } from "@/ai/components/LlmConfigDisplay";
import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { KeyValue } from "@/components/ui/KeyValue";
import { StyledLink } from "@/components/ui/StyledLink";
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <H2>{evaluator.name}</H2>
            <p className="text-sm text-gray-500">ID: {evaluator.id}</p>
          </div>
          <StyledLink href={evaluatorsRoute()}>← Back to Evaluators</StyledLink>
        </div>

        <Card theme="big">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Evaluator Details</h3>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <KeyValue name="Type" value={evaluator.type} />
            <KeyValue
              name="Created"
              value={format(
                new Date(evaluator.createdAt),
                "MMM d, yyyy h:mm a"
              )}
            />
            <KeyValue
              name="Last Updated"
              value={format(
                new Date(evaluator.updatedAt),
                "MMM d, yyyy h:mm a"
              )}
            />
            <KeyValue
              name="Evaluations Count"
              value={evaluator._count.evals.toString()}
            />
          </div>
        </Card>

        <Card theme="big">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Configuration</h3>
          </div>

          {evaluator.config ? (
            <LlmConfigDisplay config={evaluator.config} />
          ) : (
            <p className="text-red-500">Configuration parsing error</p>
          )}
        </Card>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
