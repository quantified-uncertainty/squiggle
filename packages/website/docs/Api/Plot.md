---
sidebar_position: 8
title: Plot
---

Plot objects can be created to make plots of different kinds. If you wish to plot
multiple distributions simultaneously, you can use `Plot.dist`.

**Example**

### dist

```
Plot.dist({show: list({name: string, value: distribution|number})})
```

```js
Plot.dist({show: [{name: "normal", value: normal(0, 1)}, {name: "lognormal", value: 2 to 3}]})
```
