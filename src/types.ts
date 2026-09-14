export type AgendaItem = {
  id: string
  text: string
  done: boolean
  createdAt: string
  completedAt: string | null
}

export type Goal = {
  id: string
  title: string
  current: number
  target: number
  unit: string
}

/** Activity is a map of local YYYY-MM-DD -> number of items completed that day. */
export type Activity = Record<string, number>

export type AgendaState = {
  items: AgendaItem[]
  goals: Goal[]
  notes: string
  activity: Activity
  updatedAt: string
}

export const emptyState = (): AgendaState => ({
  items: [],
  goals: [
    { id: 'g1', title: 'Goal one', current: 0, target: 10, unit: '' },
    { id: 'g2', title: 'Goal two', current: 0, target: 10, unit: '' },
    { id: 'g3', title: 'Goal three', current: 0, target: 10, unit: '' },
  ],
  notes: '',
  activity: {},
  updatedAt: new Date().toISOString(),
})

/** Fills in anything missing so an older or hand-edited record still loads. */
export function normalize(raw: unknown): AgendaState {
  const base = emptyState()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<AgendaState>
  return {
    items: Array.isArray(r.items) ? r.items.filter(isItem) : base.items,
    goals: Array.isArray(r.goals) && r.goals.length ? r.goals.filter(isGoal) : base.goals,
    notes: typeof r.notes === 'string' ? r.notes : '',
    activity: r.activity && typeof r.activity === 'object' ? r.activity : {},
    updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : base.updatedAt,
  }
}

function isItem(v: unknown): v is AgendaItem {
  return !!v && typeof v === 'object' && typeof (v as AgendaItem).id === 'string'
}

function isGoal(v: unknown): v is Goal {
  return !!v && typeof v === 'object' && typeof (v as Goal).id === 'string'
}
