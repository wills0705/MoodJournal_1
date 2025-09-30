function getTorontoDate(inputDate) {
  const date = inputDate ? new Date(inputDate) : new Date();
  const torontoTime = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Toronto",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  );
  return torontoTime;
}

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
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

const weekDayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Format: yyyy-mm-dd
function formatDate(date) {
  const d = getTorontoDate(date);
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  let year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

function getDateInfo(dd) {
  const d = getTorontoDate(dd);
  let month = "" + (d.getMonth() + 1);
  let date = "" + d.getDate();
  let year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (date.length < 2) date = "0" + date;
  let fullDate = `${year}-${month}-${date}`;
  return {
    year,
    month,
    date,
    fullDate,
  };
}

function getWeekDates(weekIndex) {
  const today = getTorontoDate();
  today.setDate(today.getDate() + weekIndex * 7);
  const startDayOfWeek = today.getDate() - today.getDay(); // Sunday = 0
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(today.getFullYear(), today.getMonth(), startDayOfWeek + i);
    const torontoDay = getTorontoDate(day);
    const dateOfMonth = torontoDay.getDate().toString().padStart(2, "0");
    dates.push({
      day: weekDayMap[i],
      date: dateOfMonth,
      fullDate: getDateInfo(torontoDay).fullDate,
    });
  }
  return dates;
}

export { formatDate, getDateInfo, monthMap, dayMap, getWeekDates };
