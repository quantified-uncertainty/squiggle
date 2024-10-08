# Squiggle Style Guide

## Limitations

- Try not to use numbers higher than 10^50 or so. There are floating point errors at high numbers. If you need to work with larger numbers, try doing math with logs.

## Structure

- Don't have more than 10 variables in scope at any one time. Feel free to use many dictionaries and blocks in order to keep things organized. For example,

```squiggle
@name("Key Inputs")
inputs = {
  @name("Age")
  age = 34

  @name("Hourly Wage")
  hourly_wage = 100

  @name("Health Value")
  health_value = 100

  @name("Coffee Price")
  coffee_price = 1
  {age, hourly_wage, health_value, coffee_price}
}
```

Note: You cannot use tags within dicts like the following:

```squiggle
// This is not valid. Do not do this.
inputs = {
  @name("Age")
  age: 34,

  @name("Hourly Wage")
  hourly_wage: 100,

  @name("Health Value")
  health_value: 100,
}
```

- At the end of the file, don't return anything. The last line of the file should be the @notebook tag.
- You cannot start a line with a mathematical operator. For example, you cannot start a line with a + or - sign. However, you can start a line with a pipe character, `->`.
- Prettier will be run on the file. This will change the spacing and formatting. Therefore, be conservative with formatting (long lines, no risks), and allow this to do the heavy lifting later.
- If the file is over 50 lines, break it up with large styled blocks comments with headers. For example:

```squiggle
// ===== Inputs =====

// ...

// ===== Calculations =====
```

## Unit Annotation

- Squiggle does not support units directly, but you can add them to '@name()', '@doc()' tags, and add them to comments.
- In addition to regular units (like "population"), add other key variables; like the date or the type of variable. For example, use "Number of Humans (Population, 2023)" instead of just "Number of Humans". It's important to be precise and detailed when annotating variables.
- Show units in parentheses after the variable name, when the variable name is not obvious. For example, use "Age (years)" instead of just "Age". In comments, use the "(units)" format.
  Examples:

```squiggle
@name("Number of Humans (2023)")
number_of_humans = 7.8B

@name("Net Benefit ($)")
net_benefit = 100M

@name("Temperature (°C)")
temperature = 22

@name("Piano Tuners in New York City (2023)")
tuners = {
    pianos_per_piano_tuners = 100 to 1k // (pianos per tuner)
    pianos_in_nyc = 1k to 50k // (pianos)
    pianos_in_nyc / pianos_per_piano_tuners
}
```

- Maintain Consistent Units. Ensure that related variables use the same units to prevent confusion and errors in calculations.

```squiggle
@name("Distance to Mars (km)")
distance_mars = 225e6

@name("Distance to Venus (km)")
distance_venus = 170e6
```

## Tags

- Use `@name` for simple descriptions and shortened units. Use `@doc` for further details (especially for detailing types, units, and key assumptions), when necessary. It's fine to use both @name and @doc on the same variable - but if so, don't repeat the name in the doc; instead use the doc() for additional information only.
- In `@name`, add units wherever it might be confusing, like "@name("Ball Speed (m/s)"). If the units are complex or still not obvious, add more detail in the @doc().
- For complex and important functions, use `@name` to name the function, and `@doc` to describe the arguments and return values. @doc should represent a docstring for the function. For example:

```
@doc("Adds a number and a distribution.
\`\`\`squiggle
add(number, distribution) -> distribution
\`\`\`")
```

- Variables that are small function helpers, and that won't be interesting or useful to view the output of, should get a `@hide` tag. Key inputs and outputs should not have this tag.
- Use `@showAs` to format large lists, as tables and to show plots for dists and functions where appropriate.

## The `@format()` tag

- Use `@format()` for numbers, distributions, and dates that could use obvious formatting.
- The `@format()` tag is not usable with dictionaries, functions, or lists. It is usable with variable assignments. Examples:

```squiggle
net_benefit(costs, benefits) = benefits - costs // not valid for @format()
net_benefit = benefits - costs // valid for @format()
```

- This mainly makes sense for dollar amounts, percentages, and dates. ".0%" is a decent format for percentages, and "$,.0f" can be used for dollars.
- Choose the number of decimal places based on the stdev of the distribution or size of the number.
- Do not use "()" instead of "-" for negative numbers. So, do not use "($,.0f" for negative numbers, use "$,.0f" instead.

## Comments

- Add a short 1-2 line comment on the top of the file, summarizing the model.
- Add comments throughout the code that explain your reasoning and describe your uncertainties. Give special attention to probabilities and probability distributions that are particularly important and/or uncertain. Flag your uncertainties.
- Use comments next to variables to explain what units the variable is in, if this is not incredibly obvious. The units should be wrapped in parentheses.
- There shouldn't be any comments about specific changes made during editing.
- Do not use comments to explain things that are already obvious from the code.

## Domains

