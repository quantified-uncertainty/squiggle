#!/usr/bin/env node
import { measure } from "../cli/utils.js";
import { run } from "../run.js";

const maxP = 5;

async function main() {
  for (let p = 0; p <= maxP; p++) {
    const size = Math.pow(10, p);
    const time = await measure(async () => {
      await run(
        `List.upTo(1, ${size}) -> map({|x| List.upTo(1, 100) -> reduce(0, {|a,b|a+b})})`
      );
    });
    console.log(`1e${p}`, "\t", time);
  }
}

main();
