// 月份映射
export const monthMap = {
  0: "January", 1: "February", 2: "March", 3: "April",
  4: "May", 5: "June", 6: "July", 7: "August",
  8: "September", 9: "October", 10: "November", 11: "December",
};

// 一周每天的映射（保持你现有的 1..7 映射以避免连锁变更）
export const dayMap = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday",
};

// 一周每天的映射，取前三个字符（0=Sun..6=Sat）
export const weekDayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** ---- LOCAL DATE HELPERS (fix UTC parsing) ---- **/

// Parse 'YYYY-MM-DD' as a **local** date (no UTC shift)
function parseLocalYMD(ymd) {
  if (typeof ymd !== "string") return new Date(ymd);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return new Date(ymd);
  const [, y, mo, d] = m.map(Number);
  return new Date(y, mo - 1, d);
}

// Return a Date object. If given 'YYYY-MM-DD', force local.
function localDate(input) {
  if (typeof input === "string") return parseLocalYMD(input);
  return new Date(input);
}

/** ---- Your original API, now using local parsing ---- **/

// 格式化日期，输出 yyyy-mm-dd（基于本地时间）
export function formatDate(date) {
  const d = localDate(date || "");
  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return [year, month, day].join("-");
}

// 获取当前的年，月，日（基于本地时间）
export function getDateInfo(dd) {
  const d = localDate(dd);
  let month = "" + (d.getMonth() + 1);
  let date = "" + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = "0" + month;
  if (date.length < 2) date = "0" + date;
  const fullDate = `${year}-${month}-${date}`;
  return { year, month, date, fullDate };
}

// 获取今天所在的周，以及周一到周日对应的日期
export function getWeekDates(weekIndex) {
  // today as local
  const base = new Date();
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate()); // strip time
  const shifted = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000 * weekIndex);
  const startDayOfWeek = shifted.getDate() - shifted.getDay(); // Sunday start
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(shifted.getFullYear(), shifted.getMonth(), startDayOfWeek + i);
    const dateOfMonth = day.getDate().toString().padStart(2, "0");
    dates.push({
      day: weekDayMap[i],
      date: dateOfMonth,
      fullDate: getDateInfo(day).fullDate,
    });
  }
  return dates;
}

/** ---- Minimal global patch so ANY new Date('YYYY-MM-DD') is local ----
 * This avoids touching all components. It only intercepts the YYYY-MM-DD case.
 * Safe in the browser; does nothing in SSR-less environments.
 */
if (typeof window !== "undefined" && !window.__LOCAL_YMD_DATE_PATCH__) {
  const NativeDate = Date;
  function PatchedDate(...args) {
    if (args.length === 1 && typeof args[0] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args[0])) {
      return parseLocalYMD(args[0]);
    }
    return new NativeDate(...args);
  }
  PatchedDate.prototype = NativeDate.prototype;
  // @ts-ignore
  window.Date = PatchedDate;
  // flag so we don’t patch twice (hot reload)
  // @ts-ignore
  window.__LOCAL_YMD_DATE_PATCH__ = true;
}
