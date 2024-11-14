import { Fragment } from "react";

import { H2 } from "@/components/ui/Headers";
import { getTypeStats } from "@/server/ai/analytics";

export default async function () {
  const typeStats = await getTypeStats();
  return (
    <div className="space-y-4">
      {Object.entries(typeStats).map(([stepName, typeCounts]) => (
        <div key={stepName}>
          <H2>{stepName}</H2>
          <div className="grid w-40 grid-cols-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Fragment key={type}>
                <span>{type}</span>
                <span>{count}</span>
              </Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
