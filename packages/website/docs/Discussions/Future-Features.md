---
title: Future Features
sidebar_position: 3
---

Squiggle is still very early. The main first goal is to become stable (to reach version 1.0). Right now we think it is useable to use for small projects, but do note that there are very likely some math bugs and performance problems.

## Programming Language Features

- Tables / Matrices
- A simple type system
- A simple time library & notation
- Optional and default paramaters for functions
- A notation to limit the domain of functions. For example, maybe a function only applies for t=[2 to 20]

## Distribution Features

[Metalog Distribution](https://en.wikipedia.org/wiki/Metalog_distribution)  
Add the Metalog distribution, and some convenient methods for generating these distributions. This might be a bit tricky because we might need or build a library to fit data. There's no Metalog javascript library yet, this would be pretty useful. There's already a Metalog library in Python, so that one could be used for inspiration.

`Distribution.smoothen(p)`
Takes a distribution and smoothens it. For example, [Elicit Forecast](https://forecast.elicit.org/) does something like this, with uniform distributions.

## Major Future Additions

**Probabilities**  
Right now Squiggle mostly works with probability distributions only, but it should also work smoothly with probabilities.

**Importance & quality scores**  
Workflows/functionality to declare the importance and coveredness of each part of the paramater space. For example, some subsets of the paramater space of a function might be much more important to get right than others. Similarly, the analyst might be much more certain about some parts than others. Ideally. they could decline sections.

**An interface to interpret & score Squiggle files**  
Squiggle functions need to be aggregated and scored. This should be done outside one Squiggle file. Maybe this should also be done in Squiggle, or maybe it should be done using Javascript.

My guess is that there should eventually be some way for people to declare that some of their Squiggle values are meant to be formally declared, to be scored and similar by others. Then other programs can read these files, and either use the values, or score them.

Of course, we'd also need good math for how the scoring should work, exactly.

This interface should also be able to handle changing Squiggle values. This is because people would be likely to want to update their functions over time, and that should be taken into account for scoring.

**Static / Sensitivity Analysis**  
Guesstimate has Sensitivity analysis that's pretty useful. This could be quite feasible to add, though it will likely require some thinking.

**Annotation**  
It might be useful to allow people to annotate functions and variables with longer descriptions, maybe Markdown. This could very much help interpretation/analysis of these items.

**Randomness Seeds**  
Right now, Monte Carlo simulations are totally random. It would be nicer to be able to enter a seed somehow in order to control the randomness. Or, with the same seed, the function should always return the same values. This would make debugging and similar easier.

## Major Standard Language Features

- Some testing story.

### Distributions

```js
cauchy();
pareto();
metalog();
```