'use strict';

var React = require("react");
var ReactDOMRe = require("reason-react/src/ReactDOMRe.js");
var EAFunds_Model$ProbExample = require("./EAFunds/EAFunds_Model.bs.js");

((import('./styles/index.css')));

ReactDOMRe.renderToElementWithId(React.createElement(EAFunds_Model$ProbExample.Interface.Form.make, { }), "app");

/*  Not a pure module */
