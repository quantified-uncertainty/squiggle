---
sidebar_position: 6
title: Function
---

## declare (experimental)

Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making formal predictions. It allows you to limit the domain that your prediction will be used and scored within.

The one function that declarations currently have is that they impact plotting. If you ``declare`` a single-variable function within a specific range, this specific range will be plotted.

Declarations are currently experimental and will likely be removed or changed in the future.

```
Function.declare: (dict<{fn: lambda, inputs: array<dict<{min: number, max: number}>>}>) => declaration
```

**Examples**

```javascript
Function.declare({
  fn: {|a| a+10 },
  inputs: [
    {min: 30, max: 100}
  ]
})
```