#!/usr/bin/env node
// Prints a https://squiggle-language.com/playground link that opens with the
// given Squiggle code. Usage:
//   node playground-url.mjs model.squiggle
//   cat model.squiggle | node playground-url.mjs
// The encoding matches getPlaygroundUrl() in
// internal-packages/versioned-components/src/playground.ts.
import { readFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const file = process.argv[2];
const code = readFileSync(file && file !== "-" ? file : 0, "utf8");

const data = JSON.stringify({ defaultCode: code });
const encoded = encodeURIComponent(
  deflateSync(data, { level: 9 }).toString("base64")
);
const url = `https://squiggle-language.com/playground#code=${encoded}`;

if (url.length > 32000) {
  console.error(
    `Warning: the link is ${url.length} characters long; some browsers and chat apps truncate long URLs.`
  );
}
console.log(url);
