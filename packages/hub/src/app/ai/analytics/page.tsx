import { Fragment } from "react";

import { getTypeStats } from "@/ai/data/analytics";
import { H2 } from "@/components/ui/Headers";

export default async function AiAnalyticsPage() {
  const typeStats = await getTypeStats();
  return (
    <div className="space-y-4">
      {Object.entries(typeStats).map(([stepName, typeCounts]) => (
        <div key={stepName} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <H2>{stepName}</H2>
          </div>
          {Object.entries(typeCounts).map(([type, count]) => (
            <Fragment key={type}>
              <span>{type}</span>
              <span>{count}</span>
            </Fragment>
          ))}
        </div>
      ))}
    </div>
  );
}
