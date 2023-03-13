import { Choice } from "@/types";
import {
  result,
  SqDistribution,
  SqLambda,
  SqProject,
} from "@quri/squiggle-lang";
import { useEffect, useMemo, useState } from "react";
import { Filter } from "./types";

export const useRelativeValues = (code: string) => {
  const project = useMemo(() => SqProject.create(), []);

  const [error, setError] = useState("");
  const [fn, setFn] = useState<SqLambda | undefined>();

  useEffect(() => {
    project.setSource("main", code);

    setFn(undefined);

    const MAIN = "main";
    project.run(MAIN);

    const result = project.getResult(MAIN);
    if (!result.ok) {
      setError(
        `Failed to evaluate Squiggle code: ${result.value.toStringWithStackTrace()}`
      );
      return;
    }

    if (result.value.tag !== "Lambda") {
      setError(`Expected a function as result, got: ${result.value.tag}`);
      return;
    }
    setFn(result.value.value);
  }, [project, code]);

  return { error, fn, project };
};

export const useFilteredChoices = (choices: Choice[], filter: Filter) => {
  return useMemo(() => {
    return choices.filter((choice) =>
      choice.clusterId ? filter.selectedClusters.has(choice.clusterId) : true
    );
  }, [choices, filter]);
};

type CachedItem = result<SqDistribution, string>;
export type CachedPairs = {
  [k: string]: { [k: string]: CachedItem };
};

const buildCachedValue = (
  fn: SqLambda,
  id1: string,
  id2: string
): CachedItem => {
  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const value = result.value;
  if (value.tag !== "Dist") {
    return { ok: false, value: "Expected dist" };
  }
  // note: value.value is build in-the-fly, so caching won't work if we called it outside of this useMemo function
  return { ok: true, value: value.value };
};

export const useCachedPairsToOneItem = (
  fn: SqLambda,
  choices: Choice[],
  id2: string
): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < choices.length; i++) {
      const id1 = choices[i].id;

      pairs[id1] ??= {};
      pairs[id1][id2] = buildCachedValue(fn, id1, id2);
    }
    return pairs;
  }, [fn, choices, id2]);
};

export const useCachedPairs = (
  fn: SqLambda,
  choices: Choice[]
): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < choices.length; i++) {
      // note: iterate up to `i` to cache only half of the grid
      for (let j = 0; j < choices.length; j++) {
        const id1 = choices[i].id;
        const id2 = choices[j].id;

        pairs[id1] ??= {};
        pairs[id1][id2] = buildCachedValue(fn, id1, id2);
      }
    }
    return pairs;
  }, [fn, choices]);
};
