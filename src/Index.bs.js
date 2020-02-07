'use strict';

var React = require("react");
var ReactDOMRe = require("reason-react/src/ReactDOMRe.js");
var EAFunds_Form$ProbExample = require("./EAFunds/EAFunds_Form.bs.js");

((import('./styles/index.css')));

ReactDOMRe.renderToElementWithId(React.createElement(EAFunds_Form$ProbExample.make, { }), "app");

/*  Not a pure module */
