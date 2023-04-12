import { Session } from "inspector";
import * as fs from "fs";
import { mkMetalog } from "../__tests__/helpers/distHelpers";
import * as E_A_Floats from "../src/utility/E_A_Floats";
const session = new Session();
session.connect();

const testRange = 10;
const testSteps = 1000;
const dist = mkMetalog([5, 2]);
const iter = E_A_Floats.range(-testRange, testRange, testSteps);
session.post("Profiler.enable", () => {
  session.post("Profiler.start", () => {
    iter.forEach((v) => dist.pdf(v));
    session.post("Profiler.stop", (_, { profile }) => {
      fs.writeFileSync("./metalog_pdf.cpuprofile", JSON.stringify(profile));
    });
  });
});
