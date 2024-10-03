import { config } from "dotenv";

import { SquiggleWorkflow } from "../../workflows/SquiggleWorkflow.js";

config();

async function main() {
  const initialCode = `import "hub:ozziegooen/sTest" as sTest

createData() = [
  {
    n: "Finances, Cleaning+Misc Liaison",
    h: 3.5,
    c: 0,
    ps: -1.421052632,
    pp: -255.7894737,
    pm: -388.4210526,
  },
  {
    n: "Mail, Onboarding tester",
    h: 2.0,
    c: 1,
    ps: -0.9210526316,
    pp: -165.7894737,
    pm: -298.4210526,
  },
  {
    n: "Recruitment and Onboarding",
    h: 3.0,
    c: 0,
    ps: -1.921052632,
    pp: -345.7894737,
    pm: -478.4210526,
  },
  {
    n: "Dishes",
    h: 1.5,
    c: 0,
    ps: -3.421052632,
    pp: -615.7894737,
    pm: -748.4210526,
  },
  {
    n: "Tech support, Landlord Liaison",
    h: 6.0,
    c: 0,
    ps: 1.078947368,
    pp: 194.2105263,
    pm: 61.57894737,
  },
  {
    n: "Trash",
    h: 1.5,
    c: 1,
    ps: -1.421052632,
    pp: -255.7894737,
    pm: -388.4210526,
  },
  {
    n: "Physical Organization - Floor 1, Food",
    h: 11.0,
    c: 0,
    ps: 6.078947368,
    pp: 1094.210526,
    pm: 961.5789474,
  },
  {
    n: "House Manager, Maintenance",
    h: 14.0,
    c: 0,
    ps: 9.078947368,
    pp: 1634.210526,
    pm: 1501.578947,
  },
  {
    n: "Physical Organization - Floor 2-3, Events, Chores manager",
    h: 3.5,
    c: 1,
    ps: 0.5789473684,
    pp: 104.2105263,
    pm: -28.42105263,
  },
  {
    n: "Unnamed",
    h: 1.5,
    c: 1,
    ps: -1.421052632,
    pp: -255.7894737,
    pm: -388.4210526,
  },
]

processPayment(d) = {
  th = List.reduce(d, 0, {|a, i| a + i.h})
  tp = 1260
  List.map(
    d,
    {
      |i|
      ns = i.h / th * 100
      np = ns / 100 * tp
      nm = np
      Dict.merge(i, { ns: ns, np: np, nm: nm, pd: np - i.pp, md: nm - i.pm })
    }
  ) -> List.map({|item| Dict.merge(item, {ns: round(item.ns, 2), np: round(item.np, 2), nm: round(item.nm, 2)})})
}

main() = {
  d = createData()
  pd = processPayment(d)
  th = List.reduce(pd, 0, {|a, i| a + i.h})
  tnp = List.reduce(pd, 0, {|a, i| a + i.np})
  tnm = List.reduce(pd, 0, {|a, i| a + i.nm})
  { data: pd, totals: { th: th, tnp: tnp, tnm: tnm } }
}

test = sTest.test
expect = sTest.expect

sTest.describe(
  "Payment Processing",
  [
    test(
      "processPayment calculates correctly",
      {
        ||
        d = createData()
        pd = processPayment(d)
        expect(
          List.length(pd) == 10 && abs(pd[0].ns - -4.72) < 0.01 &&
            abs(pd[0].np - 67.34) < 0.01
        ).toBeTrue(

        )
      }
    ),
  ]
) `;

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await new SquiggleWorkflow({
      input: { type: "Edit", source: initialCode },
      openaiApiKey: process.env["OPENAI_API_KEY"],
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    }).runToResult();

  const response = {
    code: typeof code === "string" ? code : "",
    isValid,
    totalPrice,
    runTimeMs,
    llmRunCount,
    logSummary,
  };

  console.log(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
