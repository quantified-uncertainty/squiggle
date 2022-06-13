---
sidebar_position: 1
title: Date
---

Squiggle date types are a very simple implementation on [Javascript's Date type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date). It's mainly here for early experimentation. There are more relevant functions for the [Duration](/docs/Api/Duration) type.

### makeFromYear
(Now ``makeDateFromYear``)

```
Date.makeFromYear: (number) => date
```

```js
makeFromYear(2022.32);
```

### toString

```
toString: (date) => string
```

### add

```
add: (date, duration) => date
```

```js
makeFromYear(2022.32) + years(5);
```

### subtract

```
subtract: (date, date) => duration
subtract: (date, duration) => date
```

```js
makeFromYear(2040) - makeFromYear(2020); // 20 years
makeFromYear(2040) - years(20); // 2020
```
