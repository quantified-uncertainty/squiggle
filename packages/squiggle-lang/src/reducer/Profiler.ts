import { FrameStack } from "./frameStack";

export type PerformanceMetrics = {
  frameTimes: { [key: string]: number };
};

export type StartTimes = { [key: string]: number };

export class Profiler {
  private startTimes: StartTimes;
  public performanceMetrics: PerformanceMetrics;
  constructor() {
    this.startTimes = {};
    this.performanceMetrics = { frameTimes: {} };
  }

  startTimer(frame: string) {
    this.startTimes[frame] = Date.now();
  }

  endTimer(frame: string) {
    const time = Date.now() - this.startTimes[frame];
    if (!this.performanceMetrics.frameTimes[frame]) {
      this.performanceMetrics.frameTimes[frame] = time;
    } else {
      this.performanceMetrics.frameTimes[frame] += time;
    }
  }
}
