export abstract class BaseDist {
  abstract sampleN(n: number): number[];
  abstract sample(): number;
  abstract mean(): number;
  abstract mode(): number;
}
