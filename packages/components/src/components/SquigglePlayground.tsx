import _ from "lodash";
import React, { FC, ReactElement, useState } from "react";
import ReactDOM from "react-dom";
import { SquiggleChart } from "./SquiggleChart";
import CodeEditor from "./CodeEditor";
import JsonEditor from "./JsonEditor";
import { useForm, useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { defaultBindings, environment } from "@quri/squiggle-lang";
import { Tab } from "@headlessui/react";
import { CodeIcon } from "@heroicons/react/solid";
import { CogIcon } from "@heroicons/react/solid";
import { ChartSquareBarIcon } from "@heroicons/react/solid";
import { CurrencyDollarIcon } from "@heroicons/react/solid";
import { Fragment } from "react";
import { ErrorAlert, SuccessAlert } from "./Alert";

interface PlaygroundProps {
  /** The initial squiggle string to put in the playground */
  initialSquiggleString?: string;
  /** How many pixels high is the playground */
  height?: number;
  /** Whether to show the types of outputs in the playground */
  showTypes?: boolean;
  /** Whether to show the log scale controls in the playground */
  showControls?: boolean;
  /** Whether to show the summary table in the playground */
  showSummary?: boolean;
}

const schema = yup
  .object()
  .shape({
    sampleCount: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(1000)
      .min(10)
      .max(1000000),
    xyPointLength: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(1000)
      .min(10)
      .max(10000),
    chartHeight: yup.number().required().positive().integer().default(350),
    leftSizePercent: yup
      .number()
      .required()
      .positive()
      .integer()
      .min(10)
      .max(100)
      .default(50),
    showTypes: yup.boolean(),
    showControls: yup.boolean(),
    showSummary: yup.boolean(),
    showSettingsPage: yup.boolean().default(false),
    diagramStart: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(0)
      .min(0),
    diagramStop: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(10)
      .min(0),
    diagramCount: yup
      .number()
      .required()
      .positive()
      .integer()
      .default(20)
      .min(2),
  })
  .required();

type InputProps = {
  label: string;
  children: ReactElement;
};

const InputItem: React.FC<InputProps> = ({ label, children }) => (
  <div className="col-span-4">
    <label className="block text-sm font-medium text-gray-600">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

let numberStyle =
  "max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

let tab = (key: string, iconName: string) => {
  let iconStyle = (isSelected: boolean) =>
    classNames(
      "-ml-0.5 mr-2 h-4 w-4 ",
      isSelected ? "text-slate-500" : "text-gray-400 group-hover:text-gray-900"
    );

  let icon = (selected: boolean) =>
    ({
      code: <CodeIcon className={iconStyle(selected)} />,
      cog: <CogIcon className={iconStyle(selected)} />,
      squareBar: <ChartSquareBarIcon className={iconStyle(selected)} />,
      dollar: <CurrencyDollarIcon className={iconStyle(selected)} />,
    }[iconName]);

  return (
    <Tab key={key} as={Fragment}>
      {({ selected }) => (
        <button className="flex rounded-md focus:outline-none focus-visible:ring-offset-gray-100 ">
          <span
            className={classNames(
              "p-1 pl-2.5 pr-3.5 rounded-md flex items-center text-sm font-medium",
              selected
                ? "bg-white shadow-sm ring-1 ring-black ring-opacity-5"
                : ""
            )}
          >
            {icon(selected)}
            <span
              className={
                selected
                  ? "text-gray-900"
                  : "text-gray-600 group-hover:text-gray-900"
              }
            >
              {key}
            </span>
          </span>
        </button>
      )}
    </Tab>
  );
};

let SquigglePlayground: FC<PlaygroundProps> = ({
  initialSquiggleString = "",
  height = 500,
  showTypes = false,
  showControls = false,
  showSummary = false,
}: PlaygroundProps) => {
  let [squiggleString, setSquiggleString] = useState(initialSquiggleString);
  let [importString, setImportString] = useState("{}");
  let [imports, setImports] = useState({});
  let [importsAreValid, setImportsAreValid] = useState(true);
  const { register, control } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      sampleCount: 1000,
      xyPointLength: 1000,
      chartHeight: 150,
      showTypes: showTypes,
      showControls: showControls,
      showSummary: showSummary,
      leftSizePercent: 50,
      showSettingsPage: false,
      diagramStart: 0,
      diagramStop: 10,
      diagramCount: 20,
    },
  });
  const vars = useWatch({
    control,
  });
  let chartSettings = {
    start: Number(vars.diagramStart),
    stop: Number(vars.diagramStop),
    count: Number(vars.diagramCount),
  };
  let env: environment = {
    sampleCount: Number(vars.sampleCount),
    xyPointLength: Number(vars.xyPointLength),
  };
  let getChangeJson = (r: string) => {
    setImportString(r);
    try {
      setImports(JSON.parse(r));
      setImportsAreValid(true);
    } catch (e) {
      setImportsAreValid(false);
    }
  };

  let samplingSettings = (
    <div className="space-y-6 p-3">
      <InputItem label="Sample Count">
        <>
          <input
            type="number"
            {...register("sampleCount")}
            className={numberStyle}
          />
          <p className="mt-2 text-sm text-gray-500">
            How many samples to use for Monte Carlo simulations. This can
            occasionally be overridden by specific Squiggle programs.
          </p>
        </>
      </InputItem>
      <InputItem label="Coordinate Count (For PointSet Shapes)">
        <>
          <input
            type="number"
            {...register("xyPointLength")}
            className={numberStyle}
          />
          <p className="mt-2 text-sm text-gray-500">
            When distributions are converted into PointSet shapes, we need to
            know how many coordinates to use.
          </p>
        </>
      </InputItem>
    </div>
  );

  let viewSettings = (
    <div className="space-y-6 divide-y divide-gray-200">
      <div className="space-y-2">
        <h3 className="text-lg leading-6 font-medium text-gray-900 pb-2">
          General Display Settings
        </h3>
        <InputItem label="Chart Height (in pixels)">
          <input
            type="number"
            {...register("chartHeight")}
            className={numberStyle}
          />
        </InputItem>
        <div className="relative flex items-start pt-3">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              {...register("showTypes")}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">
              Show information about displayed types.
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 pb-2">
          Distribution Display Settings
        </h3>

        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              {...register("showControls")}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">
              Show toggles to adjust scale of x and y axes
            </label>
          </div>
        </div>
        <div className="relative flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              {...register("showSummary")}
              className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label className="font-medium text-gray-700">
              Show summary statistics
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 pb-2">
          Function Display Settings
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          When displaying functions of single variables that return numbers or
          distributions, we need to use defaults for the x-axis. We need to
          select a minimum and maximum value of x to sample, and a number n of
          the number of points to sample.
        </p>
        <div className="pt-4 grid grid-cols-1 gap-y-4 gap-x-4">
          <InputItem label="Min X Value">
            <input
              type="number"
              {...register("diagramStart")}
              className={numberStyle}
            />
          </InputItem>
          <InputItem label="Max X Value">
            <input
              type="number"
              {...register("diagramStop")}
              className={numberStyle}
            />
          </InputItem>
          <InputItem label="Points between X min and X max to sample">
            <input
              type="number"
              {...register("diagramCount")}
              className={numberStyle}
            />
          </InputItem>
        </div>
      </div>
    </div>
  );

  let inputVariableSettings = (
    <>
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Import Variables from JSON
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        You can import variables from JSON into your Squiggle code. Variables
        are accessed with dollar signs. For example, "timeNow" would be accessed
        as "$timeNow".
      </p>
      <div className="border border-slate-200 mt-6 mb-2">
        <JsonEditor
          value={importString}
          onChange={getChangeJson}
          oneLine={false}
          showGutter={true}
          height={150}
        />
      </div>
      <div className="p-1 pt-2">
        {importsAreValid ? (
          <SuccessAlert heading="Valid Json">
            <></>
          </SuccessAlert>
        ) : (
          <ErrorAlert heading="Invalid JSON">
            You must use valid json in this editor.
          </ErrorAlert>
        )}
      </div>
    </>
  );

  return (
    <Tab.Group>
      <div className=" flex-col flex">
        <div className="pb-4">
          <Tab.List className="p-0.5 rounded-md bg-slate-100 hover:bg-slate-200 inline-flex">
            {tab("Code", "code")}
            {tab("Sampling Settings", "cog")}
            {tab("View Settings", "squareBar")}
            {tab("Input Variables", "dollar")}
          </Tab.List>
        </div>
        <div className="flex" style={{ height: height + "px" }}>
          <div className="w-1/2">
            <Tab.Panels>
              <Tab.Panel>
                <div className="border border-slate-200">
                  <CodeEditor
                    value={squiggleString}
                    onChange={setSquiggleString}
                    oneLine={false}
                    showGutter={true}
                    height={height - 1}
                  />
                </div>
              </Tab.Panel>
              <Tab.Panel>{samplingSettings}</Tab.Panel>
              <Tab.Panel>{viewSettings}</Tab.Panel>
              <Tab.Panel>{inputVariableSettings}</Tab.Panel>
            </Tab.Panels>
          </div>

          <div className="w-1/2 p-2 pl-4">
            <div style={{ maxHeight: height + "px" }}>
              <SquiggleChart
                squiggleString={squiggleString}
                environment={env}
                chartSettings={chartSettings}
                height={vars.chartHeight}
                showTypes={vars.showTypes}
                showControls={vars.showControls}
                bindings={defaultBindings}
                jsImports={imports}
                showSummary={vars.showSummary}
              />
            </div>
          </div>
        </div>
      </div>
    </Tab.Group>
  );
};
export default SquigglePlayground;
export function renderSquigglePlaygroundToDom(props: PlaygroundProps) {
  let parent = document.createElement("div");
  ReactDOM.render(<SquigglePlayground {...props} />, parent);
  return parent;
}
