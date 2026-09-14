import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgendaState, Goal } from './types'
import { emptyState } from './types'
import { dayKey, longDate, todayKey } from './dates'
import * as api from './api'
import ActivityGrid from './components/ActivityGrid'
import Goals from './components/Goals'
import AgendaList from './components/AgendaList'
import Notes from './components/Notes'
import EditGate from './components/EditGate'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DELAY = 700
const newId = () => Math.random().toString(36).slice(2, 10)

export default function App() {
  const [state, setState] = useState<AgendaState>(emptyState)
  const [backend, setBackend] = useState<api.Backend>('remote')
  const [loading, setLoading] = useState(true)
  const [unlocked, setUnlocked] = useState(false)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  // Skips the autosave that would otherwise fire from the initial load.
  const hydrated = useRef(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    api.load().then(({ state: loaded, backend: b }) => {
      if (cancelled) return
      setState(loaded)
      setBackend(b)
      setUnlocked(b === 'local' ? true : api.getEditKey() !== null)
      setLoading(false)
      // Let React commit the loaded state before autosave starts watching.
      requestAnimationFrame(() => {
        hydrated.current = true
      })
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Debounced autosave. Read-only visitors never reach this because nothing
  // in the UI can mutate state while locked.
  useEffect(() => {
    if (!hydrated.current || !unlocked) return
    window.clearTimeout(timer.current)
    setStatus('saving')
    timer.current = window.setTimeout(() => {
      api
        .save(state, backend)
        .then(() => {
          setStatus('saved')
          setError(null)
        })
        .catch((err: Error) => {
          setStatus('error')
          setError(err.message)
          if (err instanceof api.AuthError) setUnlocked(false)
        })
    }, SAVE_DELAY)
    return () => window.clearTimeout(timer.current)
  }, [state, backend, unlocked])

  const patch = useCallback((fn: (s: AgendaState) => AgendaState) => {
    setState((prev) => fn(prev))
  }, [])

  /* ---------- items ---------- */

  const addItem = (text: string) =>
    patch((s) => ({
      ...s,
      items: [
        ...s.items,
        { id: newId(), text, done: false, createdAt: new Date().toISOString(), completedAt: null },
      ],
    }))

  /**
   * Checking an item off credits today on the activity grid; unchecking it
   * removes the credit from whichever day it was originally completed.
   */
  const toggleItem = (id: string) =>
    patch((s) => {
      const activity = { ...s.activity }
      const items = s.items.map((item) => {
        if (item.id !== id) return item
        if (item.done) {
          const key = item.completedAt ? dayKey(new Date(item.completedAt)) : todayKey()
          activity[key] = Math.max(0, (activity[key] ?? 0) - 1)
          if (activity[key] === 0) delete activity[key]
          return { ...item, done: false, completedAt: null }
        }
        const key = todayKey()
        activity[key] = (activity[key] ?? 0) + 1
        return { ...item, done: true, completedAt: new Date().toISOString() }
      })
      return { ...s, items, activity }
    })

  const editItem = (id: string, text: string) =>
    patch((s) => ({
      ...s,
      items: s.items.map((i) => (i.id === id ? { ...i, text } : i)),
    }))

  /** Deleting a completed item leaves its activity credit intact — the work happened. */
  const removeItem = (id: string) =>
    patch((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }))

  /* ---------- goals ---------- */

  const changeGoal = (id: string, p: Partial<Goal>) =>
    patch((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...p } : g)),
    }))

  const addGoal = () =>
    patch((s) => ({
      ...s,
      goals: [...s.goals, { id: newId(), title: '', current: 0, target: 10, unit: '' }],
    }))

  const removeGoal = (id: string) =>
    patch((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }))

  const setNotes = (notes: string) => patch((s) => ({ ...s, notes }))

  /* ---------- lock ---------- */

  const handleUnlock = async (key: string) => {
    const ok = await api.unlock(key, backend)
    if (ok) {
      setUnlocked(true)
      setError(null)
      setStatus('idle')
    }
    return ok
  }

  const handleLock = () => {
    api.setEditKey(null)
    setUnlocked(false)
    setStatus('idle')
  }

  if (loading) {
    return (
      <main className="page">
        <p className="empty-note">Loading agenda...</p>
      </main>
    )
  }

  const statusLabel =
    status === 'saving'
      ? 'Saving...'
      : status === 'saved'
        ? 'All changes saved'
        : status === 'error'
          ? (error ?? 'Save failed')
          : unlocked
            ? 'Editing unlocked'
            : 'Read only'

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1>Agenda</h1>
          <div className="header-date">{longDate(new Date())}</div>
        </div>
        <div className="header-meta">
          <EditGate unlocked={unlocked} onUnlock={handleUnlock} onLock={handleLock} />
          <div className={`status${status === 'error' ? ' error' : ''}`}>
            <span
              className={`dot${status === 'error' ? ' error' : status === 'idle' ? ' idle' : ''}`}
            />
            {statusLabel}
          </div>
        </div>
      </header>

      {backend === 'local' && (
        <div className="banner">
          <strong>Local preview.</strong> The Cloudflare Function isn&apos;t reachable, so changes
          are saving to this browser only. Run <code>npm run dev:full</code> or deploy to Pages for
          shared storage.
        </div>
      )}

      <ActivityGrid activity={state.activity} />

      <Goals
        goals={state.goals}
        editable={unlocked}
        onChange={changeGoal}
        onAdd={addGoal}
        onRemove={removeGoal}
      />

      <AgendaList
        items={state.items}
        editable={unlocked}
        onAdd={addItem}
        onToggle={toggleItem}
        onEdit={editItem}
        onRemove={removeItem}
      />

      <Notes notes={state.notes} editable={unlocked} onChange={setNotes} />

      <p className="footer">
        Last updated {new Date(state.updatedAt).toLocaleString()}
      </p>
    </main>
  )
}
