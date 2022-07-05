import React, { FC, useState, useEffect, useMemo } from "react";
import { Path, useForm, UseFormRegister, useWatch } from "react-hook-form";
import * as yup from "yup";
import { useMaybeControlledValue } from "../lib/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  ChartSquareBarIcon,
  CheckCircleIcon,
  CodeIcon,
  CogIcon,
  CurrencyDollarIcon,
  EyeIcon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
} from "@heroicons/react/solid";
import clsx from "clsx";

import { defaultBindings, environment } from "@quri/squiggle-lang";

import { SquiggleChart } from "./SquiggleChart";
import { CodeEditor } from "./CodeEditor";
import { JsonEditor } from "./JsonEditor";
import { ErrorAlert, SuccessAlert } from "./Alert";
import { SquiggleContainer } from "./SquiggleContainer";
import { Toggle } from "./ui/Toggle";
import { Checkbox } from "./ui/Checkbox";
import { StyledTab } from "./ui/StyledTab";

interface PlaygroundProps {
  /** The initial squiggle string to put in the playground */
  defaultCode?: string;
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
  onSettingsChange?(settings: any): void;
  /** Should we show the editor? */
  showEditor?: boolean;
}

const schema = yup.object({}).shape({
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
  showTypes: yup.boolean().required(),
  showControls: yup.boolean().required(),
  showSummary: yup.boolean().required(),
  showEditor: yup.boolean().required(),
  logX: yup.boolean().required(),
  expY: yup.boolean().required(),
  showSettingsPage: yup.boolean().default(false),
  diagramStart: yup.number().required().positive().integer().default(0).min(0),
  diagramStop: yup.number().required().positive().integer().default(10).min(0),
  diagramCount: yup.number().required().positive().integer().default(20).min(2),
});

type FormFields = yup.InferType<typeof schema>;

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

const SamplingSettings: React.FC<{ register: UseFormRegister<FormFields> }> = ({
  register,
}) => (
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
          When distributions are converted into PointSet shapes, we need to know
          how many coordinates to use.
        </Text>
      </div>
    </div>
  </div>
);