- Prefer using domains to throwing errors, when trying to restrict a variable. For example, don't write, "if year < 2023 then throw("Year must be 2023 or later")". Instead, write f(t: [2023, 2050]).
- Err on the side of using domains in cases where you are unsure about the bounds of a function, instead of using if/throw or other error handling methods.
- If you only want to set a min or max value, use a domain with Number.maxValue or -Number.maxValue as the other bound.
- Do not use a domain with a complete range, like [-Number.maxValue, Number.maxValue]. This is redundant. Instead, just leave out the domain, like "foo(f)".

```squiggle
// Do not use this
f(t: [-Number.maxValue, Number.maxValue]) + 1

// Do this
f(t) = t + 1
```

## Tests

- Use `sTest` to test squiggle code.
- Test all functions that you are unsure about. Be paranoid.
- Use one describe block, with the variable name 'tests'. This should have several tests with in it, each with one expect statement.
- Use @startClosed tags on variables that are test results. Do not use @hide tags.
- Do not test if function domains return errors when called with invalid inputs. The domains should be trusted.
- If you set variables to sTest values, @hide them. They are not useful in the final output.
- Do not test obvious things, like the number of items in a list that's hardcoded.
- Feel free to use helper functions to avoid repeating code.
- The expect.toThrowAnyError() test is useful for easily sanity-checking that a function is working with different inputs.

Example:

```squiggle
@hide
describe = sTest.describe

@hide
test = sTest.test
```

## Naming Conventions

- Use snake_case for variable names.
- All variable names must start with a lowercase letter.
- In functions, input parameters that aren't obvious should have semantic names. For example, instead of "nb" use "net_benefit".

## Estimations

- When using the "to" format, like "3 to 10", remember that this represents the 5th and 95th percentile. This is a very large range. Be paranoid about being overconfident and too narrow in your estimates.
- One good technique, when you think there's a chance that you might be very wrong about a variable, is to use a mixture that contains a very wide distribution. For example, mx([300 to 400, 50 to 5000], [0.9, 0.1]). This way if you are caught by surprise, the wide distribution will still give you a reasonable outcome.
- Be wary of using the uniform or the PERT distributions. The uniform distribution is mainly good for physical simulations.
- If the outcome of a model is an extreme probability (<0.01 or >0.99), be suspicious of the result. It should be very rare for an intervention to have an extreme effect or have an extreme impact on the probability of an event.
- Be paranoid about the uncertainty ranges of your variables. If you are dealing with a highly speculative variable, the answer might have 2-8 orders of magnitude of uncertainty, like "100 to 100K". If you are dealing with a variable that's fairly certain, the answer might have 2-4 sig figs of uncertainty. Be focused on being accurate and not overconfident, not on impressing people.
- Be careful with sigmoid functions. Sigmoid curves with distributions can have very little uncertainty in the middle, and very high uncertainty at the tails. If you are unsure about these values, consider using a mixture distribution. For example, this curve has very high certainty in the middle, and very high uncertainty at the tails: `adoption_rate(t: inputs.t) = 1 / (1 + exp(-normal(0.1, 0.08) * (t - 30)))`
- Make sure to flag any variables that are highly speculative. Use @doc() to explain that the variable is speculative and to give a sense of the uncertainty. Explain your reasoning, but also warn the reader that the variable is speculative.

## Percentages / Probabilities

- Use a @format() tag, like ".0%" to format percentages.
- If using a distribution, remember that it shouldn't go outside of 0% and 100%. You can use beta distributions or truncate() to keep values in the correct range.
- If you do use a beta distribution, keep in mind that there's no ({p5, p95}) format. You can use beta(alpha:number, beta:number) or beta({mean: number, stdev: number}) to create a beta distribution.

## Numbers

- Use abbreviations, when simple, for numbers outside the range of 10^4 to 10^3. For example, use "10k" instead of "10000".
- For numbers outside the range of 10^10 or so, use scientific notation. For example, "1e10".
- Don't use small numbers to represent large numbers. For example, don't use '5' to represent 5 million.

Don't use the code:

```squiggle
@name("US Population (millions)")
us_population = 331.9
```

Instead, use:

```squiggle
@name("US Population")
us_population = 331.9M
```

More examples:

```squiggle
// Correct representations
world_population = 7.8B
annual_budget = 1.2T
distance_to_sun = 149.6e6  // 149.6 million kilometers

// Incorrect representations (avoid these)
world_population = 7800  // Unclear if it's 7800 or 7.8 billion
annual_budget = 1200  // Unclear if it's 1200 or 1.2 trillion
```

- There's no need to use @format on regular numbers. The default formatting is fairly sophistated.

## Dictionaries

- In dictionaries, if a key name is the same as a variable name, use the variable name directly. For example, instead of {value: value}, just use {value}. If there's only one key, you can type it with a comma, like this: {value,}.

## Lists of Structured Data

- When you want to store complex data as code, use lists of dictionaries, instead of using lists of lists. This makes things clearer. For example, use:

```squiggle
[
  {year: 2023, value: 1},
  {year: 2024, value: 2},
]
instead of:
[
  [2023, 1],
  [2024, 2],
]
```

You can use lists instead when you have a very long list of items (20+), very few keys, and/or are generating data using functions.

- Tables are a great way to display structured data.
- You can use the '@showAs' tag to display a table if the table can show all the data. If this takes a lot of formatting work, you can move that to a helper function. Note that helper functions must be placed before the '@showAs' tag.

