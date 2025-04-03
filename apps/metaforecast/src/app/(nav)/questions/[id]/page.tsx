import { notFound } from "next/navigation";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";

import { CaptureQuestion } from "@/web/questions/components/CaptureQuestion";
import { IndicatorsTable } from "@/web/questions/components/IndicatorsTable";
import { QuestionChartOrVisualization } from "@/web/questions/components/QuestionChartOrVisualization";
import { QuestionInfoRow } from "@/web/questions/components/QuestionInfoRow";
import { QuestionTitle } from "@/web/questions/components/QuestionTitle";
import { QuestionPageDocument } from "@/web/questions/queries.generated";
import { getUrqlRscClient } from "@/web/urql";

import { EmbedSection } from "./EmbedSection";
import { Section } from "./Section";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = getUrqlRscClient();

  const question =
    (await client.query(QuestionPageDocument, { id })).data?.result || null;

  if (!question) {
    notFound();
  }

  return (
    <div>
      <QuestionTitle question={question} />

      <div className="mb-5 mt-5">
        <QuestionInfoRow question={question} />
      </div>

      <div className="mb-10">
        <QuestionChartOrVisualization question={question} />
      </div>

      <div className="mx-auto max-w-prose space-y-8">
        <Section title="Question description" id="description">
          <div className="font-normal text-gray-900">
            <ReactMarkdown
              rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
            >
              {question.description.replaceAll("---", "")}
            </ReactMarkdown>
          </div>
        </Section>
        <Section title="Indicators" id="indicators">
          <IndicatorsTable question={question} />
        </Section>
        <Section title="Capture" id="capture">
          <CaptureQuestion question={question} />
        </Section>
        <EmbedSection question={question} />
      </div>
    </div>
  );
}
