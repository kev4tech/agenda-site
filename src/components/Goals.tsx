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
    <section className="section">
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
        // A zero target would give the range input an empty span to drag across.
        const max = Math.max(1, goal.target)

        return (
          <div className="goal" key={goal.id}>
            <div className="goal-top">
              <input
                className="inline-edit goal-title"
                value={goal.title}
                disabled={!editable}
                placeholder="What is the goal?"
                aria-label="Goal name"
                onChange={(e) => onChange(goal.id, { title: e.target.value })}
              />
              <span className="goal-pct">{percent}%</span>
              {editable && goals.length > 1 && (
                <button
                  className="btn ghost"
                  onClick={() => onRemove(goal.id)}
                  aria-label={`Remove goal: ${goal.title || 'untitled'}`}
                >
                  Remove
                </button>
              )}
            </div>

            <div className={`bar${editable ? ' editable' : ''}`}>
              <div className="bar-fill" style={{ width: `${percent}%` }} />
              <input
                className="bar-range"
                type="range"
                min={0}
                max={max}
                step={1}
                value={Math.min(goal.current, max)}
                disabled={!editable}
                aria-label={`${goal.title || 'Goal'} progress`}
                onChange={(e) => onChange(goal.id, { current: Number(e.target.value) })}
              />
              <span className="bar-focus" />
            </div>

            <div className="goal-foot">
              <input
                className="num"
                type="number"
                value={goal.current}
                disabled={!editable}
                aria-label="Progress so far"
                onChange={(e) => onChange(goal.id, { current: Number(e.target.value) || 0 })}
              />
              <span>of</span>
              <input
                className="num"
                type="number"
                value={goal.target}
                disabled={!editable}
                aria-label="Target"
                onChange={(e) => onChange(goal.id, { target: Number(e.target.value) || 0 })}
              />
              <input
                className="unit"
                value={goal.unit}
                disabled={!editable}
                placeholder="meetings, miles..."
                aria-label="Unit"
                onChange={(e) => onChange(goal.id, { unit: e.target.value })}
              />
            </div>
          </div>
        )
      })}
    </section>
  )
}
