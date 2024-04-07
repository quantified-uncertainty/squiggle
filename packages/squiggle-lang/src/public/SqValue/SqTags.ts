import { LocationRange } from "../../ast/parse.js";
import { ValueTags } from "../../value/valueTags.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue, wrapValue } from "./index.js";
import { SqSpecification } from "./SqSpecification.js";

export class SqTags {
  constructor(
    private readonly tags: ValueTags,
    public context?: SqValueContext
  ) {}

  name(): string | undefined {
    return this.tags.name();
  }

  doc(): string | undefined {
    return this.tags.doc();
  }

  showAs(): SqValue | undefined {
    const showAs = this.tags.showAs();
    return showAs ? wrapValue(showAs, this.context) : undefined;
  }

  specification(): SqSpecification | undefined {
    const specification = this.tags.specification();
    return specification
      ? new SqSpecification(specification.value, this.context)
      : undefined;
  }

  numberFormat(): string | undefined {
    return this.tags.numberFormat();
  }

  dateFormat(): string | undefined {
    return this.tags.dateFormat();
  }

  hidden(): boolean | undefined {
    return this.tags.hidden();
  }

  notebook(): boolean | undefined {
    return this.tags.notebook();
  }

  startOpenState(): "open" | "closed" | undefined {
    return this.tags.startOpenState();
  }

  location(): LocationRange | undefined {
    return this.tags.location();
  }

  exportData():
    | {
        sourceId: string;
        path: string[];
      }
    | undefined {
    return this.tags.exportData();
  }
}
