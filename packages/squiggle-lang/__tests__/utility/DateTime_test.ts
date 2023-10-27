import { Duration, DateModule, Date } from "../../src/utility/DateTime";
import { expect } from "@jest/globals";

describe("Duration", () => {
  test("minute", () => {
    expect(Duration.minute).toBe(60 * 1000);
  });

  test("hour", () => {
    expect(Duration.hour).toBe(60 * 60 * 1000);
  });

  test("day", () => {
    expect(Duration.day).toBe(24 * 60 * 60 * 1000);
  });

  test("year", () => {
    expect(Duration.year).toBe(24 * 60 * 60 * 1000 * 365.25);
  });

  test("fromFloat", () => {
    expect(Duration.fromFloat(1.23)).toBe(1.23);
  });

  test("toFloat", () => {
    expect(Duration.toFloat(1.23)).toBe(1.23);
  });

  test("fromMinutes", () => {
    expect(Duration.fromMinutes(1)).toBe(60 * 1000);
  });

  test("fromHours", () => {
    expect(Duration.fromHours(1)).toBe(60 * 60 * 1000);
  });

  test("fromDays", () => {
    expect(Duration.fromDays(1)).toBe(24 * 60 * 60 * 1000);
  });

  test("fromYears", () => {
    expect(Duration.fromYears(1)).toBe(24 * 60 * 60 * 1000 * 365.25);
  });

  test("toMinutes", () => {
    expect(Duration.toMinutes(60 * 1000)).toBe(1);
  });

  test("toHours", () => {
    expect(Duration.toHours(60 * 60 * 1000)).toBe(1);
  });

  test("toDays", () => {
    expect(Duration.toDays(24 * 60 * 60 * 1000)).toBe(1);
  });

  test("toYears", () => {
    expect(Duration.toYears(24 * 60 * 60 * 1000 * 365.25)).toBe(1);
  });

  test("toString", () => {
    expect(Duration.toString(60 * 1000)).toBe("1.00 minute");
    expect(Duration.toString(60 * 60 * 1000)).toBe("1.00 hour");
    expect(Duration.toString(24 * 60 * 60 * 1000)).toBe("1.00 day");
    expect(Duration.toString(24 * 60 * 60 * 1000 * 365.25)).toBe("1.00 year");
  });

  test("add", () => {
    expect(Duration.add(1, 2)).toBe(3);
  });

  test("subtract", () => {
    expect(Duration.subtract(2, 1)).toBe(1);
  });

  test("multiply", () => {
    expect(Duration.multiply(2, 3)).toBe(6);
  });

  test("divide", () => {
    expect(Duration.divide(6, 3)).toBe(2);
  });
});

describe("DateModule", () => {
  test("toString", () => {
    const date = new Date(2022, 0, 1);
    expect(DateModule.toString(date)).toBe(date.toDateString());
  });

  test("fmap", () => {
    const date = new Date(2022, 0, 1);
    const newDate = DateModule.fmap(date, (t) => t + 1000);
    expect(newDate.getTime()).toBe(date.getTime() + 1000);
  });

  test("subtract", () => {
    const date1 = new Date(2022, 0, 2);
    const date2 = new Date(2022, 0, 1);
    const diff = DateModule.subtract(date1, date2);
    expect(diff.ok).toBe(true);
    expect(diff.value).toBe(24 * 60 * 60 * 1000);
  });

  test("addDuration", () => {
    const date = new Date(2022, 0, 1);
    const newDate = DateModule.addDuration(date, 24 * 60 * 60 * 1000);
    expect(newDate.getTime()).toBe(date.getTime() + 24 * 60 * 60 * 1000);
  });

  test("subtractDuration", () => {
    const date = new Date(2022, 0, 2);
    const newDate = DateModule.subtractDuration(date, 24 * 60 * 60 * 1000);
    expect(newDate.getTime()).toBe(date.getTime() - 24 * 60 * 60 * 1000);
  });

  test("makeWithYearInt", () => {
    const date = DateModule.makeWithYearInt(2022);
    expect(date.ok).toBe(true);
    expect(date.value.getFullYear()).toBe(2022);
  });

  test("makeFromYear", () => {
    const date = DateModule.makeFromYear(2022.5);
    expect(date.ok).toBe(true);
    expect(date.value.getFullYear()).toBe(2022);
    expect(date.value.getMonth()).toBe(6);
  });
});

test("Date", () => {
  expect(Date).toBe(DateModule);
});
