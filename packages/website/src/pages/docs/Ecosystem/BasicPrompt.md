---
description: LLM Prompt Example
notes: "This Doc is generated using a script, do not edit directly!"
---

# LLM Basic Prompt Example

The following is a prompt that we use to help LLMs, like GPT and Claude, write Squiggle code. This would ideally be provided with the full documentation, for example with [this document](/llms/documentationBundle.md). 

You can read this document in plaintext [here](/llms/BasicPrompt.md).

---

Write Squiggle code, using the attached documentation for how it works.

Squiggle is a very simple language. Don't try using language primitives/constructs you don't see below, or that aren't in our documentation. They are likely to fail.

When writing Squiggle code, it's important to avoid certain common mistakes.

### Syntax and Structure

1. Variable Expansion: Not supported. Don't use syntax like |v...| or |...v|.
2. All pipes are "->", not "|>".
3. Dict keys and variable names must be lowercase.
4. The last value in a block/function is returned (no "return" keyword).
5. Variable declaration: Directly assign values to variables without using keywords. For example, use `foo = 3` instead of `let foo = 3`.
6. All statements in your model, besides the last one must either be comments or variable declarations. You can't do, `4 \n 5 \n 6` Similarly, you can't do, `Calculator() ... Table()` - instead, you need to set everything but the last item to a variable.
7. There's no mod operator (%). Use `Number.mod()` instead.

### Function Definitions and Use

1. Anonymous Functions: Use {|e| e} syntax for anonymous functions.
2. Function Parameters: When using functions like normal, specify the standard deviation with stdev instead of sd. For example, use normal({mean: 0.3, stdev: 0.1}) instead of normal({mean: 0.3, sd: 0.1}).
3. There's no recursion.
4. You can't call functions that accept ranges, with distributions. No, `({|foo: [1,20]| foo}) (4 to 5)`.

### Data Types and Input Handling

1. Input Types: Use Input.text for numeric inputs instead of Input.number or Input.slider.
2. The only function param types you can provide are numeric/date ranges, for numbers. f(n:[1,10]). Nothing else is valid. You cannot provide regular input type declarations.
3. Only use Inputs directly inside calculators. They won't return numbers, just input types.

### Looping, Conditionals, and Data Operations

1. Conditional Statements: There are no case or switch statements. Use if/else for conditional logic.
2. There aren't for loops or mutation. Use immutable code, and List.map / List.reduce / List.reduceWhile.

### List and Dictionary Operations

1. You can't do "(0..years)". Use List.make or List.upTo.
2. There's no "List.sort", but there is "List.sortBy", "Number.sort".

### Randomness and Distribution Handling

1. There's no random() function. Use alternatives like sample(uniform(0,1)).
2. The `to` syntax only works for >0 values. "4 to 10", not "0 to 10".

### Units and Scales

1. The only "units" are k/m/n/M/t/B, for different orders of magnitude, and "%" for percentage (which is equal to 0.01).

### Documentation and Comments

1. Tags like @name and @doc apply to the following variable, not the full file.
2. If you use a domain for Years, try to use the Date domain, and pass in Date objects, like Date(2022) instead of 2022.

## Examples

Here's are some simple example Squiggle programs:

```js
//Model for Piano Tuners in New York Over Time

@name("🌆 Population of New York in 2022")
@doc("I'm really not sure here, this is a quick guess.")
populationOfNewYork2022 = 8.1M to 8.4M

@name("🎹 Percentage of Population with Pianos")
@format(".1%")
proportionOfPopulationWithPianos = 0.2% to 1%

@name("🔧 Number of Piano Tuners per Piano")
pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}

//We only mean to make an estimate for the next 10 years.
@hide
domain = [Date(2024), Date(2034)]

@name("Population at Time")
populationAtTime(t: domain) = {
  dateDiff = Duration.toYears(t - Date(2024))
  averageYearlyPercentageChange = normal({ p5: -1%, p95: 5% }) // We're expecting NYC to continuously grow with an mean of roughly between -1% and +4% per year
  populationOfNewYork2022 * (averageYearlyPercentageChange + 1) ^ dateDiff
}

@name("Total Tuners, at Time")
totalTunersAtTime(t: domain) = populationAtTime(t) *
  proportionOfPopulationWithPianos *
  pianoTunersPerPiano

meanTunersAtTime(t: domain) = mean(totalTunersAtTime(t))
```

```js
calculator = Calculator(
  {|a, b, c, d| [a, b, c, d]},
  {
    title: "Concat()",
    description: "This function takes in 4 arguments, then displays them",
    sampleCount: 10000,
    inputs: [
      Input.text(
        {
          name: "First Param",
          default: "10 to 13",
          description: "Must be a number or distribution",
        }
      ),
      Input.textArea(
        {
          name: "Second Param",
          default: "[4,5,2,3,4,5,3,3,2,2,2,3,3,4,45,5,5,2,1]",
        }
      ),
      Input.select(
        {
          name: "Third Param",
          default: "Option 1",
          options: ["Option 1", "Option 2", "Option 3"],
        }
      ),
      Input.checkbox({ name: "Fourth Param", default: false }),
    ],
  }
)

```

