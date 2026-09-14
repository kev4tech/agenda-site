type Props = {
  notes: string
  editable: boolean
  onChange: (notes: string) => void
}

export default function Notes({ notes, editable, onChange }: Props) {
  return (
    <section className="card">
      <div className="section-head">
        <h2>Notes</h2>
      </div>
      <textarea
        className="notes"
        value={notes}
        disabled={!editable}
        placeholder={editable ? 'Anything worth keeping around...' : 'No notes.'}
        aria-label="Notes"
        onChange={(e) => onChange(e.target.value)}
      />
    </section>
  )
}
