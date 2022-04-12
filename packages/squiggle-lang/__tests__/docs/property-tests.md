# Property tests for squiggle

Here are some property tests for squiggle. I am testing mostly for the mean and the standard deviation. I know that squiggle doesn't yet have functions for the standard deviation, but they could be added.

The keywords to search for are "[algebra of random variables](https://wikiless.org/wiki/Algebra_of_random_variables?lang=en)". 

## Sums

$$ mean(f+g) = mean(f) + mean(g) $$

$$ Std(f+g) = sqrt(std(f)^2 + std(g)^2) $$

In the case of normal distributions,

$$ normal(a,b) + normal(c,d) = normal(a+c, sqrt(b^2 + d^2) $$

## Substractions

$$ mean(f-g) = mean(f) - mean(g) $$

$$ std(f-g) = sqrt(std(f)^2 + std(g)^2) $$

## Multiplications

$$ mean(f \cdot g) =  mean(f) \cdot mean(g) $$

$$ std(f \cdot g) = sqrt( (std(f)^2 + mean(f)) \cdot (std(g)^2 + mean(g)) - (mean(f) \cdot mean(y))^2) $$

## Divisions

Divisions are tricky, and in general we don't have good expressions to characterize properties of ratios. In particular, the ratio of two normals is a Cauchy distribution, which doesn't have to have a mean.

## To do:

- Provide sources or derivations, useful as this document becomes more complicated
- Provide definitions for the probability density function, exponential, inverse, log, etc.
- Provide at least some tests for division
- See if playing around with characteristic functions turns out anything useful
