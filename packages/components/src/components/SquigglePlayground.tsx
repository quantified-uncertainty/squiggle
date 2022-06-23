import React, { FC, Fragment, useState } from "react";
import ReactDOM from "react-dom";
import { Path, useForm, UseFormRegister, useWatch } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Tab } from "@headlessui/react";
import {
  ChartSquareBarIcon,
  CodeIcon,
  CogIcon,
  CurrencyDollarIcon,
  EyeIcon,
} from "@heroicons/react/solid";
import clsx from "clsx";

import { defaultBindings, environment } from "@quri/squiggle-lang";

import { SquiggleChart } from "./SquiggleChart";
import { CodeEditor } from "./CodeEditor";
import { JsonEditor } from "./JsonEditor";
import { ErrorAlert, SuccessAlert } from "./Alert";
import { SquiggleContainer } from "./SquiggleContainer";

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
  /** Whether to log the x coordinate on distribution charts */
  logX?: boolean;
  /** Whether to exp the y coordinate on distribution charts */
  expY?: boolean;
  /** If code is set, component becomes controlled */
  code?: string;
  onCodeChange?(expr: string): void;
  /** Should we show the editor? */
  showEditor?: boolean;
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
    showEditor: yup.boolean(),
    logX: yup.boolean(),
    expY: yup.boolean(),
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

type StyledTabProps = {
  name: string;
  icon: (props: React.ComponentProps<"svg">) => JSX.Element;
};

const StyledTab: React.FC<StyledTabProps> = ({ name, icon: Icon }) => {
  return (
    <Tab key={name} as={Fragment}>
      {({ selected }) => (
        <button className="group flex rounded-md focus:outline-none focus-visible:ring-offset-gray-100">
          <span
            className={clsx(
              "p-1 pl-2.5 pr-3.5 rounded-md flex items-center text-sm font-medium",
              selected && "bg-white shadow-sm ring-1 ring-black ring-opacity-5"
            )}
          >
            <Icon
              className={clsx(
                "-ml-0.5 mr-2 h-4 w-4",
                selected
                  ? "text-slate-500"
                  : "text-gray-400 group-hover:text-gray-900"
              )}
            />
            <span
              className={clsx(
                selected
                  ? "text-gray-900"
                  : "text-gray-600 group-hover:text-gray-900"
              )}
            >
              {name}
            </span>
          </span>
        </button>
      )}
    </Tab>
  );
};

const HeadedSection: FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div>
    <header className="text-lg leading-6 font-medium text-gray-900">
      {title}
    </header>
    <div className="mt-4">{children}</div>
  </div>
);

const Text: FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-gray-500">{children}</p>
);

function InputItem<T>({
  name,
  label,
  type,
  register,
}: {
  name: Path<T>;
  label: string;
  type: "number";
  register: UseFormRegister<T>;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      <input
        type={type}
        {...register(name)}
        className="form-input max-w-lg block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:max-w-xs sm:text-sm border-gray-300 rounded-md"
      />
    </label>
  );
}

function Checkbox<T>({
  name,
  label,
  register,
}: {
  name: Path<T>;
  label: string;
  register: UseFormRegister<T>;
}) {
  return (
    <label className="flex items-center">
      <input
        type="checkbox"
        {...register(name)}
        className="form-checkbox focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
      />
      {/* Clicking on the div makes the checkbox lose focus while mouse button is pressed, leading to annoying blinking; I couldn't figure out how to fix this. */}
      <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
    </label>
  );
}

