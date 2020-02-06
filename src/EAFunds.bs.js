'use strict';


function yearlyMeanGrowthRateIfNotClosed(group) {
  return {
          meanDiff: 1.1,
          stdDiff: 1.1
        };
}

function yearlyChanceOfClosing(group) {
  return 0.1;
}

function yearlyStdevGrowthRate(group, year, parameter) {
  if (group) {
    return /* tuple */[
            30,
            30
          ];
  } else {
    return /* tuple */[
            50,
            10
          ];
  }
}

var PayoutsIfAround = {
  yearlyMeanGrowthRateIfNotClosed: yearlyMeanGrowthRateIfNotClosed,
  yearlyChanceOfClosing: yearlyChanceOfClosing,
  yearlyStdevGrowthRate: yearlyStdevGrowthRate
};

exports.PayoutsIfAround = PayoutsIfAround;
/* No side effect */
