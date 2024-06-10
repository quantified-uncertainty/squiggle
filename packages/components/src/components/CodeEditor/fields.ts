import { Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useState } from "react";

import { SqError, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";

type ReactProps = {
  simulation: Simulation | null;
  onFocusByPath: ((path: SqValuePath) => void) | null;
  errors: SqError[] | null;
  showGutter: boolean;
  lineWrapping: boolean;
};

export const reactPropsEffect = StateEffect.define<ReactProps>();
export const reactPropsField = StateField.define<ReactProps>({
  create: () => ({
    simulation: null,
    onFocusByPath: null,
    errors: null,
    showGutter: false,
    lineWrapping: true,
  }),
  update: (value, tr) => {
    for (const e of tr.effects) if (e.is(reactPropsEffect)) value = e.value;
    return value;
  },
});

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
  return extension;
}

function makeReactPropFacet<T extends keyof ReactProps>(field: T) {
  const facet = Facet.define<ReactProps[T], ReactProps[T]>({
    combine: (value) => {
      return value[0];
    },
  });

  const extension = facet.from(reactPropsField, (props) => props[field]);

  return { facet, extension };
}

const onFocusByPathFacet = makeReactPropFacet("onFocusByPath");

const simulationFacet = makeReactPropFacet("simulation");

const errorsFacet = makeReactPropFacet("errors");

const showGutterFacet = makeReactPropFacet("showGutter");

const lineWrappingFacet = makeReactPropFacet("lineWrapping");

export {
  errorsFacet,
  lineWrappingFacet,
  onFocusByPathFacet,
  showGutterFacet,
  simulationFacet,
};
