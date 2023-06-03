"use strict";
(() => {
var exports = {};
exports.id = 104;
exports.ids = [104];
exports.modules = {

/***/ 7783:
/***/ ((module) => {

module.exports = require("next/dist/compiled/@edge-runtime/cookies");

/***/ }),

/***/ 8530:
/***/ ((module) => {

module.exports = require("next/dist/compiled/@opentelemetry/api");

/***/ }),

/***/ 5547:
/***/ ((module) => {

module.exports = require("next/dist/compiled/bytes");

/***/ }),

/***/ 4426:
/***/ ((module) => {

module.exports = require("next/dist/compiled/chalk");

/***/ }),

/***/ 4929:
/***/ ((module) => {

module.exports = require("next/dist/compiled/content-type");

/***/ }),

/***/ 252:
/***/ ((module) => {

module.exports = require("next/dist/compiled/cookie");

/***/ }),

/***/ 7664:
/***/ ((module) => {

module.exports = require("next/dist/compiled/fresh");

/***/ }),

/***/ 5644:
/***/ ((module) => {

module.exports = require("next/dist/compiled/jsonwebtoken");

/***/ }),

/***/ 7798:
/***/ ((module) => {

module.exports = require("next/dist/compiled/raw-body");

/***/ }),

/***/ 6113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 7147:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 3685:
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ 5687:
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ 6168:
/***/ ((module) => {

module.exports = require("process");

/***/ }),

/***/ 5477:
/***/ ((module) => {

module.exports = require("punycode");

/***/ }),

/***/ 3477:
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ 2781:
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ 5356:
/***/ ((module) => {

module.exports = require("stream/web");

/***/ }),

/***/ 7310:
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ 9796:
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ 6482:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "headerHooks": () => (/* binding */ headerHooks),
  "requestAsyncStorage": () => (/* binding */ requestAsyncStorage),
  "routeModule": () => (/* binding */ routeModule),
  "serverHooks": () => (/* binding */ serverHooks),
  "staticGenerationAsyncStorage": () => (/* binding */ staticGenerationAsyncStorage),
  "staticGenerationBailout": () => (/* binding */ staticGenerationBailout)
});

// NAMESPACE OBJECT: ./src/app/route.ts
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  "GET": () => (GET),
  "POST": () => (POST)
});

// EXTERNAL MODULE: ../../node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(8302);
// EXTERNAL MODULE: ../../node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(3232);
var module_default = /*#__PURE__*/__webpack_require__.n(app_route_module);
// EXTERNAL MODULE: ../../node_modules/graphql-yoga/cjs/index.js
var cjs = __webpack_require__(1011);
// EXTERNAL MODULE: ../../node_modules/@pothos/core/esm/index.js + 37 modules
var esm = __webpack_require__(7724);
// EXTERNAL MODULE: ../../node_modules/@pothos/plugin-simple-objects/esm/index.js
var plugin_simple_objects_esm = __webpack_require__(4742);
;// CONCATENATED MODULE: ./src/builder.ts


const builder = new esm/* default */.ZP({
    plugins: [
        plugin_simple_objects_esm/* default */.Z
    ]
});
builder.queryType({});

// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __webpack_require__(6113);
var external_crypto_default = /*#__PURE__*/__webpack_require__.n(external_crypto_);
;// CONCATENATED MODULE: external "lodash/sortBy.js"
const sortBy_js_namespaceObject = require("lodash/sortBy.js");
;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/E_A.js

const zip = (xs, ys)=>{
    const lenX = xs.length;
    const lenY = ys.length;
    const len = lenX < lenY ? lenX : lenY;
    const s = new Array(len);
    for(let i = 0; i < len; i++){
        s[i] = [
            xs[i],
            ys[i]
        ];
    }
    return s;
};
const accumulate = (items, fn)=>{
    const len = items.length;
    const result = new Array(len).fill(0);
    for(let i = 0; i < len; i++){
        const element = items[i];
        if (i === 0) {
            result[i] = element;
        } else {
            result[i] = fn(element, result[i - 1]);
        }
    }
    return result;
};
const unzip = (items)=>{
    const len = items.length;
    const a1 = new Array(len);
    const a2 = new Array(len);
    for(let i = 0; i < len; i++){
        const [v1, v2] = items[i];
        a1[i] = v1;
        a2[i] = v2;
    }
    return [
        a1,
        a2
    ];
};
const toRanges = (items)=>{
    if (items.length < 2) {
        return {
            ok: false,
            value: "Must be at least 2 elements"
        };
    } else {
        return Ok(zip(items, items.slice(1)));
    }
};
const pairwise = (items, fn)=>{
    const result = [];
    for(let i = 1; i < items.length; i++){
        result.push(fn(items[i - 1], items[i]));
    }
    return result;
};
const makeBy = (n, fn)=>{
    const result = [];
    for(let i = 0; i < n; i++){
        result.push(fn(i));
    }
    return result;
}; //# sourceMappingURL=E_A.js.map

;// CONCATENATED MODULE: external "lodash/isInteger.js"
const isInteger_js_namespaceObject = require("lodash/isInteger.js");
;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/E_A_Floats.js


class RangeError extends Error {
}
const range = (min, max, n)=>{
    if (!isInteger_js_namespaceObject(n)) {
        throw new Error("n must be integer");
    }
    if (n === 0) {
        return [];
    } else if (n === 1) {
        return [
            min
        ];
    } else if (n === 2) {
        return [
            min,
            max
        ];
    } else if (n < 0) {
        throw new RangeError("n must be greater than 0");
    } else if (min === max) {
        return new Array(n).fill(min);
    } else if (min > max) {
        throw new RangeError("Min value is higher then max value");
    } else {
        const diff = (max - min) / (n - 1);
        const result = [];
        for(let i = 0; i < n; i++){
            result.push(min + i * diff);
        }
        return result;
    }
};
const isSorted = (t)=>{
    if (t.length <= 1) {
        return true;
    }
    for(let i = 0; i < t.length; i++){
        if (t[i] >= t[i + 1]) {
            return false;
        }
    }
    return true;
};
const sum = (t)=>{
    let sum = 0;
    for (let v of t){
        sum += v;
    }
    return sum;
};
const product = (t)=>{
    let prod = 1;
    let i = t.length;
    while(--i >= 0){
        prod *= t[i];
    }
    return prod;
};
const mean = (t)=>{
    return sum(t) / t.length;
};
const geomean = (t)=>{
    return Math.pow(product(t), 1 / t.length);
};
const percentile = (t)=>{
    return sum(t) / t.length;
};
const sort = (t)=>{
    return Array.from(new Float64Array(t).sort());
};
const variance = (xs)=>{
    const n = xs.length;
    const offset = (xs[0] + xs[n - 1]) / 2;
    let sum = 0;
    let sumsq = 0;
    for(let i = 0; i < n; i++){
        const xOffset = xs[i] - offset;
        sum += xOffset;
        sumsq += xOffset * xOffset;
    }
    const mean = sum / n;
    return sumsq / n - mean * mean;
};
const stdev = (t)=>Math.sqrt(variance(t));
const E_A_Floats_accumulate = (items, fn)=>{
    const length = items.length;
    const result = new Array(length);
    for(let i = 0; i < length; i++){
        if (i === 0) {
            result[i] = items[0];
        } else {
            result[i] = fn(items[i], result[i - 1]);
        }
    }
    return result;
};
const cumSum = (t)=>{
    return E_A_Floats_accumulate(t, (a, b)=>a + b);
};
const cumProd = (t)=>{
    return E_A_Floats_accumulate(t, (a, b)=>a * b);
};
const diff = (t)=>{
    return pairwise(t, (left, right)=>right - left);
}; //# sourceMappingURL=E_A_Floats.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/E_A_Sorted.js
const E_A_Sorted_firstGreaterIndex = (xs, x)=>{
    let a = 0, b = xs.length;
    while(a < b){
        const m = Math.floor((a + b) / 2);
        if (xs[m] <= x) {
            a = m + 1;
        } else {
            b = m;
        }
    }
    return a;
};
const E_A_Sorted_percentile = (xs, k)=>{
    const realIndex = k * (xs.length - 1);
    const index = Math.floor(realIndex);
    if (index + 1 < xs.length) {
        const frac = realIndex - index;
        const x0 = xs[index];
        const x1 = xs[index + 1];
        return x0 + frac * (x1 - x0);
    } else {
        return xs[index];
    }
}; //# sourceMappingURL=E_A_Sorted.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/result.js
function result_Ok(value) {
    return {
        ok: true,
        value: value
    };
}
function result_Error(value) {
    return {
        ok: false,
        value: value
    };
}
function fmap(r, fn) {
    if (r.ok) {
        return result_Ok(fn(r.value));
    } else {
        return r;
    }
}
function fmap2(r, fn1, fn2) {
    if (r.ok) {
        return result_Ok(fn1(r.value));
    } else {
        return result_Error(fn2(r.value));
    }
}
function errMap(r, fn) {
    if (r.ok) {
        return r;
    } else {
        return result_Error(fn(r.value));
    }
}
function bind(r, fn) {
    if (r.ok) {
        return fn(r.value);
    } else {
        return r;
    }
}
function merge(a, b) {
    if (!a.ok) {
        return a;
    }
    if (!b.ok) {
        return b;
    }
    return result_Ok([
        a.value,
        b.value
    ]);
}
function getError(r) {
    if (!r.ok) {
        return r.value;
    } else {
        return undefined;
    }
} //# sourceMappingURL=result.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/magicNumbers.js
const epsilon_float = 2.22044604925031308e-16;
const Environment = {
    defaultXYPointLength: 1000,
    defaultSampleCount: 10000,
    sparklineLength: 20
};
const OpCost = {
    floatCost: 1,
    symbolicCost: 1000,
    mixedCost: 1000,
    continuousCost: 1000,
    wildcardCost: 1000,
    monteCarloCost: Environment.defaultSampleCount
};
const Epsilon = {
    ten: 1e-10
}; //# sourceMappingURL=magicNumbers.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/XYShape.js






const XYShapeError = {
    mapErrorArrayToError (errors) {
        if (errors.length === 0) {
            return undefined;
        } else if (errors.length === 1) {
            return errors[0];
        } else {
            return {
                tag: "MultipleErrors",
                errors
            };
        }
    },
    toString (t) {
        switch(t.tag){
            case "NotSorted":
                return `${t.property} is not sorted`;
            case "IsEmpty":
                return `${t.property} is empty`;
            case "NotFinite":
                return `${t.property} is not finite. Example value: ${t.value}`;
            case "DifferentLengths":
                return `${t.p1Name} and ${t.p2Name} have different lengths. ${t.p1Name} has length ${t.p1Length} and ${t.p2Name} has length ${t.p2Length}`;
            case "MultipleErrors":
                return `Multiple Errors: ${t.errors.map(XYShapeError.toString).map((r)=>`[${r}]`).join(", ")}`;
        }
    }
};
const interpolate = (xMin, xMax, yMin, yMax, xIntended)=>{
    const minProportion = (xMax - xIntended) / (xMax - xMin);
    const maxProportion = (xIntended - xMin) / (xMax - xMin);
    return yMin * minProportion + yMax * maxProportion;
};
const extImp = (value)=>{
    if (value === undefined) {
        throw new Error("Tried to perform an operation on an empty XYShape.");
    }
    return value;
};
const T = {
    length (t) {
        return t.xs.length;
    },
    empty: {
        xs: [],
        ys: []
    },
    isEmpty (t) {
        return T.length(t) === 0;
    },
    minX (t) {
        return extImp(t.xs[0]);
    },
    maxX (t) {
        return extImp(t.xs[t.xs.length - 1]);
    },
    firstY (t) {
        return extImp(t.ys[0]);
    },
    lastY (t) {
        return extImp(t.ys[t.ys.length - 1]);
    },
    xTotalRange (t) {
        return T.maxX(t) - T.minX(t);
    },
    mapX (t, fn) {
        return {
            xs: t.xs.map(fn),
            ys: t.ys
        };
    },
    mapY (t, fn) {
        return {
            xs: t.xs,
            ys: t.ys.map(fn)
        };
    },
    mapYResult (t, fn) {
        const mappedYs = [];
        for (const y of t.ys){
            const mappedY = fn(y);
            if (!mappedY.ok) {
                return mappedY;
            }
            mappedYs.push(mappedY.value);
        }
        return result_Ok({
            xs: t.xs,
            ys: mappedYs
        });
    },
    square (t) {
        return T.mapX(t, (x)=>Math.pow(x, 2));
    },
    zip ({ xs , ys  }) {
        return zip(xs, ys);
    },
    fromArray ([xs, ys]) {
        return {
            xs,
            ys
        };
    },
    fromArrays (xs, ys) {
        return {
            xs,
            ys
        };
    },
    accumulateYs (p, fn) {
        return T.fromArray([
            p.xs,
            accumulate(p.ys, fn)
        ]);
    },
    concat (t1, t2) {
        const cxs = [
            ...t1.xs,
            ...t2.xs
        ];
        const cys = [
            ...t1.ys,
            ...t2.ys
        ];
        return {
            xs: cxs,
            ys: cys
        };
    },
    fromZippedArray (pairs) {
        return T.fromArray(unzip(pairs));
    },
    equallyDividedXs (t, newLength) {
        return range(T.minX(t), T.maxX(t), newLength);
    },
    toJs (t) {
        return t;
    },
    filterYValues (t, fn) {
        return T.fromZippedArray(T.zip(t).filter(([, y])=>fn(y)));
    },
    filterOkYs (xs, ys) {
        const n = xs.length;
        const newXs = [];
        const newYs = [];
        for(let i = 0; i <= n - 1; i++){
            const y = ys[i];
            if (y.ok) {
                newXs.push(xs[i]);
                newYs.push(y.value);
            }
        }
        return {
            xs: newXs,
            ys: newYs
        };
    },
    Validator: {
        notSortedError (p) {
            return {
                tag: "NotSorted",
                property: p
            };
        },
        notFiniteError (p, exampleValue) {
            return {
                tag: "NotFinite",
                property: p,
                value: exampleValue
            };
        },
        isEmptyError (propertyName) {
            return {
                tag: "IsEmpty",
                property: propertyName
            };
        },
        differentLengthsError (t) {
            return {
                tag: "DifferentLengths",
                p1Name: "Xs",
                p2Name: "Ys",
                p1Length: t.xs.length,
                p2Length: t.ys.length
            };
        },
        areXsSorted (t) {
            return isSorted(t.xs);
        },
        areXsEmpty (t) {
            return t.xs.length === 0;
        },
        getNonFiniteXs (t) {
            return t.xs.find((v)=>!Number.isFinite(v));
        },
        getNonFiniteYs (t) {
            return t.ys.find((v)=>!Number.isFinite(v));
        },
        validate (t) {
            const errors = [];
            if (!T.Validator.areXsSorted(t)) {
                errors.push(T.Validator.notSortedError("Xs"));
            }
            if (T.Validator.areXsEmpty(t)) {
                errors.push(T.Validator.isEmptyError("Xs"));
            }
            if (t.xs.length !== t.ys.length) {
                errors.push(T.Validator.differentLengthsError(t));
            }
            const nonFiniteX = T.Validator.getNonFiniteXs(t);
            if (nonFiniteX !== undefined) {
                errors.push(T.Validator.notFiniteError("Xs", nonFiniteX));
            }
            const nonFiniteY = T.Validator.getNonFiniteYs(t);
            if (nonFiniteY !== undefined) {
                errors.push(T.Validator.notFiniteError("Ys", nonFiniteY));
            }
            return XYShapeError.mapErrorArrayToError(errors);
        }
    },
    make (xs, ys) {
        const attempt = {
            xs,
            ys
        };
        const maybeError = T.Validator.validate(attempt);
        if (maybeError) {
            return result_Error(maybeError);
        } else {
            return result_Ok(attempt);
        }
    },
    makeFromZipped (values) {
        const [xs, ys] = unzip(values);
        return T.make(xs, ys);
    }
};
const Pairs = {
    first (t) {
        return [
            T.minX(t),
            T.firstY(t)
        ];
    },
    last (t) {
        return [
            T.maxX(t),
            T.lastY(t)
        ];
    },
    getBy (t, fn) {
        return T.zip(t).find(fn);
    },
    firstAtOrBeforeXValue (t, xValue) {
        const firstGreaterIndex = E_A_Sorted_firstGreaterIndex(t.xs, xValue);
        if (firstGreaterIndex === 0) {
            return;
        }
        return [
            t.xs[firstGreaterIndex - 1],
            t.ys[firstGreaterIndex - 1]
        ];
    }
};
const YtoX = {
    linear (t, y) {
        const firstHigherIndex = E_A_Sorted_firstGreaterIndex(t.ys, y);
        if (firstHigherIndex === t.ys.length) {
            return T.maxX(t);
        } else if (firstHigherIndex === 0) {
            return T.minX(t);
        } else {
            const lowerOrEqualIndex = firstHigherIndex - 1;
            if (t.ys[lowerOrEqualIndex] === y) {
                return t.xs[lowerOrEqualIndex];
            } else {
                return interpolate(t.ys[lowerOrEqualIndex], t.ys[firstHigherIndex], t.xs[lowerOrEqualIndex], t.xs[firstHigherIndex], y);
            }
        }
    }
};
const XtoY = {
    stepwiseIncremental (t, x) {
        var _a;
        return (_a = Pairs.firstAtOrBeforeXValue(t, x)) === null || _a === void 0 ? void 0 : _a[1];
    },
    stepwiseIfAtX (t, f) {
        var _a;
        return (_a = Pairs.getBy(t, ([x])=>x === f)) === null || _a === void 0 ? void 0 : _a[1];
    },
    linear (t, x) {
        const firstHigherIndex = E_A_Sorted_firstGreaterIndex(t.xs, x);
        if (firstHigherIndex === t.xs.length) {
            return T.lastY(t);
        } else if (firstHigherIndex === 0) {
            return T.firstY(t);
        } else {
            const lowerOrEqualIndex = firstHigherIndex - 1;
            if (t.xs[lowerOrEqualIndex] === x) {
                return t.ys[lowerOrEqualIndex];
            } else {
                return interpolate(t.xs[lowerOrEqualIndex], t.xs[firstHigherIndex], t.ys[lowerOrEqualIndex], t.ys[firstHigherIndex], x);
            }
        }
    },
    continuousInterpolator (interpolation, extrapolation) {
        if (interpolation === "Linear" && extrapolation === "UseZero") {
            return (t, leftIndex, x)=>{
                if (leftIndex < 0) {
                    return 0;
                } else if (leftIndex >= T.length(t) - 1) {
                    return 0;
                } else {
                    const x1 = t.xs[leftIndex];
                    const x2 = t.xs[leftIndex + 1];
                    const y1 = t.ys[leftIndex];
                    const y2 = t.ys[leftIndex + 1];
                    const fraction = (x - x1) / (x2 - x1);
                    return y1 * (1 - fraction) + y2 * fraction;
                }
            };
        } else if (interpolation === "Linear" && extrapolation === "UseOutermostPoints") {
            return (t, leftIndex, x)=>{
                if (leftIndex < 0) {
                    return t.ys[0];
                } else if (leftIndex >= T.length(t) - 1) {
                    return t.ys[T.length(t) - 1];
                } else {
                    const x1 = t.xs[leftIndex];
                    const x2 = t.xs[leftIndex + 1];
                    const y1 = t.ys[leftIndex];
                    const y2 = t.ys[leftIndex + 1];
                    const fraction = (x - x1) / (x2 - x1);
                    return y1 * (1 - fraction) + y2 * fraction;
                }
            };
        } else if (interpolation === "Stepwise" && extrapolation === "UseZero") {
            return (t, leftIndex, _x)=>{
                if (leftIndex < 0) {
                    return 0;
                } else if (leftIndex >= T.length(t) - 1) {
                    return 0;
                } else {
                    return t.ys[leftIndex];
                }
            };
        } else if (interpolation === "Stepwise" && extrapolation === "UseOutermostPoints") {
            return (t, leftIndex, _x)=>{
                if (leftIndex < 0) {
                    return t.ys[0];
                } else if (leftIndex >= T.length(t) - 1) {
                    return t.ys[T.length(t) - 1];
                } else {
                    return t.ys[leftIndex];
                }
            };
        } else {
            throw new Error("Implementation error: invalid interpolation/extrapolation strategy combination");
        }
    },
    discreteInterpolator: ()=>0
};
const XsConversion = {
    _replaceWithXs (newXs, t) {
        const newYs = newXs.map((x)=>XtoY.linear(t, x));
        return {
            xs: newXs,
            ys: newYs
        };
    },
    equallyDivideXByMass (integral, newLength) {
        return range(0, 1, newLength).map((y)=>YtoX.linear(integral, y));
    },
    proportionEquallyOverX (t, newLength) {
        return XsConversion._replaceWithXs(T.equallyDividedXs(t, newLength), t);
    },
    proportionByProbabilityMass (t, newLength, integral) {
        return XsConversion._replaceWithXs(XsConversion.equallyDivideXByMass(integral, newLength), t);
    }
};
const Zipped = {
    sortByY (t) {
        return sortBy_js_namespaceObject(t, [
            ([x, y])=>y
        ]);
    },
    sortByX (t) {
        return sortBy_js_namespaceObject(t, [
            ([x, y])=>x
        ]);
    },
    filterByX (t, testFn) {
        return t.filter(([x])=>testFn(x));
    }
};
const PointwiseCombination = {
    combine (interpolator, fn, t1, t2) {
        const t1n = t1.xs.length;
        const t2n = t2.xs.length;
        const outX = [];
        const outY = [];
        let i = -1;
        let j = -1;
        while(i <= t1n - 1 && j <= t2n - 1){
            let x, ya, yb;
            if (j === t2n - 1 && i < t1n - 1 || t1.xs[i + 1] < t2.xs[j + 1]) {
                i++;
                x = t1.xs[i];
                ya = t1.ys[i];
                yb = interpolator(t2, j, x);
            } else if (i === t1n - 1 && j < t2n - 1 || t1.xs[i + 1] > t2.xs[j + 1]) {
                j++;
                x = t2.xs[j];
                yb = t2.ys[j];
                ya = interpolator(t1, i, x);
            } else if (i < t1n - 1 && j < t2n && t1.xs[i + 1] === t2.xs[j + 1]) {
                i++;
                j++;
                x = t1.xs[i];
                ya = t1.ys[i];
                yb = t2.ys[j];
            } else if (i === t1n - 1 && j === t2n - 1) {
                i = t1n;
                j = t2n;
                continue;
            } else {
                throw new Error(`PointwiseCombination error: ${i}, ${j}`);
            }
            outX.push(x);
            const newY = fn(ya, yb);
            if (!newY.ok) {
                return newY;
            }
            outY.push(newY.value);
        }
        return result_Ok({
            xs: outX,
            ys: outY
        });
    },
    addCombine (interpolator, t1, t2) {
        const result = PointwiseCombination.combine(interpolator, (a, b)=>result_Ok(a + b), t1, t2);
        if (!result.ok) {
            throw new Error("Add operation should never fail");
        }
        return result.value;
    }
};
const Range = {
    integrateWithTriangles ({ xs , ys  }) {
        const length = xs.length;
        const cumulativeY = new Array(length).fill(0);
        for(let x = 0; x <= length - 2; x++){
            cumulativeY[x + 1] = (xs[x + 1] - xs[x]) * ((ys[x] + ys[x + 1]) / 2) + cumulativeY[x];
        }
        return {
            xs,
            ys: cumulativeY
        };
    },
    stepwiseToLinear ({ xs , ys  }) {
        const length = xs.length;
        const newXs = new Array(2 * length);
        const newYs = new Array(2 * length);
        newXs[0] = xs[0] - epsilon_float;
        newYs[0] = 0;
        newXs[1] = xs[0];
        newYs[1] = ys[0];
        for(let i = 1; i <= length - 1; i++){
            newXs[i * 2] = xs[i] - epsilon_float;
            newYs[i * 2] = ys[i - 1];
            newXs[i * 2 + 1] = xs[i];
            newYs[i * 2 + 1] = ys[i];
        }
        return {
            xs: newXs,
            ys: newYs
        };
    }
};
const Analysis = {
    getVarianceDangerously (t, mean, getMeanOfSquares) {
        const meanSquared = Math.pow(mean(t), 2);
        const meanOfSquares = getMeanOfSquares(t);
        return meanOfSquares - meanSquared;
    }
}; //# sourceMappingURL=XYShape.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/DistError.js

const tooFewSamplesForConversionToPointSet = ()=>{
    return {
        type: "TooFewSamplesForConversionToPointSet"
    };
};
const distOperationError = (operationError)=>{
    return {
        type: "OperationError",
        value: operationError
    };
};
const notYetImplemented = ()=>({
        type: "NotYetImplemented"
    });
const unreachableError = ()=>({
        type: "Unreachable"
    });
const distributionVerticalShiftIsInvalid = ()=>({
        type: "DistributionVerticalShiftIsInvalid"
    });
const operationDistError = (e)=>({
        type: "OperationError",
        value: e
    });
const sparklineError = (e)=>({
        type: "SparklineError",
        message: e
    });
const logarithmOfDistributionError = (e)=>({
        type: "LogarithmOfDistributionError",
        message: e
    });
const requestedStrategyInvalidError = (e)=>({
        type: "RequestedStrategyInvalidError",
        message: e
    });
const otherError = (e)=>({
        type: "OtherError",
        message: e
    });
const argumentError = (e)=>({
        type: "ArgumentError",
        message: e
    });
const xyShapeDistError = (e)=>({
        type: "XYShapeError",
        value: e
    });
const distErrorToString = (e)=>{
    switch(e.type){
        case "NotYetImplemented":
            return "Function not yet implemented";
        case "Unreachable":
            return "Unreachable";
        case "DistributionVerticalShiftIsInvalid":
            return "Distribution vertical shift is invalid";
        case "ArgumentError":
            return `Argument Error ${e.message}`;
        case "LogarithmOfDistributionError":
            return `Logarithm of input error: ${e.message}`;
        case "NonNumericInput":
            return `Found a non-number in input: ${e.message}`;
        case "OperationError":
            return e.value.toString();
        case "TooFewSamplesForConversionToPointSet":
            return "Too Few Samples to convert to point set";
        case "SparklineError":
            return e.message;
        case "RequestedStrategyInvalidError":
            return `Requested strategy invalid: ${e.message}`;
        case "XYShapeError":
            return `XY Shape Error: ${XYShapeError.toString(e.value)}`;
        case "OtherError":
            return e.message;
        case "TooFewSamples":
            return "Too few samples when constructing sample set";
        default:
            return `Unknown error type ${e.type}`;
    }
}; //# sourceMappingURL=DistError.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/ErrorMessage.js

class MessageException extends Error {
    constructor(e){
        super();
        this.e = e;
    }
    toString() {
        return ErrorMessage.toString(this.e);
    }
}
const REOther = (msg)=>({
        type: "REOther",
        msg
    });
const RESymbolNotFound = (symbolName)=>({
        type: "RESymbolNotFound",
        symbolName
    });
const REDistributionError = (err)=>({
        type: "REDistributionError",
        err
    });
const REArrayIndexNotFound = (msg, index)=>({
        type: "REArrayIndexNotFound",
        msg,
        index
    });
const RERecordPropertyNotFound = (msg, index)=>({
        type: "RERecordPropertyNotFound",
        msg,
        index
    });
const REExpectedType = (typeName, valueString)=>({
        type: "REExpectedType",
        typeName,
        valueString
    });
const RENotAFunction = (value)=>({
        type: "RENotAFunction",
        value
    });
const REOperationError = (err)=>({
        type: "REOperationError",
        err
    });
const REArityError = (fn, arity, usedArity)=>({
        type: "REArityError",
        fn,
        arity,
        usedArity
    });
const ErrorMessage = {
    toString (err) {
        switch(err.type){
            case "REArityError":
                return `${err.arity} arguments expected. Instead ${err.usedArity} argument(s) were passed.`;
            case "REArrayIndexNotFound":
                return `${err.msg}: ${err.index}`;
            case "REAssignmentExpected":
                return "Assignment expected";
            case "REExpressionExpected":
                return "Expression expected";
            case "REFunctionExpected":
                return `Function expected: ${err.msg}`;
            case "REFunctionNotFound":
                return `Function not found: ${err.msg}`;
            case "REDistributionError":
                return `Distribution Math Error: ${distErrorToString(err.err)}`;
            case "REOperationError":
                return `Math Error: ${err.err.toString()}`;
            case "REJavaScriptExn":
                {
                    let answer = "JS Exception:";
                    if (err.name !== undefined) answer += ` ${err.name}:`;
                    if (err.msg !== undefined) answer += ` ${err.msg}`;
                    return answer;
                }
            case "RENotAFunction":
                return `${err.value} is not a function`;
            case "RERecordPropertyNotFound":
                return `${err.msg}: ${err.index}`;
            case "RESymbolNotFound":
                return `${err.symbolName} is not defined`;
            case "RESyntaxError":
                return `Syntax Error: ${err.desc}`;
            case "RETodo":
                return `TODO: ${err.msg}`;
            case "REExpectedType":
                return `Expected type: ${err.typeName} but got: ${err.valueString}`;
            case "RENeedToRun":
                return "Need to run";
            case "REOther":
                return `Error: ${err.msg}`;
            default:
                return `Unknown error ${err}`;
        }
    },
    needToRun () {
        return {
            type: "RENeedToRun"
        };
    },
    fromException (exn) {
        var _a, _b;
        if (exn instanceof MessageException) {
            return exn.e;
        } else if (exn instanceof Error) {
            return REOther((_b = (_a = exn.message) !== null && _a !== void 0 ? _a : exn.name) !== null && _b !== void 0 ? _b : "Unknown error");
        } else {
            return REOther("Unknown error");
        }
    },
    throw (errorValue) {
        throw new MessageException(errorValue);
    }
}; //# sourceMappingURL=ErrorMessage.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/frameStack.js
const topFrameName = "<top>";
class Frame {
    isFrame() {
        return 1;
    }
    constructor(name, location){
        this.name = name;
        this.location = location;
    }
    toString() {
        return this.name + (this.location ? ` at line ${this.location.start.line}, column ${this.location.start.column}, file ${this.location.source}` : "");
    }
}
class FrameStack {
    constructor(frame, parent){
        this.frame = frame;
        this.parent = parent;
    }
    static make() {
        return new FrameStack(new Frame("<root>"));
    }
    extend(name, location) {
        return new FrameStack(new Frame(name, location), this);
    }
    static makeSingleFrameStack(location) {
        return FrameStack.make().extend(topFrameName, location);
    }
    toString() {
        return this.toFrameArray().map((f)=>"  " + f.toString()).join("\n");
    }
    toFrameArray() {
        const result = [];
        let t = this;
        while(t && t.frame){
            if (!t.parent) break;
            result.push(t.frame);
            t = t.parent;
        }
        return result;
    }
    getTopFrame() {
        return this.parent ? this.frame : undefined;
    }
    isEmpty() {
        return this.parent === undefined;
    }
} //# sourceMappingURL=frameStack.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/IError.js


class IError_IError extends Error {
    constructor(m, frameStack){
        super();
        this.m = m;
        this.frameStack = frameStack;
    }
    static fromMessage(message) {
        return new IError_IError(message, FrameStack.make());
    }
    static fromMessageWithFrameStack(message, frameStack) {
        return new IError_IError(message, frameStack);
    }
    static fromParseError({ message , location  }) {
        return IError_IError.fromMessageWithFrameStack({
            type: "RESyntaxError",
            desc: message
        }, FrameStack.makeSingleFrameStack(location));
    }
    static fromException(exn) {
        if (exn instanceof IError_IError) {
            return exn;
        } else if (exn instanceof MessageException) {
            return IError_IError.fromMessage(exn.e);
        } else if (exn instanceof Error) {
            return IError_IError.fromMessage({
                type: "REJavaScriptExn",
                msg: exn.message,
                name: exn.name
            });
        } else {
            return IError_IError.other("Unknown exception");
        }
    }
    static other(v) {
        return IError_IError.fromMessage(REOther(v));
    }
    toString() {
        return ErrorMessage.toString(this.m);
    }
    toStringWithStackTrace() {
        return this.toString() + (this.frameStack.isEmpty() ? "" : "\nStack trace:\n" + this.frameStack.toString());
    }
    getTopFrame() {
        return this.frameStack.getTopFrame();
    }
    getFrameArray() {
        return this.frameStack.toFrameArray();
    }
}
const rethrowWithFrameStack = (fn, frameStack)=>{
    try {
        return fn();
    } catch (e) {
        if (e instanceof IError_IError) {
            throw e;
        } else if (e instanceof MessageException) {
            throw IError_IError.fromMessageWithFrameStack(e.e, frameStack);
        } else if (e instanceof Error) {
            throw IError_IError.fromMessageWithFrameStack({
                type: "REJavaScriptExn",
                msg: e.message,
                name: e.name
            }, frameStack);
        } else {
            throw IError_IError.fromMessageWithFrameStack(REOther("Unknown exception"), frameStack);
        }
    }
}; //# sourceMappingURL=IError.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqError.js

class SqError {
    constructor(_value){
        this._value = _value;
    }
    toString() {
        return this._value.toString();
    }
    toStringWithStackTrace() {
        return this._value.toStringWithStackTrace();
    }
    static createOtherError(v) {
        return new SqError(IError_IError.other(v));
    }
    getTopFrame() {
        const frame = this._value.getTopFrame();
        return frame ? new SqFrame(frame) : undefined;
    }
    getFrameArray() {
        const frames = this._value.getFrameArray();
        return frames.map((frame)=>new SqFrame(frame));
    }
    location() {
        var _a;
        return (_a = this.getTopFrame()) === null || _a === void 0 ? void 0 : _a.location();
    }
}
class SqFrame {
    constructor(_value){
        this._value = _value;
    }
    name() {
        return this._value.name;
    }
    location() {
        return this._value.location;
    }
} //# sourceMappingURL=SqError.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/DateTime.js


const Duration = {
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    year: 24 * 60 * 60 * 1000 * 365.25,
    fromFloat: (f)=>f,
    toFloat: (d)=>d,
    fromMinutes: (h)=>h * Duration.minute,
    fromHours: (h)=>h * Duration.hour,
    fromDays: (d)=>d * Duration.day,
    fromYears: (y)=>y * Duration.year,
    toMinutes: (t)=>t / Duration.minute,
    toHours: (t)=>t / Duration.hour,
    toDays: (t)=>t / Duration.day,
    toYears: (t)=>t / Duration.year,
    toString (t) {
        const shouldPluralize = (f)=>f !== 1.0;
        const display = (f, s)=>`${f.toPrecision(3)} ${s}${shouldPluralize(f) ? "s" : ""}`;
        const abs = Math.abs(t);
        if (abs >= Duration.year) {
            return display(t / Duration.year, "year");
        } else if (abs >= Duration.day) {
            return display(t / Duration.day, "day");
        } else if (abs >= Duration.hour) {
            return display(t / Duration.hour, "hour");
        } else if (abs >= Duration.minute) {
            return display(t / Duration.minute, "minute");
        } else {
            return t.toFixed() + "ms";
        }
    },
    add: (t1, t2)=>t1 + t2,
    subtract: (t1, t2)=>t1 - t2,
    multiply: (t1, t2)=>t1 * t2,
    divide: (t1, t2)=>t1 / t2
};
const DateModule = {
    toString (d) {
        return d.toDateString();
    },
    fmap (t, fn) {
        return new Date(fn(t.getTime()));
    },
    subtract (t1, t2) {
        const [f1, f2] = [
            t1.getTime(),
            t2.getTime()
        ];
        const diff = f1 - f2;
        if (diff < 0) {
            return result_Error("Cannot subtract a date by one that is in its future");
        } else {
            return result_Ok(Duration.fromFloat(diff));
        }
    },
    addDuration (t, duration) {
        return DateModule.fmap(t, (t)=>t + duration);
    },
    subtractDuration (t, duration) {
        return DateModule.fmap(t, (t)=>t - duration);
    },
    makeWithYearInt (y) {
        if (y < 100) {
            return result_Error("Year must be over 100");
        } else if (y > 200000) {
            return result_Error("Year must be less than 200000");
        } else {
            return result_Ok(new Date(y, 0));
        }
    },
    makeFromYear (year) {
        const floor = Math.floor(year);
        return fmap(DateModule.makeWithYearInt(floor), (earlyDate)=>{
            const diff = year - floor;
            return DateModule.addDuration(earlyDate, diff * Duration.year);
        });
    }
};
 //# sourceMappingURL=DateTime.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/declaration.js

const argToString = (arg)=>{
    if (arg.type === "Float") {
        return `Float({min: ${arg.min.toPrecision(2)}, max: ${arg.max.toPrecision(2)})`;
    } else if (arg.type === "Date") {
        return `Date({min: ${DateModule.toString(arg.min)}, max: ${DateModule.toString(arg.max)}})`;
    } else {
        return "unknown arg type";
    }
};
const declarationToString = (r, fnToString)=>{
    const args = r.args.map(argToString).join(", ");
    return `fn: ${fnToString(r.fn)}, args: [${args}]`;
}; //# sourceMappingURL=declaration.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/value/index.js




class VArray {
    constructor(value){
        this.value = value;
        this.type = "Array";
    }
    toString() {
        return "[" + this.value.map((v)=>v.toString()).join(",") + "]";
    }
    get(key) {
        if (key.type === "Number") {
            if (!isInteger_js_namespaceObject(key.value)) {
                return ErrorMessage["throw"](REArrayIndexNotFound("Array index must be an integer", key.value));
            }
            const index = key.value | 0;
            if (index >= 0 && index < this.value.length) {
                return this.value[index];
            } else {
                return ErrorMessage["throw"](REArrayIndexNotFound("Array index not found", index));
            }
        }
        return ErrorMessage["throw"](REOther("Can't access non-numerical key on an array"));
    }
    flatten() {
        return new VArray(this.value.reduce((acc, v)=>acc.concat(v.type === "Array" ? v.value : [
                v
            ]), []));
    }
}
const vArray = (v)=>new VArray(v);
class VBool {
    constructor(value){
        this.value = value;
        this.type = "Bool";
    }
    toString() {
        return String(this.value);
    }
}
const vBool = (v)=>new VBool(v);
class VDate {
    constructor(value){
        this.value = value;
        this.type = "Date";
    }
    toString() {
        return DateModule.toString(this.value);
    }
}
const vDate = (v)=>new VDate(v);
class VDeclaration {
    constructor(value){
        this.value = value;
        this.type = "Declaration";
    }
    toString() {
        return declarationToString(this.value, (f)=>vLambda(f).toString());
    }
    get(key) {
        if (key.type === "String" && key.value === "fn") {
            return vLambda(this.value.fn);
        }
        return ErrorMessage["throw"](REOther("Trying to access key on wrong value"));
    }
}
const vLambdaDeclaration = (v)=>new VDeclaration(v);
class VDist {
    constructor(value){
        this.value = value;
        this.type = "Dist";
    }
    toString() {
        return this.value.toString();
    }
}
const vDist = (v)=>new VDist(v);
class VLambda {
    constructor(value){
        this.value = value;
        this.type = "Lambda";
    }
    toString() {
        return this.value.toString();
    }
}
const vLambda = (v)=>new VLambda(v);
class VNumber {
    constructor(value){
        this.value = value;
        this.type = "Number";
    }
    toString() {
        return String(this.value);
    }
}
const vNumber = (v)=>new VNumber(v);
class VString {
    constructor(value){
        this.value = value;
        this.type = "String";
    }
    toString() {
        return `'${this.value}'`;
    }
}
const vString = (v)=>new VString(v);
class VRecord {
    constructor(value){
        this.value = value;
        this.type = "Record";
    }
    toString() {
        return "{" + [
            ...this.value.entries()
        ].map(([k, v])=>`${k}: ${v.toString()}`).join(",") + "}";
    }
    get(key) {
        var _a;
        if (key.type === "String") {
            return (_a = this.value.get(key.value)) !== null && _a !== void 0 ? _a : ErrorMessage["throw"](RERecordPropertyNotFound("Record property not found", key.value));
        } else {
            return ErrorMessage["throw"](REOther("Can't access non-string key on a record"));
        }
    }
}
const vRecord = (v)=>new VRecord(v);
class VTimeDuration {
    constructor(value){
        this.value = value;
        this.type = "TimeDuration";
    }
    toString() {
        return Duration.toString(this.value);
    }
}
const vTimeDuration = (v)=>new VTimeDuration(v);
class VVoid {
    constructor(){
        this.type = "Void";
    }
    toString() {
        return "()";
    }
}
const vVoid = ()=>new VVoid();
class VPlot {
    constructor(value){
        this.value = value;
        this.type = "Plot";
    }
    toString() {
        switch(this.value.type){
            case "distributions":
                return `Plot containing ${this.value.distributions.map((x)=>x.name).join(", ")}`;
            case "numericFn":
                return `Plot for numeric function ${this.value.fn}`;
            case "distFn":
                return `Plot for dist function ${this.value.fn}`;
            case "scatter":
                return `Scatter plot for distributions ${this.value.xDist} and ${this.value.yDist}`;
        }
    }
    get(key) {
        if (key.type === "String" && key.value === "fn" && (this.value.type === "numericFn" || this.value.type === "distFn")) {
            return vLambda(this.value.fn);
        }
        return ErrorMessage["throw"](REOther("Trying to access key on wrong value"));
    }
}
const vPlot = (plot)=>new VPlot(plot);
class VScale {
    constructor(value){
        this.value = value;
        this.type = "Scale";
    }
    toString() {
        switch(this.value.type){
            case "linear":
                return "Linear scale";
            case "log":
                return "Logarithmic scale";
            case "symlog":
                return "Symlog scale";
            case "power":
                return `Power scale (${this.value.exponent})`;
        }
    }
}
const vScale = (scale)=>new VScale(scale); //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqArray.js

class SqArray {
    constructor(_value, location){
        this._value = _value;
        this.location = location;
    }
    getValues() {
        return this._value.map((v, i)=>{
            var _a;
            return wrapValue(v, (_a = this.location) === null || _a === void 0 ? void 0 : _a.extend(i));
        });
    }
} //# sourceMappingURL=SqArray.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/MixedPoint.js
const makeContinuous = (f)=>({
        continuous: f,
        discrete: 0
    });
const makeDiscrete = (f)=>({
        continuous: 0,
        discrete: f
    });
const add = (p1, p2)=>({
        continuous: p1.continuous + p2.continuous,
        discrete: p1.discrete + p2.discrete
    }); //# sourceMappingURL=MixedPoint.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/Common.js
const combineIntegralSums = (combineFn, v1, v2)=>{
    if (v1 === undefined || v2 === undefined) {
        return undefined;
    }
    return combineFn(v1, v2);
};
const combineIntegrals = (combineFn, v1, v2)=>{
    if (v1 === undefined || v2 === undefined) {
        return undefined;
    }
    return combineFn(v1, v2);
}; //# sourceMappingURL=Common.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/Mixed.js








class Mixed_MixedShape {
    constructor(args){
        this.continuous = args.continuous;
        this.discrete = args.discrete;
        this._integralSumCache = args.integralSumCache;
        this._integralCache = args.integralCache;
    }
    get integralCache() {
        return this._integralCache;
    }
    get integralSumCache() {
        return this._integralSumCache;
    }
    withAdjustedIntegralSum(integralSumCache) {
        return new Mixed_MixedShape({
            continuous: this.continuous,
            discrete: this.discrete,
            integralSumCache,
            integralCache: this.integralCache
        });
    }
    minX() {
        return Math.min(this.continuous.minX(), this.discrete.minX());
    }
    maxX() {
        return Math.max(this.continuous.maxX(), this.discrete.maxX());
    }
    toContinuous() {
        return this.continuous;
    }
    toDiscrete() {
        return this.discrete;
    }
    toMixed() {
        return this;
    }
    truncate(leftCutoff, rightCutoff) {
        return new Mixed_MixedShape({
            continuous: this.continuous.truncate(leftCutoff, rightCutoff),
            discrete: this.discrete.truncate(leftCutoff, rightCutoff)
        });
    }
    normalize() {
        const continuousIntegralSum = this.continuous.integralSum();
        const discreteIntegralSum = this.discrete.integralSum();
        const totalIntegralSum = continuousIntegralSum + discreteIntegralSum;
        const newContinuousSum = continuousIntegralSum / totalIntegralSum;
        const newDiscreteSum = discreteIntegralSum / totalIntegralSum;
        const normalizedContinuous = this.continuous.scaleBy(newContinuousSum / continuousIntegralSum).withAdjustedIntegralSum(newContinuousSum);
        const normalizedDiscrete = this.discrete.scaleBy(newDiscreteSum / discreteIntegralSum).withAdjustedIntegralSum(newDiscreteSum);
        return new Mixed_MixedShape({
            continuous: normalizedContinuous,
            discrete: normalizedDiscrete,
            integralSumCache: 1
        });
    }
    xToY(x) {
        const { continuous , discrete  } = this.normalize();
        const c = continuous.xToY(x);
        const d = discrete.xToY(x);
        return add(c, d);
    }
    toDiscreteProbabilityMassFraction() {
        const discreteIntegralSum = this.discrete.integralSum();
        const continuousIntegralSum = this.continuous.integralSum();
        const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
        return discreteIntegralSum / totalIntegralSum;
    }
    downsample(count) {
        const discreteIntegralSum = this.discrete.integralSum();
        const continuousIntegralSum = this.continuous.integralSum();
        const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
        const downsampledDiscrete = this.discrete.downsample(Math.floor(count * discreteIntegralSum / totalIntegralSum));
        const downsampledContinuous = this.continuous.downsample(Math.floor(count * continuousIntegralSum / totalIntegralSum));
        return new Mixed_MixedShape({
            continuous: downsampledContinuous,
            discrete: downsampledDiscrete,
            integralSumCache: this.integralSumCache,
            integralCache: this.integralCache
        });
    }
    integral() {
        if (!this._integralCache) {
            const continuousIntegral = this.continuous.integral();
            const discreteIntegral = stepwiseToLinear(this.discrete.integral());
            this._integralCache = new ContinuousShape({
                xyShape: PointwiseCombination.addCombine(XtoY.continuousInterpolator("Linear", "UseOutermostPoints"), continuousIntegral.xyShape, discreteIntegral.xyShape)
            });
        }
        return this._integralCache;
    }
    integralSum() {
        var _a;
        return (_a = this._integralSumCache) !== null && _a !== void 0 ? _a : this._integralSumCache = this.integral().lastY();
    }
    integralXtoY(f) {
        return XtoY.linear(this.integral().xyShape, f);
    }
    integralYtoX(f) {
        return YtoX.linear(this.integral().xyShape, f);
    }
    mapY(fn, integralSumCacheFn, integralCacheFn) {
        const discrete = this.discrete.mapY(fn, integralSumCacheFn, integralCacheFn);
        const continuous = this.continuous.mapY(fn, integralSumCacheFn, integralCacheFn);
        return new Mixed_MixedShape({
            discrete,
            continuous,
            integralSumCache: this.integralSumCache === undefined ? undefined : integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(this.integralSumCache),
            integralCache: this.integralCache === undefined ? undefined : integralCacheFn === null || integralCacheFn === void 0 ? void 0 : integralCacheFn(this.integralCache)
        });
    }
    mapYResult(fn, integralSumCacheFn, integralCacheFn) {
        const discreteResult = this.discrete.mapYResult(fn, integralSumCacheFn, integralCacheFn);
        const continuousResult = this.continuous.mapYResult(fn, integralSumCacheFn, integralCacheFn);
        if (!continuousResult.ok) {
            return continuousResult;
        }
        if (!discreteResult.ok) {
            return discreteResult;
        }
        const continuous = continuousResult.value;
        const discrete = discreteResult.value;
        return result_Ok(new Mixed_MixedShape({
            discrete,
            continuous,
            integralSumCache: this.integralSumCache === undefined ? undefined : integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(this.integralSumCache),
            integralCache: this.integralCache === undefined ? undefined : integralCacheFn === null || integralCacheFn === void 0 ? void 0 : integralCacheFn(this.integralCache)
        }));
    }
    mean() {
        const discreteMean = this.discrete.mean();
        const continuousMean = this.continuous.mean();
        return (discreteMean + continuousMean) / this.integralSum();
    }
    variance() {
        const discreteIntegralSum = this.discrete.integralSum();
        const continuousIntegralSum = this.continuous.integralSum();
        const totalIntegralSum = discreteIntegralSum + continuousIntegralSum;
        const getMeanOfSquares = ({ discrete , continuous  })=>{
            const discreteMean = discrete.shapeMap(T.square).mean();
            const continuousMean = continuous.getMeanOfSquares();
            return (discreteMean * discreteIntegralSum + continuousMean * continuousIntegralSum) / totalIntegralSum;
        };
        switch(discreteIntegralSum / totalIntegralSum){
            case 1:
                return this.discrete.variance();
            case 0:
                return this.continuous.variance();
            default:
                return Analysis.getVarianceDangerously(this, (t)=>t.mean(), (t)=>getMeanOfSquares(t));
        }
    }
}
const combineAlgebraically = (op, t1, t2)=>{
    const ccConvResult = Continuous_combineAlgebraically(op, t1.continuous, t2.continuous);
    const dcConvResult = combineAlgebraicallyWithDiscrete(op, t2.continuous, t1.discrete, "First");
    const cdConvResult = combineAlgebraicallyWithDiscrete(op, t1.continuous, t2.discrete, "Second");
    const continuousConvResult = Continuous_sum([
        ccConvResult,
        dcConvResult,
        cdConvResult
    ]);
    const discreteConvResult = Discrete_combineAlgebraically(op, t1.discrete, t2.discrete);
    const combinedIntegralSum = combineIntegralSums((a, b)=>a * b, t1.integralSumCache, t2.integralSumCache);
    return new Mixed_MixedShape({
        discrete: discreteConvResult,
        continuous: continuousConvResult,
        integralSumCache: combinedIntegralSum,
        integralCache: undefined
    });
};
const combinePointwise = (t1, t2, fn, integralSumCachesFn = ()=>undefined, integralCachesFn = ()=>undefined)=>{
    const isDefined = (argument)=>{
        return argument !== undefined;
    };
    const reducedDiscrete = Discrete_reduce([
        t1,
        t2
    ].map((t)=>t.toDiscrete()).filter(isDefined), fn, integralSumCachesFn);
    const reducedContinuous = reduce([
        t1,
        t2
    ].map((t)=>t.toContinuous()).filter(isDefined), fn, integralSumCachesFn);
    const combinedIntegralSum = combineIntegralSums(integralSumCachesFn, t1.integralSumCache, t2.integralSumCache);
    const combinedIntegral = combineIntegrals(integralCachesFn, t1.integralCache, t2.integralCache);
    return fmap(merge(reducedContinuous, reducedDiscrete), ([continuous, discrete])=>new Mixed_MixedShape({
            continuous,
            discrete,
            integralSumCache: combinedIntegralSum,
            integralCache: combinedIntegral
        }));
};
const buildMixedShape = ({ continuous , discrete  })=>{
    continuous !== null && continuous !== void 0 ? continuous : continuous = new ContinuousShape({
        integralSumCache: 0,
        xyShape: {
            xs: [],
            ys: []
        }
    });
    discrete !== null && discrete !== void 0 ? discrete : discrete = new DiscreteShape({
        integralSumCache: 0,
        xyShape: {
            xs: [],
            ys: []
        }
    });
    const cLength = continuous.xyShape.xs.length;
    const dLength = discrete.xyShape.xs.length;
    if (cLength < 2 && dLength == 0) {
        return undefined;
    } else if (cLength < 2) {
        return discrete;
    } else if (dLength == 0) {
        return continuous;
    } else {
        const mixedDist = new Mixed_MixedShape({
            continuous,
            discrete
        });
        return mixedDist;
    }
}; //# sourceMappingURL=Mixed.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/PointSet.js





const convolutionOperationToFn = (op)=>{
    return ({
        Add: (x, y)=>x + y,
        Multiply: (x, y)=>x * y,
        Subtract: (x, y)=>x - y
    })[op];
};
const PointSet_combineAlgebraically = (op, t1, t2)=>{
    if (t1 instanceof ContinuousShape && t2 instanceof ContinuousShape) {
        return Continuous_combineAlgebraically(op, t1, t2);
    } else if (t1 instanceof DiscreteShape && t2 instanceof ContinuousShape) {
        return combineAlgebraicallyWithDiscrete(op, t2, t1, "First");
    } else if (t1 instanceof ContinuousShape && t2 instanceof DiscreteShape) {
        return combineAlgebraicallyWithDiscrete(op, t1, t2, "Second");
    } else if (t1 instanceof DiscreteShape && t2 instanceof DiscreteShape) {
        return Discrete_combineAlgebraically(op, t1, t2);
    } else {
        return combineAlgebraically(op, t1.toMixed(), t2.toMixed());
    }
};
const PointSet_combinePointwise = (t1, t2, fn, integralSumCachesFn = ()=>undefined, integralCachesFn = ()=>undefined)=>{
    if (t1 instanceof ContinuousShape && t2 instanceof ContinuousShape) {
        return Continuous_combinePointwise(t1, t2, fn, undefined, integralSumCachesFn);
    } else if (t1 instanceof DiscreteShape && t2 instanceof DiscreteShape) {
        return Discrete_combinePointwise(t1, t2, fn, integralSumCachesFn);
    } else {
        return combinePointwise(t1.toMixed(), t2.toMixed(), fn, integralSumCachesFn, integralCachesFn);
    }
};
const isContinuous = (d)=>d instanceof ContinuousShape;
const isDiscrete = (d)=>d instanceof DiscreteShape; //# sourceMappingURL=PointSet.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/AlgebraicShapeCombination.js



const toDiscretePointMassesFromTriangulars = (s, { inverse  } = {
    inverse: false
})=>{
    let n = T.length(s);
    let { xs , ys  } = s;
    xs.unshift(xs[0]);
    ys.unshift(ys[0]);
    xs.push(xs[n - 1]);
    ys.push(ys[n - 1]);
    n = xs.length;
    const xsSq = new Array(n);
    let xsProdN1 = new Array(n - 1);
    let xsProdN2 = new Array(n - 2);
    for(let i = 0; i <= n - 1; i++){
        xsSq[i] = xs[i] * xs[i];
    }
    for(let i = 0; i <= n - 2; i++){
        xsProdN1[i] = xs[i] * xs[i + 1];
    }
    for(let i = 0; i <= n - 3; i++){
        xsProdN2[i] = xs[i] * xs[i + 2];
    }
    const masses = new Array(n - 2);
    const means = new Array(n - 2);
    const variances = new Array(n - 2);
    if (inverse) {
        for(let i = 1; i <= n - 2; i++){
            masses[i - 1] = (xs[i + 1] - xs[i - 1]) * ys[i] / 2;
            const a = xs[i - 1];
            const c = xs[i];
            const b = xs[i + 1];
            const inverseMean = 2 * (a * Math.log(a / c) / (a - c) + b * Math.log(c / b) / (b - c)) / (a - b);
            let inverseVar = 2 * (Math.log(c / a) / (a - c) + b * Math.log(b / c) / (b - c)) / (a - b) - Math.pow(inverseMean, 2);
            means[i - 1] = inverseMean;
            variances[i - 1] = inverseVar;
        }
        return {
            n: n - 2,
            masses,
            means,
            variances
        };
    } else {
        for(let i = 1; i <= n - 2; i++){
            masses[i - 1] = (xs[i + 1] - xs[i - 1]) * ys[i] / 2;
            means[i - 1] = (xs[i - 1] + xs[i] + xs[i + 1]) / 3;
            variances[i - 1] = (xsSq[i - 1] + xsSq[i] + xsSq[i + 1] - xsProdN1[i - 1] - xsProdN1[i] - xsProdN2[i - 1]) / 18;
        }
        return {
            n: n - 2,
            masses,
            means,
            variances
        };
    }
};
let combineShapesContinuousContinuous = (op, s1, s2)=>{
    const t1m = toDiscretePointMassesFromTriangulars(s1);
    const t2m = toDiscretePointMassesFromTriangulars(s2, {
        inverse: false
    });
    const combineMeansFn = {
        Add: (m1, m2)=>m1 + m2,
        Subtract: (m1, m2)=>m1 - m2,
        Multiply: (m1, m2)=>m1 * m2
    }[op];
    const combineVariancesFn = {
        Add: (v1, v2)=>v1 + v2,
        Subtract: (v1, v2)=>v1 + v2,
        Multiply: (v1, v2, m1, m2)=>v1 * v2 + v1 * Math.pow(m2, 2) + v2 * Math.pow(m1, 2)
    }[op];
    let outputMinX = Infinity;
    let outputMaxX = -Infinity;
    let masses = new Array(t1m.n * t2m.n);
    let means = new Array(t1m.n * t2m.n);
    let variances = new Array(t1m.n * t2m.n);
    for(let i = 0; i < t1m.n; i++){
        for(let j = 0; j < t2m.n; j++){
            const k = i * t2m.n + j;
            masses[k] = t1m.masses[i] * t2m.masses[j];
            const mean = combineMeansFn(t1m.means[i], t2m.means[j]);
            const variance = combineVariancesFn(t1m.variances[i], t2m.variances[j], t1m.means[i], t2m.means[j]);
            means[k] = mean;
            variances[k] = variance;
            const minX = mean - 2 * Math.sqrt(variance) * 1.644854;
            const maxX = mean + 2 * Math.sqrt(variance) * 1.644854;
            if (minX < outputMinX) {
                outputMinX = minX;
            }
            if (maxX > outputMaxX) {
                outputMaxX = maxX;
            }
        }
    }
    const nOut = 300;
    const outputXs = range(outputMinX, outputMaxX, nOut);
    const outputYs = new Array(nOut).fill(0);
    for(let j = 0; j < masses.length; j++){
        if (variances[j] > 0 && masses[j] > 0) {
            for(let i = 0; i < outputXs.length; i++){
                const dx = outputXs[i] - means[j];
                const contribution = masses[j] * Math.exp(-Math.pow(dx, 2) / (2 * variances[j])) / Math.sqrt(2 * 3.14159276 * variances[j]);
                outputYs[i] = outputYs[i] + contribution;
            }
        }
    }
    return {
        xs: outputXs,
        ys: outputYs
    };
};
const toDiscretePointMassesFromDiscrete = (s)=>{
    const { xs , ys  } = s;
    const n = xs.length;
    const masses = [
        ...ys
    ];
    const means = [
        ...xs
    ];
    const variances = new Array(n).fill(0);
    return {
        n,
        masses,
        means,
        variances
    };
};
const combineShapesContinuousDiscrete = (op, continuousShape, discreteShape, opts)=>{
    const t1n = T.length(continuousShape);
    const t2n = T.length(discreteShape);
    const opFunc = convolutionOperationToFn(op);
    const fn = opts.discretePosition === "First" ? (a, b)=>opFunc(b, a) : opFunc;
    const outXYShapes = new Array(t2n);
    switch(op){
        case "Add":
        case "Subtract":
            for(let j = 0; j <= t2n - 1; j++){
                const dxyShape = new Array(t1n);
                for(let i = 0; i <= t1n - 1; i++){
                    const index = opts.discretePosition === "First" && op === "Subtract" ? t1n - 1 - i : i;
                    dxyShape[index] = [
                        fn(continuousShape.xs[i], discreteShape.xs[j]),
                        continuousShape.ys[i] * discreteShape.ys[j]
                    ];
                }
                outXYShapes[j] = dxyShape;
            }
            break;
        case "Multiply":
            for(let j = 0; j <= t2n - 1; j++){
                let dxyShape = new Array(t1n);
                for(let i = 0; i <= t1n - 1; i++){
                    const index = discreteShape.xs[j] > 0 ? i : t1n - 1 - i;
                    dxyShape[index] = [
                        fn(continuousShape.xs[i], discreteShape.xs[j]),
                        continuousShape.ys[i] * discreteShape.ys[j] / Math.abs(discreteShape.xs[j])
                    ];
                }
                outXYShapes[j] = dxyShape;
            }
            break;
        default:
            throw new Error(`Unknown operation ${op}`);
    }
    return outXYShapes.map(T.fromZippedArray).reduce((acc, x)=>PointwiseCombination.addCombine(XtoY.continuousInterpolator("Linear", "UseZero"), acc, x), T.empty);
};
const isOrdered = (a)=>{
    return E_A_Floats.isSorted(a.xs);
}; //# sourceMappingURL=AlgebraicShapeCombination.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/Continuous.js








class ContinuousShape {
    constructor(args){
        var _a;
        this.xyShape = args.xyShape;
        this.interpolation = (_a = args.interpolation) !== null && _a !== void 0 ? _a : "Linear";
        this._integralSumCache = args.integralSumCache;
        this._integralCache = args.integralCache;
    }
    get integralCache() {
        return this._integralCache;
    }
    get integralSumCache() {
        return this._integralSumCache;
    }
    withAdjustedIntegralSum(integralSumCache) {
        return new ContinuousShape({
            xyShape: this.xyShape,
            interpolation: this.interpolation,
            integralSumCache,
            integralCache: this.integralCache
        });
    }
    lastY() {
        return T.lastY(this.xyShape);
    }
    minX() {
        return T.minX(this.xyShape);
    }
    maxX() {
        return T.maxX(this.xyShape);
    }
    mapY(fn, integralSumCacheFn, integralCacheFn) {
        return new ContinuousShape({
            xyShape: T.mapY(this.xyShape, fn),
            interpolation: this.interpolation,
            integralSumCache: this.integralSumCache === undefined ? undefined : integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(this.integralSumCache),
            integralCache: this.integralCache === undefined ? undefined : integralCacheFn === null || integralCacheFn === void 0 ? void 0 : integralCacheFn(this.integralCache)
        });
    }
    mapYResult(fn, integralSumCacheFn, integralCacheFn) {
        const result = T.mapYResult(this.xyShape, fn);
        if (!result.ok) {
            return result;
        }
        return result_Ok(new ContinuousShape({
            xyShape: result.value,
            interpolation: this.interpolation,
            integralSumCache: this.integralSumCache === undefined ? undefined : integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(this.integralSumCache),
            integralCache: this.integralCache === undefined ? undefined : integralCacheFn === null || integralCacheFn === void 0 ? void 0 : integralCacheFn(this.integralCache)
        }));
    }
    toDiscreteProbabilityMassFraction() {
        return 0;
    }
    xToY(f) {
        var _a;
        switch(this.interpolation){
            case "Stepwise":
                return makeContinuous((_a = XtoY.stepwiseIncremental(this.xyShape, f)) !== null && _a !== void 0 ? _a : 0);
            case "Linear":
                return makeContinuous(XtoY.linear(this.xyShape, f));
        }
    }
    truncate(leftCutoff, rightCutoff) {
        const lc = leftCutoff !== null && leftCutoff !== void 0 ? leftCutoff : -Infinity;
        const rc = rightCutoff !== null && rightCutoff !== void 0 ? rightCutoff : Infinity;
        const truncatedZippedPairs = Zipped.filterByX(T.zip(this.xyShape), (x)=>x >= lc && x <= rc);
        const leftNewPoint = leftCutoff === undefined ? [] : [
            [
                lc - epsilon_float,
                0
            ]
        ];
        const rightNewPoint = rightCutoff === undefined ? [] : [
            [
                rc + epsilon_float,
                0
            ]
        ];
        const truncatedZippedPairsWithNewPoints = [
            ...leftNewPoint,
            ...truncatedZippedPairs,
            ...rightNewPoint
        ];
        const truncatedShape = T.fromZippedArray(truncatedZippedPairsWithNewPoints);
        return new ContinuousShape({
            xyShape: truncatedShape
        });
    }
    integral() {
        if (!this._integralCache) {
            if (T.isEmpty(this.xyShape)) {
                this._integralCache = emptyIntegral();
            } else {
                this._integralCache = new ContinuousShape({
                    xyShape: Range.integrateWithTriangles(this.xyShape)
                });
            }
        }
        return this._integralCache;
    }
    integralSum() {
        var _a;
        return (_a = this._integralSumCache) !== null && _a !== void 0 ? _a : this._integralSumCache = this.integral().lastY();
    }
    integralXtoY(f) {
        return XtoY.linear(this.integral().xyShape, f);
    }
    integralYtoX(f) {
        return YtoX.linear(this.integral().xyShape, f);
    }
    shapeMap(fn) {
        return new ContinuousShape({
            xyShape: fn(this.xyShape),
            interpolation: this.interpolation,
            integralSumCache: this.integralSumCache,
            integralCache: this.integralCache
        });
    }
    downsample(length) {
        return this.shapeMap((shape)=>XsConversion.proportionByProbabilityMass(shape, length, this.integral().xyShape));
    }
    toContinuous() {
        return this;
    }
    toDiscrete() {
        return undefined;
    }
    toMixed() {
        return new Mixed_MixedShape({
            continuous: this,
            discrete: Discrete_empty(),
            integralSumCache: this.integralSumCache,
            integralCache: this.integralCache
        });
    }
    scaleBy(scale) {
        return this.mapY((r)=>r * scale, (sum)=>sum * scale, (cache)=>cache.scaleBy(scale));
    }
    normalize() {
        return this.scaleBy(1 / this.integralSum()).withAdjustedIntegralSum(1);
    }
    mean() {
        const indefiniteIntegralStepwise = (p, h1)=>h1 * Math.pow(p, 2) / 2;
        const indefiniteIntegralLinear = (p, a, b)=>a * Math.pow(p, 2) / 2 + b * Math.pow(p, 3) / 3;
        return this.integrate(indefiniteIntegralStepwise, indefiniteIntegralLinear);
    }
    integrate(indefiniteIntegralStepwise = (p, h1)=>h1 * p, indefiniteIntegralLinear = (p, a, b)=>a * p + b * Math.pow(p, 2) / 2) {
        const xs = this.xyShape.xs;
        const ys = this.xyShape.ys;
        let areaUnderIntegral = 0;
        for(let i = 1; i < xs.length; i++){
            if (this.interpolation === "Stepwise") {
                areaUnderIntegral += indefiniteIntegralStepwise(xs[i], ys[i - 1]) - indefiniteIntegralStepwise(xs[i - 1], ys[i - 1]);
            } else if (this.interpolation === "Linear") {
                const x1 = xs[i - 1];
                const x2 = xs[i];
                if (x1 !== x2) {
                    const h1 = ys[i - 1];
                    const h2 = ys[i];
                    const b = (h1 - h2) / (x1 - x2);
                    const a = h1 - b * x1;
                    areaUnderIntegral += indefiniteIntegralLinear(x2, a, b) - indefiniteIntegralLinear(x1, a, b);
                }
            } else {
                throw new Error(`Unknown interpolation strategy ${this.interpolation}`);
            }
        }
        return areaUnderIntegral;
    }
    getMeanOfSquares() {
        const indefiniteIntegralLinear = (p, a, b)=>a * Math.pow(p, 3) / 3 + b * Math.pow(p, 4) / 4;
        const indefiniteIntegralStepwise = (p, h1)=>h1 * Math.pow(p, 3) / 3;
        return this.integrate(indefiniteIntegralStepwise, indefiniteIntegralLinear);
    }
    variance() {
        return Analysis.getVarianceDangerously(this, (t)=>t.mean(), (t)=>t.getMeanOfSquares());
    }
    downsampleEquallyOverX(length) {
        return this.shapeMap((shape)=>XsConversion.proportionEquallyOverX(shape, length));
    }
}
const Continuous_Analysis = {};
const emptyIntegral = ()=>new ContinuousShape({
        xyShape: {
            xs: [
                -Infinity
            ],
            ys: [
                0.0
            ]
        },
        interpolation: "Linear",
        integralSumCache: 0,
        integralCache: undefined
    });
const empty = ()=>new ContinuousShape({
        xyShape: T.empty,
        interpolation: "Linear",
        integralSumCache: 0,
        integralCache: emptyIntegral()
    });
const stepwiseToLinear = (t)=>{
    return new ContinuousShape({
        xyShape: Range.stepwiseToLinear(t.xyShape),
        interpolation: "Linear",
        integralSumCache: t.integralSumCache,
        integralCache: t.integralCache
    });
};
const Continuous_combinePointwise = (t1, t2, fn, distributionType = "PDF", integralSumCachesFn = ()=>undefined)=>{
    const combiner = PointwiseCombination.combine;
    const combinedIntegralSum = combineIntegralSums(integralSumCachesFn, t1.integralSumCache, t2.integralSumCache);
    if (t1.interpolation === "Stepwise" && t2.interpolation === "Linear") {
        t1 = stepwiseToLinear(t1);
    } else if (t1.interpolation === "Linear" && t2.interpolation === "Stepwise") {
        t2 = stepwiseToLinear(t2);
    }
    const extrapolation = {
        PDF: "UseZero",
        CDF: "UseOutermostPoints"
    }[distributionType];
    const interpolator = XtoY.continuousInterpolator(t1.interpolation, extrapolation);
    return fmap(combiner(interpolator, fn, t1.xyShape, t2.xyShape), (x)=>new ContinuousShape({
            xyShape: x,
            interpolation: "Linear",
            integralSumCache: combinedIntegralSum
        }));
};
const getShape = (t)=>t.xyShape;
const Continuous_sum = (continuousShapes)=>{
    return continuousShapes.reduce((x, y)=>{
        const result = Continuous_combinePointwise(x, y, (a, b)=>result_Ok(a + b));
        if (!result.ok) {
            throw new Error("Addition should never fail");
        }
        return result.value;
    }, empty());
};
const reduce = (continuousShapes, fn, integralSumCachesFn = ()=>undefined)=>{
    let acc = empty();
    for (const shape of continuousShapes){
        const result = Continuous_combinePointwise(acc, shape, fn, undefined, integralSumCachesFn);
        if (!result.ok) {
            return result;
        }
        acc = result.value;
    }
    return result_Ok(acc);
};
const combineAlgebraicallyWithDiscrete = (op, t1, t2, discretePosition)=>{
    let t1s = t1.xyShape;
    let t2s = t2.xyShape;
    if (T.isEmpty(t1s) || T.isEmpty(t2s)) {
        return empty();
    } else {
        const continuousAsLinear = {
            Linear: t1,
            Stepwise: stepwiseToLinear(t1)
        }[t1.interpolation];
        const combinedShape = combineShapesContinuousDiscrete(op, continuousAsLinear.xyShape, t2s, {
            discretePosition
        });
        const combinedIntegralSum = op === "Multiply" ? combineIntegralSums((a, b)=>a * b, t1.integralSumCache, t2.integralSumCache) : undefined;
        return new ContinuousShape({
            xyShape: combinedShape,
            interpolation: t1.interpolation,
            integralSumCache: combinedIntegralSum
        });
    }
};
const Continuous_combineAlgebraically = (op, t1, t2)=>{
    const s1 = t1.xyShape;
    const s2 = t2.xyShape;
    const t1n = T.length(s1);
    const t2n = T.length(s2);
    if (t1n === 0 || t2n === 0) {
        return empty();
    } else {
        const combinedShape = combineShapesContinuousContinuous(op, s1, s2);
        const combinedIntegralSum = combineIntegralSums((a, b)=>a * b, t1.integralSumCache, t2.integralSumCache);
        return new ContinuousShape({
            xyShape: combinedShape,
            interpolation: "Linear",
            integralSumCache: combinedIntegralSum
        });
    }
}; //# sourceMappingURL=Continuous.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/math.js
function binsearchFirstGreater(arr, value) {
    let s = -1;
    let l = arr.length + 1;
    for(let h; (h = l >> 1) > 0; l -= h){
        s += h * +(arr[s + h] <= value);
    }
    return s + 1;
}
function random_sample(dist, args) {
    const { probs , size  } = args;
    const sample = Array(size);
    let accum = 0;
    const probPrefixSums = Array(probs.length);
    for(let index = 0; index < probs.length; index++){
        probPrefixSums[index] = accum += probs[index];
    }
    const sum = probPrefixSums[probPrefixSums.length - 1];
    for(let index = 0; index < size; index++){
        let selection = binsearchFirstGreater(probPrefixSums, Math.random() * sum);
        sample[index] = dist[selection];
    }
    return sample;
}
function factorial(n) {
    let fct = 1;
    while(n > 0){
        fct *= n--;
    }
    return fct;
} //# sourceMappingURL=math.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/Discrete.js










class DiscreteShape {
    constructor(args){
        this.xyShape = args.xyShape;
        this._integralSumCache = args.integralSumCache;
        this._integralCache = args.integralCache;
    }
    get integralCache() {
        return this._integralCache;
    }
    get integralSumCache() {
        return this._integralSumCache;
    }
    withAdjustedIntegralSum(integralSumCache) {
        return new DiscreteShape({
            xyShape: this.xyShape,
            integralSumCache,
            integralCache: this.integralCache
        });
    }
    shapeMap(fn) {
        return new DiscreteShape({
            xyShape: fn(this.xyShape),
            integralSumCache: this.integralSumCache,
            integralCache: this.integralCache
        });
    }
    integral() {
        if (!this._integralCache) {
            if (T.isEmpty(this.xyShape)) {
                this._integralCache = Discrete_emptyIntegral();
            } else {
                const ts = this.xyShape;
                const firstX = T.minX(ts);
                const prependedZeroPoint = {
                    xs: [
                        firstX - epsilon_float
                    ],
                    ys: [
                        0
                    ]
                };
                const integralShape = T.accumulateYs(T.concat(prependedZeroPoint, ts), (a, b)=>a + b);
                this._integralCache = stepwiseToLinear(new ContinuousShape({
                    xyShape: integralShape,
                    interpolation: "Stepwise"
                }));
            }
        }
        return this._integralCache;
    }
    integralSum() {
        var _a;
        return (_a = this._integralSumCache) !== null && _a !== void 0 ? _a : this._integralSumCache = this.integral().lastY();
    }
    integralXtoY(f) {
        return XtoY.linear(this.integral().xyShape, f);
    }
    integralYtoX(f) {
        return YtoX.linear(this.integral().xyShape, f);
    }
    minX() {
        return T.minX(this.xyShape);
    }
    maxX() {
        return T.maxX(this.xyShape);
    }
    toDiscreteProbabilityMassFraction() {
        return 1;
    }
    mapY(fn, integralSumCacheFn, integralCacheFn) {
        return new DiscreteShape({
            xyShape: T.mapY(this.xyShape, fn),
            integralSumCache: this.integralSumCache === undefined ? undefined : integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(this.integralSumCache),
            integralCache: this.integralCache === undefined ? undefined : integralCacheFn === null || integralCacheFn === void 0 ? void 0 : integralCacheFn(this.integralCache)
        });
    }
    mapYResult(fn, integralSumCacheFn, integralCacheFn) {
        const result = T.mapYResult(this.xyShape, fn);
        if (!result.ok) {
            return result;
        }
        return result_Ok(new DiscreteShape({
            xyShape: result.value,
            integralSumCache: this.integralSumCache === undefined ? undefined : integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(this.integralSumCache),
            integralCache: this.integralCache === undefined ? undefined : integralCacheFn === null || integralCacheFn === void 0 ? void 0 : integralCacheFn(this.integralCache)
        }));
    }
    toContinuous() {
        return undefined;
    }
    toDiscrete() {
        return this;
    }
    toMixed() {
        return new Mixed_MixedShape({
            continuous: empty(),
            discrete: this,
            integralSumCache: this.integralSumCache,
            integralCache: this.integralCache
        });
    }
    scaleBy(scale) {
        return this.mapY((r)=>r * scale, (sum)=>sum * scale, (cache)=>cache.scaleBy(scale));
    }
    normalize() {
        return this.scaleBy(1 / this.integralSum()).withAdjustedIntegralSum(1);
    }
    downsample(i) {
        const currentLength = T.length(this.xyShape);
        if (i < currentLength && i >= 1 && currentLength > 1) {
            const sortedByY = Zipped.sortByY(T.zip(this.xyShape));
            const picked = [
                ...sortedByY
            ].reverse().slice(0, i);
            return new DiscreteShape({
                xyShape: T.fromZippedArray(Zipped.sortByX(picked))
            });
        } else {
            return this;
        }
    }
    truncate(leftCutoff, rightCutoff) {
        return new DiscreteShape({
            xyShape: T.fromZippedArray(Zipped.filterByX(T.zip(this.xyShape), (x)=>x >= (leftCutoff !== null && leftCutoff !== void 0 ? leftCutoff : -Infinity) && x <= (rightCutoff !== null && rightCutoff !== void 0 ? rightCutoff : Infinity)))
        });
    }
    xToY(f) {
        var _a;
        return makeDiscrete((_a = XtoY.stepwiseIfAtX(this.xyShape, f)) !== null && _a !== void 0 ? _a : 0);
    }
    mean() {
        const s = this.xyShape;
        return s.xs.reduce((acc, x, i)=>acc + x * s.ys[i], 0);
    }
    variance() {
        return Analysis.getVarianceDangerously(this, (t)=>t.mean(), (t)=>t.shapeMap(T.square).mean());
    }
}
const Discrete_emptyIntegral = ()=>new ContinuousShape({
        xyShape: {
            xs: [
                -Infinity
            ],
            ys: [
                0
            ]
        },
        interpolation: "Stepwise",
        integralSumCache: 0,
        integralCache: undefined
    });
const Discrete_empty = ()=>new DiscreteShape({
        xyShape: T.empty,
        integralSumCache: 0,
        integralCache: Discrete_emptyIntegral()
    });
const isFloat = (t)=>{
    if (t.xyShape.ys.length === 1 && t.xyShape.ys[0] === 1) {
        return true;
    }
    return false;
};
const Discrete_getShape = (t)=>t.xyShape;
const Discrete_combinePointwise = (t1, t2, fn, integralSumCachesFn = ()=>undefined)=>{
    const combiner = PointwiseCombination.combine;
    return fmap(combiner(XtoY.discreteInterpolator, fn, t1.xyShape, t2.xyShape), (x)=>new DiscreteShape({
            xyShape: x
        }));
};
const Discrete_reduce = (shapes, fn, integralSumCachesFn = ()=>undefined)=>{
    let acc = Discrete_empty();
    for (const shape of shapes){
        const result = Discrete_combinePointwise(acc, shape, fn, integralSumCachesFn);
        if (!result.ok) {
            return result;
        }
        acc = result.value;
    }
    return result_Ok(acc);
};
const Discrete_combineAlgebraically = (op, t1, t2)=>{
    var _a;
    const t1s = t1.xyShape;
    const t2s = t2.xyShape;
    const t1n = T.length(t1s);
    const t2n = T.length(t2s);
    const combinedIntegralSum = combineIntegralSums((s1, s2)=>s1 * s2, t1.integralSumCache, t2.integralSumCache);
    const fn = convolutionOperationToFn(op);
    const xToYMap = new Map();
    for(let i = 0; i <= t1n - 1; i++){
        for(let j = 0; j <= t2n - 1; j++){
            const x = fn(t1s.xs[i], t2s.xs[j]);
            const cv = (_a = xToYMap.get(x)) !== null && _a !== void 0 ? _a : 0;
            const my = t1s.ys[i] * t2s.ys[j];
            xToYMap.set(x, cv + my);
        }
    }
    const rxys = Zipped.sortByX([
        ...xToYMap.entries()
    ]);
    const combinedShape = T.fromZippedArray(rxys);
    return new DiscreteShape({
        xyShape: combinedShape,
        integralSumCache: combinedIntegralSum
    });
};
const sampleN = (t, n)=>{
    const normalized = t.normalize().xyShape;
    return random_sample(normalized.xs, {
        probs: normalized.ys,
        size: n
    });
}; //# sourceMappingURL=Discrete.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/BaseDist.js



class BaseDist {
    isNormalized() {
        return Math.abs(this.integralSum() - 1) < 1e-7;
    }
    stdev() {
        return fmap(this.variance(), Math.sqrt);
    }
    mode() {
        return result_Error(notYetImplemented());
    }
    expectedConvolutionCost() {
        return OpCost.wildcardCost;
    }
} //# sourceMappingURL=BaseDist.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/utility/sparklines.js
const ticks = [
    `▁`,
    `▂`,
    `▃`,
    `▄`,
    `▅`,
    `▆`,
    `▇`,
    `█`
];
const _ticksLength = ticks.length;
const _heightToTickIndex = (maximum, v)=>{
    const suggestedTickIndex = Math.ceil(v / maximum * _ticksLength) - 1;
    return Math.max(suggestedTickIndex, 0);
};
const createSparkline = (relativeHeights, maximum = undefined)=>{
    if (relativeHeights.length === 0) {
        return "";
    } else {
        const usedMaximum = maximum !== null && maximum !== void 0 ? maximum : Math.max(...relativeHeights);
        return relativeHeights.map((v)=>_heightToTickIndex(usedMaximum, v)).map((r)=>ticks[r]).join("");
    }
}; //# sourceMappingURL=sparklines.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/PointSetDist.js








class PointSetDist extends BaseDist {
    constructor(pointSet){
        super();
        this.pointSet = pointSet;
    }
    toString() {
        return "Point Set Distribution";
    }
    max() {
        return this.pointSet.maxX();
    }
    min() {
        return this.pointSet.minX();
    }
    mean() {
        return this.pointSet.mean();
    }
    variance() {
        return result_Ok(this.pointSet.variance());
    }
    downsample(n) {
        return new PointSetDist(this.pointSet.downsample(n));
    }
    samplePointSet(pointSet) {
        const randomItem = Math.random();
        return pointSet.integralYtoX(randomItem);
    }
    sample() {
        return this.samplePointSet(this.pointSet);
    }
    sampleN(n) {
        const items = new Array(n).fill(0);
        for(let i = 0; i <= n - 1; i++){
            items[i] = this.samplePointSet(this.pointSet);
        }
        return items;
    }
    truncate(left, right) {
        if (left === undefined && right === undefined) {
            return result_Ok(this);
        }
        return result_Ok(new PointSetDist(this.pointSet.truncate(left, right).normalize()));
    }
    normalize() {
        return new PointSetDist(this.pointSet.normalize());
    }
    integralSum() {
        return this.pointSet.integralSum();
    }
    pdf(f) {
        const mixedPoint = this.pointSet.xToY(f);
        return result_Ok(mixedPoint.continuous + mixedPoint.discrete);
    }
    inv(f) {
        return this.pointSet.integralYtoX(f);
    }
    cdf(f) {
        return this.pointSet.integralXtoY(f);
    }
    toPointSetDist() {
        return result_Ok(this);
    }
    toSparkline(bucketCount) {
        const continuous = this.pointSet.toContinuous();
        if (!continuous) {
            return result_Error(sparklineError("Cannot find the sparkline of a discrete distribution"));
        }
        const downsampled = continuous.downsampleEquallyOverX(bucketCount);
        return result_Ok(createSparkline(getShape(downsampled).ys));
    }
    mapYResult(fn, integralSumCacheFn, integralCacheFn) {
        return fmap(this.pointSet.mapYResult(fn, integralSumCacheFn, integralCacheFn), (pointSet)=>new PointSetDist(pointSet));
    }
}
const PointSetDist_combineAlgebraically = (op, t1, t2)=>{
    return new PointSetDist(PointSet_combineAlgebraically(op, t1.pointSet, t2.pointSet));
};
const PointSetDist_combinePointwise = (t1, t2, fn, integralSumCachesFn = ()=>undefined, integralCachesFn = ()=>undefined)=>{
    return fmap(PointSet_combinePointwise(t1.pointSet, t2.pointSet, fn, integralSumCachesFn, integralCachesFn), (pointSet)=>new PointSetDist(pointSet));
};
const expectedConvolutionCost = (d)=>{
    if (PointSet.isContinuous(d.pointSet)) {
        return magicNumbers.OpCost.continuousCost;
    } else if (PointSet.isDiscrete(d.pointSet)) {
        return d.pointSet.xyShape.xs.length;
    } else if (d.pointSet instanceof MixedShape) {
        return magicNumbers.OpCost.mixedCost;
    }
    throw new Error(`Unknown PointSet ${d}`);
}; //# sourceMappingURL=PointSetDist.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/SampleSetDist/kde.js
const kde = (samples, outputLength, xWidth, weight)=>{
    samples = samples.filter((v)=>Number.isFinite(v));
    const len = samples.length;
    if (len === 0) return {
        usedWidth: xWidth,
        xs: [],
        ys: []
    };
    const smin = samples[0];
    const srange = samples[len - 1] - smin;
    const wantedWidth = (outputLength - 1) * xWidth / (srange + 2 * xWidth);
    const width = Math.max(1, Math.floor(wantedWidth));
    const stepsInside = outputLength - 1 - 2 * width;
    const dx = srange / stepsInside;
    xWidth = width * dx;
    const min = smin - xWidth;
    const range = srange + 2 * xWidth;
    const ysum = Array(outputLength + 2 * width).fill(0);
    const dxInv = 1 / dx;
    samples.forEach((x)=>{
        const off = x - min;
        const index = Math.floor(off * dxInv);
        const leftWeight = off - index * dx;
        const rightWeight = dx - leftWeight;
        ysum[width + index + 1] += rightWeight;
        ysum[width + index + 2] += leftWeight;
    });
    const normalizer = weight / (xWidth * xWidth);
    const xs = Array(outputLength).fill(0).map((_, i)=>min + i * dx);
    let dy = 0;
    let y = 0;
    const ys = xs.map((_, i)=>{
        const ddy = ysum[i] - 2 * ysum[i + width] + ysum[i + 2 * width];
        dy += ddy;
        y += dy;
        return normalizer * y;
    });
    return {
        usedWidth: xWidth,
        xs,
        ys
    };
}; //# sourceMappingURL=kde.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/SampleSetDist/bandwidth.js


const iqr_percentile = 0.75;
const iqr_percentile_complement = 1 - iqr_percentile;
const nrd0_lo_denominator = 1.34;
const one = 1.0;
const nrd0_coef = 0.9;
const nrd_coef = 1.06;
const nrd_fractionalPower = -0.2;
const iqr = (x)=>E_A_Sorted_percentile(x, iqr_percentile) - E_A_Sorted_percentile(x, iqr_percentile_complement);
const nrd0 = (x)=>{
    const hi = Math.sqrt(variance(x));
    const lo = Math.min(hi, iqr(x) / nrd0_lo_denominator);
    const e = Math.abs(x[1]);
    const loPrime = !isNaN(lo) ? lo : !isNaN(hi) ? hi : !isNaN(e) ? e : one;
    return nrd0_coef * loPrime * Math.pow(x.length, nrd_fractionalPower);
};
const nrd = (x)=>{
    const h = iqr(x) / nrd0_lo_denominator;
    return nrd_coef * Math.min(Math.sqrt(E_A_Floats.variance(x)), h) * Math.pow(x.length, nrd_fractionalPower);
}; //# sourceMappingURL=bandwidth.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/SampleSetDist/splitContinuousAndDiscrete.js
const splitContinuousAndDiscrete = (sortedArray, minDiscreteWeight)=>{
    const continuous = [];
    const discreteCount = [];
    const discreteValue = [];
    if (!Number.isInteger(minDiscreteWeight)) {
        throw new Error("Minimum discrete weight must be an integer");
    }
    if (minDiscreteWeight <= 1) {
        throw new Error("Minimum discrete weight must be at least 2");
    }
    const minDistance = minDiscreteWeight - 1;
    const len = sortedArray.length;
    let i = 0;
    while(i < len - minDistance){
        const value = sortedArray[i];
        if (value !== sortedArray[i + minDistance]) {
            continuous.push(value);
            i++;
        } else {
            const iOrig = i;
            let base = minDistance;
            const isEqualAt = (ind)=>ind < len && sortedArray[ind] === value;
            while(isEqualAt(iOrig + base * 2)){
                base *= 2;
            }
            let lo = iOrig + base;
            i = Math.min(lo + base, len);
            while(i - lo > 1){
                const mid = lo + Math.floor((i - lo) / 2);
                if (sortedArray[mid] === value) {
                    lo = mid;
                } else {
                    i = mid;
                }
            }
            discreteValue.push(value);
            discreteCount.push(i - iOrig);
        }
    }
    continuous.push(...sortedArray.slice(i));
    return {
        continuousPart: continuous,
        discretePart: {
            xs: discreteValue,
            ys: discreteCount
        }
    };
}; //# sourceMappingURL=splitContinuousAndDiscrete.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/SampleSetDist/samplesToPointSetDist.js




const minDiscreteToKeep = (samples)=>Math.max(20, samples.length / 50);
const samplesToPointSetDist = (samples, outputXYPoints, kernelWidth)=>{
    samples = sort(samples);
    const { continuousPart , discretePart  } = splitContinuousAndDiscrete(samples, minDiscreteToKeep(samples));
    const contLength = continuousPart.length;
    let pointWeight = 1 / samples.length;
    let continuousDist = undefined;
    if (contLength <= 5) {
        pointWeight = 1 / (samples.length - contLength);
    } else if (continuousPart[0] === continuousPart[contLength - 1]) {
        discretePart.xs.push(contLength);
        discretePart.ys.push(continuousPart[0]);
    } else {
        const width = kernelWidth !== null && kernelWidth !== void 0 ? kernelWidth : nrd0(continuousPart);
        const { xs , ys  } = kde(continuousPart, outputXYPoints, width, pointWeight);
        continuousDist = {
            xs,
            ys
        };
    }
    discretePart.ys = discretePart.ys.map((count)=>count * pointWeight);
    return {
        continuousDist,
        discreteDist: discretePart
    };
}; //# sourceMappingURL=samplesToPointSetDist.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/SampleSetDist/index.js












class SampleSetDist extends BaseDist {
    constructor(samples){
        super();
        this.samples = samples;
    }
    static make(a) {
        if (a.length > 5) {
            return result_Ok(new SampleSetDist(a));
        } else {
            return result_Error({
                type: "TooFewSamples"
            });
        }
    }
    static fromFn(fn, env) {
        const samples = [];
        for(let i = 0; i < env.sampleCount; i++){
            samples.push(fn(i));
        }
        return SampleSetDist.make(samples);
    }
    toString() {
        return "Sample Set Distribution";
    }
    toSparkline(bucketCount, env) {
        return bind(this.toPointSetDist({
            xyPointLength: bucketCount * 3,
            sampleCount: env.sampleCount
        }), (r)=>r.toSparkline(bucketCount));
    }
    static fromDist(d, env) {
        return SampleSetDist.make(d.sampleN(env.sampleCount));
    }
    integralSum() {
        return 1;
    }
    normalize() {
        return this;
    }
    min() {
        return Math.min(...this.samples);
    }
    max() {
        return Math.max(...this.samples);
    }
    mean() {
        return mean(this.samples);
    }
    truncate(leftCutoff, rightCutoff) {
        let truncated = this.samples;
        if (leftCutoff !== undefined) {
            truncated = truncated.filter((x)=>x >= leftCutoff);
        }
        if (rightCutoff !== undefined) {
            truncated = truncated.filter((x)=>x <= rightCutoff);
        }
        return SampleSetDist.make(truncated);
    }
    sample() {
        const index = Math.floor(Math.random() * this.samples.length);
        return this.samples[index];
    }
    sampleN(n) {
        if (n <= this.samples.length) {
            return this.samples.slice(0, n);
        } else {
            const result = [];
            for(let i = 1; i <= n; i++){
                result.push(this.sample());
            }
            return result;
        }
    }
    cdf(f) {
        const countBelowF = this.samples.reduce((acc, x)=>acc + (x <= f ? 1 : 0), 0);
        return countBelowF / this.samples.length;
    }
    inv(f) {
        const sorted = sort(this.samples);
        return E_A_Sorted_percentile(sorted, f);
    }
    pdf(f, opts) {
        const pointSetDistR = this.toPointSetDist(opts.env);
        if (!pointSetDistR.ok) {
            return pointSetDistR;
        }
        return pointSetDistR.value.pdf(f);
    }
    variance() {
        return result_Ok(variance(this.samples));
    }
    mode() {
        return result_Error(otherError("Not implemented, https://github.com/quantified-uncertainty/squiggle/issues/1392"));
    }
    toPointSetDist(env) {
        const dists = samplesToPointSetDist(this.samples, env.xyPointLength, undefined);
        const result = buildMixedShape({
            continuous: dists.continuousDist ? new ContinuousShape({
                xyShape: dists.continuousDist
            }) : undefined,
            discrete: new DiscreteShape({
                xyShape: dists.discreteDist
            })
        });
        if (!result) {
            return result_Error(tooFewSamplesForConversionToPointSet());
        }
        return result_Ok(new PointSetDist(result));
    }
    samplesMap(fn) {
        return buildSampleSetFromFn(this.samples.length, (i)=>fn(this.samples[i]));
    }
}
const SampleSetDist_Error = {
    pointsetConversionErrorToString (err) {
        if (err === "TooFewSamplesForConversionToPointSet") {
            return "Too Few Samples to convert to point set";
        } else {
            throw new global.Error("Internal error");
        }
    },
    toString (err) {
        switch(err.type){
            case "TooFewSamples":
                return "Too few samples when constructing sample set";
            case "NonNumericInput":
                return `Found a non-number in input: ${err.value}`;
            case "OperationError":
                return err.value.toString();
            default:
                throw new global.Error(`Internal error: unexpected error type ${err.type}`);
        }
    }
};
const buildSampleSetFromFn = (n, fn)=>{
    const samples = [];
    for(let i = 0; i < n; i++){
        const result = fn(i);
        if (!result.ok) {
            return result_Error(distOperationError(result.value));
        }
        samples.push(result.value);
    }
    return SampleSetDist.make(samples);
};
const map2 = ({ fn , t1 , t2  })=>{
    const length = Math.min(t1.samples.length, t2.samples.length);
    return buildSampleSetFromFn(length, (i)=>fn(t1.samples[i], t2.samples[i]));
};
const map3 = ({ fn , t1 , t2 , t3  })=>{
    const length = Math.min(t1.samples.length, t2.samples.length, t3.samples.length);
    return buildSampleSetFromFn(length, (i)=>fn(t1.samples[i], t2.samples[i], t3.samples[i]));
};
const mapN = ({ fn , t1  })=>{
    const length = Math.max(...t1.map((t)=>t.samples.length));
    return buildSampleSetFromFn(length, (i)=>fn(t1.map((t)=>i < t.samples.length ? t.samples[i] : undefined).filter((v)=>v !== undefined)));
};
const mixture = (values, intendedLength)=>{
    const dists = values.map((pair)=>pair[0]);
    const totalWeight = values.reduce((acc, v)=>acc + v[1], 0);
    const discreteSamples = sampleN(new DiscreteShape({
        xyShape: T.fromZippedArray(values.map(([, weight], i)=>[
                i,
                weight / totalWeight
            ]))
    }), intendedLength);
    const samples = discreteSamples.map((distIndexToChoose, index)=>{
        const chosenDist = dists[distIndexToChoose];
        if (chosenDist.samples.length < index) {
            throw new global.Error("Mixture unreachable error");
        }
        return chosenDist.samples[index];
    });
    return SampleSetDist.make(samples);
};
const minOfTwo = (t1, t2)=>{
    return map2({
        fn: (a, b)=>result_Ok(Math.min(a, b)),
        t1,
        t2
    });
};
const maxOfTwo = (t1, t2)=>{
    return map2({
        fn: (a, b)=>result_Ok(Math.max(a, b)),
        t1,
        t2
    });
};
const minOfFloat = (t, f)=>{
    return t.samplesMap((a)=>result_Ok(Math.min(a, f)));
};
const maxOfFloat = (t, f)=>{
    return t.samplesMap((a)=>result_Ok(Math.max(a, f)));
}; //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqDistributionError.js

class SqDistributionError {
    constructor(_value){
        this._value = _value;
    }
    toString() {
        return distErrorToString(this._value);
    }
} //# sourceMappingURL=SqDistributionError.js.map

;// CONCATENATED MODULE: external "lodash/zipWith.js"
const zipWith_js_namespaceObject = require("lodash/zipWith.js");
;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqPointSet.js






var Tag;
(function(Tag) {
    Tag["Mixed"] = "Mixed";
    Tag["Discrete"] = "Discrete";
    Tag["Continuous"] = "Continuous";
})(Tag || (Tag = {}));
const shapePoints = (x)=>{
    let xs = x.xyShape.xs;
    let ys = x.xyShape.ys;
    return zipWith_js_namespaceObject(xs, ys, (x, y)=>({
            x,
            y
        }));
};
const wrapPointSet = (value)=>{
    if (value instanceof ContinuousShape) {
        return new SqContinuousPointSet(value);
    } else if (value instanceof DiscreteShape) {
        return new SqDiscretePointSet(value);
    } else if (value instanceof Mixed_MixedShape) {
        return new SqMixedPointSet(value);
    }
    throw new Error(`Unknown PointSet shape ${value}`);
};
class SqAbstractPointSet {
    constructor(_value){}
}
class SqMixedPointSet {
    constructor(_value){
        this._value = _value;
        this.tag = Tag.Mixed;
    }
    get value() {
        return this._value;
    }
    asShape() {
        const v = this.value;
        return {
            discrete: shapePoints(v.discrete),
            continuous: shapePoints(v.continuous)
        };
    }
    asDistribution() {
        return new SqPointSetDistribution(new PointSetDist(this.value));
    }
}
class SqDiscretePointSet {
    constructor(_value){
        this._value = _value;
        this.tag = Tag.Discrete;
    }
    get value() {
        return this._value;
    }
    asShape() {
        const v = this.value;
        return {
            discrete: shapePoints(v),
            continuous: []
        };
    }
    asDistribution() {
        return new SqPointSetDistribution(new PointSetDist(this.value));
    }
}
class SqContinuousPointSet {
    constructor(_value){
        this._value = _value;
        this.tag = Tag.Continuous;
    }
    get value() {
        return this._value;
    }
    asShape() {
        const v = this.value;
        return {
            discrete: [],
            continuous: shapePoints(v)
        };
    }
    asDistribution() {
        return new SqPointSetDistribution(new PointSetDist(this.value));
    }
} //# sourceMappingURL=SqPointSet.js.map

// EXTERNAL MODULE: ../../node_modules/jstat/dist/jstat.js
var jstat = __webpack_require__(54);
;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/operationError.js
class OperationError {
}
class DivisionByZeroError extends OperationError {
    toString() {
        return "Cannot divide by zero";
    }
}
class ComplexNumberError extends OperationError {
    toString() {
        return "Operation returned complex result";
    }
}
class InfinityError extends (/* unused pure expression or super */ null && (OperationError)) {
    toString() {
        return "Operation returned positive infinity";
    }
}
class NegativeInfinityError extends OperationError {
    toString() {
        return "Operation returned negative infinity";
    }
}
class SampleMapNeedsNtoNFunction extends OperationError {
    toString() {
        return "SampleMap needs a function that converts a number to a number";
    }
}
class PdfInvalidError extends OperationError {
    toString() {
        return "This Pdf is invalid";
    }
}
class OtherOperationError extends OperationError {
    constructor(value){
        super();
        this.value = value;
    }
    toString() {
        return this.value;
    }
} //# sourceMappingURL=operationError.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/operation.js



const Convolution = {
    fromAlgebraicOperation (op) {
        if (op === "Add" || op === "Subtract" || op === "Multiply") {
            return op;
        }
        return undefined;
    },
    canDoAlgebraicOperation (op) {
        return Convolution.fromAlgebraicOperation(op) !== undefined;
    },
    toFn (t) {
        switch(t){
            case "Add":
                return (a, b)=>a + b;
            case "Subtract":
                return (a, b)=>a - b;
            case "Multiply":
                return (a, b)=>a * b;
            default:
                throw new Error("This should never happen");
        }
    }
};
const power = (a, b)=>{
    if (a >= 0) {
        return result_Ok(Math.pow(a, b));
    } else {
        return result_Error(ComplexNumberError);
    }
};
const operation_add = (a, b)=>result_Ok(a + b);
const subtract = (a, b)=>result_Ok(a - b);
const multiply = (a, b)=>result_Ok(a * b);
const divide = (a, b)=>{
    if (b !== 0) {
        return result_Ok(a / b);
    } else {
        return result_Error(DivisionByZeroError);
    }
};
const logarithm = (a, b)=>{
    if (b === 1) {
        return result_Error(DivisionByZeroError);
    } else if (b === 0) {
        return result_Ok(0);
    } else if (a > 0 && b > 0) {
        return result_Ok(Math.log(a) / Math.log(b));
    } else if (a === 0) {
        return result_Error(NegativeInfinityError);
    } else {
        return result_Error(ComplexNumberError);
    }
};
const buildLogarithmWithThreshold = (threshold)=>{
    const fn = (a, b)=>{
        if (a < threshold) {
            return result_Ok(0);
        } else {
            return logarithm(a, b);
        }
    };
    return fn;
};
const Algebraic = {
    toFn (x) {
        if (x === "Add") {
            return operation_add;
        } else if (x === "Subtract") {
            return subtract;
        } else if (x === "Multiply") {
            return multiply;
        } else if (x === "Power") {
            return power;
        } else if (x === "Divide") {
            return divide;
        } else if (x === "Logarithm") {
            return logarithm;
        } else if (x.NAME === "LogarithmWithThreshold") {
            return buildLogarithmWithThreshold(x.VAL);
        } else {
            throw new Error(`Unknown operation ${x}`);
        }
    },
    toString (x) {
        if (x === "Add") {
            return "+";
        } else if (x === "Subtract") {
            return "-";
        } else if (x === "Multiply") {
            return "*";
        } else if (x === "Power") {
            return "**";
        } else if (x === "Divide") {
            return "/";
        } else if (x === "Logarithm") {
            return "log";
        } else if (x.NAME === "LogarithmWithThreshold") {
            return "log";
        } else {
            throw new Error(`Unknown operation ${x}`);
        }
    }
};
const Scale = {
    toFn (x) {
        if (x === "Multiply") {
            return multiply;
        } else if (x === "Divide") {
            return divide;
        } else if (x === "Power") {
            return power;
        } else if (x === "Logarithm") {
            return logarithm;
        } else if (x.NAME === "LogarithmWithThreshold") {
            return buildLogarithmWithThreshold(x.VAL);
        } else {
            throw new Error(`Unknown scale operation ${x}`);
        }
    },
    toIntegralSumCacheFn (x) {
        if (x === "Multiply") {
            return (a, b)=>a * b;
        } else if (x === "Divide") {
            return (a, b)=>a / b;
        } else {
            return undefined;
        }
    },
    toIntegralCacheFn (x) {
        return undefined;
    }
}; //# sourceMappingURL=operation.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/SymbolicDist.js












const square = (n)=>{
    return n * n;
};
class SymbolicDist extends BaseDist {
    toSparkline(bucketCount, env) {
        return bind(this.toPointSetDist({
            xyPointLength: bucketCount * 3,
            sampleCount: env.sampleCount
        }, "Linear"), (r)=>r.toSparkline(bucketCount));
    }
    normalize() {
        return this;
    }
    integralSum() {
        return 1;
    }
    pdf(f) {
        return result_Ok(this.simplePdf(f));
    }
    interpolateXs(opts) {
        const { xSelection , points  } = opts;
        switch(xSelection){
            case "Linear":
                return range(this.min(), this.max(), points);
            case "ByWeight":
                const ys = range(SymbolicDist.minCdfValue, SymbolicDist.maxCdfValue, points);
                return ys.map((y)=>this.inv(y));
            default:
                throw new Error(`Unknown xSelection value ${xSelection}`);
        }
    }
    toPointSetDist(env, xSelection = "ByWeight") {
        const xs = this.interpolateXs({
            xSelection,
            points: env.xyPointLength,
            env
        });
        const ys = xs.map((x)=>this.simplePdf(x));
        const xyShapeR = T.make(xs, ys);
        if (!xyShapeR.ok) {
            return result_Error(xyShapeDistError(xyShapeR.value));
        }
        return result_Ok(new PointSetDist(new ContinuousShape({
            integralSumCache: 1.0,
            xyShape: xyShapeR.value
        })));
    }
    truncate(left, right, opts) {
        if (!opts) {
            throw new Error("env is necessary for truncating a symbolic dist");
        }
        if (left === undefined && right === undefined) {
            return result_Ok(this);
        }
        const pointSetDistR = this.toPointSetDist(opts.env);
        if (!pointSetDistR.ok) {
            return pointSetDistR;
        }
        return pointSetDistR.value.truncate(left, right);
    }
    min() {
        return this.inv(SymbolicDist.minCdfValue);
    }
    max() {
        return this.inv(SymbolicDist.maxCdfValue);
    }
    sampleN(n) {
        const result = new Array(n);
        for(let i = 0; i < n; i++){
            result[i] = this.sample();
        }
        return result;
    }
    expectedConvolutionCost() {
        return OpCost.symbolicCost;
    }
    isFloat() {
        return false;
    }
}
SymbolicDist.minCdfValue = 0.0001;
SymbolicDist.maxCdfValue = 0.9999;

class Normal extends SymbolicDist {
    constructor({ mean , stdev  }){
        super();
        this._mean = mean;
        this._stdev = stdev;
    }
    static make({ mean , stdev  }) {
        if (stdev <= 0) {
            return result_Error("Standard deviation of normal distribution must be larger than 0");
        }
        return result_Ok(new Normal({
            mean,
            stdev
        }));
    }
    toString() {
        return `Normal(${this._mean},${this._stdev})`;
    }
    simplePdf(x) {
        return jstat.normal.pdf(x, this._mean, this._stdev);
    }
    cdf(x) {
        return jstat.normal.cdf(x, this._mean, this._stdev);
    }
    inv(x) {
        return jstat.normal.inv(x, this._mean, this._stdev);
    }
    sample() {
        return jstat.normal.sample(this._mean, this._stdev);
    }
    mean() {
        return jstat.normal.mean(this._mean, this._stdev);
    }
    stdev() {
        return result_Ok(this._stdev);
    }
    variance() {
        return result_Ok(Math.pow(this._stdev, 2));
    }
    static fromCredibleInterval({ low , high , probability  }) {
        if (low >= high) {
            return result_Error("Low value must be less than high value");
        }
        if (probability <= 0 || probability >= 1) {
            return result_Error("Probability must be in (0, 1) interval");
        }
        const normalizedSigmas = jstat.normal.inv(1 - (1 - probability) / 2, 0, 1);
        const mean = (low + high) / 2;
        const stdev = (high - low) / (2 * normalizedSigmas);
        return Normal.make({
            mean,
            stdev
        });
    }
    static add(n1, n2) {
        const mean = n1._mean + n2._mean;
        const stdev = Math.sqrt(Math.pow(n1._stdev, 2) + Math.pow(n2._stdev, 2));
        return new Normal({
            mean,
            stdev
        });
    }
    static subtract(n1, n2) {
        const mean = n1._mean - n2._mean;
        const stdev = Math.sqrt(Math.pow(n1._stdev, 2) + Math.pow(n2._stdev, 2));
        return new Normal({
            mean,
            stdev
        });
    }
    static operate(operation, n1, n2) {
        if (operation === "Add") {
            return Normal.add(n1, n2);
        } else if (operation === "Subtract") {
            return Normal.subtract(n1, n2);
        }
        return undefined;
    }
    static operateFloatFirst(operation, n1, n2) {
        if (operation === "Add") {
            return new Normal({
                mean: n1 + n2._mean,
                stdev: n2._stdev
            });
        } else if (operation === "Subtract") {
            return new Normal({
                mean: n1 - n2._mean,
                stdev: n2._stdev
            });
        } else if (operation === "Multiply") {
            if (n1 === 0) {
                return new PointMass(0);
            }
            return new Normal({
                mean: n1 * n2._mean,
                stdev: Math.abs(n1) * n2._stdev
            });
        }
        return undefined;
    }
    static operateFloatSecond(operation, n1, n2) {
        if (operation === "Add") {
            return new Normal({
                mean: n1._mean + n2,
                stdev: n1._stdev
            });
        } else if (operation === "Subtract") {
            return new Normal({
                mean: n1._mean - n2,
                stdev: n1._stdev
            });
        } else if (operation === "Multiply") {
            if (n2 === 0) {
                return new PointMass(0);
            }
            return new Normal({
                mean: n1._mean * n2,
                stdev: n1._stdev * Math.abs(n2)
            });
        } else if (operation === "Divide") {
            return new Normal({
                mean: n1._mean / n2,
                stdev: n1._stdev / Math.abs(n2)
            });
        }
        return undefined;
    }
}
class Exponential extends SymbolicDist {
    constructor(rate){
        super();
        this.rate = rate;
    }
    static make(rate) {
        if (rate <= 0) {
            return result_Error("Exponential distributions rate must be larger than 0.");
        }
        return result_Ok(new Exponential(rate));
    }
    toString() {
        return `Exponential(${this.rate})`;
    }
    simplePdf(x) {
        return jstat.exponential.pdf(x, this.rate);
    }
    cdf(x) {
        return jstat.exponential.cdf(x, this.rate);
    }
    inv(p) {
        return jstat.exponential.inv(p, this.rate);
    }
    sample() {
        return jstat.exponential.sample(this.rate);
    }
    mean() {
        return jstat.exponential.mean(this.rate);
    }
    variance() {
        return result_Ok(jstat.exponential.variance(this.rate));
    }
}
class Cauchy extends SymbolicDist {
    constructor({ local , scale  }){
        super();
        this.local = local;
        this.scale = scale;
    }
    static make({ local , scale  }) {
        if (scale > 0) {
            return result_Ok(new Cauchy({
                local,
                scale
            }));
        } else {
            return result_Error("Cauchy distribution scale parameter must larger than 0.");
        }
    }
    toString() {
        return `Cauchy(${this.local}, ${this.scale})`;
    }
    simplePdf(x) {
        return jstat.cauchy.pdf(x, this.local, this.scale);
    }
    cdf(x) {
        return jstat.cauchy.cdf(x, this.local, this.scale);
    }
    inv(p) {
        return jstat.cauchy.inv(p, this.local, this.scale);
    }
    sample() {
        return jstat.cauchy.sample(this.local, this.scale);
    }
    mean() {
        return NaN;
    }
    stdev() {
        return result_Ok(NaN);
    }
    variance() {
        return result_Ok(NaN);
    }
}
class Triangular extends SymbolicDist {
    constructor({ low , medium , high  }){
        super();
        this.low = low;
        this.medium = medium;
        this.high = high;
    }
    static make({ low , medium , high  }) {
        if (low < medium && medium < high) {
            return result_Ok(new Triangular({
                low,
                medium,
                high
            }));
        }
        return result_Error("Triangular values must be increasing order.");
    }
    toString() {
        return `Triangular(${this.low}, ${this.medium}, ${this.high})`;
    }
    simplePdf(x) {
        return jstat.triangular.pdf(x, this.low, this.high, this.medium);
    }
    cdf(x) {
        return jstat.triangular.cdf(x, this.low, this.high, this.medium);
    }
    inv(p) {
        return jstat.triangular.inv(p, this.low, this.high, this.medium);
    }
    sample() {
        return jstat.triangular.sample(this.low, this.high, this.medium);
    }
    mean() {
        return jstat.triangular.mean(this.low, this.high, this.medium);
    }
    variance() {
        return result_Ok(jstat.triangular.variance(this.low, this.high, this.medium));
    }
    min() {
        return this.low;
    }
    max() {
        return this.high;
    }
}
class Beta extends SymbolicDist {
    constructor({ alpha , beta  }){
        super();
        this.alpha = alpha;
        this.beta = beta;
    }
    static make({ alpha , beta  }) {
        if (alpha > 0 && beta > 0) {
            return result_Ok(new Beta({
                alpha,
                beta
            }));
        } else {
            return result_Error("Beta distribution parameters must be positive");
        }
    }
    toString() {
        return `Beta(${this.alpha},${this.beta})`;
    }
    simplePdf(x) {
        return jstat.beta.pdf(x, this.alpha, this.beta);
    }
    cdf(x) {
        return jstat.beta.cdf(x, this.alpha, this.beta);
    }
    inv(x) {
        return jstat.beta.inv(x, this.alpha, this.beta);
    }
    sample() {
        return jstat.beta.sample(this.alpha, this.beta);
    }
    mean() {
        return jstat.beta.mean(this.alpha, this.beta);
    }
    variance() {
        return result_Ok(jstat.beta.variance(this.alpha, this.beta));
    }
    static fromMeanAndSampleSize({ mean , sampleSize  }) {
        const alpha = mean * sampleSize;
        const beta = (1 - mean) * sampleSize;
        return Beta.make({
            alpha,
            beta
        });
    }
    static fromMeanAndStdev({ mean , stdev  }) {
        if (!(0 < stdev && stdev <= 0.5)) {
            return result_Error("Stdev must be in in between 0 and 0.5.");
        } else if (!(0 <= mean && mean <= 1)) {
            return result_Error("Mean must be in between 0 and 1.0.");
        } else {
            const variance = stdev * stdev;
            const sampleSize = mean * (1 - mean) / variance - 1;
            return Beta.fromMeanAndSampleSize({
                mean,
                sampleSize
            });
        }
    }
}
class Lognormal extends SymbolicDist {
    constructor({ mu , sigma  }){
        super();
        this.mu = mu;
        this.sigma = sigma;
    }
    static make({ mu , sigma  }) {
        if (sigma <= 0) {
            return result_Error("Lognormal standard deviation must be larger than 0");
        }
        return result_Ok(new Lognormal({
            mu,
            sigma
        }));
    }
    toString() {
        return `Lognormal(${this.mu},${this.sigma})`;
    }
    simplePdf(x) {
        return jstat.lognormal.pdf(x, this.mu, this.sigma);
    }
    cdf(x) {
        return jstat.lognormal.cdf(x, this.mu, this.sigma);
    }
    inv(x) {
        return jstat.lognormal.inv(x, this.mu, this.sigma);
    }
    sample() {
        return jstat.lognormal.sample(this.mu, this.sigma);
    }
    mean() {
        return jstat.lognormal.mean(this.mu, this.sigma);
    }
    variance() {
        return result_Ok((Math.exp(this.sigma * this.sigma) - 1) * Math.exp(2 * this.mu + this.sigma * this.sigma));
    }
    static fromCredibleInterval({ low , high , probability  }) {
        if (low >= high) {
            return result_Error("Low value must be less than high value");
        }
        if (low <= 0) {
            return result_Error("Low value must be above 0");
        }
        if (probability <= 0 || probability >= 1) {
            return result_Error("Probability must be in (0, 1) interval");
        }
        const logLow = Math.log(low);
        const logHigh = Math.log(high);
        const normalizedSigmas = jstat.normal.inv(1 - (1 - probability) / 2, 0, 1);
        const mu = (logLow + logHigh) / 2;
        const sigma = (logHigh - logLow) / (2 * normalizedSigmas);
        return Lognormal.make({
            mu,
            sigma
        });
    }
    static fromMeanAndStdev({ mean , stdev  }) {
        if (mean <= 0) {
            return result_Error("Lognormal mean must be larger than 0");
        } else if (stdev <= 0) {
            return result_Error("Lognormal standard deviation must be larger than 0");
        } else {
            const variance = Math.pow(stdev, 2);
            const meanSquared = Math.pow(mean, 2);
            const mu = 2 * Math.log(mean) - 0.5 * Math.log(variance + meanSquared);
            const sigma = Math.sqrt(Math.log(variance / meanSquared + 1));
            return result_Ok(new Lognormal({
                mu,
                sigma
            }));
        }
    }
    static multiply(l1, l2) {
        const mu = l1.mu + l2.mu;
        const sigma = Math.sqrt(Math.pow(l1.sigma, 2) + Math.pow(l2.sigma, 2));
        return new Lognormal({
            mu,
            sigma
        });
    }
    static divide(l1, l2) {
        const mu = l1.mu - l2.mu;
        const sigma = Math.sqrt(Math.pow(l1.sigma, 2) + Math.pow(l2.sigma, 2));
        return new Lognormal({
            mu,
            sigma
        });
    }
    static operate(operation, n1, n2) {
        if (operation === "Multiply") {
            return Lognormal.multiply(n1, n2);
        } else if (operation === "Divide") {
            return Lognormal.divide(n1, n2);
        }
        return undefined;
    }
    static operateFloatFirst(operation, n1, n2) {
        if (operation === "Multiply") {
            return n1 > 0 ? new Lognormal({
                mu: Math.log(n1) + n2.mu,
                sigma: n2.sigma
            }) : undefined;
        } else if (operation === "Divide") {
            return n1 > 0 ? new Lognormal({
                mu: Math.log(n1) - n2.mu,
                sigma: n2.sigma
            }) : undefined;
        }
        return undefined;
    }
    static operateFloatSecond(operation, n1, n2) {
        if (operation === "Multiply") {
            return n2 > 0 ? new Lognormal({
                mu: n1.mu + Math.log(n2),
                sigma: n1.sigma
            }) : undefined;
        } else if (operation === "Divide") {
            return n2 > 0 ? new Lognormal({
                mu: n1.mu - Math.log(n2),
                sigma: n1.sigma
            }) : undefined;
        }
        return undefined;
    }
}
class Uniform extends SymbolicDist {
    constructor({ low , high  }){
        super();
        this.high = high;
        this.low = low;
    }
    static make({ low , high  }) {
        if (high > low) {
            return result_Ok(new Uniform({
                low,
                high
            }));
        } else {
            return result_Error("High must be larger than low");
        }
    }
    interpolateXs(opts) {
        if (opts.xSelection === "ByWeight") {
            const distance = this.high - this.low;
            const dx = Epsilon.ten * distance;
            return [
                this.low - dx,
                this.low,
                this.low + dx,
                this.high - dx,
                this.high,
                this.high + dx
            ];
        }
        return super.interpolateXs(opts);
    }
    toString() {
        return `Uniform(${this.low},${this.high})`;
    }
    simplePdf(x) {
        return jstat.uniform.pdf(x, this.low, this.high);
    }
    cdf(x) {
        return jstat.uniform.cdf(x, this.low, this.high);
    }
    inv(x) {
        return jstat.uniform.inv(x, this.low, this.high);
    }
    sample() {
        return jstat.uniform.sample(this.low, this.high);
    }
    mean() {
        return jstat.uniform.mean(this.low, this.high);
    }
    variance() {
        return result_Ok(Math.pow(this.high - this.low, 2) / 12);
    }
    min() {
        return this.low;
    }
    max() {
        return this.high;
    }
    truncate(left, right) {
        const newLow = Math.max(left !== null && left !== void 0 ? left : -Infinity, this.low);
        const newHigh = Math.min(right !== null && right !== void 0 ? right : Infinity, this.high);
        return result_Ok(new Uniform({
            low: newLow,
            high: newHigh
        }));
    }
}
class Logistic extends SymbolicDist {
    constructor({ location , scale  }){
        super();
        this.location = location;
        this.scale = scale;
    }
    static make({ location , scale  }) {
        if (scale > 0) {
            return result_Ok(new Logistic({
                location,
                scale
            }));
        } else {
            return result_Error("Scale must be positive");
        }
    }
    toString() {
        return `Logistic(${this.location},${this.scale})`;
    }
    simplePdf(x) {
        if (this.scale === 0) return this.location === x ? +Infinity : 0;
        const exp_delta = Math.pow(Math.E, -((x - this.location) / this.scale));
        return exp_delta / (this.scale * square(1 + exp_delta));
    }
    cdf(x) {
        if (this.scale === 0) return this.location < x ? 0 : 1;
        let exp_delta = Math.pow(Math.E, -((x - this.location) / this.scale));
        return 1 / (1 + exp_delta);
    }
    inv(p) {
        if (this.scale == 0) return this.location;
        return this.location + this.scale * Math.log(p / (1 - p));
    }
    sample() {
        const s = Math.random();
        return this.inv(s);
    }
    mean() {
        return this.location;
    }
    variance() {
        return result_Ok(square(this.scale) * square(Math.PI) / 3);
    }
}
class Bernoulli extends SymbolicDist {
    constructor(p){
        super();
        this.p = p;
    }
    static make(p) {
        if (p >= 0.0 && p <= 1.0) {
            return result_Ok(new Bernoulli(p));
        } else {
            return result_Error("Bernoulli parameter must be between 0 and 1");
        }
    }
    toString() {
        return `Bernoulli(${this.p})`;
    }
    pmf(x) {
        return x === 0 ? 1 - this.p : this.p;
    }
    simplePdf(x) {
        return this.pmf(x);
    }
    cdf(x) {
        return x < 0 ? 0 : x >= 1 ? 1 : 1 - this.p;
    }
    inv(prob) {
        return prob <= 1 - this.p ? 0 : 1;
    }
    mean() {
        return this.p;
    }
    sample() {
        const s = Math.random();
        return this.inv(s);
    }
    min() {
        return this.p === 1 ? 1 : 0;
    }
    max() {
        return this.p === 0 ? 0 : 1;
    }
    variance() {
        return result_Ok(this.p * (1 - this.p));
    }
    toPointSetDist() {
        return result_Ok(new PointSetDist(new DiscreteShape({
            integralSumCache: 1.0,
            xyShape: {
                xs: [
                    0,
                    1
                ],
                ys: [
                    1 - this.p,
                    this.p
                ]
            }
        })));
    }
}
class Gamma extends SymbolicDist {
    constructor({ shape , scale  }){
        super();
        this.shape = shape;
        this.scale = scale;
    }
    static make({ shape , scale  }) {
        if (shape <= 0) {
            return result_Error("shape must be larger than 0");
        }
        if (scale <= 0) {
            return result_Error("scale must be larger than 0");
        }
        return result_Ok(new Gamma({
            shape,
            scale
        }));
    }
    toString() {
        return `(${this.shape}, ${this.scale})`;
    }
    simplePdf(x) {
        return jstat.gamma.pdf(x, this.shape, this.scale);
    }
    cdf(x) {
        return jstat.gamma.cdf(x, this.shape, this.scale);
    }
    inv(x) {
        return jstat.gamma.inv(x, this.shape, this.scale);
    }
    sample() {
        return jstat.gamma.sample(this.shape, this.scale);
    }
    mean() {
        return jstat.gamma.mean(this.shape, this.scale);
    }
    variance() {
        return result_Ok(this.shape * this.scale * this.scale);
    }
}
class PointMass extends SymbolicDist {
    constructor(t){
        super();
        this.t = t;
    }
    toString() {
        return `PointMass(${this.t})`;
    }
    static make(t) {
        if (isFinite(t)) {
            return result_Ok(new PointMass(t));
        } else {
            return result_Error("PointMass must be finite");
        }
    }
    simplePdf(x) {
        return x === this.t ? 1.0 : 0.0;
    }
    cdf(x) {
        return x >= this.t ? 1.0 : 0.0;
    }
    inv(p) {
        return this.t;
    }
    mean() {
        return this.t;
    }
    variance() {
        return result_Ok(0);
    }
    sample() {
        return this.t;
    }
    min() {
        return this.t;
    }
    max() {
        return this.t;
    }
    expectedConvolutionCost() {
        return OpCost.floatCost;
    }
    isFloat() {
        return true;
    }
    toPointSetDist() {
        return result_Ok(new PointSetDist(new DiscreteShape({
            integralSumCache: 1.0,
            xyShape: {
                xs: [
                    this.t
                ],
                ys: [
                    1.0
                ]
            }
        })));
    }
}
function makeFromCredibleInterval({ low , high , probability  }) {
    if (low <= 0) {
        return Normal.fromCredibleInterval({
            low,
            high,
            probability
        });
    } else {
        return Lognormal.fromCredibleInterval({
            low,
            high,
            probability
        });
    }
}
const tryAnalyticalSimplification = (d1, d2, op)=>{
    if (d1 instanceof PointMass && d2 instanceof PointMass) {
        return fmap(Algebraic.toFn(op)(d1.t, d2.t), (v)=>new PointMass(v));
    } else if (d1 instanceof Normal && d2 instanceof Normal) {
        const out = Normal.operate(op, d1, d2);
        return out ? result_Ok(out) : undefined;
    } else if (d1 instanceof PointMass && d2 instanceof Normal) {
        const out = Normal.operateFloatFirst(op, d1.t, d2);
        return out ? result_Ok(out) : undefined;
    } else if (d1 instanceof Normal && d2 instanceof PointMass) {
        const out = Normal.operateFloatSecond(op, d1, d2.t);
        return out ? result_Ok(out) : undefined;
    } else if (d1 instanceof Lognormal && d2 instanceof Lognormal) {
        const out = Lognormal.operate(op, d1, d2);
        return out ? result_Ok(out) : undefined;
    } else if (d1 instanceof PointMass && d2 instanceof Lognormal) {
        const out = Lognormal.operateFloatFirst(op, d1.t, d2);
        return out ? result_Ok(out) : undefined;
    } else if (d1 instanceof Lognormal && d2 instanceof PointMass) {
        const out = Lognormal.operateFloatSecond(op, d1, d2.t);
        return out ? result_Ok(out) : undefined;
    } else {
        return undefined;
    }
}; //# sourceMappingURL=SymbolicDist.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqDistribution.js







var SqDistributionTag;
(function(SqDistributionTag) {
    SqDistributionTag["PointSet"] = "PointSet";
    SqDistributionTag["SampleSet"] = "SampleSet";
    SqDistributionTag["Symbolic"] = "Symbolic";
})(SqDistributionTag || (SqDistributionTag = {}));
const wrapDistribution = (value)=>{
    if (value instanceof SymbolicDist) {
        return new SqSymbolicDistribution(value);
    } else if (value instanceof SampleSetDist) {
        return new SqSampleSetDistribution(value);
    } else if (value instanceof PointSetDist) {
        return new SqPointSetDistribution(value);
    }
    throw new Error(`Unknown value ${value}`);
};
class SqAbstractDistribution {
    constructor(_value){
        this._value = _value;
    }
    pointSet(env) {
        const innerResult = this._value.toPointSetDist(env);
        return fmap2(innerResult, (dist)=>wrapPointSet(dist.pointSet), (e)=>new SqDistributionError(e));
    }
    asSampleSetDist(env) {
        const innerResult = SampleSetDist.fromDist(this._value, env);
        return fmap2(innerResult, (dist)=>new SqSampleSetDistribution(dist), (e)=>new SqDistributionError(e));
    }
    toString() {
        return this._value.toString();
    }
    toSparkline(env) {
        return this._value.toSparkline(20, env);
    }
    mean(env) {
        return this._value.mean();
    }
    pdf(env, n) {
        return fmap2(this._value.pdf(n, {
            env
        }), (v)=>v, (e)=>new SqDistributionError(e));
    }
    cdf(env, n) {
        return result_Ok(this._value.cdf(n));
    }
    inv(env, n) {
        return result_Ok(this._value.inv(n));
    }
    stdev(env) {
        return fmap2(this._value.stdev(), (v)=>v, (e)=>new SqDistributionError(e));
    }
}
class SqPointSetDistribution extends SqAbstractDistribution {
    constructor(){
        super(...arguments);
        this.tag = SqDistributionTag.PointSet;
    }
}
class SqSampleSetDistribution extends SqAbstractDistribution {
    constructor(){
        super(...arguments);
        this.tag = SqDistributionTag.SampleSet;
    }
    getSamples() {
        return this._value.samples;
    }
}
class SqSymbolicDistribution extends SqAbstractDistribution {
    constructor(){
        super(...arguments);
        this.tag = SqDistributionTag.Symbolic;
    }
} //# sourceMappingURL=SqDistribution.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqLambda.js
class SqLambda {
    constructor(_value, location){
        this._value = _value;
        this.location = location;
    }
    parameters() {
        return this._value.getParameters();
    }
    call(args) {
        if (!this.location) {
            throw new Error("Can't call a location-less Lambda");
        }
        const { project , sourceId  } = this.location;
        const callId = "__lambda__";
        const quote = (arg)=>`"${arg.replace(new RegExp('"', "g"), '\\"')}"`;
        const argsSource = args.map((arg)=>typeof arg === "number" ? arg : quote(arg)).join(",");
        const pathItems = [
            ...this.location.path.root === "result" ? [
                "__result__"
            ] : [],
            ...this.location.path.items
        ];
        const functionNameSource = pathItems.map((item, i)=>typeof item === "string" ? i ? "." + item : item : `[${item}]`).join("");
        const source = `${functionNameSource}(${argsSource})`;
        project.setSource(callId, source);
        project.setContinues(callId, [
            sourceId
        ]);
        project.run(callId);
        return project.getResult(callId);
    }
    toString() {
        return this._value.toString();
    }
} //# sourceMappingURL=SqLambda.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqValueLocation.js
class SqValueLocation {
    constructor(project, sourceId, path){
        this.project = project;
        this.sourceId = sourceId;
        this.path = path;
    }
    extend(item) {
        return new SqValueLocation(this.project, this.sourceId, {
            root: this.path.root,
            items: [
                ...this.path.items,
                item
            ]
        });
    }
} //# sourceMappingURL=SqValueLocation.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqLambdaDeclaration.js


class SqLambdaDeclaration {
    constructor(_value, location){
        this._value = _value;
        this.location = location;
    }
    get fn() {
        return new SqLambda(this._value.fn, this.location ? new SqValueLocation(this.location.project, this.location.sourceId, Object.assign(Object.assign({}, this.location.path), {
            items: [
                ...this.location.path.items,
                "fn"
            ]
        })) : undefined);
    }
    get inputs() {
        return this._value.args;
    }
} //# sourceMappingURL=SqLambdaDeclaration.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqScale.js

const wrapScale = (value)=>{
    switch(value.type){
        case "linear":
            return new SqLinearScale(value);
        case "log":
            return new SqLogScale(value);
        case "symlog":
            return new SqSymlogScale(value);
        case "power":
            return new SqPowerScale(value);
    }
};
class SqAbstractScale {
    constructor(_value){
        this._value = _value;
    }
    toString() {
        return vScale(this._value).toString();
    }
    get min() {
        return this._value.min;
    }
    get max() {
        return this._value.max;
    }
    get tickFormat() {
        return this._value.tickFormat;
    }
}
class SqLinearScale extends SqAbstractScale {
    constructor(){
        super(...arguments);
        this.tag = "linear";
    }
    static create(args = {}) {
        return new SqLinearScale(Object.assign({
            type: "linear"
        }, args));
    }
}
class SqLogScale extends SqAbstractScale {
    constructor(){
        super(...arguments);
        this.tag = "log";
    }
    static create(args = {}) {
        return new SqLogScale(Object.assign({
            type: "log"
        }, args));
    }
}
class SqSymlogScale extends SqAbstractScale {
    constructor(){
        super(...arguments);
        this.tag = "symlog";
    }
    static create(args = {}) {
        return new SqSymlogScale(Object.assign({
            type: "symlog"
        }, args));
    }
}
class SqPowerScale extends SqAbstractScale {
    constructor(){
        super(...arguments);
        this.tag = "power";
    }
    static create(args) {
        return new SqPowerScale(Object.assign({
            type: "power"
        }, args));
    }
    get exponent() {
        return this._value.exponent;
    }
} //# sourceMappingURL=SqScale.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqPlot.js









const wrapPlot = (value, location)=>{
    switch(value.type){
        case "distributions":
            return new SqDistributionsPlot(value, location);
        case "numericFn":
            return new SqNumericFnPlot(value, location);
        case "distFn":
            return new SqDistFnPlot(value, location);
        case "scatter":
            return new SqScatterPlot(value, location);
    }
};
class SqAbstractPlot {
    constructor(_value, location){
        this._value = _value;
        this.location = location;
    }
    toString() {
        return vPlot(this._value).toString();
    }
    asValue() {
        return new SqPlotValue(vPlot(this._value), this.location);
    }
}
class SqDistributionsPlot extends SqAbstractPlot {
    constructor(){
        super(...arguments);
        this.tag = "distributions";
    }
    static create({ distribution , xScale , yScale , showSummary , title  }) {
        return new SqDistributionsPlot({
            type: "distributions",
            distributions: [
                {
                    distribution: distribution._value
                }
            ],
            xScale: xScale._value,
            yScale: yScale._value,
            showSummary,
            title
        });
    }
    get distributions() {
        return this._value.distributions.map(({ name , distribution  })=>({
                name,
                distribution: wrapDistribution(distribution)
            }));
    }
    get title() {
        return this._value.title;
    }
    get showSummary() {
        return this._value.showSummary;
    }
    get xScale() {
        return wrapScale(this._value.xScale);
    }
    get yScale() {
        return wrapScale(this._value.yScale);
    }
}
class SqNumericFnPlot extends SqAbstractPlot {
    constructor(){
        super(...arguments);
        this.tag = "numericFn";
        this.createdProgrammatically = false;
    }
    static create({ fn , xScale , yScale , points  }) {
        const result = new SqNumericFnPlot({
            type: "numericFn",
            fn: fn._value,
            xScale: xScale._value,
            yScale: yScale._value,
            points
        }, fn.location);
        result.createdProgrammatically = true;
        return result;
    }
    get fn() {
        return new SqLambda(this._value.fn, this.location ? this.createdProgrammatically ? this.location : new SqValueLocation(this.location.project, this.location.sourceId, Object.assign(Object.assign({}, this.location.path), {
            items: [
                ...this.location.path.items,
                "fn"
            ]
        })) : undefined);
    }
    get xScale() {
        return wrapScale(this._value.xScale);
    }
    get yScale() {
        return wrapScale(this._value.yScale);
    }
    get points() {
        return this._value.points;
    }
    toString() {
        return this.fn.toString();
    }
}
class SqDistFnPlot extends SqAbstractPlot {
    constructor(){
        super(...arguments);
        this.tag = "distFn";
        this.createdProgrammatically = false;
    }
    static create({ fn , xScale , distXScale , points  }) {
        const result = new SqDistFnPlot({
            type: "distFn",
            fn: fn._value,
            xScale: xScale._value,
            distXScale: distXScale._value,
            points
        }, fn.location);
        result.createdProgrammatically = true;
        return result;
    }
    get fn() {
        return new SqLambda(this._value.fn, this.location ? this.createdProgrammatically ? this.location : new SqValueLocation(this.location.project, this.location.sourceId, Object.assign(Object.assign({}, this.location.path), {
            items: [
                ...this.location.path.items,
                "fn"
            ]
        })) : undefined);
    }
    get xScale() {
        return wrapScale(this._value.xScale);
    }
    get distXScale() {
        return wrapScale(this._value.distXScale);
    }
    get points() {
        return this._value.points;
    }
    toString() {
        return this.fn.toString();
    }
}
class SqScatterPlot extends SqAbstractPlot {
    constructor(){
        super(...arguments);
        this.tag = "scatter";
    }
    buildSampleSetDist(dist, env) {
        const sampleSetResult = SampleSetDist.fromDist(dist, env);
        if (!sampleSetResult.ok) {
            return result_Error(SqError.createOtherError("Conversion to SampleSet failed"));
        }
        return result_Ok(new SqSampleSetDistribution(sampleSetResult.value));
    }
    xDist(env) {
        return this.buildSampleSetDist(this._value.xDist, env);
    }
    yDist(env) {
        return this.buildSampleSetDist(this._value.yDist, env);
    }
    get xScale() {
        const scale = this._value.xScale;
        return scale ? wrapScale(scale) : undefined;
    }
    get yScale() {
        const scale = this._value.yScale;
        return scale ? wrapScale(scale) : undefined;
    }
    static zipToPoints(xDist, yDist) {
        const xSamples = xDist.getSamples();
        const ySamples = yDist.getSamples();
        if (xSamples.length !== ySamples.length) {
            throw new Error("Sample count mismatch");
        }
        const points = [];
        for(let i = 0; i < xSamples.length; i++){
            points.push({
                x: xSamples[i],
                y: ySamples[i]
            });
        }
        return points;
    }
} //# sourceMappingURL=SqPlot.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqValue.js







const wrapValue = (value, location)=>{
    const tag = value.type;
    switch(value.type){
        case "Array":
            return new SqArrayValue(value, location);
        case "Bool":
            return new SqBoolValue(value, location);
        case "Date":
            return new SqDateValue(value, location);
        case "Declaration":
            return new SqDeclarationValue(value, location);
        case "Dist":
            return new SqDistributionValue(value, location);
        case "Lambda":
            return new SqLambdaValue(value, location);
        case "Number":
            return new SqNumberValue(value, location);
        case "Record":
            return new SqRecordValue(value, location);
        case "String":
            return new SqStringValue(value, location);
        case "Plot":
            return new SqPlotValue(value, location);
        case "Scale":
            return new SqScaleValue(value, location);
        case "TimeDuration":
            return new SqTimeDurationValue(value, location);
        case "Void":
            return new SqVoidValue(value, location);
        default:
            throw new Error(`Unknown value ${JSON.stringify(value)}`);
    }
};
class SqAbstractValue {
    constructor(_value, location){
        this._value = _value;
        this.location = location;
    }
    toString() {
        return this._value.toString();
    }
}
class SqArrayValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Array";
    }
    get value() {
        return new SqArray(this._value.value, this.location);
    }
    asJS() {
        return this.value.getValues().map((value)=>value.asJS());
    }
}
class SqBoolValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Bool";
    }
    get value() {
        return this._value.value;
    }
    asJS() {
        return this.value;
    }
}
class SqDateValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Date";
    }
    get value() {
        return this._value.value;
    }
    asJS() {
        return this.value;
    }
}
class SqDeclarationValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Declaration";
    }
    get value() {
        return new SqLambdaDeclaration(this._value.value, this.location);
    }
    asJS() {
        return this.value;
    }
}
class SqDistributionValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Dist";
    }
    get value() {
        return wrapDistribution(this._value.value);
    }
    asJS() {
        return this.value;
    }
}
class SqLambdaValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Lambda";
    }
    get value() {
        return new SqLambda(this._value.value, this.location);
    }
    asJS() {
        return this.value;
    }
}
class SqNumberValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Number";
    }
    get value() {
        return this._value.value;
    }
    asJS() {
        return this.value;
    }
}
class SqRecordValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Record";
    }
    get value() {
        return new SqRecord(this._value.value, this.location);
    }
    asJS() {
        return new Map(this.value.entries().map(([k, v])=>[
                k,
                v.asJS()
            ]));
    }
}
class SqStringValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "String";
    }
    get value() {
        return this._value.value;
    }
    asJS() {
        return this.value;
    }
}
class SqTimeDurationValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "TimeDuration";
    }
    get value() {
        return this._value.value;
    }
    asJS() {
        return this._value.value;
    }
}
class SqPlotValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Plot";
    }
    get value() {
        return wrapPlot(this._value.value, this.location);
    }
    asJS() {
        return this.value;
    }
}
class SqScaleValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Scale";
    }
    get value() {
        return wrapScale(this._value.value);
    }
    asJS() {
        return this.value;
    }
}
class SqVoidValue extends SqAbstractValue {
    constructor(){
        super(...arguments);
        this.tag = "Void";
    }
    get value() {
        return null;
    }
    asJS() {
        return null;
    }
}
const toStringResult = (result)=>{
    return `${result.ok ? "Ok" : "Error"}(${result.value.toString()})`;
}; //# sourceMappingURL=SqValue.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqRecord.js


class SqRecord {
    constructor(_value, location){
        this._value = _value;
        this.location = location;
    }
    entries() {
        return [
            ...this._value.entries()
        ].map(([k, v])=>{
            var _a;
            return [
                k,
                wrapValue(v, (_a = this.location) === null || _a === void 0 ? void 0 : _a.extend(k))
            ];
        });
    }
    get(key) {
        var _a;
        const value = this._value.get(key);
        if (value === undefined) {
            return undefined;
        }
        return wrapValue(value, (_a = this.location) === null || _a === void 0 ? void 0 : _a.extend(key));
    }
    toString() {
        return vRecord(this._value).toString();
    }
    asValue() {
        return new SqRecordValue(vRecord(this._value), this.location);
    }
} //# sourceMappingURL=SqRecord.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/ast/peggyHelpers.js
const infixFunctions = {
    "+": "add",
    "-": "subtract",
    "!=": "unequal",
    ".-": "dotSubtract",
    ".*": "dotMultiply",
    "./": "dotDivide",
    ".^": "dotPow",
    ".+": "dotAdd",
    "*": "multiply",
    "/": "divide",
    "&&": "and",
    "^": "pow",
    "<": "smaller",
    "<=": "smallerEq",
    "==": "equal",
    ">": "larger",
    ">=": "largerEq",
    "||": "or",
    to: "credibleIntervalToDistribution"
};
const unaryFunctions = {
    "-": "unaryMinus",
    "!": "not",
    ".-": "unaryDotMinus"
};
function nodeCall(fn, args, location) {
    return {
        type: "Call",
        fn,
        args,
        location
    };
}
function makeInfixChain(head, tail, location) {
    return tail.reduce((result, [operator, right])=>{
        return nodeInfixCall(operator, result, right, location);
    }, head);
}
function nodeInfixCall(op, arg1, arg2, location) {
    return {
        type: "InfixCall",
        op,
        args: [
            arg1,
            arg2
        ],
        location
    };
}
function nodeUnaryCall(op, arg, location) {
    return {
        type: "UnaryCall",
        op,
        arg,
        location
    };
}
function nodePipe(leftArg, fn, rightArgs, location) {
    return {
        type: "Pipe",
        leftArg,
        fn,
        rightArgs,
        location
    };
}
function nodeDotLookup(arg, key, location) {
    return {
        type: "DotLookup",
        arg,
        key,
        location
    };
}
function nodeBracketLookup(arg, key, location) {
    return {
        type: "BracketLookup",
        arg,
        key,
        location
    };
}
function constructArray(elements, location) {
    return {
        type: "Array",
        elements,
        location
    };
}
function constructRecord(elements, location) {
    return {
        type: "Record",
        elements,
        location
    };
}
function nodeBlock(statements, location) {
    return {
        type: "Block",
        statements,
        location
    };
}
function nodeProgram(statements, location) {
    return {
        type: "Program",
        statements,
        location
    };
}
function nodeBoolean(value, location) {
    return {
        type: "Boolean",
        value,
        location
    };
}
function nodeFloat(value, location) {
    return {
        type: "Float",
        value,
        location
    };
}
function nodeIdentifier(value, location) {
    return {
        type: "Identifier",
        value,
        location
    };
}
function nodeInteger(value, location) {
    return {
        type: "Integer",
        value,
        location
    };
}
function nodeKeyValue(key, value, location) {
    if (key.type === "Identifier") {
        key = Object.assign(Object.assign({}, key), {
            type: "String"
        });
    }
    return {
        type: "KeyValue",
        key,
        value,
        location
    };
}
function nodeLambda(args, body, location, name) {
    return {
        type: "Lambda",
        args,
        body,
        location,
        name: name === null || name === void 0 ? void 0 : name.value
    };
}
function nodeLetStatement(variable, value, location) {
    const patchedValue = value.type === "Lambda" ? Object.assign(Object.assign({}, value), {
        name: variable.value
    }) : value;
    return {
        type: "LetStatement",
        variable,
        value: patchedValue,
        location
    };
}
function nodeDefunStatement(variable, value, location) {
    return {
        type: "DefunStatement",
        variable,
        value,
        location
    };
}
function nodeModuleIdentifier(value, location) {
    return {
        type: "ModuleIdentifier",
        value,
        location
    };
}
function nodeString(value, location) {
    return {
        type: "String",
        value,
        location
    };
}
function nodeTernary(condition, trueExpression, falseExpression, kind, location) {
    return {
        type: "Ternary",
        condition,
        trueExpression,
        falseExpression,
        kind,
        location
    };
}
function nodeVoid(location) {
    return {
        type: "Void",
        location
    };
}
function lineComment(text, location) {
    return {
        type: "lineComment",
        value: text,
        location
    };
}
function blockComment(text, location) {
    return {
        type: "blockComment",
        value: text,
        location
    };
} //# sourceMappingURL=peggyHelpers.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/ast/peggyParser.js

function peg$subclass(child, parent) {
    function C() {
        this.constructor = child;
    }
    C.prototype = parent.prototype;
    child.prototype = new C();
}
function peg$SyntaxError(message, expected, found, location) {
    var self = Error.call(this, message);
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(self, peg$SyntaxError.prototype);
    }
    self.expected = expected;
    self.found = found;
    self.location = location;
    self.name = "SyntaxError";
    return self;
}
peg$subclass(peg$SyntaxError, Error);
function peg$padEnd(str, targetLength, padString) {
    padString = padString || " ";
    if (str.length > targetLength) {
        return str;
    }
    targetLength -= str.length;
    padString += padString.repeat(targetLength);
    return str + padString.slice(0, targetLength);
}
peg$SyntaxError.prototype.format = function(sources) {
    var str = "Error: " + this.message;
    if (this.location) {
        var src = null;
        var k;
        for(k = 0; k < sources.length; k++){
            if (sources[k].source === this.location.source) {
                src = sources[k].text.split(/\r\n|\n|\r/g);
                break;
            }
        }
        var s = this.location.start;
        var offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
        var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
        if (src) {
            var e = this.location.end;
            var filler = peg$padEnd("", offset_s.line.toString().length, " ");
            var line = src[s.line - 1];
            var last = s.line === e.line ? e.column : line.length + 1;
            var hatLen = last - s.column || 1;
            str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1, " ") + peg$padEnd("", hatLen, "^");
        } else {
            str += "\n at " + loc;
        }
    }
    return str;
};
peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
            return '"' + literalEscape(expectation.text) + '"';
        },
        class: function(expectation) {
            var escapedParts = expectation.parts.map(function(part) {
                return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
            });
            return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
        },
        any: function() {
            return "any character";
        },
        end: function() {
            return "end of input";
        },
        other: function(expectation) {
            return expectation.description;
        }
    };
    function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
    }
    function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
            return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
            return "\\x" + hex(ch);
        });
    }
    function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
            return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
            return "\\x" + hex(ch);
        });
    }
    function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected) {
        var descriptions = expected.map(describeExpectation);
        var i, j;
        descriptions.sort();
        if (descriptions.length > 0) {
            for(i = 1, j = 1; i < descriptions.length; i++){
                if (descriptions[i - 1] !== descriptions[i]) {
                    descriptions[j] = descriptions[i];
                    j++;
                }
            }
            descriptions.length = j;
        }
        switch(descriptions.length){
            case 1:
                return descriptions[0];
            case 2:
                return descriptions[0] + " or " + descriptions[1];
            default:
                return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
    }
    function describeFound(found) {
        return found ? '"' + literalEscape(found) + '"' : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function peg$parse(input, options) {
    options = options !== undefined ? options : {};
    var peg$FAILED = {};
    var peg$source = options.grammarSource;
    var peg$startRuleFunctions = {
        start: peg$parsestart
    };
    var peg$startRuleFunction = peg$parsestart;
    var peg$c0 = "{";
    var peg$c1 = "}";
    var peg$c2 = "call";
    var peg$c3 = "(";
    var peg$c4 = ")";
    var peg$c5 = "=";
    var peg$c6 = "if";
    var peg$c7 = "then";
    var peg$c8 = "else";
    var peg$c9 = "?";
    var peg$c10 = ":";
    var peg$c11 = "||";
    var peg$c12 = "&&";
    var peg$c13 = "==";
    var peg$c14 = "!=";
    var peg$c15 = "<=";
    var peg$c16 = "<";
    var peg$c17 = ">=";
    var peg$c18 = ">";
    var peg$c19 = "to";
    var peg$c20 = "+";
    var peg$c21 = "-";
    var peg$c22 = ".+";
    var peg$c23 = ".-";
    var peg$c24 = "*";
    var peg$c25 = "/";
    var peg$c26 = ".*";
    var peg$c27 = "./";
    var peg$c28 = "^";
    var peg$c29 = ".^";
    var peg$c30 = "->";
    var peg$c31 = "|>";
    var peg$c32 = "!";
    var peg$c33 = "[";
    var peg$c34 = ".";
    var peg$c35 = "]";
    var peg$c36 = "()";
    var peg$c37 = "'";
    var peg$c38 = '"';
    var peg$c39 = "true";
    var peg$c40 = "false";
    var peg$c41 = "|";
    var peg$c42 = ";";
    var peg$c43 = ",";
    var peg$c44 = "//";
    var peg$c45 = "#";
    var peg$c46 = "/*";
    var peg$c47 = "*/";
    var peg$r0 = /^[_a-z]/;
    var peg$r1 = /^[_a-z0-9]/i;
    var peg$r2 = /^[_a-zA-Z]/;
    var peg$r3 = /^[$_a-z]/;
    var peg$r4 = /^[$_a-z0-9]/i;
    var peg$r5 = /^[A-Z]/;
    var peg$r6 = /^[^']/;
    var peg$r7 = /^[^"]/;
    var peg$r8 = /^[e]/i;
    var peg$r9 = /^[0-9]/;
    var peg$r10 = /^[a-z]/i;
    var peg$r11 = /^[_$]/;
    var peg$r12 = /^[\n\r]/;
    var peg$r13 = /^[^\r\n]/;
    var peg$r14 = /^[^*]/;
    var peg$r15 = /^[ \t]/;
    var peg$e0 = peg$literalExpectation("{", false);
    var peg$e1 = peg$literalExpectation("}", false);
    var peg$e2 = peg$literalExpectation("call", false);
    var peg$e3 = peg$literalExpectation("(", false);
    var peg$e4 = peg$literalExpectation(")", false);
    var peg$e5 = peg$otherExpectation("assignment");
    var peg$e6 = peg$literalExpectation("=", false);
    var peg$e7 = peg$literalExpectation("if", false);
    var peg$e8 = peg$literalExpectation("then", false);
    var peg$e9 = peg$literalExpectation("else", false);
    var peg$e10 = peg$literalExpectation("?", false);
    var peg$e11 = peg$literalExpectation(":", false);
    var peg$e12 = peg$otherExpectation("operator");
    var peg$e13 = peg$literalExpectation("||", false);
    var peg$e14 = peg$literalExpectation("&&", false);
    var peg$e15 = peg$literalExpectation("==", false);
    var peg$e16 = peg$literalExpectation("!=", false);
    var peg$e17 = peg$literalExpectation("<=", false);
    var peg$e18 = peg$literalExpectation("<", false);
    var peg$e19 = peg$literalExpectation(">=", false);
    var peg$e20 = peg$literalExpectation(">", false);
    var peg$e21 = peg$literalExpectation("to", false);
    var peg$e22 = peg$literalExpectation("+", false);
    var peg$e23 = peg$literalExpectation("-", false);
    var peg$e24 = peg$literalExpectation(".+", false);
    var peg$e25 = peg$literalExpectation(".-", false);
    var peg$e26 = peg$literalExpectation("*", false);
    var peg$e27 = peg$literalExpectation("/", false);
    var peg$e28 = peg$literalExpectation(".*", false);
    var peg$e29 = peg$literalExpectation("./", false);
    var peg$e30 = peg$literalExpectation("^", false);
    var peg$e31 = peg$literalExpectation(".^", false);
    var peg$e32 = peg$literalExpectation("->", false);
    var peg$e33 = peg$literalExpectation("|>", false);
    var peg$e34 = peg$otherExpectation("unary operator");
    var peg$e35 = peg$literalExpectation("!", false);
    var peg$e36 = peg$literalExpectation("[", false);
    var peg$e37 = peg$literalExpectation(".", false);
    var peg$e38 = peg$literalExpectation("]", false);
    var peg$e39 = peg$otherExpectation("void");
    var peg$e40 = peg$literalExpectation("()", false);
    var peg$e41 = peg$otherExpectation("identifier");
    var peg$e42 = peg$classExpectation([
        "_",
        [
            "a",
            "z"
        ]
    ], false, false);
    var peg$e43 = peg$classExpectation([
        "_",
        [
            "a",
            "z"
        ],
        [
            "0",
            "9"
        ]
    ], false, true);
    var peg$e44 = peg$classExpectation([
        "_",
        [
            "a",
            "z"
        ],
        [
            "A",
            "Z"
        ]
    ], false, false);
    var peg$e45 = peg$classExpectation([
        "$",
        "_",
        [
            "a",
            "z"
        ]
    ], false, false);
    var peg$e46 = peg$classExpectation([
        "$",
        "_",
        [
            "a",
            "z"
        ],
        [
            "0",
            "9"
        ]
    ], false, true);
    var peg$e47 = peg$classExpectation([
        [
            "A",
            "Z"
        ]
    ], false, false);
    var peg$e48 = peg$otherExpectation("string");
    var peg$e49 = peg$literalExpectation("'", false);
    var peg$e50 = peg$classExpectation([
        "'"
    ], true, false);
    var peg$e51 = peg$literalExpectation('"', false);
    var peg$e52 = peg$classExpectation([
        '"'
    ], true, false);
    var peg$e53 = peg$otherExpectation("number");
    var peg$e54 = peg$classExpectation([
        "e"
    ], false, true);
    var peg$e55 = peg$classExpectation([
        [
            "0",
            "9"
        ]
    ], false, false);
    var peg$e56 = peg$otherExpectation("boolean");
    var peg$e57 = peg$literalExpectation("true", false);
    var peg$e58 = peg$literalExpectation("false", false);
    var peg$e59 = peg$classExpectation([
        [
            "a",
            "z"
        ]
    ], false, true);
    var peg$e60 = peg$classExpectation([
        "_",
        "$"
    ], false, false);
    var peg$e61 = peg$literalExpectation("|", false);
    var peg$e62 = peg$otherExpectation("array");
    var peg$e63 = peg$otherExpectation("record");
    var peg$e64 = peg$otherExpectation("whitespace");
    var peg$e65 = peg$otherExpectation(";");
    var peg$e66 = peg$literalExpectation(";", false);
    var peg$e67 = peg$otherExpectation(",");
    var peg$e68 = peg$literalExpectation(",", false);
    var peg$e69 = peg$otherExpectation("newline");
    var peg$e70 = peg$classExpectation([
        "\n",
        "\r"
    ], false, false);
    var peg$e71 = peg$otherExpectation("line comment");
    var peg$e72 = peg$literalExpectation("//", false);
    var peg$e73 = peg$literalExpectation("#", false);
    var peg$e74 = peg$classExpectation([
        "\r",
        "\n"
    ], true, false);
    var peg$e75 = peg$otherExpectation("comment");
    var peg$e76 = peg$literalExpectation("/*", false);
    var peg$e77 = peg$classExpectation([
        "*"
    ], true, false);
    var peg$e78 = peg$literalExpectation("*/", false);
    var peg$e79 = peg$classExpectation([
        " ",
        "	"
    ], false, false);
    var peg$f0 = function(start) {
        return start;
    };
    var peg$f1 = function(statements, finalExpression) {
        if (finalExpression) {
            statements.push(finalExpression);
        }
        return nodeProgram(statements, location());
    };
    var peg$f2 = function(finalExpression) {
        return nodeProgram([
            finalExpression
        ], location());
    };
    var peg$f3 = function(finalExpression) {
        return nodeBlock([
            finalExpression
        ], location());
    };
    var peg$f4 = function(statements, finalExpression) {
        if (finalExpression) {
            statements.push(finalExpression);
        }
        return nodeBlock(statements, location());
    };
    var peg$f5 = function(finalExpression) {
        return nodeBlock([
            finalExpression
        ], location());
    };
    var peg$f6 = function(value) {
        const variable = nodeIdentifier("_", location());
        return nodeLetStatement(variable, value, location());
    };
    var peg$f7 = function(variable, value) {
        return nodeLetStatement(variable, value, location());
    };
    var peg$f8 = function(variable, args, body) {
        const value = nodeLambda(args, body, location(), variable);
        return nodeDefunStatement(variable, value, location());
    };
    var peg$f9 = function(condition, trueExpression, falseExpression) {
        return nodeTernary(condition, trueExpression, falseExpression, "IfThenElse", location());
    };
    var peg$f10 = function(condition, trueExpression, falseExpression) {
        return nodeTernary(condition, trueExpression, falseExpression, "C", location());
    };
    var peg$f11 = function(head, tail) {
        return makeInfixChain(head, tail, location());
    };
    var peg$f12 = function(head, tail) {
        return makeInfixChain(head, tail, location());
    };
    var peg$f13 = function(left, operator, right) {
        return nodeInfixCall(operator, left, right, location());
    };
    var peg$f14 = function(left, operator, right) {
        return nodeInfixCall(operator, left, right, location());
    };
    var peg$f15 = function(head, tail) {
        return makeInfixChain(head, tail, location());
    };
    var peg$f16 = function(head, tail) {
        return makeInfixChain(head, tail, location());
    };
    var peg$f17 = function(head, tail) {
        return makeInfixChain(head, tail, location());
    };
    var peg$f18 = function(head, tail) {
        return makeInfixChain(head, tail, location());
    };
    var peg$f19 = function(head, tail) {
        return tail.reduce(function(result, element) {
            return nodePipe(result, element.callable, element.args, location());
        }, head);
    };
    var peg$f20 = function(fn, args) {
        return {
            callable: fn,
            args
        };
    };
    var peg$f21 = function(fn) {
        return {
            callable: fn,
            args: []
        };
    };
    var peg$f22 = function(unaryOperator, right) {
        return nodeUnaryCall(unaryOperator, right, location());
    };
    var peg$f23 = function(head, arg) {
        return {
            mode: "bracket",
            arg
        };
    };
    var peg$f24 = function(head, arg) {
        return {
            mode: "dot",
            arg
        };
    };
    var peg$f25 = function(head, tail) {
        return tail.reduce(function(result, element) {
            switch(element.mode){
                case "dot":
                    return nodeDotLookup(result, element.arg, location());
                case "bracket":
                    return nodeBracketLookup(result, element.arg, location());
                default:
                    throw new Error("Parser implementation error");
            }
        }, head);
    };
    var peg$f26 = function(head, args) {
        return {
            mode: "call",
            args
        };
    };
    var peg$f27 = function(head, arg) {
        return {
            mode: "bracket",
            arg
        };
    };
    var peg$f28 = function(head, arg) {
        return {
            mode: "dot",
            arg
        };
    };
    var peg$f29 = function(head, tail) {
        return tail.reduce(function(result, element) {
            switch(element.mode){
                case "call":
                    return nodeCall(result, element.args, location());
                case "dot":
                    return nodeDotLookup(result, element.arg, location());
                case "bracket":
                    return nodeBracketLookup(result, element.arg, location());
                default:
                    throw new Error("Parser implementation error");
            }
        }, head);
    };
    var peg$f30 = function() {
        return nodeVoid(location());
    };
    var peg$f31 = function(head, tail, final) {
        let modifiers = [
            ...tail
        ];
        modifiers.unshift(head);
        modifiers.push(final);
        const modifiedIdentifier = modifiers.join(".");
        return nodeIdentifier(modifiedIdentifier, location());
    };
    var peg$f32 = function() {
        return nodeIdentifier(text(), location());
    };
    var peg$f33 = function() {
        return nodeIdentifier(text(), location());
    };
    var peg$f34 = function() {
        return nodeIdentifier(text(), location());
    };
    var peg$f35 = function() {
        return nodeModuleIdentifier(text(), location());
    };
    var peg$f36 = function(characters) {
        return nodeString(characters.join(""), location());
    };
    var peg$f37 = function(characters) {
        return nodeString(characters.join(""), location());
    };
    var peg$f38 = function(number, unit) {
        if (unit === null) {
            return number;
        } else {
            return nodeCall(nodeIdentifier(`fromUnit_${unit.value}`, location()), [
                number
            ], location());
        }
    };
    var peg$f39 = function() {
        return nodeInteger(parseInt(text()), location());
    };
    var peg$f40 = function() {
        return nodeFloat(parseFloat(text()), location());
    };
    var peg$f41 = function() {
        return nodeBoolean(text() === "true", location());
    };
    var peg$f42 = function(args, statements, finalExpression) {
        statements.push(finalExpression);
        return nodeLambda(args, nodeBlock(statements, location()), location(), undefined);
    };
    var peg$f43 = function(args, finalExpression) {
        return nodeLambda(args, finalExpression, location(), undefined);
    };
    var peg$f44 = function() {
        return constructArray([], location());
    };
    var peg$f45 = function(args) {
        return constructArray(args, location());
    };
    var peg$f46 = function() {
        return constructRecord([], location());
    };
    var peg$f47 = function(args) {
        return constructRecord(args, location());
    };
    var peg$f48 = function(key, value) {
        return nodeKeyValue(key, value, location());
    };
    var peg$f49 = function(comment) {
        options.comments.push(lineComment(comment, location()));
    };
    var peg$f50 = function(comment) {
        options.comments.push(blockComment(comment, location()));
    };
    var peg$currPos = 0;
    var peg$savedPos = 0;
    var peg$posDetailsCache = [
        {
            line: 1,
            column: 1
        }
    ];
    var peg$maxFailPos = 0;
    var peg$maxFailExpected = [];
    var peg$silentFails = 0;
    var peg$resultsCache = {};
    var peg$result;
    if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error("Can't start parsing from rule \"" + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function text() {
        return input.substring(peg$savedPos, peg$currPos);
    }
    function offset() {
        return peg$savedPos;
    }
    function range() {
        return {
            source: peg$source,
            start: peg$savedPos,
            end: peg$currPos
        };
    }
    function location() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
    }
    function expected(description, location) {
        location = location !== undefined ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([
            peg$otherExpectation(description)
        ], input.substring(peg$savedPos, peg$currPos), location);
    }
    function error(message, location) {
        location = location !== undefined ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location);
    }
    function peg$literalExpectation(text, ignoreCase) {
        return {
            type: "literal",
            text: text,
            ignoreCase: ignoreCase
        };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
        return {
            type: "class",
            parts: parts,
            inverted: inverted,
            ignoreCase: ignoreCase
        };
    }
    function peg$anyExpectation() {
        return {
            type: "any"
        };
    }
    function peg$endExpectation() {
        return {
            type: "end"
        };
    }
    function peg$otherExpectation(description) {
        return {
            type: "other",
            description: description
        };
    }
    function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
            return details;
        } else {
            p = pos - 1;
            while(!peg$posDetailsCache[p]){
                p--;
            }
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column
            };
            while(p < pos){
                if (input.charCodeAt(p) === 10) {
                    details.line++;
                    details.column = 1;
                } else {
                    details.column++;
                }
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    function peg$computeLocation(startPos, endPos, offset) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        var res = {
            source: peg$source,
            start: {
                offset: startPos,
                line: startPosDetails.line,
                column: startPosDetails.column
            },
            end: {
                offset: endPos,
                line: endPosDetails.line,
                column: endPosDetails.column
            }
        };
        if (offset && peg$source && typeof peg$source.offset === "function") {
            res.start = peg$source.offset(res.start);
            res.end = peg$source.offset(res.end);
        }
        return res;
    }
    function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
            return;
        }
        if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
    }
    function peg$buildSimpleError(message, location) {
        return new peg$SyntaxError(message, null, null, location);
    }
    function peg$buildStructuredError(expected, found, location) {
        return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected, found), expected, found, location);
    }
    function peg$parsestart() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 0;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parse_nl();
        s2 = peg$parseouterBlock();
        if (s2 !== peg$FAILED) {
            s3 = peg$parse_nl();
            s4 = peg$parsefinalComment();
            if (s4 === peg$FAILED) {
                s4 = null;
            }
            peg$savedPos = s0;
            s0 = peg$f0(s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsezeroOMoreArgumentsBlockOrExpression() {
        var s0;
        var key = peg$currPos * 76 + 1;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parselambda();
        if (s0 === peg$FAILED) {
            s0 = peg$parseinnerBlockOrExpression();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseouterBlock() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 2;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsestatementsList();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            s3 = peg$parsestatementSeparator();
            if (s3 !== peg$FAILED) {
                s4 = peg$parseexpression();
                if (s4 !== peg$FAILED) {
                    s2 = s4;
                } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            peg$savedPos = s0;
            s0 = peg$f1(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseexpression();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f2(s1);
            }
            s0 = s1;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseinnerBlockOrExpression() {
        var s0, s1;
        var key = peg$currPos * 76 + 3;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsequotedInnerBlock();
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseexpression();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f3(s1);
            }
            s0 = s1;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsequotedInnerBlock() {
        var s0, s1, s2, s3, s4, s5, s6;
        var key = peg$currPos * 76 + 4;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c0;
            peg$currPos++;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e0);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            s3 = peg$parsestatementsList();
            if (s3 !== peg$FAILED) {
                s4 = peg$currPos;
                s5 = peg$parsestatementSeparator();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parseexpression();
                    if (s6 !== peg$FAILED) {
                        s4 = s6;
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    s5 = peg$parse_nl();
                    if (input.charCodeAt(peg$currPos) === 125) {
                        s6 = peg$c1;
                        peg$currPos++;
                    } else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e1);
                        }
                    }
                    if (s6 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f4(s3, s4);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c0;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e0);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_nl();
                s3 = peg$parseexpression();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_nl();
                    if (input.charCodeAt(peg$currPos) === 125) {
                        s5 = peg$c1;
                        peg$currPos++;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e1);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f5(s3);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsestatementsList() {
        var s0, s1, s2, s3;
        var key = peg$currPos * 76 + 5;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsestatement();
        while(s2 !== peg$FAILED){
            s1.push(s2);
            s2 = peg$currPos;
            s3 = peg$parsestatementSeparator();
            if (s3 !== peg$FAILED) {
                s3 = peg$parsestatement();
                if (s3 === peg$FAILED) {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                } else {
                    s2 = s3;
                }
            } else {
                s2 = s3;
            }
        }
        if (s1.length < 1) {
            peg$currPos = s0;
            s0 = peg$FAILED;
        } else {
            s0 = s1;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsestatement() {
        var s0;
        var key = peg$currPos * 76 + 6;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parseletStatement();
        if (s0 === peg$FAILED) {
            s0 = peg$parsedefunStatement();
            if (s0 === peg$FAILED) {
                s0 = peg$parsevoidStatement();
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsevoidStatement() {
        var s0, s1, s2, s3;
        var key = peg$currPos * 76 + 7;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 4) === peg$c2) {
            s1 = peg$c2;
            peg$currPos += 4;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e2);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            s3 = peg$parsezeroOMoreArgumentsBlockOrExpression();
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f6(s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseletStatement() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 8;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsevariable();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            s3 = peg$parseassignmentOp();
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$parsezeroOMoreArgumentsBlockOrExpression();
                if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f7(s1, s5);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsedefunStatement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;
        var key = peg$currPos * 76 + 9;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsevariable();
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
                s2 = peg$c3;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e3);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse_nl();
                s4 = peg$parsefunctionParameters();
                s5 = peg$parse_nl();
                if (input.charCodeAt(peg$currPos) === 41) {
                    s6 = peg$c4;
                    peg$currPos++;
                } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e4);
                    }
                }
                if (s6 !== peg$FAILED) {
                    s7 = peg$parse_();
                    s8 = peg$parseassignmentOp();
                    if (s8 !== peg$FAILED) {
                        s9 = peg$parse_nl();
                        s10 = peg$parseinnerBlockOrExpression();
                        if (s10 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f8(s1, s4, s10);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseassignmentOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 10;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 61) {
            s0 = peg$c5;
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e6);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e5);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsefunctionParameters() {
        var s0, s1, s2;
        var key = peg$currPos * 76 + 11;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = [];
        s1 = peg$parsedollarIdentifier();
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$currPos;
            s2 = peg$parsecommaSeparator();
            if (s2 !== peg$FAILED) {
                s2 = peg$parsedollarIdentifier();
                if (s2 === peg$FAILED) {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                } else {
                    s1 = s2;
                }
            } else {
                s1 = s2;
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseexpression() {
        var s0;
        var key = peg$currPos * 76 + 12;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parseifthenelse();
        if (s0 === peg$FAILED) {
            s0 = peg$parseternary();
            if (s0 === peg$FAILED) {
                s0 = peg$parselogicalOr();
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseifthenelse() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11;
        var key = peg$currPos * 76 + 13;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c6) {
            s1 = peg$c6;
            peg$currPos += 2;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e7);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse__nl();
            if (s2 !== peg$FAILED) {
                s3 = peg$parselogicalOr();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse__nl();
                    if (s4 !== peg$FAILED) {
                        if (input.substr(peg$currPos, 4) === peg$c7) {
                            s5 = peg$c7;
                            peg$currPos += 4;
                        } else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e8);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$parse__nl();
                            if (s6 !== peg$FAILED) {
                                s7 = peg$parseinnerBlockOrExpression();
                                if (s7 !== peg$FAILED) {
                                    s8 = peg$parse__nl();
                                    if (s8 !== peg$FAILED) {
                                        if (input.substr(peg$currPos, 4) === peg$c8) {
                                            s9 = peg$c8;
                                            peg$currPos += 4;
                                        } else {
                                            s9 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$e9);
                                            }
                                        }
                                        if (s9 !== peg$FAILED) {
                                            s10 = peg$parse__nl();
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parseifthenelse();
                                                if (s11 === peg$FAILED) {
                                                    s11 = peg$parseinnerBlockOrExpression();
                                                }
                                                if (s11 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s0 = peg$f9(s3, s7, s11);
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseternary() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
        var key = peg$currPos * 76 + 14;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parselogicalOr();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (input.charCodeAt(peg$currPos) === 63) {
                s3 = peg$c9;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e10);
                }
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$parselogicalOr();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_();
                    if (input.charCodeAt(peg$currPos) === 58) {
                        s7 = peg$c10;
                        peg$currPos++;
                    } else {
                        s7 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e11);
                        }
                    }
                    if (s7 !== peg$FAILED) {
                        s8 = peg$parse_nl();
                        s9 = peg$parseternary();
                        if (s9 === peg$FAILED) {
                            s9 = peg$parselogicalOr();
                        }
                        if (s9 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f10(s1, s5, s9);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parselogicalOr() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 15;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parselogicalAnd();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse_();
            s5 = peg$parselogicalOrOp();
            if (s5 !== peg$FAILED) {
                s6 = peg$parse_nl();
                s7 = peg$parselogicalAnd();
                if (s7 !== peg$FAILED) {
                    s3 = [
                        s5,
                        s7
                    ];
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse_();
                s5 = peg$parselogicalOrOp();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_nl();
                    s7 = peg$parselogicalAnd();
                    if (s7 !== peg$FAILED) {
                        s3 = [
                            s5,
                            s7
                        ];
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f11(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parselogicalOrOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 16;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c11) {
            s0 = peg$c11;
            peg$currPos += 2;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e13);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parselogicalAnd() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 17;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseequality();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse_();
            s5 = peg$parselogicalAndOp();
            if (s5 !== peg$FAILED) {
                s6 = peg$parse_nl();
                s7 = peg$parseequality();
                if (s7 !== peg$FAILED) {
                    s3 = [
                        s5,
                        s7
                    ];
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse_();
                s5 = peg$parselogicalAndOp();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_nl();
                    s7 = peg$parseequality();
                    if (s7 !== peg$FAILED) {
                        s3 = [
                            s5,
                            s7
                        ];
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f12(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parselogicalAndOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 18;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c12) {
            s0 = peg$c12;
            peg$currPos += 2;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e14);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseequality() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 19;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parserelational();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            s3 = peg$parseequalityOp();
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$parserelational();
                if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f13(s1, s3, s5);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$parserelational();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseequalityOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 20;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c13) {
            s0 = peg$c13;
            peg$currPos += 2;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e15);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c14) {
                s0 = peg$c14;
                peg$currPos += 2;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e16);
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parserelational() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 21;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsecredibleInterval();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            s3 = peg$parserelationalOp();
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$parsecredibleInterval();
                if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f14(s1, s3, s5);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$parsecredibleInterval();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parserelationalOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 22;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c15) {
            s0 = peg$c15;
            peg$currPos += 2;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e17);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 60) {
                s0 = peg$c16;
                peg$currPos++;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e18);
                }
            }
            if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c17) {
                    s0 = peg$c17;
                    peg$currPos += 2;
                } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e19);
                    }
                }
                if (s0 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 62) {
                        s0 = peg$c18;
                        peg$currPos++;
                    } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e20);
                        }
                    }
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecredibleInterval() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 23;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseadditive();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse__();
            if (s4 !== peg$FAILED) {
                s5 = peg$parsecredibleIntervalOp();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse__nl();
                    if (s6 !== peg$FAILED) {
                        s7 = peg$parseadditive();
                        if (s7 !== peg$FAILED) {
                            s3 = [
                                s5,
                                s7
                            ];
                        } else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse__();
                if (s4 !== peg$FAILED) {
                    s5 = peg$parsecredibleIntervalOp();
                    if (s5 !== peg$FAILED) {
                        s6 = peg$parse__nl();
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parseadditive();
                            if (s7 !== peg$FAILED) {
                                s3 = [
                                    s5,
                                    s7
                                ];
                            } else {
                                peg$currPos = s3;
                                s3 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f15(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecredibleIntervalOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 24;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c19) {
            s0 = peg$c19;
            peg$currPos += 2;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e21);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseadditive() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 25;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsemultiplicative();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse_();
            s5 = peg$parseadditiveOp();
            if (s5 !== peg$FAILED) {
                s6 = peg$parse_nl();
                s7 = peg$parsemultiplicative();
                if (s7 !== peg$FAILED) {
                    s3 = [
                        s5,
                        s7
                    ];
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse_();
                s5 = peg$parseadditiveOp();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_nl();
                    s7 = peg$parsemultiplicative();
                    if (s7 !== peg$FAILED) {
                        s3 = [
                            s5,
                            s7
                        ];
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f16(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseadditiveOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 26;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 43) {
            s0 = peg$c20;
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e22);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
                s0 = peg$c21;
                peg$currPos++;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e23);
                }
            }
            if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c22) {
                    s0 = peg$c22;
                    peg$currPos += 2;
                } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e24);
                    }
                }
                if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c23) {
                        s0 = peg$c23;
                        peg$currPos += 2;
                    } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e25);
                        }
                    }
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsemultiplicative() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 27;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsepower();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse_();
            s5 = peg$parsemultiplicativeOp();
            if (s5 !== peg$FAILED) {
                s6 = peg$parse_nl();
                s7 = peg$parsepower();
                if (s7 !== peg$FAILED) {
                    s3 = [
                        s5,
                        s7
                    ];
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse_();
                s5 = peg$parsemultiplicativeOp();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_nl();
                    s7 = peg$parsepower();
                    if (s7 !== peg$FAILED) {
                        s3 = [
                            s5,
                            s7
                        ];
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f17(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsemultiplicativeOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 28;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 42) {
            s0 = peg$c24;
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e26);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 47) {
                s0 = peg$c25;
                peg$currPos++;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e27);
                }
            }
            if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c26) {
                    s0 = peg$c26;
                    peg$currPos += 2;
                } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e28);
                    }
                }
                if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c27) {
                        s0 = peg$c27;
                        peg$currPos += 2;
                    } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e29);
                        }
                    }
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsepower() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 29;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsechainFunctionCall();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse_();
            s5 = peg$parsepowerOp();
            if (s5 !== peg$FAILED) {
                s6 = peg$parse_nl();
                s7 = peg$parsechainFunctionCall();
                if (s7 !== peg$FAILED) {
                    s3 = [
                        s5,
                        s7
                    ];
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse_();
                s5 = peg$parsepowerOp();
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_nl();
                    s7 = peg$parsechainFunctionCall();
                    if (s7 !== peg$FAILED) {
                        s3 = [
                            s5,
                            s7
                        ];
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f18(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsepowerOp() {
        var s0, s1;
        var key = peg$currPos * 76 + 30;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 94) {
            s0 = peg$c28;
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e30);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c29) {
                s0 = peg$c29;
                peg$currPos += 2;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e31);
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e12);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsechainFunctionCall() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 31;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseunary();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = peg$parse_();
            if (input.substr(peg$currPos, 2) === peg$c30) {
                s5 = peg$c30;
                peg$currPos += 2;
            } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e32);
                }
            }
            if (s5 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c31) {
                    s5 = peg$c31;
                    peg$currPos += 2;
                } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e33);
                    }
                }
            }
            if (s5 !== peg$FAILED) {
                s6 = peg$parse_nl();
                s7 = peg$parsechainedFunction();
                if (s7 !== peg$FAILED) {
                    s3 = s7;
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = peg$parse_();
                if (input.substr(peg$currPos, 2) === peg$c30) {
                    s5 = peg$c30;
                    peg$currPos += 2;
                } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e32);
                    }
                }
                if (s5 === peg$FAILED) {
                    if (input.substr(peg$currPos, 2) === peg$c31) {
                        s5 = peg$c31;
                        peg$currPos += 2;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e33);
                        }
                    }
                }
                if (s5 !== peg$FAILED) {
                    s6 = peg$parse_nl();
                    s7 = peg$parsechainedFunction();
                    if (s7 !== peg$FAILED) {
                        s3 = s7;
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f19(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsechainedFunction() {
        var s0, s1, s2, s3, s4, s5, s6;
        var key = peg$currPos * 76 + 32;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsecallableBasicValue();
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 40) {
                s2 = peg$c3;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e3);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parse_nl();
                s4 = peg$parsefunctionArguments();
                s5 = peg$parse_nl();
                if (input.charCodeAt(peg$currPos) === 41) {
                    s6 = peg$c4;
                    peg$currPos++;
                } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e4);
                    }
                }
                if (s6 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f20(s1, s4);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsecallableBasicValue();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f21(s1);
            }
            s0 = s1;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecallableBasicValue() {
        var s0;
        var key = peg$currPos * 76 + 33;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsestaticCollectionElement();
        if (s0 === peg$FAILED) {
            s0 = peg$parsevalueConstructor();
            if (s0 === peg$FAILED) {
                s0 = peg$parsevariable();
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseunary() {
        var s0, s1, s2, s3;
        var key = peg$currPos * 76 + 34;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseunaryOperator();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            s3 = peg$parseunary();
            if (s3 === peg$FAILED) {
                s3 = peg$parsepostOperator();
            }
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f22(s1, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$parsepostOperator();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseunaryOperator() {
        var s0, s1;
        var key = peg$currPos * 76 + 35;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (input.charCodeAt(peg$currPos) === 45) {
            s0 = peg$c21;
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e23);
            }
        }
        if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c23) {
                s0 = peg$c23;
                peg$currPos += 2;
            } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e25);
                }
            }
            if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 33) {
                    s0 = peg$c32;
                    peg$currPos++;
                } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e35);
                    }
                }
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e34);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsepostOperator() {
        var s0;
        var key = peg$currPos * 76 + 36;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsecollectionElement();
        if (s0 === peg$FAILED) {
            s0 = peg$parseatom();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsestaticCollectionElement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;
        var key = peg$currPos * 76 + 37;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseatom();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 91) {
                s3 = peg$c33;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e36);
                }
            }
            if (s3 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 46) {
                    s3 = peg$c34;
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e37);
                    }
                }
            }
            peg$silentFails--;
            if (s3 !== peg$FAILED) {
                peg$currPos = s2;
                s2 = undefined;
            } else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$currPos;
                s5 = peg$parse_();
                if (input.charCodeAt(peg$currPos) === 91) {
                    s6 = peg$c33;
                    peg$currPos++;
                } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e36);
                    }
                }
                if (s6 !== peg$FAILED) {
                    s7 = peg$parse_nl();
                    s8 = peg$parseexpression();
                    if (s8 !== peg$FAILED) {
                        s9 = peg$parse_nl();
                        if (input.charCodeAt(peg$currPos) === 93) {
                            s10 = peg$c35;
                            peg$currPos++;
                        } else {
                            s10 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e38);
                            }
                        }
                        if (s10 !== peg$FAILED) {
                            peg$savedPos = s4;
                            s4 = peg$f23(s1, s8);
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 === peg$FAILED) {
                    s4 = peg$currPos;
                    if (input.charCodeAt(peg$currPos) === 46) {
                        s5 = peg$c34;
                        peg$currPos++;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e37);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        s6 = peg$currPos;
                        s7 = peg$parsedollarIdentifier();
                        if (s7 !== peg$FAILED) {
                            s6 = input.substring(s6, peg$currPos);
                        } else {
                            s6 = s7;
                        }
                        if (s6 !== peg$FAILED) {
                            peg$savedPos = s4;
                            s4 = peg$f24(s1, s6);
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                }
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    s4 = peg$currPos;
                    s5 = peg$parse_();
                    if (input.charCodeAt(peg$currPos) === 91) {
                        s6 = peg$c33;
                        peg$currPos++;
                    } else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e36);
                        }
                    }
                    if (s6 !== peg$FAILED) {
                        s7 = peg$parse_nl();
                        s8 = peg$parseexpression();
                        if (s8 !== peg$FAILED) {
                            s9 = peg$parse_nl();
                            if (input.charCodeAt(peg$currPos) === 93) {
                                s10 = peg$c35;
                                peg$currPos++;
                            } else {
                                s10 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$e38);
                                }
                            }
                            if (s10 !== peg$FAILED) {
                                peg$savedPos = s4;
                                s4 = peg$f23(s1, s8);
                            } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 === peg$FAILED) {
                        s4 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 46) {
                            s5 = peg$c34;
                            peg$currPos++;
                        } else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e37);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$currPos;
                            s7 = peg$parsedollarIdentifier();
                            if (s7 !== peg$FAILED) {
                                s6 = input.substring(s6, peg$currPos);
                            } else {
                                s6 = s7;
                            }
                            if (s6 !== peg$FAILED) {
                                peg$savedPos = s4;
                                s4 = peg$f24(s1, s6);
                            } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                }
                peg$savedPos = s0;
                s0 = peg$f25(s1, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecollectionElement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;
        var key = peg$currPos * 76 + 38;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseatom();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 91) {
                s3 = peg$c33;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e36);
                }
            }
            if (s3 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c3;
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e3);
                    }
                }
                if (s3 === peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 46) {
                        s3 = peg$c34;
                        peg$currPos++;
                    } else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e37);
                        }
                    }
                }
            }
            peg$silentFails--;
            if (s3 !== peg$FAILED) {
                peg$currPos = s2;
                s2 = undefined;
            } else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s3 = [];
                s4 = peg$currPos;
                s5 = peg$parse_();
                if (input.charCodeAt(peg$currPos) === 40) {
                    s6 = peg$c3;
                    peg$currPos++;
                } else {
                    s6 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e3);
                    }
                }
                if (s6 !== peg$FAILED) {
                    s7 = peg$parse_nl();
                    s8 = peg$parsefunctionArguments();
                    s9 = peg$parse_nl();
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s10 = peg$c4;
                        peg$currPos++;
                    } else {
                        s10 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e4);
                        }
                    }
                    if (s10 !== peg$FAILED) {
                        peg$savedPos = s4;
                        s4 = peg$f26(s1, s8);
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 === peg$FAILED) {
                    s4 = peg$currPos;
                    s5 = peg$parse_();
                    if (input.charCodeAt(peg$currPos) === 91) {
                        s6 = peg$c33;
                        peg$currPos++;
                    } else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e36);
                        }
                    }
                    if (s6 !== peg$FAILED) {
                        s7 = peg$parse_nl();
                        s8 = peg$parseexpression();
                        if (s8 !== peg$FAILED) {
                            s9 = peg$parse_nl();
                            if (input.charCodeAt(peg$currPos) === 93) {
                                s10 = peg$c35;
                                peg$currPos++;
                            } else {
                                s10 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$e38);
                                }
                            }
                            if (s10 !== peg$FAILED) {
                                peg$savedPos = s4;
                                s4 = peg$f27(s1, s8);
                            } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 === peg$FAILED) {
                        s4 = peg$currPos;
                        if (input.charCodeAt(peg$currPos) === 46) {
                            s5 = peg$c34;
                            peg$currPos++;
                        } else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e37);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s6 = peg$currPos;
                            s7 = peg$parsedollarIdentifier();
                            if (s7 !== peg$FAILED) {
                                s6 = input.substring(s6, peg$currPos);
                            } else {
                                s6 = s7;
                            }
                            if (s6 !== peg$FAILED) {
                                peg$savedPos = s4;
                                s4 = peg$f28(s1, s6);
                            } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    }
                }
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    s4 = peg$currPos;
                    s5 = peg$parse_();
                    if (input.charCodeAt(peg$currPos) === 40) {
                        s6 = peg$c3;
                        peg$currPos++;
                    } else {
                        s6 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e3);
                        }
                    }
                    if (s6 !== peg$FAILED) {
                        s7 = peg$parse_nl();
                        s8 = peg$parsefunctionArguments();
                        s9 = peg$parse_nl();
                        if (input.charCodeAt(peg$currPos) === 41) {
                            s10 = peg$c4;
                            peg$currPos++;
                        } else {
                            s10 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e4);
                            }
                        }
                        if (s10 !== peg$FAILED) {
                            peg$savedPos = s4;
                            s4 = peg$f26(s1, s8);
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 === peg$FAILED) {
                        s4 = peg$currPos;
                        s5 = peg$parse_();
                        if (input.charCodeAt(peg$currPos) === 91) {
                            s6 = peg$c33;
                            peg$currPos++;
                        } else {
                            s6 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e36);
                            }
                        }
                        if (s6 !== peg$FAILED) {
                            s7 = peg$parse_nl();
                            s8 = peg$parseexpression();
                            if (s8 !== peg$FAILED) {
                                s9 = peg$parse_nl();
                                if (input.charCodeAt(peg$currPos) === 93) {
                                    s10 = peg$c35;
                                    peg$currPos++;
                                } else {
                                    s10 = peg$FAILED;
                                    if (peg$silentFails === 0) {
                                        peg$fail(peg$e38);
                                    }
                                }
                                if (s10 !== peg$FAILED) {
                                    peg$savedPos = s4;
                                    s4 = peg$f27(s1, s8);
                                } else {
                                    peg$currPos = s4;
                                    s4 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s4;
                            s4 = peg$FAILED;
                        }
                        if (s4 === peg$FAILED) {
                            s4 = peg$currPos;
                            if (input.charCodeAt(peg$currPos) === 46) {
                                s5 = peg$c34;
                                peg$currPos++;
                            } else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$e37);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$currPos;
                                s7 = peg$parsedollarIdentifier();
                                if (s7 !== peg$FAILED) {
                                    s6 = input.substring(s6, peg$currPos);
                                } else {
                                    s6 = s7;
                                }
                                if (s6 !== peg$FAILED) {
                                    peg$savedPos = s4;
                                    s4 = peg$f28(s1, s6);
                                } else {
                                    peg$currPos = s4;
                                    s4 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s4;
                                s4 = peg$FAILED;
                            }
                        }
                    }
                }
                peg$savedPos = s0;
                s0 = peg$f29(s1, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsefunctionArguments() {
        var s0, s1, s2;
        var key = peg$currPos * 76 + 39;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = [];
        s1 = peg$parseexpression();
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$currPos;
            s2 = peg$parsecommaSeparator();
            if (s2 !== peg$FAILED) {
                s2 = peg$parseexpression();
                if (s2 === peg$FAILED) {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                } else {
                    s1 = s2;
                }
            } else {
                s1 = s2;
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseatom() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 40;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c3;
            peg$currPos++;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e3);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            s3 = peg$parseexpression();
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                if (input.charCodeAt(peg$currPos) === 41) {
                    s5 = peg$c4;
                    peg$currPos++;
                } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e4);
                    }
                }
                if (s5 !== peg$FAILED) {
                    s0 = s3;
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$parsebasicValue();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsebasicValue() {
        var s0;
        var key = peg$currPos * 76 + 41;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsevalueConstructor();
        if (s0 === peg$FAILED) {
            s0 = peg$parsebasicLiteral();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsebasicLiteral() {
        var s0;
        var key = peg$currPos * 76 + 42;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsestring();
        if (s0 === peg$FAILED) {
            s0 = peg$parsenumber();
            if (s0 === peg$FAILED) {
                s0 = peg$parseboolean();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsevariable();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parsevoidLiteral();
                    }
                }
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsevoidLiteral() {
        var s0, s1;
        var key = peg$currPos * 76 + 43;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c36) {
            s1 = peg$c36;
            peg$currPos += 2;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e40);
            }
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f30();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e39);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsevariable() {
        var s0;
        var key = peg$currPos * 76 + 44;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsedollarIdentifierWithModule();
        if (s0 === peg$FAILED) {
            s0 = peg$parsedollarIdentifier();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsedollarIdentifierWithModule() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 45;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$parsemoduleIdentifier();
        if (s2 !== peg$FAILED) {
            s1 = input.substring(s1, peg$currPos);
        } else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 46) {
                s4 = peg$c34;
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e37);
                }
            }
            if (s4 !== peg$FAILED) {
                s5 = peg$parse_nl();
                s6 = peg$currPos;
                s7 = peg$parsemoduleIdentifier();
                if (s7 !== peg$FAILED) {
                    s6 = input.substring(s6, peg$currPos);
                } else {
                    s6 = s7;
                }
                if (s6 !== peg$FAILED) {
                    s3 = s6;
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                if (input.charCodeAt(peg$currPos) === 46) {
                    s4 = peg$c34;
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e37);
                    }
                }
                if (s4 !== peg$FAILED) {
                    s5 = peg$parse_nl();
                    s6 = peg$currPos;
                    s7 = peg$parsemoduleIdentifier();
                    if (s7 !== peg$FAILED) {
                        s6 = input.substring(s6, peg$currPos);
                    } else {
                        s6 = s7;
                    }
                    if (s6 !== peg$FAILED) {
                        s3 = s6;
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            if (input.charCodeAt(peg$currPos) === 46) {
                s3 = peg$c34;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e37);
                }
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$currPos;
                s6 = peg$parsedollarIdentifier();
                if (s6 !== peg$FAILED) {
                    s5 = input.substring(s5, peg$currPos);
                } else {
                    s5 = s6;
                }
                if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f31(s1, s2, s5);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e41);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseidentifier() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 46;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$r0.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e42);
            }
        }
        if (s3 !== peg$FAILED) {
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (peg$r0.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e42);
                    }
                }
            }
        } else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r1.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e43);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r1.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e43);
                    }
                }
            }
            s2 = [
                s2,
                s3
            ];
            s1 = s2;
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f32();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e41);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseunitIdentifier() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 47;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$r2.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e44);
            }
        }
        if (s3 !== peg$FAILED) {
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (peg$r2.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e44);
                    }
                }
            }
        } else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r1.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e43);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r1.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e43);
                    }
                }
            }
            s2 = [
                s2,
                s3
            ];
            s1 = s2;
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f33();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e41);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsedollarIdentifier() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 48;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$r3.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e45);
            }
        }
        if (s3 !== peg$FAILED) {
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (peg$r3.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e45);
                    }
                }
            }
        } else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r4.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e46);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r4.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e46);
                    }
                }
            }
            s2 = [
                s2,
                s3
            ];
            s1 = s2;
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f34();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e41);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsemoduleIdentifier() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 49;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$r5.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e47);
            }
        }
        if (s3 !== peg$FAILED) {
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (peg$r5.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e47);
                    }
                }
            }
        } else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r1.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e43);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r1.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e43);
                    }
                }
            }
            s2 = [
                s2,
                s3
            ];
            s1 = s2;
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f35();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e41);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsestring() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 50;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c37;
            peg$currPos++;
        } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e49);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r6.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e50);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r6.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e50);
                    }
                }
            }
            if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c37;
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e49);
                }
            }
            if (s4 !== peg$FAILED) {
                s1 = s3;
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f36(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c38;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e51);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = [];
                if (peg$r7.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e52);
                    }
                }
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    if (peg$r7.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e52);
                        }
                    }
                }
                if (input.charCodeAt(peg$currPos) === 34) {
                    s4 = peg$c38;
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e51);
                    }
                }
                if (s4 !== peg$FAILED) {
                    s1 = s3;
                } else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f37(s1);
            }
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e48);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsenumber() {
        var s0, s1, s2;
        var key = peg$currPos * 76 + 51;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsefloat();
        if (s1 === peg$FAILED) {
            s1 = peg$parseinteger();
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parseunitIdentifier();
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            peg$savedPos = s0;
            s0 = peg$f38(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseinteger() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 52;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsed();
        if (s2 !== peg$FAILED) {
            while(s2 !== peg$FAILED){
                s1.push(s2);
                s2 = peg$parsed();
            }
        } else {
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 46) {
                s3 = peg$c34;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e37);
                }
            }
            peg$silentFails--;
            if (s3 === peg$FAILED) {
                s2 = undefined;
            } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$currPos;
                peg$silentFails++;
                if (peg$r8.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e54);
                    }
                }
                peg$silentFails--;
                if (s4 === peg$FAILED) {
                    s3 = undefined;
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f39();
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e53);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsefloat() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var key = peg$currPos * 76 + 53;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = peg$currPos;
        s3 = peg$currPos;
        s4 = [];
        s5 = peg$parsed();
        if (s5 !== peg$FAILED) {
            while(s5 !== peg$FAILED){
                s4.push(s5);
                s5 = peg$parsed();
            }
        } else {
            s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 46) {
                s5 = peg$c34;
                peg$currPos++;
            } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e37);
                }
            }
            if (s5 !== peg$FAILED) {
                s6 = [];
                s7 = peg$parsed();
                while(s7 !== peg$FAILED){
                    s6.push(s7);
                    s7 = peg$parsed();
                }
                s4 = [
                    s4,
                    s5,
                    s6
                ];
                s3 = s4;
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
        } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
        }
        if (s3 === peg$FAILED) {
            s3 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 46) {
                s4 = peg$c34;
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e37);
                }
            }
            if (s4 !== peg$FAILED) {
                s5 = [];
                s6 = peg$parsed();
                if (s6 !== peg$FAILED) {
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsed();
                    }
                } else {
                    s5 = peg$FAILED;
                }
                if (s5 !== peg$FAILED) {
                    s4 = [
                        s4,
                        s5
                    ];
                    s3 = s4;
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
        }
        if (s3 !== peg$FAILED) {
            s4 = peg$parsefloatExponent();
            if (s4 === peg$FAILED) {
                s4 = null;
            }
            s3 = [
                s3,
                s4
            ];
            s2 = s3;
        } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
            s2 = peg$currPos;
            s3 = [];
            s4 = peg$parsed();
            if (s4 !== peg$FAILED) {
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    s4 = peg$parsed();
                }
            } else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parsefloatExponent();
                if (s4 !== peg$FAILED) {
                    s3 = [
                        s3,
                        s4
                    ];
                    s2 = s3;
                } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
        }
        if (s2 !== peg$FAILED) {
            s1 = input.substring(s1, peg$currPos);
        } else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f40();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e53);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsefloatExponent() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 54;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        if (peg$r8.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e54);
            }
        }
        if (s1 !== peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c21;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e23);
                }
            }
            if (s2 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 43) {
                    s2 = peg$c20;
                    peg$currPos++;
                } else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e22);
                    }
                }
            }
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            s3 = [];
            s4 = peg$parsed();
            if (s4 !== peg$FAILED) {
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    s4 = peg$parsed();
                }
            } else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s1 = [
                    s1,
                    s2,
                    s3
                ];
                s0 = s1;
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsed() {
        var s0;
        var key = peg$currPos * 76 + 55;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        if (peg$r9.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e55);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseboolean() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 56;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 4) === peg$c39) {
            s1 = peg$c39;
            peg$currPos += 4;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e57);
            }
        }
        if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 5) === peg$c40) {
                s1 = peg$c40;
                peg$currPos += 5;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e58);
                }
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            peg$silentFails++;
            if (peg$r10.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e59);
                }
            }
            peg$silentFails--;
            if (s3 === peg$FAILED) {
                s2 = undefined;
            } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$currPos;
                peg$silentFails++;
                if (peg$r11.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e60);
                    }
                }
                peg$silentFails--;
                if (s4 === peg$FAILED) {
                    s3 = undefined;
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f41();
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e56);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsevalueConstructor() {
        var s0;
        var key = peg$currPos * 76 + 57;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parserecordConstructor();
        if (s0 === peg$FAILED) {
            s0 = peg$parsearrayConstructor();
            if (s0 === peg$FAILED) {
                s0 = peg$parselambda();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsequotedInnerBlock();
                }
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parselambda() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;
        var key = peg$currPos * 76 + 58;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c0;
            peg$currPos++;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e0);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            if (input.charCodeAt(peg$currPos) === 124) {
                s3 = peg$c41;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e61);
                }
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$parsefunctionParameters();
                s6 = peg$parse_nl();
                if (input.charCodeAt(peg$currPos) === 124) {
                    s7 = peg$c41;
                    peg$currPos++;
                } else {
                    s7 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e61);
                    }
                }
                if (s7 !== peg$FAILED) {
                    s8 = peg$parse_nl();
                    s9 = peg$parsestatementsList();
                    if (s9 !== peg$FAILED) {
                        s10 = peg$currPos;
                        s11 = peg$parsestatementSeparator();
                        if (s11 !== peg$FAILED) {
                            s12 = peg$parseexpression();
                            if (s12 !== peg$FAILED) {
                                s10 = s12;
                            } else {
                                peg$currPos = s10;
                                s10 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s10;
                            s10 = peg$FAILED;
                        }
                        if (s10 !== peg$FAILED) {
                            s11 = peg$parse_nl();
                            if (input.charCodeAt(peg$currPos) === 125) {
                                s12 = peg$c1;
                                peg$currPos++;
                            } else {
                                s12 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$e1);
                                }
                            }
                            if (s12 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f42(s5, s9, s10);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c0;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e0);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_nl();
                if (input.charCodeAt(peg$currPos) === 124) {
                    s3 = peg$c41;
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e61);
                    }
                }
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_nl();
                    s5 = peg$parsefunctionParameters();
                    s6 = peg$parse_nl();
                    if (input.charCodeAt(peg$currPos) === 124) {
                        s7 = peg$c41;
                        peg$currPos++;
                    } else {
                        s7 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e61);
                        }
                    }
                    if (s7 !== peg$FAILED) {
                        s8 = peg$parse_nl();
                        s9 = peg$parseexpression();
                        if (s9 !== peg$FAILED) {
                            s10 = peg$parse_nl();
                            if (input.charCodeAt(peg$currPos) === 125) {
                                s11 = peg$c1;
                                peg$currPos++;
                            } else {
                                s11 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$e1);
                                }
                            }
                            if (s11 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f43(s5, s9);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsearrayConstructor() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 59;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
            s1 = peg$c33;
            peg$currPos++;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e36);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            if (input.charCodeAt(peg$currPos) === 93) {
                s3 = peg$c35;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e38);
                }
            }
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f44();
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 91) {
                s1 = peg$c33;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e36);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_nl();
                s3 = peg$parsearray_elements();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_nl();
                    if (input.charCodeAt(peg$currPos) === 93) {
                        s5 = peg$c35;
                        peg$currPos++;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e38);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f45(s3);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e62);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsearray_elements() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 60;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        s3 = peg$parseexpression();
        while(s3 !== peg$FAILED){
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parsecommaSeparator();
            if (s4 !== peg$FAILED) {
                s4 = peg$parseexpression();
                if (s4 === peg$FAILED) {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                } else {
                    s3 = s4;
                }
            } else {
                s3 = s4;
            }
        }
        if (s2.length < 1) {
            peg$currPos = s1;
            s1 = peg$FAILED;
        } else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsecommaSeparator();
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            s0 = s1;
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parserecordConstructor() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 61;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 123) {
            s1 = peg$c0;
            peg$currPos++;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e0);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_nl();
            if (input.charCodeAt(peg$currPos) === 125) {
                s3 = peg$c1;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e1);
                }
            }
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f46();
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c0;
                peg$currPos++;
            } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e0);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_nl();
                s3 = peg$parsearray_recordEntries();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_nl();
                    if (input.charCodeAt(peg$currPos) === 125) {
                        s5 = peg$c1;
                        peg$currPos++;
                    } else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e1);
                        }
                    }
                    if (s5 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f47(s3);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e63);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsearray_recordEntries() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 62;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        s3 = peg$parsekeyValuePair();
        while(s3 !== peg$FAILED){
            s2.push(s3);
            s3 = peg$currPos;
            s4 = peg$parsecommaSeparator();
            if (s4 !== peg$FAILED) {
                s4 = peg$parsekeyValuePair();
                if (s4 === peg$FAILED) {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                } else {
                    s3 = s4;
                }
            } else {
                s3 = s4;
            }
        }
        if (s2.length < 1) {
            peg$currPos = s1;
            s1 = peg$FAILED;
        } else {
            s1 = s2;
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$parsecommaSeparator();
            if (s2 === peg$FAILED) {
                s2 = null;
            }
            s0 = s1;
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsekeyValuePair() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 63;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parseexpression();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            if (input.charCodeAt(peg$currPos) === 58) {
                s3 = peg$c10;
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e11);
                }
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_nl();
                s5 = peg$parseexpression();
                if (s5 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f48(s1, s5);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parse_() {
        var s0, s1;
        var key = peg$currPos * 76 + 64;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = [];
        s1 = peg$parsewhiteSpaceCharactersOrComment();
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$parsewhiteSpaceCharactersOrComment();
        }
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
            peg$fail(peg$e64);
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parse_nl() {
        var s0, s1;
        var key = peg$currPos * 76 + 65;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = [];
        s1 = peg$parsewhiteSpaceCharactersOrComment();
        if (s1 === peg$FAILED) {
            s1 = peg$parsecommentOrNewLine();
        }
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$parsewhiteSpaceCharactersOrComment();
            if (s1 === peg$FAILED) {
                s1 = peg$parsecommentOrNewLine();
            }
        }
        peg$silentFails--;
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
            peg$fail(peg$e64);
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parse__() {
        var s0, s1;
        var key = peg$currPos * 76 + 66;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = [];
        s1 = peg$parsewhiteSpaceCharactersOrComment();
        if (s1 !== peg$FAILED) {
            while(s1 !== peg$FAILED){
                s0.push(s1);
                s1 = peg$parsewhiteSpaceCharactersOrComment();
            }
        } else {
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e64);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parse__nl() {
        var s0, s1;
        var key = peg$currPos * 76 + 67;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = [];
        s1 = peg$parsewhiteSpaceCharactersOrComment();
        if (s1 === peg$FAILED) {
            s1 = peg$parsecommentOrNewLine();
        }
        if (s1 !== peg$FAILED) {
            while(s1 !== peg$FAILED){
                s0.push(s1);
                s1 = peg$parsewhiteSpaceCharactersOrComment();
                if (s1 === peg$FAILED) {
                    s1 = peg$parsecommentOrNewLine();
                }
            }
        } else {
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e64);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsestatementSeparator() {
        var s0, s1, s2, s3;
        var key = peg$currPos * 76 + 68;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parse_();
        s2 = [];
        if (input.charCodeAt(peg$currPos) === 59) {
            s3 = peg$c42;
            peg$currPos++;
        } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e66);
            }
        }
        if (s3 === peg$FAILED) {
            s3 = peg$parsecommentOrNewLine();
        }
        if (s3 !== peg$FAILED) {
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (input.charCodeAt(peg$currPos) === 59) {
                    s3 = peg$c42;
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e66);
                    }
                }
                if (s3 === peg$FAILED) {
                    s3 = peg$parsecommentOrNewLine();
                }
            }
        } else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = peg$parse_nl();
            s1 = [
                s1,
                s2,
                s3
            ];
            s0 = s1;
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e65);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecommaSeparator() {
        var s0, s1, s2, s3;
        var key = peg$currPos * 76 + 69;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (input.charCodeAt(peg$currPos) === 44) {
            s2 = peg$c43;
            peg$currPos++;
        } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e68);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = peg$parse_nl();
            s1 = [
                s1,
                s2,
                s3
            ];
            s0 = s1;
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e67);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecommentOrNewLine() {
        var s0, s1, s2;
        var key = peg$currPos * 76 + 70;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsefinalComment();
        if (s1 === peg$FAILED) {
            s1 = null;
        }
        s2 = peg$parsenewLine();
        if (s2 !== peg$FAILED) {
            s1 = [
                s1,
                s2
            ];
            s0 = s1;
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsenewLine() {
        var s0, s1;
        var key = peg$currPos * 76 + 71;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (peg$r12.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e70);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e69);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsefinalComment() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 76 + 72;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$parse_();
        if (input.substr(peg$currPos, 2) === peg$c44) {
            s2 = peg$c44;
            peg$currPos += 2;
        } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e72);
            }
        }
        if (s2 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 35) {
                s2 = peg$c45;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e73);
                }
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = peg$currPos;
            s4 = [];
            if (peg$r13.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e74);
                }
            }
            while(s5 !== peg$FAILED){
                s4.push(s5);
                if (peg$r13.test(input.charAt(peg$currPos))) {
                    s5 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s5 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e74);
                    }
                }
            }
            s3 = input.substring(s3, peg$currPos);
            peg$savedPos = s0;
            s0 = peg$f49(s3);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e71);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsewhiteSpaceCharactersOrComment() {
        var s0;
        var key = peg$currPos * 76 + 73;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parsewhiteSpaceCharacters();
        if (s0 === peg$FAILED) {
            s0 = peg$parsedelimitedComment();
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsedelimitedComment() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 76 + 74;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c46) {
            s1 = peg$c46;
            peg$currPos += 2;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e76);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            s3 = [];
            if (peg$r14.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e77);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r14.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e77);
                    }
                }
            }
            s2 = input.substring(s2, peg$currPos);
            if (input.substr(peg$currPos, 2) === peg$c47) {
                s3 = peg$c47;
                peg$currPos += 2;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e78);
                }
            }
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f50(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e75);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsewhiteSpaceCharacters() {
        var s0;
        var key = peg$currPos * 76 + 75;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        if (peg$r15.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e79);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
    } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
}
 //# sourceMappingURL=peggyParser.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/ast/parse.js


const makeParseError = (message, location)=>({
        type: "SyntaxError",
        message,
        location
    });
const parse_parse = (expr, source)=>{
    try {
        const comments = [];
        const parsed = peg$parse(expr, {
            grammarSource: source,
            comments
        });
        parsed.comments = comments;
        return result_Ok(parsed);
    } catch (e) {
        if (e instanceof peg$SyntaxError) {
            return result_Error({
                type: "SyntaxError",
                location: e.location,
                message: e.message
            });
        } else {
            throw e;
        }
    }
};
const nodeToString = (node)=>{
    switch(node.type){
        case "Block":
        case "Program":
            return "{" + node.statements.map(nodeToString).join("; ") + "}";
        case "Array":
            return "[" + node.elements.map(nodeToString).join("; ") + "]";
        case "Record":
            return "{" + node.elements.map(nodeToString).join(", ") + "}";
        case "Boolean":
            return String(node.value);
        case "Call":
            return "(" + nodeToString(node.fn) + " " + node.args.map(nodeToString).join(" ") + ")";
        case "InfixCall":
            return "(" + nodeToString(node.args[0]) + " " + node.op + " " + nodeToString(node.args[1]) + ")";
        case "Pipe":
            return "(" + nodeToString(node.leftArg) + " -> " + nodeToString(node.fn) + "(" + node.rightArgs.map(nodeToString).join(",") + "))";
        case "DotLookup":
            return nodeToString(node.arg) + "." + node.key;
        case "BracketLookup":
            return nodeToString(node.arg) + "[" + nodeToString(node.key) + "]";
        case "UnaryCall":
            return "(" + node.op + nodeToString(node.arg) + ")";
        case "Float":
            return String(node.value);
        case "Identifier":
            return `:${node.value}`;
        case "Integer":
            return String(node.value);
        case "KeyValue":
            return nodeToString(node.key) + ": " + nodeToString(node.value);
        case "Lambda":
            return "{|" + node.args.map(nodeToString).join(",") + "| " + nodeToString(node.body) + "}";
        case "LetStatement":
            return nodeToString(node.variable) + " = " + nodeToString(node.value);
        case "DefunStatement":
            return nodeToString(node.variable) + " = " + nodeToString(node.value);
        case "ModuleIdentifier":
            return `@${node.value}`;
        case "String":
            return `'${node.value}'`;
        case "Ternary":
            return "(::$$_ternary_$$ " + nodeToString(node.condition) + " " + nodeToString(node.trueExpression) + " " + nodeToString(node.falseExpression) + ")";
        case "Void":
            return "()";
        default:
            throw new Error(`Unknown node: ${node}`);
    }
};
const toStringError = (error)=>{
    return `Syntax Error: ${error.message}}`;
};
const nodeResultToString = (r)=>{
    if (!r.ok) {
        return toStringError(r.value);
    }
    return nodeToString(r.value);
}; //# sourceMappingURL=parse.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqProject/IncludeParser.js
function IncludeParser_peg$subclass(child, parent) {
    function C() {
        this.constructor = child;
    }
    C.prototype = parent.prototype;
    child.prototype = new C();
}
function IncludeParser_peg$SyntaxError(message, expected, found, location) {
    var self = Error.call(this, message);
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(self, IncludeParser_peg$SyntaxError.prototype);
    }
    self.expected = expected;
    self.found = found;
    self.location = location;
    self.name = "SyntaxError";
    return self;
}
IncludeParser_peg$subclass(IncludeParser_peg$SyntaxError, Error);
function IncludeParser_peg$padEnd(str, targetLength, padString) {
    padString = padString || " ";
    if (str.length > targetLength) {
        return str;
    }
    targetLength -= str.length;
    padString += padString.repeat(targetLength);
    return str + padString.slice(0, targetLength);
}
IncludeParser_peg$SyntaxError.prototype.format = function(sources) {
    var str = "Error: " + this.message;
    if (this.location) {
        var src = null;
        var k;
        for(k = 0; k < sources.length; k++){
            if (sources[k].source === this.location.source) {
                src = sources[k].text.split(/\r\n|\n|\r/g);
                break;
            }
        }
        var s = this.location.start;
        var offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
        var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
        if (src) {
            var e = this.location.end;
            var filler = IncludeParser_peg$padEnd("", offset_s.line.toString().length, " ");
            var line = src[s.line - 1];
            var last = s.line === e.line ? e.column : line.length + 1;
            var hatLen = last - s.column || 1;
            str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + IncludeParser_peg$padEnd("", s.column - 1, " ") + IncludeParser_peg$padEnd("", hatLen, "^");
        } else {
            str += "\n at " + loc;
        }
    }
    return str;
};
IncludeParser_peg$SyntaxError.buildMessage = function(expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
            return '"' + literalEscape(expectation.text) + '"';
        },
        class: function(expectation) {
            var escapedParts = expectation.parts.map(function(part) {
                return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
            });
            return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
        },
        any: function() {
            return "any character";
        },
        end: function() {
            return "end of input";
        },
        other: function(expectation) {
            return expectation.description;
        }
    };
    function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
    }
    function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
            return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
            return "\\x" + hex(ch);
        });
    }
    function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
            return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
            return "\\x" + hex(ch);
        });
    }
    function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected) {
        var descriptions = expected.map(describeExpectation);
        var i, j;
        descriptions.sort();
        if (descriptions.length > 0) {
            for(i = 1, j = 1; i < descriptions.length; i++){
                if (descriptions[i - 1] !== descriptions[i]) {
                    descriptions[j] = descriptions[i];
                    j++;
                }
            }
            descriptions.length = j;
        }
        switch(descriptions.length){
            case 1:
                return descriptions[0];
            case 2:
                return descriptions[0] + " or " + descriptions[1];
            default:
                return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
    }
    function describeFound(found) {
        return found ? '"' + literalEscape(found) + '"' : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function IncludeParser_peg$parse(input, options) {
    options = options !== undefined ? options : {};
    var peg$FAILED = {};
    var peg$source = options.grammarSource;
    var peg$startRuleFunctions = {
        start: peg$parsestart
    };
    var peg$startRuleFunction = peg$parsestart;
    var peg$c0 = "#";
    var peg$c1 = "#include";
    var peg$c2 = "as";
    var peg$c3 = "'";
    var peg$c4 = '"';
    var peg$c5 = "//";
    var peg$c6 = "/*";
    var peg$c7 = "*/";
    var peg$r0 = /^[^']/;
    var peg$r1 = /^[^"]/;
    var peg$r2 = /^[^*]/;
    var peg$r3 = /^[ \t]/;
    var peg$r4 = /^[\n\r]/;
    var peg$r5 = /^[^\r\n]/;
    var peg$r6 = /^[_a-z]/;
    var peg$r7 = /^[_a-z0-9]/i;
    var peg$e0 = peg$literalExpectation("#", false);
    var peg$e1 = peg$literalExpectation("#include", false);
    var peg$e2 = peg$literalExpectation("as", false);
    var peg$e3 = peg$otherExpectation("string");
    var peg$e4 = peg$literalExpectation("'", false);
    var peg$e5 = peg$classExpectation([
        "'"
    ], true, false);
    var peg$e6 = peg$literalExpectation('"', false);
    var peg$e7 = peg$classExpectation([
        '"'
    ], true, false);
    var peg$e8 = peg$otherExpectation("comment");
    var peg$e9 = peg$literalExpectation("//", false);
    var peg$e10 = peg$literalExpectation("/*", false);
    var peg$e11 = peg$classExpectation([
        "*"
    ], true, false);
    var peg$e12 = peg$literalExpectation("*/", false);
    var peg$e13 = peg$otherExpectation("white space");
    var peg$e14 = peg$classExpectation([
        " ",
        "	"
    ], false, false);
    var peg$e15 = peg$otherExpectation("newline");
    var peg$e16 = peg$classExpectation([
        "\n",
        "\r"
    ], false, false);
    var peg$e17 = peg$otherExpectation("code");
    var peg$e18 = peg$classExpectation([
        "\r",
        "\n"
    ], true, false);
    var peg$e19 = peg$otherExpectation("identifier");
    var peg$e20 = peg$classExpectation([
        "_",
        [
            "a",
            "z"
        ]
    ], false, false);
    var peg$e21 = peg$classExpectation([
        "_",
        [
            "a",
            "z"
        ],
        [
            "0",
            "9"
        ]
    ], false, true);
    var peg$f0 = function(head, tail) {
        return [
            head,
            ...tail
        ].filter((e)=>e != "");
    };
    var peg$f1 = function() {
        return [];
    };
    var peg$f2 = function(file, variable) {
        return [
            !variable ? "" : variable,
            file
        ];
    };
    var peg$f3 = function(characters) {
        return characters.join("");
    };
    var peg$f4 = function(characters) {
        return characters.join("");
    };
    var peg$f5 = function() {
        return "";
    };
    var peg$f6 = function() {
        return "";
    };
    var peg$f7 = function() {
        return text();
    };
    var peg$currPos = 0;
    var peg$savedPos = 0;
    var peg$posDetailsCache = [
        {
            line: 1,
            column: 1
        }
    ];
    var peg$maxFailPos = 0;
    var peg$maxFailExpected = [];
    var peg$silentFails = 0;
    var peg$resultsCache = {};
    var peg$result;
    if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) {
            throw new Error("Can't start parsing from rule \"" + options.startRule + '".');
        }
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function text() {
        return input.substring(peg$savedPos, peg$currPos);
    }
    function offset() {
        return peg$savedPos;
    }
    function range() {
        return {
            source: peg$source,
            start: peg$savedPos,
            end: peg$currPos
        };
    }
    function location() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
    }
    function expected(description, location) {
        location = location !== undefined ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([
            peg$otherExpectation(description)
        ], input.substring(peg$savedPos, peg$currPos), location);
    }
    function error(message, location) {
        location = location !== undefined ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location);
    }
    function peg$literalExpectation(text, ignoreCase) {
        return {
            type: "literal",
            text: text,
            ignoreCase: ignoreCase
        };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
        return {
            type: "class",
            parts: parts,
            inverted: inverted,
            ignoreCase: ignoreCase
        };
    }
    function peg$anyExpectation() {
        return {
            type: "any"
        };
    }
    function peg$endExpectation() {
        return {
            type: "end"
        };
    }
    function peg$otherExpectation(description) {
        return {
            type: "other",
            description: description
        };
    }
    function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
            return details;
        } else {
            p = pos - 1;
            while(!peg$posDetailsCache[p]){
                p--;
            }
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column
            };
            while(p < pos){
                if (input.charCodeAt(p) === 10) {
                    details.line++;
                    details.column = 1;
                } else {
                    details.column++;
                }
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    function peg$computeLocation(startPos, endPos, offset) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        var res = {
            source: peg$source,
            start: {
                offset: startPos,
                line: startPosDetails.line,
                column: startPosDetails.column
            },
            end: {
                offset: endPos,
                line: endPosDetails.line,
                column: endPosDetails.column
            }
        };
        if (offset && peg$source && typeof peg$source.offset === "function") {
            res.start = peg$source.offset(res.start);
            res.end = peg$source.offset(res.end);
        }
        return res;
    }
    function peg$fail(expected) {
        if (peg$currPos < peg$maxFailPos) {
            return;
        }
        if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected);
    }
    function peg$buildSimpleError(message, location) {
        return new IncludeParser_peg$SyntaxError(message, null, null, location);
    }
    function peg$buildStructuredError(expected, found, location) {
        return new IncludeParser_peg$SyntaxError(IncludeParser_peg$SyntaxError.buildMessage(expected, found), expected, found, location);
    }
    function peg$parsestart() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 12 + 0;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parsenewLine();
        if (s2 === peg$FAILED) {
            s2 = peg$parse_();
            if (s2 === peg$FAILED) {
                s2 = peg$parsecomment();
                if (s2 === peg$FAILED) {
                    s2 = peg$parsedelimitedComment();
                }
            }
        }
        while(s2 !== peg$FAILED){
            s1.push(s2);
            s2 = peg$parsenewLine();
            if (s2 === peg$FAILED) {
                s2 = peg$parse_();
                if (s2 === peg$FAILED) {
                    s2 = peg$parsecomment();
                    if (s2 === peg$FAILED) {
                        s2 = peg$parsedelimitedComment();
                    }
                }
            }
        }
        s2 = peg$parseincludes();
        if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parsenewLine();
            while(s4 !== peg$FAILED){
                s3.push(s4);
                s4 = peg$parsenewLine();
            }
            s4 = peg$parseignore();
            s0 = s2;
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseincludes() {
        var s0, s1, s2, s3, s4, s5;
        var key = peg$currPos * 12 + 1;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = peg$parsedependencyStatement();
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$currPos;
            s4 = [];
            s5 = peg$parsenewLine();
            if (s5 !== peg$FAILED) {
                while(s5 !== peg$FAILED){
                    s4.push(s5);
                    s5 = peg$parsenewLine();
                }
            } else {
                s4 = peg$FAILED;
            }
            if (s4 !== peg$FAILED) {
                s5 = peg$parsedependencyStatement();
                if (s5 !== peg$FAILED) {
                    s3 = s5;
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            } else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$currPos;
                s4 = [];
                s5 = peg$parsenewLine();
                if (s5 !== peg$FAILED) {
                    while(s5 !== peg$FAILED){
                        s4.push(s5);
                        s5 = peg$parsenewLine();
                    }
                } else {
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    s5 = peg$parsedependencyStatement();
                    if (s5 !== peg$FAILED) {
                        s3 = s5;
                    } else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
            }
            peg$savedPos = s0;
            s0 = peg$f0(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            if (input.charCodeAt(peg$currPos) === 35) {
                s2 = peg$c0;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e0);
                }
            }
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f1();
            }
            s0 = s1;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsedependencyStatement() {
        var s0;
        var key = peg$currPos * 12 + 2;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$parseincludeStatement();
        if (s0 === peg$FAILED) {
            s0 = peg$parsecomment();
            if (s0 === peg$FAILED) {
                s0 = peg$parsedelimitedComment();
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseincludeStatement() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
        var key = peg$currPos * 12 + 3;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = peg$currPos;
        s1 = [];
        s2 = peg$parse_();
        while(s2 !== peg$FAILED){
            s1.push(s2);
            s2 = peg$parse_();
        }
        if (input.substr(peg$currPos, 8) === peg$c1) {
            s2 = peg$c1;
            peg$currPos += 8;
        } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e1);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            s4 = peg$parse_();
            if (s4 !== peg$FAILED) {
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    s4 = peg$parse_();
                }
            } else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                s4 = peg$parsestring();
                if (s4 !== peg$FAILED) {
                    s5 = peg$currPos;
                    s6 = [];
                    s7 = peg$parse_();
                    if (s7 !== peg$FAILED) {
                        while(s7 !== peg$FAILED){
                            s6.push(s7);
                            s7 = peg$parse_();
                        }
                    } else {
                        s6 = peg$FAILED;
                    }
                    if (s6 !== peg$FAILED) {
                        if (input.substr(peg$currPos, 2) === peg$c2) {
                            s7 = peg$c2;
                            peg$currPos += 2;
                        } else {
                            s7 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$e2);
                            }
                        }
                        if (s7 !== peg$FAILED) {
                            s8 = [];
                            s9 = peg$parse_();
                            if (s9 !== peg$FAILED) {
                                while(s9 !== peg$FAILED){
                                    s8.push(s9);
                                    s9 = peg$parse_();
                                }
                            } else {
                                s8 = peg$FAILED;
                            }
                            if (s8 !== peg$FAILED) {
                                s9 = peg$parseidentifier();
                                if (s9 !== peg$FAILED) {
                                    s5 = s9;
                                } else {
                                    peg$currPos = s5;
                                    s5 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s5;
                                s5 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s5;
                            s5 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s5;
                        s5 = peg$FAILED;
                    }
                    if (s5 === peg$FAILED) {
                        s5 = null;
                    }
                    s6 = [];
                    s7 = peg$parse_();
                    while(s7 !== peg$FAILED){
                        s6.push(s7);
                        s7 = peg$parse_();
                    }
                    s7 = peg$currPos;
                    peg$silentFails++;
                    s8 = peg$parsenewLine();
                    peg$silentFails--;
                    if (s8 !== peg$FAILED) {
                        peg$currPos = s7;
                        s7 = undefined;
                    } else {
                        s7 = peg$FAILED;
                    }
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f2(s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsestring() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 12 + 4;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 39) {
            s2 = peg$c3;
            peg$currPos++;
        } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e4);
            }
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r0.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e5);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r0.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e5);
                    }
                }
            }
            if (input.charCodeAt(peg$currPos) === 39) {
                s4 = peg$c3;
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e4);
                }
            }
            if (s4 !== peg$FAILED) {
                s1 = s3;
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f3(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 34) {
                s2 = peg$c4;
                peg$currPos++;
            } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e6);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = [];
                if (peg$r1.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e7);
                    }
                }
                while(s4 !== peg$FAILED){
                    s3.push(s4);
                    if (peg$r1.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$e7);
                        }
                    }
                }
                if (input.charCodeAt(peg$currPos) === 34) {
                    s4 = peg$c4;
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e6);
                    }
                }
                if (s4 !== peg$FAILED) {
                    s1 = s3;
                } else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f4(s1);
            }
            s0 = s1;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e3);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseignore() {
        var s0, s1;
        var key = peg$currPos * 12 + 5;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        s0 = [];
        s1 = peg$parseany();
        if (s1 === peg$FAILED) {
            s1 = peg$parsenewLine();
            if (s1 === peg$FAILED) {
                s1 = peg$parse_();
            }
        }
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$parseany();
            if (s1 === peg$FAILED) {
                s1 = peg$parsenewLine();
                if (s1 === peg$FAILED) {
                    s1 = peg$parse_();
                }
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsecomment() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 12 + 6;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c5) {
            s1 = peg$c5;
            peg$currPos += 2;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e9);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parseany();
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$parseany();
            }
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parsenewLine();
            peg$silentFails--;
            if (s4 !== peg$FAILED) {
                peg$currPos = s3;
                s3 = undefined;
            } else {
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f5();
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e8);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsedelimitedComment() {
        var s0, s1, s2, s3;
        var key = peg$currPos * 12 + 7;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 2) === peg$c6) {
            s1 = peg$c6;
            peg$currPos += 2;
        } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e10);
            }
        }
        if (s1 !== peg$FAILED) {
            s2 = [];
            if (peg$r2.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e11);
                }
            }
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (peg$r2.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e11);
                    }
                }
            }
            if (input.substr(peg$currPos, 2) === peg$c7) {
                s3 = peg$c7;
                peg$currPos += 2;
            } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e12);
                }
            }
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f6();
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e8);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parse_() {
        var s0, s1;
        var key = peg$currPos * 12 + 8;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (peg$r3.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e14);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e13);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parsenewLine() {
        var s0, s1;
        var key = peg$currPos * 12 + 9;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (peg$r4.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e16);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e15);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseany() {
        var s0, s1;
        var key = peg$currPos * 12 + 10;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        if (peg$r5.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e18);
            }
        }
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e17);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    function peg$parseidentifier() {
        var s0, s1, s2, s3, s4;
        var key = peg$currPos * 12 + 11;
        var cached = peg$resultsCache[key];
        if (cached) {
            peg$currPos = cached.nextPos;
            return cached.result;
        }
        peg$silentFails++;
        s0 = peg$currPos;
        s1 = peg$currPos;
        s2 = [];
        if (peg$r6.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
        } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e20);
            }
        }
        if (s3 !== peg$FAILED) {
            while(s3 !== peg$FAILED){
                s2.push(s3);
                if (peg$r6.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s3 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e20);
                    }
                }
            }
        } else {
            s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
            s3 = [];
            if (peg$r7.test(input.charAt(peg$currPos))) {
                s4 = input.charAt(peg$currPos);
                peg$currPos++;
            } else {
                s4 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$e21);
                }
            }
            while(s4 !== peg$FAILED){
                s3.push(s4);
                if (peg$r7.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$e21);
                    }
                }
            }
            s2 = [
                s2,
                s3
            ];
            s1 = s2;
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f7();
        }
        s0 = s1;
        peg$silentFails--;
        if (s0 === peg$FAILED) {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
                peg$fail(peg$e19);
            }
        }
        peg$resultsCache[key] = {
            nextPos: peg$currPos,
            result: s0
        };
        return s0;
    }
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
    } else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
}
 //# sourceMappingURL=IncludeParser.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqProject/parseIncludes.js





const parseIncludes = (expr)=>{
    try {
        const answer = IncludeParser_peg$parse(expr);
        return result_Ok(answer.map((item)=>[
                item[0],
                item[1]
            ]));
    } catch (e) {
        const peggyError = e;
        return result_Error(new SqError(IError_IError.fromParseError(makeParseError(peggyError.message, peggyError.location))));
    }
}; //# sourceMappingURL=parseIncludes.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/expression/index.js

const eArray = (anArray)=>({
        type: "Array",
        value: anArray
    });
const eBool = (b)=>({
        type: "Value",
        value: vBool(b)
    });
const eCall = (fn, args)=>({
        type: "Call",
        fn,
        args
    });
const eLambda = (parameters, body, name)=>({
        type: "Lambda",
        parameters,
        body,
        name
    });
const eNumber = (x)=>({
        type: "Value",
        value: vNumber(x)
    });
const eRecord = (aMap)=>({
        type: "Record",
        value: aMap
    });
const eString = (s)=>({
        type: "Value",
        value: vString(s)
    });
const eSymbol = (name)=>({
        type: "Symbol",
        value: name
    });
const eBlock = (exprs)=>({
        type: "Block",
        value: exprs
    });
const eProgram = (exprs)=>({
        type: "Program",
        value: exprs
    });
const eLetStatement = (left, right)=>({
        type: "Assign",
        left,
        right
    });
const eTernary = (condition, ifTrue, ifFalse)=>({
        type: "Ternary",
        condition,
        ifTrue,
        ifFalse
    });
const eIdentifier = (name)=>({
        type: "Symbol",
        value: name
    });
const eVoid = ()=>({
        type: "Value",
        value: vVoid()
    });
const expression_toString = (expression)=>{
    switch(expression.type){
        case "Block":
            return `{${expression.value.map(expression_toString).join("; ")}}`;
        case "Program":
            return expression.value.map(expression_toString).join("; ");
        case "Array":
            return `[${expression.value.map(expression_toString).join(", ")}]`;
        case "Record":
            return `{${expression.value.map(([key, value])=>`${expression_toString(key)}: ${expression_toString(value)}`).join(", ")}}`;
        case "Symbol":
            return expression.value;
        case "Ternary":
            return `${expression_toString(expression.condition)} ? (${expression_toString(expression.ifTrue)}) : (${expression_toString(expression.ifFalse)})`;
        case "Assign":
            return `${expression.left} = ${expression_toString(expression.right)}`;
        case "Call":
            return `(${expression_toString(expression.fn)})(${expression.args.map(expression_toString).join(", ")})`;
        case "Lambda":
            return `{|${expression.parameters.join(", ")}| ${expression_toString(expression.body)}}`;
        case "Value":
            return expression.value.toString();
        default:
            return `Unknown expression ${expression}`;
    }
};
 //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/ast/toExpression.js


const INDEX_LOOKUP_FUNCTION = "$_atIndex_$";
const contentFromNode = (ast)=>{
    switch(ast.type){
        case "Block":
            return eBlock(ast.statements.map(fromNode));
        case "Program":
            return eProgram(ast.statements.map(fromNode));
        case "Array":
            return eArray(ast.elements.map(fromNode));
        case "Record":
            return eRecord(ast.elements.map((kv)=>[
                    fromNode(kv.key),
                    fromNode(kv.value)
                ]));
        case "Boolean":
            return eBool(ast.value);
        case "Call":
            return eCall(fromNode(ast.fn), ast.args.map(fromNode));
        case "InfixCall":
            return eCall(Object.assign({
                ast
            }, eSymbol(infixFunctions[ast.op])), ast.args.map(fromNode));
        case "UnaryCall":
            return eCall(Object.assign({
                ast
            }, eSymbol(unaryFunctions[ast.op])), [
                fromNode(ast.arg)
            ]);
        case "Pipe":
            return eCall(fromNode(ast.fn), [
                fromNode(ast.leftArg),
                ...ast.rightArgs.map(fromNode)
            ]);
        case "DotLookup":
            return eCall(Object.assign({
                ast
            }, eSymbol(INDEX_LOOKUP_FUNCTION)), [
                fromNode(ast.arg),
                Object.assign({
                    ast
                }, eString(ast.key))
            ]);
        case "BracketLookup":
            return eCall(Object.assign({
                ast
            }, eSymbol(INDEX_LOOKUP_FUNCTION)), [
                fromNode(ast.arg),
                fromNode(ast.key)
            ]);
        case "Float":
            return eNumber(ast.value);
        case "Identifier":
            return eSymbol(ast.value);
        case "Integer":
            return eNumber(ast.value);
        case "KeyValue":
            return eArray([
                fromNode(ast.key),
                fromNode(ast.value)
            ]);
        case "Lambda":
            return eLambda(ast.args.map((arg)=>{
                if (arg.type !== "Identifier") {
                    throw new Error("Expected identifier node");
                }
                return arg.value;
            }), fromNode(ast.body), ast.name);
        case "LetStatement":
            return eLetStatement(ast.variable.value, fromNode(ast.value));
        case "DefunStatement":
            return eLetStatement(ast.variable.value, fromNode(ast.value));
        case "ModuleIdentifier":
            return eIdentifier(ast.value);
        case "String":
            return eString(ast.value);
        case "Ternary":
            return eTernary(fromNode(ast.condition), fromNode(ast.trueExpression), fromNode(ast.falseExpression));
        case "Void":
            return eVoid();
        default:
            throw new Error(`Unsupported AST value ${ast}`);
    }
};
const fromNode = (ast)=>{
    return Object.assign({
        ast
    }, contentFromNode(ast));
};
const toExpression_expressionFromAst = fromNode; //# sourceMappingURL=toExpression.js.map

// EXTERNAL MODULE: ../../node_modules/immutable/dist/immutable.js
var immutable = __webpack_require__(6276);
;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/bindings.js


const namespaceToString = (namespace)=>{
    return [
        ...namespace.entries()
    ].map(([key, value])=>`${key}: ${value.toString()}`).join(",");
};
class Bindings {
    constructor(namespace, parent){
        this.namespace = namespace;
        this.parent = parent;
    }
    static make() {
        return new Bindings((0,immutable.Map)(), undefined);
    }
    static fromNamespace(namespace) {
        return new Bindings(namespace, undefined);
    }
    get(id) {
        var _a, _b;
        return (_a = this.namespace.get(id)) !== null && _a !== void 0 ? _a : (_b = this.parent) === null || _b === void 0 ? void 0 : _b.get(id);
    }
    set(id, value) {
        return new Bindings(this.namespace.set(id, value), this.parent);
    }
    toString() {
        const pairs = namespaceToString(this.namespace);
        return `{${pairs}}` + (this.parent ? `/ ${this.toString()}` : "");
    }
    extend() {
        return new Bindings((0,immutable.Map)(), this);
    }
    extendWith(ns) {
        return new Bindings(ns, this);
    }
    removeResult() {
        return new Bindings(this.namespace.delete("__result__"), this.parent);
    }
    locals() {
        return this.namespace;
    }
} //# sourceMappingURL=bindings.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/Context.js


const createContext = (stdLib, environment)=>({
        frameStack: FrameStack.make(),
        bindings: Bindings.fromNamespace(stdLib).extend(),
        environment
    });
const currentFunctionName = (t)=>{
    return t.inFunction === undefined ? topFrameName : t.inFunction.getName();
}; //# sourceMappingURL=Context.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/lambda.js



class Lambda {
    constructor(body){
        this.body = body;
    }
    callFrom(args, context, reducer, location) {
        const newContext = Object.assign(Object.assign({}, context), {
            frameStack: context.frameStack.extend(currentFunctionName(context), location),
            inFunction: this
        });
        return rethrowWithFrameStack(()=>{
            return this.body(args, newContext, reducer);
        }, newContext.frameStack);
    }
    call(args, context, reducer) {
        return this.callFrom(args, context, reducer, undefined);
    }
}
class SquiggleLambda extends Lambda {
    constructor(name, parameters, bindings, body, location){
        const lambda = (args, context, reducer)=>{
            const argsLength = args.length;
            const parametersLength = parameters.length;
            if (argsLength !== parametersLength) {
                ErrorMessage["throw"](REArityError(undefined, parametersLength, argsLength));
            }
            let localBindings = bindings;
            for(let i = 0; i < parametersLength; i++){
                localBindings = localBindings.set(parameters[i], args[i]);
            }
            const lambdaContext = {
                bindings: localBindings,
                environment: context.environment,
                frameStack: context.frameStack,
                inFunction: context.inFunction
            };
            const [value] = reducer(body, lambdaContext);
            return value;
        };
        super(lambda);
        this.name = name;
        this.parameters = parameters;
        this.location = location;
    }
    getName() {
        return this.name || "<anonymous>";
    }
    getParameters() {
        return this.parameters;
    }
    toString() {
        return `lambda(${this.parameters.join(",")}=>internal code)`;
    }
}
class BuiltinLambda extends Lambda {
    constructor(name, body){
        super(body);
        this.name = name;
    }
    getName() {
        return this.name;
    }
    getParameters() {
        return [
            "..."
        ];
    }
    toString() {
        return "Builtin function";
    }
} //# sourceMappingURL=lambda.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/math.js


const availableNumbers = [
    [
        "Math.pi",
        Math.PI
    ],
    [
        "Math.e",
        Math.E
    ],
    [
        "Math.ln2",
        Math.LN2
    ],
    [
        "Math.ln10",
        Math.LN10
    ],
    [
        "Math.log2e",
        Math.LOG2E
    ],
    [
        "Math.log10e",
        Math.LOG10E
    ],
    [
        "Math.sqrt2",
        Math.SQRT2
    ],
    [
        "Math.sqrt1_2",
        Math.SQRT1_2
    ],
    [
        "Math.phi",
        1.618033988749895
    ],
    [
        "Math.tau",
        6.283185307179586
    ]
];
const makeMathConstants = ()=>{
    return (0,immutable.Map)(availableNumbers.map(([name, v])=>[
            name,
            vNumber(v)
        ]));
}; //# sourceMappingURL=math.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/registry/fnDefinition.js
function makeDefinition(name, inputs, run) {
    return {
        name,
        inputs,
        run
    };
}
const tryCallFnDefinition = (fn, args, context, reducerFn)=>{
    if (args.length !== fn.inputs.length) {
        return;
    }
    const unpackedArgs = [];
    for(let i = 0; i < args.length; i++){
        const unpackedArg = fn.inputs[i].unpack(args[i]);
        if (unpackedArg === undefined) {
            return;
        }
        unpackedArgs.push(unpackedArg);
    }
    return fn.run(unpackedArgs, context, reducerFn);
};
const fnDefinitionToString = (fn)=>{
    const inputs = fn.inputs.map((t)=>t.getName()).join(", ");
    return `${fn.name}(${inputs})`;
}; //# sourceMappingURL=fnDefinition.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/registry/core.js



const allExamplesWithFns = (r)=>{
    return r.functions.map((fn)=>{
        var _a, _b;
        return (_b = (_a = fn.examples) === null || _a === void 0 ? void 0 : _a.map((example)=>({
                fn,
                example
            }))) !== null && _b !== void 0 ? _b : [];
    }).flat();
};
const allNames = (r)=>[
        ...r.fnNameDict.keys()
    ];
const make = (fns)=>{
    var _a;
    const dict = new Map();
    for (const fn of fns){
        for (const def of fn.definitions){
            const names = [
                ...fn.nameSpace == "" ? [] : [
                    `${fn.nameSpace}.${def.name}`
                ],
                ...fn.requiresNamespace ? [] : [
                    def.name
                ]
            ];
            for (const name of names){
                if (dict.has(name)) {
                    (_a = dict.get(name)) === null || _a === void 0 ? void 0 : _a.push(def);
                } else {
                    dict.set(name, [
                        def
                    ]);
                }
            }
        }
    }
    return {
        functions: fns,
        fnNameDict: dict
    };
};
const call = (registry, fnName, args, context, reducer)=>{
    const definitions = registry.fnNameDict.get(fnName);
    if (definitions === undefined) {
        return result_Error(RESymbolNotFound(fnName));
    }
    const showNameMatchDefinitions = ()=>{
        const defsString = definitions.map(fnDefinitionToString).map((r)=>`[${r}]`).join("; ");
        return `There are function matches for ${fnName}(), but with different arguments: ${defsString}`;
    };
    for (const definition of definitions){
        const callResult = tryCallFnDefinition(definition, args, context, reducer);
        if (callResult !== undefined) {
            return callResult;
        }
    }
    return result_Error(REOther(showNameMatchDefinitions()));
}; //# sourceMappingURL=core.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/registry/frTypes.js

const frNumber = {
    unpack: (v)=>v.type === "Number" ? v.value : undefined,
    getName: ()=>"number"
};
const frString = {
    unpack: (v)=>v.type === "String" ? v.value : undefined,
    getName: ()=>"string"
};
const frBool = {
    unpack: (v)=>v.type === "Bool" ? v.value : undefined,
    getName: ()=>"bool"
};
const frDate = {
    unpack: (v)=>v.type === "Date" ? v.value : undefined,
    getName: ()=>"date"
};
const frTimeDuration = {
    unpack: (v)=>v.type === "TimeDuration" ? v.value : undefined,
    getName: ()=>"duration"
};
const frDistOrNumber = {
    unpack: (v)=>v.type === "Dist" ? v.value : v.type === "Number" ? v.value : undefined,
    getName: ()=>"distribution|number"
};
const frDist = {
    unpack: (v)=>v.type === "Dist" ? v.value : undefined,
    getName: ()=>"distribution"
};
const frLambda = {
    unpack: (v)=>v.type === "Lambda" ? v.value : undefined,
    getName: ()=>"lambda"
};
const frScale = {
    unpack: (v)=>v.type === "Scale" ? v.value : undefined,
    getName: ()=>"scale"
};
const frArray = (itemType)=>{
    return {
        unpack: (v)=>{
            if (v.type !== "Array") {
                return undefined;
            }
            const unpackedArray = [];
            for (const item of v.value){
                const unpackedItem = itemType.unpack(item);
                if (unpackedItem === undefined) {
                    return undefined;
                }
                unpackedArray.push(unpackedItem);
            }
            return unpackedArray;
        },
        getName: ()=>`list(${itemType.getName()})`
    };
};
const frTuple2 = (type1, type2)=>{
    return {
        unpack: (v)=>{
            if (v.type !== "Array") {
                return undefined;
            }
            if (v.value.length !== 2) {
                return undefined;
            }
            const item1 = type1.unpack(v.value[0]);
            const item2 = type2.unpack(v.value[1]);
            if (item1 === undefined || item2 === undefined) {
                return undefined;
            }
            return [
                item1,
                item2
            ];
        },
        getName: ()=>`tuple(${type1.getName()}, ${type2.getName()})`
    };
};
const frDict = (itemType)=>{
    return {
        unpack: (v)=>{
            if (v.type !== "Record") {
                return undefined;
            }
            let unpackedMap = (0,immutable.Map)();
            for (const [key, value] of v.value.entries()){
                const unpackedItem = itemType.unpack(value);
                if (unpackedItem === undefined) {
                    return undefined;
                }
                unpackedMap = unpackedMap.set(key, unpackedItem);
            }
            return unpackedMap;
        },
        getName: ()=>`dict(${itemType.getName()})`
    };
};
const frAny = {
    unpack: (v)=>v,
    getName: ()=>"any"
};
function frRecord(...allKvs) {
    return {
        unpack: (v)=>{
            if (v.type !== "Record") {
                return undefined;
            }
            const r = v.value;
            const result = {};
            for (const [key, valueShape] of allKvs){
                const subvalue = r.get(key);
                if (subvalue === undefined) {
                    if ("isOptional" in valueShape) {
                        continue;
                    }
                    return undefined;
                }
                const unpackedSubvalue = valueShape.unpack(subvalue);
                if (unpackedSubvalue === undefined) {
                    return undefined;
                }
                result[key] = unpackedSubvalue;
            }
            return result;
        },
        getName: ()=>"{" + allKvs.map(([name, frType])=>`${name}: ${frType.getName()}`).join(", ") + "}"
    };
}
const frOptional = (itemType)=>{
    return {
        unpack: (v)=>{
            return itemType.unpack(v);
        },
        getName: ()=>`optional(${itemType.getName()})`,
        isOptional: true
    };
}; //# sourceMappingURL=frTypes.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/registry/helpers.js
var __rest = undefined && undefined.__rest || function(s, e) {
    var t = {};
    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++){
        if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
};






class FnFactory {
    constructor(opts){
        this.nameSpace = opts.nameSpace;
        this.requiresNamespace = opts.requiresNamespace;
    }
    make(args) {
        return Object.assign({
            nameSpace: this.nameSpace,
            requiresNamespace: this.requiresNamespace
        }, args);
    }
    n2n(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Number",
            definitions: [
                makeDefinition(args.name, [
                    frNumber
                ], ([x])=>result_Ok(vNumber(fn(x))))
            ]
        }));
    }
    nn2n(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Number",
            definitions: [
                makeDefinition(args.name, [
                    frNumber,
                    frNumber
                ], ([x, y])=>result_Ok(vNumber(fn(x, y))))
            ]
        }));
    }
    nn2b(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Bool",
            definitions: [
                makeDefinition(args.name, [
                    frNumber,
                    frNumber
                ], ([x, y])=>result_Ok(vBool(fn(x, y))))
            ]
        }));
    }
    bb2b(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Bool",
            definitions: [
                makeDefinition(args.name, [
                    frBool,
                    frBool
                ], ([x, y])=>result_Ok(vBool(fn(x, y))))
            ]
        }));
    }
    ss2b(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Bool",
            definitions: [
                makeDefinition(args.name, [
                    frString,
                    frString
                ], ([x, y])=>result_Ok(vBool(fn(x, y))))
            ]
        }));
    }
    ss2s(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "String",
            definitions: [
                makeDefinition(args.name, [
                    frString,
                    frString
                ], ([x, y])=>result_Ok(vString(fn(x, y))))
            ]
        }));
    }
    d2s(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "String",
            definitions: [
                makeDefinition(args.name, [
                    frDist
                ], ([dist], { environment  })=>result_Ok(vString(fn(dist, environment))))
            ]
        }));
    }
    dn2s(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "String",
            definitions: [
                makeDefinition(args.name, [
                    frDist,
                    frNumber
                ], ([dist, n], { environment  })=>result_Ok(vString(fn(dist, n, environment))))
            ]
        }));
    }
    d2n(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Number",
            definitions: [
                makeDefinition(args.name, [
                    frDist
                ], ([x], { environment  })=>result_Ok(vNumber(fn(x, environment))))
            ]
        }));
    }
    d2b(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Bool",
            definitions: [
                makeDefinition(args.name, [
                    frDist
                ], ([x], { environment  })=>result_Ok(vBool(fn(x, environment))))
            ]
        }));
    }
    d2d(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Dist",
            definitions: [
                makeDefinition(args.name, [
                    frDist
                ], ([dist], { environment  })=>result_Ok(vDist(fn(dist, environment))))
            ]
        }));
    }
    dn2d(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Dist",
            definitions: [
                makeDefinition(args.name, [
                    frDist,
                    frNumber
                ], ([dist, n], { environment  })=>result_Ok(vDist(fn(dist, n, environment))))
            ]
        }));
    }
    dn2n(_a) {
        var { fn  } = _a, args = __rest(_a, [
            "fn"
        ]);
        return this.make(Object.assign(Object.assign({}, args), {
            output: "Number",
            definitions: [
                makeDefinition(args.name, [
                    frDist,
                    frNumber
                ], ([dist, n], { environment  })=>result_Ok(vNumber(fn(dist, n, environment))))
            ]
        }));
    }
    fromDefinition(def) {
        return this.make({
            name: def.name,
            definitions: [
                def
            ]
        });
    }
}
const unpackDistResult = (result)=>{
    if (!result.ok) {
        return ErrorMessage["throw"](REDistributionError(result.value));
    }
    return result.value;
};
const repackDistResult = (result)=>{
    const dist = unpackDistResult(result);
    return result_Ok(vDist(dist));
};
const doNumberLambdaCall = (lambda, args, context, reducer)=>{
    const value = lambda.call(args, context, reducer);
    if (value.type === "Number") {
        return value.value;
    }
    return ErrorMessage["throw"](REOperationError(SampleMapNeedsNtoNFunction));
}; //# sourceMappingURL=helpers.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/builtin.js





const maker = new FnFactory({
    nameSpace: "",
    requiresNamespace: false
});
const library = [
    maker.nn2n({
        name: "add",
        fn: (x, y)=>x + y
    }),
    maker.ss2s({
        name: "add",
        fn: (x, y)=>x + y
    }),
    maker.nn2n({
        name: "subtract",
        fn: (x, y)=>x - y
    }),
    maker.nn2n({
        name: "multiply",
        fn: (x, y)=>x * y
    }),
    maker.nn2n({
        name: "divide",
        fn: (x, y)=>x / y
    }),
    maker.nn2n({
        name: "pow",
        fn: (x, y)=>Math.pow(x, y)
    }),
    maker.nn2b({
        name: "equal",
        fn: (x, y)=>x === y
    }),
    maker.bb2b({
        name: "equal",
        fn: (x, y)=>x === y
    }),
    maker.ss2b({
        name: "equal",
        fn: (x, y)=>x === y
    }),
    maker.nn2b({
        name: "unequal",
        fn: (x, y)=>x !== y
    }),
    maker.bb2b({
        name: "unequal",
        fn: (x, y)=>x !== y
    }),
    maker.ss2b({
        name: "unequal",
        fn: (x, y)=>x !== y
    }),
    maker.nn2b({
        name: "smaller",
        fn: (x, y)=>x < y
    }),
    maker.nn2b({
        name: "smallerEq",
        fn: (x, y)=>x <= y
    }),
    maker.nn2b({
        name: "larger",
        fn: (x, y)=>x > y
    }),
    maker.nn2b({
        name: "largerEq",
        fn: (x, y)=>x >= y
    }),
    maker.bb2b({
        name: "or",
        fn: (x, y)=>x || y
    }),
    maker.bb2b({
        name: "and",
        fn: (x, y)=>x && y
    }),
    maker.n2n({
        name: "unaryMinus",
        fn: (x)=>-x
    }),
    ...[
        makeDefinition("not", [
            frNumber
        ], ([x])=>{
            return result_Ok(vBool(x !== 0));
        }),
        makeDefinition("not", [
            frBool
        ], ([x])=>{
            return result_Ok(vBool(!x));
        }),
        makeDefinition("concat", [
            frString,
            frString
        ], ([a, b])=>{
            return result_Ok(vString(a + b));
        }),
        makeDefinition("concat", [
            frArray(frAny),
            frArray(frAny)
        ], ([a, b])=>{
            return result_Ok(vArray([
                ...a,
                ...b
            ]));
        }),
        makeDefinition("concat", [
            frString,
            frAny
        ], ([a, b])=>{
            return result_Ok(vString(a + b.toString()));
        }),
        makeDefinition("add", [
            frString,
            frAny
        ], ([a, b])=>{
            return result_Ok(vString(a + b.toString()));
        }),
        makeDefinition("inspect", [
            frAny
        ], ([value])=>{
            console.log(value.toString());
            return result_Ok(value);
        }),
        makeDefinition("inspect", [
            frAny,
            frString
        ], ([value, label])=>{
            console.log(`${label}: ${value.toString()}`);
            return result_Ok(value);
        }),
        makeDefinition("javascriptraise", [
            frAny
        ], ([msg])=>{
            throw new Error(msg.toString());
        })
    ].map((d)=>maker.fromDefinition(d))
]; //# sourceMappingURL=builtin.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/dict.js








const dict_maker = new FnFactory({
    nameSpace: "Dict",
    requiresNamespace: true
});
const dict_library = [
    dict_maker.make({
        name: "set",
        output: "Record",
        examples: [
            `Dict.set({a: 1, b: 2}, "c", 3)`
        ],
        definitions: [
            makeDefinition("set", [
                frDict(frAny),
                frString,
                frAny
            ], ([dict, key, value])=>result_Ok(vRecord(dict.set(key, value))))
        ]
    }),
    dict_maker.make({
        name: "merge",
        output: "Record",
        examples: [
            `Dict.merge({a: 1, b: 2}, {c: 3, d: 4})`
        ],
        definitions: [
            makeDefinition("merge", [
                frDict(frAny),
                frDict(frAny)
            ], ([d1, d2])=>result_Ok(vRecord((0,immutable.Map)([
                    ...d1.entries(),
                    ...d2.entries()
                ]))))
        ]
    }),
    dict_maker.make({
        name: "mergeMany",
        output: "Record",
        examples: [
            `Dict.mergeMany([{a: 1, b: 2}, {c: 3, d: 4}])`
        ],
        definitions: [
            makeDefinition("mergeMany", [
                frArray(frDict(frAny))
            ], ([dicts])=>result_Ok(vRecord((0,immutable.Map)(dicts.map((d)=>[
                        ...d.entries()
                    ]).flat()))))
        ]
    }),
    dict_maker.make({
        name: "keys",
        output: "Array",
        examples: [
            `Dict.keys({a: 1, b: 2})`
        ],
        definitions: [
            makeDefinition("keys", [
                frDict(frAny)
            ], ([d1])=>result_Ok(vArray([
                    ...d1.keys()
                ].map((k)=>vString(k)))))
        ]
    }),
    dict_maker.make({
        name: "values",
        output: "Array",
        examples: [
            `Dict.values({a: 1, b: 2})`
        ],
        definitions: [
            makeDefinition("values", [
                frDict(frAny)
            ], ([d1])=>result_Ok(vArray([
                    ...d1.values()
                ])))
        ]
    }),
    dict_maker.make({
        name: "toList",
        output: "Array",
        examples: [
            `Dict.toList({a: 1, b: 2})`
        ],
        definitions: [
            makeDefinition("toList", [
                frDict(frAny)
            ], ([dict])=>result_Ok(vArray([
                    ...dict.entries()
                ].map(([k, v])=>vArray([
                        vString(k),
                        v
                    ])))))
        ]
    }),
    dict_maker.make({
        name: "fromList",
        output: "Record",
        examples: [
            `Dict.fromList([["a", 1], ["b", 2]])`
        ],
        definitions: [
            makeDefinition("fromList", [
                frArray(frTuple2(frString, frAny))
            ], ([items])=>result_Ok(vRecord((0,immutable.Map)(items))))
        ]
    }),
    dict_maker.make({
        name: "map",
        output: "Record",
        examples: [
            `Dict.map({a: 1, b: 2}, {|x| x + 1})`
        ],
        definitions: [
            makeDefinition("map", [
                frDict(frAny),
                frLambda
            ], ([dict, lambda], context, reducer)=>{
                return result_Ok(vRecord((0,immutable.Map)([
                    ...dict.entries()
                ].map(([key, value])=>{
                    const mappedValue = lambda.call([
                        value
                    ], context, reducer);
                    return [
                        key,
                        mappedValue
                    ];
                }))));
            })
        ]
    }),
    dict_maker.make({
        name: "mapKeys",
        output: "Record",
        examples: [
            `Dict.mapKeys({a: 1, b: 2}, {|x| concat(x, "-1")})`
        ],
        definitions: [
            makeDefinition("mapKeys", [
                frDict(frAny),
                frLambda
            ], ([dict, lambda], context, reducer)=>{
                const mappedEntries = [];
                for (const [key, value] of dict.entries()){
                    const mappedKey = lambda.call([
                        vString(key)
                    ], context, reducer);
                    if (mappedKey.type == "String") {
                        mappedEntries.push([
                            mappedKey.value,
                            value
                        ]);
                    } else {
                        return result_Error(REOther("mapKeys: lambda must return a string"));
                    }
                }
                return result_Ok(vRecord((0,immutable.Map)(mappedEntries)));
            })
        ]
    })
]; //# sourceMappingURL=dict.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/dist.js










const CI_CONFIG = [
    {
        lowKey: "p5",
        highKey: "p95",
        probability: 0.9
    },
    {
        lowKey: "p10",
        highKey: "p90",
        probability: 0.8
    },
    {
        lowKey: "p25",
        highKey: "p75",
        probability: 0.5
    }
];
const dist_maker = new FnFactory({
    nameSpace: "Dist",
    requiresNamespace: false
});
const makeSampleSet = (d, env)=>{
    const result = SampleSetDist.fromDist(d, env);
    if (!result.ok) {
        return ErrorMessage["throw"](REDistributionError(result.value));
    }
    return result.value;
};
const twoVarSample = (v1, v2, env, fn)=>{
    const repack = (r)=>fmap(errMap(r, REDistributionError), vDist);
    const sampleFn = (a, b)=>fmap2(fn(a, b), (d)=>d.sample(), (e)=>new OtherOperationError(e));
    if (v1 instanceof BaseDist && v2 instanceof BaseDist) {
        const s1 = makeSampleSet(v1, env);
        const s2 = makeSampleSet(v2, env);
        return repack(map2({
            fn: sampleFn,
            t1: s1,
            t2: s2
        }));
    } else if (v1 instanceof BaseDist && typeof v2 === "number") {
        const s1 = makeSampleSet(v1, env);
        return repack(s1.samplesMap((a)=>sampleFn(a, v2)));
    } else if (typeof v1 === "number" && v2 instanceof BaseDist) {
        const s2 = makeSampleSet(v2, env);
        return repack(s2.samplesMap((a)=>sampleFn(v1, a)));
    } else if (typeof v1 === "number" && typeof v2 === "number") {
        return fmap2(fn(v1, v2), vDist, REOther);
    }
    return ErrorMessage["throw"](REOther("Impossible branch"));
};
const makeTwoArgsDist = (name, fn)=>{
    return makeDefinition(name, [
        frDistOrNumber,
        frDistOrNumber
    ], ([v1, v2], { environment  })=>twoVarSample(v1, v2, environment, fn));
};
const makeCIDist = (name, lowKey, highKey, fn)=>{
    return makeDefinition(name, [
        frRecord([
            lowKey,
            frNumber
        ], [
            highKey,
            frNumber
        ])
    ], ([record], { environment  })=>twoVarSample(record[lowKey], record[highKey], environment, fn));
};
const makeMeanStdevDist = (name, fn)=>{
    return makeDefinition(name, [
        frRecord([
            "mean",
            frNumber
        ], [
            "stdev",
            frNumber
        ])
    ], ([{ mean , stdev  }], { environment  })=>twoVarSample(mean, stdev, environment, fn));
};
const makeOneArgDist = (name, fn)=>{
    return makeDefinition(name, [
        frDistOrNumber
    ], ([v], { environment  })=>{
        const repack = (r)=>fmap(errMap(r, REDistributionError), vDist);
        const sampleFn = (a)=>fmap2(fn(a), (d)=>d.sample(), (e)=>new OtherOperationError(e));
        if (v instanceof BaseDist) {
            const s = makeSampleSet(v, environment);
            return repack(s.samplesMap(sampleFn));
        } else if (typeof v === "number") {
            return fmap2(fn(v), vDist, REOther);
        }
        return ErrorMessage["throw"](REOther("Impossible branch"));
    });
};
const dist_library = [
    dist_maker.make({
        name: "normal",
        examples: [
            "normal(5,1)",
            "normal({p5: 4, p95: 10})",
            "normal({p10: 4, p90: 10})",
            "normal({p25: 4, p75: 10})",
            "normal({mean: 5, stdev: 2})"
        ],
        definitions: [
            makeTwoArgsDist("normal", (mean, stdev)=>Normal.make({
                    mean,
                    stdev
                })),
            ...CI_CONFIG.map((entry)=>makeCIDist("normal", entry.lowKey, entry.highKey, (low, high)=>Normal.fromCredibleInterval({
                        low,
                        high,
                        probability: entry.probability
                    }))),
            makeMeanStdevDist("normal", (mean, stdev)=>Normal.make({
                    mean,
                    stdev
                }))
        ]
    }),
    dist_maker.make({
        name: "lognormal",
        examples: [
            "lognormal(0.5, 0.8)",
            "lognormal({p5: 4, p95: 10})",
            "lognormal({p10: 4, p90: 10})",
            "lognormal({p25: 4, p75: 10})",
            "lognormal({mean: 5, stdev: 2})"
        ],
        definitions: [
            makeTwoArgsDist("lognormal", (mu, sigma)=>Lognormal.make({
                    mu,
                    sigma
                })),
            ...CI_CONFIG.map((entry)=>makeCIDist("lognormal", entry.lowKey, entry.highKey, (low, high)=>Lognormal.fromCredibleInterval({
                        low,
                        high,
                        probability: entry.probability
                    }))),
            makeMeanStdevDist("lognormal", (mean, stdev)=>Lognormal.fromMeanAndStdev({
                    mean,
                    stdev
                }))
        ]
    }),
    dist_maker.make({
        name: "uniform",
        examples: [
            `uniform(10, 12)`
        ],
        definitions: [
            makeTwoArgsDist("uniform", (low, high)=>Uniform.make({
                    low,
                    high
                }))
        ]
    }),
    dist_maker.make({
        name: "beta",
        examples: [
            `beta(20, 25)`,
            `beta({mean: 0.39, stdev: 0.1})`
        ],
        definitions: [
            makeTwoArgsDist("beta", (alpha, beta)=>Beta.make({
                    alpha,
                    beta
                })),
            makeMeanStdevDist("beta", (mean, stdev)=>Beta.fromMeanAndStdev({
                    mean,
                    stdev
                }))
        ]
    }),
    dist_maker.make({
        name: "cauchy",
        examples: [
            `cauchy(5, 1)`
        ],
        definitions: [
            makeTwoArgsDist("cauchy", (local, scale)=>Cauchy.make({
                    local,
                    scale
                }))
        ]
    }),
    dist_maker.make({
        name: "gamma",
        examples: [
            `gamma(5, 1)`
        ],
        definitions: [
            makeTwoArgsDist("gamma", (shape, scale)=>Gamma.make({
                    shape,
                    scale
                }))
        ]
    }),
    dist_maker.make({
        name: "logistic",
        examples: [
            `logistic(5, 1)`
        ],
        definitions: [
            makeTwoArgsDist("logistic", (location, scale)=>Logistic.make({
                    location,
                    scale
                }))
        ]
    }),
    dist_maker.make({
        name: "to (distribution)",
        examples: [
            "5 to 10",
            "to(5,10)",
            "-5 to 5"
        ],
        definitions: [
            "to",
            "credibleIntervalToDistribution"
        ].map((functionName)=>makeTwoArgsDist(functionName, (low, high)=>makeFromCredibleInterval({
                    low,
                    high,
                    probability: 0.9
                })))
    }),
    dist_maker.make({
        name: "exponential",
        examples: [
            `exponential(2)`
        ],
        definitions: [
            makeOneArgDist("exponential", (rate)=>Exponential.make(rate))
        ]
    }),
    dist_maker.make({
        name: "bernoulli",
        examples: [
            `bernoulli(0.5)`
        ],
        definitions: [
            makeOneArgDist("bernoulli", (p)=>Bernoulli.make(p))
        ]
    }),
    dist_maker.make({
        name: "pointMass",
        examples: [
            `pointMass(0.5)`
        ],
        definitions: [
            makeOneArgDist("pointMass", (f)=>PointMass.make(f))
        ]
    })
]; //# sourceMappingURL=dist.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/algebraicCombination.js







const validateInputs = (t1, t2, arithmeticOperation)=>{
    const getLogarithmInputError = ()=>{
        const isDistNotGreaterThanZero = (t)=>t.cdf(Epsilon.ten) > 0;
        if (isDistNotGreaterThanZero(t1)) {
            return logarithmOfDistributionError("First input must be completely greater than 0");
        }
        if (isDistNotGreaterThanZero(t2)) {
            return logarithmOfDistributionError("Second input must be completely greater than 0");
        }
        return undefined;
    };
    if (arithmeticOperation == "Logarithm") {
        return getLogarithmInputError();
    } else {
        return undefined;
    }
};
const symbolicStrategy = ({ t1 , t2 , arithmeticOperation  })=>{
    if (t1 instanceof SymbolicDist && t2 instanceof SymbolicDist) {
        const result = tryAnalyticalSimplification(t1, t2, arithmeticOperation);
        return result ? errMap(result, operationDistError) : undefined;
    } else {
        return undefined;
    }
};
const convolutionStrategy = ({ env , arithmeticOperation , t1 , t2  })=>{
    const convOp = Convolution.fromAlgebraicOperation(arithmeticOperation);
    if (convOp === undefined) {
        return undefined;
    }
    const p1r = t1.toPointSetDist(env);
    const p2r = t2.toPointSetDist(env);
    if (!p1r.ok) {
        return p1r;
    }
    if (!p2r.ok) {
        return p2r;
    }
    const p1 = p1r.value;
    const p2 = p2r.value;
    return result_Ok(PointSetDist_combineAlgebraically(convOp, p1, p2));
};
const monteCarloStrategy = ({ env , arithmeticOperation , t1 , t2  })=>{
    const fn = Algebraic.toFn(arithmeticOperation);
    const s1r = SampleSetDist.fromDist(t1, env);
    const s2r = SampleSetDist.fromDist(t2, env);
    if (!s1r.ok) {
        return s1r;
    }
    if (!s2r.ok) {
        return s2r;
    }
    const s1 = s1r.value;
    const s2 = s2r.value;
    return map2({
        fn,
        t1: s1,
        t2: s2
    });
};
const preferConvolutionToMonteCarlo = (args)=>{
    const hasSampleSetDist = ()=>args.t1 instanceof SampleSetDist || args.t2 instanceof SampleSetDist;
    const convolutionIsFasterThanMonteCarlo = ()=>args.t1.expectedConvolutionCost() * args.t2.expectedConvolutionCost() < OpCost.monteCarloCost;
    return !hasSampleSetDist() && Convolution.canDoAlgebraicOperation(args.arithmeticOperation) && convolutionIsFasterThanMonteCarlo();
};
const algebraicCombination = (args)=>{
    var _a;
    const invalidOperationError = validateInputs(args.t1, args.t2, args.arithmeticOperation);
    if (invalidOperationError !== undefined) {
        return result_Error(invalidOperationError);
    }
    const maybeSymbolicResult = symbolicStrategy(args);
    if (maybeSymbolicResult) {
        return maybeSymbolicResult;
    }
    const strategy = preferConvolutionToMonteCarlo(args) ? convolutionStrategy : monteCarloStrategy;
    return (_a = strategy(args)) !== null && _a !== void 0 ? _a : result_Error(unreachableError());
}; //# sourceMappingURL=algebraicCombination.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/pointwiseCombination.js




function pointwiseCombination({ t1 , t2 , env , algebraicOperation  }) {
    const p1r = t1.toPointSetDist(env);
    const p2r = t2.toPointSetDist(env);
    if (!p1r.ok) {
        return p1r;
    }
    if (!p2r.ok) {
        return p2r;
    }
    const p1 = p1r.value;
    const p2 = p2r.value;
    const result = PointSetDist_combinePointwise(p1, p2, Algebraic.toFn(algebraicOperation));
    if (result.ok) {
        return result;
    } else {
        return result_Error(operationDistError(result.value));
    }
}
function pointwiseCombinationFloat(t, { env , algebraicOperation , f  }) {
    const executeCombination = (arithOp)=>bind(t.toPointSetDist(env), (t)=>{
            var _a;
            const integralSumCacheFn = Scale.toIntegralSumCacheFn(arithOp);
            const integralCacheFn = (_a = Scale.toIntegralCacheFn(arithOp)) !== null && _a !== void 0 ? _a : (a, b)=>undefined;
            const opFn = Scale.toFn(arithOp);
            return errMap(t.mapYResult((y)=>opFn(y, f), (v)=>integralSumCacheFn === null || integralSumCacheFn === void 0 ? void 0 : integralSumCacheFn(f, v), (v)=>integralCacheFn(f, v)), (e)=>operationDistError(e));
        });
    if (algebraicOperation === "Add" || algebraicOperation === "Subtract") {
        return result_Error(distributionVerticalShiftIsInvalid());
    } else if (algebraicOperation === "Multiply" || algebraicOperation === "Divide" || algebraicOperation === "Power" || algebraicOperation === "Logarithm") {
        return executeCombination(algebraicOperation);
    } else if (algebraicOperation.NAME === "LogarithmWithThreshold") {
        return executeCombination(algebraicOperation);
    } else {
        throw new Error(`Unknown AlgebraicOperation ${algebraicOperation}`);
    }
} //# sourceMappingURL=pointwiseCombination.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/binaryOperations.js


function algebraic(t1, t2, env, operation) {
    return algebraicCombination({
        t1,
        t2,
        arithmeticOperation: operation,
        env
    });
}
function pointwise(t1, t2, env, algebraicOperation) {
    return pointwiseCombination({
        t1,
        t2,
        env,
        algebraicOperation
    });
}
const binaryOperations = {
    algebraicAdd: (t1, t2, { env  })=>algebraic(t1, t2, env, "Add"),
    algebraicMultiply: (t1, t2, { env  })=>algebraic(t1, t2, env, "Multiply"),
    algebraicDivide: (t1, t2, { env  })=>algebraic(t1, t2, env, "Divide"),
    algebraicSubtract: (t1, t2, { env  })=>algebraic(t1, t2, env, "Subtract"),
    algebraicLogarithm: (t1, t2, { env  })=>algebraic(t1, t2, env, "Logarithm"),
    algebraicPower: (t1, t2, { env  })=>algebraic(t1, t2, env, "Power"),
    pointwiseAdd: (t1, t2, { env  })=>pointwise(t1, t2, env, "Add"),
    pointwiseMultiply: (t1, t2, { env  })=>pointwise(t1, t2, env, "Multiply"),
    pointwiseDivide: (t1, t2, { env  })=>pointwise(t1, t2, env, "Divide"),
    pointwiseSubtract: (t1, t2, { env  })=>pointwise(t1, t2, env, "Subtract"),
    pointwiseLogarithm: (t1, t2, { env  })=>pointwise(t1, t2, env, "Logarithm"),
    pointwisePower: (t1, t2, { env  })=>pointwise(t1, t2, env, "Power")
}; //# sourceMappingURL=binaryOperations.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/PointSet/PointSetDist_Scoring.js



const logFn = Math.log;
const minusScaledLogOfQuotient = ({ esti , answ  })=>{
    const quot = esti / answ;
    return quot < 0.0 ? result_Error(ComplexNumberError) : result_Ok(-answ * logFn(quot));
};
const WithDistAnswer = {
    integrand (estimateElement, answerElement) {
        if (answerElement === 0) {
            return result_Ok(0);
        } else if (estimateElement === 0) {
            return result_Ok(Infinity);
        } else {
            return minusScaledLogOfQuotient({
                esti: estimateElement,
                answ: answerElement
            });
        }
    },
    sum ({ estimate , answer  }) {
        const combineAndIntegrate = (estimate, answer)=>fmap(PointSet_combinePointwise(estimate, answer, WithDistAnswer.integrand), (t)=>t.integralSum());
        const getMixedSums = (estimate, answer)=>{
            const esti = estimate.toMixed();
            const answ = answer.toMixed();
            const estiContinuousPart = esti.toContinuous();
            const estiDiscretePart = esti.toDiscrete();
            const answContinuousPart = answ.toContinuous();
            const answDiscretePart = answ.toDiscrete();
            if (estiContinuousPart && estiDiscretePart && answContinuousPart && answDiscretePart) {
                return merge(combineAndIntegrate(estiDiscretePart, answDiscretePart), combineAndIntegrate(estiContinuousPart, answContinuousPart));
            } else {
                return result_Error(new OtherOperationError("unreachable state"));
            }
        };
        if (isContinuous(estimate) && isContinuous(answer) || isDiscrete(estimate) && isDiscrete(answer)) {
            return combineAndIntegrate(estimate, answer);
        } else {
            return fmap(getMixedSums(estimate, answer), ([discretePart, continuousPart])=>discretePart + continuousPart);
        }
    },
    sumWithPrior ({ estimate , answer , prior  }) {
        let kl1 = WithDistAnswer.sum({
            estimate,
            answer
        });
        let kl2 = WithDistAnswer.sum({
            estimate: prior,
            answer
        });
        return fmap(merge(kl1, kl2), ([v1, v2])=>v1 - v2);
    }
};
const WithScalarAnswer = {
    sum (mp) {
        return mp.continuous + mp.discrete;
    },
    score ({ estimate , answer  }) {
        const _score = (estimatePdf, answer)=>{
            const density = estimatePdf(answer);
            if (density === undefined) {
                return result_Error(PdfInvalidError);
            } else {
                if (density < 0) {
                    return result_Error(PdfInvalidError);
                } else if (density === 0) {
                    return result_Ok(Infinity);
                } else {
                    return result_Ok(-logFn(density));
                }
            }
        };
        const estimatePdf = (x)=>{
            if (isContinuous(estimate) || isDiscrete(estimate)) {
                return WithScalarAnswer.sum(estimate.xToY(x));
            } else {
                return undefined;
            }
        };
        return _score(estimatePdf, answer);
    },
    scoreWithPrior ({ estimate , answer , prior  }) {
        return fmap(merge(WithScalarAnswer.score({
            estimate,
            answer
        }), WithScalarAnswer.score({
            estimate: prior,
            answer
        })), ([s1, s2])=>s1 - s2);
    }
}; //# sourceMappingURL=PointSetDist_Scoring.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/logScore.js



function logScoreDistAnswer({ estimate , answer , prior , env  }) {
    return bind(estimate.toPointSetDist(env), (estimate2)=>{
        return bind(answer.toPointSetDist(env), (answer2)=>{
            const prior2 = prior === null || prior === void 0 ? void 0 : prior.toPointSetDist(env);
            if (prior2) {
                if (!prior2.ok) {
                    return prior2;
                } else {
                    const prior3 = prior2.value;
                    return errMap(WithDistAnswer.sumWithPrior({
                        estimate: estimate2.pointSet,
                        answer: answer2.pointSet,
                        prior: prior3.pointSet
                    }), (y)=>operationDistError(y));
                }
            } else {
                return errMap(WithDistAnswer.sum({
                    estimate: estimate2.pointSet,
                    answer: answer2.pointSet
                }), (y)=>operationDistError(y));
            }
        });
    });
}
function logScoreScalarAnswer({ estimate , answer , prior , env  }) {
    return bind(estimate.toPointSetDist(env), (estimate2)=>{
        const prior2 = prior === null || prior === void 0 ? void 0 : prior.toPointSetDist(env);
        if (prior2) {
            if (!prior2.ok) {
                return prior2;
            } else {
                const prior3 = prior2.value;
                return errMap(WithScalarAnswer.scoreWithPrior({
                    estimate: estimate2.pointSet,
                    answer,
                    prior: prior3.pointSet
                }), operationDistError);
            }
        } else {
            return errMap(WithScalarAnswer.score({
                estimate: estimate2.pointSet,
                answer
            }), operationDistError);
        }
    });
} //# sourceMappingURL=logScore.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/scaleOperations.js

function scaleLog(dist, f, { env  }) {
    return pointwiseCombinationFloat(dist, {
        env,
        algebraicOperation: "Logarithm",
        f
    });
}
function scaleLogWithThreshold(dist, { env , base , eps  }) {
    return pointwiseCombinationFloat(dist, {
        env,
        algebraicOperation: {
            NAME: "LogarithmWithThreshold",
            VAL: eps
        },
        f: base
    });
}
function scaleMultiply(dist, f, { env  }) {
    return pointwiseCombinationFloat(dist, {
        env,
        algebraicOperation: "Multiply",
        f
    });
}
function scalePower(dist, f, { env  }) {
    return pointwiseCombinationFloat(dist, {
        env,
        algebraicOperation: "Power",
        f
    });
} //# sourceMappingURL=scaleOperations.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/mixture.js






function mixture_mixture(values, { env  }) {
    if (values.length < 1) {
        return result_Error(otherError("Mixture error: mixture must have at least 1 element"));
    }
    const someValuesAreSampleSets = values.some(([t])=>t instanceof SampleSetDist);
    if (someValuesAreSampleSets) {
        const sampleSetValues = [];
        for (const [dist, weight] of values){
            if (dist instanceof SampleSetDist) {
                sampleSetValues.push([
                    dist,
                    weight
                ]);
            } else {
                const sampleSetResult = SampleSetDist.fromDist(dist, env);
                if (!sampleSetResult.ok) {
                    return sampleSetResult;
                }
                sampleSetValues.push([
                    sampleSetResult.value,
                    weight
                ]);
            }
        }
        return mixture(sampleSetValues, env.sampleCount);
    }
    const totalWeight = sum(values.map(([, w])=>w));
    const properlyWeightedValues = [];
    for (const [dist, weight] of values){
        const r = scaleMultiply(dist, weight / totalWeight, {
            env
        });
        if (!r.ok) {
            return r;
        }
        properlyWeightedValues.push(r.value);
    }
    let answer = properlyWeightedValues[0];
    for (const dist of properlyWeightedValues.slice(1)){
        const r = binaryOperations.pointwiseAdd(answer, dist, {
            env
        });
        if (!r.ok) {
            return r;
        }
        answer = r.value;
    }
    return result_Ok(answer);
} //# sourceMappingURL=mixture.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/distOperations/index.js




 //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/genericDist.js











const genericDist_maker = new FnFactory({
    nameSpace: "",
    requiresNamespace: false
});
const toValueResult = (result)=>{
    return fmap2(result, vDist, (e)=>REDistributionError(e));
};
const algebraicOps = [
    [
        "add",
        binaryOperations.algebraicAdd
    ],
    [
        "multiply",
        binaryOperations.algebraicMultiply
    ],
    [
        "subtract",
        binaryOperations.algebraicSubtract
    ],
    [
        "divide",
        binaryOperations.algebraicDivide
    ],
    [
        "pow",
        binaryOperations.algebraicPower
    ],
    [
        "log",
        binaryOperations.algebraicLogarithm
    ]
];
const pointwiseOps = [
    [
        "dotAdd",
        binaryOperations.pointwiseAdd
    ],
    [
        "dotMultiply",
        binaryOperations.pointwiseMultiply
    ],
    [
        "dotSubtract",
        binaryOperations.pointwiseSubtract
    ],
    [
        "dotDivide",
        binaryOperations.pointwiseDivide
    ],
    [
        "dotPow",
        binaryOperations.pointwisePower
    ]
];
const makeOperationFns = ()=>{
    const twoArgTypes = [
        [
            frDist,
            frNumber
        ],
        [
            frNumber,
            frDist
        ],
        [
            frDist,
            frDist
        ]
    ];
    const fns = [];
    for (const [name, op] of [
        ...algebraicOps,
        ...pointwiseOps
    ]){
        fns.push(genericDist_maker.fromDefinition(makeDefinition(name, [
            frDist,
            frNumber
        ], ([dist, n], { environment  })=>toValueResult(op(dist, new PointMass(n), {
                env: environment
            })))));
        fns.push(genericDist_maker.fromDefinition(makeDefinition(name, [
            frNumber,
            frDist
        ], ([n, dist], { environment  })=>toValueResult(op(new PointMass(n), dist, {
                env: environment
            })))));
        fns.push(genericDist_maker.fromDefinition(makeDefinition(name, [
            frDist,
            frDist
        ], ([dist1, dist2], { environment  })=>toValueResult(op(dist1, dist2, {
                env: environment
            })))));
    }
    return fns;
};
const genericDist_library = [
    genericDist_maker.d2s({
        name: "sparkline",
        fn: (d, env)=>unpackDistResult(d.toSparkline(Environment.sparklineLength, env))
    }),
    genericDist_maker.dn2s({
        name: "sparkline",
        fn: (d, n, env)=>unpackDistResult(d.toSparkline(n | 0, env))
    }),
    genericDist_maker.d2s({
        name: "toString",
        fn: (d)=>d.toString()
    }),
    genericDist_maker.d2n({
        name: "mean",
        fn: (d)=>d.mean()
    }),
    genericDist_maker.d2n({
        name: "stdev",
        fn: (d)=>unpackDistResult(d.stdev())
    }),
    genericDist_maker.d2n({
        name: "variance",
        fn: (d)=>unpackDistResult(d.variance())
    }),
    genericDist_maker.d2n({
        name: "min",
        fn: (d)=>d.min()
    }),
    genericDist_maker.d2n({
        name: "max",
        fn: (d)=>d.max()
    }),
    genericDist_maker.d2n({
        name: "mode",
        fn: (d)=>unpackDistResult(d.mode())
    }),
    genericDist_maker.d2n({
        name: "sample",
        fn: (d)=>d.sample()
    }),
    genericDist_maker.d2n({
        name: "integralSum",
        fn: (d)=>d.integralSum()
    }),
    genericDist_maker.fromDefinition(makeDefinition("triangular", [
        frNumber,
        frNumber,
        frNumber
    ], ([low, medium, high])=>fmap2(Triangular.make({
            low,
            medium,
            high
        }), vDist, (e)=>REDistributionError(otherError(e))))),
    genericDist_maker.fromDefinition(makeDefinition("sampleN", [
        frDist,
        frNumber
    ], ([dist, n])=>{
        return result_Ok(vArray(dist.sampleN(n | 0).map(vNumber)));
    })),
    genericDist_maker.d2d({
        name: "exp",
        fn: (dist, env)=>{
            return unpackDistResult(binaryOperations.algebraicPower(new PointMass(Math.E), dist, {
                env
            }));
        }
    }),
    genericDist_maker.d2d({
        name: "normalize",
        fn: (d)=>d.normalize()
    }),
    genericDist_maker.d2b({
        name: "isNormalized",
        fn: (d)=>d.isNormalized()
    }),
    genericDist_maker.d2d({
        name: "toPointSet",
        fn: (d, env)=>unpackDistResult(d.toPointSetDist(env))
    }),
    genericDist_maker.dn2n({
        name: "cdf",
        fn: (d, x)=>d.cdf(x)
    }),
    genericDist_maker.dn2n({
        name: "pdf",
        fn: (d, x, env)=>unpackDistResult(d.pdf(x, {
                env
            }))
    }),
    genericDist_maker.dn2n({
        name: "inv",
        fn: (d, x)=>d.inv(x)
    }),
    genericDist_maker.dn2n({
        name: "quantile",
        fn: (d, x)=>d.inv(x)
    }),
    genericDist_maker.dn2d({
        name: "truncateLeft",
        fn: (dist, x, env)=>unpackDistResult(dist.truncate(x, undefined, {
                env
            }))
    }),
    genericDist_maker.dn2d({
        name: "truncateRight",
        fn: (dist, x, env)=>unpackDistResult(dist.truncate(undefined, x, {
                env
            }))
    }),
    genericDist_maker.fromDefinition(makeDefinition("truncate", [
        frDist,
        frNumber,
        frNumber
    ], ([dist, left, right], { environment  })=>toValueResult(dist.truncate(left, right, {
            env: environment
        })))),
    genericDist_maker.d2d({
        name: "log",
        fn: (dist, env)=>unpackDistResult(binaryOperations.algebraicLogarithm(dist, new PointMass(Math.E), {
                env
            }))
    }),
    genericDist_maker.d2d({
        name: "log10",
        fn: (dist, env)=>unpackDistResult(binaryOperations.algebraicLogarithm(dist, new PointMass(10), {
                env
            }))
    }),
    genericDist_maker.d2d({
        name: "unaryMinus",
        fn: (dist, env)=>unpackDistResult(binaryOperations.algebraicMultiply(dist, new PointMass(-1), {
                env
            }))
    }),
    genericDist_maker.d2d({
        name: "dotExp",
        fn: (dist, env)=>unpackDistResult(binaryOperations.pointwisePower(new PointMass(Math.E), dist, {
                env
            }))
    }),
    ...makeOperationFns()
]; //# sourceMappingURL=genericDist.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/danger.js











const { factorial: danger_factorial  } = jstat;
const danger_maker = new FnFactory({
    nameSpace: "Danger",
    requiresNamespace: true
});
const choose = (n, k)=>danger_factorial(n) / (danger_factorial(n - k) * danger_factorial(k));
const combinatoricsLibrary = [
    danger_maker.nn2n({
        name: "laplace",
        examples: [
            `Danger.laplace(1, 20)`
        ],
        fn: (successes, trials)=>(successes + 1) / (trials + 2)
    }),
    danger_maker.n2n({
        name: "factorial",
        examples: [
            `Danger.factorial(20)`
        ],
        fn: danger_factorial
    }),
    danger_maker.nn2n({
        name: "choose",
        examples: [
            `Danger.choose(1, 20)`
        ],
        fn: choose
    }),
    danger_maker.make({
        name: "binomial",
        output: "Number",
        examples: [
            `Danger.binomial(1, 20, 0.5)`
        ],
        definitions: [
            makeDefinition("binomial", [
                frNumber,
                frNumber,
                frNumber
            ], ([n, k, p])=>result_Ok(vNumber(choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k))))
        ]
    })
];
const integrateFunctionBetweenWithNumIntegrationPoints = (lambda, min, max, numIntegrationPoints, context, reducer)=>{
    const applyFunctionAtFloatToFloatOption = (point)=>{
        const result = lambda.call([
            vNumber(point)
        ], context, reducer);
        if (result.type === "Number") {
            return result.value;
        }
        return ErrorMessage["throw"](REOther("Error 1 in Danger.integrate. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"));
    };
    const numTotalPoints = numIntegrationPoints | 0;
    const numInnerPoints = numTotalPoints - 2;
    const numOuterPoints = 2;
    const totalWeight = max - min;
    const weightForAnInnerPoint = totalWeight / (numTotalPoints - 1);
    const weightForAnOuterPoint = totalWeight / (numTotalPoints - 1) / 2;
    const innerPointIncrement = (max - min) / (numTotalPoints - 1);
    const innerXs = makeBy(numInnerPoints, (i)=>min + (i + 1) * innerPointIncrement);
    let ys = innerXs.map((x)=>applyFunctionAtFloatToFloatOption(x));
    let verbose = false;
    if (verbose) {
        console.log("numTotalPoints", numTotalPoints);
        console.log("numInnerPoints", numInnerPoints);
        console.log("numOuterPoints", numOuterPoints);
        console.log("totalWeight", totalWeight);
        console.log("weightForAnInnerPoint", weightForAnInnerPoint);
        console.log("weightForAnOuterPoint", weightForAnOuterPoint);
        console.log("weightForAnInnerPoint * numInnerPoints + weightForAnOuterPoint * numOuterPoints", weightForAnInnerPoint * numInnerPoints + weightForAnOuterPoint * numOuterPoints);
        console.log("sum of weights == totalWeight", weightForAnInnerPoint * numInnerPoints + weightForAnOuterPoint * numOuterPoints === totalWeight);
        console.log("innerPointIncrement", innerPointIncrement);
        console.log("innerXs", innerXs);
        console.log("ys", ys);
    }
    const innerPointsSum = ys.reduce((a, b)=>a + b, 0);
    const yMin = applyFunctionAtFloatToFloatOption(min);
    const yMax = applyFunctionAtFloatToFloatOption(max);
    const result = (yMin + yMax) * weightForAnOuterPoint + innerPointsSum * weightForAnInnerPoint;
    return result_Ok(vNumber(result));
};
const integrationLibrary = [
    danger_maker.make({
        name: "integrateFunctionBetweenWithNumIntegrationPoints",
        requiresNamespace: false,
        output: "Number",
        examples: [
            `Danger.integrateFunctionBetweenWithNumIntegrationPoints({|x| x+1}, 1, 10, 10)`
        ],
        definitions: [
            makeDefinition("integrateFunctionBetweenWithNumIntegrationPoints", [
                frLambda,
                frNumber,
                frNumber,
                frNumber
            ], ([lambda, min, max, numIntegrationPoints], context, reducer)=>{
                if (numIntegrationPoints === 0) {
                    return ErrorMessage["throw"](REOther("Integration error 4 in Danger.integrate: Increment can't be 0."));
                }
                return integrateFunctionBetweenWithNumIntegrationPoints(lambda, min, max, numIntegrationPoints, context, reducer);
            })
        ]
    }),
    danger_maker.make({
        name: "integrateFunctionBetweenWithEpsilon",
        requiresNamespace: false,
        output: "Number",
        examples: [
            `Danger.integrateFunctionBetweenWithEpsilon({|x| x+1}, 1, 10, 0.1)`
        ],
        definitions: [
            makeDefinition("integrateFunctionBetweenWithEpsilon", [
                frLambda,
                frNumber,
                frNumber,
                frNumber
            ], ([lambda, min, max, epsilon], context, reducer)=>{
                if (epsilon === 0) {
                    return ErrorMessage["throw"](REOther("Integration error in Danger.integrate: Increment can't be 0."));
                }
                return integrateFunctionBetweenWithNumIntegrationPoints(lambda, min, max, (max - min) / epsilon, context, reducer);
            })
        ]
    })
];
const findBiggestElementIndex = (xs)=>xs.reduce((acc, newElement, index)=>{
        if (newElement > xs[acc]) {
            return index;
        } else {
            return acc;
        }
    }, 0);
const diminishingReturnsLibrary = [
    danger_maker.make({
        name: "optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions",
        output: "Array",
        requiresNamespace: false,
        examples: [
            `Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions([{|x| x+1}, {|y| 10}], 100, 0.01)`
        ],
        definitions: [
            makeDefinition("optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions", [
                frArray(frLambda),
                frNumber,
                frNumber
            ], ([lambdas, funds, approximateIncrement], context, reducer)=>{
                if (lambdas.length <= 1) {
                    return ErrorMessage["throw"](REOther("Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, number of functions should be greater than 1."));
                }
                if (funds <= 0) {
                    return ErrorMessage["throw"](REOther("Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, funds should be greater than 0."));
                }
                if (approximateIncrement <= 0) {
                    return ErrorMessage["throw"](REOther("Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be greater than 0."));
                }
                if (approximateIncrement >= funds) {
                    return ErrorMessage["throw"](REOther("Error in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions, approximateIncrement should be smaller than funds amount."));
                }
                const applyFunctionAtPoint = (lambda, point)=>{
                    const lambdaResult = lambda.call([
                        vNumber(point)
                    ], context, reducer);
                    if (lambdaResult.type === "Number") {
                        return lambdaResult.value;
                    }
                    return ErrorMessage["throw"](REOther("Error 1 in Danger.optimalAllocationGivenDiminishingMarginalReturnsForManyFunctions. It's possible that your function doesn't return a number, try definining auxiliaryFunction(x) = mean(yourFunction(x)) and integrate auxiliaryFunction instead"));
                };
                const numDivisions = Math.round(funds / approximateIncrement);
                const increment = funds / numDivisions;
                const arrayOfIncrements = new Array(numDivisions).fill(increment);
                const initAccumulator = {
                    optimalAllocations: new Array(lambdas.length).fill(0),
                    currentMarginalReturns: lambdas.map((lambda)=>applyFunctionAtPoint(lambda, 0))
                };
                const optimalAllocationEndAccumulator = arrayOfIncrements.reduce((acc, newIncrement)=>{
                    const oldMarginalReturns = acc.currentMarginalReturns;
                    const indexOfBiggestDMR = findBiggestElementIndex(oldMarginalReturns);
                    const newOptimalAllocations = [
                        ...acc.optimalAllocations
                    ];
                    const newOptimalAllocationsi = newOptimalAllocations[indexOfBiggestDMR] + newIncrement;
                    newOptimalAllocations[indexOfBiggestDMR] = newOptimalAllocationsi;
                    const lambdai = lambdas[indexOfBiggestDMR];
                    const newMarginalResultsLambdai = applyFunctionAtPoint(lambdai, newOptimalAllocationsi);
                    const newCurrentMarginalReturns = [
                        ...oldMarginalReturns
                    ];
                    newCurrentMarginalReturns[indexOfBiggestDMR] = newMarginalResultsLambdai;
                    const newAcc = {
                        optimalAllocations: newOptimalAllocations,
                        currentMarginalReturns: newCurrentMarginalReturns
                    };
                    return newAcc;
                }, initAccumulator);
                return result_Ok(vArray(optimalAllocationEndAccumulator.optimalAllocations.map(vNumber)));
            })
        ]
    })
];
const mapYLibrary = [
    danger_maker.d2d({
        name: "mapYLog",
        fn: (dist, env)=>unpackDistResult(scaleLog(dist, Math.E, {
                env
            }))
    }),
    danger_maker.d2d({
        name: "mapYLog10",
        fn: (dist, env)=>unpackDistResult(scaleLog(dist, 10, {
                env
            }))
    }),
    danger_maker.dn2d({
        name: "mapYLog",
        fn: (dist, x, env)=>unpackDistResult(scaleLog(dist, x, {
                env
            }))
    }),
    danger_maker.fromDefinition(makeDefinition("mapYLogWithThreshold", [
        frDist,
        frNumber,
        frNumber
    ], ([dist, base, eps], { environment  })=>toValueResult(scaleLogWithThreshold(dist, {
            env: environment,
            eps,
            base
        })))),
    danger_maker.dn2d({
        name: "mapYMultiply",
        fn: (dist, f, env)=>unpackDistResult(scaleMultiply(dist, f, {
                env
            }))
    }),
    danger_maker.dn2d({
        name: "mapYPow",
        fn: (dist, f, env)=>unpackDistResult(scalePower(dist, f, {
                env
            }))
    }),
    danger_maker.d2d({
        name: "mapYExp",
        fn: (dist, env)=>unpackDistResult(scalePower(dist, Math.E, {
                env
            }))
    })
];
const danger_library = [
    ...combinatoricsLibrary,
    ...integrationLibrary,
    ...diminishingReturnsLibrary,
    ...mapYLibrary
]; //# sourceMappingURL=danger.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/fn.js





const fn_maker = new FnFactory({
    nameSpace: "Function",
    requiresNamespace: true
});
const fn_library = [
    fn_maker.make({
        name: "declare",
        output: "Declaration",
        description: "Adds metadata to a function of the input ranges. Works now for numeric and date inputs. This is useful when making predictions. It allows you to limit the domain that your prediction will be used and scored within.",
        examples: [
            `Function.declare({
  fn: {|a,b| a},
  inputs: [
    {min: 0, max: 100},
    {min: 30, max: 50}
  ]
})`
        ],
        isExperimental: true,
        definitions: [
            makeDefinition("declare", [
                frRecord([
                    "fn",
                    frLambda
                ], [
                    "inputs",
                    frArray(frRecord([
                        "min",
                        frNumber
                    ], [
                        "max",
                        frNumber
                    ]))
                ])
            ], ([{ fn , inputs  }])=>{
                return result_Ok(vLambdaDeclaration({
                    fn,
                    args: inputs.map((input)=>Object.assign(Object.assign({}, input), {
                            type: "Float"
                        }))
                }));
            })
        ]
    })
]; //# sourceMappingURL=fn.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/sampleset.js







const sampleset_maker = new FnFactory({
    nameSpace: "SampleSet",
    requiresNamespace: true
});
function sampleSetAssert(dist) {
    if (dist instanceof SampleSetDist) {
        return;
    }
    return ErrorMessage["throw"](REExpectedType("SampleSetDist", dist.toString()));
}
const baseLibrary = [
    sampleset_maker.d2d({
        name: "fromDist",
        examples: [
            `SampleSet.fromDist(normal(5,2))`
        ],
        fn: (dist, env)=>unpackDistResult(SampleSetDist.fromDist(dist, env))
    }),
    sampleset_maker.make({
        name: "fromList",
        examples: [
            `SampleSet.fromList([3,5,2,3,5,2,3,5,2,3,3,5,3,2,3,1,1,3])`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("fromList", [
                frArray(frNumber)
            ], ([numbers])=>repackDistResult(SampleSetDist.make(numbers)))
        ]
    }),
    sampleset_maker.make({
        name: "toList",
        examples: [
            `SampleSet.toList(SampleSet.fromDist(normal(5,2)))`
        ],
        output: "Array",
        definitions: [
            makeDefinition("toList", [
                frDist
            ], ([dist])=>{
                sampleSetAssert(dist);
                return result_Ok(vArray(dist.samples.map(vNumber)));
            })
        ]
    }),
    sampleset_maker.make({
        name: "fromFn",
        examples: [
            `SampleSet.fromFn({|i| sample(normal(5,2))})`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("fromFn", [
                frLambda
            ], ([lambda], context, reducer)=>repackDistResult(SampleSetDist.fromFn((i)=>{
                    return doNumberLambdaCall(lambda, [
                        vNumber(i)
                    ], context, reducer);
                }, context.environment)))
        ]
    }),
    sampleset_maker.make({
        name: "map",
        examples: [
            `SampleSet.map(SampleSet.fromDist(normal(5,2)), {|x| x + 1})`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("map", [
                frDist,
                frLambda
            ], ([dist, lambda], context, reducer)=>{
                sampleSetAssert(dist);
                return repackDistResult(dist.samplesMap((r)=>result_Ok(doNumberLambdaCall(lambda, [
                        vNumber(r)
                    ], context, reducer))));
            })
        ]
    }),
    sampleset_maker.make({
        name: "map2",
        examples: [
            `SampleSet.map2(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), {|x, y| x + y})`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("map2", [
                frDist,
                frDist,
                frLambda
            ], ([dist1, dist2, lambda], context, reducer)=>{
                sampleSetAssert(dist1);
                sampleSetAssert(dist2);
                return repackDistResult(map2({
                    fn: (a, b)=>result_Ok(doNumberLambdaCall(lambda, [
                            vNumber(a),
                            vNumber(b)
                        ], context, reducer)),
                    t1: dist1,
                    t2: dist2
                }));
            })
        ]
    }),
    sampleset_maker.make({
        name: "map3",
        examples: [
            `SampleSet.map3(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), {|x, y, z| max([x,y,z])})`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("map3", [
                frDist,
                frDist,
                frDist,
                frLambda
            ], ([dist1, dist2, dist3, lambda], context, reducer)=>{
                sampleSetAssert(dist1);
                sampleSetAssert(dist2);
                sampleSetAssert(dist3);
                return repackDistResult(map3({
                    fn: (a, b, c)=>result_Ok(doNumberLambdaCall(lambda, [
                            vNumber(a),
                            vNumber(b),
                            vNumber(c)
                        ], context, reducer)),
                    t1: dist1,
                    t2: dist2,
                    t3: dist3
                }));
            })
        ]
    }),
    sampleset_maker.make({
        name: "mapN",
        examples: [
            `SampleSet.mapN([SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(5,2))], {|x| max(x)})`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("mapN", [
                frArray(frDist),
                frLambda
            ], ([dists, lambda], context, reducer)=>{
                const sampleSetDists = dists.map((d)=>{
                    sampleSetAssert(d);
                    return d;
                });
                return repackDistResult(mapN({
                    fn: (a)=>result_Ok(doNumberLambdaCall(lambda, [
                            vArray(a.map(vNumber))
                        ], context, reducer)),
                    t1: sampleSetDists
                }));
            })
        ]
    })
];
const mkComparison = (name, withDist, withFloat)=>sampleset_maker.make({
        name,
        requiresNamespace: false,
        examples: [
            `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), SampleSet.fromDist(normal(6,2)))`,
            `SampleSet.${name}(SampleSet.fromDist(normal(5,2)), 3.0)`,
            `SampleSet.${name}(4.0, SampleSet.fromDist(normal(6,2)))`
        ],
        output: "Dist",
        definitions: [
            makeDefinition(name, [
                frDist,
                frDist
            ], ([dist1, dist2])=>{
                sampleSetAssert(dist1);
                sampleSetAssert(dist2);
                return repackDistResult(withDist(dist1, dist2));
            }),
            makeDefinition(name, [
                frDist,
                frNumber
            ], ([dist, f])=>{
                sampleSetAssert(dist);
                return repackDistResult(withFloat(dist, f));
            }),
            makeDefinition(name, [
                frNumber,
                frDist
            ], ([f, dist])=>{
                sampleSetAssert(dist);
                return repackDistResult(withFloat(dist, f));
            })
        ]
    });
const comparisonLibrary = [
    mkComparison("min", minOfTwo, minOfFloat),
    mkComparison("max", maxOfTwo, maxOfFloat)
];
const sampleset_library = [
    ...baseLibrary,
    ...comparisonLibrary
]; //# sourceMappingURL=sampleset.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/number.js








const number_maker = new FnFactory({
    nameSpace: "Number",
    requiresNamespace: false
});
const emptyList = ()=>result_Error(REOther("List is empty"));
const makeNumberArrayToNumberDefinition = (name, fn)=>{
    return makeDefinition(name, [
        frArray(frNumber)
    ], ([arr])=>{
        if (arr.length === 0) {
            return emptyList();
        }
        return result_Ok(vNumber(fn(arr)));
    });
};
const makeNumberArrayToNumberArrayDefinition = (name, fn)=>{
    return makeDefinition(name, [
        frArray(frNumber)
    ], ([arr])=>{
        if (arr.length === 0) {
            return emptyList();
        }
        return result_Ok(vArray(fn(arr).map(vNumber)));
    });
};
const number_library = [
    number_maker.n2n({
        name: "floor",
        examples: [
            `floor(3.5)`
        ],
        fn: Math.floor
    }),
    number_maker.n2n({
        name: "ceil",
        examples: [
            "ceil(3.5)"
        ],
        fn: Math.ceil
    }),
    number_maker.n2n({
        name: "abs",
        description: "absolute value",
        examples: [
            `abs(3.5)`
        ],
        fn: Math.abs
    }),
    number_maker.n2n({
        name: "exp",
        description: "exponent",
        examples: [
            `exp(3.5)`
        ],
        fn: Math.exp
    }),
    number_maker.n2n({
        name: "log",
        examples: [
            `log(3.5)`
        ],
        fn: Math.log
    }),
    number_maker.n2n({
        name: "log10",
        examples: [
            `log10(3.5)`
        ],
        fn: Math.log10
    }),
    number_maker.n2n({
        name: "log2",
        examples: [
            `log2(3.5)`
        ],
        fn: Math.log2
    }),
    number_maker.n2n({
        name: "round",
        examples: [
            `round(3.5)`
        ],
        fn: Math.round
    }),
    number_maker.make({
        name: "sum",
        output: "Number",
        examples: [
            `sum([3,5,2])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("sum", (arr)=>sum(arr))
        ]
    }),
    number_maker.make({
        name: "product",
        output: "Number",
        examples: [
            `product([3,5,2])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("product", (arr)=>product(arr))
        ]
    }),
    number_maker.make({
        name: "min",
        output: "Number",
        examples: [
            `min([3,5,2])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("min", (arr)=>Math.min(...arr))
        ]
    }),
    number_maker.make({
        name: "max",
        output: "Number",
        examples: [
            `max([3,5,2])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("max", (arr)=>Math.max(...arr))
        ]
    }),
    number_maker.make({
        name: "mean",
        output: "Number",
        examples: [
            `mean([3,5,2])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("mean", (arr)=>mean(arr))
        ]
    }),
    number_maker.make({
        name: "geomean",
        description: "geometric mean",
        output: "Number",
        examples: [
            `geomean([3,5,2])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("geomean", (arr)=>geomean(arr))
        ]
    }),
    number_maker.make({
        name: "stdev",
        description: "standard deviation",
        output: "Number",
        examples: [
            `stdev([3,5,2,3,5])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("stdev", (arr)=>stdev(arr))
        ]
    }),
    number_maker.make({
        name: "variance",
        output: "Number",
        examples: [
            `variance([3,5,2,3,5])`
        ],
        definitions: [
            makeNumberArrayToNumberDefinition("variance", (arr)=>variance(arr))
        ]
    }),
    number_maker.make({
        name: "sort",
        output: "Array",
        examples: [
            `sort([3,5,2,3,5])`
        ],
        definitions: [
            makeNumberArrayToNumberArrayDefinition("sort", (arr)=>sort(arr))
        ]
    }),
    number_maker.make({
        name: "cumsum",
        output: "Array",
        description: "cumulative sum",
        examples: [
            `cumsum([3,5,2,3,5])`
        ],
        definitions: [
            makeNumberArrayToNumberArrayDefinition("cumsum", cumSum)
        ]
    }),
    number_maker.make({
        name: "cumprod",
        description: "cumulative product",
        output: "Array",
        examples: [
            `cumprod([3,5,2,3,5])`
        ],
        definitions: [
            makeNumberArrayToNumberArrayDefinition("cumprod", cumProd)
        ]
    }),
    number_maker.make({
        name: "diff",
        output: "Array",
        examples: [
            `diff([3,5,2,3,5])`
        ],
        definitions: [
            makeNumberArrayToNumberArrayDefinition("diff", diff)
        ]
    })
]; //# sourceMappingURL=number.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/pointset.js











const pointset_maker = new FnFactory({
    nameSpace: "PointSet",
    requiresNamespace: true
});
const argsToXYShape = (inputs)=>{
    const result = T.makeFromZipped(inputs.map(({ x , y  })=>[
            x,
            y
        ]));
    if (!result.ok) {
        return ErrorMessage["throw"](REDistributionError(xyShapeDistError(result.value)));
    }
    return result.value;
};
function pointSetAssert(dist) {
    if (dist instanceof PointSetDist) {
        return;
    }
    return ErrorMessage["throw"](REExpectedType("PointSetDist", dist.toString()));
}
const pointset_library = [
    pointset_maker.make({
        name: "fromDist",
        examples: [
            `PointSet.fromDist(normal(5,2))`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("fromDist", [
                frDist
            ], ([dist], context)=>repackDistResult(dist.toPointSetDist(context.environment)))
        ]
    }),
    pointset_maker.make({
        name: "downsample",
        examples: [
            `PointSet.downsample(PointSet.fromDist(normal(5,2)), 50)`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("downsample", [
                frDist,
                frNumber
            ], ([dist, number])=>{
                pointSetAssert(dist);
                return result_Ok(vDist(dist.downsample(number)));
            })
        ]
    }),
    pointset_maker.make({
        name: "mapY",
        examples: [
            `PointSet.mapY(mx(normal(5,2)), {|x| x + 1})`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("mapY", [
                frDist,
                frLambda
            ], ([dist, lambda], context, reducer)=>{
                pointSetAssert(dist);
                return repackDistResult(dist.mapYResult((y)=>result_Ok(doNumberLambdaCall(lambda, [
                        vNumber(y)
                    ], context, reducer)), undefined, undefined));
            })
        ]
    }),
    pointset_maker.make({
        name: "makeContinuous",
        examples: [
            `PointSet.makeContinuous([
        {x: 0, y: 0.2},
        {x: 1, y: 0.7},
        {x: 2, y: 0.8},
        {x: 3, y: 0.2}
      ])`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("makeContinuous", [
                frArray(frRecord([
                    "x",
                    frNumber
                ], [
                    "y",
                    frNumber
                ]))
            ], ([arr])=>{
                return result_Ok(vDist(new PointSetDist(new ContinuousShape({
                    xyShape: argsToXYShape(arr)
                }))));
            })
        ]
    }),
    pointset_maker.make({
        name: "makeDiscrete",
        examples: [
            `PointSet.makeDiscrete([
        {x: 0, y: 0.2},
        {x: 1, y: 0.7},
        {x: 2, y: 0.8},
        {x: 3, y: 0.2}
      ])`
        ],
        output: "Dist",
        definitions: [
            makeDefinition("makeDiscrete", [
                frArray(frRecord([
                    "x",
                    frNumber
                ], [
                    "y",
                    frNumber
                ]))
            ], ([arr])=>{
                return result_Ok(vDist(new PointSetDist(new DiscreteShape({
                    xyShape: argsToXYShape(arr)
                }))));
            })
        ]
    })
]; //# sourceMappingURL=pointset.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/scoring.js








const scoring_maker = new FnFactory({
    nameSpace: "Dist",
    requiresNamespace: true
});
const runScoringScalarAnswer = (estimate, answer, prior, env)=>{
    return fmap2(logScoreScalarAnswer({
        estimate,
        answer,
        prior,
        env
    }), vNumber, REDistributionError);
};
const runScoringDistAnswer = (estimate, answer, prior, env)=>{
    return fmap2(logScoreDistAnswer({
        estimate,
        answer,
        prior,
        env
    }), vNumber, REDistributionError);
};
const scoring_library = [
    scoring_maker.make({
        name: "logScore",
        output: "Number",
        examples: [
            "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1), prior: normal(5.5,3)})",
            "Dist.logScore({estimate: normal(5,2), answer: normal(5.2,1)})",
            "Dist.logScore({estimate: normal(5,2), answer: 4.5})"
        ],
        definitions: [
            makeDefinition("logScore", [
                frRecord([
                    "estimate",
                    frDist
                ], [
                    "answer",
                    frDistOrNumber
                ], [
                    "prior",
                    frDist
                ])
            ], ([{ estimate , answer , prior  }], context)=>{
                if (answer instanceof BaseDist) {
                    return runScoringDistAnswer(estimate, answer, prior, context.environment);
                } else if (typeof answer === "number") {
                    return runScoringScalarAnswer(estimate, answer, prior, context.environment);
                } else {
                    return ErrorMessage["throw"](REOther("Impossible type"));
                }
            }),
            makeDefinition("logScore", [
                frRecord([
                    "estimate",
                    frDist
                ], [
                    "answer",
                    frDistOrNumber
                ])
            ], ([{ estimate , answer  }], context)=>{
                if (answer instanceof BaseDist) {
                    return runScoringDistAnswer(estimate, answer, undefined, context.environment);
                } else if (typeof answer === "number") {
                    return runScoringScalarAnswer(estimate, answer, undefined, context.environment);
                } else {
                    return ErrorMessage["throw"](REOther("Impossible type"));
                }
            })
        ]
    }),
    scoring_maker.make({
        name: "klDivergence",
        output: "Number",
        examples: [
            "Dist.klDivergence(normal(5,2), normal(5,1.5))"
        ],
        definitions: [
            makeDefinition("klDivergence", [
                frDist,
                frDist
            ], ([estimate, d], context)=>runScoringDistAnswer(estimate, d, undefined, context.environment))
        ]
    })
]; //# sourceMappingURL=scoring.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/units.js

const units_maker = new FnFactory({
    nameSpace: "",
    requiresNamespace: false
});
const makeUnitFn = (name, multiplier)=>{
    return units_maker.n2n({
        name: "fromUnit_" + name,
        fn: (f)=>f * multiplier
    });
};
const units_library = [
    makeUnitFn("n", 1e-9),
    makeUnitFn("m", 1e-3),
    makeUnitFn("k", 1e3),
    makeUnitFn("M", 1e6),
    makeUnitFn("B", 1e9),
    makeUnitFn("G", 1e9),
    makeUnitFn("T", 1e12),
    makeUnitFn("P", 1e15)
]; //# sourceMappingURL=units.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/date.js








const date_maker = new FnFactory({
    nameSpace: "",
    requiresNamespace: false
});
const makeNumberToDurationFn = (name, fn)=>date_maker.make({
        name,
        definitions: [
            makeDefinition(name, [
                frNumber
            ], ([t])=>result_Ok(vTimeDuration(fn(t))))
        ]
    });
const makeDurationToNumberFn = (name, fn)=>date_maker.make({
        name,
        definitions: [
            makeDefinition(name, [
                frTimeDuration
            ], ([t])=>result_Ok(vNumber(fn(t))))
        ]
    });
const date_library = [
    date_maker.fromDefinition(makeDefinition("toString", [
        frDate
    ], ([t])=>result_Ok(vString(DateModule.toString(t))))),
    date_maker.fromDefinition(makeDefinition("makeDateFromYear", [
        frNumber
    ], ([year])=>{
        return fmap2(DateModule.makeFromYear(year), vDate, REOther);
    })),
    date_maker.fromDefinition(makeDefinition("dateFromNumber", [
        frNumber
    ], ([f])=>result_Ok(vDate(new Date(f))))),
    date_maker.fromDefinition(makeDefinition("toNumber", [
        frDate
    ], ([f])=>result_Ok(vNumber(f.getTime())))),
    date_maker.fromDefinition(makeDefinition("subtract", [
        frDate,
        frDate
    ], ([d1, d2])=>fmap2(DateModule.subtract(d1, d2), vTimeDuration, REOther))),
    date_maker.fromDefinition(makeDefinition("subtract", [
        frDate,
        frTimeDuration
    ], ([d1, d2])=>result_Ok(vDate(DateModule.subtractDuration(d1, d2))))),
    date_maker.fromDefinition(makeDefinition("add", [
        frDate,
        frTimeDuration
    ], ([d1, d2])=>result_Ok(vDate(DateModule.addDuration(d1, d2))))),
    date_maker.fromDefinition(makeDefinition("toString", [
        frTimeDuration
    ], ([t])=>result_Ok(vString(Duration.toString(t))))),
    makeNumberToDurationFn("minutes", Duration.fromMinutes),
    makeNumberToDurationFn("fromUnit_minutes", Duration.fromMinutes),
    makeNumberToDurationFn("hours", Duration.fromHours),
    makeNumberToDurationFn("fromUnit_hours", Duration.fromHours),
    makeNumberToDurationFn("days", Duration.fromDays),
    makeNumberToDurationFn("fromUnit_days", Duration.fromDays),
    makeNumberToDurationFn("years", Duration.fromYears),
    makeNumberToDurationFn("fromUnit_years", Duration.fromYears),
    makeDurationToNumberFn("toMinutes", Duration.toMinutes),
    makeDurationToNumberFn("toHours", Duration.toHours),
    makeDurationToNumberFn("toDays", Duration.toDays),
    makeDurationToNumberFn("toYears", Duration.toYears),
    date_maker.fromDefinition(makeDefinition("add", [
        frTimeDuration,
        frTimeDuration
    ], ([d1, d2])=>result_Ok(vTimeDuration(Duration.add(d1, d2))))),
    date_maker.fromDefinition(makeDefinition("subtract", [
        frTimeDuration,
        frTimeDuration
    ], ([d1, d2])=>result_Ok(vTimeDuration(Duration.subtract(d1, d2))))),
    date_maker.fromDefinition(makeDefinition("multiply", [
        frTimeDuration,
        frNumber
    ], ([d1, d2])=>result_Ok(vTimeDuration(Duration.multiply(d1, d2))))),
    date_maker.fromDefinition(makeDefinition("divide", [
        frTimeDuration,
        frNumber
    ], ([d1, d2])=>result_Ok(vTimeDuration(Duration.divide(d1, d2))))),
    date_maker.fromDefinition(makeDefinition("divide", [
        frTimeDuration,
        frTimeDuration
    ], ([d1, d2])=>result_Ok(vNumber(d1 / d2))))
]; //# sourceMappingURL=date.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/math.js

const math_maker = new FnFactory({
    nameSpace: "Math",
    requiresNamespace: true
});
const math_library = [
    math_maker.n2n({
        name: "sqrt",
        fn: (x)=>Math.pow(x, 0.5)
    }),
    math_maker.n2n({
        name: "sin",
        fn: (x)=>Math.sin(x)
    }),
    math_maker.n2n({
        name: "cos",
        fn: (x)=>Math.cos(x)
    }),
    math_maker.n2n({
        name: "tan",
        fn: (x)=>Math.tan(x)
    }),
    math_maker.n2n({
        name: "asin",
        fn: (x)=>Math.asin(x)
    }),
    math_maker.n2n({
        name: "acos",
        fn: (x)=>Math.acos(x)
    }),
    math_maker.n2n({
        name: "atan",
        fn: (x)=>Math.atan(x)
    })
]; //# sourceMappingURL=math.js.map

;// CONCATENATED MODULE: external "lodash/includes.js"
const includes_js_namespaceObject = require("lodash/includes.js");
;// CONCATENATED MODULE: external "lodash/uniqBy.js"
const uniqBy_js_namespaceObject = require("lodash/uniqBy.js");
;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/list.js










const list_maker = new FnFactory({
    nameSpace: "List",
    requiresNamespace: true
});
const list_library = [
    list_maker.make({
        name: "length",
        output: "Number",
        examples: [
            `List.length([1,4,5])`
        ],
        definitions: [
            makeDefinition("length", [
                frArray(frAny)
            ], ([values])=>result_Ok(vNumber(values.length)))
        ]
    }),
    list_maker.make({
        name: "make",
        output: "Array",
        examples: [
            `List.make(2, "testValue")`
        ],
        definitions: [
            makeDefinition("make", [
                frNumber,
                frAny
            ], ([number, value])=>result_Ok(vArray(new Array(number | 0).fill(value))))
        ]
    }),
    list_maker.make({
        name: "upTo",
        output: "Array",
        examples: [
            `List.upTo(1,4)`
        ],
        definitions: [
            makeDefinition("upTo", [
                frNumber,
                frNumber
            ], ([low, high])=>result_Ok(vArray(range(low, high, high - low + 1 | 0).map(vNumber))))
        ]
    }),
    list_maker.make({
        name: "first",
        examples: [
            `List.first([1,4,5])`
        ],
        definitions: [
            makeDefinition("first", [
                frArray(frAny)
            ], ([array])=>{
                if (!array.length) {
                    return result_Error(REOther("No first element"));
                } else {
                    return result_Ok(array[0]);
                }
            })
        ]
    }),
    list_maker.make({
        name: "last",
        examples: [
            `List.last([1,4,5])`
        ],
        definitions: [
            makeDefinition("last", [
                frArray(frAny)
            ], ([array])=>{
                if (!array.length) {
                    return result_Error(REOther("No last element"));
                } else {
                    return result_Ok(array[array.length - 1]);
                }
            })
        ]
    }),
    list_maker.make({
        name: "reverse",
        output: "Array",
        requiresNamespace: false,
        examples: [
            `List.reverse([1,4,5])`
        ],
        definitions: [
            makeDefinition("reverse", [
                frArray(frAny)
            ], ([array])=>result_Ok(vArray([
                    ...array
                ].reverse())))
        ]
    }),
    list_maker.make({
        name: "map",
        output: "Array",
        requiresNamespace: false,
        examples: [
            `List.map([1,4,5], {|x| x+1})`
        ],
        definitions: [
            makeDefinition("map", [
                frArray(frAny),
                frLambda
            ], ([array, lambda], context, reducer)=>{
                const mapped = new Array(array.length);
                for(let i = 0; i < array.length; i++){
                    mapped[i] = lambda.call([
                        array[i]
                    ], context, reducer);
                }
                return result_Ok(vArray(mapped));
            })
        ]
    }),
    list_maker.make({
        name: "concat",
        requiresNamespace: true,
        examples: [
            `List.concat([1,2,3], [4, 5, 6])`
        ],
        definitions: [
            makeDefinition("concat", [
                frArray(frAny),
                frArray(frAny)
            ], ([array1, array2])=>result_Ok(vArray([
                    ...array1
                ].concat(array2))))
        ]
    }),
    list_maker.make({
        name: "append",
        examples: [
            `List.append([1,4],5)`
        ],
        definitions: [
            makeDefinition("append", [
                frArray(frAny),
                frAny
            ], ([array, el])=>{
                let newArr = [
                    ...array,
                    el
                ];
                return result_Ok(vArray(newArr));
            })
        ]
    }),
    list_maker.make({
        name: "uniq",
        requiresNamespace: true,
        examples: [
            `List.uniq([1,2,3,"hi",false,"hi"])`
        ],
        definitions: [
            makeDefinition("uniq", [
                frArray(frAny)
            ], ([arr])=>{
                const isUniqableType = (t)=>includes_js_namespaceObject([
                        "String",
                        "Bool",
                        "Number"
                    ], t.type);
                const uniqueValueKey = (t)=>t.toString() + t.type;
                const allUniqable = arr.every(isUniqableType);
                if (allUniqable) {
                    return result_Ok(vArray(uniqBy_js_namespaceObject(arr, uniqueValueKey)));
                } else {
                    return result_Error(REOther("Can only apply uniq() to Strings, Numbers, or Bools"));
                }
            })
        ]
    }),
    list_maker.make({
        name: "reduce",
        requiresNamespace: false,
        examples: [
            `List.reduce([1,4,5], 2, {|acc, el| acc+el})`
        ],
        definitions: [
            makeDefinition("reduce", [
                frArray(frAny),
                frAny,
                frLambda
            ], ([array, initialValue, lambda], context, reducer)=>result_Ok(array.reduce((acc, elem)=>lambda.call([
                        acc,
                        elem
                    ], context, reducer), initialValue)))
        ]
    }),
    list_maker.make({
        name: "reduceReverse",
        requiresNamespace: false,
        examples: [
            `List.reduceReverse([1,4,5], 2, {|acc, el| acc-el})`
        ],
        definitions: [
            makeDefinition("reduceReverse", [
                frArray(frAny),
                frAny,
                frLambda
            ], ([array, initialValue, lambda], context, reducer)=>result_Ok([
                    ...array
                ].reverse().reduce((acc, elem)=>lambda.call([
                        acc,
                        elem
                    ], context, reducer), initialValue)))
        ]
    }),
    list_maker.make({
        name: "filter",
        requiresNamespace: false,
        examples: [
            `List.filter([1,4,5], {|x| x>3})`
        ],
        definitions: [
            makeDefinition("filter", [
                frArray(frAny),
                frLambda
            ], ([array, lambda], context, reducer)=>result_Ok(vArray(array.filter((elem)=>{
                    const result = lambda.call([
                        elem
                    ], context, reducer);
                    return result.type === "Bool" && result.value;
                }))))
        ]
    }),
    list_maker.make({
        name: "join",
        requiresNamespace: true,
        examples: [
            `List.join(["a", "b", "c"], ",")`
        ],
        definitions: [
            makeDefinition("join", [
                frArray(frString),
                frString
            ], ([array, joinStr])=>result_Ok(vString(array.join(joinStr)))),
            makeDefinition("join", [
                frArray(frString)
            ], ([array])=>result_Ok(vString(array.join())))
        ]
    }),
    list_maker.make({
        name: "flatten",
        requiresNamespace: true,
        examples: [
            `List.flatten([[1,2], [3,4]])`
        ],
        definitions: [
            makeDefinition("flatten", [
                frArray(frAny)
            ], ([arr])=>{
                return result_Ok(vArray(arr).flatten());
            })
        ]
    })
]; //# sourceMappingURL=list.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/plot.js







const plot_maker = new FnFactory({
    nameSpace: "Plot",
    requiresNamespace: true
});
const plot_library = [
    plot_maker.make({
        name: "dists",
        output: "Plot",
        examples: [
            `Plot.dists({
  dists: [{ name: "dist", value: normal(0, 1) }],
  xScale: Scale.symlog(),
})`
        ],
        definitions: [
            makeDefinition("dists", [
                frRecord([
                    "dists",
                    frArray(frRecord([
                        "name",
                        frString
                    ], [
                        "value",
                        frDistOrNumber
                    ]))
                ], [
                    "xScale",
                    frOptional(frScale)
                ], [
                    "yScale",
                    frOptional(frScale)
                ], [
                    "title",
                    frOptional(frString)
                ], [
                    "showSummary",
                    frOptional(frBool)
                ])
            ], ([{ dists , xScale , yScale , title , showSummary  }])=>{
                let distributions = [];
                dists.forEach(({ name , value  })=>{
                    if (typeof value === "number") {
                        const deltaResult = PointMass.make(value);
                        if (deltaResult.ok === false) {
                            return result_Error(REOther(deltaResult.value));
                        } else {
                            distributions.push({
                                name,
                                distribution: deltaResult.value
                            });
                        }
                    } else {
                        distributions.push({
                            name,
                            distribution: value
                        });
                    }
                });
                return result_Ok(vPlot({
                    type: "distributions",
                    distributions,
                    xScale: xScale !== null && xScale !== void 0 ? xScale : {
                        type: "linear"
                    },
                    yScale: yScale !== null && yScale !== void 0 ? yScale : {
                        type: "linear"
                    },
                    title: title !== null && title !== void 0 ? title : undefined,
                    showSummary: showSummary !== null && showSummary !== void 0 ? showSummary : true
                }));
            })
        ]
    }),
    plot_maker.make({
        name: "dist",
        output: "Plot",
        examples: [
            `Plot.dist({
  dist: normal(0, 1),
  xScale: Scale.symlog(),
})`
        ],
        definitions: [
            makeDefinition("dist", [
                frRecord([
                    "dist",
                    frDist
                ], [
                    "xScale",
                    frOptional(frScale)
                ], [
                    "yScale",
                    frOptional(frScale)
                ], [
                    "title",
                    frOptional(frString)
                ], [
                    "showSummary",
                    frOptional(frBool)
                ])
            ], ([{ dist , xScale , yScale , title , showSummary  }])=>{
                return result_Ok(vPlot({
                    type: "distributions",
                    distributions: [
                        {
                            distribution: dist
                        }
                    ],
                    xScale: xScale !== null && xScale !== void 0 ? xScale : {
                        type: "linear"
                    },
                    yScale: yScale !== null && yScale !== void 0 ? yScale : {
                        type: "linear"
                    },
                    title: title !== null && title !== void 0 ? title : undefined,
                    showSummary: showSummary !== null && showSummary !== void 0 ? showSummary : true
                }));
            })
        ]
    }),
    plot_maker.make({
        name: "numericFn",
        output: "Plot",
        examples: [
            `Plot.numericFn({ fn: {|x|x*x}, xScale: Scale.linear({ min: 3, max: 5}), yScale: Scale.log({ tickFormat: ".2s" }) })`
        ],
        definitions: [
            makeDefinition("numericFn", [
                frRecord([
                    "fn",
                    frLambda
                ], [
                    "xScale",
                    frOptional(frScale)
                ], [
                    "yScale",
                    frOptional(frScale)
                ], [
                    "points",
                    frOptional(frNumber)
                ])
            ], ([{ fn , xScale , yScale , points  }])=>{
                return result_Ok(vPlot({
                    type: "numericFn",
                    fn,
                    xScale: xScale !== null && xScale !== void 0 ? xScale : {
                        type: "linear"
                    },
                    yScale: yScale !== null && yScale !== void 0 ? yScale : {
                        type: "linear"
                    },
                    points: points !== null && points !== void 0 ? points : undefined
                }));
            })
        ]
    }),
    plot_maker.make({
        name: "distFn",
        output: "Plot",
        examples: [
            `Plot.distFn({ fn: {|x|uniform(x, x+1)}, xScale: Scale.linear({ min: 3, max: 5}), yScale: Scale.log({ tickFormat: ".2s" }) })`
        ],
        definitions: [
            makeDefinition("distFn", [
                frRecord([
                    "fn",
                    frLambda
                ], [
                    "xScale",
                    frOptional(frScale)
                ], [
                    "distXScale",
                    frOptional(frScale)
                ], [
                    "points",
                    frOptional(frNumber)
                ])
            ], ([{ fn , xScale , distXScale , points  }])=>{
                return result_Ok(vPlot({
                    type: "distFn",
                    fn,
                    xScale: xScale !== null && xScale !== void 0 ? xScale : {
                        type: "linear"
                    },
                    distXScale: distXScale !== null && distXScale !== void 0 ? distXScale : {
                        type: "linear"
                    },
                    points: points !== null && points !== void 0 ? points : undefined
                }));
            })
        ]
    }),
    plot_maker.make({
        name: "scatter",
        output: "Plot",
        examples: [
            `Plot.scatter({ xDist: 2 to 5, yDist: SampleSet.fromDist(-3 to 3) })`,
            `Plot.scatter({ xDist: 2 to 5, yDist: SampleSet.fromDist(-3 to 3), xScale: Scale.symlog(), yScale: Scale.symlog() })`
        ],
        definitions: [
            makeDefinition("scatter", [
                frRecord([
                    "xDist",
                    frDist
                ], [
                    "yDist",
                    frDist
                ], [
                    "xScale",
                    frOptional(frScale)
                ], [
                    "yScale",
                    frOptional(frScale)
                ])
            ], ([{ xDist , yDist , xScale , yScale  }])=>{
                return result_Ok(vPlot({
                    type: "scatter",
                    xDist,
                    yDist,
                    xScale: xScale !== null && xScale !== void 0 ? xScale : {
                        type: "linear"
                    },
                    yScale: yScale !== null && yScale !== void 0 ? yScale : {
                        type: "linear"
                    }
                }));
            })
        ]
    })
]; //# sourceMappingURL=plot.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/scale.js





const scale_maker = new FnFactory({
    nameSpace: "Scale",
    requiresNamespace: true
});
const commonRecord = frRecord([
    "min",
    frOptional(frNumber)
], [
    "max",
    frOptional(frNumber)
], [
    "tickFormat",
    frOptional(frString)
]);
const scale_library = [
    scale_maker.make({
        name: "linear",
        output: "Scale",
        examples: [
            `Scale.linear({ min: 3, max: 10 })`
        ],
        definitions: [
            makeDefinition("linear", [
                commonRecord
            ], ([{ min , max , tickFormat  }])=>{
                return result_Ok(vScale({
                    type: "linear",
                    min: min !== null && min !== void 0 ? min : undefined,
                    max: max !== null && max !== void 0 ? max : undefined,
                    tickFormat: tickFormat !== null && tickFormat !== void 0 ? tickFormat : undefined
                }));
            }),
            makeDefinition("linear", [], ()=>{
                return result_Ok(vScale({
                    type: "linear"
                }));
            })
        ]
    }),
    scale_maker.make({
        name: "log",
        output: "Scale",
        examples: [
            `Scale.log({ min: 1, max: 100 })`
        ],
        definitions: [
            makeDefinition("log", [
                commonRecord
            ], ([{ min , max , tickFormat  }])=>{
                return result_Ok(vScale({
                    type: "log",
                    min: min !== null && min !== void 0 ? min : undefined,
                    max: max !== null && max !== void 0 ? max : undefined,
                    tickFormat: tickFormat !== null && tickFormat !== void 0 ? tickFormat : undefined
                }));
            }),
            makeDefinition("log", [], ()=>{
                return result_Ok(vScale({
                    type: "log"
                }));
            })
        ]
    }),
    scale_maker.make({
        name: "symlog",
        output: "Scale",
        examples: [
            `Scale.symlog({ min: -10, max: 10 })`
        ],
        definitions: [
            makeDefinition("symlog", [
                commonRecord
            ], ([{ min , max , tickFormat  }])=>{
                return result_Ok(vScale({
                    type: "symlog",
                    min: min !== null && min !== void 0 ? min : undefined,
                    max: max !== null && max !== void 0 ? max : undefined,
                    tickFormat: tickFormat !== null && tickFormat !== void 0 ? tickFormat : undefined
                }));
            }),
            makeDefinition("symlog", [], ()=>{
                return result_Ok(vScale({
                    type: "symlog"
                }));
            })
        ]
    }),
    scale_maker.make({
        name: "power",
        output: "Scale",
        examples: [
            `Scale.power({ min: 1, max: 100, exponent: 0.1 })`
        ],
        definitions: [
            makeDefinition("power", [
                frRecord([
                    "min",
                    frOptional(frNumber)
                ], [
                    "max",
                    frOptional(frNumber)
                ], [
                    "tickFormat",
                    frOptional(frString)
                ], [
                    "exponent",
                    frNumber
                ])
            ], ([{ min , max , tickFormat , exponent  }])=>{
                return result_Ok(vScale({
                    type: "power",
                    min: min !== null && min !== void 0 ? min : undefined,
                    max: max !== null && max !== void 0 ? max : undefined,
                    tickFormat: tickFormat !== null && tickFormat !== void 0 ? tickFormat : undefined,
                    exponent
                }));
            })
        ]
    })
]; //# sourceMappingURL=scale.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/fr/mixture.js








const raiseArgumentError = (message)=>ErrorMessage["throw"](REDistributionError(argumentError(message)));
let parseNumber = (arg)=>{
    if (arg.type === "Number") {
        return arg.value;
    } else {
        return raiseArgumentError("Not a number");
    }
};
const parseNumberArray = (args)=>args.map(parseNumber);
const parseDist = (args)=>{
    if (args.type === "Dist") {
        return args.value;
    } else if (args.type === "Number") {
        return new PointMass(args.value);
    } else {
        return raiseArgumentError("Not a distribution");
    }
};
let parseDistributionArray = (ags)=>ags.map(parseDist);
let mixtureWithGivenWeights = (distributions, weights, env)=>{
    if (distributions.length === weights.length) {
        return mixture_mixture(zip(distributions, weights), {
            env
        });
    } else {
        return raiseArgumentError("Error, mixture call has different number of distributions and weights");
    }
};
const mixtureWithDefaultWeights = (distributions, env)=>{
    const length = distributions.length;
    const weights = new Array(length).fill(1 / length);
    return mixtureWithGivenWeights(distributions, weights, env);
};
const fr_mixture_mixture = (args, env)=>{
    if (args.length === 1 && args[0].type === "Array") {
        return mixtureWithDefaultWeights(parseDistributionArray(args[0].value), env);
    } else if (args.length === 2 && args[0].type === "Array" && args[1].type === "Array") {
        const distributions = args[0].value;
        const weights = args[1].value;
        const distrs = parseDistributionArray(distributions);
        const wghts = parseNumberArray(weights);
        return mixtureWithGivenWeights(distrs, wghts, env);
    } else if (args.length > 0) {
        const last = args[args.length - 1];
        if (last.type === "Array") {
            const weights = parseNumberArray(last.value);
            const distributions = parseDistributionArray(args.slice(0, args.length - 1));
            return mixtureWithGivenWeights(distributions, weights, env);
        } else if (last.type === "Number" || last.type === "Dist") {
            return mixtureWithDefaultWeights(parseDistributionArray(args), env);
        }
    }
    return raiseArgumentError("Last argument of mx must be array or distribution");
};
const mxLambda = new BuiltinLambda("mx", (inputs, context)=>{
    return vDist(unpackDistResult(fr_mixture_mixture(inputs, context.environment)));
}); //# sourceMappingURL=mixture.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/registry/index.js


















const fnList = [
    ...library,
    ...dict_library,
    ...dist_library,
    ...danger_library,
    ...fn_library,
    ...sampleset_library,
    ...number_library,
    ...pointset_library,
    ...scoring_library,
    ...genericDist_library,
    ...units_library,
    ...date_library,
    ...math_library,
    ...list_library,
    ...plot_library,
    ...scale_library
];
const registry = make(fnList);
const registry_call = (fnName, args, context, reducer)=>{
    return call(registry, fnName, args, context, reducer);
};
const registry_allNames = ()=>allNames(registry);
const nonRegistryLambdas = [
    [
        "mx",
        mxLambda
    ],
    [
        "mixture",
        mxLambda
    ]
]; //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/version.js


const makeVersionConstant = ()=>{
    return (0,immutable.Map)([
        [
            "System.version",
            vString("0.6.0")
        ]
    ]);
}; //# sourceMappingURL=version.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/library/index.js








const makeStdLib = ()=>{
    let res = (0,immutable.Map)();
    res = res.merge(makeMathConstants());
    res = res.merge(makeVersionConstant());
    res = res.set(INDEX_LOOKUP_FUNCTION, vLambda(new BuiltinLambda(INDEX_LOOKUP_FUNCTION, (inputs)=>{
        if (inputs.length !== 2) {
            return ErrorMessage["throw"](REOther("Index lookup internal error"));
        }
        const [obj, key] = inputs;
        if ("get" in obj) {
            return obj.get(key);
        } else {
            return ErrorMessage["throw"](REOther("Trying to access key on wrong value"));
        }
    })));
    for (const [name, lambda] of nonRegistryLambdas){
        res = res.set(name, vLambda(lambda));
    }
    for (const name of registry_allNames()){
        res = res.set(name, vLambda(new BuiltinLambda(name, (args, context, reducer)=>{
            const result = registry_call(name, args, context, reducer);
            if (!result.ok) {
                return ErrorMessage["throw"](result.value);
            }
            return result.value;
        })));
    }
    return res;
};
const library_stdLib = makeStdLib(); //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/dist/env.js

const env_defaultEnv = {
    sampleCount: Environment.defaultSampleCount,
    xyPointLength: Environment.defaultXYPointLength
}; //# sourceMappingURL=env.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/reducer/index.js












const throwFrom = (error, expression, context)=>{
    throw IError_IError.fromMessageWithFrameStack(error, context.frameStack.extend(currentFunctionName(context), expression.ast.location));
};
const evaluate = (expression, context)=>{
    switch(expression.type){
        case "Block":
            {
                let currentContext = Object.assign({}, context);
                let currentValue = vVoid();
                for (const statement of expression.value){
                    [currentValue, currentContext] = evaluate(statement, currentContext);
                }
                return [
                    currentValue,
                    context
                ];
            }
        case "Program":
            {
                let currentContext = context;
                let currentValue = vVoid();
                for (const statement of expression.value){
                    [currentValue, currentContext] = evaluate(statement, currentContext);
                }
                return [
                    currentValue,
                    currentContext
                ];
            }
        case "Array":
            {
                const values = expression.value.map((element)=>{
                    const [value] = evaluate(element, context);
                    return value;
                });
                return [
                    vArray(values),
                    context
                ];
            }
        case "Record":
            {
                const value = vRecord((0,immutable.Map)(expression.value.map(([eKey, eValue])=>{
                    const [key] = evaluate(eKey, context);
                    if (key.type !== "String") {
                        return throwFrom(REOther("Record keys must be strings"), expression, context);
                    }
                    const keyString = key.value;
                    const [value] = evaluate(eValue, context);
                    return [
                        keyString,
                        value
                    ];
                })));
                return [
                    value,
                    context
                ];
            }
        case "Assign":
            {
                const [result] = evaluate(expression.right, context);
                return [
                    vVoid(),
                    Object.assign(Object.assign({}, context), {
                        bindings: context.bindings.set(expression.left, result)
                    })
                ];
            }
        case "Symbol":
            {
                const name = expression.value;
                const value = context.bindings.get(name);
                if (value === undefined) {
                    return throwFrom(RESymbolNotFound(expression.value), expression, context);
                } else {
                    return [
                        value,
                        context
                    ];
                }
            }
        case "Value":
            return [
                expression.value,
                context
            ];
        case "Ternary":
            {
                const [predicateResult] = evaluate(expression.condition, context);
                if (predicateResult.type === "Bool") {
                    return evaluate(predicateResult.value ? expression.ifTrue : expression.ifFalse, context);
                } else {
                    return throwFrom(REExpectedType("Boolean", ""), expression, context);
                }
            }
        case "Lambda":
            {
                return [
                    vLambda(new SquiggleLambda(expression.name, expression.parameters, context.bindings, expression.body, expression.ast.location)),
                    context
                ];
            }
        case "Call":
            {
                const [lambda] = evaluate(expression.fn, context);
                const argValues = expression.args.map((arg)=>{
                    const [argValue] = evaluate(arg, context);
                    return argValue;
                });
                switch(lambda.type){
                    case "Lambda":
                        const result = lambda.value.callFrom(argValues, context, evaluate, expression.ast.location);
                        return [
                            result,
                            context
                        ];
                    default:
                        return throwFrom(RENotAFunction(lambda.toString()), expression, context);
                }
            }
        default:
            throw new Error("Unreachable");
    }
};
const createDefaultContext = ()=>Context.createContext(stdLib, defaultEnv);
const evaluateExpressionToResult = (expression)=>{
    const context = createDefaultContext();
    try {
        const [value] = evaluate(expression, context);
        return Ok(value);
    } catch (e) {
        return Result.Error(IError.fromException(e));
    }
};
const evaluateStringToResult = (code)=>{
    const exprR = Result.fmap(parse(code, "main"), expressionFromAst);
    return Result.bind(Result.errMap(exprR, IError.fromParseError), evaluateExpressionToResult);
}; //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqProject/ProjectItem.js









const emptyItem = (sourceId)=>({
        sourceId,
        source: "",
        bindings: (0,immutable.Map)(),
        continues: [],
        includes: result_Ok([]),
        directIncludes: [],
        includeAsVariables: []
    });
const touchSource = (t)=>{
    const r = emptyItem(t.sourceId);
    return Object.assign(Object.assign({}, r), {
        source: t.source,
        continues: t.continues,
        includes: t.includes,
        includeAsVariables: t.includeAsVariables,
        directIncludes: t.directIncludes
    });
};
const touchRawParse = (t)=>{
    const r = emptyItem(t.sourceId);
    return Object.assign(Object.assign({}, r), {
        source: t.source,
        continues: t.continues,
        includes: t.includes,
        includeAsVariables: t.includeAsVariables,
        directIncludes: t.directIncludes,
        rawParse: t.rawParse
    });
};
const touchExpression = (t)=>{
    return Object.assign(Object.assign({}, t), {
        source: t.source,
        continues: t.continues,
        includes: t.includes,
        includeAsVariables: t.includeAsVariables,
        directIncludes: t.directIncludes,
        rawParse: t.rawParse,
        expression: t.expression
    });
};
const resetIncludes = (t)=>{
    return Object.assign(Object.assign({}, t), {
        includes: result_Ok([]),
        includeAsVariables: [],
        directIncludes: []
    });
};
const setSource = (t, source)=>{
    return touchSource(resetIncludes(Object.assign(Object.assign({}, t), {
        source
    })));
};
const setRawParse = (t, rawParse)=>{
    return touchRawParse(Object.assign(Object.assign({}, t), {
        rawParse: rawParse
    }));
};
const setExpression = (t, expression)=>{
    return touchExpression(Object.assign(Object.assign({}, t), {
        expression: expression
    }));
};
const setBindings = (t, bindings)=>{
    return Object.assign(Object.assign({}, t), {
        bindings
    });
};
const setResult = (t, result)=>{
    return Object.assign(Object.assign({}, t), {
        result
    });
};
const cleanResults = touchExpression;
const clean = (t)=>{
    return Object.assign(Object.assign({}, t), {
        source: t.source,
        bindings: t.bindings,
        result: t.result
    });
};
const getImmediateDependencies = (t)=>{
    if (!t.includes.ok) {
        return [];
    }
    return [
        ...t.includes.value,
        ...t.continues
    ];
};
const getPastChain = (t)=>[
        ...t.directIncludes,
        ...t.continues
    ];
const setContinues = (t, continues)=>touchSource(Object.assign(Object.assign({}, t), {
        continues
    }));
const setIncludes = (t, includes)=>Object.assign(Object.assign({}, t), {
        includes
    });
const ProjectItem_parseIncludes = (t, resolver)=>{
    const rRawImportAsVariables = parseIncludes(t.source);
    if (!rRawImportAsVariables.ok) {
        return setIncludes(resetIncludes(t), rRawImportAsVariables);
    } else {
        const rawImportAsVariables = rRawImportAsVariables.value.map(([variable, file])=>[
                variable,
                resolver(file, t.sourceId)
            ]);
        const includes = rawImportAsVariables.map(([_variable, file])=>file);
        const includeAsVariables = rawImportAsVariables.filter(([variable, _file])=>variable !== "");
        const directIncludes = rawImportAsVariables.filter(([variable, _file])=>variable === "").map(([_variable, file])=>file);
        return Object.assign(Object.assign({}, t), {
            includes: result_Ok(includes),
            includeAsVariables,
            directIncludes
        });
    }
};
const rawParse = (t)=>{
    if (t.rawParse) {
        return t;
    }
    const rawParse = errMap(parse_parse(t.source, t.sourceId), (e)=>new SqError(IError_IError.fromParseError(e)));
    return setRawParse(t, rawParse);
};
const buildExpression = (t)=>{
    t = rawParse(t);
    if (t.expression) {
        return t;
    }
    if (!t.rawParse) {
        throw new Error("Internal logic error");
    }
    const expression = fmap(t.rawParse, (node)=>toExpression_expressionFromAst(node));
    return setExpression(t, expression);
};
const failRun = (t, e)=>setBindings(setResult(t, result_Error(e)), (0,immutable.Map)());
const run = (t, context)=>{
    t = buildExpression(t);
    if (t.result) {
        return t;
    }
    if (!t.expression) {
        throw new Error("Internal logic error");
    }
    if (!t.expression.ok) {
        return failRun(t, t.expression.value);
    }
    try {
        const [result, contextAfterEvaluation] = evaluate(t.expression.value, context);
        return setBindings(setResult(t, result_Ok(result)), contextAfterEvaluation.bindings.locals());
    } catch (e) {
        return failRun(t, new SqError(IError_IError.fromException(e)));
    }
}; //# sourceMappingURL=ProjectItem.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqProject/Topology.js
const dfs = ({ getEdges , visited =new Set() , from , result  })=>{
    const _dfs = (id)=>{
        if (visited.has(id)) return;
        visited.add(id);
        for (const dependencyId of getEdges(id)){
            if (visited.has(dependencyId)) continue;
            _dfs(dependencyId);
        }
        result.push(id);
    };
    _dfs(from);
};
const getRunOrder = (project)=>{
    const visited = new Set();
    const runOrder = [];
    for (const sourceId of project.getSourceIds()){
        dfs({
            getEdges: (id)=>project.getImmediateDependencies(id),
            visited,
            from: sourceId,
            result: runOrder
        });
    }
    return runOrder;
};
const getRunOrderFor = (project, sourceId)=>{
    const result = [];
    dfs({
        getEdges: (id)=>project.getImmediateDependencies(id),
        from: sourceId,
        result
    });
    return result;
};
const getDependencies = (project, sourceId)=>{
    const runOrder = getRunOrderFor(project, sourceId);
    return runOrder.filter((id)=>id !== sourceId);
};
const getInverseGraph = (project)=>{
    var _a;
    const graph = new Map();
    for (const id of project.getSourceIds()){
        const dependencies = project.getImmediateDependencies(id);
        for (const dependencyId of dependencies){
            const edges = (_a = graph.get(dependencyId)) !== null && _a !== void 0 ? _a : [];
            edges.push(id);
            graph.set(dependencyId, edges);
        }
    }
    return graph;
};
const getDependents = (project, sourceId)=>{
    const graph = getInverseGraph(project);
    const result = [];
    dfs({
        getEdges: (id)=>{
            var _a;
            return (_a = graph.get(id)) !== null && _a !== void 0 ? _a : [];
        },
        from: sourceId,
        result
    });
    return result.filter((id)=>id !== sourceId).reverse();
};
const runOrderDiff = (current, previous)=>{
    const affected = [];
    let eq = true;
    for(let i = 0; i < current.length; i++){
        if (!eq || i >= previous.length || previous[i] !== current[i]) {
            eq = false;
            affected.push(current[i]);
        }
    }
    return affected;
}; //# sourceMappingURL=Topology.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/SqProject/index.js














class SqProject_SqProject {
    constructor(options){
        this.items = new Map();
        this.stdLib = library_stdLib;
        this.environment = env_defaultEnv;
        this.previousRunOrder = [];
        this.resolver = options === null || options === void 0 ? void 0 : options.resolver;
    }
    static create(options) {
        return new SqProject_SqProject(options);
    }
    setEnvironment(environment) {
        this.environment = environment;
    }
    getEnvironment() {
        return this.environment;
    }
    getStdLib() {
        return this.stdLib;
    }
    setStdLib(value) {
        this.stdLib = value;
    }
    getSourceIds() {
        return Array.from(this.items.keys());
    }
    getItem(sourceId) {
        var _a;
        return (_a = this.items.get(sourceId)) !== null && _a !== void 0 ? _a : emptyItem(sourceId);
    }
    setItem(sourceId, item) {
        this.items.set(sourceId, item);
    }
    touchSource_(sourceId) {
        const item = this.getItem(sourceId);
        const newItem = touchSource(item);
        this.setItem(sourceId, newItem);
    }
    touchDependents(sourceId) {
        getDependents(this, sourceId).forEach((id)=>this.touchSource_(id));
    }
    getImmediateDependencies(sourceId) {
        return getImmediateDependencies(this.getItem(sourceId));
    }
    getRunOrder() {
        return getRunOrder(this);
    }
    getRunOrderFor(sourceId) {
        return getRunOrderFor(this, sourceId);
    }
    getDependents(sourceId) {
        return getDependents(this, sourceId);
    }
    getDependencies(sourceId) {
        return getDependencies(this, sourceId);
    }
    handleNewTopology() {
        const previousRunOrder = this.previousRunOrder;
        const currentRunOrder = this.getRunOrder();
        const diff = runOrderDiff(currentRunOrder, previousRunOrder);
        diff.forEach((id)=>this.touchSource(id));
        this.previousRunOrder = currentRunOrder;
    }
    touchSource(sourceId) {
        this.touchSource_(sourceId);
        this.touchDependents(sourceId);
    }
    setSource(sourceId, value) {
        const newItem = setSource(this.getItem(sourceId), value);
        this.setItem(sourceId, newItem);
        this.touchDependents(sourceId);
    }
    removeSource(sourceId) {
        this.items.delete(sourceId);
    }
    getSource(sourceId) {
        var _a;
        return (_a = this.items.get(sourceId)) === null || _a === void 0 ? void 0 : _a.source;
    }
    clean(sourceId) {
        const newItem = clean(this.getItem(sourceId));
        this.setItem(sourceId, newItem);
    }
    cleanAll() {
        this.getSourceIds().forEach((id)=>this.clean(id));
    }
    cleanResults(sourceId) {
        const newItem = cleanResults(this.getItem(sourceId));
        this.setItem(sourceId, newItem);
    }
    cleanAllResults() {
        this.getSourceIds().forEach((id)=>this.cleanResults(id));
    }
    getIncludes(sourceId) {
        return this.getItem(sourceId).includes;
    }
    getPastChain(sourceId) {
        return getPastChain(this.getItem(sourceId));
    }
    getIncludesAsVariables(sourceId) {
        return this.getItem(sourceId).includeAsVariables;
    }
    getDirectIncludes(sourceId) {
        return this.getItem(sourceId).directIncludes;
    }
    getContinues(sourceId) {
        return this.getItem(sourceId).continues;
    }
    setContinues(sourceId, continues) {
        const newItem = setContinues(this.getItem(sourceId), continues);
        this.setItem(sourceId, newItem);
        this.handleNewTopology();
    }
    getResultOption(sourceId) {
        return this.getItem(sourceId).result;
    }
    getInternalResult(sourceId) {
        const result = this.getResultOption(sourceId);
        return result !== null && result !== void 0 ? result : result_Error(new SqError(IError_IError.fromMessage(ErrorMessage.needToRun())));
    }
    getResult(sourceId) {
        return fmap(this.getInternalResult(sourceId), (v)=>wrapValue(v, new SqValueLocation(this, sourceId, {
                root: "result",
                items: []
            })));
    }
    setResult(sourceId, value) {
        const newItem = setResult(this.getItem(sourceId), value);
        this.setItem(sourceId, newItem);
    }
    parseIncludes(sourceId) {
        if (!this.resolver) {
            throw new Error("Includes are not supported when resolver is unset");
        }
        const newItem = ProjectItem_parseIncludes(this.getItem(sourceId), this.resolver);
        this.setItem(sourceId, newItem);
        this.handleNewTopology();
    }
    rawParse(sourceId) {
        const newItem = rawParse(this.getItem(sourceId));
        this.setItem(sourceId, newItem);
    }
    getRawBindings(sourceId) {
        return this.getItem(sourceId).bindings;
    }
    getBindings(sourceId) {
        return new SqRecord(this.getRawBindings(sourceId), new SqValueLocation(this, sourceId, {
            root: "bindings",
            items: []
        }));
    }
    linkDependencies(sourceId) {
        const pastChain = this.getPastChain(sourceId);
        const namespace = (0,immutable.Map)().merge(this.getStdLib(), ...pastChain.map((id)=>this.getRawBindings(id)), ...pastChain.map((id)=>{
            const result = this.getInternalResult(id);
            if (!result.ok) {
                throw result.value;
            }
            return (0,immutable.Map)([
                [
                    "__result__",
                    result.value
                ]
            ]);
        }));
        const includesAsVariables = this.getIncludesAsVariables(sourceId);
        return includesAsVariables.reduce((acc, [variable, includeFile])=>acc.set(variable, vRecord(this.getRawBindings(includeFile))), namespace);
    }
    doLinkAndRun(sourceId) {
        const context = createContext(this.linkDependencies(sourceId), this.getEnvironment());
        const newItem = run(this.getItem(sourceId), context);
        this.setItem(sourceId, newItem);
    }
    runFromRunOrder(runOrder) {
        let error;
        for (const sourceId of runOrder){
            const cachedResult = this.getResultOption(sourceId);
            if (cachedResult) {
                if (!cachedResult.ok) {
                    error = cachedResult.value;
                }
                continue;
            }
            if (error) {
                this.setResult(sourceId, result_Error(error));
                continue;
            }
            this.doLinkAndRun(sourceId);
            const result = this.getResultOption(sourceId);
            if (result && !result.ok) {
                error = result.value;
            }
        }
    }
    runAll() {
        this.runFromRunOrder(this.getRunOrder());
    }
    run(sourceId) {
        this.runFromRunOrder(getRunOrderFor(this, sourceId));
    }
}
const SqProject_evaluate = (sourceCode)=>{
    let project = SqProject_SqProject.create();
    project.setSource("main", sourceCode);
    project.runAll();
    return [
        project.getResult("main"),
        project.getBindings("main")
    ];
}; //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/public/parse.js


class SqParseError {
    constructor(_value){
        this._value = _value;
    }
    getMessage() {
        return this._value.message;
    }
    getLocation() {
        return this._value.location;
    }
}
function public_parse_parse(squiggleString) {
    const parseResult = astParse(squiggleString, "main");
    return Result.fmap2(parseResult, (ast)=>ast, (error)=>new SqParseError(error));
} //# sourceMappingURL=parse.js.map

;// CONCATENATED MODULE: ../squiggle-lang/dist/esm/src/index.js














const src_run = (code, options)=>{
    const project = SqProject.create();
    project.setSource("main", code);
    if (options === null || options === void 0 ? void 0 : options.environment) {
        project.setEnvironment(options.environment);
    }
    project.run("main");
    const result = project.getResult("main");
    const bindings = project.getBindings("main");
    return {
        result,
        bindings
    };
};
function sq(strings, ...rest) {
    if (rest.length) {
        throw new Error("Extrapolation in sq`` template literals is forbidden");
    }
    return strings.join("");
} //# sourceMappingURL=index.js.map

;// CONCATENATED MODULE: external "@prisma/client"
const client_namespaceObject = require("@prisma/client");
;// CONCATENATED MODULE: ./src/prisma.ts

const prisma = global._prisma || new client_namespaceObject.PrismaClient({
    log: [
        "query"
    ]
});
if (false) {}

;// CONCATENATED MODULE: ./src/schema/squiggle.ts




function getKey(code) {
    return external_crypto_default().createHash("md5").update(code).digest("base64");
}
const squiggleValueToJSON = (value)=>{
    // this is a lazy shortcut to traverse the value tree; should be reimplemented without parse/stringify
    return JSON.parse(JSON.stringify(value.asJS(), (key, value)=>{
        if (value instanceof Map) {
            return Object.fromEntries(value.entries());
        }
        if (value instanceof SqAbstractDistribution) {
            return value.toString();
        }
        return value;
    }));
};
function runSquiggle(code) {
    const MAIN = "main";
    const project = SqProject_SqProject.create();
    project.setSource(MAIN, code);
    project.run(MAIN);
    const result = project.getResult(MAIN);
    const bindings = project.getBindings(MAIN);
    return result.ok ? {
        isCached: false,
        isOk: true,
        resultJSON: squiggleValueToJSON(result.value),
        bindingsJSON: squiggleValueToJSON(bindings.asValue())
    } : {
        isCached: false,
        isOk: false,
        errorString: result.value.toString()
    };
}
const SquiggleOutputObj = builder.interfaceRef("SquiggleOutput").implement({
    fields: (t)=>({
            isCached: t.exposeBoolean("isCached")
        })
});
builder.objectType(builder.objectRef("SquiggleOkOutput"), {
    name: "SquiggleOkOutput",
    interfaces: [
        SquiggleOutputObj
    ],
    isTypeOf: (value)=>value.isOk,
    fields: (t)=>({
            resultJSON: t.string({
                resolve (obj) {
                    return JSON.stringify(obj.resultJSON);
                }
            }),
            bindingsJSON: t.string({
                resolve (obj) {
                    return JSON.stringify(obj.bindingsJSON);
                }
            })
        })
});
builder.objectType(builder.objectRef("SquiggleErrorOutput"), {
    name: "SquiggleErrorOutput",
    interfaces: [
        SquiggleOutputObj
    ],
    isTypeOf: (value)=>!value.isOk,
    fields: (t)=>({
            errorString: t.exposeString("errorString")
        })
});
builder.queryField("runSquiggle", (t)=>t.field({
        type: SquiggleOutputObj,
        args: {
            code: t.arg.string({
                required: true
            })
        },
        async resolve (_, { code  }) {
            const key = getKey(code);
            const cached = await prisma.squiggleCache.findUnique({
                where: {
                    id: key
                }
            });
            if (cached) {
                return {
                    isCached: true,
                    isOk: cached.ok,
                    errorString: cached.error,
                    resultJSON: cached.result,
                    bindingsJSON: cached.bindings
                }; // cache is less strictly typed than SquiggleOutput, so we have to force-cast it
            }
            const result = runSquiggle(code);
            await prisma.squiggleCache.upsert({
                where: {
                    id: key
                },
                create: {
                    id: key,
                    ok: result.isOk,
                    result: result.resultJSON ?? undefined,
                    bindings: result.bindingsJSON ?? undefined,
                    error: result.errorString
                },
                update: {
                    ok: result.isOk,
                    result: result.resultJSON ?? undefined,
                    bindings: result.bindingsJSON ?? undefined,
                    error: result.errorString
                }
            });
            return result;
        }
    }));

;// CONCATENATED MODULE: ./src/schema/index.ts


const schema = builder.toSchema();

// EXTERNAL MODULE: ../../node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(7230);
;// CONCATENATED MODULE: ./src/app/route.ts



const yoga = (0,cjs.createYoga)({
    graphqlEndpoint: "/",
    schema: schema
});
async function GET(request) {
    const response = await yoga.fetch(request, {
        method: request.method,
        headers: request.headers,
        body: request.body
    });
    return new next_response/* default */.Z(response.body, {
        headers: response.headers,
        status: response.status
    });
}
const POST = GET;

;// CONCATENATED MODULE: ../../node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Froute&name=app%2Froute&pagePath=private-next-app-dir%2Froute.ts&appDir=%2FUsers%2Fozziegooen%2FDocuments%2FGitHub.nosync%2Fsquiggle%2Fpackages%2Fapi-server%2Fsrc%2Fapp&appPaths=%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&assetPrefix=&nextConfigOutput=&preferredRegion=!

    

    

    

    const routeModule = new (module_default())({
    userland: route_namespaceObject,
    pathname: "/",
    resolvedPagePath: "/Users/ozziegooen/Documents/GitHub.nosync/squiggle/packages/api-server/src/app/route.ts",
    nextConfigOutput: undefined,
  })

    // Pull out the exports that we need to expose from the module. This should
    // be eliminated when we've moved the other routes to the new format. These
    // are used to hook into the route.
    const {
      requestAsyncStorage,
      staticGenerationAsyncStorage,
      serverHooks,
      headerHooks,
      staticGenerationBailout
    } = routeModule

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [512], () => (__webpack_exec__(6482)));
module.exports = __webpack_exports__;

})();