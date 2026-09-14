import { useState } from 'react'

type Props = {
  unlocked: boolean
  onUnlock: (key: string) => Promise<boolean>
  onLock: () => void
}

export default function EditGate({ unlocked, onUnlock, onLock }: Props) {
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  if (unlocked) {
    return (
      <button className="btn" onClick={onLock}>
        Lock editing
      </button>
    )
  }

  if (!open) {
    return (
      <button className="btn" onClick={() => setOpen(true)}>
        Unlock to edit
      </button>
    )
  }

  const attempt = async () => {
    if (!key || busy) return
    setBusy(true)
    setFailed(false)
    const ok = await onUnlock(key)
    setBusy(false)
    if (ok) {
      setOpen(false)
      setKey('')
    } else {
      setFailed(true)
    }
  }

  return (
    <div className="lockbar">
      <input
        className="field"
        type="password"
        autoFocus
        value={key}
        placeholder={failed ? 'Wrong key, try again' : 'Edit key'}
        aria-label="Edit key"
        onChange={(e) => {
          setKey(e.target.value)
          setFailed(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void attempt()
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      <button className="btn primary" onClick={() => void attempt()} disabled={!key || busy}>
        {busy ? '...' : 'Unlock'}
      </button>
    </div>
  )
}
