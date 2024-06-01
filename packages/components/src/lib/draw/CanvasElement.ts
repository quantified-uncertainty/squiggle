import Yoga, { Edge, type Node } from "yoga-layout";

export type CanvasLayout = {
  width: number;
  height: number;
  left: number;
  top: number;
};
/*
 * "CanvasComponent". Mirrors `FC` (`FunctionalComponent`) from React.
 */
export type CC<
  Props extends object = Record<string, never>,
  Handle extends object | null = null,
> = (props: Props) => CanvasElement<Handle>;

/*
 * This is the rendered component type; it mirrors `ReactElement` type.
 *
 * `Handle` type parameter allows parent elements to peek into some properties
 * of child elements. It's similar to `useImperativeHandle` ref from React.
 *
 * For example, when "axes container" component wraps the main "chart"
 * component, it needs to know the exact range that was used for drawing the
 * chart.
 */
export type CanvasElement<Handle extends object | null = null> = {
  node: Node;
  draw(context: CanvasRenderingContext2D, layout: CanvasLayout): void;
} & (Handle extends null
  ? { handle?: undefined }
  : {
      handle: Handle;
    });

export function makeNode() {
  const node = Yoga.Node.create();
  node.setMargin(Edge.All, 0);
  return node;
}
