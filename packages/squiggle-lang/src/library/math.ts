// Add math functions
import { ceil, floor, max, mean, abs, add, divide, exp, log10, log2, pow, sqrt, subtract } from 'mathjs';

export function ceil(x: number): number {
  return ceil(x);
}

export function divide(a: number, b: number): number {
  return divide(a, b);
}

export function floor(x: number): number {
  return floor(x);
}

export function max(list: number[]): number {
  return max(list);
}

export function maxBy(list: number[], fn: (element: number) => number): number {
  return maxBy(list, fn);
}

export function mean(list: number[]): number {
  return mean(list);
}

export function minBy(list: number[], fn: (element: number) => number): number {
  return minBy(list, fn);
}

export function product(list: number[]): number {
  return product(list);
}

export function minBy(list: number[], fn: (element: number) => number): number {
  return Math.minBy(list, fn);
}

export function product(list: number[]): number {
  return product(list);
}

export function sum(list: number[]): number {
  return sum(list);
}

export function abs(x: number): number {
  return abs(x);
}

export function add(a: number, b: number): number {
  return add(a, b);
}

export function divide(a: number, b: number): number {
  return divide(a, b);
}

export function exp(x: number): number {
  return exp(x);
}

export function log10(x: number): number {
  return log10(x);
}

export function log2(x: number): number {
  return log2(x);
}

export function pow(x: number, y: number): number {
  return pow(x, y);
}

export function sqrt(x: number): number {
  return sqrt(x);
}

export function subtract(x: number, y: number): number {
  return subtract(x, y);
}

export function pow(x: number, y: number): number {
  return Math.pow(x, y);
}

export function sqrt(x: number): number {
  return Math.sqrt(x);
}

export function subtract(x: number, y: number): number {
  return Math.subtract(x, y);
}
