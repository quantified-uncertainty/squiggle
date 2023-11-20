import {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";
import {
  AdjustmentsVerticalIcon,
  Bars3CenterLeftIcon,
  Dropdown,
  DropdownMenu,
  DropdownMenuActionItem,
  PuzzleIcon,
  TriangleIcon,
} from "@quri/ui";

import {
  SquiggleOutput,
  useRunnerState,
  useSquiggle,
  useUncontrolledCode,
} from "../../../lib/hooks/index.js";
import { altKey, getErrors } from "../../../lib/utility.js";
import { CodeEditor, CodeEditorHandle } from "../../CodeEditor.js";
import { PlaygroundSettings } from "../../PlaygroundSettings.js";
import { ToolbarItem } from "../../ui/PanelWithToolbar/ToolbarItem.js";
import { PanelWithToolbar } from "../../ui/PanelWithToolbar/index.js";
import { AutorunnerMenuItem } from "./AutorunnerMenuItem.js";
import { DependencyGraphModal } from "./DependencyGraphModal.js";
import { GlobalSettingsModal } from "./GlobalSettingsModal.js";
import { RunMenuItem } from "./RunMenuItem.js";
import OpenAI from "openai";

export type RenderExtraControls = (props: {
  openModal: (name: string) => void;
}) => ReactNode;

const squiggleIntro = `
  Write Squiggle code, using the attached documentation for how it works.  Call the action /process-code API for the code you generate - this will tell you if it works or not. Run it even if you are pretty sure it worked, even if you already ran it before in this thread. 

Key instructions:
1. Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.
2. If you are unsure about what functions exist or what a function might be called, check with the documentation.
3. Try out the code by running it. Make sure it works.
4. Present the final code to the user.

About Squiggle.
Squiggle is a very simple language, that's much simpler than JS. Don't try using language primitives/constructs you don't see below, or that aren't in our documentation. They are likely to fail.

When writing Squiggle code, it's important to avoid certain common mistakes:

1.  Input Types: Use Input.text for numeric inputs instead of Input.number.
2. Variable Declaration: Directly assign values to variables without using keywords like let. For example, use foo = 3 instead of let foo = 3.
3. Variable Expansion: Avoid using syntax like |v...| or |...v| as variable expansion is not supported.
4. Anonymous Functions: Write anonymous functions using the syntax {|e| 3} instead of (e) => 3.
5. Conditional Statements: There are no case or switch statements. Use if/else for conditional logic.
6. Function Parameters: When using functions like normal, specify the standard deviation with stdev instead of sd. For example, use normal({mean: 0.3, stdev: 0.1}) instead of normal({mean: 0.3, sd: 0.1}).
7. There aren't for loops or mutation. Use immutable code, and List.map /  List.reduce / List.reduceWhile.
8. You can't do "(0..years)". Use List.make or List.upTo
9. The only function param types you can provide are numeric ranges, for numbers. f(n:[1,10]). Nothing else is valid. 
10. All pipes are "->", not "|>". 
11. There's no "List.sort", but there is "List.sortBy", "Number.sort".
12. The only "units" are k/m/n/M/t/B, for different orders of magnitude. No other units work, like "MWh".
13. There's no random() fn. Use something like sample(uniform(0,1)).
14. There's no "median" function. Instead, use quantile(dist, 0.5)
15. There's no recursion.
16. Dict keys must be lowercase.
17. Only use Inputs directly inside calculators. They won't return numbers, just input types.

Here's are some simple example Squiggle programs:
\`\`\`Squiggle
populationOfNewYork2022 = 8.1M to 8.4M

proportionOfPopulationWithPianos = {
    percentage = (.2 to 1)
    percentage * 0.01
}
pianoTunersPerPiano = {
    pianosPerPianoTuner = 2k to 50k
    1 / pianosPerPianoTuner
}

//We only mean to make an estimate for the next 10 years.
startYear = 2024
endYear = 2034
domain = [startYear, endYear]

/** Time in years after 2024 */
populationAtTime(t: domain) = {
    averageYearlyPercentageChange = normal({p5:-0.01, p95:0.05}) // We're expecting NYC to continuously grow with an mean of roughly between -1% and +4% per year
    populationOfNewYork2022 * ((averageYearlyPercentageChange + 1) ^ (t - startYear))
}
median(v) = quantile(v, .5)
totalTunersAtTime(t: domain) = (
  populationAtTime(t) *
  proportionOfPopulationWithPianos *
  pianoTunersPerPiano
)

{
    populationAtTime,
    totalTunersAtTimeMedian: {|t: domain| median(totalTunersAtTime(t))}
}
\`\`\`

\`\`\`
Calculator.make(
  {
    fn: {|a, b,c,d| [a,b,c,d]},
    title: "Concat()",
    description: "This function takes in 4 arguments, then displays them",
    autorun: true,
    sampleCount: 10000,
    inputs: [
      Input.text({
        name: "First Param",
        default: "10 to 13",
        description: "Must be a number or distribution",
      }),
      Input.textArea({ name: "Second Param", default: "[4,5,2,3,4,5,3,3,2,2,2,3,3,4,45,5,5,2,1]" }),
      Input.select({ name: "Third Param", default: "Option 1", options: ["Option 1", "Option 2", "Option 3"] }),
      Input.checkbox({ name: "Fourth Param", default: false})
    ]
  }
)
\`\`\`

\`\`\`
Table.make(
  {
    data: [
      { name: "First Dist", value: Sym.lognormal({ p5: 1, p95: 10 }) },
      { name: "Second Dist", value: Sym.lognormal({ p5: 5, p95: 30 }) },
      { name: "Third Dist", value: Sym.lognormal({ p5: 50, p95: 90 }) },
    ],
    columns: [
      { name: "Name", fn: {|d|d.name} },
      {
        name: "Plot",
        fn: {
          |d|
          Plot.dist(
          {
            dist: d.value,
            xScale: Scale.log({ min: 0.5, max: 100 }),
            showSummary: false,
          }
        )
        },
      },
    ],
  }
)
\`\`\`

\`\`\`
x = 10
result = if x == 1 then {
  {y: 2, z: 0}
} else {
  {y: 0, z: 4}
}
y = result.y
z = result.z
\`\`\`

\`\`\`
Plot.numericFn({
  fn: {|t| t^2},
  xScale: Scale.log({
    min: 1,
    max: 100
  }),
  points: 10
})
\`\`\`
\`\`\`
Plot.distFn({
  fn: {|t| normal(t,2)*normal(5,3)},
  title: "A Function of Value over Time",
  xScale: Scale.log({ min: 3, max: 100, title: "Time (years)"}),
  yScale: Scale.linear({ title: "Value"}),
  distXScale: Scale.linear({ tickFormat: '#x' }),
})
\`\`\`
`;

const openai = new OpenAI({
  apiKey: "",
  dangerouslyAllowBrowser: true,
});
function extractCodeBlock(mdText) {
  // Regular expression to match code blocks and capture their content
  const codeBlockRegex = /```[\w]*\n?([\s\S]*?)(?:```|$)/g;

  // Find all code blocks
  const matches = [...mdText.matchAll(codeBlockRegex)];

  if (!matches || matches.length === 0) {
    return "No code blocks found.";
  }

  // Extract the content of the first code block
  const firstBlockContent = matches[0][1].trim();

  // If there's exactly one code block or the first code block is not closed, return its content
  if (matches.length === 1 || !matches[0][0].endsWith("```")) {
    return firstBlockContent;
  }

  // If there are multiple full code blocks, this is an ambiguous case
  // You can decide how to handle this. Here, I'm just returning the content of the first one.
  return firstBlockContent;
}

