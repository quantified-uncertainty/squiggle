import {
  checkAdjacentExpectStatements,
  checkCapitalizedVariableNames,
  checkIfWithoutElse,
  checkMultipleExpects,
} from "../src/squiggle/squiggleCodeWarnings";

describe("Squiggle Code Warnings", () => {
  describe("checkCapitalizedVariableNames", () => {
    it("should detect capitalized variable names", () => {
      const code = `X = {
        Y = 10
        Y
    }`;
      const warnings = checkCapitalizedVariableNames(code);
      expect(warnings.length).toBe(2);
      expect(warnings[0].message).toContain(
        "Variable 'X' is declared with a capitalized name"
      );
      expect(warnings[1].message).toContain(
        "Variable 'Y' is declared with a capitalized name"
      );
    });

    it("should detect capitalized variable names in simple cases", () => {
      const code = `X = {
        Y = 10
        Y
    }`;
      const warnings = checkCapitalizedVariableNames(code);
      expect(warnings.length).toBe(2);
      expect(warnings[0].message).toContain(
        "Variable 'X' is declared with a capitalized name"
      );
      expect(warnings[1].message).toContain(
        "Variable 'Y' is declared with a capitalized name"
      );
    });

    it("should detect capitalized variable names in complex Squiggle code", () => {
      const code = `
simulateExtinctionRisk() = {
  Years = List.upTo(2023, 2100)
  nYears = List.length(Years)
  
  // Initial parameters
  P_Misalignment_0 -> uniform(0.5, 0.9)
  P_Contain_Failure_0 = uniform(0.5, 0.9)
  
  List.map(Years, {|t, i|
    P_AI_Develop = Lambda_AI(t)
    P_Misalignment = P_Misalignment_0 * exp(-K_align * E_align(t))
  })
}
    `;
      const warnings = checkCapitalizedVariableNames(code);
      expect(warnings.length).toBe(5);
      expect(warnings[0].message).toContain(
        "Variable 'Years' is declared with a capitalized name"
      );
      expect(warnings[1].message).toContain(
        "Variable 'P_Misalignment_0' is declared with a capitalized name"
      );
      expect(warnings[3].message).toContain(
        "Variable 'P_AI_Develop' is declared with a capitalized name"
      );
    });

    it("should not detect any capitalized variable names in valid Squiggle code", () => {
      const code = `
@name("Charging Efficiency % (A Constant)")
chargingEfficiency = 0.7 to 0.9

@name("Fn: Cost to Charge Battery Once")
costToCharge(batteryCapacity, electricityRate, chargingEfficiency) = {
  loadInkWh = batteryCapacity / 1000
  chargeCost = loadInkWh * electricityRate / chargingEfficiency
  chargeCost
}

@name("Fn: Calculate Total Costs")
calcCosts(
  batteryCapacity,
  electricityRate,
  batteryCycles,
  batteryCost,
  hoursOfUsePerCycle
) = {
  electricityCostPerCycle = costToCharge(
    batteryCapacity,
    electricityRate,
    chargingEfficiency
  )
  batteryCostPerCycle = batteryCost / batteryCycles

  @name("Costs per Full Battery Cycle")
  perCycleCosts = Plot.dists(
    {
      dists: [
        { name: "Electricity Cost", value: electricityCostPerCycle },
        { name: "Battery Depreciation", value: batteryCostPerCycle },
      ],
      xScale: Scale.linear({ tickFormat: "$.2f" }),
    }
  )

  @name("Costs per Hour of Use")
  perHourCosts = Plot.dists(
    {
      dists: [
        {
          name: "Electricity Cost",
          value: electricityCostPerCycle / hoursOfUsePerCycle,
        },
        {
          name: "Battery Depreciation",
          value: batteryCostPerCycle / hoursOfUsePerCycle,
        },
      ],
      xScale: Scale.linear({ tickFormat: "$.2f" }),
    }
  )

  { perCycleCosts, perHourCosts }
}

@name("Calculator")
export calculator = Calculator(
  calcCosts,
  {
    title: "Laptop Usage Costs: Electricity & Battery",
    description: "This calculator estimates the combined costs of electricity consumption and battery depreciation for laptop use. It assumes the laptop is running on battery power.

Costs are provided per **full battery cycle** and per **hour of use**.",
    inputs: [
      Input.text(
        {
          name: "Battery Capacity (Watt-Hours)",
          default: "60",
          description: "E.g., A 14-inch M1 MacBook Pro has ~60 Wh battery.",
        }
      ),
      Input.text(
        {
          name: "Electricity Rate ($ per kWh)",
          description: "E.g., In California, this was ~$0.20 in 2022.",
          default: "0.2 to 0.3",
        }
      ),
      Input.text(
        {
          name: "Battery Lifespan (Cycles)",
          description: "Number of full charge cycles before battery replacement is needed.",
          default: "1000 to 1500",
        }
      ),
      Input.text(
        {
          name: "Battery Replacement Cost ($)",
          description: "Include both monetary cost and inconvenience factor.",
          default: "100 to 200",
        }
      ),
      Input.text(
        {
          name: "Battery Life per Charge (Hours)",
          description: "Typical usage time on a single charge.",
          default: "3 to 5",
        }
      ),
    ],
  }
)
      `;
      const warnings = checkCapitalizedVariableNames(code);
      expect(warnings.length).toBe(0);
    });
  });
  describe("checkIfWithoutElse", () => {
    it("should detect if statements without else", () => {
      const code = `
        if x > 5 then y = 10
      `;
      const warnings = checkIfWithoutElse(code);
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        "'if' statement without a corresponding 'else'"
      );
    });
  });

  describe("checkMultipleExpects", () => {
    it("should detect multiple expects in a block", () => {
      const code = `
        {||
          x.expect(5)
          y.expect(10)
        })
      `;
      const warnings = checkMultipleExpects(code);
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain(
        "Multiple return '.expect()' calls found in a single block"
      );
    });
  });

  describe("checkAdjacentExpectStatements", () => {
    it("should detect adjacent expect statements", () => {
      const code = `
        expect(x).toBe(5)
        expect(y).toBe(10)
      `;
      const warnings = checkAdjacentExpectStatements(code);
      expect(warnings.length).toBe(1);
      expect(warnings[0].message).toContain("Adjacent expect statements found");
    });
  });
});
