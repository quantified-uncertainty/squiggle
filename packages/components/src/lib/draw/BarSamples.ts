import { AnyNumericScale } from "./AxesBox.js";
import { CC, makeNode } from "./CanvasElement.js";
import { getColor } from "./MainChart.js";

export const BarSamples: CC<{
  behindShapes: boolean; // affects the color
  samples: number[];
  scale: AnyNumericScale;
}> = ({ behindShapes, samples, scale: _scale }) => {
  const node = makeNode();

  return {
    node,
    draw: (context, layout) => {
      const scale = _scale.copy().range([0, layout.width]);

      const color = behindShapes ? getColor(0, false, 0.4) : getColor(0, false);

      context.save();
      context.lineWidth = 0.5;
      context.strokeStyle = color;
      samples.forEach((sample) => {
        context.beginPath();
        const x = scale(sample);
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, layout.height);
        context.stroke();
      });
      context.restore();
    },
  };
};
