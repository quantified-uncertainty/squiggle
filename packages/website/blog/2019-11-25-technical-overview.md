---
slug: technical-overview
title: Technical Overview
authors: ozzie
---
# Squiggle Technical Overview
This piece is meant to be read after  [Squiggle: An Overview](https://www.lesswrong.com/posts/i5BWqSzuLbpTSoTc4/squiggle-an-overview) .  It includes technical information I thought best separated out for readers familiar with coding. As such, it’s a bit of a grab-bag. It explains the basic internals of Squiggle, outlines ways it could be used in other programming languages, and details some of the history behind it. 

The Squiggle codebase is organized in  [this github repo](https://github.com/foretold-app/squiggle) . It’s open source. The code is quite messy now, but do ping me if you’re interested in running it or understanding it.

## Project Subcomponents
I think of Squiggle in three distinct clusters.
1. A high-level ReasonML library for probability distributions.
2. A simple programming language.
3. Custom visualizations and GUIs.

### 1. A high-level ReasonML library for probability distribution functions  
Python has some great libraries for working with probabilities and symbolic mathematics. Javascript doesn’t. Squiggle is to be run in Javascript (for interactive editing and use), so the first step for this is to have good libraries to do the basic math. 

The second step is to have-level types that could express various types of distributions and functions of distributions. For example, some distributions have symbolic representations, and others are rendered (stored as x-y coordinates). These two types have to be dealt with separately. Squiggle also has limited support for continuous and discrete mixtures, and the math for this adds more complexity.

When it comes to performing functions on expressions, there’s a lot of optimization necessary for this to go smoothly.
Say you were to write the function,
```
multimodal(normal(5,2), normal(10,1) + uniform(1,10)) * 100
```

You’d want to apply a combination of symbolic, numeric, and sampling techniques in order to render this equation. In this case, Squiggle would perform sampling to compute the distribution of normal(10,1) + uniform(1,10) and then it would use numeric methods for the rest of the equation. In the future, it would be neat if Squiggle would also first symbolically modify the internal distributions to be multiplied by 100, rather than performing it as a separate numeric step.

This type-dependent function operations can be confusing to users, but hopefully less confusing than having to figure out how to do each of the three and doing them separately. I imagine there could be some debugging UI to better explain what operations are performed.

### 2. Simple programming language functionality  
It can be useful to think of Squiggle as similar to SQL, Excel, or Probabilistic Programming Languages like  [WebPPL](http://webppl.org/) . There are simple ways to declare variables and write functions, but don’t expect to use classes, inheritance, or monads. There’s no for loops, though it will probably have some kinds of reduce() methods in the future.

So far the parsing is done with MathJS, meaning we can’t change the syntax. I’m looking forward to doing so and have been thinking about what it should be like. One idea I’m aiming for is to allow for simple dependent typing for the sake of expressing limited functions. For instance,

```
myFunction(t: [float from 0 to 30]) = normal(t,10)
myFunction
```

This function would return an error if called with a float less than 0 or greater than 30. I imagine that many prediction functions would only be estimated for limited domains.

With some introspection it should be possible to auto-generate calculator-like interfaces.

### 3. Visualizations and GUIs  
The main visualizations need to be made from scratch because there’s little out there now in terms of quality open-source visualizations of probability distributions and similar. This is especially true for continuous and discrete mixtures. D3 seems like the main library here, and D3 can be gnarly to write and maintain.

Right now we’re using a basic  [Vega](https://vega.github.io/)  chart for the distribution over a variable, but this will be replaced later.

In the near term, I’m interested in making calculator-like user interfaces of various kinds. I imagine one prediction function could be used for many interfaces of calculators.
 
## Deployment Story, or, Why Javascript?  
Squiggle is written in ReasonML which compiles to Javascript. The obvious alternative is Python. Lesser obvious but interesting options are Mathematica or Rust via WebAssembly.

The plan for Squiggle is to prioritize small programs that could be embedded in other programs and run quickly. Perhaps there will be 30 submissions for a “Covid-19 over time per location” calculator, and we’d want to run them in parallel in order to find the average answer or to rank them. I could imagine many situations where it would be useful to run these functions for many different inputs; for example, for kinds of sensitivity analyses. 

One nice-to-have feature would be functions that call other functions. Perhaps a model of your future income levels depends on some other aggregated function of the S&P 500, which further depends on models of potential tail risks to the economy. If this were the case you would want to have those model dependencies be easily accessible. This could be done via downloading or having a cloud API to quickly call them remotely. 

Challenges like these require some programmatic architecture where functions can be fully isolated/sandboxed and downloaded and run on the fly. There are very few web application infrastructures aimed to do things like this, I assume in part because of the apparent difficulty.

Python is open source and has the most open-source tooling for probabilistic work. Ought’s  [Ergo](https://github.com/oughtinc/ergo)  is in Python, and their Elicit uses Ergo (I believe).  [Pyro](https://pyro.ai/)  and  [Edward](http://edwardlib.org/) , two of the most recent and advanced probabilistic programming languages, are accessible in Python. Generally, Python is the obvious choice. 

Unfortunately, the current tooling to run small embedded Python programs, particularly in the browser, is quite mediocre. There are a few attempts to bring Python directly to the browser, like  [Pyrodide](https://hacks.mozilla.org/2019/04/pyodide-bringing-the-scientific-python-stack-to-the-browser/) , but these are quite early and relatively poorly supported. If you want to run a bunch of Python jobs on demand, you could use Serverless platforms like  [AWS Lambda](https://aws.amazon.com/lambda/)  or something more specialized like  [PythonAnywhere](https://www.pythonanywhere.com/) . Even these are relatively young and raise challenges around speed, cost, and complexity.

I’ve looked a fair bit into various solutions. I think that for at least the next 5 to 15 years, the Python solutions will be challenging to run as conveniently as Javascript solutions would. For this time it’s expected that Python will have to run in separate servers, and this raises issues of speed, cost, and complexity.

At  [Guesstimate](https://www.getguesstimate.com/) , we experimented with solutions that had sampling running on a server and found this to hurt the experience. We tested latency of around 40ms to 200ms. Being able to see the results of calculations as you type is a big deal and server computation prevented this. It’s possible that newer services with global/local server infrastructures could help here (as opposed to setups with only 10 servers spread around globally), but it would be tricky.  [Fly.io](https://fly.io/)  launched in the last year, maybe that would be a decent fit for near-user computation.

Basically, at this point, it seems important that Squiggle programs could be easily imported and embedded in the browser and servers, and for this, Javascript currently seems like the best bet. Javascript currently has poor support for probability, but writing our own probability libraries is more feasible than making Python portable. All of the options seem fairly mediocre, but Javascript a bit less so.

Javascript obviously runs well in the browser, but its versatility is greater than that.  [Observable](https://observablehq.com/)  and other in-browser Javascript coding platforms load in  [NPM](https://www.npmjs.com/)  libraries on the fly to run directly in the browser, which demonstrates that such functionality is possible. It’s  [possible](https://code.google.com/archive/p/pyv8/)  (though I imagine a bit rough) to call Javascript programs from Python.

ReasonML compiles to OCaml before it compiles to Javascript. I’ve found it convenient for writing complicated code and now am hesitant to go back to a dynamic, non-functional language. There’s definitely a whole lot to do (the existing Javascript support for math is very limited), but at least there are decent approaches to doing it.

I imagine the landscape will change a lot in the next 3 to 10 years. I’m going to continue to keep an eye on the space. If things change I could very much imagine pursuing a rewrite, but I think it will be a while before any change seems obvious.

## Using Squiggle with other languages  
Once the basics of Squiggle are set up, it could be used to describe the results of models that come from other programs. Similar to how many programming languages have ORMs to generate custom SQL statements, similar tools could be made to generate Squiggle functions. The important thing to grok is that Squiggle functions are submitted information, not just internally useful tools. If there were an API to accept “predictions”, people would submit Squiggle code snippets directly to this API.

*I’d note here that I find it somewhat interesting how few public APIs do accept code snippets. I could imagine a version of Facebook where you could submit a Javascript function that would take in information about a post and return a number that would be used for ranking it in your feed. This kind of functionality seems like it could be very powerful. My impression is that it’s currently thought to be too hard to do given existing technologies. This of course is not a good sign for the feasibility of my proposal here, but this coarse seems like a necessary one to do at some time.*

### Example #1:
Say you calculate a few parameters, but know they represent a multimodal combination of a normal distribution and a uniform distribution. You want to submit that as your prediction or estimate via the API of Metaculus or Foretold. You could write that as (in Javascript):

```
var squiggleValue = `mm(normal(${norm.mean}, ${norm.stdev}}), uniform(0, ${uni.max}))`
```

The alternative to this is that you send a bunch of X-Y coordinates representing the distribution, but this isn’t good. It would require you to load the necessary library, do all the math on your end, and then send (what is now a both approximated and much longer) form to the server.

With Squiggle, you don’t need to calculate the shape of the function in your code, you just need to express it symbolically and send that off.

### Example #2:  
Say you want to describe a distribution with a few or a bunch of calculated CDF points. You could do this by wrapping these points into a function that would convert them into a smooth distribution using one of several possible interpolation methods. Maybe in Javascript this would be something like,

```
var points = [[1, 30], [4, 40], [50,70]];
var squiggleValue = `interpolatePoints(${points}, metalog)`
```

I could imagine it is possible that the majority of distributions generated from other code would be sent this way. However, I can’t tell what the specifics of that now or what interpolation strategies may be favored. Doing it with many options would allow us to wait and learn what seems to be best. If there is one syntax used an overwhelming proportion of the time, perhaps that could be separated into its own simpler format.

### Example #3:
Say you want to estimate Tesla stock at every point in the next 10 years. You decide to estimate this using a simple analytical equation, where you predict that the price of Tesla stock can be modeled as growing by a mean of -3 to 8 percent each year from the current price using a normal distribution (apologies to Nassim Taleb).

You have a script that fetches Tesla’s current stock, then uses that in the following string template:

```
var squiggleValue = `(t) => ${current_price} * (0.97 to 1.08)^t`
```

It may seem a bit silly to not just fetch Tesla’s price from within Squiggle, but it does help separate concerns. Data fetching within Squiggle would raise a bunch of issues, especially when trying to score Squiggle functions.It may seem a bit silly to not just fetch Tesla’s price from within Squiggle, but it does help separate concerns. Data fetching within Squiggle would raise a bunch of issues, especially when trying to score Squiggle functions.

## History: From Guesstimate to Squiggle  
The history of “Squiggle” goes back to early Guesstimate. It’s been quite a meandering journey. I was never really expecting things to go the particular way they did, but at least am relatively satisfied with how things are right now. I imagine these details won’t be interesting to most readers, but wanted to include it for those particularly close to the project, or for those curious on what I personally have been up to.

90% of the work on Squiggle has been on a probability distribution editor (“A high-level ReasonML library for probability distribution functions**”)**. This has been a several year process, including my time with Guesstimate. The other 10% of the work, with the custom functions, is much more recent.

Things started with  [Guesstimate](https://www.getguesstimate.com/)  in around 2016. The Guesstimate editor used a simple sampling setup. It was built with  [Math.js](https://mathjs.org/)  plus a bit of tooling to support sampling and a few custom functions.[1] The editor produced histograms, as opposed to smooth shapes.

When I started working on  [Foretold](https://www.foretold.io/) , in 2018, I hoped we could directly take the editor from Guesstimate. It soon became clear the histograms it produced wouldn’t be adequate.

In Foretold we needed to score distributions. Scoring distributions requires finding the probability density function at different points, and that requires a continuous representation of the distribution. Converting random samples to continuous distributions requires kernel density estimation. I tried simple kernel density estimation, but couldn’t get this to work well. Randomness in distribution shape is quite poor for forecasting users. It brings randomness into scoring, it looks strange (confusing), and it’s terrible when there are long tails.

Limited distribution editors like those in Metaculus or Elicit don’t use sampling; they use numeric techniques. For example, to take the pointwise sum of three uniform distributions, they would take the pdfs at each point and add them vertically. Numeric techniques are well defined for a narrow subset of combinations of distributions. The main problem with these editors is that they are (so far) highly limited in flexibility; you can only make linear combinations of single kinds of distributions (logistic distributions in Metaculus and uniform ones with Elicit.)

It took a while, but we eventually created a simple editor that would use numeric techniques to combine a small subset of distributions and functions using a semi-flexible string representation. If users would request functionality not available in this editor (like multiplying two distributions together, which would require sampling), it would fall back to using the old editor. This was useful but suboptimal. It required us to keep two versions of the editor with slightly different syntaxes, which was not fun for users to keep track of.

The numeric solver could figure out syntaxes like,
```
multimodal(normal(5,2), uniform(10,13), [.2,.8])
```

But would break anytime you wanted to use any other function, like,
```
multimodal(normal(5,2) + lognormal(1,1.5), uniform(10,13), [.2,.8])*100
```

The next step was making a system that would more precisely use numeric methods and Monte Carlo sampling. 

At this point we needed to replace most of Math.js. Careful control over the use of Monte Carlo techniques vs. numeric techniques required us to write our own interpreter.  [Sebastian Kosch](https://aldusleaf.org/)  did the first main stab at this. I then read a fair bit about how to write interpreted languages and fleshed out the functionality. If you’re interested, the book  [Crafting Interpreters](https://craftinginterpreters.com/)  is pretty great on this topic.{interpreters}

At this point we were 80% of the way there to having simple variables and functions, so those made sense to add as well. Once we had functions, it was simple to try out visualizations of single variable distributions, something I’ve been wanting to test out for a long time. This proved surprisingly fun, though of course it was limited (and still is.)

After messing with these functions, and spending a lot more time thinking about them, I decided to focus more on making this a formalized language in order to better explore a few areas. This is when I took this language out of its previous application (called WideDomain, it’s not important now), and renamed it Squiggle.
 
[1] It was great this worked at the time; writing my own version may have been too challenging, so it’s possible this hack was counterfactually responsible for Guesstimate.