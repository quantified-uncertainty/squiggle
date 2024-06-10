import { Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ReactNode, useEffect, useState } from "react";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";

type ReactProps = {
  simulation: Simulation | null;
  onFocusByPath: ((path: SqValuePath) => void) | null;
  onChange: (value: string) => void;
  onSubmit: (() => void) | null;
  showGutter: boolean;
  lineWrapping: boolean;
  project: SqProject;
  sourceId: string;
  height: string | number | null;
  renderImportTooltip:
    | ((params: { project: SqProject; importId: string }) => ReactNode)
    | null;
};

const defaultReactProps: ReactProps = {
  simulation: null,
  onFocusByPath: null,
  showGutter: false,
  lineWrapping: true,
  project: SqProject.create(),
  sourceId: "fake",
  onChange: () => {},
  onSubmit: null,
  height: null,
  renderImportTooltip: null,
};

export const reactPropsEffect = StateEffect.define<ReactProps>();
export const reactPropsField = StateField.define<ReactProps>({
  create: () => defaultReactProps,
  update: (value, tr) => {
    for (const e of tr.effects) if (e.is(reactPropsEffect)) value = e.value;
    return value;
  },
});

function makeReactPropFacet<T extends keyof ReactProps>(field: T) {
  const facet = Facet.define<ReactProps[T], ReactProps[T]>({
    combine: (value) => {
      return value.length ? value[0] : defaultReactProps[field];
    },
  });

  const extension = facet.from(reactPropsField, (props) => {
    return props[field] ?? defaultReactProps[field];
  });

  return { facet, extension };
}

const onFocusByPathFacet = makeReactPropFacet("onFocusByPath");
const simulationFacet = makeReactPropFacet("simulation");
const showGutterFacet = makeReactPropFacet("showGutter");
const lineWrappingFacet = makeReactPropFacet("lineWrapping");
const projectFacet = makeReactPropFacet("project");
const heightFacet = makeReactPropFacet("height");
const onChangeFacet = makeReactPropFacet("onChange");
const onSubmitFacet = makeReactPropFacet("onSubmit");
const sourceIdFacet = makeReactPropFacet("sourceId");
const renderImportTooltipFacet = makeReactPropFacet("renderImportTooltip");

export {
  heightFacet,
  lineWrappingFacet,
  onChangeFacet,
  onFocusByPathFacet,
  onSubmitFacet,
  projectFacet,
  renderImportTooltipFacet,
  showGutterFacet,
  simulationFacet,
  sourceIdFacet,
};

export function useReactPropsField(
  props: ReactProps,
  view: EditorView | undefined
) {
  // init extension only once
  const [extension] = useState(reactPropsField.init(() => props));

  useEffect(() => {
    view?.dispatch({
      effects: reactPropsEffect.of(props),
    });
  }, [view, props]);
  return [
    extension,
    [
      heightFacet.extension,
      lineWrappingFacet.extension,
      onChangeFacet.extension,
      onFocusByPathFacet.extension,
      onSubmitFacet.extension,
      projectFacet.extension,
      showGutterFacet.extension,
      simulationFacet.extension,
      sourceIdFacet.extension,
      renderImportTooltipFacet.extension,
    ],
  ];
}
