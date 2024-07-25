import { useEffect } from "react";

import { SqProject } from "@quri/squiggle-lang";

// Useful for debugging.
export function useProjectActionLogger(project: SqProject) {
  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"action">>[1] = (
      event
    ) => {
      // eslint-disable-next-line no-console
      console.log("action", event.data);
    };
    project.addEventListener("action", listener);
    return () => project.removeEventListener("action", listener);
  }, [project]);

  useEffect(() => {
    const listener: Parameters<typeof project.addEventListener<"output">>[1] = (
      event
    ) => {
      // eslint-disable-next-line no-console
      console.log("output", event.data);
    };
    project.addEventListener("output", listener);
    return () => project.removeEventListener("output", listener);
  }, [project]);
}
