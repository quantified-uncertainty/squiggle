import { LocationRange } from "../ast/types.js";

function prefixSum(arr: number[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i] + (i ? result[i - 1] : 0));
  }
  return result;
}

export type SerializedRunProfile = {
  sourceId: string;
  deltaRuns: number[];
  deltaTimes: number[];
};

export class RunProfile {
  deltaRuns: number[] = [];
  deltaTimes: number[] = [];

  constructor(public sourceId: string) {}

  addRange(location: LocationRange, time: number) {
    if (location.source !== this.sourceId) {
      return; // profiling only the main file
    }

    while (this.deltaRuns.length < location.end.offset + 1) {
      this.deltaRuns.push(0);
    }
    while (this.deltaTimes.length < location.end.offset + 1) {
      this.deltaTimes.push(0);
    }
    this.deltaRuns[location.start.offset]++;
    this.deltaRuns[location.end.offset]--;

    this.deltaTimes[location.start.offset] += time;
    this.deltaTimes[location.end.offset] -= time;
  }

  get runs() {
    return prefixSum(this.deltaRuns);
  }

  get times() {
    return prefixSum(this.deltaTimes);
  }

  serialize(): SerializedRunProfile {
    return {
      sourceId: this.sourceId,
      deltaRuns: this.deltaRuns,
      deltaTimes: this.deltaTimes,
    };
  }

  static deserialize(serializedProfile: SerializedRunProfile): RunProfile {
    const profile = new RunProfile(serializedProfile.sourceId);
    profile.deltaRuns = serializedProfile.deltaRuns;
    profile.deltaTimes = serializedProfile.deltaTimes;
    return profile;
  }
}