const ViewSettings: React.FC<{ register: UseFormRegister<FormFields> }> = ({
  register,
}) => (
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
            When displaying functions of single variables that return numbers or
            distributions, we need to use defaults for the x-axis. We need to
            select a minimum and maximum value of x to sample, and a number n of
            the number of points to sample.
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

const InputVariablesSettings: React.FC<{
  initialImports: any; // TODO - any json type
  setImports: (imports: any) => void;
}> = ({ initialImports, setImports }) => {
  const [importString, setImportString] = useState(() =>
    JSON.stringify(initialImports)
  );
  const [importsAreValid, setImportsAreValid] = useState(true);

  const onChange = (value: string) => {
    setImportString(value);
    let imports = {} as any;
    try {
      imports = JSON.parse(value);
      setImportsAreValid(true);
    } catch (e) {
      setImportsAreValid(false);
    }
    setImports(imports);
  };

  return (
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
              onChange={onChange}
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
};

const RunControls: React.FC<{
  autorunMode: boolean;
  isRunning: boolean;
  isStale: boolean;
  onAutorunModeChange: (value: boolean) => void;
  run: () => void;
}> = ({ autorunMode, isRunning, isStale, onAutorunModeChange, run }) => {
  const CurrentPlayIcon = isRunning ? RefreshIcon : PlayIcon;

  return (
    <div className="flex space-x-1 items-center">
      {autorunMode ? null : (
        <button onClick={run}>
          <CurrentPlayIcon
            className={clsx(
              "w-8 h-8",
              isRunning && "animate-spin",
              isStale ? "text-indigo-500" : "text-gray-400"
            )}
          />
        </button>
      )}
      <Toggle
        texts={["Autorun", "Paused"]}
        icons={[CheckCircleIcon, PauseIcon]}
        status={autorunMode}
        onChange={onAutorunModeChange}
      />
    </div>
  );
};

const useRunnerState = (code: string) => {
  const [autorunMode, setAutorunMode] = useState(true);
  const [renderedCode, setRenderedCode] = useState(code); // used in manual run mode only
  const [isRunning, setIsRunning] = useState(false); // used in manual run mode only

  // This part is tricky and fragile; we need to re-render first to make sure that the icon is spinning,
  // and only then evaluate the squiggle code (which freezes the UI).
  // Also note that `useEffect` execution order matters here.
  // Hopefully it'll all go away after we make squiggle code evaluation async.
  useEffect(() => {
    if (renderedCode === code && isRunning) {
      // It's not possible to put this after `setRenderedCode(code)` below because React would apply
      // `setIsRunning` and `setRenderedCode` together and spinning icon will disappear immediately.
      setIsRunning(false);
    }
  }, [renderedCode, code, isRunning]);

  useEffect(() => {
    if (!autorunMode && isRunning) {
      setRenderedCode(code); // TODO - force run even if code hasn't changed
    }
  }, [autorunMode, code, isRunning]);

  const run = () => {
    // The rest will be handled by useEffects above, but we need to update the spinner first.
    setIsRunning(true);
  };

  return {
    run,
    renderedCode: autorunMode ? code : renderedCode,
    isRunning,
    autorunMode,
    setAutorunMode: (newValue: boolean) => {
      if (!newValue) setRenderedCode(code);
      setAutorunMode(newValue);
    },
  };
};

export const SquigglePlayground: FC<PlaygroundProps> = ({
  defaultCode = "",
  height = 500,
  showTypes = false,
  showControls = false,
  showSummary = false,
  logX = false,
  expY = false,
  code: controlledCode,
  onCodeChange,
  onSettingsChange,
  showEditor = true,
}) => {
  const [code, setCode] = useMaybeControlledValue({
    value: controlledCode,
    defaultValue: defaultCode,
    onChange: onCodeChange,
  });

  const [imports, setImports] = useState({});

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

  useEffect(() => {
    onSettingsChange?.(vars);
  }, [vars, onSettingsChange]);

  const env: environment = useMemo(
    () => ({
      sampleCount: Number(vars.sampleCount),
      xyPointLength: Number(vars.xyPointLength),
    }),
    [vars.sampleCount, vars.xyPointLength]
  );

  const { run, autorunMode, setAutorunMode, isRunning, renderedCode } =
    useRunnerState(code);

  const squiggleChart = (
    <SquiggleChart
      code={renderedCode}
      environment={env}
      diagramStart={Number(vars.diagramStart)}
      diagramStop={Number(vars.diagramStop)}
      diagramCount={Number(vars.diagramCount)}
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
        onChange={setCode}
        onSubmit={run}
        oneLine={false}
        showGutter={true}
        height={height - 1}
      />
    </div>
  ) : (
    squiggleChart
  );

  const tabs = (
    <StyledTab.Panels>
      <StyledTab.Panel>{firstTab}</StyledTab.Panel>
      <StyledTab.Panel>
        <SamplingSettings register={register} />
      </StyledTab.Panel>
      <StyledTab.Panel>
        <ViewSettings register={register} />
      </StyledTab.Panel>
      <StyledTab.Panel>
        <InputVariablesSettings
          initialImports={imports}
          setImports={setImports}
        />
      </StyledTab.Panel>
    </StyledTab.Panels>
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
      <StyledTab.Group>
        <div className="pb-4">
          <div className="flex justify-between items-center mt-2">
            <StyledTab.List>
              <StyledTab
                name={vars.showEditor ? "Code" : "Display"}
                icon={vars.showEditor ? CodeIcon : EyeIcon}
              />
              <StyledTab name="Sampling Settings" icon={CogIcon} />
              <StyledTab name="View Settings" icon={ChartSquareBarIcon} />
              <StyledTab name="Input Variables" icon={CurrencyDollarIcon} />
            </StyledTab.List>
            <RunControls
              autorunMode={autorunMode}
              isStale={renderedCode !== code}
              run={run}
              isRunning={isRunning}
              onAutorunModeChange={setAutorunMode}
            />
          </div>
          {vars.showEditor ? withEditor : withoutEditor}
        </div>
      </StyledTab.Group>
    </SquiggleContainer>
  );
};
