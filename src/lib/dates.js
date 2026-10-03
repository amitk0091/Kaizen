// Timezone-safe helpers for 'YYYY-MM-DD' day strings.
// Day strings are calendar dates, so all arithmetic is done in UTC to avoid
// local-midnight -> UTC shifts (e.g. IST is UTC+5:30, which moves dates back a day).

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDayString(s) {
  return typeof s === 'string' && DAY_RE.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
}

export function addDays(day, n) {
  const d = new Date(day + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Monday of the week containing `day`.
export function weekStart(day) {
  const d = new Date(day + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  return addDays(day, -dow);
}

export function dayOfWeek(day) {
  return new Date(day + 'T00:00:00Z').getUTCDay(); // Sun=0 ... Sat=6
}

// Server-side: today's UTC date string.
export function utcToday() {
  return new Date().toISOString().slice(0, 10);
}

// Accept a client-supplied day only if it is within one day of the server's UTC date
// (covers every real timezone) so it can't be used to dodge per-day limits.
export function clampClientDay(day) {
  const t = utcToday();
  if (isDayString(day) && day >= addDays(t, -1) && day <= addDays(t, 1)) return day;
  return t;
}

// Local calendar date (YYYY-MM-DD) in an IANA timezone, plus minutes since local midnight.
export function localNowIn(timeZone, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
