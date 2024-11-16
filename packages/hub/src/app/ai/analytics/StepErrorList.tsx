import { FC, Fragment } from "react";

import { H2 } from "@/components/ui/Headers";
import { type StepError } from "@/server/ai/analytics";

export const StepErrorList: FC<{
  errors: StepError[];
  title: string;
  stats?: Record<string, number>;
}> = ({ errors, title, stats = {} }) => {
  return (
    <div>
      <H2>{title}</H2>
      <strong>Total: {errors.length}</strong>
      <div className="my-4 grid grid-cols-2 gap-x-4">
        {Object.entries(stats).map(([type, count]) => (
          <Fragment key={type}>
            <div>{type}</div>
            <strong>{count}</strong>
          </Fragment>
        ))}
      </div>
      <div className="space-y-4">
        {errors.map((error, i) => (
          <div key={i}>
            <div className="text-sm">
              <strong>{error.stepName}</strong>{" "}
              <span className="text-gray-500">
                ({error.date.toISOString()})
              </span>
            </div>
            <pre key={i} className="whitespace-pre-wrap text-xs">
              {error.error}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};
