import { Extension, RangeSet, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";

import { simulationFacet } from "./fields.js";

const makeMark = (intensity: number) => {
  const min = 100;
  const color = 255 - min + min * (1 - intensity);
  return Decoration.mark({
    attributes: {
      style: `background-color: rgb(255,${color},${color},50%)`,
    },
  });
};

export function profilerExtension(): Extension {
  const empty = RangeSet.of<Decoration>([]);

  const decorations = EditorView.decorations.compute(
    ["doc", simulationFacet],
    (state) => {
      const simulation = state.facet(simulationFacet);
      if (!simulation) {
        return empty;
      }

      if (simulation.output.module.code !== state.doc.toString()) {
        return empty;
      }

      const {
        output: { result },
      } = simulation;
      if (!result.ok) {
        return empty;
      }

      const profile = result.value.profile;
      if (!profile) {
        return empty;
      }

      const times = profile.times;
      const totalTimes = times.reduce((a, b) => a + b, 0);
      const scaledTimes = times.map((t) => t / totalTimes);
      const maxTime = Math.max(...scaledTimes);
      const normalizedTimes = scaledTimes.map((t) => t / maxTime);

      const builder = new RangeSetBuilder<Decoration>();
      const docString = state.doc.toString();
      for (let pos = 0; pos < docString.length; pos++) {
        const mark = makeMark(normalizedTimes[pos]);
        builder.add(pos, pos + 1, mark);
      }
      return builder.finish();
    }
  );

  return [decorations];
}