export const SquigglePlayground: FC<PlaygroundProps> = ({
  initialSquiggleString = "",
  height = 500,
  showTypes = false,
  showControls = false,
  showSummary = false,
  logX = false,
  expY = false,
  code: controlledCode,
  onCodeChange,
  showEditor = true,
}) => {
  const [uncontrolledCode, setUncontrolledCode] = useState(
    initialSquiggleString
  );
  const [importString, setImportString] = useState("{}");
  const [imports, setImports] = useState({});
  const [importsAreValid, setImportsAreValid] = useState(true);
  const { register, control } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      sampleCount: 1000,
      xyPointLength: 1000,
      chartHeight: 150,
      showTypes,
      showControls,
      logX,
      expY,
      showSummary,
      showEditor,
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
  const chartSettings = {
    start: Number(vars.diagramStart),
    stop: Number(vars.diagramStop),
    count: Number(vars.diagramCount),
  };
  const env: environment = {
    sampleCount: Number(vars.sampleCount),
    xyPointLength: Number(vars.xyPointLength),
  };
  const getChangeJson = (r: string) => {
    setImportString(r);
    try {
      setImports(JSON.parse(r));
      setImportsAreValid(true);
    } catch (e) {
      setImportsAreValid(false);
    }
  };

  const code = controlledCode ?? uncontrolledCode;

  const samplingSettings = (
    <div className="space-y-6 p-3 max-w-xl">
      <div>
        <InputItem
          name="sampleCount"
          type="number"
          label="Sample Count"
          register={register}
        />
        <div className="mt-2">
          <Text>
            How many samples to use for Monte Carlo simulations. This can
            occasionally be overridden by specific Squiggle programs.
          </Text>
        </div>
      </div>
      <div>
        <InputItem
          name="xyPointLength"
          type="number"
          register={register}
          label="Coordinate Count (For PointSet Shapes)"
        />
        <div className="mt-2">
          <Text>
            When distributions are converted into PointSet shapes, we need to
            know how many coordinates to use.
          </Text>
        </div>
      </div>
    </div>
  );

  const viewSettings = (
    <div className="space-y-6 p-3 divide-y divide-gray-200 max-w-xl">
      <HeadedSection title="General Display Settings">
        <div className="space-y-4">
          <Checkbox
            name="showEditor"
            register={register}
            label="Show code editor on left"
          />
          <InputItem
            name="chartHeight"
            type="number"
            register={register}
            label="Chart Height (in pixels)"
          />
          <Checkbox
            name="showTypes"
            register={register}
            label="Show information about displayed types"
          />
        </div>
      </HeadedSection>

      <div className="pt-8">
        <HeadedSection title="Distribution Display Settings">
          <div className="space-y-2">
            <Checkbox
              register={register}
              name="logX"
              label="Show x scale logarithmically"
            />
            <Checkbox
              register={register}
              name="expY"
              label="Show y scale exponentially"
            />
            <Checkbox
              register={register}
              name="showControls"
              label="Show toggles to adjust scale of x and y axes"
            />
            <Checkbox
              register={register}
              name="showSummary"
              label="Show summary statistics"
            />
          </div>
        </HeadedSection>
      </div>

      <div className="pt-8">
        <HeadedSection title="Function Display Settings">
          <div className="space-y-6">
            <Text>
              When displaying functions of single variables that return numbers
              or distributions, we need to use defaults for the x-axis. We need
              to select a minimum and maximum value of x to sample, and a number
              n of the number of points to sample.
            </Text>
            <div className="space-y-4">
              <InputItem
                type="number"
                name="diagramStart"
                register={register}
                label="Min X Value"
              />
              <InputItem
                type="number"
                name="diagramStop"
                register={register}
                label="Max X Value"
              />
              <InputItem
                type="number"
                name="diagramCount"
                register={register}
                label="Points between X min and X max to sample"
              />
            </div>
          </div>
        </HeadedSection>
      </div>
    </div>
  );

  const inputVariableSettings = (
    <div className="p-3 max-w-3xl">
      <HeadedSection title="Import Variables from JSON">
        <div className="space-y-6">
          <Text>
            You can import variables from JSON into your Squiggle code.
            Variables are accessed with dollar signs. For example, "timeNow"
            would be accessed as "$timeNow".
          </Text>
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
              <SuccessAlert heading="Valid JSON" />
            ) : (
              <ErrorAlert heading="Invalid JSON">
                You must use valid JSON in this editor.
              </ErrorAlert>
            )}
          </div>
        </div>
      </HeadedSection>
    </div>
  );

  const squiggleChart = (
    <SquiggleChart
      squiggleString={code}
      environment={env}
      chartSettings={chartSettings}
      height={vars.chartHeight}
      showTypes={vars.showTypes}
      showControls={vars.showControls}
      showSummary={vars.showSummary}
      logX={vars.logX}
      expY={vars.expY}
      bindings={defaultBindings}
      jsImports={imports}
    />
  );

  const firstTab = vars.showEditor ? (
    <div className="border border-slate-200">
      <CodeEditor
        value={code}
        onChange={(newCode) => {
          if (controlledCode === undefined) {
            // uncontrolled mode
            setUncontrolledCode(newCode);
          }
          onCodeChange?.(newCode);
        }}
        oneLine={false}
        showGutter={true}
        height={height - 1}
      />
    </div>
  ) : (
    squiggleChart
  );

  const tabs = (
    <Tab.Panels>
      <Tab.Panel>{firstTab}</Tab.Panel>
      <Tab.Panel>{samplingSettings}</Tab.Panel>
      <Tab.Panel>{viewSettings}</Tab.Panel>
      <Tab.Panel>{inputVariableSettings}</Tab.Panel>
    </Tab.Panels>
  );

  const withEditor = (
    <div className="flex mt-1">
      <div className="w-1/2">{tabs}</div>
      <div className="w-1/2 p-2 pl-4">{squiggleChart}</div>
    </div>
  );

  const withoutEditor = <div className="mt-3">{tabs}</div>;

  return (
    <SquiggleContainer>
      <Tab.Group>
        <div className="pb-4">
          <Tab.List className="flex w-fit p-0.5 mt-2 rounded-md bg-slate-100 hover:bg-slate-200">
            <StyledTab
              name={vars.showEditor ? "Code" : "Display"}
              icon={vars.showEditor ? CodeIcon : EyeIcon}
            />
            <StyledTab name="Sampling Settings" icon={CogIcon} />
            <StyledTab name="View Settings" icon={ChartSquareBarIcon} />
            <StyledTab name="Input Variables" icon={CurrencyDollarIcon} />
          </Tab.List>
          {vars.showEditor ? withEditor : withoutEditor}
        </div>
      </Tab.Group>
    </SquiggleContainer>
  );
};

export function renderSquigglePlaygroundToDom(props: PlaygroundProps) {
  const parent = document.createElement("div");
  ReactDOM.render(<SquigglePlayground {...props} />, parent);
  return parent;
}
