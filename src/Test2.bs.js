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

function sharesOutstanding(price, marketCap) {
  if (price !== undefined && marketCap !== undefined) {
    return divide(marketCap, price);
  }
  
}

function run(company, year, param, otherSettings) {
  var match = company.currentPrice;
  var match$1 = company.marketCap;
  switch (param) {
    case /* SHARE_PRICE */0 :
        if (match !== undefined && year > 2019 && year < 2030) {
          var diffYears = year - otherSettings.currentYear | 0;
          return normal(match, diffYears * 0.1);
        } else {
          return ;
        }
    case /* SHARES_OUTSTANDING */1 :
        if (year > 2019 && year < 2030) {
          var price = run(company, year, /* SHARE_PRICE */0, otherSettings);
          var marketCap = run(company, year, /* MARKET_CAP */2, otherSettings);
          return sharesOutstanding(price, marketCap);
        } else {
          return ;
        }
    case /* MARKET_CAP */2 :
        if (match$1 !== undefined && year > 2019 && year < 2030) {
          var diffYears$1 = year - otherSettings.currentYear | 0;
          return normal(match$1, diffYears$1 * 0.1);
        } else {
          return ;
        }
    
  }
}

exports.$$Math = $$Math;
exports.sharesOutstanding = sharesOutstanding;
exports.run = run;
/* No side effect */
