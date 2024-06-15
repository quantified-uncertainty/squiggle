import { Command } from "@commander-js/extra-typings";
import fs from "fs";

export function loadSrc({
  program,
  filename,
  inline,
}: {
  program: Command;
  filename: string | undefined;
  inline: string | undefined;
}) {
  let src = "";
  if (filename !== undefined && inline !== undefined) {
    program.error("Only one of filename and eval string should be set.");
  } else if (filename !== undefined) {
    src = fs.readFileSync(filename, "utf-8");
  } else if (inline !== undefined) {
    src = inline;
  } else {
    program.error("One of filename and eval string should be set.");
  }
  return src;
}

export async function measure(callback: () => Promise<void>) {
  const t1 = new Date();
  await callback();
  const t2 = new Date();

  return (t2.getTime() - t1.getTime()) / 1000;
}
