import React, {
  FC,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useForm, UseFormRegister } from "react-hook-form";
import * as yup from "yup";
import { useMaybeControlledValue, useRunnerState } from "../lib/hooks";
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
import { plotSettingsFromPartial } from "./DistributionChart";
import { functionSettingsFromPartial } from "./FunctionChart";

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
  .object({
    sampleSettings: yup.object({
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
    }),
  })
  .concat(viewSettingsSchema);

type FormFields = yup.InferType<typeof schema>;

const SamplingSettings: React.FC<{ register: UseFormRegister<FormFields> }> = ({
  register,
}) => (
  <div className="space-y-6 p-3 max-w-xl">
    <div>
      <InputItem
        name="sampleSettings.sampleCount"
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
        name="sampleSettings.xyPointLength"
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
        spinIcon={autorunMode && isRunning}
      />
    </div>
  );
};

type PlaygroundContextShape = {
  getLeftPanelElement: () => HTMLDivElement | undefined;
};
export const PlaygroundContext = React.createContext<PlaygroundContextShape>({
  getLeftPanelElement: () => undefined,
});

export const SquigglePlayground: FC<PlaygroundProps> = ({
  defaultCode = "",
  height = 500,
  plotSettings: initialPlotSettings,
  functionSettings: initialFunctionSettings,
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

  const defaultValues = {
    chartHeight: 150,
    showEditor,
    sampleSettings: {
      sampleCount: 1000,
      xyPointLength: 1000,
    },
    plotSettings: plotSettingsFromPartial(initialPlotSettings || {}),
    functionSettings: functionSettingsFromPartial(
      initialFunctionSettings || {}
    ),
  };

  const { register, watch, getValues } = useForm<FormFields>({
    resolver: yupResolver(schema),
    defaultValues,
  });
  watch();

  const [settings, setSettings] = useState(() => getValues());
  useEffect(() => {
    const subscription = watch(() => {
      setSettings(getValues());
      onSettingsChange?.(getValues());
    });
    return () => subscription.unsubscribe();
  }, [onSettingsChange, getValues, watch]);

  const env: environment = useMemo(
    () => ({
      sampleCount: Number(settings.sampleSettings.sampleCount),
      xyPointLength: Number(settings.sampleSettings.xyPointLength),
    }),
    [settings.sampleSettings.sampleCount, settings.sampleSettings.xyPointLength]
  );

  const {
    run,
    autorunMode,
    setAutorunMode,
    isRunning,
    renderedCode,
    executionId,
  } = useRunnerState(code);

  const squiggleChart =
    renderedCode === "" ? null : (
      <div className="relative">
        {isRunning ? (
          <div className="absolute inset-0 bg-white opacity-0 animate-semi-appear" />
        ) : null}
        <SquiggleChart
          code={renderedCode}
          executionId={executionId}
          environment={env}
          plotSettings={settings.plotSettings}
          functionSettings={settings.functionSettings}
          bindings={defaultBindings}
          jsImports={imports}
          enableLocalSettings={true}
        />
      </div>
    );

  const firstTab = settings.showEditor ? (
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

  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const withEditor = (
    <div className="flex mt-2">
      <div
        className="w-1/2 relative"
        style={{ minHeight: height }}
        ref={leftPanelRef}
      >
        {tabs}
      </div>
      <div className="w-1/2 p-2 pl-4">{squiggleChart}</div>
    </div>
  );

  const withoutEditor = <div className="mt-3">{tabs}</div>;

  const getLeftPanelElement = useCallback(() => {
    return leftPanelRef.current ?? undefined;
  }, []);

  return (
    <SquiggleContainer>
      <PlaygroundContext.Provider value={{ getLeftPanelElement }}>
        <StyledTab.Group>
          <div className="pb-4">
            <div className="flex justify-between items-center">
              <StyledTab.List>
                <StyledTab
                  name={settings.showEditor ? "Code" : "Display"}
                  icon={settings.showEditor ? CodeIcon : EyeIcon}
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
            {settings.showEditor ? withEditor : withoutEditor}
          </div>
        </StyledTab.Group>
      </PlaygroundContext.Provider>
    </SquiggleContainer>
  );
};
