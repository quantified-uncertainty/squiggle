'use strict';


function normal(mean, std) {
  var nMean = mean.toString();
  var nStd = std.toString();
  return "normal(" + (String(nMean) + (", " + (String(nStd) + ")")));
}

function divide(str1, str2) {
  return "" + (String(str1) + ("/" + (String(str2) + "")));
}

var $$Math = {
  normal: normal,
  divide: divide
};

function run(company, year, param) {
  var match = company.currentPrice;
  switch (param) {
    case /* SHARE_PRICE */0 :
        if (match !== undefined && year > 2019 && year < 2030) {
          var diffYears = year - 2020 | 0;
          return normal(match, diffYears * 0.1);
        } else {
          return ;
        }
    case /* SHARES_OUTSTANDING */1 :
        if (year > 2019 && year < 2030) {
          var price = run(company, year, /* SHARE_PRICE */0);
          var marketCap = run(company, year, /* MARKET_CAP */2);
          if (price !== undefined && marketCap !== undefined) {
            return divide(marketCap, price);
          } else {
            return ;
          }
        } else {
          return ;
        }
    case /* MARKET_CAP */2 :
        return ;
    
  }
}

exports.$$Math = $$Math;
exports.run = run;
/* No side effect */
