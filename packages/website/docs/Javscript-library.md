---
sidebar_position: 3
---

# Javascript Libraries

There are two JavaScript packages currently available for Squiggle:
 - [`@quri/squiggle-lang`](https://www.npmjs.com/package/@quri/squiggle-lang)
 - [`@quri/squiggle-components`](https://www.npmjs.com/package/@quri/squiggle-components)

Types are available for both packages.

## Squiggle Language

The `@quri/squiggle-lang` package exports a single function, `run`, which given
a string of Squiggle code, will execute the code and return any exports and the
environment created from the squiggle code.

`run` has two optional arguments. The first optional argument allows you to set
sampling settings for Squiggle when representing distributions. The second optional
argument allows you to pass an environment previously created by another `run`
call. Passing this environment will mean that all previously declared variables
in the previous environment will be made available.

The return type of `run` is a bit complicated, and comes from auto generated js
code that comes from rescript. I highly recommend using typescript when using
this library to help navigate the return type.

## Squiggle Components

The `@quri/squiggle-components` package offers several components and utilities
for people who want to embed Squiggle components into websites. This documentation
relies on `@quri/squiggle-components` frequently. 

We host [a storybook](https://components.squiggle-language.com/) with details
and usage of each of the components made available.
