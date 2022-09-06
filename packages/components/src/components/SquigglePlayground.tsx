import React, {
  FC,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useForm, UseFormRegister, useWatch } from "react-hook-form";
import * as yup from "yup";
import { useMaybeControlledValue, useRunnerState } from "../lib/hooks";
import { yupResolver } from "@hookform/resolvers/yup";
import {
  ChartSquareBarIcon,
  CheckCircleIcon,
  ClipboardCopyIcon,
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
import { defaultTickFormat } from "../lib/distributionSpecBuilder";
import { Button } from "./ui/Button";
import { JsImports } from "../lib/jsImports";

type PlaygroundProps = SquiggleChartProps & {
  /** The initial squiggle string to put in the playground */
  defaultCode?: string;
  onCodeChange?(expr: string): void;
  /* When settings change */
  onSettingsChange?(settings: any): void;
  /** Should we show the editor? */
  showEditor?: boolean;
  /** Useful for playground on squiggle website, where we update the anchor link based on current code and settings */
  showShareButton?: boolean;
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
  initialImports: JsImports;
  setImports: (imports: JsImports) => void;
}> = ({ initialImports, setImports }) => {
  const [importString, setImportString] = useState(() =>
    JSON.stringify(initialImports)
  );
  const [importsAreValid, setImportsAreValid] = useState(true);

  const onChange = (value: string) => {
    setImportString(value);
    let imports = {};
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

const ShareButton: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText((window.top || window).location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1000);
  };
  return (
    <div className="w-36">
      <Button onClick={copy} wide>
        {isCopied ? (
          "Copied to clipboard!"
        ) : (
          <div className="flex items-center space-x-1">
            <ClipboardCopyIcon className="w-4 h-4" />
            <span>Copy share link</span>
          </div>
        )}
      </Button>
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
  showSummary = true,
  logX = false,
  expY = false,
  title,
  minX,
  maxX,
  tickFormat = defaultTickFormat,
  distributionChartActions,
  code: controlledCode,
  onCodeChange,
  onSettingsChange,
  showEditor = true,
  showShareButton = false,
}) => {
  const [code, setCode] = useMaybeControlledValue({
    value: controlledCode,
    defaultValue: defaultCode,
    onChange: onCodeChange,
  });

  const [imports, setImports] = useState<JsImports>({});

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
          {...vars}
          jsImports={imports}
          enableLocalSettings={true}
        />
      </div>
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
                  name={vars.showEditor ? "Code" : "Display"}
                  icon={vars.showEditor ? CodeIcon : EyeIcon}
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
            {vars.showEditor ? withEditor : withoutEditor}
          </div>
        </StyledTab.Group>
      </PlaygroundContext.Provider>
    </SquiggleContainer>
  );
};
