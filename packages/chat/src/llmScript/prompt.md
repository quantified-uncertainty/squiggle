Write Squiggle code, using the attached documentation for how it works.  

Be sure to use the sTest library.

## Available Matchers

- `toBe(expected)`: Checks for exact equality
- `toBeGreaterThan(expected)`: Checks if the actual value is greater than the expected
- `toBeLessThan(expected)`: Checks if the actual value is less than the expected
- `toBeTrue()`: Checks if the value is true
- `toBeFalse()`: Checks if the value is false

```squiggle
import "hub:ozziegooen/sTest" as sTest

myTestSuite = sTest.describe("My Test Suite", [
  sTest.test("First test", {|| sTest.expect(true).toBeTrue()}),
  sTest.test("Second test", {|| sTest.expect(5).toBeGreaterThan(3)})
])
```

Key instructions:
Write the entire code, don't truncate it. So don't ever use "...", just write out the entire code. The code output you produce should be directly runnable in Squiggle, it shouldn't need any changes from users.

About Squiggle.
Squiggle is a very simple language, that's much simpler than JS. Don't try using language primitives/constructs you don't see below, or that aren't in our documentation. They are likely to fail.

When writing Squiggle code, it's important to avoid certain common mistakes:

### Syntax and Structure
1. Variable Expansion: Not supported. Don't use syntax like |v...| or |...v|.
2. All pipes are "->", not "|>".
3. Dict keys and variable names must be lowercase.
4. The last value in a block/function is returned (no "return" keyword).
5. Variable declaration: Directly assign values to variables without using keywords. For example, use ``foo = 3`` instead of ``let foo = 3``.
6. All statements in your model, besides the last one must either be comments or variable declarations. You can't do, ```4 \n 5 \n 6``` Similarly, you can't do, ```Calculator() ... Table()``` - instead, you need to set everything but the last item to a variable.

### Function Definitions and Use
1. Anonymous Functions: Use {|e| e} syntax for anonymous functions.
2. Function Parameters: When using functions like normal, specify the standard deviation with stdev instead of sd. For example, use normal({mean: 0.3, stdev: 0.1}) instead of normal({mean: 0.3, sd: 0.1}).
3. There's no recursion.
4. You can't call functions that accept ranges, with distributions. No, ``({|foo: [1,20]| foo}) (4 to 5)``.

### Data Types and Input Handling
1. Input Types: Use Input.text for numeric inputs instead of Input.number or Input.slider.
2. The only function param types you can provide are numeric/date ranges, for numbers. f(n:[1,10]). Nothing else is valid. You cannot provide regular input type declarations.
3. Only use Inputs directly inside calculators. They won't return numbers, just input types.

### Looping, Conditionals, and Data Operations
1. Conditional Statements: There are no case or switch statements. Use if/else for conditional logic.
2. There aren't for loops or mutation. Use immutable code, and List.map / List.reduce / List.reduceWhile.
3. Remember to use ``Number.sum`` and ``Number.product``, instead of using Reduce in those cases.

### List and Dictionary Operations
1. You can't do "(0..years)". Use List.make or List.upTo.
2. There's no "List.sort", but there is "List.sortBy", "Number.sort".

### Randomness and Distribution Handling
1. There's no random() function. Use alternatives like sample(uniform(0,1)).
2. When representing percentages, use "5%" instead of "0.05" for readability.
3. The ``to`` syntax only works for >0 values. "4 to 10", not "0 to 10".

### Units and Scales
1. The only "units" are k/m/n/M/t/B, for different orders of magnitude, and "%" for percentage (which is equal to 0.01).
2. If you make a table that contains a column of similar distributions, use a scale to ensure consistent min and max.
3. Scale.symlog() has support for negative values, Scale.log() doesn't. Scale.symlog() is often a better choice for this reason, though Scale.log() is better when you are sure values are above 0.
4. Do use Scale.symlog() and Scale.log() on dists/plots that might need it. Many do!

### Documentation and Comments
1. Tags like @name and @doc apply to the following variable, not the full file.
2. If you use a domain for Years, try to use the Date domain, and pass in Date objects, like Date(2022) instead of 2022.

--- 

This format provides a clear and organized view of the guidelines for writing Squiggle code.


Here's are some simple example Squiggle programs:
```squiggle
//Model for Piano Tuners in New York Over Time

@name("Population of New York in 2022")
@doc("I'm really not sure here, this is a quick guess.")
populationOfNewYork2022 = 8.1M to 8.4M

@name("Percentage of Population with Pianos")
proportionOfPopulationWithPianos = 0.2% to 1%

@name("Number of Piano Tuners per Piano")
pianoTunersPerPiano = {
  pianosPerPianoTuner = 2k to 50k
  1 / pianosPerPianoTuner
}

//We only mean to make an estimate for the next 10 years.
@hide
domain = [Date(2024), Date(2034)]

@name("Time in years after 2024")
populationAtTime(t: domain) = {
  dateDiff = Duration.toYears(t - Date(2024))
  averageYearlyPercentageChange = normal({ p5: -1%, p95: 5% }) // We're expecting NYC to continuously grow with an mean of roughly between -1% and +4% per year
  populationOfNewYork2022 * (averageYearlyPercentageChange + 1) ^ dateDiff
}
totalTunersAtTime(t: domain) = populationAtTime(t) *
  proportionOfPopulationWithPianos *
  pianoTunersPerPiano

result = {
  populationAtTime,
  totalTunersAtTimeMedian: {|t: domain| median(totalTunersAtTime(t))},
}
```