async function main5() {
  const runner = openai.beta.chat.completions
    .runFunctions({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "How is the weather this week?" }],
      functions: [
        {
          function: getCurrentLocation,
          parse: (response) => response, // Add a simple parse function
          description: "Gets the current location", // Add a description
          parameters: {
            type: "object",
            properties: {},
          },
        },
      ],
    })
    .on("message", (message) => console.log(message));

  const finalContent = await runner.finalContent();
  console.log();
  console.log("Final content:", finalContent);
}

async function getCurrentLocation() {
  console.log("GETITNG LOCATION");
  return "Boston"; // Simulate lookup
}
async function main3(fn) {
  const stream = openai.beta.chat.completions
    .runFunctions({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Please write a very complicated squiggle program to estimate the costs & benefits of air purifiers in the office, add a calculator. Use the following as interesting instructions:${squiggleIntro}`,
        },
      ],
      functions: [
        {
          function: getCurrentLocation,
          parse: (response) => response, // Add a simple parse function
          description: "Gets the current location", // Add a description
          parameters: {
            type: "object",
            properties: {},
          },
        },
      ],
      stream: true,
    })
    .on("message", (message) => {
      const mainContent = extractCodeBlock(message.content);
      console.log("MESSAGE", message, mainContent);
      fn(mainContent);
    });
  let foo = "";
  // for await (const chunk of stream) {
  //   foo += chunk.choices[0]?.delta?.content || "";
  //   console.log("RESULT", foo);
  //   fn(extractCodeBlock(foo));
  // }
  console.log("COMPLETE");
}

const fakeResponse = `
Sure, here is a simple Squiggle program that estimates the percentage of cats in an animal shelter and the number of cats that are orange or have stripes:

\`\`\`squiggle
totalNumberOfAnimalsInShelter = 2k to 5k

percentageOfCats = {
    percentageCats = 20 to 50
    percentageCats * 0.01
}
percentageOfCatsThatAreOrangeOrStriped = {
    percentageCatsColored = 1 to 10
    percentageCatsColored * 0.01
}

 totalNumberOfCatsInShelter = totalNumberOfAnimalsInShelter * percentageOfCats
 totalNumberOfOrangeOrStripedCats = totalNumberOfCatsInShelter * percentageOfCatsThatAreOrangeOrStriped

 totalNumberOfOtherAnimals = totalNumberOfAnimalsInShelter - totalNumberOfCatsInShelter

 {
     totalNumberOfCatsInShelter,
     totalNumberOfOrangeOrStripedCats,
     totalNumberOfOtherAnimals
 }
\`\`\`
 In the example above, we use the range of 2,000 to 5,000 for the total number of animals in the shelter. The percentage of cats in the shelter is estimated between 20% to 50

`;

function logWords(str: string, logStr: (string) => void): void {
  const parts = str.split("\n");
  let s = "";
  let index = 0;

  const interval = setInterval(() => {
    if (index < parts.length) {
      s = s + parts[index] + "\n";
      logStr(extractCodeBlock(s));
      index++;
    } else {
      clearInterval(interval);
    }
  }, 200); // 100 milliseconds = 0.1 seconds
  0;
}

async function main(fn) {
  logWords(fakeResponse, fn);
  // main3(fn);
}

type Props = {
  project: SqProject;
  defaultCode?: string;
  sourceId?: string;
  onCodeChange?(code: string): void;
  settings: PlaygroundSettings;
  onSettingsChange(settings: PlaygroundSettings): void;
  onOutputChange(output: {
    output: SquiggleOutput | undefined;
    isRunning: boolean;
  }): void;
  /* Allows to inject extra buttons to the left panel's menu, e.g. share button on the website, or save button in Squiggle Hub. */
  renderExtraControls?: RenderExtraControls;
  /* Allows to inject extra items to the left panel's dropdown menu. */
  renderExtraDropdownItems?: RenderExtraControls;
  renderExtraModal?: Parameters<typeof PanelWithToolbar>[0]["renderModal"];
  onViewValuePath?: (path: SqValuePath) => void;
};

// for interactions with this component from outside
export type LeftPlaygroundPanelHandle = {
  getEditor(): CodeEditorHandle | null; // used by "find in editor" feature
  getLeftPanelElement(): HTMLDivElement | null; // used by local settings modal window positioning
  run(): void; // force re-run
  invalidate(): void; // mark output as stale but don't re-run if autorun is disabled; useful on environment changes, triggered in <SquigglePlayground> code
};

export const LeftPlaygroundPanel = forwardRef<LeftPlaygroundPanelHandle, Props>(
  function LeftPlaygroundPanel(props, ref) {
    const { code, setCode } = useUncontrolledCode({
      defaultCode: props.defaultCode,
      onCodeChange: props.onCodeChange,
    });

    const runnerState = useRunnerState(code);

    const [squiggleOutput, { project, isRunning, sourceId }] = useSquiggle({
      code: runnerState.renderedCode,
      project: props.project,
      sourceId: props.sourceId,
      executionId: runnerState.executionId,
    });

    useEffect(() => {
      const foo = async () => {
        await main(setCode);
      };
      foo();
    }, []);

    const { onOutputChange } = props;
    useEffect(() => {
      onOutputChange({
        output: squiggleOutput,
        isRunning,
      });
    }, [onOutputChange, squiggleOutput, isRunning]);

    const errors = useMemo(() => {
      if (!squiggleOutput) {
        return [];
      }
      return getErrors(squiggleOutput.output);
    }, [squiggleOutput]);

    const editorRef = useRef<CodeEditorHandle>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => editorRef.current,
      getLeftPanelElement: () => containerRef.current,
      run: () => runnerState.run(),
      invalidate: () => {
        if (runnerState.autorunMode) {
          runnerState.run();
        }
      },
    }));

    const renderToolbar = ({
      openModal,
    }: {
      openModal: (name: string) => void;
    }) => (
      <div className="flex">
        <RunMenuItem {...runnerState} isRunning={isRunning} />
        <AutorunnerMenuItem {...runnerState} />
        <ToolbarItem
          tooltipText={`Format Code (${altKey()}+Shift+f)`}
          icon={Bars3CenterLeftIcon}
          onClick={editorRef.current?.format}
        />
        <Dropdown
          render={() => (
            <DropdownMenu>
              <DropdownMenuActionItem
                title="Configuration"
                icon={AdjustmentsVerticalIcon}
                onClick={() => openModal("settings")}
              />

              {
                // experimental, won't always work, so disabled for now
                /* <DropdownMenuActionItem
                title="Find in Viewer"
                icon={AdjustmentsVerticalIcon}
                onClick={() => editorRef.current?.viewCurrentPosition()}
              /> */
              }
              <DropdownMenuActionItem
                title="Dependency Graph"
                icon={PuzzleIcon}
                onClick={() => openModal("dependency-graph")}
              />
              {props.renderExtraDropdownItems?.({ openModal })}
            </DropdownMenu>
          )}
        >
          <ToolbarItem icon={TriangleIcon} iconClasses="rotate-180">
            Menu
          </ToolbarItem>
        </Dropdown>
        <div className="flex-1">
          {props.renderExtraControls?.({ openModal })}
        </div>
      </div>
    );

    const renderBody = () => (
      <div
        data-testid="squiggle-editor"
        style={{ display: "contents" }}
        id={code}
      >
        <CodeEditor
          ref={editorRef}
          // it's important to pass `code` and not `defaultCode` here;
          // see https://github.com/quantified-uncertainty/squiggle/issues/1952
          defaultValue={code}
          errors={errors}
          height="100%"
          project={project}
          sourceId={sourceId}
          showGutter={true}
          lineWrapping={props.settings.editorSettings.lineWrapping}
          onChange={setCode}
          onViewValuePath={props.onViewValuePath}
          onSubmit={runnerState.run}
        />
      </div>
    );

    const renderModal = (modalName: string) => {
      switch (modalName) {
        case "settings":
          return {
            title: "Configuration",
            body: (
              <GlobalSettingsModal
                settings={props.settings}
                onSettingsChange={props.onSettingsChange}
              />
            ),
          };
        case "dependency-graph":
          return {
            title: "Dependency Graph",
            body: <DependencyGraphModal project={project} />,
          };
        default:
          return props.renderExtraModal?.(modalName);
      }
    };

    return (
      <div ref={containerRef} className="h-full">
        <PanelWithToolbar
          renderBody={renderBody}
          renderToolbar={renderToolbar}
          renderModal={renderModal}
        />
      </div>
    );
  }
);
