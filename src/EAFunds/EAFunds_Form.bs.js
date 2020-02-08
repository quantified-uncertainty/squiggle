'use strict';

var $$Array = require("bs-platform/lib/js/array.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Belt_Option = require("bs-platform/lib/js/belt_Option.js");
var Belt_MapString = require("bs-platform/lib/js/belt_MapString.js");
var Model$ProbExample = require("../Model.bs.js");
var EAFunds_Model$ProbExample = require("./EAFunds_Model.bs.js");

function handleChange(handleChange$1, $$event) {
  return Curry._1(handleChange$1, $$event.target.value);
}

var model = EAFunds_Model$ProbExample.Interface.model;

var initialMap = Model$ProbExample.toMaps(model);

function EAFunds_Form(Props) {
  var match = React.useState((function () {
          return Model$ProbExample.toMaps(model);
        }));
  var params = match[0];
  return $$Array.map((function (parameter) {
                var __x = Belt_MapString.get(params[/* inputs */1], parameter[/* id */0]);
                var value = Belt_Option.flatMap(__x, (function (param) {
                        return param[1];
                      }));
                return React.createElement(React.Fragment, undefined, parameter[/* name */1], parameter[/* id */0], React.createElement(Model$ProbExample.Input.Form.make, {
                                parameter: parameter,
                                value: value,
                                onChange: (function (r) {
                                    console.log(r);
                                    return /* () */0;
                                  })
                              }));
              }), $$Array.of_list(model[/* inputs */3]));
}

var make = EAFunds_Form;

exports.handleChange = handleChange;
exports.model = model;
exports.initialMap = initialMap;
exports.make = make;
/* initialMap Not a pure module */
