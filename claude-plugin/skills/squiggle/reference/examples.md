# Squiggle example models

Complete models that pass `squiggle run` without errors. Use them as templates for structure, tagging, and display. Each one shows different features:

1. [Fermi estimate](#1-fermi-estimate): `to`, mixtures, blocks, `@name`/`@doc`/`@format`.
2. [Cost-benefit analysis](#2-cost-benefit-analysis): an inputs block, a function with a domain, `List.upTo`/`List.map`, `Plot.dists`, and a summary notebook.
3. [Function over time](#3-function-over-time): date domains, `@showAs` with `Plot.distFn` and `Table.make`, `SampleSet.map2`.
4. [Calculator](#4-calculator): an interactive `Calculator` with `Input.text`.

For more, see the "Regular Examples" section near the top of [language.md](language.md).

## 1. Fermi estimate

```squiggle
// Fermi estimate: how many piano tuners work in New York City (2024)?

@name("NYC Population (2024)")
population = 8M to 8.8M

@name("Pianos per Person")
@doc("Includes homes, schools, churches, and venues. Speculative: could easily be 1% or 5%.")
@format(".1%")
pianosPerPerson = mx([1% to 3%, 0.3% to 8%], [0.8, 0.2])

@name("Tunings per Piano per Year")
tuningsPerPianoPerYear = 0.3 to 1.5

@name("Tunings per Tuner per Year")
tuningsPerTunerPerYear = {
  tuningsPerDay = 2 to 5
  workDaysPerYear = 150 to 250
  tuningsPerDay * workDaysPerYear
}

@name("Piano Tuners in NYC (2024)")
pianoTuners = population * pianosPerPerson * tuningsPerPianoPerYear /
  tuningsPerTunerPerYear
```

## 2. Cost-benefit analysis

Note that `lifetime` is untagged because it is interpolated into a string (`String()` of a tagged value prints the tags too).

```squiggle
// Cost-benefit of a home solar installation over its lifetime, in USD.

// ===== Inputs =====

@name("Key Inputs")
inputs = {
  @name("Installed Cost ($)")
  @format("$,.0f")
  installedCost = 15k to 30k

  @name("Annual Electricity Saved (kWh/year)")
  annualKwh = 6k to 11k

  @name("Electricity Price ($/kWh, 2024)")
  @doc("Varies a lot by state. The wide component covers a move or large tariff changes.")
  pricePerKwh = mx([0.13 to 0.25, 0.08 to 0.45], [0.85, 0.15])

  @name("Annual Price Growth (%/year)")
  @format(".1%")
  priceGrowth = normal({ p5: 0%, p95: 4% })

  @name("Discount Rate (%/year)")
  @format(".1%")
  discountRate = 3% to 7%

  {installedCost, annualKwh, pricePerKwh, priceGrowth, discountRate}
}

// ===== Calculations =====

@name("Present Value of Savings in Year t ($)")
savingsInYear(t: [1, 40]) = inputs.annualKwh * inputs.pricePerKwh *
  (1 + inputs.priceGrowth) ^ t / (1 + inputs.discountRate) ^ t

// Untagged on purpose: it is interpolated into the summary string below, and
// String() of a tagged value would print its tags too.
lifetime = 20 // (years)

@name("Total Discounted Savings ($)")
@format("$,.0f")
totalSavings = List.upTo(1, lifetime) -> List.map(savingsInYear) -> Dist.sum

@name("Net Benefit ($)")
@format("$,.0f")
netBenefit = totalSavings - inputs.installedCost

@name("Probability Net Benefit > 0")
@format(".0%")
probPositive = 1 - cdf(netBenefit, 0)

@name("Costs vs. Savings")
comparison = Plot.dists(
  {
    dists: [
      { name: "Installed cost", value: inputs.installedCost },
      { name: "Discounted savings", value: totalSavings },
    ],
  }
)

// ===== Summary =====

@notebook
@startOpen
summary = [
  "## Summary
Estimates whether a home solar installation pays for itself over " +
    String(lifetime) +
    " years. The chance of a positive net benefit is **" +
    String(probPositive, ".0%") +
    "**.

- The electricity price is the most important and most uncertain input.
- Maintenance, inverter replacement, and incentives are not modeled.",
  { netBenefit, probPositive },
]
```

## 3. Function over time

A `to` distribution must be positive, so the wide component of `growthRate` uses `normal({ p5, p95 })` to allow negative growth.

```squiggle
// Projected global EV sales over time, as a function of the date.

@hide
domain = [Date(2024), Date(2040)]

@name("EV Sales in 2024 (cars/year)")
sales2024 = 15M to 18M

@name("Annual Growth Rate (%/year)")
@doc("Speculative. Growth could stall (policy reversal) or stay high (cheap batteries).")
@format(".0%")
growthRate = mx([8% to 25%, normal({ p5: -5%, p95: 40% })], [0.8, 0.2])

@name("Market Cap (cars/year)")
@doc("EV sales can't exceed total new car sales.")
maxSales = 85M to 100M

@name("EV Sales at Date (cars/year)")
@showAs({|f| Plot.distFn(f, { yScale: Scale.symlog() })})
salesAt(t: domain) = {
  years = Duration.toYears(t - Date(2024))
  uncapped = sales2024 * (1 + growthRate) ^ years
  pointwiseMin = {|a, b| if a < b then a else b}
  SampleSet.map2(uncapped, maxSales, pointwiseMin)
}

@name("EV Sales in 2030 (cars/year)")
sales2030 = salesAt(Date(2030))

@name("Yearly Means")
@showAs(
  {
    |rows|
    Table.make(
      rows,
      {
        columns: [
          { name: "Year", fn: {|r| r.year} },
          { name: "Mean sales (cars/year)", fn: {|r| r.mean} },
        ],
      }
    )
  }
)
yearlyMeans = List.upTo(2024, 2032) ->
  List.map({|y| { year: y, mean: mean(salesAt(Date(y))) }})
```

## 4. Calculator

`Input.text` values are parsed as Squiggle code, so users can enter distributions like `beta(4, 6)` or `5 to 10`.

```squiggle
// Interactive calculator: expected value of a bet with an uncertain win probability.

@name("Expected Value of a Bet ($)")
@showAs(
  {
    |f|
    Calculator(
      f,
      {
        title: "Bet expected value",
        inputs: [
          Input.text({ name: "Stake ($)", default: "100" }),
          Input.text({ name: "Payout multiple", default: "2.5" }),
          Input.text({ name: "Win probability", default: "beta(4, 6)" }),
        ],
      }
    )
  }
)
betValue(stake, payout, pWin) = pWin * stake * (payout - 1) - (1 - pWin) * stake

@name("Example Bet ($)")
@format("$,.0f")
example = betValue(100, 2.5, beta(4, 6))
```
