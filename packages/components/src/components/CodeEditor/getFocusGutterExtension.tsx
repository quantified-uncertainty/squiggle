import { RangeSet, RangeSetBuilder } from "@codemirror/state";
import { EditorView, gutter, GutterMarker } from "@codemirror/view";
import { clsx } from "clsx";

import { ASTNode, SqValuePath, SqValuePathEdge } from "@quri/squiggle-lang";

import { Simulation } from "../../lib/hooks/useSimulator.js";
import { reactAsDom } from "./utils.js";

type MarkerProps = {
  path: SqValuePath;
  // For assignments and dict keys, AST contains the variable name node or dict key node.
  // For arrays, it contains the value.
  ast: ASTNode;
};

function* getMarkerSubProps(
  ast: ASTNode,
  path: SqValuePath
): Generator<MarkerProps, void> {
  switch (ast.type) {
    case "Dict":
      // Assuming 'elements' is an array of { key: ASTNode, value: ASTNode | string }
      // and we only want to include ASTNode values
      for (const element of ast.elements) {
        if (element.type === "Identifier") continue;
        if (element.key.type !== "String") continue;
        const subPath = path.extend(SqValuePathEdge.fromKey(element.key.value));
        yield { ast: element.key, path: subPath };
        yield* getMarkerSubProps(element.value, subPath);
      }
      break;
    case "Array":
      for (const [i, element] of ast.elements.entries()) {
        const subPath = path.extend(SqValuePathEdge.fromIndex(i));
        yield { ast: element, path: subPath };
        yield* getMarkerSubProps(element, subPath);
      }
      break;
    case "Block": {
      const lastNode = ast.statements.at(-1);
      if (lastNode) {
        yield* getMarkerSubProps(lastNode, path);
      }
      break;
    }
  }
}

function* getMarkerProps(ast: ASTNode): Generator<MarkerProps, void> {
  if (ast.type !== "Program") {
    return; // unexpected
  }

  nextStatement: for (let s of ast.statements) {
    while (s.type === "DecoratedStatement") {
      if (s.decorator.name.value === "hide") {
        break nextStatement;
      }
      s = s.statement;
    }

    switch (s.type) {
      case "DefunStatement":
      case "LetStatement": {
        const name = s.variable.value;
        if (ast.symbols[name] !== s) {
          break; // skip, probably redefined later
        }
        const path = new SqValuePath({
          root: "bindings",
          edges: [SqValuePathEdge.fromKey(name)],
        });
        yield { ast: s.variable, path };
        yield* getMarkerSubProps(s.value, path);
        break;
      }
      default: {
        // end expression
        const path = new SqValuePath({
          root: "result",
          edges: [],
        });
        yield { ast: s, path };
        yield* getMarkerSubProps(s, path);
      }
    }
  }
}

function visiblePathsWithUniqueLines(node: ASTNode): MarkerProps[] {
  const result: MarkerProps[] = [];
  const seenLines = new Set<number>();
  for (const props of getMarkerProps(node)) {
    // filter out duplicate lines
    const line = props.ast.location.start.line;
    if (seenLines.has(line)) continue;
    seenLines.add(line);

    result.push(props);
  }
  return result;
}

// This doesn't get imports, because their contexts are wrong.
export function getMarkers(
  view: EditorView,
  simulation: Simulation | undefined,
  onFocusByPath: (path: SqValuePath) => void
): RangeSet<GutterMarker> {
  const sqResult = simulation?.output;
  if (!sqResult?.ok) {
    return RangeSet.of([]);
  }

  // TODO - use AST for the current code state, and `sqResult` only for filtering
  const ast = sqResult.value.bindings.context?.ast;
  if (!ast) {
    return RangeSet.of([]);
  }

  const props: MarkerProps[] = visiblePathsWithUniqueLines(ast);

  const builder = new RangeSetBuilder<GutterMarker>();
  for (const path of props) {
    const i = path.ast.location.start.line;
    if (i >= 0 && i < view?.state.doc.lines) {
      const line = view.state.doc.line(i);
      builder.add(
        line.from,
        line.to,
        new FocusableMarker(() => onFocusByPath(path.path))
      );
    }
  }

  const markers = builder.finish();
  return markers;
}

class FocusableMarker extends GutterMarker {
  constructor(private onClickLine: () => void) {
    super();
  }

  override toDOM() {
    return reactAsDom(
      <div
        className="pr-1 pl-0.5 cursor-pointer group/marker"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          this.onClickLine();
        }}
      >
        <div
          className={clsx(
            // initial color, specialized for active lines
            "bg-violet-50 [.cm-activeLineGutter_&]:bg-white",
            // highlight all markers on gutter hover; highlight the hovered markers even more
            "group-hover/gutter:bg-violet-200 group-hover/marker:!bg-violet-400",
            "rounded-sm w-[3px] h-4 br-1 mt-[1px]",
            "transition duration-75"
          )}
        />
      </div>
    ).dom;
  }
}

export function getFocusGutterExtension(
  view: EditorView,
  simulation: Simulation | undefined,
  onFocusByPath: (path: SqValuePath) => void
) {
  return gutter({
    class: "min-w-[9px] group/gutter",
    markers: () => getMarkers(view, simulation, onFocusByPath),
  });
}
