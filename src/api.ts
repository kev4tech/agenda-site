import { type AgendaState, normalize, emptyState } from './types'

const ENDPOINT = '/api/agenda'
const LOCAL_KEY = 'agenda:v1'
const KEY_STORE = 'agenda:editKey'

/**
 * Where the current session is reading and writing.
 * 'remote' = Cloudflare KV via Pages Functions (the real thing).
 * 'local'  = browser localStorage, used when the Function isn't reachable
 *            (plain `npm run dev`, or offline). Keeps the UI usable either way.
 */
export type Backend = 'remote' | 'local'

export function getEditKey(): string | null {
  try {
    return sessionStorage.getItem(KEY_STORE)
  } catch {
    return null
  }
}

export function setEditKey(key: string | null) {
  try {
    if (key) sessionStorage.setItem(KEY_STORE, key)
    else sessionStorage.removeItem(KEY_STORE)
  } catch {
    /* private mode — the key just won't survive a reload */
  }
}

function readLocal(): AgendaState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? normalize(JSON.parse(raw)) : emptyState()
  } catch {
    return emptyState()
  }
}

function writeLocal(state: AgendaState) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state))
  } catch {
    /* quota or blocked storage — nothing useful to do here */
  }
}

export async function load(): Promise<{ state: AgendaState; backend: Backend }> {
  try {
    const res = await fetch(ENDPOINT, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return { state: normalize(json), backend: 'remote' }
  } catch {
    return { state: readLocal(), backend: 'local' }
  }
}

export class AuthError extends Error {}

export async function save(state: AgendaState, backend: Backend): Promise<void> {
  if (backend === 'local') {
    writeLocal(state)
    return
  }
  const key = getEditKey()
  const res = await fetch(ENDPOINT, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      ...(key ? { 'x-edit-key': key } : {}),
    },
    body: JSON.stringify(state),
  })
  if (res.status === 401 || res.status === 403) {
    setEditKey(null)
    throw new AuthError('That edit key was rejected.')
  }
  if (!res.ok) throw new Error(`Save failed (HTTP ${res.status})`)
}

/** Checks a key against the server without writing anything. */
export async function unlock(key: string, backend: Backend): Promise<boolean> {
  if (backend === 'local') {
    setEditKey(key)
    return true
  }
  const res = await fetch('/api/unlock', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key }),
  })
  if (!res.ok) return false
  setEditKey(key)
  return true
}
