import {
  Env,
  SqDistribution,
  SqDistributionTag,
  SqLambda,
  SqProject,
  SqRecord,
} from "@quri/squiggle-lang";
import clsx from "clsx";
import React, { useEffect, useMemo, useState } from "react";
import { NumberShower } from "../NumberShower";
import { SquiggleViewer } from "../SquiggleViewer";
import { Histogram } from "./Histogram";

type Cluster = {
  name: string;
  color: string;
};

type Clusters = {
  [k: string]: Cluster;
};

type Choice = {
  id: string;
  name: string;
  clusterId?: string;
};

const useRelativeValues = (code: string) => {
  const project = useMemo(() => SqProject.create(), []);

  const [error, setError] = useState("");
  const [choices, setChoices] = useState<Choice[]>([]);
  const [fn, setFn] = useState<SqLambda | undefined>();

  useEffect(() => {
    project.setSource("main", code);

    setFn(undefined);
    setChoices([]);

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

    const bindings = project.getBindings(MAIN);

    let choicesValue = bindings.get("choices");

    if (!choicesValue) {
      setError(`choices should be defined`);
      return;
    }
    if (choicesValue.tag !== "Array") {
      setError(`choices should be an array, got: ${choicesValue.tag}`);
      return;
    }
    const choiceValues = choicesValue.value.getValues();

    const choices: Choice[] = [];
    for (let choiceValue of choiceValues) {
      if (choiceValue.tag !== "Record") {
        setError(`choice should be a record, got: ${choiceValue.tag}`);
        return;
      }

      const getStringValue = (record: SqRecord, key: string) => {
        const value = record.get(key);
        if (value?.tag !== "String") {
          return;
        }
        return value.value;
      };
      const id = getStringValue(choiceValue.value, "id");
      const name = getStringValue(choiceValue.value, "name");
      if (id === undefined) {
        setError("id field not found");
        return;
      }
      if (name === undefined) {
        setError("name field not found");
        return;
      }

      choices.push({
        id,
        name,
        clusterId: id.startsWith("quri_papers_") ? "papers" : "software",
      });
    }

    setChoices(choices);
  }, [project, code]);

  // TODO
  const clusters: Clusters = {
    papers: {
      name: "Papers",
      color: "#DB828C",
    },
    software: {
      name: "Software",
      color: "#5D8CD3",
    },
  };

  return { error, choices, clusters, fn, project };
};

const CellError: React.FC<{ error: string }> = ({ error }) => {
  // TODO - truncate?
  return <div className="text-red-500 text-xs">{error}</div>;
};

const Cell: React.FC<{ dist: SqDistribution; env: Env }> = ({ dist, env }) => {
  if (dist.tag !== SqDistributionTag.SampleSet) {
    // TODO - convert automatically?
    return <CellError error="Expected sample set" />;
  }

  const median = dist.inv(env, 0.5);

  const samples = [...dist.value().samples].sort((a, b) => a - b);
  return (
    <div className="h-8 pt-[1px] relative">
      <div className="absolute top-0 inset-x-0 text-center">
        {median.ok ? <NumberShower number={median.value} /> : null}
      </div>
      <Histogram data={samples} />
    </div>
  );
};

const ClusterIcon: React.FC<{ cluster: Cluster }> = ({ cluster }) => {
  return (
    <div
      className="w-3 h-3 rounded-full"
      style={{ backgroundColor: cluster.color }}
    />
  );
};

const Header: React.FC<{
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

const HorizontalClusterFilter: React.FC<{ clusters: Clusters }> = ({
  clusters,
}) => {
  return (
    <div className="flex gap-2">
      {Object.keys(clusters).map((clusterName) => (
        <div className="flex gap-1 items-center">
          <ClusterIcon cluster={clusters[clusterName]} />
          <div className="text-xs font-bold">{clusterName}</div>
        </div>
      ))}
    </div>
  );
};

type Props = {
  code: string;
  showDebugViewer?: boolean;
};

export const SquiggleRelativeValues: React.FC<Props> = ({
  code,
  showDebugViewer,
}) => {
  const { error, choices, clusters, fn, project } = useRelativeValues(code);

  const renderCompare = (choice1: Choice, choice2: Choice) => {
    if (!fn) {
      return null;
    }
    const result = fn.call([choice1.id, choice2.id]);
    // return result.value.toString();
    if (!result.ok) {
      return <CellError error={result.value.toString()} />;
    }

    const value = result.value;
    if (value.tag !== "Dist") {
      return <CellError error="Expected dist" />;
    }

    return (
      <div>
        {showDebugViewer && (
          <SquiggleViewer result={result} enableLocalSettings={true} />
        )}
        <Cell dist={value.value} env={project.getEnvironment()} />
      </div>
    );
  };

  return (
    <div>
      {error && <pre className="text-red-700">{error}</pre>}
      <table className="table-fixed">
        <thead>
          <tr>
            <th />
            <td colSpan={100}>
              <div className="mb-2">
                <HorizontalClusterFilter clusters={clusters} />
              </div>
            </td>
          </tr>
          <tr>
            <th />
            {choices.map((choice) => (
              <Header key={choice.id} choice={choice} th clusters={clusters} />
            ))}
          </tr>
        </thead>
        <tbody>
          {choices.map((choice1, i1) => (
            <tr key={choice1.id}>
              <Header key={0} choice={choice1} clusters={clusters} />
              {choices.map((choice2, i2) =>
                i2 < i1 ? (
                  <td key={choice2.id} className="border border-gray-200 p-0">
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
    </div>
  );
};
