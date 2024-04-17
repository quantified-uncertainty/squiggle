import {
  EditorState,
  Facet,
  RangeSet,
  RangeSetBuilder,
} from "@codemirror/state";
import { gutter, GutterMarker } from "@codemirror/view";
import { clsx } from "clsx";

import { ASTNode, SqValuePath, SqValuePathEdge } from "@quri/squiggle-lang";

import { onFocusByPathField, simulationField } from "./fields.js";
import { reactAsDom } from "./utils.js";

type MarkerDatum = {
  path: SqValuePath;
  // For assignments and dict keys, AST contains the variable name node or dict key node.
  // For arrays, it contains the value.
  ast: ASTNode;
};

function* getMarkerSubData(
  ast: ASTNode,
  path: SqValuePath
): Generator<MarkerDatum, void> {
  switch (ast.type) {
    case "Dict":
      // Assuming 'elements' is an array of { key: ASTNode, value: ASTNode | string }
      // and we only want to include ASTNode values
      for (const element of ast.elements) {
        if (element.type === "Identifier") continue;
        if (element.key.type !== "String") continue;
        const subPath = path.extend(SqValuePathEdge.fromKey(element.key.value));
        yield { ast: element.key, path: subPath };
        yield* getMarkerSubData(element.value, subPath);
      }
      break;
    case "Array":
      for (const [i, element] of ast.elements.entries()) {
        const subPath = path.extend(SqValuePathEdge.fromIndex(i));
        yield { ast: element, path: subPath };
        yield* getMarkerSubData(element, subPath);
      }
      break;
    case "Block": {
      const lastNode = ast.statements.at(-1);
      if (lastNode) {
        yield* getMarkerSubData(lastNode, path);
      }
      break;
    }
  }
}

function* getMarkerData(ast: ASTNode): Generator<MarkerDatum, void> {
  if (ast.type !== "Program") {
    return; // unexpected
  }

  nextStatement: for (let statement of ast.statements) {
    while (statement.type === "DecoratedStatement") {
      if (statement.decorator.name.value === "hide") {
        break nextStatement;
      }
      statement = statement.statement;
    }

    switch (statement.type) {
      case "DefunStatement":
      case "LetStatement": {
        const name = statement.variable.value;
        if (ast.symbols[name] !== statement) {
          break; // skip, probably redefined later
        }
        const path = new SqValuePath({
          root: "bindings",
          edges: [SqValuePathEdge.fromKey(name)],
        });
        yield { ast: statement.variable, path };
        yield* getMarkerSubData(statement.value, path);
        break;
      }
      default: {
        // end expression
        const path = new SqValuePath({
          root: "result",
          edges: [],
        });
        yield { ast: statement, path };
        yield* getMarkerSubData(statement, path);
      }
    }
  }
}

function visiblePathsWithUniqueLines(node: ASTNode): MarkerDatum[] {
  const result: MarkerDatum[] = [];
  const seenLines = new Set<number>();
  for (const datum of getMarkerData(node)) {
    // filter out duplicate lines
    const line = datum.ast.location.start.line;
    if (seenLines.has(line)) continue;
    seenLines.add(line);

    result.push(datum);
  }
  return result;
}

class FocusableMarker extends GutterMarker {
  constructor(private onClickLine: () => void) {
    super();
  }

  override toDOM() {
    return reactAsDom(
      <div
        className="group/marker cursor-pointer pl-0.5 pr-1"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onClickLine();
        }}
      >
        <div
          className={clsx(
            // initial color, specialized for active lines
            "bg-slate-100 [.cm-activeLineGutter_&]:bg-white",
            // highlight all markers on gutter hover; highlight the hovered markers even more
            "group-hover/gutter:bg-slate-200 group-hover/marker:!bg-slate-500",
            "br-1 mt-[1px] h-4 w-[4px] rounded-sm",
            "transition duration-75"
          )}
        />
      </div>
    ).dom;
  }
}

// This doesn't get imports, because their contexts are wrong.
export function getMarkers(
  state: EditorState
): RangeSet<GutterMarker> | undefined {
  const onFocusByPath = state.field(onFocusByPathField.field);
  if (!onFocusByPath) {
    return;
  }
  const simulation = state.field(simulationField.field);

  const sqResult = simulation?.output;
  if (!sqResult?.ok) {
    return;
  }

  if (sqResult.value.result.context?.source !== state.doc.toString()) {
    return; // autorun is off or the result is still rendering, can't show markers yet
  }

  // TODO - use AST for the current code state, and `sqResult` only for filtering
  const ast = sqResult.value.bindings.context?.ast;
  if (!ast) {
    return;
  }

  const markerData: MarkerDatum[] = visiblePathsWithUniqueLines(ast);

  const builder = new RangeSetBuilder<GutterMarker>();
  for (const datum of markerData) {
    const i = datum.ast.location.start.line;
    if (i >= 0 && i < state.doc.lines) {
      const line = state.doc.line(i);
      builder.add(
        line.from,
        line.to,
        new FocusableMarker(() => onFocusByPath(datum.path))
      );
    }
  }

  const markers = builder.finish();
  return markers;
}

export function focusGutterExtension() {
  const markersFacet = Facet.define<
    RangeSet<GutterMarker>,
    RangeSet<GutterMarker>
  >({
    combine: (value) => value[0] ?? RangeSet.of([]),
  });

  const computedMarkers = markersFacet.compute(
    ["doc", simulationField.field, onFocusByPathField.field],
    (state) => getMarkers(state) ?? RangeSet.of([])
  );

  return [
    computedMarkers,
    gutter({
      class: "min-w-[9px] group/gutter",
      markers: (view) => view.state.facet(markersFacet),
    }),
  ];
}
