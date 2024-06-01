import { AnyNumericScale } from "./AxesBox.js";
import { CC, makeNode } from "./CanvasElement.js";
import { getColor } from "./MainChart.js";

type SampleBarSetting = "none" | "bottom" | "behind";
export const BarSamples: CC<{
  isMulti: boolean;
  samplesBarSetting: SampleBarSetting;
  samples: number[];
  scale: AnyNumericScale;
}> = ({ isMulti, samplesBarSetting, samples, scale: _scale }) => {
  const node = makeNode();

  const samplesFooterHeight = samplesBarSetting === "bottom" ? 20 : 0;

  const sampleBarHeight =
    samplesBarSetting === "behind"
      ? Math.min(7, TODOinnerHeight * 0.04 + 1)
      : 7;

  return {
    node,
    draw: (context, layout) => {
      const scale = _scale.copy().domain([0, layout.width]);

      if (samplesBarSetting !== "none") {
        let yOffset: number, color: string;
        switch (samplesBarSetting) {
          case "behind":
            yOffset = samplesFooterHeight;
            color = getColor(0, isMulti, 0.4);
            break;
          case "bottom":
            yOffset = 0;
            color = getColor(0, isMulti);
            break;
          default:
            throw samplesBarSetting satisfies never;
        }

        context.save();
        context.lineWidth = 0.5;
        context.strokeStyle = color;
        samples.forEach((sample) => {
          context.beginPath();
          const x = scale(sample);
          context.beginPath();
          context.moveTo(padding.left + x, height - yOffset - sampleBarHeight);
          context.lineTo(padding.left + x, height - yOffset);
          context.stroke();
        });
        context.restore();
      }
    },
  };
};
