module Math = {
  let normal = (mean: float, std: float) =>
    Js.Float.(
      {
        let nMean = toString(mean);
        let nStd = toString(std);
        {j|normal($(nMean), $(nStd))|j};
      }
    );

  let divide = (str1: string, str2: string) => {j|$(str1)/$(str2)|j};
};

type param =
  | SHARE_PRICE
  | SHARES_OUTSTANDING
  | MARKET_CAP;

type company = {
  name: string,
  currentPrice: option(float),
  marketCap: option(float),
};

type otherSettings = {currentYear: int};

let sharesOutstanding = (price, marketCap) =>
  switch (price, marketCap) {
  | (Some(price), Some(marketCap)) =>
    Some(FloatCdf.divide(marketCap, price))
  | _ => None
  };

let rec run =
        (
          company: company,
          year: int,
          param: param,
          otherSettings: otherSettings,
        ) => {
  switch (param, year, company.currentPrice, company.marketCap) {
  | (SHARE_PRICE, year, Some(price), _) when year > 2019 && year < 2030 =>
    let diffYears = year - otherSettings.currentYear;
    let diffPerYear = 0.1;
    Some(FloatCdf.normal(price, float_of_int(diffYears) *. diffPerYear));
  | (MARKET_CAP, year, _, Some(price)) when year > 2019 && year < 2030 =>
    let diffYears = year - otherSettings.currentYear;
    let diffPerYear = 0.1;
    Some(FloatCdf.normal(price, float_of_int(diffYears) *. diffPerYear));
  | (SHARES_OUTSTANDING, year, _, _) when year > 2019 && year < 2030 =>
    let price = run(company, year, SHARE_PRICE, otherSettings);
    let marketCap = run(company, year, MARKET_CAP, otherSettings);
    sharesOutstanding(price, marketCap);
  | _ => None
  };
};