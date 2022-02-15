"use strict";
exports.__esModule = true;
exports.Default = void 0;
var React = require("react");
var SquiggleChart_1 = require("./SquiggleChart");
exports["default"] = {
    title: 'Example/SquiggleChart',
    component: SquiggleChart_1.SquiggleChart
};
var Template = function (_a) {
    var squiggleString = _a.squiggleString;
    return React.createElement(SquiggleChart_1.SquiggleChart, { squiggleString: squiggleString });
};
exports.Default = Template.bind({});
exports.Default.args = {
    squiggleString: "normal(5, 2)"
};
//# sourceMappingURL=SquiggleChart.stories.js.map