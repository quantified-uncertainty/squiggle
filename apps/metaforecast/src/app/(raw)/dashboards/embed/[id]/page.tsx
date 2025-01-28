import { notFound } from "next/navigation";

import { QuestionCardsList } from "@/app/(nav)/QuestionCardsList";
import { DashboardByIdDocument } from "@/web/dashboards/queries.generated";
import { getUrqlRscClient } from "@/web/urql";

export default async function ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: dashboardId } = await params;
  const client = getUrqlRscClient();
  const rawNumCols = (await searchParams)["numCols"];

  const response = await client.query(DashboardByIdDocument, {
    id: dashboardId,
  });

  if (!response.data) {
    throw new Error(`GraphQL query failed: ${response.error}`);
  }
  const dashboard = response.data.result;

  if (!dashboard) {
    notFound();
  }

  const numCols = !rawNumCols
    ? undefined
    : Number(rawNumCols) < 5
    ? Number(rawNumCols)
    : 4;

  return (
    <div className="mb-4 mt-3 flex flex-row justify-left items-center">
      <div className="mx-2 place-self-left">
        <div
          // FIXME - concatenated tailwind classes are unreliable
          className={`grid grid-cols-${numCols || 1} sm:grid-cols-${
            numCols || 1
          } md:grid-cols-${numCols || 2} lg:grid-cols-${
            numCols || 3
          } gap-4 mb-6`}
        >
          <QuestionCardsList results={dashboard.questions} />
        </div>
      </div>
    </div>
  );
}
