import { Value, vPlot } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { Plot } from "../value/VPlot.js";
import { Type } from "./Type.js";

export class TPlot extends Type<Plot> {
  unpack(v: Value) {
    return v.type === "Plot" ? v.value : undefined;
  }

  pack(v: Plot) {
    return vPlot(v);
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }
}

export const tPlot = new TPlot();
