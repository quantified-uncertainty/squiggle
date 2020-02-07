'use strict';

var Curry = require("bs-platform/lib/js/curry.js");
var React = require("react");
var Antd_Form = require("bs-ant-design-alt/src/Antd_Form.js");
var Antd_Input = require("bs-ant-design-alt/src/Antd_Input.js");
var Antd_Radio = require("bs-ant-design-alt/src/Antd_Radio.js");
var ReForm$BsReform = require("bs-reform/src/ReForm.bs.js");
var Helpers$BsReform = require("bs-reform/src/Helpers.bs.js");

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

function EAFunds_Form$FieldString(Props) {
  Props.field;
  Props.label;
  return React.createElement(Form.Field.make, {
              field: /* Group */0,
              render: (function (param) {
                  var value = param[/* value */4];
                  var handleChange = param[/* handleChange */0];
                  return React.createElement(Antd_Form.Item.make, {
                              label: "Question Type",
                              help: "Number example: 'How many inches of rain will there be tomorrow?' Binary example: 'Will it rain tomorrow?'",
                              required: true,
                              children: React.createElement(Antd_Radio.Group.make, {
                                    defaultValue: value,
                                    value: value,
                                    onChange: (function (param) {
                                        return Helpers$BsReform.handleChange(handleChange, param);
                                      }),
                                    children: null
                                  }, React.createElement(Antd_Radio.make, {
                                        value: "FLOAT",
                                        children: "Number"
                                      }), React.createElement(Antd_Radio.make, {
                                        value: "PERCENTAGE",
                                        children: "Binary"
                                      }))
                            });
                })
            });
}

var FieldString = {
  make: EAFunds_Form$FieldString
};

function EAFunds_Form(Props) {
  return React.createElement(Antd_Input.make, { });
}

var make = EAFunds_Form;

exports.FormConfig = FormConfig;
exports.Form = Form;
exports.handleChange = handleChange;
exports.FieldString = FieldString;
exports.make = make;
/* Form Not a pure module */
