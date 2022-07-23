import React, { FC, useState, useEffect, useMemo } from "react";
import { useForm, UseFormRegister, useWatch } from "react-hook-form";
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

import { SquiggleChart, SquiggleChartProps } from "./SquiggleChart";
import { CodeEditor } from "./CodeEditor";
import { JsonEditor } from "./JsonEditor";
import { ErrorAlert, SuccessAlert } from "./Alert";
import { SquiggleContainer } from "./SquiggleContainer";
import { Toggle } from "./ui/Toggle";
import { StyledTab } from "./ui/StyledTab";
import { InputItem } from "./ui/InputItem";
import { Text } from "./ui/Text";
import { ViewSettings, viewSettingsSchema } from "./ViewSettings";
import { HeadedSection } from "./ui/HeadedSection";
import {
  defaultColor,
  defaultTickFormat,
} from "../lib/distributionSpecBuilder";

type PlaygroundProps = SquiggleChartProps & {
  /** The initial squiggle string to put in the playground */
  defaultCode?: string;
  onCodeChange?(expr: string): void;
  /* When settings change */
  onSettingsChange?(settings: any): void;
  /** Should we show the editor? */
  showEditor?: boolean;
};

const schema = yup
  .object({})
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
  })
  .concat(viewSettingsSchema);

type FormFields = yup.InferType<typeof schema>;

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
  showSummary = false,
  logX = false,
  expY = false,
  title,
  minX,
  maxX,
  color = defaultColor,
  tickFormat = defaultTickFormat,
  distributionChartActions,
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
      logX,
      expY,
      title,
      minX,
      maxX,
      color,
      tickFormat,
      distributionChartActions,
      showSummary,
      showEditor,
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
      {...vars}
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
        <ViewSettings
          register={
            // This is dangerous, but doesn't cause any problems.
            // I tried to make `ViewSettings` generic (to allow it to accept any extension of a settings schema), but it didn't work.
            register as unknown as UseFormRegister<
              yup.InferType<typeof viewSettingsSchema>
            >
          }
        />
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
    <div className="flex mt-2">
      <div className="w-1/2">{tabs}</div>
      <div className="w-1/2 p-2 pl-4">{squiggleChart}</div>
    </div>
  );

  const withoutEditor = <div className="mt-3">{tabs}</div>;

  return (
    <SquiggleContainer>
      <StyledTab.Group>
        <div className="pb-4">
          <div className="flex justify-between items-center">
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
