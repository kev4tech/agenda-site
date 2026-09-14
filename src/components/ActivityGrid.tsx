import { useMemo } from 'react'
import type { Activity } from '../types'
import { dayKey, readableDay, todayKey } from '../dates'

const WEEKS = 53
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

/** Buckets a raw count into one of five ramp steps. */
function level(count: number): string {
  if (count <= 0) return ''
  if (count === 1) return 'l1'
  if (count === 2) return 'l2'
  if (count <= 4) return 'l3'
  return 'l4'
}

type Week = { key: string; days: (string | null)[] }

/**
 * Builds 53 columns of 7 days ending on the Saturday of the current week, so the
 * grid always lands on whole weeks the way GitHub's contribution graph does.
 * Days after today are rendered as blanks rather than zeroes.
 */
function buildWeeks(): Week[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(today)
  end.setDate(end.getDate() + (6 - end.getDay())) // Saturday of this week

  const start = new Date(end)
  start.setDate(start.getDate() - (WEEKS * 7 - 1)) // Sunday, 53 weeks back

  const weeks: Week[] = []
  const cursor = new Date(start)

  for (let w = 0; w < WEEKS; w++) {
    const days: (string | null)[] = []
    let firstKey = ''
    for (let d = 0; d < 7; d++) {
      const key = dayKey(cursor)
      if (d === 0) firstKey = key
      days.push(cursor > today ? null : key)
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push({ key: firstKey, days })
  }
  return weeks
}

/** Month labels positioned above the first week that starts a new month. */
function monthLabels(weeks: Week[]) {
  const labels: { label: string; index: number }[] = []
  let lastMonth = -1
  weeks.forEach((week, i) => {
    const [y, m] = week.key.split('-').map(Number)
    if (m - 1 !== lastMonth) {
      lastMonth = m - 1
      // Skip a label in the very last column; there is no room to render it.
      if (i < weeks.length - 1) {
        labels.push({
          label: new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' }),
          index: i,
        })
      }
    }
  })
  return labels
}

function streak(activity: Activity): number {
  let count = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  // Today not being logged yet shouldn't break a run, so start from yesterday
  // if today is empty.
  if (!activity[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  while (activity[dayKey(cursor)] > 0) {
    count++
    cursor.setDate(cursor.getDate() - 1)
  }
  return count
}

export default function ActivityGrid({ activity }: { activity: Activity }) {
  const weeks = useMemo(buildWeeks, [])
  const labels = useMemo(() => monthLabels(weeks), [weeks])
  const today = todayKey()

  const total = useMemo(
    () => Object.values(activity).reduce((sum, n) => sum + (n > 0 ? n : 0), 0),
    [activity],
  )
  const current = useMemo(() => streak(activity), [activity])

  return (
    <section className="card">
      <div className="section-head">
        <h2>Progress</h2>
        <span className="grid-stats">
          {total} {total === 1 ? 'item' : 'items'} completed
          {current > 0 ? ` · ${current}-day streak` : ''}
        </span>
      </div>

      <div className="grid-scroll">
        <div className="grid-inner">
          <div className="grid-months">
            {labels.map((l) => (
              <span key={l.index} className="grid-month" style={{ left: l.index * 16 }}>
                {l.label}
              </span>
            ))}
          </div>

          <div className="grid-body">
            <div className="grid-days" aria-hidden="true">
              {DAY_LABELS.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="grid-weeks">
              {weeks.map((week) => (
                <div className="grid-week" key={week.key}>
                  {week.days.map((key, i) => {
                    if (!key) return <div className="cell empty" key={i} />
                    const count = activity[key] ?? 0
                    const classes = ['cell', level(count), key === today ? 'today' : '']
                      .filter(Boolean)
                      .join(' ')
                    return (
                      <div
                        key={key}
                        className={classes}
                        title={`${count} ${count === 1 ? 'item' : 'items'} on ${readableDay(key)}`}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-legend">
        <span>Less</span>
        <div className="cell" />
        <div className="cell l1" />
        <div className="cell l2" />
        <div className="cell l3" />
        <div className="cell l4" />
        <span>More</span>
      </div>
    </section>
  )
}
