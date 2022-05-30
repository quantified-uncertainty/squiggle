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
import { ErrorBox } from "./ErrorBox";

interface ShowBoxProps {
  height: number;
  children: React.ReactNode;
}

const ShowBox: React.FC<ShowBoxProps> = ({ height, children }) => (
  <div className="border border-gray-500">{children}</div>
);

interface TitleProps {
  readonly maxHeight: number;
  children: React.ReactNode;
}

const Display: React.FC<TitleProps> = ({ maxHeight, children }) => (
  <div style={{ maxHeight: maxHeight + "px" }}>{children}</div>
);

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
  })
  .required();

type InputProps = {
  label: string;
  children: ReactElement;
};

const InputItem: React.FC<InputProps> = ({ label, children }) => (
  <div className="col-span-3">
    <label className="block text-sm font-medium text-gray-600">{label}</label>
    <div className="mt-1">{children}</div>
  </div>
);

let numberStyle =
  "max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md";
let checkboxStyle =
  "focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded";

const tabs = [
  { name: "Editor", href: "#", current: true },
  { name: "Settings", href: "#", current: false },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

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
  let [diagramStart, setDiagramStart] = useState(0);
  let [diagramStop, setDiagramStop] = useState(10);
  let [diagramCount, setDiagramCount] = useState(20);
  let chartSettings = {
    start: diagramStart,
    stop: diagramStop,
    count: diagramCount,
  };
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
    },
  });
  const vars = useWatch({
    control,
  });
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

  // className="text-gray-400 group-hover:text-gray-500 -ml-0.5 mr-2 h-4 w-4"
  let tab = (key, iconName) => {
    let iconStyle = (isSelected) =>
      classNames(
        "-ml-0.5 mr-2 h-4 w-4 ",
        isSelected ? "text-teal-500" : "text-gray-500 group-hover:text-gray-900"
      );

    let icon = (selected) =>
      ({
        code: <CodeIcon className={iconStyle(selected)} />,
        cog: <CogIcon className={iconStyle(selected)} />,
        squareBar: <ChartSquareBarIcon className={iconStyle(selected)} />,
        dollar: <CurrencyDollarIcon className={iconStyle(selected)} />,
      }[iconName]);

    return (
      <Tab key={key} as={Fragment}>
        {({ selected }) => (
          <button
            className={classNames(
              "flex rounded-md focus:outline-none focus-visible:ring-offset-gray-100 ",
              selected ? "" : ""
            )}
          >
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
                className={classNames(
                  "",
                  selected
                    ? "text-gray-900"
                    : "text-gray-600 group-hover:text-gray-900"
                )}
              >
                {key}
              </span>
            </span>
          </button>
        )}
      </Tab>
    );
  };

  return (
    <Tab.Group>
      <div className=" flex-col flex">
        <div className="pb-4">
          <Tab.List className="p-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 inline-flex">
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

              <Tab.Panel>
                <form className="space-y-6 p-3">
                  <InputItem label="Sample Count">
                    <>
                      <input
                        type="number"
                        {...register("sampleCount")}
                        className={numberStyle}
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        How many samples to use for Monte Carlo simulations.
                        This can be overridden by specific programs.
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
                        When distributions are converted into PointSet shapes,
                        we need to know how many coordinates to use.
                      </p>
                    </>
                  </InputItem>
                </form>
              </Tab.Panel>

              <Tab.Panel>
                <form className="space-y-6 p-3">
                  <InputItem label="Chart Height (in Pixels)">
                    <input
                      type="number"
                      {...register("chartHeight")}
                      className={numberStyle}
                    />
                  </InputItem>
                  <InputItem label="Editor Width">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      className="slider"
                      {...register("leftSizePercent")}
                    />
                  </InputItem>
                  <fieldset className="space-y-2">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          {...register("showTypes")}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label className="font-medium text-gray-700">
                          Type Names
                        </label>
                      </div>
                    </div>
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
                          X-Y Coordinate Scales
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
                          Summary Statistics
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </form>
              </Tab.Panel>

              <Tab.Panel>
                <InputItem label="Json Editor for imports">
                  <>
                    <JsonEditor
                      value={importString}
                      onChange={getChangeJson}
                      oneLine={false}
                      showGutter={true}
                      height={100}
                    />
                    {importsAreValid ? (
                      "Valid"
                    ) : (
                      <div className="p-2">
                        <ErrorBox heading="Invalid JSON">
                          You must use valid json in this editor.
                        </ErrorBox>
                      </div>
                    )}
                  </>
                </InputItem>
              </Tab.Panel>
            </Tab.Panels>
          </div>

          <div className="w-1/2 border-l border-gray-300 p-2">
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
