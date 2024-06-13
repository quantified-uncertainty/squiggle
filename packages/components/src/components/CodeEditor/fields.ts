import { Facet, StateEffect, StateField } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { ReactNode, useEffect, useState } from "react";

import { SqProject, SqValuePath } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";

export type CodemirrorReactProps = {
  // Similar to React props for CodeEditor, but with null values; CodeMirror doesn't like `undefined` values.
  // TODO - it should be possible to auto-generate this type with some clever TypeScript.
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

const defaultReactProps: CodemirrorReactProps = {
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

function makeReactPropFacet<T extends keyof CodemirrorReactProps>(field: T) {
  return Facet.define<CodemirrorReactProps[T], CodemirrorReactProps[T]>({
    combine: (value) => {
      return value.length ? value[0] : defaultReactProps[field];
    },
  });
}

/**
 * These facets are derived from the single
 * [StateField](https://codemirror.net/docs/ref/#state.StateEffect) defined by
 * `useReactPropsField` below.
 *
 * Alternatively, we could model them as separate fields. This would simplify
 * some things (we don't really use aggregational capabilities of facets), but
 * it would complicate other things (we'd have to call `useEffect` once per
 * field). I'm not sure which approach is better.
 */
export const onFocusByPathFacet = makeReactPropFacet("onFocusByPath");
export const simulationFacet = makeReactPropFacet("simulation");
export const showGutterFacet = makeReactPropFacet("showGutter");
export const lineWrappingFacet = makeReactPropFacet("lineWrapping");
export const projectFacet = makeReactPropFacet("project");
export const heightFacet = makeReactPropFacet("height");
export const onChangeFacet = makeReactPropFacet("onChange");
export const onSubmitFacet = makeReactPropFacet("onSubmit");
export const sourceIdFacet = makeReactPropFacet("sourceId");
export const renderImportTooltipFacet = makeReactPropFacet(
  "renderImportTooltip"
);
// Note: any new facet must have a matching extension in `useReactPropsField` result below.

export function useReactPropsField(
  props: CodemirrorReactProps,
  view: EditorView | undefined
) {
  // init extension only once - further updates to `props` will be handled through `useEffect`.
  const [{ field, fieldExtension, effectType }] = useState(() => {
    const effectType = StateEffect.define<CodemirrorReactProps>();
    const reactPropsField = StateField.define<CodemirrorReactProps>({
      create: () => defaultReactProps,
      update: (value, tr) => {
        for (const e of tr.effects) if (e.is(effectType)) value = e.value;
        return value;
      },
    });

    return {
      fieldExtension: reactPropsField.init(() => props),
      effectType: effectType,
      field: reactPropsField,
    };
  });

  // When any prop changes, we update the entire field.
  // Note that specific facets will be updated only if the prop actually has changed.
  useEffect(() => {
    view?.dispatch({
      effects: effectType.of(props),
    });
  }, [view, effectType, props]);

  // Generics here help to prevent typos in calls to this function.
  const defineFacet = <T extends keyof CodemirrorReactProps>(
    facet: Facet<unknown, CodemirrorReactProps[T]>,
    fieldName: T
  ) => {
    return facet.from(
      field,
      (props) => props[fieldName] ?? defaultReactProps[fieldName]
    );
  };

  return [
    fieldExtension,
    [
      defineFacet(heightFacet, "height"),
      defineFacet(lineWrappingFacet, "lineWrapping"),
      defineFacet(onChangeFacet, "onChange"),
      defineFacet(onFocusByPathFacet, "onFocusByPath"),
      defineFacet(onSubmitFacet, "onSubmit"),
      defineFacet(projectFacet, "project"),
      defineFacet(showGutterFacet, "showGutter"),
      defineFacet(simulationFacet, "simulation"),
      defineFacet(sourceIdFacet, "sourceId"),
      defineFacet(renderImportTooltipFacet, "renderImportTooltip"),
    ],
  ];
}
