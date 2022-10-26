import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useForm, UseFormRegister, useWatch } from "react-hook-form";
import * as yup from "yup";
import {
  useMaybeControlledValue,
  useRunnerState,
  useSquiggle,
} from "../../lib/hooks";
import { SquiggleArgs } from "../../lib/hooks/useSquiggle";
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

import { environment } from "@quri/squiggle-lang";

import { CodeEditor } from "../CodeEditor";
import { SquiggleContainer } from "../SquiggleContainer";
import { Toggle } from "../ui/Toggle";
import { StyledTab } from "../ui/StyledTab";
import { InputItem } from "../ui/InputItem";
import { Text } from "../ui/Text";
import { ViewSettingsForm, viewSettingsSchema } from "../ViewSettingsForm";
import { getErrorLocations, getValueToRender } from "../../lib/utility";
import { SquiggleViewer, SquiggleViewerProps } from "../SquiggleViewer";
import { ShareButton } from "./ShareButton";
import { JsImports } from "../../lib/jsImports";
import { ImportSettingsForm } from "./ImportSettingsForm";

type PlaygroundProps = SquiggleArgs &
  Omit<SquiggleViewerProps, "result"> & {
    /** The initial squiggle string to put in the playground */
    defaultCode?: string;
    onCodeChange?(expr: string): void;
    /* When settings change */
    onSettingsChange?(settings: any): void;
    /** Should we show the editor? */
    showEditor?: boolean;
    /** Useful for playground on squiggle website, where we update the anchor link based on current code and settings */
    showShareButton?: boolean;
    /** Height of the editor */
    height?: number;
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

const EnvironmentSettingsForm: React.FC<{
  register: UseFormRegister<FormFields>;
}> = ({ register }) => (
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

const RunControls: React.FC<{
  autorunMode: boolean;
  isRunning: boolean;
  isStale: boolean;
  onAutorunModeChange: (value: boolean) => void;
  run: () => void;
}> = ({ autorunMode, isRunning, isStale, onAutorunModeChange, run }) => {
  const CurrentPlayIcon = isRunning ? RefreshIcon : PlayIcon;

  return (
    <div className="flex space-x-1 items-center" data-testid="autorun-controls">
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

// Left panel ref is used for local settings modal positioning in ItemSettingsMenu.tsx
type PlaygroundContextShape = {
  getLeftPanelElement: () => HTMLDivElement | undefined;
};
export const PlaygroundContext = React.createContext<PlaygroundContextShape>({
  getLeftPanelElement: () => undefined,
});

export const SquigglePlayground: React.FC<PlaygroundProps> = (props) => {
  const {
    defaultCode = "",
    code: controlledCode,
    onCodeChange,
    onSettingsChange,
    showShareButton = false,
    height = 500,
    showEditor = true,
  } = props;
  const [code, setCode] = useMaybeControlledValue({
    value: controlledCode,
    defaultValue: defaultCode,
    onChange: onCodeChange,
  });

  const [imports, setImports] = useState<JsImports>({});

  const defaultValues: FormFields = {
    ...schema.getDefault(),
    ...Object.fromEntries(
      Object.entries(props).filter(([k, v]) => v !== undefined)
    ),
  };

  const { register, control } = useForm({
    resolver: yupResolver(schema),
    defaultValues,
  });

  // react-hook-form types the result as Partial, but the result doesn't seem to be a Partial, so this should be ok
  const vars = useWatch({ control }) as FormFields;

  useEffect(() => {
    onSettingsChange?.(vars);
  }, [vars, onSettingsChange]);

  const environment: environment = useMemo(
    () => ({
      sampleCount: Number(vars.sampleCount),
      xyPointLength: Number(vars.xyPointLength),
    }),
    [vars.sampleCount, vars.xyPointLength]
  );

  const {
    run,
    autorunMode,
    setAutorunMode,
    isRunning,
    renderedCode,
    executionId,
  } = useRunnerState(code);

  const resultAndBindings = useSquiggle({
    ...props,
    code: renderedCode,
    executionId,
    jsImports: imports,
    environment,
  });

  const valueToRender = getValueToRender(resultAndBindings);

  const squiggleChart =
    renderedCode === "" ? null : (
      <div className="relative">
        {isRunning ? (
          <div className="absolute inset-0 bg-white opacity-0 animate-semi-appear" />
        ) : null}
        <SquiggleViewer
          {...vars}
          enableLocalSettings={true}
          result={valueToRender}
        />
      </div>
    );

  const errorLocations = getErrorLocations(resultAndBindings.result);

  const firstTab = showEditor ? (
    <div className="border border-slate-200" data-testid="squiggle-editor">
      <CodeEditor
        errorLocations={errorLocations}
        value={code}
        onChange={setCode}
        onSubmit={run}
        oneLine={false}
        showGutter={true}
        height={height}
      />
    </div>
  ) : (
    squiggleChart
  );

  const tabs = (
    <StyledTab.Panels>
      <StyledTab.Panel>{firstTab}</StyledTab.Panel>
      <StyledTab.Panel>
        <EnvironmentSettingsForm register={register} />
      </StyledTab.Panel>
      <StyledTab.Panel>
        <ViewSettingsForm
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
        <ImportSettingsForm initialImports={imports} setImports={setImports} />
      </StyledTab.Panel>
    </StyledTab.Panels>
  );

  const leftPanelRef = useRef<HTMLDivElement | null>(null);

  const withEditor = (
    <div className="flex mt-2">
      <div
        className="w-1/2 relative"
        style={{ minHeight: props.chartHeight }}
        ref={leftPanelRef}
      >
        {tabs}
      </div>
      <div className="w-1/2 p-2 pl-4" data-testid="playground-result">
        {squiggleChart}
      </div>
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
          <div
            className="pb-4"
            style={{
              minHeight: 200 /* important if editor is hidden */,
            }}
          >
            <div className="flex justify-between items-center">
              <StyledTab.List>
                <StyledTab
                  name={showEditor ? "Code" : "Display"}
                  icon={showEditor ? CodeIcon : EyeIcon}
                />
                <StyledTab name="Sampling Settings" icon={CogIcon} />
                <StyledTab name="View Settings" icon={ChartSquareBarIcon} />
                <StyledTab name="Input Variables" icon={CurrencyDollarIcon} />
              </StyledTab.List>
              <div className="flex space-x-2 items-center">
                <RunControls
                  autorunMode={autorunMode}
                  isStale={renderedCode !== code}
                  run={run}
                  isRunning={isRunning}
                  onAutorunModeChange={setAutorunMode}
                />
                {showShareButton && <ShareButton />}
              </div>
            </div>
            {showEditor ? withEditor : withoutEditor}
          </div>
        </StyledTab.Group>
      </PlaygroundContext.Provider>
    </SquiggleContainer>
  );
};
