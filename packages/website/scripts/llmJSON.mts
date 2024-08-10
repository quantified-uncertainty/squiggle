#!/usr/bin/env node
import fs from "fs";

import {
  FnDocumentation,
  getAllFunctionNamesWithNamespace,
  getFunctionDocumentation,
} from "@quri/squiggle-lang";

import { ModulePage, modulePages, ModulePageSection } from "../templates.mjs";

interface Namespace {
  name: string;
  description: string;
  functionNames: string[];
}

interface FunctionItem {
  name: string;
  namespace: string;
  requiresNamespace: boolean;
  signatures: string[];
  shorthand?: { type: string; symbol: string };
  isUnit: boolean;
  description?: string;
  examples?: { text: string; isInteractive: boolean; useForTests: boolean }[];
}

interface SquiggleData {
  namespaces: Namespace[];
  items: FunctionItem[];
}

function processFunctionDocumentation(
  documentation: FnDocumentation
): FunctionItem {
  return {
    name: documentation.name,
    namespace: documentation.nameSpace,
    requiresNamespace: documentation.requiresNamespace,
    signatures: documentation.signatures,
    shorthand: documentation.shorthand,
    isUnit: documentation.isUnit || false,
    description: documentation.description,
    examples: documentation.examples,
  };
}

function generateModuleContent({
  name,
  description,
  intro,
  sections,
}: ModulePage): { namespace: Namespace; items: FunctionItem[] } {
  const namespaceNames = getAllFunctionNamesWithNamespace(name);
  let fnDocumentationItems = namespaceNames
    .map(getFunctionDocumentation)
    .filter((fn): fn is FnDocumentation => Boolean(fn && !fn.isUnit));

  const processSection = (section: ModulePageSection): FunctionItem[] => {
    const sectionFnDocumentationItems = fnDocumentationItems.filter(
      ({ displaySection }) => displaySection === section.name
    );
    if (sectionFnDocumentationItems.length === 0) {
      throw new Error(
        `Error: No functions in section: ${name} ${section.name}. You likely made an error in the section name.`
      );
    }
    return sectionFnDocumentationItems.map(processFunctionDocumentation);
  };

  let functionItems: FunctionItem[];
  if (sections && sections.length > 0) {
    functionItems = sections.flatMap(processSection);
  } else {
    functionItems = fnDocumentationItems.map(processFunctionDocumentation);
  }

  const namespace: Namespace = {
    name,
    description,
    functionNames: functionItems.map((item) => item.name),
  };

  return { namespace, items: functionItems };
}

const generateAllDocumentation = (): SquiggleData => {
  const squiggleData: SquiggleData = {
    namespaces: [],
    items: [],
  };

  modulePages.forEach((page) => {
    const { namespace, items } = generateModuleContent(page);
    squiggleData.namespaces.push(namespace);
    squiggleData.items.push(...items);
  });

  return squiggleData;
};

const writeDocumentationBundleToFile = async () => {
  const targetFilename = "./public/llms/documentationBundle.json";
  console.log("Compiling documentation bundle...");
  const allDocumentation = generateAllDocumentation();
  const jsonContent = JSON.stringify(allDocumentation, null, 2);

  fs.writeFile(targetFilename, jsonContent, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Content written to ${targetFilename}`);
  });
};

async function main() {
  await writeDocumentationBundleToFile();
}

main();
