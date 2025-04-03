import { format } from "date-fns";
import { notFound } from "next/navigation";
import React from "react";

import { LlmConfigDisplay } from "@/ai/components/LlmConfigDisplay";
import { Card } from "@/components/ui/Card";
import { H2 } from "@/components/ui/Headers";
import { KeyValue } from "@/components/ui/KeyValue";
import { StyledLink } from "@/components/ui/StyledLink";
import { getEpistemicAgentById } from "@/evals/data/epistemicAgents";
import { epistemicAgentsRoute } from "@/lib/routes";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const epistemicAgent = await getEpistemicAgentById(id);
    return {
      title: `${epistemicAgent.name} Epistemic Agent - Squiggle Hub`,
    };
  } catch (error) {
    return {
      title: `Epistemic Agent: ${id} - Squiggle Hub`,
    };
  }
}

export default async function EpistemicAgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    const epistemicAgent = await getEpistemicAgentById(id);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <H2>{epistemicAgent.name}</H2>
            <p className="text-sm text-gray-500">ID: {epistemicAgent.id}</p>
          </div>
          <StyledLink href={epistemicAgentsRoute()}>
            ← All Epistemic Agents
          </StyledLink>
        </div>

        <Card theme="big">
          <div className="mb-4">
            <h3 className="text-lg font-medium">Epistemic Agent Details</h3>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <KeyValue name="Type" value={epistemicAgent.type} />
            <KeyValue
              name="Created"
              value={format(
                new Date(epistemicAgent.createdAt),
                "MMM d, yyyy h:mm a"
              )}
            />
            <KeyValue
              name="Last Updated"
              value={format(
                new Date(epistemicAgent.updatedAt),
                "MMM d, yyyy h:mm a"
              )}
            />
            <KeyValue
              name="Evaluations Count"
              value={epistemicAgent._count.evaluations.toString()}
            />
          </div>
        </Card>

        {epistemicAgent.config && epistemicAgent.type === "SquiggleAI" && (
          <Card theme="big">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Configuration</h3>
            </div>

            <LlmConfigDisplay config={epistemicAgent.config} />
          </Card>
        )}
      </div>
    );
  } catch (error) {
    notFound();
  }
}
