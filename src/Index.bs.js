'use strict';

var React = require("react");
var ReactDOMRe = require("reason-react/src/ReactDOMRe.js");
var App$ProbExample = require("./App.bs.js");

((import('./styles/index.css')));

ReactDOMRe.renderToElementWithId(React.createElement(App$ProbExample.make, { }), "app");

/*  Not a pure module */
