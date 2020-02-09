'use strict';

var React = require("react");
var ReactDOMRe = require("reason-react/src/ReactDOMRe.js");
var Prop$ProbExample = require("./lib/Prop.bs.js");
var EAFunds_Model$ProbExample = require("./Models/EAFunds/EAFunds_Model.bs.js");

((import('./styles/index.css')));

ReactDOMRe.renderToElementWithId(React.createElement(Prop$ProbExample.ModelForm.make, {
          model: EAFunds_Model$ProbExample.Interface.model
        }), "app");

/*  Not a pure module */
