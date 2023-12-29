---
description: LLM Prompt Example
---
# LLM Prompt Example

The following is a prompt that we use to help LLMs, like GPT and Claude, write Squiggle code. This would ideally be provided with the full documentation, for example with this [document](https://raw.githubusercontent.com/quantified-uncertainty/squiggle/main/packages/website/allContent.txt). 

---

Write Squiggle code, using the attached documentation for how it works.  Call the action /process-code API for the code you generate - this will tell you if it works or not. Run it even if you are pretty sure it worked, even if you already ran it before in this thread. 

Key instructions:
1. Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.
2. If you are unsure about what functions exist or what a function might be called, check with the documentation.
3. Try out the code by running it. Make sure it works.
4. Present the final code to the user.

About Squiggle.
Squiggle is a very simple language, that's much simpler than JS. Don't try using language primitives/constructs you don't see below, or that aren't in our documentation. They are likely to fail.

When writing Squiggle code, it's important to avoid certain common mistakes:

1.  Input Types: Use Input.text for numeric inputs instead of Input.number.
2. Variable Declaration: Directly assign values to variables without using keywords like let. For example, use foo = 3 instead of let foo = 3.
3. Variable Expansion: Avoid using syntax like |v...| or |...v| as variable expansion is not supported.
4. Anonymous Functions: Write anonymous functions using the syntax {|e| 3} instead of (e) => 3.
5. Conditional Statements: There are no case or switch statements. Use if/else for conditional logic.
6. Function Parameters: When using functions like normal, specify the standard deviation with stdev instead of sd. For example, use normal({mean: 0.3, stdev: 0.1}) instead of normal({mean: 0.3, sd: 0.1}).
7. There aren't for loops or mutation. Use immutable code, and List.map /  List.reduce / List.reduceWhile.
8. You can't do "(0..years)". Use List.make or List.upTo
9. The only function param types you can provide are numeric ranges, for numbers. f(n:[1,10]). Nothing else is valid. 
10. All pipes are "->", not "|>". 
11. There's no "List.sort", but there is "List.sortBy", "Number.sort".
12. The only "units" are k/m/n/M/t/B, for different orders of magnitude. No other units work, like "MWh".
13. There's no random() fn. Use something like sample(uniform(0,1)).
14. There's no recursion.
15. Dict keys and variable names must be lowercase.
16. Only use Inputs directly inside calculators. They won't return numbers, just input types.
17. There's no "return", as in JS. The last value in a block/function is returned.

Here's are some simple example Squiggle programs:
```js
populationOfNewYork2022 = 8.1M to 8.4M

proportionOfPopulationWithPianos = {
    percentage = (.2 to 1)
    percentage * 0.01
}
pianoTunersPerPiano = {
    pianosPerPianoTuner = 2k to 50k
    1 / pianosPerPianoTuner
}

//We only mean to make an estimate for the next 10 years.
startYear = 2024
endYear = 2034
domain = [startYear, endYear]

/** Time in years after 2024 */
populationAtTime(t: domain) = {
    averageYearlyPercentageChange = normal({p5:-0.01, p95:0.05}) // We're expecting NYC to continuously grow with an mean of roughly between -1% and +4% per year
    populationOfNewYork2022 * ((averageYearlyPercentageChange + 1) ^ (t - startYear))
}
median(v) = quantile(v, .5)
totalTunersAtTime(t: domain) = (
  populationAtTime(t) *
  proportionOfPopulationWithPianos *
  pianoTunersPerPiano
)
{
    populationAtTime,
    totalTunersAtTimeMedian: {|t: domain| median(totalTunersAtTime(t))}
}
```
```js
Calculator.make(
  {
    fn: {|a, b,c,d| [a,b,c,d]},
    title: "Concat()",
    description: "This function takes in 4 arguments, then displays them",
    autorun: true,
    sampleCount: 10000,
    inputs: [
      Input.text({
        name: "First Param",
        default: "10 to 13",
        description: "Must be a number or distribution",
      }),
      Input.textArea({ name: "Second Param", default: "[4,5,2,3,4,5,3,3,2,2,2,3,3,4,45,5,5,2,1]" }),
      Input.select({ name: "Third Param", default: "Option 1", options: ["Option 1", "Option 2", "Option 3"] }),
      Input.checkbox({ name: "Fourth Param", default: false})
    ]
  }
)
```
```js
Table.make(
  {
    data: [
      { name: "First Dist", value: Sym.lognormal({ p5: 1, p95: 10 }) },
      { name: "Second Dist", value: Sym.lognormal({ p5: 5, p95: 30 }) },
      { name: "Third Dist", value: Sym.lognormal({ p5: 50, p95: 90 }) },
    ],
    columns: [
      { name: "Name", fn: {|d|d.name} },
      {
        name: "Plot",
        fn: {
          |d|
          Plot.dist(
          {
            dist: d.value,
            xScale: Scale.log({ min: 0.5, max: 100 }),
            showSummary: false,
          }
        )
        },
      },
    ],
  }
)
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
Plot.numericFn({
  fn: {|t| t^2},
  xScale: Scale.log({
    min: 1,
    max: 100
  }),
  points: 10
})
```
```js
Plot.distFn({
  fn: {|t| normal(t,2)*normal(5,3)},
  title: "A Function of Value over Time",
  xScale: Scale.log({ min: 3, max: 100, title: "Time (years)"}),
  yScale: Scale.linear({ title: "Value"}),
  distXScale: Scale.linear({ tickFormat: '#x' }),
})
```