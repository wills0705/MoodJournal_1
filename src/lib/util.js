const monthMap = {
  0: "January",
  1: "February",
  2: "March",
  3: "April",
  4: "May",
  5: "June",
  6: "July",
  7: "August",
  8: "September",
  9: "October",
  10: "November",
  11: "December",
};

const dayMap = {
  0: "Monday",
  1: "Tuesday",
  2: "Wednesday",
  3: "Thursday",
  4: "Friday",
  5: "Saturday",
  6: "Sunday",
};

const weekDayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- TZ helpers ----
const TZ = "America/Toronto";

function tzParts(dateLike, tz = TZ) {
  const d = dateLike ? new Date(dateLike) : new Date();
  // Extract year, month, day, weekday in the requested time zone
  const parts = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(d)) {
    parts[type] = value;
  }
  // Map weekday string to index (0=Sun..6=Sat)
  const weekdayShort =
    parts.weekday ||
    new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(
      d
    );
  const weekdayIndex = weekDayMap.indexOf(weekdayShort);

  return {
    year: Number(parts.year),
    monthIndex: Number(parts.month) - 1, // 0..11
    day: Number(parts.day),
    weekdayIndex, // 0..6, Sun..Sat
  };
}

// Build a UTC Date representing local midnight in the Toronto day
function tzMidnightUTC(dateLike, tz = TZ) {
  const { year, monthIndex, day } = tzParts(dateLike, tz);
  return new Date(Date.UTC(year, monthIndex, day));
}

// ---- Public helpers (same names as before, but TZ-aware) ----

// yyyy-mm-dd in Toronto time
function formatDate(date) {
  const { year, monthIndex, day } = tzParts(date, TZ);
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

// { year, month, date, fullDate } in Toronto time
function getDateInfo(dd) {
  const { year, monthIndex, day } = tzParts(dd, TZ);
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return {
    year,
    month,
    date,
    fullDate: `${year}-${month}-${date}`,
  };
}


function getWeekDates(weekIndex) {
  const todayMidUTC = tzMidnightUTC(new Date(), TZ);
  const { weekdayIndex } = tzParts(new Date(), TZ);
  const sundayUTC = new Date(todayMidUTC);
  sundayUTC.setUTCDate(sundayUTC.getUTCDate() - weekdayIndex + weekIndex * 7);

  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sundayUTC);
    d.setUTCDate(sundayUTC.getUTCDate() + i);

    dates.push({
      day: weekDayMap[i],          // label
      date: getDateInfo(d).date,   // "DD"
      fullDate: formatDate(d),     // "YYYY-MM-DD"
    });
  }
  return dates;
}

export { formatDate, getDateInfo, monthMap, dayMap, getWeekDates };
