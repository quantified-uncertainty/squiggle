'use strict';

var React = require("react");
var EAFunds_Model$ProbExample = require("./EAFunds/EAFunds_Model.bs.js");

var response = EAFunds_Model$ProbExample.run(/* Fund */[/* GLOBAL_HEALTH */1], 2029, /* DONATIONS */0);

function Funds(Props) {
  return React.createElement("div", undefined, response);
}

var make = Funds;

exports.response = response;
exports.make = make;
/* response Not a pure module */
