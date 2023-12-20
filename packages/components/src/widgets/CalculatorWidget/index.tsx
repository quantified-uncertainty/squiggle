import { CalculatorIcon } from "@quri/ui";

import { widgetRegistry } from "../registry.js";
import { Calculator, CalculatorSampleCountValidation } from "./Calculator.js";

widgetRegistry.register("Calculator", {
  Preview: () => <CalculatorIcon size={14} className="opacity-60" />,
  Chart: (value, settings) => (
    <CalculatorSampleCountValidation calculator={value}>
      <Calculator valueWithContext={value} settings={settings} />
    </CalculatorSampleCountValidation>
  ),
});
