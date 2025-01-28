"use client";
import { useRouter } from "next/navigation";
import { useMutation } from "urql";

import { LineHeader } from "../../../web/common/LineHeader";
import { CreateDashboardDocument } from "../../../web/dashboards/queries.generated";
import { DashboardCreator } from "../../../web/display/DashboardCreator";

export default function () {
  const router = useRouter();
  const [createDashboardResult, createDashboard] = useMutation(
    CreateDashboardDocument
  );

  const handleSubmit = async (data: any) => {
    const result = await createDashboard({
      input: {
        title: data.title,
        description: data.description,
        creator: data.creator,
        ids: data.ids,
      },
    });
    const dashboardId = result?.data?.result?.dashboard?.id;
    if (!dashboardId) {
      throw new Error("Couldn't create a dashboard"); // TODO - toaster
    }
    router.push(`/dashboards/view/${dashboardId}`);
  };

  return (
    <div className="flex flex-col my-8 space-y-8">
      <LineHeader>Create a dashboard!</LineHeader>

      <div className="self-center">
        <DashboardCreator handleSubmit={handleSubmit} />
      </div>
    </div>
  );
}
