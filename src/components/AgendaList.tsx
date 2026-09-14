import { useState } from 'react'
import type { AgendaItem } from '../types'

type Props = {
  items: AgendaItem[]
  editable: boolean
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
}

function Check({ done }: { done: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2 6.2 4.8 9 10 3.4"
        fill="none"
        stroke={done ? '#fff' : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function AgendaList({ items, editable, onAdd, onToggle, onEdit, onRemove }: Props) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    onAdd(text)
    setDraft('')
  }

  const open = items.filter((i) => !i.done).length

  return (
    <section className="card">
      <div className="section-head">
        <h2>Working on</h2>
        <span className="grid-stats">
          {open} open · {items.length - open} done
        </span>
      </div>

      {items.length === 0 && (
        <p className="empty-note">
          {editable ? 'Nothing here yet. Add the first item below.' : 'Nothing on the agenda.'}
        </p>
      )}

      {items.map((item) => (
        <div className={`item${item.done ? ' done' : ''}`} key={item.id}>
          <button
            className="check"
            aria-pressed={item.done}
            aria-label={item.done ? `Mark ${item.text} not done` : `Mark ${item.text} done`}
            disabled={!editable}
            onClick={() => onToggle(item.id)}
          >
            <Check done={item.done} />
          </button>

          <input
            className="inline-edit item-text"
            value={item.text}
            disabled={!editable}
            aria-label="Item"
            onChange={(e) => onEdit(item.id, e.target.value)}
          />

          {editable && (
            <button
              className="btn ghost"
              onClick={() => onRemove(item.id)}
              aria-label={`Delete ${item.text}`}
            >
              Delete
            </button>
          )}
        </div>
      ))}

      {editable && (
        <div className="item-add">
          <input
            className="field"
            value={draft}
            placeholder="Add an item and press Enter"
            aria-label="New agenda item"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
          <button className="btn primary" onClick={submit} disabled={!draft.trim()}>
            Add
          </button>
        </div>
      )}
    </section>
  )
}
