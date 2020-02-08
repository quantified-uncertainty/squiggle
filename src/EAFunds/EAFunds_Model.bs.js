'use strict';

var Block = require("bs-platform/lib/js/block.js");
var Curry = require("bs-platform/lib/js/curry.js");
var CamlinternalOO = require("bs-platform/lib/js/camlinternalOO.js");
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

function run(group, year, output) {
  return calculateDifference(currentValue(group, output), year, /* record */[
              /* meanDiff */1.1,
              /* stdDiff */1.1
            ]);
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
                      "metaFund"
                    ],
                    /* :: */[
                      /* tuple */[
                        "Total",
                        "total"
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
  model_004
];

var class_tables = [
  0,
  0,
  0
];

function run$1(a, i) {
  if (!class_tables[0]) {
    var $$class = CamlinternalOO.create_table(0);
    var env = CamlinternalOO.new_variable($$class, "");
    var env_init = function (env$1) {
      var self = CamlinternalOO.create_object_opt(0, $$class);
      self[env] = env$1;
      return self;
    };
    CamlinternalOO.init_class($$class);
    class_tables[0] = env_init;
  }
  return Curry._1(class_tables[0], 0);
}

var Interface = {
  model: model,
  run: run$1
};

exports.PayoutsIfAround = PayoutsIfAround;
exports.run = run;
exports.Interface = Interface;
/* model Not a pure module */
