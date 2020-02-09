'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Math$ProbExample = require("../Math.bs.js");
var Prop$ProbExample = require("../Prop.bs.js");

function yearDiff(year) {
  return year - 2020.0;
}

function yearlyMeanGrowthRateIfNotClosed(group) {
  return /* record */[
          /* meanDiff */1.1,
          /* stdDiff */1.1
        ];
}

function calculateDifference(currentValue, yearInQuestion, y) {
  var yearDiff = yearInQuestion - 2020.0;
  var meanDiff = Math.pow(y[/* meanDiff */0], yearDiff);
  var stdDevDiff = Math.pow(y[/* meanDiff */0], yearDiff);
  return Math$ProbExample.normal(currentValue * meanDiff, 0.2 * stdDevDiff);
}

function currentValue(group, output) {
  if (group) {
    switch (group[0]) {
      case /* ANIMAL_WELFARE */0 :
          if (output) {
            return 2300000.0;
          } else {
            return 300000.0;
          }
      case /* GLOBAL_HEALTH */1 :
          if (output) {
            return 500000.0;
          } else {
            return 1000000.0;
          }
      case /* LONG_TERM_FUTURE */2 :
          if (output) {
            return 120000.0;
          } else {
            return 600000.0;
          }
      case /* META */3 :
          if (output) {
            return 830000.0;
          } else {
            return 9300000.0;
          }
      
    }
  } else {
    return currentValue(/* Fund */[/* ANIMAL_WELFARE */0], output) + currentValue(/* Fund */[/* GLOBAL_HEALTH */1], output) + currentValue(/* Fund */[/* LONG_TERM_FUTURE */2], output) + currentValue(/* Fund */[/* META */3], output);
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

function go(group, year, output) {
  return /* FloatCdf */Block.__(2, [calculateDifference(currentValue(group, output), year, /* record */[
                  /* meanDiff */1.1,
                  /* stdDiff */1.1
                ])]);
}

var model_002 = /* inputTypes : array */[
  Prop$ProbExample.TypeWithMetadata.make("Fund", /* SelectSingle */Block.__(0, [/* record */[
            /* options : :: */[
              /* record */[
                /* id */"animal",
                /* name */"Animal Welfare Fund"
              ],
              /* :: */[
                /* record */[
                  /* id */"globalHealth",
                  /* name */"Global Health Fund"
                ],
                /* :: */[
                  /* record */[
                    /* id */"longTerm",
                    /* name */"Long Term Future Fund"
                  ],
                  /* :: */[
                    /* record */[
                      /* id */"longterm",
                      /* name */"Meta Fund"
                    ],
                    /* :: */[
                      /* record */[
                        /* id */"all",
                        /* name */"All"
                      ],
                      /* [] */0
                    ]
                  ]
                ]
              ]
            ],
            /* default */"total"
          ]]), undefined, undefined, undefined, /* () */0),
  Prop$ProbExample.TypeWithMetadata.make("Year", /* Year */Block.__(2, [/* record */[
            /* default */2030.0,
            /* min */2020.0,
            /* max */2050.0
          ]]), undefined, undefined, undefined, /* () */0)
];

var model_003 = /* outputTypes : array */[];

var model = /* record */[
  /* name */"Calculate the payments and payouts of EA Funds based on existing data.",
  /* author */"George Harrison",
  model_002,
  model_003
];

function convertChoice(s) {
  switch (s) {
    case "animal" :
        return /* Fund */[/* ANIMAL_WELFARE */0];
    case "globalHealth" :
        return /* Fund */[/* GLOBAL_HEALTH */1];
    case "longTerm" :
        return /* Fund */[/* LONG_TERM_FUTURE */2];
    case "meta" :
        return /* Fund */[/* META */3];
    default:
      return /* All */0;
  }
}

function run(p) {
  var partial_arg = p[/* inputValues */1];
  var partial_arg$1 = Prop$ProbExample.ValueMap.get;
  var get = function (param) {
    return partial_arg$1(partial_arg, param);
  };
  var match = Curry._1(get, "Fund");
  var match$1 = Curry._1(get, "Year");
  if (match !== undefined) {
    var match$2 = match;
    switch (match$2.tag | 0) {
      case /* SelectSingle */0 :
          if (match$1 !== undefined) {
            var match$3 = match$1;
            switch (match$3.tag | 0) {
              case /* FloatPoint */1 :
                  return go(convertChoice(match$2[0]), match$3[0], /* DONATIONS */0);
              case /* SelectSingle */0 :
              case /* FloatCdf */2 :
                  return ;
              
            }
          } else {
            return ;
          }
      case /* FloatPoint */1 :
      case /* FloatCdf */2 :
          return ;
      
    }
  }
  
}

function EAFunds_Model$Interface$Form(Props) {
  return React.createElement(Prop$ProbExample.ModelForm.make, {
              combo: Prop$ProbExample.Combo.fromModel(model)
            });
}

var Form = {
  make: EAFunds_Model$Interface$Form
};

var Interface = {
  model: model,
  convertChoice: convertChoice,
  run: run,
  Form: Form
};

exports.PayoutsIfAround = PayoutsIfAround;
exports.go = go;
exports.Interface = Interface;
/* model Not a pure module */
