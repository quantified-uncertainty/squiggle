'use strict';

var $$Array = require("bs-platform/lib/js/array.js");
var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Antd_Radio = require("bs-ant-design-alt/src/Antd_Radio.js");
var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var EAFunds_Data$ProbExample = require("./EAFunds_Data.bs.js");
var EAFunds_Model$ProbExample = require("./EAFunds_Model.bs.js");

function handleChange(handleChange$1, $$event) {
  return Curry._1(handleChange$1, $$event.target.value);
}

function get(state, field) {
  switch (field) {
    case /* Group */0 :
        return state[/* group */0];
    case /* Year */1 :
        return state[/* year */1];
    case /* Output */2 :
        return state[/* output */2];
    
  }
}

function set(state, field, value) {
  switch (field) {
    case /* Group */0 :
        return /* record */[
                /* group */value,
                /* year */state[/* year */1],
                /* output */state[/* output */2]
              ];
    case /* Year */1 :
        return /* record */[
                /* group */state[/* group */0],
                /* year */value,
                /* output */state[/* output */2]
              ];
    case /* Output */2 :
        return /* record */[
                /* group */state[/* group */0],
                /* year */state[/* year */1],
                /* output */value
              ];
    
  }
}

var Form = {
  get: get,
  set: set
};

function EAFunds_Form(Props) {
  var match = React.useState((function () {
          return /* record */[
                  /* group */"Animal Welfare Fund",
                  /* year */2021,
                  /* output */"Donations"
                ];
        }));
  var setForm = match[1];
  var form = match[0];
  var match$1 = React.useState((function () {
          return "Donations";
        }));
  var setProperty = match$1[1];
  var property = match$1[0];
  var foundGroup = Belt_Array.getBy(EAFunds_Data$ProbExample.funds, (function (r) {
          return r[/* name */1] === form[/* group */0];
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
  return React.createElement(React.Fragment, undefined, React.createElement("input", {
                  type: "number",
                  value: form[/* year */1].toString(),
                  onChange: (function (param) {
                      var r = param.target.value;
                      var r$1 = Number(r);
                      if (r$1 >= 2020.0 && r$1 <= 2050.0) {
                        return Curry._1(setForm, (function (param) {
                                      return set(form, /* Year */1, r$1);
                                    }));
                      } else {
                        return /* () */0;
                      }
                    })
                }), React.createElement(Antd_Radio.Group.make, {
                  value: form[/* group */0],
                  onChange: (function (param) {
                      var r = param.target.value;
                      return Curry._1(setForm, (function (param) {
                                    return set(form, /* Group */0, r);
                                  }));
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
                    })), foundGroup !== undefined && foundProperty !== undefined ? EAFunds_Model$ProbExample.run(foundGroup[/* group */0], form[/* year */1], foundProperty) : "");
}

var make = EAFunds_Form;

exports.handleChange = handleChange;
exports.Form = Form;
exports.make = make;
/* react Not a pure module */
