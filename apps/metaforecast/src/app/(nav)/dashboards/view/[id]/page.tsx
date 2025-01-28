import Link from "next/link";
import { notFound } from "next/navigation";

import { QuestionCardsList } from "@/app/(nav)/QuestionCardsList";
import { InfoBox } from "@/web/common/InfoBox";
import { LineHeader } from "@/web/common/LineHeader";
import {
  DashboardByIdDocument,
  DashboardFragment,
} from "@/web/dashboards/queries.generated";
import { getUrqlRscClient } from "@/web/urql";

const DashboardMetadata: React.FC<{ dashboard: DashboardFragment }> = ({
  dashboard,
}) => (
  <div>
    {dashboard.title ? (
      <h1 className="mb-2 mt-2 text-center text-4xl text-gray-600">
        {dashboard.title}
      </h1>
    ) : null}

    {dashboard.creator ? (
      <p className="mb-2 mt-2 text-center text-lg text-gray-600">
        Created by:{" "}
        {dashboard.creator === "Clay Graubard" ? (
          <>
            @
            <a
              href="https://twitter.com/ClayGraubard"
              className="text-blue-600"
            >
              Clay Graubard
            </a>
          </>
        ) : (
          dashboard.creator
        )}
      </p>
    ) : null}

    {dashboard.description ? (
      <p className="mb-2 mt-2 text-center text-lg text-gray-600">
        {dashboard.description}
      </p>
    ) : null}
  </div>
);

export default async function DashboardsViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: dashboardId } = await params;
  const client = getUrqlRscClient();

  const dashboard = (
    await client.query(DashboardByIdDocument, { id: dashboardId }).toPromise()
  ).data?.result;

  if (!dashboard) {
    notFound();
  }

  return (
    <div className="my-8 flex flex-col space-y-8">
      <DashboardMetadata dashboard={dashboard} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <QuestionCardsList results={dashboard.questions} />
      </div>

      <div className="max-w-xl self-center">
        <InfoBox>Dashboards cannot be changed after they are created.</InfoBox>
      </div>

      <LineHeader>
        <Link href="/dashboards" passHref>
          Create your own dashboard
        </Link>
      </LineHeader>
    </div>
  );
}
