import { NumberShower } from "../components/NumberShower.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("TimeDuration", {
  Chart: (value) => <NumberShower precision={3} number={value.value} />,
});
