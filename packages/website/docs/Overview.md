---
sidebar_position: 1
title: Overview
---

Squiggle is a minimalist programming language for probabilistic estimation. It's meant for intuitively-driven quantitative estimation instead of data analysis or data-driven statistical techniques.

The basics of Squiggle are fairly straightforward. This can be enough for many models. The more advanced functionality can take some time to learn.

## Using Squiggle
You can currently interact with Squiggle in a few ways:

**[Playground](/playground)**  
The [Squiggle Playground](/playground) is a nice tool for working with small models and making prototypes. You can make simple sharable links, but you can't save models that change over time.

**[Typescript Library](https://www.npmjs.com/package/@quri/squiggle-lang)**  
Squiggle is built using [Rescript](https://rescript-lang.org/), and is accessible via a simple Typescript library. You can use this library to either run Squiggle code in full, or to call select specific functions within Squiggle (though this latter functionality is very minimal). 

**[React Components Library](https://www.npmjs.com/package/@quri/squiggle-components)**  
All of the components used in the playground and documentation are available in a separate component NPM repo. You can see the full Storybook of components [here](https://squiggle-components.netlify.app).

**[Visual Studio Code Extension](https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle)**  
There's a simple [VS Code extension](https://marketplace.visualstudio.com/items?itemName=QURI.vscode-squiggle) for running and visualizing Squiggle code. We find that VS Code is a useful editor for managing larger Squiggle setups.

## Very simple model

```squiggle
//Write comments like this
/* 
```

## Squiggle Vs. Other Tools

### What Squiggle Is

- A simple programming language for doing math with probability distributions.
- An embeddable language that can be used in Javascript applications.
- A tool to encode functions as forecasts that can be embedded in other applications.

### What Squiggle Is Not

- A complete replacement for enterprise Risk Analysis tools. (See [Crystal Ball](https://www.oracle.com/applications/crystalball/), [@Risk](https://www.palisade.com/risk/), [Lumina Analytica](https://lumina.com/))
- A [probabilistic programming language](https://en.wikipedia.org/wiki/Probabilistic_programming). Squiggle does not support Bayesian inference.
- A tool for substantial data analysis. (See programming languages like [Python](https://www.python.org/) or [Julia](https://julialang.org/))
- A programming language for anything other than estimation.
- A visually-driven tool. (See [Guesstimate](https://www.getguesstimate.com/) and [Causal](https://causal.app/))

### Strengths
- Simple and readable syntax, especially for dealing with probabilistic math.
- Fast for relatively small models. Strong for rapid prototyping.
- Optimized for using some numeric and symbolic approaches, not just Monte Carlo. 
- Embeddable in Javascript.
- Free and open-source.

### Weaknesses 
- Limited scientific capabilities.
- Much slower than serious probabilistic programming languages on sizeable models.
- Can't do Bayesian backwards inference.
- Essentially no support for libraries or modules (yet).
- Still very new, so a tiny ecosystem.
- Still very new, so there are likely math bugs.
- Generally not as easy to use as Guesstimate or Causal, especially for non programmers.

## Organization
Squiggle is one of the main projects of [The Quantified Uncertainty Research Institute](https://quantifieduncertainty.org/). QURI is a nonprofit funded primarily by [Effective Altruist](https://www.effectivealtruism.org/) donors.

## Get started

- [Gallery](./Discussions/Gallery)
- [Squiggle playground](/playground)
- [Language basics](./Guides/Language)
- [Squiggle functions source of truth](./Guides/Functions)
- [Known bugs](./Discussions/Bugs)
- [Original lesswrong sequence](https://www.lesswrong.com/s/rDe8QE5NvXcZYzgZ3)
- [Author your squiggle models as Observable notebooks](https://observablehq.com/@hazelfire/squiggle)
