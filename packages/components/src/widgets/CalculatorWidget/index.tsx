import { widgetRegistry } from "../registry.js";
import { Calculator, CalculatorSampleCountValidation } from "./Calculator.js";

widgetRegistry.register("Calculator", {
  render: (value, settings) => (
    <CalculatorSampleCountValidation calculator={value}>
      <Calculator valueWithContext={value} settings={settings} />
    </CalculatorSampleCountValidation>
  ),
});
