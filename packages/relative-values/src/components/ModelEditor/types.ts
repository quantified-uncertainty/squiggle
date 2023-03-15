import { Model } from "@/model/utils";

export type EstimateProps<M extends Model = Model> = {
  model: M;
  setModel: (model: Model) => void;
};
