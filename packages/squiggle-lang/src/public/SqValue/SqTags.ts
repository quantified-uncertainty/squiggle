import { LocationRange } from "peggy";

import { ValueTags } from "../../value/valueTags.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue, wrapValue } from "./index.js";

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
    return this.tags.locationAsLocationRange();
  }
}
