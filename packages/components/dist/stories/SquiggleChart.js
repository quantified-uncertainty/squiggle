"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.numberShow = exports.SquiggleChart = void 0;
var React = require("react");
var PropTypes = require("prop-types");
var _ = require("lodash");
var squiggle_lang_1 = require("@squiggle/squiggle-lang");
var react_vega_1 = require("react-vega");
var chartSpecification = require("./spec-distributions.json");
var percentilesSpec = require("./spec-pertentiles.json");
var SquiggleVegaChart = (0, react_vega_1.createClassFromSpec)({ 'spec': chartSpecification });
var SquigglePercentilesChart = (0, react_vega_1.createClassFromSpec)({ 'spec': percentilesSpec });
var SquiggleChart = function (_a) {
    var squiggleString = _a.squiggleString;
    var result = (0, squiggle_lang_1.run)(squiggleString);
    console.log(result);
    if (result.tag === "Ok") {
        var chartResults = result.value.map(function (chartResult) {
            console.log(chartResult);
            if (chartResult["NAME"] === "Float") {
                return React.createElement(MakeNumberShower, { precision: 3, number: chartResult["VAL"] });
            }
            else if (chartResult["NAME"] === "DistPlus") {
                var shape = chartResult.VAL.shape;
                if (shape.tag === "Continuous") {
                    var xyShape = shape.value.xyShape;
                    var totalY_1 = xyShape.ys.reduce(function (a, b) { return a + b; });
                    var total_1 = 0;
                    var cdf = xyShape.ys.map(function (y) {
                        total_1 += y;
                        return total_1 / totalY_1;
                    });
                    var values = _.zip(cdf, xyShape.xs, xyShape.ys).map(function (_a) {
                        var c = _a[0], x = _a[1], y = _a[2];
                        return ({ cdf: (c * 100).toFixed(2) + "%", x: x, y: y });
                    });
                    return (React.createElement(SquiggleVegaChart, { data: { "con": values } }));
                }
                else if (shape.tag === "Discrete") {
                    var xyShape = shape.value.xyShape;
                    var totalY_2 = xyShape.ys.reduce(function (a, b) { return a + b; });
                    var total_2 = 0;
                    var cdf = xyShape.ys.map(function (y) {
                        total_2 += y;
                        return total_2 / totalY_2;
                    });
                    var values = _.zip(cdf, xyShape.xs, xyShape.ys).map(function (_a) {
                        var c = _a[0], x = _a[1], y = _a[2];
                        return ({ cdf: (c * 100).toFixed(2) + "%", x: x, y: y });
                    });
                    return (React.createElement(SquiggleVegaChart, { data: { "dis": values } }));
                }
                else if (shape.tag === "Mixed") {
                    var discreteShape = shape.value.discrete.xyShape;
                    var totalDiscrete = discreteShape.ys.reduce(function (a, b) { return a + b; });
                    var discretePoints = _.zip(discreteShape.xs, discreteShape.ys);
                    var continuousShape = shape.value.continuous.xyShape;
                    var continuousPoints = _.zip(continuousShape.xs, continuousShape.ys);
                    ;
                    var markedDisPoints = discretePoints.map(function (_a) {
                        var x = _a[0], y = _a[1];
                        return ({ x: x, y: y, type: "discrete" });
                    });
                    var markedConPoints = continuousPoints.map(function (_a) {
                        var x = _a[0], y = _a[1];
                        return ({ x: x, y: y, type: "continuous" });
                    });
                    var sortedPoints = _.sortBy(markedDisPoints.concat(markedConPoints), 'x');
                    var totalContinuous_1 = 1 - totalDiscrete;
                    var totalY_3 = continuousShape.ys.reduce(function (a, b) { return a + b; });
                    var total_3 = 0;
                    var cdf = sortedPoints.map(function (point) {
                        if (point.type == "discrete") {
                            total_3 += point.y;
                            return total_3;
                        }
                        else if (point.type == "continuous") {
                            total_3 += point.y / totalY_3 * totalContinuous_1;
                            return total_3;
                        }
                    });
                    var cdfLabeledPoint = _.zipWith(cdf, sortedPoints, function (c, point) { return (__assign(__assign({}, point), { cdf: (c * 100).toFixed(2) + "%" })); });
                    var continuousValues = cdfLabeledPoint.filter(function (x) { return x.type == "continuous"; });
                    var discreteValues = cdfLabeledPoint.filter(function (x) { return x.type == "discrete"; });
                    return (React.createElement(SquiggleVegaChart, { data: { "con": continuousValues, "dis": discreteValues } }));
                }
            }
            else if (chartResult.NAME === "Function") {
                var data = _.range(0, 10, 0.1).map(function (_, i) {
                    var x = i / 10;
                    if (chartResult.NAME == "Function") {
                        var result_1 = chartResult.VAL(x);
                        if (result_1.tag == "Ok") {
                            var percentileArray = [
                                0.01,
                                0.05,
                                0.1,
                                0.2,
                                0.3,
                                0.4,
                                0.5,
                                0.6,
                                0.7,
                                0.8,
                                0.9,
                                0.95,
                                0.99
                            ];
                            var percentiles = getPercentiles(percentileArray, result_1.value);
                            return {
                                "x": x,
                                "p1": percentiles[0],
                                "p5": percentiles[1],
                                "p10": percentiles[2],
                                "p20": percentiles[3],
                                "p30": percentiles[4],
                                "p40": percentiles[5],
                                "p50": percentiles[6],
                                "p60": percentiles[7],
                                "p70": percentiles[8],
                                "p80": percentiles[9],
                                "p90": percentiles[10],
                                "p95": percentiles[11],
                                "p99": percentiles[12]
                            };
                        }
                    }
                    return 0;
                });
                return React.createElement(SquigglePercentilesChart, { data: { "facet": data } });
            }
        });
        return React.createElement(React.Fragment, null, chartResults);
    }
    else if (result.tag == "Error") {
        return (React.createElement("p", null, "Error parsing Squiggle: " + result.value));
    }
    return (React.createElement("p", null, "Invalid Response"));
};
exports.SquiggleChart = SquiggleChart;
function getPercentiles(percentiles, t) {
    if (t.shape.tag == "Discrete") {
        var total_4 = 0;
        var maxX_1 = _.max(t.shape.value.xyShape.xs);
        var bounds_1 = percentiles.map(function (_) { return maxX_1; });
        _.zipWith(t.shape.value.xyShape.xs, t.shape.value.xyShape.ys, function (x, y) {
            total_4 += y;
            percentiles.forEach(function (v, i) {
                if (total_4 > v && bounds_1[i] == maxX_1) {
                    bounds_1[i] = x;
                }
            });
        });
        return bounds_1;
    }
    else if (t.shape.tag == "Continuous") {
        var total_5 = 0;
        var maxX_2 = _.max(t.shape.value.xyShape.xs);
        var totalY_4 = _.sum(t.shape.value.xyShape.ys);
        var bounds_2 = percentiles.map(function (_) { return maxX_2; });
        _.zipWith(t.shape.value.xyShape.xs, t.shape.value.xyShape.ys, function (x, y) {
            total_5 += y / totalY_4;
            percentiles.forEach(function (v, i) {
                if (total_5 > v && bounds_2[i] == maxX_2) {
                    bounds_2[i] = x;
                }
            });
        });
        return bounds_2;
    }
    else if (t.shape.tag == "Mixed") {
        var discreteShape = t.shape.value.discrete.xyShape;
        var totalDiscrete = discreteShape.ys.reduce(function (a, b) { return a + b; });
        var discretePoints = _.zip(discreteShape.xs, discreteShape.ys);
        var continuousShape = t.shape.value.continuous.xyShape;
        var continuousPoints = _.zip(continuousShape.xs, continuousShape.ys);
        ;
        var markedDisPoints = discretePoints.map(function (_a) {
            var x = _a[0], y = _a[1];
            return ({ x: x, y: y, type: "discrete" });
        });
        var markedConPoints = continuousPoints.map(function (_a) {
            var x = _a[0], y = _a[1];
            return ({ x: x, y: y, type: "continuous" });
        });
        var sortedPoints = _.sortBy(markedDisPoints.concat(markedConPoints), 'x');
        var totalContinuous_2 = 1 - totalDiscrete;
        var totalY_5 = continuousShape.ys.reduce(function (a, b) { return a + b; });
        var total_6 = 0;
        var maxX_3 = _.max(sortedPoints.map(function (x) { return x.x; }));
        var bounds_3 = percentiles.map(function (_) { return maxX_3; });
        sortedPoints.map(function (point) {
            if (point.type == "discrete") {
                total_6 += point.y;
            }
            else if (point.type == "continuous") {
                total_6 += point.y / totalY_5 * totalContinuous_2;
            }
            percentiles.forEach(function (v, i) {
                if (total_6 > v && bounds_3[i] == maxX_3) {
                    bounds_3[i] = total_6;
                }
            });
            return total_6;
        });
        return bounds_3;
    }
}
exports.SquiggleChart.propTypes = {
    squiggleString: PropTypes.string
};
exports.SquiggleChart.defaultProps = {
    squggleString: "normal(5, 2)"
};
function MakeNumberShower(props) {
    var numberWithPresentation = numberShow(props.number, props.precision);
    return (React.createElement("span", null,
        numberWithPresentation.value,
        numberWithPresentation.symbol,
        numberWithPresentation.power ?
            React.createElement("span", null,
                '\u00b710',
                React.createElement("span", { style: { fontSize: "0.6em", verticalAlign: "super" } }, numberWithPresentation.power))
            : React.createElement(React.Fragment, null)));
}
var orderOfMagnitudeNum = function (n) {
    return Math.pow(10, n);
};
var orderOfMagnitude = function (n) {
    return Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
};
function withXSigFigs(number, sigFigs) {
    var withPrecision = number.toPrecision(sigFigs);
    var formatted = Number(withPrecision);
    return "".concat(formatted);
}
var NumberShower = (function () {
    function NumberShower(number, precision) {
        if (precision === void 0) { precision = 2; }
        this.number = number;
        this.precision = precision;
    }
    NumberShower.prototype.convert = function () {
        var number = Math.abs(this.number);
        var response = this.evaluate(number);
        if (this.number < 0) {
            response.value = '-' + response.value;
        }
        return response;
    };
    NumberShower.prototype.metricSystem = function (number, order) {
        var newNumber = number / orderOfMagnitudeNum(order);
        var precision = this.precision;
        return "".concat(withXSigFigs(newNumber, precision));
    };
    NumberShower.prototype.evaluate = function (number) {
        if (number === 0) {
            return { value: this.metricSystem(0, 0) };
        }
        var order = orderOfMagnitude(number);
        if (order < -2) {
            return { value: this.metricSystem(number, order), power: order };
        }
        else if (order < 4) {
            return { value: this.metricSystem(number, 0) };
        }
        else if (order < 6) {
            return { value: this.metricSystem(number, 3), symbol: 'K' };
        }
        else if (order < 9) {
            return { value: this.metricSystem(number, 6), symbol: 'M' };
        }
        else if (order < 12) {
            return { value: this.metricSystem(number, 9), symbol: 'B' };
        }
        else if (order < 15) {
            return { value: this.metricSystem(number, 12), symbol: 'T' };
        }
        else {
            return { value: this.metricSystem(number, order), power: order };
        }
    };
    return NumberShower;
}());
function numberShow(number, precision) {
    if (precision === void 0) { precision = 2; }
    var ns = new NumberShower(number, precision);
    return ns.convert();
}
exports.numberShow = numberShow;
//# sourceMappingURL=SquiggleChart.js.map