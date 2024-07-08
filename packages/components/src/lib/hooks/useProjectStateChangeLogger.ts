import { useEffect } from "react";

import { SqProject } from "@quri/squiggle-lang";

// Useful for debugging.
export function useProjectStateChangeLogger(project: SqProject) {
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"state">>[1] = (
      event
    ) => {
      // eslint-disable-next-line no-console
      console.log("state", event.data);
    };
    project.addEventListener("state", listener);
    return () => project.removeEventListener("state", listener);
  }, [project]);
}
