import "dotenv/config";

import fs from "fs";

import { prisma } from "@quri/metaforecast-db";

let main = async () => {
  let json = await prisma.question.findMany({});
  let string = JSON.stringify(json, null, 2);
  let filename = "metaforecasts.json";
  fs.writeFileSync(filename, string);
  console.log(`File downloaded to ./${filename}`);
};
main();
