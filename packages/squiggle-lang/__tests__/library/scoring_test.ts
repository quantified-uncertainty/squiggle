import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Scoring", () => {
  testEvalToBe(
    "Dist.logScoreDistAnswer(Sym.normal(5,2), Sym.normal(5.2,1)).score",
    "0.32244107041564646"
  );
  testEvalToBe(
    "Dist.logScoreNumericAnswer(Sym.normal(5,2), 4.5).continuous",
    "1.6433360626394853"
  );
  testEvalToBe(
    "Dist.klDivergence(Sym.normal(5,2), Sym.normal(5,1.5))",
    "0.06874342818671068"
  );
});
