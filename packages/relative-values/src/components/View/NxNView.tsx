import {
  result,
  SqDistribution,
  SqLambda,
  SqProject,
} from "@quri/squiggle-lang";
import clsx from "clsx";
import { FC, memo, useCallback, useContext, useMemo } from "react";
import { DropdownButton } from "../ui/DropdownButton";
import { AxisFilter } from "./AxisFilter";
import { Cell } from "./Cell";
import { CellError } from "./CellError";
import { ClusterIcon } from "./ClusterIcon";
import { GridModeControls } from "./GridModeControls";
import { Choice, Clusters } from "@/types";
import { Filter, ViewContext } from "./ViewProvider";

const Header: FC<{
  choice: Choice;
  th?: boolean;
  clusters: Clusters;
}> = ({ choice, th, clusters }) => {
  const Tag = th ? "th" : "td";
  const cluster = choice.clusterId ? clusters[choice.clusterId] : undefined;
  return (
    <Tag className="font-bold border border-gray-200 bg-gray-50 p-1">
      <div className={clsx("text-xs", th && "w-40")}>
        {cluster ? (
          <div className="float-right px-0.5">
            <ClusterIcon cluster={cluster} />
          </div>
        ) : null}
        {choice.name}
      </div>
    </Tag>
  );
};

type CachedItem = result<SqDistribution, string>;
type CachedPairs = {
  [k: string]: { [k: string]: CachedItem };
};

const useCachedPairs = (fn: SqLambda, choices: Choice[]): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < choices.length; i++) {
      // note: iterate up to `i` to cache only half of the grid
      for (let j = 0; j < choices.length; j++) {
        const id1 = choices[i].id;
        const id2 = choices[j].id;

        const buildValue = (): CachedItem => {
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

        pairs[id1] ??= {};
        pairs[id1][id2] = buildValue();
      }
    }
    return pairs;
  }, [fn, choices]);
};

const useFilteredChoices = (choices: Choice[], filter: Filter) => {
  return useMemo(() => {
    return choices.filter((choice) =>
      choice.clusterId ? filter.selectedClusters.has(choice.clusterId) : true
    );
  }, [choices, filter]);
};

const CachedCell: FC<{
  id1: string;
  id2: string;
  cache: CachedPairs;
  project: SqProject;
}> = memo(function CachedCell({ id1, id2, cache, project }) {
  const result = cache[id1][id2];
  if (!result) {
    return <CellError error="Internal error, missing data" />;
  }

  if (!result.ok) {
    return <CellError error={result.value} />;
  }

  return <Cell dist={result.value} env={project.getEnvironment()} />;
});

export const NxNView: FC<{
  project: SqProject;
  fn: SqLambda;
  choices: Choice[];
}> = ({ project, fn, choices }) => {
  const { clusters, filters, gridMode } = useContext(ViewContext);

  const rowChoices = useFilteredChoices(choices, filters.rows);
  const columnChoices = useFilteredChoices(choices, filters.columns);

  const allPairs = useCachedPairs(fn, choices);

  const idToPosition = useMemo(() => {
    const result: { [k: string]: number } = {};
    for (let i = 0; i < choices.length; i++) {
      result[choices[i].id] = i;
    }
    return result;
  }, [choices]);

  const isHiddenPair = useCallback(
    (rowChoice: Choice, columnChoice: Choice) => {
      if (gridMode === "full") {
        return false;
      }
      return idToPosition[rowChoice.id] <= idToPosition[columnChoice.id];
    },
    [idToPosition, gridMode]
  );

  return (
    <div>
      <div className="flex gap-8 mb-4 items-center">
        <div className="flex gap-2">
          <DropdownButton text="Columns">
            {() => <AxisFilter axis="columns" />}
          </DropdownButton>
          <DropdownButton text="Rows">
            {() => <AxisFilter axis="rows" />}
          </DropdownButton>
        </div>
        <GridModeControls />
      </div>
      <table>
        <thead>
          <tr>
            <th />
            {columnChoices.map((choice) => (
              <Header key={choice.id} choice={choice} th clusters={clusters} />
            ))}
          </tr>
        </thead>
        <tbody>
          {rowChoices.map((rowChoice) => (
            <tr key={rowChoice.id}>
              <Header key={0} choice={rowChoice} clusters={clusters} />
              {columnChoices.map((columnChoice) =>
                isHiddenPair(rowChoice, columnChoice) ? (
                  <td key={columnChoice.id} className="bg-gray-200" />
                ) : (
                  <td
                    key={columnChoice.id}
                    className="border border-gray-200 p-0 align-bottom"
                  >
                    <CachedCell
                      id1={rowChoice.id}
                      id2={columnChoice.id}
                      cache={allPairs}
                      project={project}
                    />
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
