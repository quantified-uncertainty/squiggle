---
sidebar_position: 3
---

# Future Features
Squiggle is still very early. The main first goal is to become stable. This means having a clean codebase, having decent test coverage, and having a syntax we are reasonably confident in. Later on, there are many other features that will be interesting to explore.

## Programming Language Features
- Equality (a == b)
- If/else statements
- Arrays 
- Tables / Matrices
- Simple objects
- A simple type system
- Simple module system (``Dist.Normal`` instead of ``normal``)
- A simple time library & notation
- Optional and default paramaters for functions
- Anonymous Functions (This is particularly convenient in cases where tiny functions are submitted in forecasting competitions)
- A notation to limit the domain of functions. For example, maybe a function only applies for t=[2 to 20]
- Custom parser (Right now we're using Math.js's parser, which doesn't give us much flexibility)
- "Partial-domain" distributions. For example, maybe someone has a distribution for when AGI will happen, but doesn't want to make any estimates past 2200.

## Distribution Features
``Distribution.fromSamples([])``  
Converts a list of samples, for example, from Guesstimate, into a distribution shape. Maybe takes a list of optional parameters.

``Distribution.fromCoordinates({xs, ys})``  
Convert XY coordinates into a distribution. Figure out a good way to do this for continuous, discrete, and mixed distributions.

[Metalog Distribution](https://en.wikipedia.org/wiki/Metalog_distribution)  
Add the Metalog distribution, and some convenient methods for generating these distributions. This might be a bit tricky because we might need or build a library to fit data. There's no Metalog javascript library yet, this would be pretty useful. There's already a Metalog library in Python, so that one could be used for inspiration.

## Major Future Additions
**Full javascript library**  
A full Javascript library that accesses most of the probabilistic functionality of Squiggle, but can be used directly in javascript functions.

**Importance & quality scores**  
Workflows/functionality to declare the importance and coveredness of each part of the paramater space. For example, some subsets of the paramater space of a function might be much more important to get right than others. Similarly, the analyst might be much more certain about some parts than others. Ideally. they could decline sections.

**An interface to interpret & score Squiggle files**  
Squiggle functions need to be aggregated and scored. This should be done outside one Squiggle file. Maybe this should also be done in Squiggle, or maybe it should be done using Javascript. 

My guess is that there should eventually be some way for people to declare that some of their Squiggle values are meant to be formally declared, to be scored and similar by others. Then other programs can read these files, and either use the values, or score them.

Of course, we'd also need good math for how the scoring should work, exactly.

This interface should also be able to handle changing Squiggle values. This is because people would be likely to want to update their functions over time, and that should be taken into account for scoring.

**Easily call other functions**  
It would be great to be able to call other people's Squiggle functions, from other Squiggle functions. This could raise a whole bunch of challenging issues. Additionally, it would be neat to call other data, both from knowledge graphs, and from regular APIs. Note that this could obviously complicate scoring a lot; I imagine that either easy scoring, or simple data fetching, would have to accept sacrifices.

## Fixes
- Discrete distributions are particularly buggy. Try ``mm(1,2,3,4,5,6,7,8,9,10) .* (5 to 8)``