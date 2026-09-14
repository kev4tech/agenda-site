import type { Goal } from '../types'

type Props = {
  goals: Goal[]
  editable: boolean
  onChange: (id: string, patch: Partial<Goal>) => void
  onAdd: () => void
  onRemove: (id: string) => void
}

function pct(goal: Goal): number {
  if (!goal.target || goal.target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((goal.current / goal.target) * 100)))
}

export default function Goals({ goals, editable, onChange, onAdd, onRemove }: Props) {
  return (
    <section className="card">
      <div className="section-head">
        <h2>Goals</h2>
        {editable && goals.length < 6 && (
          <button className="btn" onClick={onAdd}>
            Add goal
          </button>
        )}
      </div>

      {goals.map((goal) => {
        const percent = pct(goal)
        return (
          <div className="goal" key={goal.id}>
            <div className="goal-top">
              <input
                className="inline-edit goal-title"
                value={goal.title}
                disabled={!editable}
                placeholder="Name this goal"
                aria-label="Goal name"
                onChange={(e) => onChange(goal.id, { title: e.target.value })}
              />

              <div className="goal-numbers">
                <input
                  className="num"
                  type="number"
                  value={goal.current}
                  disabled={!editable}
                  aria-label={`${goal.title} progress`}
                  onChange={(e) => onChange(goal.id, { current: Number(e.target.value) || 0 })}
                />
                <span>/</span>
                <input
                  className="num"
                  type="number"
                  value={goal.target}
                  disabled={!editable}
                  aria-label={`${goal.title} target`}
                  onChange={(e) => onChange(goal.id, { target: Number(e.target.value) || 0 })}
                />
                <input
                  className="unit"
                  value={goal.unit}
                  disabled={!editable}
                  placeholder="unit"
                  aria-label={`${goal.title} unit`}
                  onChange={(e) => onChange(goal.id, { unit: e.target.value })}
                />
              </div>

              <span className="goal-pct">{percent}%</span>

              {editable && goals.length > 1 && (
                <button
                  className="btn ghost"
                  onClick={() => onRemove(goal.id)}
                  aria-label={`Remove ${goal.title}`}
                  title="Remove goal"
                >
                  Remove
                </button>
              )}
            </div>

            <div
              className="bar"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={goal.title}
            >
              <div className="bar-fill" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )
      })}
    </section>
  )
}
