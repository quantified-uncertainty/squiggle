import { NumberShower } from "../components/NumberShower.js";
import { widgetRegistry } from "./registry.js";

export function formatTime(milliseconds: number): string {
  const secondsInMillisecond = 1 / 1000;
  const minutesInSecond = 1 / 60;
  const hoursInMinute = 1 / 60;
  const daysInHour = 1 / 24;
  const monthsInDay = 1 / 30;
  const yearsInDays = 1 / 365.25;

  const totalSeconds = milliseconds * secondsInMillisecond;
  const totalMinutes = totalSeconds * minutesInSecond;
  const totalHours = totalMinutes * hoursInMinute;
  const totalDays = totalHours * daysInHour;
  const totalMonths = totalDays * monthsInDay;
  const totalYears = totalDays * yearsInDays;

  const round = (n: number) => n.toFixed(3);

  if (totalYears >= 1) {
    return round(totalYears) + " years";
  } else if (totalMonths >= 1) {
    return round(totalMonths) + " months";
  } else if (totalDays >= 1) {
    return round(totalDays) + " days";
  } else if (totalHours >= 1) {
    return round(totalHours) + " hours";
  } else if (totalMinutes >= 1) {
    return round(totalMinutes) + " minutes";
  } else {
    return round(totalSeconds) + " seconds";
  }
}

widgetRegistry.register("TimeDuration", {
  Chart: (value) => value.toString(),
});
