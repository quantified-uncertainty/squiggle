'use strict';

var $$Array = require("bs-platform/lib/js/array.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Antd_Radio = require("bs-ant-design-alt/src/Antd_Radio.js");
var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var ReForm$BsReform = require("bs-reform/src/ReForm.bs.js");
var EAFunds_Data$ProbExample = require("./EAFunds_Data.bs.js");
var EAFunds_Model$ProbExample = require("./EAFunds_Model.bs.js");

function get(state, field) {
  switch (field) {
    case /* Group */0 :
        return state[/* group */0];
    case /* Year */1 :
        return state[/* year */1];
    case /* Parameter */2 :
        return state[/* parameter */2];
    
  }
}

function set(state, field, value) {
  switch (field) {
    case /* Group */0 :
        return /* record */[
                /* group */value,
                /* year */state[/* year */1],
                /* parameter */state[/* parameter */2]
              ];
    case /* Year */1 :
        return /* record */[
                /* group */state[/* group */0],
                /* year */value,
                /* parameter */state[/* parameter */2]
              ];
    case /* Parameter */2 :
        return /* record */[
                /* group */state[/* group */0],
                /* year */state[/* year */1],
                /* parameter */value
              ];
    
  }
}

var FormConfig = {
  get: get,
  set: set
};

var Form = ReForm$BsReform.Make({
      set: set,
      get: get
    });

function handleChange(handleChange$1, $$event) {
  return Curry._1(handleChange$1, $$event.target.value);
}

function EAFunds_Form(Props) {
  var match = React.useState((function () {
          return "Animal Welfare Fund";
        }));
  var setGroup = match[1];
  var group = match[0];
  React.useState((function () {
          return 0.3;
        }));
  var match$1 = React.useState((function () {
          return "Donations";
        }));
  var setProperty = match$1[1];
  var property = match$1[0];
  var foundGroup = Belt_Array.getBy(EAFunds_Data$ProbExample.funds, (function (r) {
          return r[/* name */1] === group;
        }));
  var foundProperty;
  switch (property) {
    case "Donations" :
        foundProperty = /* DONATIONS */0;
        break;
    case "Payouts" :
        foundProperty = /* PAYOUTS */1;
        break;
    default:
      foundProperty = undefined;
  }
  return React.createElement(React.Fragment, undefined, React.createElement(Antd_Radio.Group.make, {
                  value: group,
                  onChange: (function (param) {
                      return Curry._1(setGroup, param.target.value);
                    }),
                  children: $$Array.map((function (f) {
                          return React.createElement(Antd_Radio.make, {
                                      value: f[/* name */1],
                                      children: f[/* name */1]
                                    });
                        }), EAFunds_Data$ProbExample.funds)
                }), React.createElement(Antd_Radio.Group.make, {
                  value: property,
                  onChange: (function (param) {
                      return Curry._1(setProperty, param.target.value);
                    }),
                  children: null
                }, React.createElement(Antd_Radio.make, {
                      value: "Donations",
                      children: "Donations"
                    }), React.createElement(Antd_Radio.make, {
                      value: "Payouts",
                      children: "Payouts"
                    })), foundGroup !== undefined && foundProperty !== undefined ? EAFunds_Model$ProbExample.run(foundGroup[/* group */0], 2029, foundProperty) : "");
}

var make = EAFunds_Form;

exports.FormConfig = FormConfig;
exports.Form = Form;
exports.handleChange = handleChange;
exports.make = make;
/* Form Not a pure module */
