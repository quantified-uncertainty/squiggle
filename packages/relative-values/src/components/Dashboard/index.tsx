"use client";

import { NumberShower, SquiggleContainer } from "@quri/squiggle-components";
import {
  Env,
  SqDistribution,
  SqDistributionTag,
  SqLambda,
  SqProject,
} from "@quri/squiggle-lang";
import clsx from "clsx";
import { FC, useContext, useMemo, useReducer } from "react";
import { ClusterIcon } from "./ClusterIcon";
import { DashboardContext, DashboardProvider } from "./DashboardProvider";
import { Histogram } from "./Histogram";
import { useRelativeValues } from "./hooks";
import { HorizontalClusterFilter } from "./HorizontalClusterFilter";
import { Choice, Clusters } from "./types";

const CellError: FC<{ error: string }> = ({ error }) => {
  // TODO - truncate?
  return <div className="text-red-500 text-xs">{error}</div>;
};

const Cell: FC<{ dist: SqDistribution; env: Env }> = ({ dist, env }) => {
  if (dist.tag !== SqDistributionTag.SampleSet) {
    // TODO - convert automatically?
    return <CellError error="Expected sample set" />;
  }

  const median = dist.inv(env, 0.5);

  const samples = [...dist.value().samples].sort((a, b) => a - b);
  return (
    <div className="h-full pt-[1px] relative">
      <div className="absolute top-0 inset-x-0 text-center text-sm">
        {median.ok ? <NumberShower number={median.value} /> : null}
      </div>
      <div className="h-8">
        <Histogram data={samples} />
      </div>
    </div>
  );
};

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

const DashboardTable: FC<{
  project: SqProject;
  fn: SqLambda;
  choices: Choice[];
}> = ({ project, fn, choices }) => {
  const { clusters, selectedClusters } = useContext(DashboardContext);

  const usedChoices = useMemo(() => {
    return choices.filter((choice) =>
      choice.clusterId ? selectedClusters.has(choice.clusterId) : true
    );
  }, [choices, selectedClusters]);

  const renderCompare = (choice1: Choice, choice2: Choice) => {
    const result = fn.call([choice1.id, choice2.id]);
    if (!result.ok) {
      return <CellError error={result.value.toString()} />;
    }

    const value = result.value;
    if (value.tag !== "Dist") {
      return <CellError error="Expected dist" />;
    }

    return (
      <div>
        {/* {showDebugViewer && (
          <SquiggleViewer result={result} enableLocalSettings={true} />
        )} */}
        <Cell dist={value.value} env={project.getEnvironment()} />
      </div>
    );
  };

  return (
    <table className="table-fixed">
      <thead>
        <tr>
          <th />
          <td colSpan={100}>
            <div className="mb-2">
              <HorizontalClusterFilter />
            </div>
          </td>
        </tr>
        <tr>
          <th />
          {usedChoices.map((choice) => (
            <Header key={choice.id} choice={choice} th clusters={clusters} />
          ))}
        </tr>
      </thead>
      <tbody>
        {usedChoices.map((choice1, i1) => (
          <tr key={choice1.id}>
            <Header key={0} choice={choice1} clusters={clusters} />
            {usedChoices.map((choice2, i2) =>
              i2 < i1 ? (
                <td
                  key={choice2.id}
                  className="border border-gray-200 p-0 align-bottom"
                >
                  {renderCompare(choice1, choice2)}
                </td>
              ) : (
                <td key={choice2.id} className="bg-gray-200" />
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
type Props = {
  code: string;
  showDebugViewer?: boolean;
};

export const Dashboard: FC<Props> = ({ code, showDebugViewer }) => {
  // TODO - store most of these in context? they're all global
  const { error, choices, clusters, fn, project } = useRelativeValues(code);

  return (
    <DashboardProvider initialClusters={clusters}>
      <SquiggleContainer>
        <div>
          {error && <pre className="text-red-700">{error}</pre>}
          {fn ? (
            <DashboardTable fn={fn} project={project} choices={choices} />
          ) : null}
        </div>
      </SquiggleContainer>
    </DashboardProvider>
  );
};
