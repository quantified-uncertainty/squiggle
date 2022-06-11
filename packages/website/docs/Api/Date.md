---
sidebar_position: 1
title: Date
---

### makeFromYear

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

### subtract

```
subtract: (date, date) => duration
subtract: (date, duration) => date
```

```js
makeFromYear(2040) - makeFromYear(2020); // 20 years
makeFromYear(2040) - years(20); // 2020
```

### add

```
add: (date, duration) => date
```

```js
makeFromYear(2022.32) + years(5);
```
