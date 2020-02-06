'use strict';


function normal(mean, std) {
  var nMean = mean.toPrecision(4);
  var nStd = std.toPrecision(2);
  return "normal(" + (String(nMean) + (", " + (String(nStd) + ")")));
}

function divide(str1, str2) {
  return "" + (String(str1) + ("/" + (String(str2) + "")));
}

exports.normal = normal;
exports.divide = divide;
/* No side effect */
