import { ValueTags } from "../../value/valueTags.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue, wrapValue } from "./index.js";
import { SqScale, wrapScale } from "./SqScale.js";

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

  xScale(): SqScale | undefined {
    const xScale = this.tags.xScale();
    return xScale ? wrapScale(xScale) : undefined;
  }

  yScale(): SqScale | undefined {
    const yScale = this.tags.yScale();
    return yScale ? wrapScale(yScale) : undefined;
  }

  notebook(): boolean | undefined {
    return this.tags.notebook();
  }
}
