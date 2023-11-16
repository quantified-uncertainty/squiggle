import {
  Calculator,
  CalculatorSampleCountValidation,
} from "../Calculator/index.js";
import { widgetRegistry } from "./registry.js";

widgetRegistry.register("Calculator", {
  render: (value, settings) => (
    <CalculatorSampleCountValidation calculator={value}>
      <Calculator valueWithContext={value} settings={settings} />
    </CalculatorSampleCountValidation>
  ),
});