```squiggle
calculator = Calculator(
  {|a, b,c,d| [a,b,c,d]},
  {
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

```squiggle
table = Table.make(
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
```

```squiggle
x = 10
result = if x == 1 then {
  {y: 2, z: 0}
} else {
  {y: 0, z: 4}
}
y = result.y
z = result.z
```

```squiggle
@showAs({|f| Plot.numericFn(f, { xScale: Scale.log({ min: 1, max: 100 }) })})
fn(t) = t ^ 2
```

```squiggle
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

````squiggle
f(t: [Date(2020), Date(2040)]) = {
  yearsPassed = toYears(t - Date(2020))
  normal({mean: yearsPassed ^ 2, stdev: yearsPassed^1.3+1})
}```

```squiggle
import "hub:ozziegooen/sTest" as sTest
// Model Parameters
flightCost = normal({ mean: 600, stdev: 100 }) // Distribution for cost of flight in USD
benefitEstimate = normal({ mean: 1500, stdev: 300 }) // Distribution for benefit of traveling to London

// Calculation of Net Benefit
netBenefit = benefitEstimate - flightCost

// Test Suite for the Model
testSuite = sTest.describe(
  "Flight to London Test Suite",
  [
    // Test for reasonable flight costs
    sTest.test(
      "Flight cost should be reasonable",
      {
        ||
        sampleValue = sample(flightCost)
        sTest.expect(sampleValue).toBeGreaterThan(300)
      }
    ),
  ]
)
```

# Language Features 

## Program Structure

A Squiggle program consists of a series of definitions (for example, `x = 5`, `f(x) = x * x`). This can optionally conclude with an *end expression*.

If an end expression is provided, it becomes the evaluated output of the program, and only this result will be displayed in the viewer. Otherwise, all top-level variable definitions will be displayed.

```squiggle
x = 5
y = 10
x + y
```

```squiggle
x = 5
y = 10
```

## Immutability

All variables in Squiggle are immutable, similar to other functional programming languages like OCaml or Haskell.

In the case of container types (lists and dictionaries), this implies that an operation such as myList[3] = 10 is not permitted. Instead, we recommend using `List.map`, `List.reduce` or other [List functions](/docs/Api/List).

In case of basic types such as numbers or strings, the impact of immutability is more subtle.

Consider this code:

```squiggle
x = 5
x = x + 5
```

While it appears that the value of x has changed, what actually occurred is the creation of a new variable with the same name, which [shadowed](https://en.wikipedia.org/wiki/Variable_shadowing) the previous x variable.

In most cases, shadowing behaves identically to what you'd expect in languages like JavaScript or Python.

One case where shadowing matters is closures:

```squiggle
x = 5
argPlusX(y) = x + y

x = x + 5

argPlusX(5)
```

In the above example, the `argPlusX` function captures the value of `x` from line 1, not the newly shadowed `x` from line 4. As a result, `argPlusX(5)` returns 10, not 15.

## Blocks

Blocks are special expressions in Squiggle that can contain any number of local definitions and end with an expression.

```squiggle
x = { 5 } // same as "x = 5"
y = {
  t = 10 // local variable, won't be available outside of the block body
  5 * t // end expression
}
```

## Conditionals

If/then/else statements in Squiggle are values too.

```squiggle
x = 5
if x<8 then 10 else 3
```

See [Control flow](/docs/Guides/ControlFlow) for more details and examples.

## Comments

```squiggle
// This is a single-line comment\n
/*
This is a multiple
-line comment.
*/
foo = 5
```

## Pipes

Squiggle features [data-first](https://www.javierchavarri.com/data-first-and-data-last-a-comparison/) pipes. Functions in the standard library are organized to make this convenient.

```squiggle
normal(5,2) -> truncateLeft(3) -> SampleSet.fromDist -> SampleSet.map({|r| r + 10})
```

## Standard Library

Squiggle features a simple [standard libary](/docs/Api/Dist).

Most functions are namespaced under their respective types to keep functionality distinct. Certain popular functions are usable without their namespaces.

For example,

```squiggle
a = List.upTo(0, 5000) -> SampleSet.fromList // namespaces required
b = normal(5,2) // namespace not required
c = 5 to 10 // namespace not required
```

## Simple Error Handling

Squiggle supports the functions [throw](/docs/Api/Common#throw) and [try](/docs/Api/Common#try) for simple error handling. It does not yet have proper error types.


# Gotchas

## Point Set Distributions Conversions

Point Set conversions are done with [kernel density estimation](https://en.wikipedia.org/wiki/Kernel_density_estimation), which is lossy. This might be particularly noticeable in cases where distributions should be entirely above zero.

In this example, we see that the median of this (highly skewed) distribution is positive when it's in a Sample Set format, but negative when it's converted to a Point Set format.

```squiggle
dist = SampleSet.fromDist(5 to 100000000)
{
    sampleSetMedian: quantile(dist, .5),
    pointSetMedian: quantile(PointSet.fromDist(dist), .5),
    dist: dist
}
```

---

This can be particularly confusing for visualizations. Visualizations automatically convert distributions into Point Set formats. Therefore, they might often show negative values, even if the underlying distribution is fully positive.

We plan to later support more configuration of kernel density estimation, and for visualiations of Sample Set distributions to instead use histograms.

## Sample Set Correlations

Correlations with Sample Set distributions are a bit complicated. Monte Carlo generations with Squiggle are ordered. The first sample in one Sample Set distribution will correspond to the first sample in a distribution that comes from a resulting Monte Carlo generation. Therefore, Sample Set distributions in a chain of Monte Carlo generations are likely to all be correlated with each other. This connection breaks if any node changes to the Point Set or Symbolic format.

In this example, we subtract all three types of distributions by themselves. Notice that the Sample Set distribution returns 0. The other two return the result of subtracting one normal distribution from a separate uncorrelated distribution. These results are clearly very different to each other.

```squiggle
sampleSetDist = normal(5, 2)
pointSetDist = sampleSetDist -> PointSet.fromDist
symbolicDist = Sym.normal(5, 2)
[
  sampleSetDist - sampleSetDist,
  pointSetDist - pointSetDist,
  symbolicDist - symbolicDist,
]
```



# Functions

## Basic syntax

```squiggle
myMultiply(t) = normal(t^2, t^1.2+.01)
myMultiply
```

In Squiggle, function definitions are treated as values. There's no explicit `return` statement; the result of the last expression in the function body is returned.
If you need to define local variables in functions, you can use blocks. The last expression in the block is the value of the block:

```squiggle
multiplyBySix(x) = {
  doubleX = x * 2
  doubleX * 3
  }
```

## Anonymous Functions

In Squiggle, you can define anonymous functions using the `{|...| ...}` syntax. For example, `myMultiply(x, y) = x * y` and `myMultiply = {|x, y| x * y}` are equivalent.

Squiggle functions are first-class values, meaning you can assign them to variables, pass them as arguments to other functions, and return them from other functions.
```squiggle
{|t| normal(t^2, t^1.2+.01)}
```

## Function Visualization

The Squiggle viewer can automatically visualize functions that take a single number as input and return either a number or a distribution, without the need for manual plots:

1. `(number) => number`
2. `(number) => distribution`

```squiggle
numberToNumber(x) = x * x
numberToDistribution(x) = normal(x + 1, 3)
placeholderFunction(x, y) = x + y
```

When Squiggle visualizes a function, it automatically selects a range of input values to use.
The default range of input values is 0 to 10.

You can manually set the range in the following ways:

- With `Plot.numericFn` or `Plot.distFn` plots, using the `xScale` parameter
- Through the chart's settings in the UI (look for a gear icon next to the variable name)
- With parameter annotations (explained below)
## Parameter Annotations

Function parameters can be annotated with _domains_ to specify the range of valid input values.

Examples:

- `x: Number.rangeDomain(5, 10)`
- `x: [5, 10]` — shortcut for `Number.rangeDomain(...)`

Annotations help to document possible values that can be passed as a parameter's value.

Annotations will affect the parameter range used in the function's chart. For more control over function charts, you can use the [Plot module API](/docs/Api/Plot).

Domains are checked on function calls; `f(x: [1,2]) = x; f(3)` will fail.

We plan to support other kinds of domains in the future; for now, only numeric ranges are supported.

```squiggle
yearToValue(year: [2020, 2100]) = 1.04 ^ (year - 2020)
```

### Annotation Reflection

```squiggle
myMultiply(x: [1, 20]) = x * x
myMultiply.parameters[0]
```

Domains and parameter names can be accessed by the `fn.parameters` property.

# Control Flow

This page documents control flow. Squiggle has if/else statements, but not for loops. But for for loops, you can use reduce/map constructs instead, which are also documented here.

## Conditionals

### If-else

```squiggle
if condition then result else alternative
```

```squiggle
x = 10
if x == 1 then 1 else 2
```

### If-else as a ternary operator

```squiggle
test ? result : alternative;
```

```squiggle
x = 10
x == 0 ? 1 : 2
```

### Tips and tricks

#### Use brackets and parenthesis to organize control flow

```squiggle
x = 10
if x == 1 then {
  1
} else {
  2
}
```

or

```squiggle
x = 10
y = 20
if x == 1 then {
  (
    if y == 0 then {
      1
    } else {
      2
    }
  )
} else {
  3
}
```

This is overkill for simple examples becomes useful when the control conditions are more complex.

#### Save the result to a variable

Assigning a value inside an if/else flow isn't possible:

```squiggle
x = 10
y = 20
if x == 1 then {
  y = 1
} else {
  y = 2 * x
}
```

Instead, you can do this:

```squiggle
x = 10
y = 20
y = if x == 1 then {
  1
} else {
  2 * x
}
```

Likewise, for assigning more than one value, you can't do this:

```squiggle
y = 0
z = 0
if x == 1 then {
  y = 2
} else {
  z = 4
}
```

Instead, do:

```squiggle
x = 10
result = if x == 1 then {
  {y: 2, z: 0}
} else {
  {y: 0, z: 4}
}
y = result.y
z = result.z
```

## For loops

For loops aren't supported in Squiggle. Instead, use a [map](/docs/Api/List#map) or a [reduce](/docs/Api/List#reduce) function.

Instead of:

```js
xs = [];
for (i = 0; i < 10; i++) {
  xs[i] = f(x);
}
```

do:

```squiggle
f(x) = 2*x
xs = List.upTo(0,10)
ys = List.map(xs, {|x| f(x)})
```


# Basic Types

## Numbers

Squiggle numbers are built directly on [Javascript numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). They can be integers or floats, and support all the usual arithmetic operations.  
[Number API](/docs/Api/Number)

Numbers support a few scientific notation suffixes.

| Suffix | Multiplier |
| ------ | ---------- |
| n      | 10^-9      |
| m      | 10^-3      |
| %      | 10^-2      |
| k      | 10^3       |
| M      | 10^6       |
| B,G    | 10^9       |
| T      | 10^12      |
| P      | 10^15      |

There's no difference between floats and integers in Squiggle.

```squiggle
n = 4.32
kilo = 4.32k
micro = 4.32m
veryLarge = 1e50
verySmall = 1e-50
```

## Booleans

Booleans can be `true` or `false`.

```squiggle
t = true
f = false
```

## Strings

Strings can be created with either single or double quotes.  
[String API](/docs/Api/String)

```squiggle
s = "Double-quoted"
s2 = 'Single-quoted'
```

## Distributions

Distributions are first-class citizens. Use the syntax `a to b` to create a quick lognormal distribution, or write out the whole distribution name.

```squiggle
a = 10 to 20
b = normal(4, 2)
c = lognormal({ mean: 50, stdev: 10 })
d = mixture(a, b, c, [.3, .3, .4])
d
```

See these pages for more information on distributions:
- [Distribution Creation](/docs/Guides/DistributionCreation)
- [Distribution Functions Guide](/docs/Guides/Functions)
- [Distribution API](/docs/Api/Dist)

There are [3 internal representation formats for distributions](docs/Discussions/Three-Formats-Of-Distributions): [Sample Set](/docs/API/DistSampleSet), [Point Set](/docs/API/DistPointSet), and Symbolic. By default, Squiggle will use sample set distributions, which allow for correlations between parameters. Point Set and Symbolic distributions will be more accurate and fast, but do not support correlations. If you prefer this tradeoff, you can manually use them by adding a `Sym.` before the distribution name, i.e. `Sym.normal(0, 1)`.

## Lists

Squiggle lists can contain items of any type, similar to lists in Python. You can access individual list elements with `[number]` notation, starting from `0`. 

Squiggle is an immutable language, so you cannot modify lists in-place. Instead, you can use functions such as `List.map` or `List.reduce` to create new lists.  
[List API](/docs/Api/List)

```squiggle
myList = [1, "hello", 3 to 5, ["foo", "bar"]]
first = myList[0] // 1
bar = myList[3][1] // "bar"
```


## Dictionaries

Squiggle dictionaries work similarly to Python dictionaries or Javascript objects. Like lists, they can contain values of any type. Keys must be strings.  
[Dictionary API](/docs/Api/Dictionary)

```squiggle
d = {dist: triangular(0, 1, 2), weight: 0.25, innerDict: {foo: "bar"}}
```


## Other types

Other Squiggle types include:

- [Functions](/docs/Guides/Functions)
- [Plots](/docs/Api/Plot)
- [Scales](/docs/Api/Plot#scales)
- [Domains](#parameter-annotations)---
description: 
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Common
Functions that work on many different types of values. Also see the experimental [JSON functions](/docs/Api/Danger#json).

Common.equal ==: (any, any) => Bool
Returns true if the two values passed in are equal, false otherwise. Does not work for Squiggle functions, but works for most other types.


Common.unequal !=: (any, any) => Bool


Common.typeOf: (any) => String
Returns the type of the value passed in as a string. This is useful when you want to treat a value differently depending on its type.
myString = typeOf("foo")
myBool = typeOf(true)
myDist = typeOf(5 to 10)
myFn = typeOf({|e| e})


Common.inspect: ('A, message?: String) => 'A
Runs Console.log() in the [Javascript developer console](https://www.digitalocean.com/community/tutorials/how-to-use-the-javascript-developer-console) and returns the value passed in.


Common.throw: (message: String?) => any
Throws an error. You can use `try` to recover from this error.


Common.try: (fn: () => 'A, fallbackFn: () => 'B) => 'A|'B
Try to run a function and return its result. If the function throws an error, return the result of the fallback function instead.

---
description: 
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Boolean

Boolean.or ||: (Bool, Bool) => Bool


Boolean.and &&: (Bool, Bool) => Bool


Boolean.not !: (Bool) => Bool

---
description: Dates are a simple date time type.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Date
A simple date type. Dates are stored as milliseconds since the epoch. They are immutable, and all functions that modify dates return a new date. Used with [Duration](./Duration) values.

    Dates can be useful for modeling values that change over time. Below is a simple example of a function that returns a normal distribution that changes over time, based on the number of years passed since 2020.
<SquiggleEditor
defaultCode={`f(t: [Date(2020), Date(2040)]) = {
  yearsPassed = toYears(t - Date(2020))
  normal({mean: yearsPassed ^ 2, stdev: yearsPassed^1.3+1})
}`}/>
    

## Constructors

Date.make: (String) => Date, (year: Number, month: Number, day: Number) => Date, (year: Number) => Date
d1 = Date.make("2020-05-12")
d2 = Date.make(2020, 5, 10)
d3 = Date.make(2020.5)


## Conversions

Date.fromUnixTime: (Number) => Date
Date.fromUnixTime(1589222400)

Date.toUnixTime: (Date) => Number
Date.toUnixTime(Date.make(2020, 5, 12))


## Algebra

Date.subtract -: (Date, Date) => Duration
Date.make(2020, 5, 12) - Date.make(2000, 1, 1)

Date.subtract -: (Date, Date) => Duration
Date.make(2020, 5, 12) - Date.make(2000, 1, 1)

Date.add +: (Date, Duration) => Date, (Duration, Date) => Date
Date.make(2020, 5, 12) + 20years
20years + Date.make(2020, 5, 12)


## Comparison

Date.smaller <: (Date, Date) => Bool

Date.larger >: (Date, Date) => Bool

Date.smallerEq <=: (Date, Date) => Bool

Date.largerEq >=: (Date, Date) => Bool


## Other

Date.rangeDomain: (min: Date, min: Date) => Domain
Date.rangeDomain(Date(2000), Date(2010))



---
description: Squiggle dictionaries work similar to Python dictionaries. The syntax is similar to objects in Javascript.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Dict
Squiggle dictionaries work similar to Python dictionaries. The syntax is similar to objects in Javascript.

## Conversions

Dict.toList: (Dict('A)) => List([String, 'A])
Dict.toList({a: 1, b: 2})

Dict.fromList: (List([String, 'A])) => Dict('A)
Dict.fromList([
      ["foo", 3],
      ["bar", 20],
    ]) // {foo: 3, bar: 20}


## Transformations

Dict.set: (Dict('A), key: String, value: 'A) => Dict('A)
Creates a new dictionary that includes the added element, while leaving the original dictionary unaltered.
Dict.set({a: 1, b: 2}, "c", 3)

Dict.delete: (Dict('A), key: String) => Dict('A)
Creates a new dictionary that excludes the deleted element.
Dict.delete({a: 1, b: 2}, "a")

Dict.merge: (Dict(any), Dict(any)) => Dict(any)
first = { a: 1, b: 2 }
snd = { b: 3, c: 5 }
Dict.merge(first, snd)

Dict.mergeMany: (List(Dict(any))) => Dict(any)
first = { a: 1, b: 2 }
snd = { b: 3, c: 5 }
Dict.mergeMany([first, snd]) // {a: 1, b: 3, c: 5}

Dict.map: (Dict('A), fn: ('A) => 'B) => Dict('B)
Dict.map({a: 1, b: 2}, {|x| x + 1})

Dict.mapKeys: (Dict('A), fn: (String) => String) => Dict('A)
Dict.mapKeys({a: 1, b: 2, c: 5}, {|x| concat(x, "-foobar")})

Dict.omit: (Dict('A), List(String)) => keys: Dict('A)
Creates a new dictionary that excludes the omitted keys.
data = { a: 1, b: 2, c: 3, d: 4 }
Dict.omit(data, ["b", "d"]) // {a: 1, c: 3}


## Queries

Dict.has: (Dict(any), key: String) => Bool
Dict.has({a: 1, b: 2}, "c")

Dict.size: (Dict(any)) => Number
Dict.size({a: 1, b: 2})

Dict.keys: (Dict(any)) => List(String)
Dict.keys({a: 1, b: 2})

Dict.values: (Dict('A)) => List('A)
Dict.values({ foo: 3, bar: 20 }) // [3, 20]

Dict.pick: (Dict('A), keys: List(String)) => Dict('A)
Creates a new dictionary that only includes the picked keys.
data = { a: 1, b: 2, c: 3, d: 4 }
Dict.pick(data, ["a", "c"]) // {a: 1, c: 3}



---
description: Distributions are the flagship data type in Squiggle. The distribution type is a generic data type that contains one of three different formats of distributions.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Dist
Distributions are the flagship data type in Squiggle. The distribution type is a generic data type that contains one of three different formats of distributions.

These subtypes are [point set](/docs/api/DistPointSet), [sample set](/docs/api/DistSampleSet), and [symbolic](/docs/api/Sym). The first two of these have a few custom functions that only work on them. You can read more about the differences between these formats [here](/docs/Discussions/Three-Formats-Of-Distributions).

Several functions below only can work on particular distribution formats. For example, scoring and pointwise math requires the point set format. When this happens, the types are automatically converted to the correct format. These conversions are lossy.
    
Distributions are created as [sample sets](/DistSampleSet) by default. To create a symbolic distribution, use `Sym.` namespace: `Sym.normal`, `Sym.beta` and so on.

## Distributions

These are functions for creating primitive distributions. Many of these could optionally take in distributions as inputs. In these cases, Monte Carlo Sampling will be used to generate the greater distribution. This can be used for simple hierarchical models.

See a longer tutorial on creating distributions [here](/docs/Guides/DistributionCreation).

Dist.make: (Dist) => Dist, (Number) => SymbolicDist
Dist.make(5)
Dist.make(normal({p5: 4, p95: 10}))

Dist.mixture: (List(Dist|Number), weights?: List(Number)) => Dist, (Dist|Number) => Dist, (Dist|Number, Dist|Number, weights?: [Number, Number]) => Dist, (Dist|Number, Dist|Number, Dist|Number, weights?: [Number, Number, Number]) => Dist, (Dist|Number, Dist|Number, Dist|Number, Dist|Number, weights?: [Number, Number, Number, Number]) => Dist, (Dist|Number, Dist|Number, Dist|Number, Dist|Number, Dist|Number, weights?: [Number, Number, Number, Number, Number]) => Dist
The ``mixture`` function takes a list of distributions and a list of weights, and returns a new distribution that is a mixture of the distributions in the list. The weights should be positive numbers that sum to 1. If no weights are provided, the function will assume that all distributions have equal weight.
    
Note: If you want to pass in over 5 distributions, you must use the list syntax.
mixture(1,normal(5,2))
mixture(normal(5,2), normal(10,2), normal(15,2), [0.3, 0.5, 0.2])
mixture([normal(5,2), normal(10,2), normal(15,2), normal(20,1)], [0.3, 0.5, 0.1, 0.1])

Dist.mx: (List(Dist|Number), weights?: List(Number)) => Dist, (Dist|Number) => Dist, (Dist|Number, Dist|Number, weights?: [Number, Number]) => Dist, (Dist|Number, Dist|Number, Dist|Number, weights?: [Number, Number, Number]) => Dist, (Dist|Number, Dist|Number, Dist|Number, Dist|Number, weights?: [Number, Number, Number, Number]) => Dist, (Dist|Number, Dist|Number, Dist|Number, Dist|Number, Dist|Number, weights?: [Number, Number, Number, Number, Number]) => Dist
Alias for mixture()
mx(1,normal(5,2))

Dist.normal: (mean: Dist|Number, stdev: Dist|Number) => SampleSetDist, ({p5: Number, p95: Number}) => SampleSetDist, ({p10: Number, p90: Number}) => SampleSetDist, ({p25: Number, p75: Number}) => SampleSetDist, ({mean: Number, stdev: Number}) => SampleSetDist
normal(5,1)
normal({p5: 4, p95: 10})
normal({p10: 4, p90: 10})
normal({p25: 4, p75: 10})
normal({mean: 5, stdev: 2})

Dist.lognormal: (mu: Dist|Number, sigma: Dist|Number) => SampleSetDist, ({p5: Number, p95: Number}) => SampleSetDist, ({p10: Number, p90: Number}) => SampleSetDist, ({p25: Number, p75: Number}) => SampleSetDist, ({mean: Number, stdev: Number}) => SampleSetDist
lognormal(0.5, 0.8)
lognormal({p5: 4, p95: 10})
lognormal({p10: 4, p90: 10})
lognormal({p25: 4, p75: 10})
lognormal({mean: 5, stdev: 2})

Dist.uniform: (low: Dist|Number, high: Dist|Number) => SampleSetDist
uniform(10, 12)

Dist.beta: (alpha: Dist|Number, beta: Dist|Number) => SampleSetDist, ({mean: Number, stdev: Number}) => SampleSetDist
beta(20, 25)
beta({mean: 0.39, stdev: 0.1})

Dist.cauchy: (location: Dist|Number, scale: Dist|Number) => SampleSetDist
cauchy(5, 1)

Dist.gamma: (shape: Dist|Number, scale: Dist|Number) => SampleSetDist
gamma(5, 1)

Dist.logistic: (location: Dist|Number, scale: Dist|Number) => SampleSetDist
logistic(5, 1)

Dist.to to: (p5: Dist|Number, p95: Dist|Number) => SampleSetDist
The "to" function is a shorthand for lognormal({p5:min, p95:max}). It does not accept values of 0 or less, as those are not valid for lognormal distributions.
5 to 10
to(5,10)

Dist.exponential: (rate: Dist|Number) => SampleSetDist
exponential(2)

Dist.bernoulli: (p: Dist|Number) => SampleSetDist
bernoulli(0.5)

Dist.triangular: (min: Number, mode: Number, max: Number) => SampleSetDist
triangular(3, 5, 10)


## Basic Functions

Dist.mean: (Dist) => Number

Dist.median: (Dist) => Number

Dist.stdev: (Dist) => Number

Dist.variance: (Dist) => Number

Dist.min: (Dist) => Number

Dist.max: (Dist) => Number

Dist.mode: (Dist) => Number

Dist.sample: (Dist) => Number

Dist.sampleN: (Dist, n: Number) => List(Number)

Dist.exp: (Dist) => Dist

Dist.cdf: (Dist, Number) => Number

Dist.pdf: (Dist, Number) => Number

Dist.inv: (Dist, Number) => Number

Dist.quantile: (Dist, Number) => Number

Dist.truncate: (Dist, left: Number, right: Number) => Dist
Truncates both the left side and the right side of a distribution.

Sample set distributions are truncated by filtering samples, but point set distributions are truncated using direct geometric manipulation. Uniform distributions are truncated symbolically. Symbolic but non-uniform distributions get converted to Point Set distributions.

Dist.truncateLeft: (Dist, Number) => Dist

Dist.truncateRight: (Dist, Number) => Dist


## Algebra (Dist)

Dist.add +: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.multiply *: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.subtract -: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.divide /: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.pow ^: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.log: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.log: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.log10: (Dist) => Dist

Dist.unaryMinus -: (Dist) => Dist


## Algebra (List)

Dist.sum: (List(Dist|Number)) => Dist

Dist.product: (List(Dist|Number)) => Dist

Dist.cumsum: (List(Dist|Number)) => List(Dist)

Dist.cumprod: (List(Dist|Number)) => List(Dist)

Dist.diff: (List(Dist|Number)) => List(Dist)


## Pointwise Algebra

Pointwise arithmetic operations cover the standard arithmetic operations, but work in a different way than the regular operations. These operate on the y-values of the distributions instead of the x-values. A pointwise addition would add the y-values of two distributions.

The infixes `.+`,`.-`, `.*`, `./`, `.^` are supported for their respective operations. `Mixture` works using pointwise addition. 

Pointwise operations work on Point Set distributions, so will convert other distributions to Point Set ones first. Pointwise arithmetic operations typically return unnormalized or completely invalid distributions. For example, the operation{" "} <code>normal(5,2) .- uniform(10,12)</code> results in a distribution-like object with negative probability mass.

Dist.dotAdd: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.dotMultiply: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.dotSubtract: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.dotDivide: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist

Dist.dotPow: (Dist, Number) => Dist, (Number, Dist) => Dist, (Dist, Dist) => Dist


## Normalization

There are some situations where computation will return unnormalized distributions. This means that their cumulative sums are not equal to 1.0. Unnormalized distributions are not valid for many relevant functions; for example, klDivergence and scoring.

The only functions that do not return normalized distributions are the pointwise arithmetic operations and the scalewise arithmetic operations. If you use these functions, it is recommended that you consider normalizing the resulting distributions.

Dist.normalize: (Dist) => Dist
Normalize a distribution. This means scaling it appropriately so that it's cumulative sum is equal to 1. This only impacts Point Set distributions, because those are the only ones that can be non-normlized.

Dist.isNormalized: (Dist) => Bool
Check if a distribution is normalized. This only impacts Point Set distributions, because those are the only ones that can be non-normlized. Most distributions are typically normalized, but there are some commands that could produce non-normalized distributions.

Dist.integralSum: (Dist) => Number
Get the sum of the integral of a distribution. If the distribution is normalized, this will be 1.0. This is useful for understanding unnormalized distributions.


## Utility

Dist.sparkline: (Dist, Number?) => String

Produce a sparkline of length ``n``. For example, `▁▁▁▁▁▂▄▆▇██▇▆▄▂▁▁▁▁▁`. These can be useful for testing or quick visualizations that can be copied and pasted into text.


## Scoring

Dist.klDivergence: (Dist, Dist) => Number
[Kullback–Leibler divergence](https://en.wikipedia.org/wiki/Kullback%E2%80%93Leibler_divergence) between two distributions.

Note that this can be very brittle. If the second distribution has probability mass at areas where the first doesn't, then the result will be infinite. Due to numeric approximations, some probability mass in point set distributions is rounded to zero, leading to infinite results with klDivergence.
Dist.klDivergence(Sym.normal(5,2), Sym.normal(5,1.5))

Dist.logScore: ({estimate: Dist, answer: Dist|Number, prior?: Dist}) => Number
A log loss score. Often that often acts as a [scoring rule](https://en.wikipedia.org/wiki/Scoring_rule). Useful when evaluating the accuracy of a forecast.

    Note that it is fairly slow.
Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1), prior: Sym.normal(5.5,3)})
Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1)})
Dist.logScore({estimate: Sym.normal(5,2), answer: 4.5})



---
description: Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# SampleSet
Sample set distributions are one of the three distribution formats. Internally, they are stored as a list of numbers. It's useful to distinguish point set distributions from arbitrary lists of numbers to make it clear which functions are applicable.

Monte Carlo calculations typically result in sample set distributions.

All regular distribution function work on sample set distributions. In addition, there are several functions that only work on sample set distributions.

## Constructors

SampleSet.make: (Dist) => SampleSetDist, (Number) => SampleSetDist, (List(Number)) => SampleSetDist, ((index?: Number) => Number) => SampleSetDist
Calls the correct conversion constructor, based on the corresponding input type, to create a sample set distribution
SampleSet(5)
SampleSet.make([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])
SampleSet.make({|i| sample(normal(5,2))})


## Conversions

SampleSet.fromDist: (Dist) => SampleSetDist
Converts any distribution type into a sample set distribution.
SampleSet.fromDist(Sym.normal(5,2))

SampleSet.fromNumber: (Number) => SampleSetDist
Convert a number into a sample set distribution that contains ``n`` copies of that number. ``n`` refers to the model sample count.
SampleSet.fromNumber(3)

SampleSet.fromList: (List(Number)) => SampleSetDist
Convert a list of numbers into a sample set distribution.
SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])

SampleSet.toList: (SampleSetDist) => List(Number)
Gets the internal samples of a sampleSet distribution. This is separate from the ``sampleN()`` function, which would shuffle the samples. ``toList()`` maintains order and length.
SampleSet.toList(SampleSet.fromDist(normal(5,2)))

SampleSet.fromFn: ((index?: Number) => Number) => SampleSetDist
Convert a function into a sample set distribution by calling it ``n`` times.
SampleSet.fromFn({|i| sample(normal(5,2))})


## Transformations

SampleSet.map: (SampleSetDist, fn: (Number) => Number) => SampleSetDist
Transforms a sample set distribution by applying a function to each sample. Returns a new sample set distribution.
SampleSet.map(SampleSet.fromDist(normal(5,2)), {|x| x + 1})

SampleSet.map2: (SampleSetDist, SampleSetDist, fn: (Number, Number) => Number) => SampleSetDist
Transforms two sample set distributions by applying a function to each pair of samples. Returns a new sample set distribution.
SampleSet.map2(
  SampleSet.fromDist(normal(5,2)),
  SampleSet.fromDist(normal(5,2)),
  {|x, y| x + y}
)

SampleSet.map3: (SampleSetDist, SampleSetDist, SampleSetDist, fn: (Number, Number, Number) => Number) => SampleSetDist
SampleSet.map3(
  SampleSet.fromDist(normal(5,2)),
  SampleSet.fromDist(normal(5,2)),
  SampleSet.fromDist(normal(5,2)),
  {|x, y, z| max([x,y,z])}
)

SampleSet.mapN: (List(SampleSetDist), fn: (List(Number)) => Number) => SampleSetDist
SampleSet.mapN(
  [
    SampleSet.fromDist(normal(5,2)),
    SampleSet.fromDist(normal(5,2)),
    SampleSet.fromDist(normal(5,2))
  ],
  max
)



---
description: The Sym module provides functions to create some common symbolic distributions.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Sym
Symbolic Distributions. All these functions match the functions for creating sample set distributions, but produce symbolic distributions instead. Symbolic distributions won't capture correlations, but are more performant than sample distributions.

Sym.normal: (Number, Number) => SymbolicDist, ({p5: Number, p95: Number}) => SymbolicDist, ({p10: Number, p90: Number}) => SymbolicDist, ({p25: Number, p75: Number}) => SymbolicDist, ({mean: Number, stdev: Number}) => SymbolicDist
Sym.normal(5, 1)
Sym.normal({ p5: 4, p95: 10 })
Sym.normal({ p10: 4, p90: 10 })
Sym.normal({ p25: 4, p75: 10 })
Sym.normal({ mean: 5, stdev: 2 })


Sym.lognormal: (Number, Number) => SymbolicDist, ({p5: Number, p95: Number}) => SymbolicDist, ({p10: Number, p90: Number}) => SymbolicDist, ({p25: Number, p75: Number}) => SymbolicDist, ({mean: Number, stdev: Number}) => SymbolicDist
Sym.lognormal(0.5, 0.8)
Sym.lognormal({ p5: 4, p95: 10 })
Sym.lognormal({ p10: 4, p90: 10 })
Sym.lognormal({ p25: 4, p75: 10 })
Sym.lognormal({ mean: 5, stdev: 2 })


Sym.uniform: (Number, Number) => SymbolicDist
Sym.uniform(10, 12)


Sym.beta: (Number, Number) => SymbolicDist, ({mean: Number, stdev: Number}) => SymbolicDist
Sym.beta(20, 25)
Sym.beta({ mean: 0.39, stdev: 0.1 })


Sym.cauchy: (Number, Number) => SymbolicDist
Sym.cauchy(5, 1)


Sym.gamma: (Number, Number) => SymbolicDist
Sym.gamma(5, 1)


Sym.logistic: (Number, Number) => SymbolicDist
Sym.logistic(5, 1)


Sym.exponential: (Number) => SymbolicDist
Sym.exponential(2)


Sym.bernoulli: (Number) => SymbolicDist
Sym.bernoulli(0.5)


Sym.pointMass: (Number) => SymbolicDist
Point mass distributions are already symbolic, so you can use the regular `pointMass` function.
pointMass(0.5)


Sym.triangular: (Number, Number, Number) => SymbolicDist
Sym.triangular(3, 5, 10)



---
description: Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# PointSet
Point set distributions are one of the three distribution formats. They are stored as a list of x-y coordinates representing both discrete and continuous distributions.

One complication is that it's possible to represent invalid probability distributions in the point set format. For example, you can represent shapes with negative values, or shapes that are not normalized.

## Constructors

PointSet.make: (Dist) => PointSetDist, (Number) => PointSetDist
PointSet.make(normal(5,10))
PointSet(3)

PointSet.makeContinuous: (List({x: Number, y: Number})) => PointSetDist
PointSet.makeContinuous([
  {x: 0, y: 0.2},
  {x: 1, y: 0.7},
  {x: 2, y: 0.8},
  {x: 3, y: 0.2}
])

PointSet.makeDiscrete: (List({x: Number, y: Number})) => PointSetDist
PointSet.makeDiscrete([
  {x: 0, y: 0.2},
  {x: 1, y: 0.7},
  {x: 2, y: 0.8},
  {x: 3, y: 0.2}
])


## Conversions

PointSet.fromDist: (Dist) => PointSetDist
Converts the distribution in question into a point set distribution. If the distribution is symbolic, then it does this by taking the quantiles. If the distribution is a sample set, then it uses a version of kernel density estimation to approximate the point set format. One complication of this latter process is that if there is a high proportion of overlapping samples (samples that are exactly the same as each other), it will convert these samples into discrete point masses. Eventually we'd like to add further methods to help adjust this process.
PointSet.fromDist(normal(5,2))

PointSet.fromNumber: (Number) => PointSetDist
PointSet.fromNumber(3)

PointSet.downsample: (PointSetDist, newLength: Number) => PointSetDist
PointSet.downsample(PointSet.fromDist(normal(5,2)), 50)

PointSet.support: (PointSetDist) => {points: List(Number), segments: List([Number, Number])}
PointSet.support(PointSet.fromDist(normal(5,2)))


## Transformations

PointSet.mapY: (PointSetDist, fn: (Number) => Number) => PointSetDist
PointSet.mapY(mx(Sym.normal(5,2)), {|x| x + 1})



---
description: Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Duration
Durations are a simple time type, representing a length of time. They are internally stored as milliseconds, but often shown and written using seconds, minutes, hours, days, etc. Durations are typically used with [Date](./Date) values.


| **Unit Name** | **Example** | **Convert Number to Duration** | **Convert Duration to Number** |
|---------------|----------------------------|--------------------------------------------|--------------------------------------------|
| Minute        | `5minutes`                   | `fromMinutes(number)`                      | `toMinutes(duration)`                      |
| Hour          | `5hour`                     | `fromHours(number)`                        | `toHours(duration)`                        |
| Day           | `5days`                      | `fromDays(number)`                         | `toDays(duration)`                         |
| Year          | `5years`                     | `fromYears(number)`                        | `toYears(duration)`                        |


## Constructors

Duration.fromMinutes: (Number) => Duration
Duration.fromMinutes(5)

Duration.fromHours: (Number) => Duration
Duration.fromHours(5)

Duration.fromDays: (Number) => Duration
Duration.fromDays(5)

Duration.fromYears: (Number) => Duration
Duration.fromYears(5)


## Conversions

Duration.toMinutes: (Duration) => Number
Duration.toMinutes(5minutes)

Duration.toHours: (Duration) => Number
Duration.toHours(5minutes)

Duration.toDays: (Duration) => Number
Duration.toDays(5minutes)

Duration.toYears: (Duration) => Number
Duration.toYears(5minutes)


## Algebra

Duration.unaryMinus -: (Duration) => Duration
-5minutes

Duration.add +: (Duration, Duration) => Duration
5minutes + 10minutes

Duration.subtract -: (Duration, Duration) => Duration
5minutes - 10minutes

Duration.multiply *: (Duration, Number) => Duration, (Number, Duration) => Duration
5minutes * 10
10 * 5minutes

Duration.divide /: (Duration, Duration) => Number
5minutes / 2minutes

Duration.divide /: (Duration, Duration) => Number
5minutes / 2minutes


## Comparison

Duration.smaller <: (Duration, Duration) => Bool

Duration.larger >: (Duration, Duration) => Bool

Duration.smallerEq <=: (Duration, Duration) => Bool

Duration.largerEq >=: (Duration, Duration) => Bool



---
description: Lists are a simple data structure that can hold any type of value. They are similar to arrays in Javascript or lists in Python.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# List
Lists are a simple data structure that can hold any type of value. They are similar to arrays in Javascript or lists in Python.

```squiggle
myList = [1, 2, 3, normal(5,2), "hello"]
```

Lists are immutable, meaning that they cannot be modified. Instead, all list functions return a new list.

## Constructors

List.make: (count: Number, fn: (index?: Number) => 'A) => List('A), (count: Number, value: 'A) => List('A), (SampleSetDist) => List(Number)
Creates an array of length `count`, with each element being `value`. If `value` is a function, it will be called `count` times, with the index as the argument.
List.make(2, 3)
List.make(2, {|| 3})
List.make(2, {|index| index+1})

List.upTo: (low: Number, high: Number) => List(Number)
List.upTo(1,4)


## Modifications

List.reverse: (List('A)) => List('A)
List.reverse([1,4,5]) // [5,4,1]

List.concat: (List('A), List('A)) => List('A)
List.concat([1,2,3], [4, 5, 6])

List.sortBy: (List('A), fn: ('A) => Number) => List('A)
List.sortBy([{a:3}, {a:1}], {|f| f.a})

List.append: (List('A), 'A) => List('A)
List.append([1,4],5)

List.join: (List(String), separator?: String) => String, (List(String)) => String
List.join(["a", "b", "c"], ",") // "a,b,c"

List.flatten: (List(any)) => List(any)
List.flatten([[1,2], [3,4]])

List.shuffle: (List('A)) => List('A)
List.shuffle([1,3,4,20])

List.zip: (List('A), List('B)) => List(['A, 'B])
List.zip([1,3,4,20], [2,4,5,6])

List.unzip: (List(['A, 'B])) => [List('A), List('B)]
List.unzip([[1,2], [2,3], [4,5]])


## Filtering

List.slice: (List('A), startIndex: Number, endIndex?: Number) => List('A)
Returns a copy of the list, between the selected ``start`` and ``end``, end not included. Directly uses the [Javascript implementation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) underneath.
List.slice([1,2,5,10],1,3)

List.uniq: (List('A)) => List('A)
Filters the list for unique elements. Works on select Squiggle types.
List.uniq([1,2,3,"hi",false,"hi"])

List.uniqBy: (List('A), ('A) => 'B) => List('A)
Filters the list for unique elements. Works on select Squiggle types.
List.uniqBy([[1,5], [3,5], [5,7]], {|x| x[1]})

List.filter: (List('A), fn: ('A) => Bool) => List('A)
List.filter([1,4,5], {|x| x>3})


## Queries

List.length: (List(any)) => Number
List.length([1,4,5])

List.first: (List('A)) => 'A
List.first([1,4,5])

List.last: (List('A)) => 'A
List.last([1,4,5])

List.minBy: (List('A), fn: ('A) => Number) => 'A
List.minBy([{a:3}, {a:1}], {|f| f.a})

List.maxBy: (List('A), fn: ('A) => Number) => 'A
List.maxBy([{a:3}, {a:1}], {|f| f.a})

List.every: (List('A), fn: ('A) => Bool) => Bool
List.every([1,4,5], {|el| el>3 })

List.some: (List('A), fn: ('A) => Bool) => Bool
List.some([1,4,5], {|el| el>3 })

List.find: (List('A), fn: ('A) => Bool) => 'A
Returns an error if there is no value found
List.find([1,4,5], {|el| el>3 })

List.findIndex: (List('A), fn: ('A) => Bool) => Number
Returns `-1` if there is no value found
List.findIndex([1,4,5], {|el| el>3 })


## Functional Transformations

List.map: (List('A), ('A, index?: Number) => 'B) => List('B)
List.map([1,4,5], {|x| x+1})
List.map([1,4,5], {|x,i| x+i+1})

List.reduce: (List('B), initialValue: 'A, callbackFn: (accumulator: 'A, currentValue: 'B, currentIndex?: Number) => 'A) => 'A
Applies `f` to each element of `arr`. The function `f` has two main paramaters, an accumulator and the next value from the array. It can also accept an optional third `index` parameter.
List.reduce([1,4,5], 2, {|acc, el| acc+el})

List.reduceReverse: (List('B), initialValue: 'A, callbackFn: (accumulator: 'A, currentValue: 'B) => 'A) => 'A
Works like `reduce`, but the function is applied to each item from the last back to the first.
List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})

List.reduceWhile: (List('B), initialValue: 'A, callbackFn: (accumulator: 'A, currentValue: 'B) => 'A, conditionFn: ('A) => Bool) => 'A
Works like `reduce`, but stops when the condition is no longer met. This is useful, in part, for simulating processes that need to stop based on the process state.
    
// Adds first two elements, returns `11`.
List.reduceWhile([5, 6, 7], 0, {|acc, curr| acc + curr}, {|acc| acc < 15})

// Adds first two elements, returns `{ x: 11 }`.
List.reduceWhile(
  [5, 6, 7],
  { x: 0 },
  {|acc, curr| { x: acc.x + curr }},
  {|acc| acc.x < 15}
)




---
description: Simple constants and functions for math in Squiggle.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Math

## Constants

| Variable Name    | Number Name                                                                      | Value                |
|------------------|----------------------------------------------------------------------------------|----------------------|
| `Math.e`       | Euler's number                                                                   | ≈ 2.718281828459045  |
| `Math.ln2`     | Natural logarithm of 2                                                           | ≈ 0.6931471805599453 |
| `Math.ln10`    | Natural logarithm of 10                                                          | ≈ 2.302585092994046  |
| `Math.log2e`   | Base 2 logarithm of E                                                            | ≈ 1.4426950408889634 |
| `Math.log10e`  | Base 10 logarithm of E                                                           | ≈ 0.4342944819032518 |
| `Math.pi`      | Pi - ratio of the circumference to the diameter of a circle                      | ≈ 3.141592653589793  |
| `Math.sqrt1_2` | Square root of 1/2                                                               | ≈ 0.7071067811865476 |
| `Math.sqrt2`   | Square root of 2                                                                 | ≈ 1.4142135623730951 |
| `Math.phi`     | Phi is the golden ratio.                                                         | 1.618033988749895    |
| `Math.tau`     | Tau is the ratio constant of a circle's circumference to radius, equal to 2 * pi | 6.283185307179586    |

## Functions
  

Math.sqrt: (Number) => Number


Math.sin: (Number) => Number


Math.cos: (Number) => Number


Math.tan: (Number) => Number


Math.asin: (Number) => Number


Math.acos: (Number) => Number


Math.atan: (Number) => Number



---
description: 
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# MixedSet
The MixedSet module offers functionality for creating mixed sets, which are sets that can contain both discrete and continuous values. Discrete values are represented as points, while continuous values are represented as ranges. Mixed sets are particularly useful for describing the support of mixed probability distributions.

The majority of set functions in the MixedSet module are designed to mirror the [upcomming set functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) in Javascript.

The primary purpose of mixed sets in Squiggle is to facilitate scoring. For instance, by utilizing mixed sets, you can easily determine if one distribution covers the support of another distribution. If it doesn't, it may be prone to receiving a score of negative infinity.

Currently, there is no dedicated MixedSet object type. Instead, mixed sets are implemented as dictionaries, where discrete values are stored as points and continuous values are stored as segments.

MixedSet.difference: ({points: List(Number), segments: List([Number, Number])}, {points: List(Number), segments: List([Number, Number])}) => {points: List(Number), segments: List([Number, Number])}


MixedSet.intersection: ({points: List(Number), segments: List([Number, Number])}, {points: List(Number), segments: List([Number, Number])}) => {points: List(Number), segments: List([Number, Number])}


MixedSet.union: ({points: List(Number), segments: List([Number, Number])}, {points: List(Number), segments: List([Number, Number])}) => {points: List(Number), segments: List([Number, Number])}


MixedSet.isSubsetOf: ({points: List(Number), segments: List([Number, Number])}, {points: List(Number), segments: List([Number, Number])}) => Bool


MixedSet.isSupersetOf: ({points: List(Number), segments: List([Number, Number])}, {points: List(Number), segments: List([Number, Number])}) => Bool


MixedSet.isEqual: ({points: List(Number), segments: List([Number, Number])}, {points: List(Number), segments: List([Number, Number])}) => Bool


MixedSet.isEmpty: ({points: List(Number), segments: List([Number, Number])}) => Bool


MixedSet.min: ({points: List(Number), segments: List([Number, Number])}) => Number
Returns the minimum value in the set


MixedSet.max: ({points: List(Number), segments: List([Number, Number])}) => Number
Returns the maximum value in the set



---
description: 
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Plot
The Plot module provides functions to create plots of distributions and functions.

Raw functions and distributions are plotted with default parameters, while plot objects created by functions from this module give you more control over chart parameters and access to more complex charts.

Plot.dist: (dist: Dist, params?: {xScale?: Scale, yScale?: Scale, showSummary?: Bool}) => Plot
Plot.dist(
  normal(5, 2),
  {
    xScale: Scale.linear({ min: -2, max: 6, title: "X Axis Title" }),
    showSummary: true,
  }
)


Plot.dists: (dists: List(Dist|Number)|List({name?: String, value: Dist|Number}), {xScale?: Scale, yScale?: Scale, showSummary?: Bool}?) => Plot
Plot.dists(
{
  dists: [
    { name: "First Dist", value: normal(0, 1) },
    { name: "Second Dist", value: uniform(2, 4) },
  ],
  xScale: Scale.symlog({ min: -2, max: 5 }),
}
)


Plot.numericFn: (fn: (Number) => Number, params?: {xScale?: Scale, yScale?: Scale, xPoints?: List(Number)}) => Plot
Plot.numericFn(
  {|t|t ^ 2},
  { xScale: Scale.log({ min: 1, max: 100 }), points: 10 }
)


Plot.distFn: (fn: (Number) => Dist, params?: {xScale?: Scale, yScale?: Scale, distXScale?: Scale, xPoints?: List(Number)}) => Plot
Plot.distFn(
  {|t|normal(t, 2) * normal(5, 3)},
  {
    xScale: Scale.log({ min: 3, max: 100, title: "Time (years)" }),
    yScale: Scale.linear({ title: "Value" }),
    distXScale: Scale.linear({ tickFormat: "#x" }),
  }
)


Plot.scatter: ({xDist: SampleSetDist, yDist: SampleSetDist, xScale?: Scale, yScale?: Scale}) => Plot
xDist = SampleSet.fromDist(2 to 5)
yDist = normal({p5:-3, p95:3}) * 5 - xDist ^ 2
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.log({min: 1.5}),
})
xDist = SampleSet.fromDist(normal({p5:-2, p95:5}))
yDist = normal({p5:-3, p95:3}) * 5 - xDist
Plot.scatter({
  xDist: xDist,
  yDist: yDist,
  xScale: Scale.symlog({title: "X Axis Title"}),
  yScale: Scale.symlog({title: "Y Axis Title"}),
})



---
description: Squiggle numbers are Javascript floats.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Number
Squiggle numbers are Javascript floats.

## Comparison

Number.smaller <: (Number, Number) => Bool

Number.larger >: (Number, Number) => Bool

Number.smallerEq <=: (Number, Number) => Bool

Number.largerEq >=: (Number, Number) => Bool


## Algebra (Number)

Number.add +: (Number, Number) => Number

Number.subtract -: (Number, Number) => Number

Number.multiply *: (Number, Number) => Number

Number.divide /: (Number, Number) => Number

Number.pow ^: (Number, Number) => Number


## Functions (Number)

Number.unaryMinus -: (Number) => Number
exp(3.5)

Number.exp: (Number) => Number
exponent
exp(3.5)

Number.log: (Number) => Number
log(3.5)

Number.log10: (Number) => Number
log10(3.5)

Number.log2: (Number) => Number
log2(3.5)

Number.floor: (Number) => Number
floor(3.5)

Number.ceil: (Number) => Number
ceil(3.5)

Number.abs: (Number) => Number
absolute value
abs(3.5)

Number.round: (Number) => Number
round(3.5)


## Algebra (List)

Number.sum: (List(Number)) => Number
sum([3,5,2])

Number.product: (List(Number)) => Number
product([3,5,2])

Number.cumprod: (List(Number)) => List(Number)
cumulative product
cumprod([3,5,2,3,5])

Number.diff: (List(Number)) => List(Number)
diff([3,5,2,3,5])


## Functions (List)

Number.min: (List(Number)) => Number, (Number, Number) => Number
min([3,5,2])

Number.max: (List(Number)) => Number, (Number, Number) => Number
max([3,5,2])

Number.mean: (List(Number)) => Number
mean([3,5,2])

Number.quantile: (List(Number), Number) => Number
quantile([1,5,10,40,2,4], 0.3)

Number.median: (List(Number)) => Number
median([1,5,10,40,2,4])

Number.geomean: (List(Number)) => Number
geometric mean
geomean([3,5,2])

Number.stdev: (List(Number)) => Number
standard deviation
stdev([3,5,2,3,5])

Number.variance: (List(Number)) => Number
variance([3,5,2,3,5])

Number.sort: (List(Number)) => List(Number)
sort([3,5,2,3,5])


## Utils

Number.rangeDomain: (min: Number, max: Number) => Domain
Number.rangeDomain(5, 10)



---
description: Scales for plots.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Scale
Chart axes in [plots](./Plot.mdx) can be scaled using the following functions. Each scale function accepts optional min and max value. Power scale accepts an extra exponent parameter.

Squiggle uses D3 for the tick formats. You can read about d3 tick formats [here](https://github.com/d3/d3-format).

## Numeric Scales

Scale.linear: ({min?: Number, max?: Number, tickFormat?: String, title?: String}) => Scale, () => Scale
Scale.linear({ min: 3, max: 10 })

Scale.log: ({min?: Number, max?: Number, tickFormat?: String, title?: String}) => Scale, () => Scale
Scale.log({ min: 1, max: 100 })

Scale.symlog: ({min?: Number, max?: Number, tickFormat?: String, title?: String, constant?: Number}) => Scale, () => Scale
Symmetric log scale. Useful for plotting data that includes zero or negative values.

The function accepts an additional `constant` parameter, used as follows: `Scale.symlog({constant: 0.1})`. This parameter allows you to allocate more pixel space to data with lower or higher absolute values. By adjusting this constant, you effectively control the scale's focus, shifting it between smaller and larger values. For more detailed information on this parameter, refer to the [D3 Documentation](https://d3js.org/d3-scale/symlog).
    
The default value for `constant` is `0.0001`.
Scale.symlog({ min: -10, max: 10 })

Scale.power: ({min?: Number, max?: Number, tickFormat?: String, title?: String, exponent?: Number}) => Scale, () => Scale
Power scale. Accepts an extra `exponent` parameter, like, `Scale.power({exponent: 2, min: 0, max: 100})`.

The default value for `exponent` is `0.1`.
Scale.power({ min: 1, max: 100, exponent: 0.1 })


## Date Scales

Scale.date: ({min?: Date, max?: Date, tickFormat?: String, title?: String}) => Scale, () => Scale
Only works on Date values. Is a linear scale under the hood.
Scale.date({ min: Date(2022), max: Date(2025) })



---
description: Function Specifications
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Spec
Function specifications (Specs) are an experimental feature in Squiggle. They are used to specify the structure of functions and verify that they match that structure. They are used primarily as a tag for functions.

Spec.make: ({name: String, documentation: String, validate: Function}) => Specification
Create a specification.
@startClosed
validate(fn) = {
  hasErrors = List.upTo(2020, 2030)
    -> List.some(
      {|e| typeOf(fn(Date(e))) != "Distribution"}
    )
  hasErrors ? "Some results aren't distributions" : ""
}

spec = Spec.make(
  {
    name: "Stock market over time",
    documentation: "A distribution of stock market values over time.",
    validate: validate,
  }
)

@spec(spec)
myEstimate(t: [Date(2020), Date(2030)]) = normal(10, 3)



---
description: Functions for working with strings in Squiggle
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# String
Strings support all JSON escape sequences, with addition of escaped single-quotes (for single-quoted strings)

~~~squiggle
a = "'\" NUL:\u0000"
b = '\'" NUL:\u0000'
~~~

String.make: (any) => String
Converts any value to a string. Some information is often lost.


String.concat: (String, String) => String, (String, any) => String


String.add +: (String, String) => String, (String, any) => String


String.split: (String, separator: String) => List(String)



---
description: Tables are a simple date time type.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Table
The Table module allows you to make simple tables for displaying data.

Table.make: (data: List('A), params: {columns: List({fn: ('A) => any, name?: String})}) => Table
Table.make(
  [
    { name: "First Dist", value: normal(0, 1) },
    { name: "Second Dist", value: uniform(2, 4) },
    { name: "Third Dist", value: uniform(5, 6) },
  ],
  {
    columns: [
      { name: "Name", fn: {|d|d.name} },
      { name: "Mean", fn: {|d|mean(d.value)} },
      { name: "Std Dev", fn: {|d|variance(d.value)} },
      { name: "Dist", fn: {|d|d.value} },
    ],
  }
)
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



---
description: 
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# System
## Constants

### System.version
Returns the current version of Squiggle.

## Functions


System.sampleCount: () => Number
The number of samples set in the current environment. This variable can be modified in the Squiggle playground settings.



---
description: The Tag module handles tags, which allow the additions of metadata to Squiggle variables.
---
import { FnDocumentationFromName } from "@quri/squiggle-components";
import { SquiggleEditor }  from "../../../components/SquiggleEditor";


# Danger
The Danger library contains newer experimental functions which are less stable than Squiggle as a whole. They are not recommended for production use, but are useful for testing out new ideas., 


## JSON


The JSON module provides JSON-like objects in Squiggle. ``Danger.json`` is mainly useful for debugging, and ``Danger.jsonString`` is useful for sending data to other systems. A simple example is shown below.

We have custom serializers for different Squiggle objects. Note that this API is unstable and might change over time.

<SquiggleEditor
defaultCode={`sampleSet = 30 to 50
pointSet = Sym.normal(5, 2)
plot = Plot.dists([sampleSet, pointSet])
fn(e) = e

@notebook
result = [
  "### Danger.json()",
  Danger.json([sampleSet, pointSet, plot, fn]),
  "### Danger.jsonString",
  // We don't show sampleSet or plot below because they would be too large, but feel free to try that out
  Danger.jsonString([pointSet, fn]),
]
result
`}/>

Danger.json: (any) => any
Converts a value to a simpler form, similar to JSON. This is useful for debugging. Keeps functions and dates, but converts objects like distributions, calculators, and plots to combinations of dictionaries and lists.
Danger.json({a: 1, b: 2})
Danger.json([2 to 5, Sym.normal(5, 2), Calculator({|x| x + 1})])

Danger.jsonString: (any) => String
Converts a value to a stringified JSON, similar to JSON.stringify() in Javasript. Replaces functions with dict summaries.
Danger.jsonString({a: 1, b: 2})
Danger.jsonString([2 to 5, Sym.normal(5, 2), Calculator({|x| x + 1})])


## Javascript

Near 1-1 matches of Javascript functions.

Danger.parseFloat: (String) => Number|String
Converts a string to a number. If the string can't be converted, returns `Parse Failed`. Calls Javascript `parseFloat` under the hood.
Danger.parseFloat('10.3')

Danger.now: () => Date
Returns the current date. Internally calls ``Date.now()`` in JavaScript.  

*Caution: This function, which returns the current date, produces varying outputs with each call. As a result, accurately estimating the value of functions that incorporate ``Danger.now()`` at past time points is challenging. In the future, we intend to implement a feature allowing the input of a simulated time via an environment variable to address this issue.*
Danger.now()


## Math

Danger.laplace: (Number, Number) => Number
Calculates the probability implied by [Laplace's rule of succession](https://en.wikipedia.org/wiki/Rule_of_succession)
trials = 10
successes = 1
Danger.laplace(successes, trials) //  (successes + 1) / (trials + 2)  = 2 / 12 = 0.1666

Danger.yTransform: (PointSetDist) => PointSetDist
Danger.yTransform(PointSet(Sym.normal(5,2)))


## Combinatorics

Danger.factorial: (Number) => Number
Danger.factorial(20)

Danger.choose: (Number, Number) => Number
`Danger.choose(n,k)` returns `factorial(n) / (factorial(n - k) * factorial(k))`, i.e., the number of ways you can choose k items from n choices, without repetition. This function is also known as the [binomial coefficient](https://en.wikipedia.org/wiki/Binomial_coefficient).
Danger.choose(1, 20)

Danger.binomial: (Number, Number, Number) => Number
`Danger.binomial(n, k, p)` returns `choose((n, k)) * pow(p, k) * pow(1 - p, n - k)`, i.e., the probability that an event of probability p will happen exactly k times in n draws.
Danger.binomial(1, 20, 0.5)

Danger.combinations: (List('A), Number) => List(List('A))
Returns all combinations of the input list taken r elements at a time.
Danger.combinations([1, 2, 3], 2) // [[1, 2], [1, 3], [2, 3]]

Danger.allCombinations: (List('A)) => List(List('A))
Returns all possible combinations of the elements in the input list.
Danger.allCombinations([1, 2, 3]) // [[1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]


## Distributions

Danger.binomialDist: (numberOfTrials: Dist|Number, probabilityOfSuccess: Dist|Number) => SampleSetDist
A binomial distribution.

``n`` must be above 0, and ``p`` must be between 0 and 1. 

Note: The binomial distribution is a discrete distribution. When representing this, the Squiggle distribution component might show it as partially or fully continuous. This is a visual mistake; if you inspect the underlying data, it should be discrete.
Danger.binomialDist(8, 0.5)

Danger.poissonDist: (rate: Dist|Number) => SampleSetDist
A Poisson distribution.

Note: The Poisson distribution is a discrete distribution. When representing this, the Squiggle distribution component might show it as partially or fully continuous.  This is a visual mistake; if you inspect the underlying data, it should be discrete.
Danger.poissonDist(10)


## Integration

Danger.integrateFunctionBetweenWithNumIntegrationPoints: (f: Function, min: Number, max: Number, numIntegrationPoints: Number) => Number
Integrates the function `f` between `min` and `max`, and computes `numIntegrationPoints` in between to do so.

Note that the function `f` has to take in and return numbers. To integrate a function which returns distributions, use:

~~~squiggle
auxiliaryF(x) = mean(f(x))

Danger.integrateFunctionBetweenWithNumIntegrationPoints(auxiliaryF, min, max, numIntegrationPoints)
~~~

Danger.integrateFunctionBetweenWithNumIntegrationPoints({|x| x+1}, 1, 10, 10)

Danger.integrateFunctionBetweenWithEpsilon: (f: Function, min: Number, max: Number, epsilon: Number) => Number
Integrates the function `f` between `min` and `max`, and uses an interval of `epsilon` between integration points when doing so. This makes its runtime less predictable than `integrateFunctionBetweenWithNumIntegrationPoints`, because runtime will not only depend on `epsilon`, but also on `min` and `max`.

Same caveats as `integrateFunctionBetweenWithNumIntegrationPoints` apply.
Danger.integrateFunctionBetweenWithEpsilon({|x| x+1}, 1, 10, 0.1)

## Common Errors:

Failed to evaluate Squiggle code: Expected "->", end of input, or whitespace but "P" found.  
-> This likely means that you are using two return statements. Every statement but the last should be a variable assignment.

Don't:
```
foo = 4
foo + 3
foo
```

Do: 
```
foo = 4
bar = foo + 3
foo
```


Compile Error. Expected "->", end of input, or whitespace but "m" found.
-> This likely means the same as the above error. You returned a statement, and then had a variable assignment. All statements except for the last must be variable assignment.


Failed to evaluate Squiggle code: Expected "(", "@", "export", "if", "import", "{", array, boolean, dict, end of input, identifier, number, string, unary operator, or whitespace but "#" found.
-> Did you use "#" as a line comment? That's not valid in Squiggle. Use "//" instead.


Compile Error. Expected "(", "{", array, boolean, dict, identifier, number, string, unary operator, or whitespace but "=" found.
-> Did you try using "+=" or "-=" or similar? These are not allowed in Squiggle, as you cannot mutate variables.


Compile Error. Expected "(", "->", "@", "export", "if", "{", array, boolean, dict, identifier, number, string, unary operator, or whitespace but "}" found.
-> This likely means that you have a block without a return statement.
Don't:
```
foo = {
  a = 1
  b = a + 3
}
```
Do:
```
foo = {
  a = 1
  a + 3
}
```


Compile Error. Number is not defined
-> Are you trying to use Number as a Type? This is not supported. Domains are very restricted, see that documentation.


Validation error. Failed to evaluate Squiggle code: Expected "->", "?", assignment, end of input, operator, or whitespace
-> Did you have an import statement that's not on the top of the file? Make sure that all import statements are on the top of the file.