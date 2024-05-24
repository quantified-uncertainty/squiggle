import { CanvasElement } from "./CanvasElement.js";
import { Dimensions } from "./types.js";

type Props = {
  children: CanvasElement[];
};

export class VerticalLayout extends CanvasElement {
  constructor(public props: { children: CanvasElement[] }) {
    super();
  }

  layout(context: CanvasRenderingContext2D, recommendedSize: Dimensions) {
    let height: number;
    for (const child of this.props.children) {
      child.layout(context);
      height += child.height;
    }
  }
}
