import { notFound } from "next/navigation";

import { QuestionChartOrVisualization } from "@/web/questions/components/QuestionChartOrVisualization";
import { QuestionInfoRow } from "@/web/questions/components/QuestionInfoRow";
import { QuestionPageDocument } from "@/web/questions/queries.generated";
import { getUrqlRscClient } from "@/web/urql";

export default async function QuestionEmbedPage({
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
    <div className="block min-h-screen bg-white">
      <div className="h-12/12 flex w-full flex-col p-2">
        <div className="mb-1 mt-1">
          <QuestionInfoRow question={question} />
        </div>

        <div className="mb-0">
          <QuestionChartOrVisualization question={question} />
        </div>
      </div>
    </div>
  );
}
