---
description: Probability distributions have several subtle possible formats. Three important ones that we deal with in Squiggle are symbolic, sample set, and point set formats.
---

# Three Formats of Distributions

_by Ozzie Gooen_

Probability distributions have several subtle possible formats. Three important ones that we deal with in Squiggle are symbolic, sample set, and point set formats.

_Symbolic_ formats are just the math equations. `Sym.normal(5,3)` is the symbolic representation of a normal distribution.

Distribution constructors that don't have `Sym.` prefix, e.g. `normal(5,3)`, are stored as lists of samples. Monte Carlo techniques also return lists of samples. Let’s call this the “_Sample Set_” format.

Lastly is what I’ll refer to as the _Point Set_ format. It describes the coordinates, or the shape, of the distribution. You can save these formats in JSON, for instance, like, `{xs: [1, 2, 3, 4, …], ys: [.0001, .0003, .002, …]}`.

Symbolic, Sample Set, and Point Set formats all have very different advantages and disadvantages.

Note that the name "Symbolic" is fairly standard, but I haven't found common names for what I'm referring to as "Sample Set" and "Point Set" formats. The formats aren't often specifically referred to for these purposes, from what I can tell.

## Symbolic Formats

**TL;DR**  
Mathematical representations. Require analytic solutions. These are often ideal where they can be applied, but apply to very few actual functions. Typically used sparsely, except for the starting distributions (before any computation is performed).

**Examples**  
`Sym.normal(5,2)`  
`pdf(Sym.normal(2,5), 1.2) + Sym.beta(5, log(2))`

**How to Do Computation**  
To perform calculations of symbolic systems, you need to find analytical solutions. For example, there are equations to find the pdf or cdf of most distribution shapes at any point. There are also lots of simplifications that could be done in particular situations. For example, there’s an analytical solution for combining normal distributions.

**Advantages**

- Maximally compressed; i.e. very easy to store.
- Very readable.
- When symbolic operations are feasible and easy to discover, they are trivially fast and completely accurate.

**Disadvantages**

- It’s often either impossible or computationally infeasible to find analytical solutions to most symbolic equations.
- Solving symbolic equations requires very specialized tooling that’s very rare. There are a few small symbolic solver libraries out there, but not many. Wolfram Research is the main group that seems very strong here, and their work is mostly closed source + expensive.

**Converting to Point Set Formats**

- Very easy. Choose X points such that you capture most of the distribution (you can set a threshold, like 99.9%). For each X point, calculate the pdf, and save as the Y points.

**Converting to Sample List Formats**

- Very easy. Just sample a bunch of times. The regular way is to randomly sample (This is trivial to do for all distributions with inverse-cdf functions.) If you want to get more fancy, you could provide extra samples from the tails, that would be weighted lower. Or, you could take samples in equal distances (of probability mass) along the entire distribution, then optionally shuffle it. (In the latter case, these would not be random samples, but sometimes that’s fine.)

**How to Visualize**  
Convert to point set, then display that. (Optionally, you can also convert to samples, then display those using a histogram, but this is often worse you have both options.)

**Bonus: The Metalog Distribution**

The Metalog distribution seems like it can represent almost any reasonable distribution. It’s symbolic. This is great for storage, but it’s not clear if it helps with calculation. My impression is that we don’t have symbolic ways of doing most functions (addition, multiplication, etc) on metalog distributions. Also, note that it can take a fair bit of computation to fit a shape to the Metalog distribution.

## Point Set Formats

**TL;DR**  
Lists of the x-y coordinates of the shape of a distribution. (Usually the pdf, which is more compressed than the cdf). Some key functions (like pdf, cdf) and manipulations can work on almost any point set distribution.

