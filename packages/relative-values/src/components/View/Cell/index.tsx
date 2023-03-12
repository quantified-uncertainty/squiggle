import { SqProject } from "@quri/squiggle-lang";
import { FC, memo } from "react";
import { ErrorCell } from "./ErrorCell";
import { CachedPairs } from "../hooks";
import { DistCell } from "./DistCell";

export const Cell: FC<{
  id1: string;
  id2: string;
  cache: CachedPairs;
  project: SqProject;
}> = memo(function CachedCell({ id1, id2, cache, project }) {
  const result = cache[id1][id2];
  if (!result) {
    return <ErrorCell error="Internal error, missing data" />;
  }

  if (!result.ok) {
    return <ErrorCell error={result.value} />;
  }

  return <DistCell dist={result.value} env={project.getEnvironment()} />;
});
