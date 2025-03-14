import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { LlmConfigDisplay } from "@/ai/components/LlmConfigDisplay";
import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { KeyValue } from "@/components/ui/KeyValue";
import { StyledLink } from "@/components/ui/StyledLink";
import { getEvalRunnerById } from "@/evals/data/evalRunners";
import { evalRunnersRoute } from "@/lib/routes";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const evalRunner = await getEvalRunnerById(id);
    return {
      title: `${evalRunner.name} Eval Runner - Squiggle Hub`,
    };
  } catch (error) {
    return {
      title: `Eval Runner: ${id} - Squiggle Hub`,
    };
  }
}

export default async function EvalRunnerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const runner = await getEvalRunnerById(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <H2>{runner.name}</H2>
            <p className="text-sm text-gray-500">ID: {runner.id}</p>
          </div>
          <StyledLink href={evalRunnersRoute()}>
            ← Back to Eval Runners
          </StyledLink>
        </div>

        <Card theme="big">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Eval Runner Details</h3>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <KeyValue name="Type" value={runner.type} />
            <KeyValue
              name="Created"
              value={format(new Date(runner.createdAt), "MMM d, yyyy h:mm a")}
            />
            <KeyValue
              name="Last Updated"
              value={format(new Date(runner.updatedAt), "MMM d, yyyy h:mm a")}
            />
            <KeyValue
              name="Evaluations Count"
              value={runner._count.evaluations.toString()}
            />
          </div>
        </Card>

        <Card theme="big">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Configuration</h3>
          </div>

          {runner.config ? (
            <LlmConfigDisplay config={runner.config} />
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
