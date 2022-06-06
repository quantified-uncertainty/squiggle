---
sidebar_position: 3
title: Point Set Distribution
---

### make
```
PointSet.make: (distribution) => pointSetDist
```



### makeContinuous
```
PointSet.makeContinuous: (list<{x: number, y: number}>) => pointSetDist
```



### makeDiscrete
```
PointSet.makeDiscrete: (list<{x: number, y: number}>) => pointSetDist
```



### mapPoints
```
PointSet.mapPoints: (pointSetDist, ({x:number, y:number} => {x:number, y:number})) => pointSetDist 
```