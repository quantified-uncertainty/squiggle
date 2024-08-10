import FlexSearch from "flexsearch";

import squiggleData from "./bundle.json";

// Importing the JSON data (replace with actual import in real implementation)

interface Namespace {
  name: string;
  description: string;
  functionNames: string[];
}

interface Example {
  text: string;
  isInteractive: boolean;
  useForTests: boolean;
}

interface Shorthand {
  type: string;
  symbol: string;
}

interface Item {
  name: string;
  namespace: string;
  requiresNamespace: boolean;
  signatures: string[];
  shorthand?: Shorthand;
  isUnit: boolean;
  description?: string;
  examples?: Example[];
}

interface SquiggleData {
  namespaces: Namespace[];
  items: Item[];
}

// Type assertion to ensure the imported data matches our interface
const typedSquiggleData: SquiggleData = squiggleData;

class SquiggleSearch {
  private namespaceIndex: FlexSearch.Index;
  private itemIndex: FlexSearch.Index;
  private data: SquiggleData;

  constructor() {
    this.namespaceIndex = new FlexSearch.Index({ tokenize: "forward" });
    this.itemIndex = new FlexSearch.Index({ tokenize: "full" });
    this.data = typedSquiggleData;
    this.indexData();
  }

  private indexData() {
    this.data.namespaces.forEach((namespace, index) => {
      this.namespaceIndex.add(
        index,
        namespace.name + " " + namespace.description
      );
    });

    this.data.items.forEach((item, index) => {
      this.itemIndex.add(
        index,
        item.name +
          " " +
          item.namespace +
          " " +
          item.signatures.join(" ") +
          (item.description ? " " + item.description : "")
      );
    });
  }

  search(query: string): { namespaces: Namespace[]; items: Item[] } {
    const namespaceResults = this.namespaceIndex.search(query) as number[];
    const itemResults = this.itemIndex.search(query) as number[];

    return {
      namespaces: namespaceResults.map((index) => this.data.namespaces[index]),
      items: itemResults.map((index) => this.data.items[index]),
    };
  }
}

export default SquiggleSearch;

// const search = new SquiggleSearch();
// console.log(search.search("dist"));
