export const DASHBOARD_TZ = 'America/New_York'

export function weekdayParts(
  now: Date = new Date(),
  timeZone: string = DASHBOARD_TZ,
): { weekday: string; dateLabel: string } {
  const weekday = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone,
  }).format(now)

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone,
  }).format(now)

  return { weekday, dateLabel }
}

export function isWeekdaySession(
  now: Date = new Date(),
  timeZone: string = DASHBOARD_TZ,
): boolean {
  const { weekday } = weekdayParts(now, timeZone)
  return weekday !== 'Saturday' && weekday !== 'Sunday'
}
