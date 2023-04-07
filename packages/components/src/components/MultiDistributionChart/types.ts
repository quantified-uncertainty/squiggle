import { SqDistribution } from "@quri/squiggle-lang";

interface LabeledDistribution {
  name: string;
  distribution: SqDistribution;
  opacity: number;
}

export interface Plot {
  distributions: LabeledDistribution[];
  showLegend: boolean;
  colorScheme: string;
}
