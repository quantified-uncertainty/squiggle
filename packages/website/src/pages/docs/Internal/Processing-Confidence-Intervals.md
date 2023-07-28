---
title: Processing Confidence Intervals
author: Nuño Sempere
description: This page explains what we are doing when we take a 90% confidence interval, and we get a mean and a standard deviation from it.
---

This page explains what we are doing when we take a 90% confidence interval, and we get a mean and a standard deviation from it.

## For normals

```js
module Normal = {
  //...
  let from90PercentCI = (low, high) => {
    let mean = E.A.Floats.mean([low, high])
    let stdev = (high -. low) /. (2. *. 1.6448536269514722)
    #Normal({mean: mean, stdev: stdev})
  }
  //...
}
```

We know that for a normal with mean $\mu$ and standard deviation $\sigma$,

$$
a \cdot Normal(\mu, \sigma) = Normal(a \cdot \mu, |a| \cdot \sigma)
$$

We can now look at the quantile of a $Normal(0,1)$. We find that the 95% point is reached at $1.6448536269514722$. ([source](https://stackoverflow.com/questions/20626994/how-to-calculate-the-inverse-of-the-normal-cumulative-distribution-function-in-p)) This means that the 90% confidence interval is $[-1.6448536269514722, 1.6448536269514722]$, which has a width of $2 \cdot 1.6448536269514722$.

So then, if we take a $Normal(0,1)$ and we multiply it by $\frac{(high -. low)}{(2. *. 1.6448536269514722)}$, it's 90% confidence interval will be multiplied by the same amount. Then we just have to shift it by the mean to get our target normal.