'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Math$ProbExample = require("../Math.bs.js");
var Model$ProbExample = require("../Model.bs.js");

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
  return /* FloatCdf */Block.__(3, [calculateDifference(currentValue(group, output), year, /* record */[
                  /* meanDiff */1.1,
                  /* stdDiff */1.1
                ])]);
}

var model_002 = /* assumptions : :: */[
  Model$ProbExample.Input.make("Yearly Growth Rate", /* FloatPoint */0, undefined, /* () */0),
  /* :: */[
    Model$ProbExample.Input.currentYear,
    /* [] */0
  ]
];

var model_003 = /* inputs : :: */[
  Model$ProbExample.Input.make("Fund", /* SingleChoice */Block.__(1, [/* record */[
            /* options : :: */[
              /* tuple */[
                "Animal Welfare Fund",
                "animal"
              ],
              /* :: */[
                /* tuple */[
                  "Global Health Fund",
                  "globalHealth"
                ],
                /* :: */[
                  /* tuple */[
                    "Long Term Future Fund",
                    "longTerm"
                  ],
                  /* :: */[
                    /* tuple */[
                      "Meta Fund",
                      "meta"
                    ],
                    /* :: */[
                      /* tuple */[
                        "All",
                        "all"
                      ],
                      /* [] */0
                    ]
                  ]
                ]
              ]
            ],
            /* default */"total"
          ]]), undefined, /* () */0),
  /* :: */[
    Model$ProbExample.Input.make("Year", /* Year */Block.__(0, [/* record */[
              /* default */2030.0,
              /* min */2020.0,
              /* max */2050.0
            ]]), undefined, /* () */0),
    /* [] */0
  ]
];

var model_004 = /* outputs : :: */[
  Model$ProbExample.Output.make("Payments", /* FloatCdf */2, undefined, /* () */0),
  /* :: */[
    Model$ProbExample.Output.make("Payouts", /* FloatCdf */2, undefined, /* () */0),
    /* [] */0
  ]
];

var model = /* record */[
  /* name */"Calculate the payments and payouts of EA Funds based on existing data.",
  /* author */"George Harrison",
  model_002,
  model_003,
  model_004,
  /* outputConfig : Single */0
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
  var match = p[/* assumptions */0];
  var match$1 = p[/* inputs */1];
  if (match) {
    var match$2 = match[0];
    if (match$2 !== undefined) {
      var match$3 = match$2;
      if (match$3.tag) {
        return ;
      } else {
        var match$4 = match[1];
        if (match$4) {
          var match$5 = match$4[0];
          if (match$5 !== undefined && !(match$5.tag || match$4[1] || !match$1)) {
            var match$6 = match$1[0];
            if (match$6 !== undefined) {
              var match$7 = match$6;
              if (match$7.tag === /* SingleChoice */1 && !match$1[1]) {
                return go(convertChoice(match$7[0]), match$3[0], /* DONATIONS */0);
              } else {
                return ;
              }
            } else {
              return ;
            }
          } else {
            return ;
          }
        } else {
          return ;
        }
      }
    } else {
      return ;
    }
  }
  
}

var Interface = {
  model: model,
  convertChoice: convertChoice,
  run: run
};

exports.PayoutsIfAround = PayoutsIfAround;
exports.go = go;
exports.Interface = Interface;
/* model Not a pure module */
