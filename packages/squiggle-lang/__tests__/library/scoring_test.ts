import { testEvalToBe } from "../helpers/reducerHelpers.js";

describe("Scoring", () => {
  testEvalToBe(
    "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1), prior: Sym.normal(5.5,3)})",
    "-0.33591375663884876"
  );
  testEvalToBe(
    "Dist.logScore({estimate: Sym.normal(5,2), answer: Sym.normal(5.2,1)})",
    "0.32244107041564646"
  );
  testEvalToBe(
    "Dist.logScore({estimate: Sym.normal(5,2), answer: 4.5})",
    "1.6433360626394853"
  );
  testEvalToBe(
    "Dist.klDivergence(Sym.normal(5,2), Sym.normal(5,1.5))",
    "0.06874342818671068"
  );
});
