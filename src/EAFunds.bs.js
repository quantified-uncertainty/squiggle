'use strict';

var Math$ReasonReactExamples = require("./Math.bs.js");

function yearDiff(year) {
  return year - 2020.0;
}

function yearlyMeanGrowthRateIfNotClosed(group) {
  return {
          meanDiff: 1.1,
          stdDiff: 1.1
        };
}

function calculateDifference(currentValue, yearInQuestion, y) {
  var yearDiff = yearInQuestion - 2020.0;
  var meanDiff = Math.pow(y.meanDiff, yearDiff);
  var stdDevDiff = Math.pow(y.meanDiff, yearDiff);
  return Math$ReasonReactExamples.normal(currentValue * meanDiff, 0.2 * stdDevDiff);
}

function currentValue(group, parameter) {
  if (group) {
    switch (group[0]) {
      case /* ANIMAL_WELFARE */0 :
          if (parameter) {
            return 2300000.0;
          } else {
            return 300000.0;
          }
      case /* GLOBAL_HEALTH */1 :
          if (parameter) {
            return 500000.0;
          } else {
            return 1000000.0;
          }
      case /* LONG_TERM_FUTURE */2 :
          if (parameter) {
            return 120000.0;
          } else {
            return 600000.0;
          }
      case /* META */3 :
          if (parameter) {
            return 830000.0;
          } else {
            return 9300000.0;
          }
      
    }
  } else {
    return currentValue(/* Fund */[/* ANIMAL_WELFARE */0], parameter) + currentValue(/* Fund */[/* GLOBAL_HEALTH */1], parameter) + currentValue(/* Fund */[/* LONG_TERM_FUTURE */2], parameter) + currentValue(/* Fund */[/* META */3], parameter);
  }
}

var PayoutsIfAround = {
  currentYear: 2020,
  firstYearStdDev: 0.2,
  yearDiff: yearDiff,
  yearlyMeanGrowthRateIfNotClosed: yearlyMeanGrowthRateIfNotClosed,
  calculateDifference: calculateDifference,
  currentValue: currentValue
};

function calculate(group, year, parameter) {
  return calculateDifference(currentValue(group, parameter), year, {
              meanDiff: 1.1,
              stdDiff: 1.1
            });
}

exports.PayoutsIfAround = PayoutsIfAround;
exports.calculate = calculate;
/* No side effect */
