'use strict';

var React = require("react");
var EAFunds$ReasonReactExamples = require("./EAFunds.bs.js");

var response = EAFunds$ReasonReactExamples.calculate(/* Fund */[/* GLOBAL_HEALTH */1], 2029, /* DONATIONS */0);

function Funds(Props) {
  return React.createElement("div", undefined, response);
}

var make = Funds;

exports.response = response;
exports.make = make;
/* response Not a pure module */
