/**
 * GET  /api/agenda  -> public, returns the stored agenda record
 * PUT  /api/agenda  -> requires the x-edit-key header to match the EDIT_KEY secret
 *
 * Bindings (set in the Cloudflare Pages project settings):
 *   AGENDA_KV  KV namespace binding
 *   EDIT_KEY   secret string — the password that unlocks editing
 */

type Env = {
  AGENDA_KV: KVNamespace
  EDIT_KEY?: string
}

const RECORD = 'agenda:v1'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const stored = await env.AGENDA_KV.get(RECORD, 'json')
  return json(stored ?? {})
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const expected = env.EDIT_KEY
  // No secret configured means there is nothing to authenticate against.
  // Refuse rather than leaving the record open to the world.
  if (!expected) {
    return json({ error: 'EDIT_KEY is not configured on this deployment.' }, 403)
  }
  if (request.headers.get('x-edit-key') !== expected) {
    return json({ error: 'Invalid edit key.' }, 401)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Body must be JSON.' }, 400)
  }
  if (!body || typeof body !== 'object') {
    return json({ error: 'Body must be a JSON object.' }, 400)
  }

  const record = { ...(body as Record<string, unknown>), updatedAt: new Date().toISOString() }
  await env.AGENDA_KV.put(RECORD, JSON.stringify(record))
  return json({ ok: true, updatedAt: record.updatedAt })
}
