import React, { FC } from 'react';

import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import rehypeExternalLinks from 'rehype-external-links';

import { Card } from '@/web/common/Card';
import { QuestionWithHistoryFragment } from '@/web/fragments.generated';
import { CaptureQuestion } from '@/web/questions/components/CaptureQuestion';
import { IndicatorsTable } from '@/web/questions/components/IndicatorsTable';
import {
  QuestionChartOrVisualization,
} from '@/web/questions/components/QuestionChartOrVisualization';
import { QuestionInfoRow } from '@/web/questions/components/QuestionInfoRow';
import { QuestionTitle } from '@/web/questions/components/QuestionTitle';
import { QuestionPageDocument } from '@/web/questions/queries.generated';
import { getUrqlRscClient } from '@/web/urql';

import { EmbedSection } from './EmbedSection';
import { Section } from './Section';

const LargeQuestionCard: FC<{
  question: QuestionWithHistoryFragment;
}> = ({ question }) => {
  return (
    <Card highlightOnHover={false} large>
      <QuestionTitle question={question} />

      <div className="mb-5 mt-5">
        <QuestionInfoRow question={question} />
      </div>

      <div className="mb-10">
        <QuestionChartOrVisualization question={question} />
      </div>

      <div className="mx-auto max-w-prose space-y-8">
        <Section title="Question description" id="description">
          <ReactMarkdown
            rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
            className="font-normal text-gray-900"
          >
            {question.description.replaceAll("---", "")}
          </ReactMarkdown>
        </Section>
        <Section title="Indicators" id="indicators">
          <IndicatorsTable question={question} />
        </Section>
        <Section title="Capture" id="capture">
          <CaptureQuestion question={question} />
        </Section>
        <EmbedSection question={question} />
      </div>
    </Card>
  );
};

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
          <ReactMarkdown
            rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
            className="font-normal text-gray-900"
          >
            {question.description.replaceAll("---", "")}
          </ReactMarkdown>
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
