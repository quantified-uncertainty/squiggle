export abstract class BaseDist {
  abstract min(): number;
  abstract max(): number;
  abstract mean(): number;

  abstract sample(): number;
  abstract sampleN(n: number): number[];

  abstract normalize(): BaseDist;

  abstract truncate(
    left: number | undefined,
    right: number | undefined
  ): BaseDist;

  abstract integralEndY(): number;

  abstract pdf(x: number): number;
  abstract cdf(x: number): number;
  abstract inv(x: number): number;
}
