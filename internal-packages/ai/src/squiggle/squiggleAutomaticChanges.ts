// replace |> with ->
function replacePipeWithArrow(code: string): string {
  return code.replace(/\|>/g, "->");
}

// replace === with ==
function replaceEqualsWithDoubleEquals(code: string): string {
  return code.replace(/===/g, "==");
}

// Makes some automatic changes to the code to make it easier for the LLM. We could instead raise warnings for these, but this should be easier for the LLM.
export function makeAutomaticChanges(code: string): string {
  return replacePipeWithArrow(replaceEqualsWithDoubleEquals(code));
}
