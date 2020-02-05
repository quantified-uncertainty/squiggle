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
};

let rec run = (company: company, year: int, param: param) => {
  switch (param, year, company.currentPrice) {
  | (SHARE_PRICE, year, Some(price)) when year > 2019 && year < 2030 =>
    let diffYears = year - 2020;
    let diffPerYear = 0.1;
    Some(Math.normal(price, float_of_int(diffYears) *. diffPerYear));

  | (SHARES_OUTSTANDING, year, _) when year > 2019 && year < 2030 =>
    let price = run(company, year, SHARE_PRICE);
    let marketCap = run(company, year, MARKET_CAP);
    switch (price, marketCap) {
    | (Some(price), Some(marketCap)) =>
      Some(Math.divide(marketCap, price))

    | _ => None
    };

  | _ => None
  };
};