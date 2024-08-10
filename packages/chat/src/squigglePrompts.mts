export const standardPrompt = `
Write Squiggle code, using the attached documentation for how it works.

Key instructions:
1. Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.

About Squiggle.
Squiggle is a very simple language, that's much simpler than JS. Don't try using language primitives/constructs you don't see below, or that aren't in our documentation. They are likely to fail.

When writing Squiggle code, it's important to avoid certain common mistakes:

### Syntax and Structure
1. Variable Expansion: Not supported. Don't use syntax like |v...| or |...v|.
2. All pipes are "->", not "|>".
3. Dict keys and variable names must be lowercase.
4. The last value in a block/function is returned (no "return" keyword).
5. Variable declaration: Directly assign values to variables without using keywords. For example, use \`\`foo = 3\`\` instead of \`\`let foo = 3\`\`.
6. All statements in your model, besides the last one must either be comments or variable declarations. You can't do, \`\`\`4 \n 5 \n 6\`\`\` Similarly, you can't do, \`\`\`Calculator() ... Table()\`\`\` - instead, you need to set everything but the last item to a variable.

### Function Definitions and Use
1. Anonymous Functions: Use {|e| e} syntax for anonymous functions.
2. Function Parameters: When using functions like normal, specify the standard deviation with stdev instead of sd. For example, use normal({mean: 0.3, stdev: 0.1}) instead of normal({mean: 0.3, sd: 0.1}).
3. There's no recursion.
4. You can't call functions that accept ranges, with distributions. No, \`\`({|foo: [1,20]| foo}) (4 to 5)\`\`.

### Looping, Conditionals, and Data Operations
1. Conditional Statements: There are no case or switch statements. Use if/else for conditional logic.
2. There aren't for loops or mutation. Use immutable code, and List.map / List.reduce / List.reduceWhile.
3. Remember to use \`\`Number.sum\`\` and \`\`Number.product\`\`, instead of using Reduce in those cases.

### List and Dictionary Operations
1. You can't do "(0..years)". Use List.make or List.upTo.
2. There's no "List.sort", but there is "List.sortBy", "Number.sort".

### Randomness and Distribution Handling
1. There's no random() function. Use alternatives like sample(uniform(0,1)).
2. When representing percentages, use "5%" instead of "0.05" for readability.
3. The \`\`to\`\` syntax only works for >0 values. "4 to 10", not "0 to 10".

### Units and Scales
1. The only "units" are k/m/n/M/t/B, for different orders of magnitude, and "%" for percentage (which is equal to 0.01).
2. If you make a table that contains a column of similar distributions, use a scale to ensure consistent min and max.
3. Scale.symlog() has support for negative values, Scale.log() doesn't. Scale.symlog() is often a better choice for this reason, though Scale.log() is better when you are sure values are above 0.
4. Do use Scale.symlog() and Scale.log() on dists/plots that might need it. Many do!

### Documentation and Comments
1. If you use a domain for Years, try to use the Date domain, and pass in Date objects, like Date(2022) instead of 2022.

--- 

This format provides a clear and organized view of the guidelines for writing Squiggle code.


Here's are some simple example Squiggle programs:
\`\`\`squiggle
//Model for Piano Tuners in New York Over Time

populationOfNewYork2022 = 8.1M to 8.4M

proportionOfPopulationWithPianos = 0.2% to 1%

pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}

//We only mean to make an estimate for the next 10 years.

populationAtTime(t) = {
  dateDiff = Duration.toYears(t - Date(2024))
  averageYearlyPercentageChange = normal({ p5: -1%, p95: 5% }) // We're expecting NYC to continuously grow with an mean of roughly between -1% and +4% per year
  populationOfNewYork2022 * (averageYearlyPercentageChange + 1) ^ dateDiff
}
totalTunersAtTime(t) = populationAtTime(t) *
  proportionOfPopulationWithPianos *
  pianoTunersPerPiano

{
  populationAtTime,
  totalTunersAtTimeMedian: {|t| median(totalTunersAtTime(t))},
}
\`\`\`

\`\`\`squiggle
Table.make(
  [
    { name: "First Dist", value: Sym.lognormal({ p5: 1, p95: 10 }) },
    { name: "Second Dist", value: Sym.lognormal({ p5: 5, p95: 30 }) },
    { name: "Third Dist", value: Sym.lognormal({ p5: 50, p95: 90 }) },
  ],
  {
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
\`\`\`

\`\`\`
f(t) = {
  yearsPassed = toYears(t - Date(2020))
  normal({mean: yearsPassed ^ 2, stdev: yearsPassed^1.3+1})
}
\`\`\`

const squiggleControlFlowSummary = 'Squiggle Control Flow Summary:

1. Conditionals:
   - If-else statement: \`if condition then result else alternative\`
   - Ternary operator: \`test ? result : alternative\`

2. Tips for conditionals:
   - Use brackets and parentheses for organization
   - Assign results to variables: \`y = if condition then value1 else value2\`
   - For multiple assignments, use objects:
     \`\`\`
     result = if condition then {y: value1, z: value2} else {y: value3, z: value4}
     y = result.y
     z = result.z
     \`\`\`

3. Loops:
   - Squiggle does not support traditional for loops
   - Use map or reduce functions instead
   - Example:
     \`\`\`
     xs = List.upTo(0,10)
     ys = List.map(xs, {|x| f(x)})
     \`\`\`

Key points:
- No direct variable assignment within if/else blocks
- No traditional for loops; use functional programming constructs
- Use List.map() for transforming lists
- Brackets and parentheses can help organize complex conditions

This summary covers the main aspects of control flow in Squiggle, focusing on conditionals and alternatives to traditional loops.;



`;
