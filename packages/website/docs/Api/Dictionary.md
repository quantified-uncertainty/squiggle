---
sidebar_position: 1
title: Dictionary
---

### toString

```javascript
(dict<a>):string
```

### get

```javascript
(dict<a>, string):a
```

### set

```javascript
(dict<a>, string, a):a
```

### toPairs

```javascript
(dict<a>):list<list<string|a>>
```

### keys

```javascript
(dict<a>):list<string>
```

### values

```javascript
(dict<a>):list<a>
```

### merge

```javascript
(dict<a>, dict<b>):dict<a|b>
```

### mergeMany

```javascript
(list<dict<a>>):dict<a>
```
