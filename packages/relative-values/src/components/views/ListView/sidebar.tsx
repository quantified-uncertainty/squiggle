"use client";
import { FC, Fragment } from "react";

import {
  NumberShower,
  useSimulator,
  ViewerWithMenuBar,
} from "@quri/squiggle-components";
import { SqLinker } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { buildPairSquiggleCode } from "../../../lib/pairSquiggleCode.js";
import { Item } from "../../../types.js";
import { ModelEvaluator } from "../../../values/ModelEvaluator.js";
import { useRelativeValuesOptions } from "../RelativeValuesProvider.js";

interface TableRowProps {
  label: string;
  number: number;
}

const TableRow: React.FC<TableRowProps> = ({ label, number }) => (
  <Fragment key={label}>
    <div className="col-span-1 mt-1 py-1 text-left text-xs font-normal text-slate-400">
      {label}
    </div>
    <div className="col-span-2 py-1 pl-2 text-left text-slate-600">
      <NumberShower number={number} precision={2} />
    </div>
  </Fragment>
);

// Like `SquiggleChart`, but supports a linker and a source id, so that models
// with imports work.
const PairChart: FC<{ code: string; linker?: SqLinker; sourceId?: string }> = ({
  code,
  linker,
  sourceId,
}) => {
  const { simulation } = useSimulator({
    code,
    sourceId,
    setup: linker
      ? { type: "projectFromLinker", linker }
      : { type: "standalone" },
  });

  if (!simulation) {
    return <RefreshIcon className="animate-spin" />;
  }

  return (
    <ViewerWithMenuBar
      simulation={simulation}
      playgroundSettings={{}}
      showMenu
      randomizeSeed={undefined}
    />
  );
};

type Props = {
  model: ModelEvaluator;
  numeratorItem: Item;
  denominatorItem: Item;
};

export const ItemSideBar: FC<Props> = ({
  model,
  numeratorItem,
  denominatorItem,
}) => {
  const { getPlaygroundUrl, linker, sourceId } = useRelativeValuesOptions();
  const result = model.compare(numeratorItem.id, denominatorItem.id);
  if (!result.ok) {
    return <div>Result not found</div>;
  } else {
    const item = result.value;
    const squiggleCode =
      model.modelCode !== undefined && model.fnExpression !== undefined
        ? buildPairSquiggleCode({
            modelCode: model.modelCode,
            fnExpression: model.fnExpression,
            numeratorItem,
            denominatorItem,
          })
        : undefined;

    return (
      <div>
        <div className="mb-6 mt-2 flex items-center overflow-x-auto p-1">
          <span className="mr-1 whitespace-nowrap text-slate-500">value</span>
          <span className="whitespace-nowrap text-xl text-slate-300">(</span>
          <span className="ml-2 mr-2 whitespace-pre-wrap rounded-sm bg-slate-200 bg-opacity-80 px-1 text-center text-sm font-semibold text-slate-900">
            {numeratorItem.name}
          </span>
          <span className="whitespace-nowrap px-1 text-xl text-slate-300">
            /
          </span>

          <span className="ml-2 mr-2 whitespace-pre-wrap rounded-sm bg-slate-200 px-1 text-center text-sm font-semibold text-slate-900">
            <span className="inline-block">{denominatorItem.name}</span>
          </span>
          <span className="whitespace-nowrap text-xl text-slate-300">)</span>
        </div>

        <div className="xs mb-4 text-slate-500">
          An estimate of the value of{" "}
          <span className="font-semibold text-slate-700">
            {numeratorItem.name}
          </span>{" "}
          in terms of{" "}
          <span className="font-semibold text-slate-700">
            {denominatorItem.name}
          </span>
        </div>

        {squiggleCode !== undefined && (
          <PairChart code={squiggleCode} linker={linker} sourceId={sourceId} />
        )}

        <div className="mb-10 mt-10 grid w-full grid-cols-6 gap-1">
          <TableRow label="median" number={item.median} />
          <TableRow label="mean" number={item.mean} />
          <TableRow label="p5" number={item.min} />
          <TableRow label="p95" number={item.max} />
          <TableRow label="uncertainty" number={item.uncertainty} />
        </div>

        {squiggleCode !== undefined && getPlaygroundUrl && (
          <a
            href={getPlaygroundUrl(squiggleCode)}
            className="text-slate-400 underline"
            target="_blank"
            rel="noreferrer"
          >
            Open in Playground
          </a>
        )}
      </div>
    );
  }
};