For example:

```squiggle
@hide
strategiesTable(data) = Table.make(
  data,
  {
    columns: [
      { name: "name", fn: {|f| f.n} },
      { name: "costs", fn: {|f| f.c} },
      { name: "benefits", fn: {|f| f.b} },
    ],
  }
)

@name("AI Safety Strategies")
@doc("List of 10 AI safety strategies with their costs and benefits")
@showAs(strategiesTable)
strategies = [
  { n: "AI Ethics", c: 1M to 5M, b: 5M to 20M },
  { n: "Alignment Research", c: 2M to 10M, b: 10M to 50M },
  { n: "Governance", c: 500k to 3M, b: 2M to 15M },
  ...
]
```

## Tables

- Tables are a good way of displaying structured data. They can take a bit of formatting work.
- Tables are best when there are fewer than 30 rows and/or fewer than 4 columns.
- The table visualization is fairly simple. It doesn't support sorting, filtering, or other complex interactions. You might want to sort or filter the data before putting it in a table.

## Notebooks

- Use the @notebook tag for long descriptions intersperced with variables. This must be a list with strings and variables alternating.
- If you want to display variables within paragraphs, generally render dictionaries as items within the notebook list. For example:

```squiggle
@notebook
@startOpen
summary = [
"This model evaluates the cost-effectiveness of coffee consumption for a 34-year-old male, considering productivity benefits, health effects, and financial costs.",
{
   optimal_cups,
   result.net_benefit,
},
]
```

This format will use the variable tags to display the variables, and it's simple to use without making errors. If you want to display a variable that's already a dictionary, you don't need to do anything special.

- String concatenation (+) is allowed, but be hesitant to do this with non-string variables. Most non-string variables don't display well in the default string representation. If you want to display a variable, consider using a custom function or formatter to convert it to a string first. Note that tags are shown in the default string representation, so you should remove them (`Tag.clear(variable)`) before displaying.
- Separate items in the list will be displayed with blank lines between them. This will break many kinds of formatting, like lists. Only do this in order to display full variables that you want to show.
- Use markdown formatting for headers, lists, and other structural elements.
- Use bold text to highlight key outputs. Like, "The optimal number of coffee cups per day is **" + Tag.clear(optimal_cups) + "**".

Example: (For a model with 300 lines)

```squiggle
@notebook
@startOpen
summary = [
  "## Summary
  This model evaluates the cost-effectiveness of coffee consumption for a 34-year-old male, considering productivity benefits, health effects, and financial costs.",
  {inputs, final_answer},
  "## Major Assumptions & Uncertainties
  - The model places a very high value on productivity. If you think that productivity is undervalued, coffee consumption may be underrated.
  - The model only includes 3 main factors: productivity, cost, and health. It does not take into account other factors, like addiction, which is a major factor in coffee consumption.
  - The model does not take into account the quality of sleep, which is critical.
  "
  "## Outputs
  The optimal number of coffee cups per day: **" + Tag.clear(optimal_cups) + "**
  The net benefit at optimal consumption: **" + result.net_benefit + "**",
  "## Key Findings
  - Moderate amounts of coffee consumption seem surprisingly beneficial.
  - Productivity boost from coffee shows steeply diminishing returns as consumption increases, as would be expected.
  - The financial cost of coffee is the critical factor in determining optimal consumption.
  ## Detailed Analysis
  The model incorporates several key factors:
  1. Productivity boost: Modeled with diminishing returns as coffee consumption increases.
  2. Health impact: Considers both potential benefits and risks of coffee consumption.
  3. Financial cost: Accounts for the direct cost of purchasing coffee.
  4. Monetary values: Includes estimates for the value of time (hourly wage) and health (QALY value).

  The optimal consumption level is determined by maximizing the net benefit, which is the sum of monetized productivity and health benefits minus the financial cost.

  It's important to note that this model is based on general estimates and may not apply to all individuals. Factors such as personal health conditions, caffeine sensitivity, and lifestyle choices could significantly alter the optimal consumption for a specific person.
  "
]
```

## Summary Notebook

- For models over 5 lines long, include a summary notebook at the end of the file using the @notebook tag.
- Aim for a summary length of approximately (N^0.6) \* 1.2 lines, where N is the number of lines in the model.
- Use the following structure:
  1. Model description
  2. Major assumptions & uncertainties (if over 100 lines long)
  3. Outputs (including relevant Squiggle variables)
  4. Key findings (flag if anything surprised you, or if the results are counterintuitive)
  5. Detailed analysis (if over 300 lines long)
  6. Important notes or caveats (if over 100 lines long)
- The summary notebook should be the last thing in the file. It should be a variable called `summary`.
- Draw attention to anything that surprised you, or that you think is important. Also, flag major assumptions and uncertainties.

Example: (For a model with 300 lines)

```squiggle
@notebook
@startOpen
summary = [
  "## Summary
  This model evaluates the cost-effectiveness of coffee consumption for a 34-year-old male, considering productivity benefits, health effects, and financial costs.",
  {inputs, final_answer},
  ...
  ]
```
