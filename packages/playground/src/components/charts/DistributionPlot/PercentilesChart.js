import * as _ from "lodash";
import { createClassFromSpec } from "react-vega";
import spec from "./spec-percentiles";

const PercentilesChart = createClassFromSpec({
  spec,
  style: "width: 100%",
});

export { PercentilesChart };