**Alternative Names:**  
Grid, Mesh, Graph, Vector, Pdf, PdfCoords/PdfPoints, Discretised, Bezier, Curve  
See [this facebook thread](https://www.facebook.com/ozzie.gooen/posts/10165936265785363?notif_id=1644937423623638&notif_t=feedback_reaction_generic&ref=notif).

**How to Do Computation**  
Use point set techniques. These can be fairly computationally-intensive (particularly finding integrals, which take a whole lot of adding). In the case that you want to multiply independent distributions, you can try convolution, but it’s pretty expensive.

**Examples**  
`{xs: [1, 2, 3, 4…], ys: [.0001, .0003, .002, .04, ...]} `  
`[[1, .0001], [2, .0003], [3, .002]...] `

**Advantages**

- Much more compressed than Sample List formats, but much less compressed than Symbolic formats.
- Many functions (pdf, cdf, percentiles, mean, integration, etc) and manipulations (truncation, scaling horizontally or vertically), are possible on essentially all point set distributions.

**Disadvantages**

- Most calculations are infeasible/impossible to perform using point sets formats. In these cases, you need to use sampling.
- Not as accurate or fast as symbolic methods, where the symbolic methods are applicable.
- The tails get cut off, which is subideal. It’s assumed that the value of the pdf outside of the bounded range is exactly 0, which is not correct. (Note: If you have ideas on how to store point set formats that don’t cut off tails, let me know)

**Converting to Symbolic Formats**

- Okay, if you are okay with a Metalog approximation or similar. Metaculus uses an additive combination of up to [Logistic distributions](https://www.metaculus.com/help/faq/); you could also fit this. Fitting takes a little time (it requires several attempts and some optimization), can be arbitrarily accurate.
- If you want to be very fancy, you could try to fit point set distributions into normal / lognormal / etc. but this seems like a lot of work for little gain.

**Converting to Sample List Formats**

- Just sample a lot. The same as converting symbolic formats into samples.

**How to Visualize**

- It’s already in a good format for visualization, just plot it in any library.

**Handling Long Tails / Optimization**

- You can choose specific points to use to save computation. For example, taking extra points at the ends.

**Additional Metadata**

- The format mentioned above does not suggest any specific form of interpolation, or strategy of dealing with the tails. Several interpolation methods are possible; for example, linear interpolation, or stepwise interpolation.

**Potential Alternatives**

- [Bézier curves](https://en.wikipedia.org/wiki/B%C3%A9zier_curve) could, in theory, be more optimal. Bézier are used for vector image programs. They represent a more complicated format than a list of x-y coordinate pairs, but come with much more flexibility. Arguably, they sit somewhere between fitting distributions to Metalog distributions, and just taking many x-y points.

## Sample Set Formats

**TL;DR**  
Random samples. Use Monte Carlo simulation to perform calculations. This is the predominant technique using Monte Carlo methods; in these cases, most nodes are essentially represented as sample sets. [Guesstimate](https://www.getguesstimate.com/) works this way.

**How to Do Computation**  
Use [Monte Carlo methods](https://en.wikipedia.org/wiki/Monte_Carlo_method). You could get fancy with these with a [probabilistic programming language](https://en.wikipedia.org/wiki/Probabilistic_programming), which often have highly optimized Monte Carlo tooling. Variational inference is used for very similar problems.

**Examples**  
`[3.23848, 4.82081, 1.382833, 9.238383…]`

**Advantages**

- Monte Carlo methods are effectively the only ways to calculate many/most functions.
- The use of Monte Carlo methods make for very easy sensitivity analysis.
- [Probabilistic inference](https://machinelearningmastery.com/markov-chain-monte-carlo-for-probability/) is only possible using Monte Carlo methods.
- In some cases, Monte Carlo computation functionally represents possible worlds. There’s no very clear line between Monte Carlo methods and agent based modeling simulations.
- You can handle math with distributions that are correlated with each other. (I believe, but am not sure).

**Disadvantages**

- Monte Carlo methods can be very slow.
- Requires fairly heavy tooling to make efficient.
- Sampling methods are very lossy, especially for tails.

**Converting to Symbolic Formats**  
I don’t know of a straightforward way of doing this. Convert to Sample List first, then you can convert to Metalog or similar.

**Converting to Sample List Formats**  
[Kernel density estimation](https://en.wikipedia.org/wiki/Kernel_density_estimation) works. However, it requires a few parameters from the user, for tuning. There are functions to estimate these parameters, but this is tricky. Two forms of density estimation are shown as code [here](https://github.com/jasondavies/science.js/blob/master/src/stats/bandwidth.js). There’s some more description in the webppl documentation [here](https://webppl.readthedocs.io/en/master/distributions.html#KDE).

**Handling Long Tails / Optimization**

- You can weight samples differently. This allows you to save more at the tails, for more granularity there, without biasing the results. (I’m not sure how difficult this would be.)

**How to Visualize**  
Use a histogram.

|                        | Symbolic                                                                                                                 | Symbolic(metalog)                                                 | Numeric                                                                                         | Samples/MC                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Example                | normal(5,2)                                                                                                              | metalog([(2,3)])                                                  | [[1,2,3,4], [3,5,9,10]]                                                                         | [1.38483, 0.233, 38.8383, …]                                |
| Techniques             | Analytic                                                                                                                 | Analytic                                                          | Numeric                                                                                         | Monte Carlo, variational inference                          |
| Available calculations | Pdf(), cdf(), sample, inverse Add or multiply normal distributions Add lognormal distributions Select other calculations | Pdf(), cdf(), sample(), inverseCdf()                              | Pointwise operations Truncate Mixture Select regular operations by constants (normal(5,2) \* 3) | Normal operations, most functions. Not pointwise functions. |
| Use for computation    | Lossless, Very fast, Extremely limited                                                                                   |                                                                   | Medium speed, Minor accuracy loss, Select useful, but limited functions                         | Slow and lossy, but very general-purpose.                   |
| Use for storage        | Tiny, Lossless, Extremely limited                                                                                        | (Assuming other data is fit to metalog) High information densityt | Medium information density                                                                      | Low information density                                     |