```js
// Cost-benefit analysis for a housing addition in berkeley

// Input section
@name("Model Inputs")
@doc("Key parameters for the housing development project")
inputs = {
  landCost: 1M to 2M,
  constructionCost: 500k to 800k,
  permitFees: 50k to 100k,
  numberOfHomes: 10,
  monthlyRentalIncome: 3k to 5k,
  annualPropertyAppreciation: 2% to 5%,
  annualSocialBenefit: 10k to 30k,
  yearsToConsider: 30,
}

// Calculation section
@name("Calculations")
@doc("Core calculations for the cost-benefit analysis")
calculations(i) = {
  totalCostPerHome = i.landCost + i.constructionCost + i.permitFees
  annualRentalIncome = i.numberOfHomes * i.monthlyRentalIncome * 12
  totalCost = i.numberOfHomes * totalCostPerHome

  annualAppreciation(year) = i.numberOfHomes * totalCostPerHome *
    ((1 + i.annualPropertyAppreciation) ^ year -
      (1 + i.annualPropertyAppreciation) ^ (year - 1))

  annualBenefit(year) = annualRentalIncome + annualAppreciation(year) +
    i.numberOfHomes * i.annualSocialBenefit

  totalBenefit = List.upTo(1, i.yearsToConsider) -> List.map(annualBenefit)
    -> List.reduce(
      0,
      {|acc, val| acc + val}
    )

  netBenefit = totalBenefit - totalCost
  probPositiveNetBenefit = 1 - cdf(netBenefit, 0)

  {
    totalCostPerHome: totalCostPerHome,
    annualRentalIncome: annualRentalIncome,
    totalCost: totalCost,
    totalBenefit: totalBenefit,
    netBenefit: netBenefit,
    probPositiveNetBenefit: probPositiveNetBenefit,
  }
}

// Apply calculations to inputs
@name("Results")
@doc("Output of calculations based on input parameters")
results = calculations(inputs)

// Analysis section
@name("Cost-Benefit Analysis")
@doc("Detailed analysis of the housing development project")
analysis = {
  costsTable = Table.make(
    [
      { name: "Land Cost per Home", value: inputs.landCost },
      { name: "Construction Cost per Home", value: inputs.constructionCost },
      { name: "Permit Fees per Home", value: inputs.permitFees },
      { name: "Total Cost per Home", value: results.totalCostPerHome },
      { name: "Total Cost for 10 Homes", value: results.totalCost },
    ],
    {
      columns: [
        { name: "Item", fn: {|r| r.name} },
        {
          name: "Cost",
          fn: {
            |r|
            Plot.dist(
              r.value,
              {
                xScale: Scale.log({ tickFormat: "($.1s", min: 20k, max: 200M }),
              }
            )
          },
        },
      ],
    }
  )

  benefitTable = Table.make(
    [
      {
        name: "Monthly Rental Income per Home",
        value: inputs.monthlyRentalIncome,
      },
      {
        name: "Annual Social Benefit per Home",
        value: inputs.annualSocialBenefit,
      },
      { name: "Total Benefit over 30 years", value: results.totalBenefit },
    ],
    {
      columns: [
        { name: "Item", fn: {|r| r.name} },
        {
          name: "Value",
          fn: {
            |r|
            Plot.dist(
              r.value,
              { xScale: Scale.linear({ tickFormat: "($.1s" }) }
            )
          },
        },
      ],
    }
  )

  netBenefitPlot = Plot.dist(
    results.netBenefit,
    {
      title: "Distribution of Net Benefit",
      xScale: Scale.log({ tickFormat: "($.1s", min: 10M, max: 200M }),
    }
  )

  {
    title: "Cost-Benefit Analysis: Adding 10 Homes to Berkeley, CA",
    costs: costsTable,
    benefits: benefitTable,
    netBenefit: netBenefitPlot,
    probabilityOfPositiveNetBenefit: results.probPositiveNetBenefit,
  }
}
```

```js
x = 10
result = if x == 1 then {
  {y: 2, z: 0}
} else {
  {y: 0, z: 4}
}
y = result.y
z = result.z
```

```js
@showAs({|f| Plot.numericFn(f, { xScale: Scale.log({ min: 1, max: 100 }) })})
fn(t) = t ^ 2
```

```js
plot = {|t| normal(t, 2) * normal(5, 3)}
  -> Plot.distFn(
    {
      title: "A Function of Value over Time",
      xScale: Scale.log({ min: 3, max: 100, title: "Time (years)" }),
      yScale: Scale.linear({ title: "Value" }),
      distXScale: Scale.linear({ tickFormat: "#x" }),
    }
  )
```

```js
f(t: [Date(2020), Date(2040)]) = {
  yearsPassed = toYears(t - Date(2020))
  normal({mean: yearsPassed ^ 2, stdev: yearsPassed^1.3+1})
}
```

```js
import "hub:ozziegooen/sTest" as sTest
@name("💰 Expected Cost ($)")
@format("$.2s")
flightCost = normal({ mean: 600, stdev: 100 })

@name("🥇 Expected Benefit ($)")
@format("$.2s")
benefitEstimate = normal({ mean: 1500, stdev: 300 })

@name("📊 Net Benefit ($)")
@format("$.2s")
netBenefit = benefitEstimate - flightCost

@name("🚦 Test Suite")
@doc(
  "Test suite to validate various aspects of the flight cost and benefits model using sTest."
)
tests = sTest.describe(
  "Flight to London Test Suite",
  [
    // Test for reasonable flight costs
    sTest.test(
      "Flight cost should be reasonable",
      {
        ||
        meanValue = mean(flightCost)
        sTest.expect(meanValue).toBeBetween(300, 10k)
      }
    ),
  ]
)
```
